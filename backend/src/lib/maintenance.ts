import { Server as SocketIOServer } from 'socket.io';
import { getPubSubRedisClient, getRedisClient } from '@/redis/redisClient';

type MaintenanceStatus = 'ONLINE' | 'MAINTENANCE';

type MaintenanceCommand = {
  type: 'setMaintenance' | 'setOnline';
  payload?: {
    message?: string;
  };
};

let currentStatus: MaintenanceStatus = 'ONLINE';
let socketInstance: SocketIOServer | null = null;


// --- Public API ---

export function getMaintenanceStatus(): MaintenanceStatus {
  return currentStatus;
}

export function isRestricted(): boolean {
  return currentStatus === 'MAINTENANCE';
}

export function isMaintenance(): boolean {
  return currentStatus === 'MAINTENANCE';
}

export function isOnline(): boolean {
  return currentStatus === 'ONLINE';
}

export function enterMaintenanceMode(message?: string): void {
  currentStatus = 'MAINTENANCE';
  console.log('🛠️ System entered maintenance mode:', message || 'No message provided');
  
  // Notify socket clients if socket service is configured
  if (socketInstance) {
    socketInstance.emit('system:maintenance', {
      status: 'MAINTENANCE',
      message: message || 'System is currently under maintenance. Please try again later.'
    });
  }
}

export function exitMaintenanceMode(): void {
  currentStatus = 'ONLINE';
  console.log('✅ System is now online');
  
  // Notify socket clients if socket service is configured
  if (socketInstance) {
    socketInstance.emit('system:online', {
      status: 'ONLINE',
      message: 'System is back online'
    });
  }
}

/**
 * Initializes Redis Pub/Sub listener for maintenance commands (API service).
 * This is for services that only need to respond to maintenance status changes.
 */
export async function initMaintenanceAPI(): Promise<void> {
    // Load current status from Redis on startup
    await loadMaintenanceStatus();

    // Redis clients
    const sub = await getPubSubRedisClient(); // Subscriber

    sub.subscribe('admin:commands', (err, count) => {
        if (err) {
            console.error('❌ Failed to subscribe to Redis channel:', err);
        } else {
            console.log(`✅ API Service subscribed to ${count} Redis channel(s) for admin commands.`);
        }
    });

    sub.on('message', (channel: string, message: string) => {
        if (channel !== 'admin:commands') return;

        try {
            const command: MaintenanceCommand = JSON.parse(message);

            switch (command.type) {
                case 'setMaintenance':
                    enterMaintenanceMode(command.payload?.message);
                    persistMaintenanceStatus();
                    break;
                
                case 'setOnline':
                    exitMaintenanceMode();
                    persistMaintenanceStatus();
                    break;
                
                default:
                    console.warn('❓ Unknown maintenance command type:', command.type);
            }
        } catch (err) {
            console.error('❌ Invalid admin command format:', err);
        }
    });
}

/**
 * Initializes Redis Pub/Sub listener with Socket.IO integration (Socket service).
 * This is for services that need to manage socket connections.
 */
export async function initMaintenanceSocket(ioInstance: SocketIOServer): Promise<void> {
    socketInstance = ioInstance;

    // Load current status from Redis on startup
    await loadMaintenanceStatus();

    // Redis clients
    const sub = await getPubSubRedisClient(); // Subscriber

    sub.subscribe('admin:commands', (err, count) => {
        if (err) {
            console.error('❌ Failed to subscribe to Redis channel:', err);
        } else {
            console.log(`✅ Socket Service subscribed to ${count} Redis channel(s) for admin commands.`);
        }
    });

    sub.on('message', (channel: string, message: string) => {
        if (channel !== 'admin:commands') return;

        try {
            const command: MaintenanceCommand = JSON.parse(message);

            switch (command.type) {
                case 'setMaintenance':
                    enterMaintenanceMode(command.payload?.message);
                    persistMaintenanceStatus();
                    break;
                
                case 'setOnline':
                    exitMaintenanceMode();
                    persistMaintenanceStatus();
                    break;
                
                default:
                    console.warn('❓ Unknown maintenance command type:', command.type);
            }
        } catch (err) {
            console.error('❌ Invalid admin command format:', err);
        }
    });
}

// --- Internal Logic ---

async function loadMaintenanceStatus(): Promise<void> {
  try {
    const redis = await getRedisClient();
    const status = await redis.get('system:maintenance:status');
    if (status === 'MAINTENANCE' || status === 'ONLINE') {
      currentStatus = status as MaintenanceStatus;
      console.log(`🔄 Loaded maintenance status from Redis: ${currentStatus}`);
    }
  } catch (err) {
    console.error('❌ Failed to load maintenance status from Redis:', err);
  }
}

async function persistMaintenanceStatus(): Promise<void> {
  try {
    const redis = await getRedisClient();
    await redis.set('system:maintenance:status', currentStatus);
    console.log(`💾 Persisted maintenance status to Redis: ${currentStatus}`);
  } catch (err) {
    console.error('❌ Failed to persist maintenance status to Redis:', err);
  }
}

// --- Helper Functions for Publishing Commands ---

/**
 * Publishes a maintenance command to Redis for other instances to receive
 */
