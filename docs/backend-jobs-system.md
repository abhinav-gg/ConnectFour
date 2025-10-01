# Backend Jobs & Background Processing Documentation

## Overview

The jobs system handles asynchronous background processing for the ConnectFour application using BullMQ. It manages email sending, game timeouts, data validation, and other time-sensitive operations that shouldn't block the main application flow.

## Architecture

```
jobs/
├── index.ts              # Job system initialization and management
├── jobKeys.ts            # Job type definitions and constants
├── sets/                 # Job set implementations
│   ├── email.ts          # Email processing jobs
│   ├── game.disconnection.ts # Player disconnection handling
│   ├── game.timeout.ts   # Game timeout management
│   └── validatePfps.ts   # Profile picture validation
└── utils/
    ├── createJobSet.ts   # Job set creation utilities
    └── createQueue.ts    # Queue creation and configuration
```

## Job System Setup (`index.ts`)

### Purpose
Initializes and manages all job queues, workers, and processing systems.

### Queue Management
```typescript
// Global queue registry using singleton pattern
const QueueStore = globalThis[GLOBAL_QUEUE_STORE] || new Map<string, Queue>();

export function getEmailQueue(): Queue {
  return getOrCreateQueue('email', {
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
  });
}

export function getGameTimeoutQueue(): Queue {
  return getOrCreateQueue('game-timeout', {
    defaultJobOptions: {
      removeOnComplete: 20,
      removeOnFail: 10,
      attempts: 2,
    },
  });
}
```

### Job Set Initialization
```typescript
export async function setupAllJobs(): Promise<void> {
  await Promise.all([
    setupEmailJobSet(),
    setupGameTimeoutJobSet(),
    setupGameDisconnectionJobSet(),
    setupPfpValidationJobSet(),
  ]);
}
```

### Environment-Specific Setup
- **API Jobs**: Jobs that run alongside the API server
- **Socket Jobs**: Jobs that run alongside the Socket server
- **Standalone Jobs**: Jobs that can run independently

## Job Types (`jobKeys.ts`)

### Email Jobs
```typescript
export const EmailJobKeys = {
  SEND_VERIFICATION_EMAIL: 'send-verification-email',
  SEND_PASSWORD_RESET_EMAIL: 'send-password-reset-email',
  SEND_WELCOME_EMAIL: 'send-welcome-email',
  SEND_GAME_NOTIFICATION: 'send-game-notification',
  SEND_TOURNAMENT_UPDATE: 'send-tournament-update',
} as const;
```

### Game Management Jobs
```typescript
export const GameJobKeys = {
  GAME_TIMEOUT: 'game-timeout',
  PLAYER_DISCONNECTION_TIMEOUT: 'player-disconnection-timeout',
  GAME_CLEANUP: 'game-cleanup',
  UPDATE_PLAYER_RATING: 'update-player-rating',
  ARCHIVE_GAME: 'archive-game',
} as const;
```

### Validation Jobs
```typescript
export const ValidationJobKeys = {
  VALIDATE_PROFILE_PICTURE: 'validate-profile-picture',
  MODERATE_CHAT_MESSAGE: 'moderate-chat-message',
  VALIDATE_USERNAME: 'validate-username',
} as const;
```

## Email Processing (`sets/email.ts`)

### Purpose
Handles all email communications including verification, notifications, and marketing emails.

### Job Processors

#### Verification Email
```typescript
emailWorker.process(EmailJobKeys.SEND_VERIFICATION_EMAIL, async (job) => {
  const { userId, email, verificationCode } = job.data;
  
  try {
    const emailTemplate = await loadEmailTemplate('verification');
    const personalizedContent = emailTemplate
      .replace('{{verificationCode}}', verificationCode)
      .replace('{{verificationUrl}}', `${process.env.FRONTEND_URL}/auth/verify?code=${verificationCode}`);
    
    await sendEmail({
      to: email,
      subject: 'Verify your ConnectFour account',
      html: personalizedContent,
      from: process.env.EMAIL_FROM_ADDRESS,
    });
    
    // Log successful email send
    console.log(`Verification email sent to ${email}`);
    
  } catch (error) {
    console.error(`Failed to send verification email to ${email}:`, error);
    throw error; // Will trigger retry
  }
});
```

#### Password Reset Email
```typescript
emailWorker.process(EmailJobKeys.SEND_PASSWORD_RESET_EMAIL, async (job) => {
  const { email, resetToken, username } = job.data;
  
  const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
  const emailTemplate = await loadEmailTemplate('password-reset');
  
  const personalizedContent = emailTemplate
    .replace('{{username}}', username)
    .replace('{{resetUrl}}', resetUrl)
    .replace('{{expirationTime}}', '1 hour');
  
  await sendEmail({
    to: email,
    subject: 'Reset your ConnectFour password',
    html: personalizedContent,
  });
});
```

#### Game Notification Email
```typescript
emailWorker.process(EmailJobKeys.SEND_GAME_NOTIFICATION, async (job) => {
  const { userId, notificationType, gameData } = job.data;
  
  const user = await userService.getUserById(userId);
  if (!user.emailNotifications) return; // User opted out
  
  const template = await loadEmailTemplate(`game-${notificationType}`);
  const content = personalizeTemplate(template, { user, gameData });
  
  await sendEmail({
    to: user.email,
    subject: getNotificationSubject(notificationType),
    html: content,
  });
});
```

### Email Configuration
- **SMTP Provider**: Configurable email service (SendGrid, SES, etc.)
- **Template System**: HTML email templates with variable substitution
- **Delivery Tracking**: Track email delivery and open rates
- **Opt-out Handling**: Respect user email preferences

### Error Handling
- **Retry Logic**: Exponential backoff for failed sends
- **Dead Letter Queue**: Handle permanently failed emails
- **Rate Limiting**: Respect email provider limits
- **Bounce Handling**: Process bounced email notifications

## Game Timeout Management (`sets/game.timeout.ts`)

### Purpose
Manages game timeouts, player clock enforcement, and automatic game endings.

### Timeout Types
```typescript
interface GameTimeoutData {
  shortcode: string;
  playerId: string;
  timeoutType: 'move_timeout' | 'connection_timeout' | 'total_game_timeout';
  scheduledTime: Date;
  warningsSent: number;
}
```

### Job Processors

#### Move Timeout
```typescript
timeoutWorker.process(GameJobKeys.GAME_TIMEOUT, async (job) => {
  const { shortcode, playerId, timeoutType } = job.data;
  
  // Get current game state
  const gameData = await redisOps.getLiveGame(shortcode);
  if (!gameData) {
    console.log(`Game ${shortcode} not found, timeout job cancelled`);
    return;
  }
  
  // Check if it's still the player's turn
  const game = TimedStandardGame.fromCompactString(gameData.game_data);
  const currentPlayer = game.getCurrentPlayer();
  
  if (currentPlayer !== getPlayerIndex(playerId, gameData.players)) {
    console.log(`Player ${playerId} no longer on turn, timeout cancelled`);
    return;
  }
  
  // Apply timeout penalty
  await liveGameService.handleTimeout(shortcode, playerId, timeoutType);
  
  // Notify players
  const io = getSocketIO();
  io.to(shortcode).emit('game_timeout', {
    playerId,
    timeoutType,
    gameEnded: game.isGameOver(),
  });
});
```

#### Connection Timeout Warning
```typescript
timeoutWorker.process('connection-warning', async (job) => {
  const { shortcode, playerId, warningNumber } = job.data;
  
  const io = getSocketIO();
  io.to(shortcode).emit('connection_warning', {
    playerId,
    warningNumber,
    timeRemaining: 30 - (warningNumber * 10), // 30, 20, 10 seconds
  });
  
  // Schedule next warning or timeout
  if (warningNumber < 3) {
    await getGameTimeoutQueue().add('connection-warning', {
      shortcode,
      playerId,
      warningNumber: warningNumber + 1,
    }, { delay: 10000 }); // 10 second intervals
  } else {
    await getGameTimeoutQueue().add(GameJobKeys.GAME_TIMEOUT, {
      shortcode,
      playerId,
      timeoutType: 'connection_timeout',
    });
  }
});
```

### Timeout Scheduling
- **Move Timeouts**: Based on time control settings
- **Connection Timeouts**: Handle player disconnections
- **Game Timeouts**: Maximum game duration limits
- **Warning System**: Progressive warnings before timeout

## Player Disconnection Handling (`sets/game.disconnection.ts`)

### Purpose
Manages player disconnections, reconnection windows, and automatic resignations.

### Disconnection Flow
```typescript
disconnectionWorker.process(GameJobKeys.PLAYER_DISCONNECTION_TIMEOUT, async (job) => {
  const { shortcode, playerId, disconnectionTime } = job.data;
  
  // Check if player reconnected
  const gameData = await redisOps.getLiveGame(shortcode);
  if (!gameData) return;
  
  const playerSocket = getPlayerSocket(playerId);
  if (playerSocket && playerSocket.connected) {
    console.log(`Player ${playerId} reconnected, cancelling disconnection timeout`);
    return;
  }
  
  // Check disconnection duration
  const disconnectDuration = Date.now() - disconnectionTime;
  const maxDisconnectTime = 5 * 60 * 1000; // 5 minutes
  
  if (disconnectDuration >= maxDisconnectTime) {
    // Force resignation due to prolonged disconnection
    await liveGameService.handleDisconnectionResignation(shortcode, playerId);
    
    const io = getSocketIO();
    io.to(shortcode).emit('player_disconnection_timeout', {
      playerId,
      resigned: true,
    });
  } else {
    // Schedule another check
    const remainingTime = maxDisconnectTime - disconnectDuration;
    await getGameDisconnectionQueue().add(GameJobKeys.PLAYER_DISCONNECTION_TIMEOUT, {
      shortcode,
      playerId,
      disconnectionTime,
    }, { delay: Math.min(remainingTime, 60000) }); // Check at least every minute
  }
});
```