export async function publishMaintenanceCommand(command: MaintenanceCommand): Promise<void> {
  try {
    const redis = await getRedisClient();
    await redis.publish('admin:commands', JSON.stringify(command));
    console.log(`📡 Published maintenance command: ${command.type}`);
  } catch (err) {
    console.error('❌ Failed to publish maintenance command:', err);
  }
}

/**
 * Trigger maintenance mode across all instances
 */
export async function triggerMaintenanceMode(message?: string): Promise<void> {
  await publishMaintenanceCommand({
    type: 'setMaintenance',
    payload: { message }
  });
}

/**
 * Trigger online mode across all instances
 */
export async function triggerOnlineMode(): Promise<void> {
  await publishMaintenanceCommand({
    type: 'setOnline'
  });
}


/* ===============================================================================
 * USAGE EXAMPLES
 * ===============================================================================
 */

/*
// --- 1A. INITIALIZATION FOR API SERVICE (No Socket.IO) ---

import { initMaintenanceAPI } from '@/lib/maintenance';

// API service initialization - just updates status variable for middleware detection
await initMaintenanceAPI();

// --- 1B. INITIALIZATION FOR SOCKET SERVICE ---

import { initMaintenanceSocket } from '@/lib/maintenance';
import { Server as SocketIOServer } from 'socket.io';

// Socket service initialization - sends maintenance messages to all clients
const io = new SocketIOServer(server);
await initMaintenanceSocket(io);

// --- 2. API MIDDLEWARE EXAMPLE ---

import { Request, Response, NextFunction } from 'express';
import { isMaintenance, getMaintenanceStatus } from '@/lib/maintenance';

export function maintenanceMiddleware(req: Request, res: Response, next: NextFunction) {
  if (isMaintenance()) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'System is currently under maintenance. Please try again later.',
      status: getMaintenanceStatus(),
      retryAfter: 300 // seconds
    });
  }
  next();
}

// Use in your API routes:
// app.use('/api', maintenanceMiddleware);
// app.get('/api/games', maintenanceMiddleware, gameController.getGames);

// --- 3. SOCKET MIDDLEWARE EXAMPLE ---

import { Socket } from 'socket.io';
import { isMaintenance } from '@/lib/maintenance';

export function socketMaintenanceMiddleware(socket: Socket, next: Function) {
  if (isMaintenance()) {
    const error = new Error('System is under maintenance');
    error.data = { 
      code: 'MAINTENANCE_MODE',
      message: 'System is currently under maintenance. Please try again later.'
    };
    return next(error);
  }
  next();
}

// Use in socket.io:
// io.use(socketMaintenanceMiddleware);

// --- 4. TRIGGERING MAINTENANCE FROM ADMIN ENDPOINTS ---

import { triggerMaintenanceMode, triggerOnlineMode } from '@/lib/maintenance';

// Admin endpoint to enable maintenance
app.post('/admin/maintenance/enable', async (req, res) => {
  const { message } = req.body;
  await triggerMaintenanceMode(message || 'System maintenance in progress');
  res.json({ success: true, message: 'Maintenance mode enabled' });
});

// Admin endpoint to disable maintenance
app.post('/admin/maintenance/disable', async (req, res) => {
  await triggerOnlineMode();
  res.json({ success: true, message: 'System is now online' });
});

// --- 5. DIRECT REDIS COMMANDS (for external tools) ---

// To enable maintenance mode:
// redis-cli PUBLISH admin:commands '{"type":"setMaintenance","payload":{"message":"Emergency maintenance"}}'

// To disable maintenance mode:
// redis-cli PUBLISH admin:commands '{"type":"setOnline"}'

// --- 6. STATUS CHECKING ---

import { getMaintenanceStatus, isOnline, isMaintenance } from '@/lib/maintenance';

// Check current status
console.log('Current status:', getMaintenanceStatus()); // 'ONLINE' or 'MAINTENANCE'
console.log('Is online:', isOnline()); // boolean
console.log('Is maintenance:', isMaintenance()); // boolean

// Health check endpoint
app.get('/health', (req, res) => {
  const status = getMaintenanceStatus();
  res.json({
    status: status,
    online: status === 'ONLINE',
    timestamp: new Date().toISOString()
  });
});

// --- 7. FRONTEND INTEGRATION ---

// Listen for maintenance events on the frontend (only if using socket service):
socket.on('system:maintenance', (data) => {
  console.log('Maintenance mode activated:', data.message);
  // Show maintenance banner or redirect to maintenance page
});

socket.on('system:online', (data) => {
  console.log('System is back online:', data.message);
  // Hide maintenance banner and refresh if needed
});

// --- 8. HOW IT WORKS ---

// API Service:
// - Subscribes to Redis pub/sub for maintenance commands
// - Updates the currentStatus variable when commands are received
// - Middleware functions check this variable to block requests during maintenance
// - No socket notifications or complex shutdown logic

// Socket Service:
// - Subscribes to Redis pub/sub for maintenance commands  
// - Updates the currentStatus variable when commands are received
// - Sends real-time notifications to all connected socket clients
// - Clients receive 'system:maintenance' and 'system:online' events

*/