### Reconnection Handling
- **Grace Period**: Allow time for reconnection
- **State Synchronization**: Restore game state on reconnection
- **Notification System**: Inform opponent of disconnection status
- **Automatic Resignation**: Handle permanent disconnections

## Profile Picture Validation (`sets/validatePfps.ts`)

### Purpose
Validates uploaded profile pictures for content, size, and format compliance.

### Validation Process
```typescript
pfpWorker.process(ValidationJobKeys.VALIDATE_PROFILE_PICTURE, async (job) => {
  const { userId, imageUrl, uploadId } = job.data;
  
  try {
    // Download image for validation
    const imageBuffer = await downloadImage(imageUrl);
    
    // Validate image properties
    const validation = await validateImage(imageBuffer, {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedFormats: ['jpeg', 'png', 'webp'],
      maxDimensions: { width: 1024, height: 1024 },
      minDimensions: { width: 64, height: 64 },
    });
    
    if (!validation.isValid) {
      await userService.rejectProfilePicture(userId, uploadId, validation.errors);
      return;
    }
    
    // Content moderation
    const moderationResult = await moderateImage(imageBuffer);
    if (!moderationResult.approved) {
      await userService.rejectProfilePicture(userId, uploadId, ['inappropriate_content']);
      return;
    }
    
    // Process and optimize image
    const optimizedImage = await optimizeImage(imageBuffer, {
      quality: 85,
      format: 'webp',
      sizes: [64, 128, 256, 512], // Multiple sizes for different use cases
    });
    
    // Upload to storage and update user
    const finalUrl = await uploadOptimizedImage(optimizedImage, userId);
    await userService.approveProfilePicture(userId, uploadId, finalUrl);
    
    console.log(`Profile picture validated and approved for user ${userId}`);
    
  } catch (error) {
    console.error(`Failed to validate profile picture for user ${userId}:`, error);
    await userService.rejectProfilePicture(userId, uploadId, ['processing_error']);
    throw error;
  }
});
```

### Content Moderation
- **Image Analysis**: Detect inappropriate content
- **Size Validation**: Enforce file size limits
- **Format Checking**: Validate image formats
- **Dimension Validation**: Ensure appropriate image dimensions

## Job Utilities (`utils/`)

### Queue Creation (`createQueue.ts`)
```typescript
export function createQueue(name: string, options: QueueOptions = {}): Queue {
  const defaultOptions: QueueOptions = {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    },
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 5,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  };
  
  return new Queue(name, {
    ...defaultOptions,
    ...options,
  });
}
```

### Job Set Creation (`createJobSet.ts`)
```typescript
export function createJobSet(
  queueName: string,
  processors: Record<string, JobProcessor>,
  options: WorkerOptions = {}
): { queue: Queue; worker: Worker } {
  
  const queue = createQueue(queueName);
  const worker = new Worker(queueName, async (job) => {
    const processor = processors[job.name];
    if (!processor) {
      throw new Error(`No processor found for job type: ${job.name}`);
    }
    return await processor(job);
  }, {
    connection: queue.opts.connection,
    concurrency: options.concurrency || 1,
    ...options,
  });
  
  // Error handling
  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });
  
  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully`);
  });
  
  return { queue, worker };
}
```

## Monitoring and Management

### Job Statistics
- **Queue Metrics**: Queue size, processing rate, failure rate
- **Worker Health**: Worker status and performance
- **Job Latency**: Time from queue to completion
- **Error Tracking**: Failed job analysis and alerting

### Administrative Tools
- **Queue Dashboard**: Web interface for queue management
- **Job Retry**: Manual job retry capabilities
- **Queue Cleanup**: Remove old completed/failed jobs
- **Worker Scaling**: Dynamic worker scaling based on load

### Performance Optimization
- **Concurrency Tuning**: Optimal worker concurrency settings
- **Memory Management**: Efficient job data handling
- **Connection Pooling**: Redis connection optimization
- **Batch Processing**: Group related jobs for efficiency

---

*This documentation covers the background job processing system. For real-time operations, see the Services and Controllers documentation.*