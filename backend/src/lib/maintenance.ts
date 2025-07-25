import { Server as SocketIOServer } from 'socket.io';
import Redis from 'ioredis';
import { getPubSubRedisClient } from '@/redis/redisClient';

type MaintenanceCommand = {
  type: 'prepareShutdown';
  payload?: {
    delay?: number; // seconds
  };
};

let restricted = false;
let io: SocketIOServer | null = null;


// --- Public API ---

export function isRestricted(): boolean {
  return restricted;
}

export function enterRestrictedMode(): void {
  restricted = true;
}

export function exitRestrictedMode(): void {
  restricted = false;
}

/**
 * Initializes Redis Pub/Sub listener for admin maintenance commands.
 * Call this once from your main app with the socket.io instance.
 */
export async function initMaintenanceChannel(ioInstance: SocketIOServer) {
    io = ioInstance;

    // Redis clients
    const sub = await getPubSubRedisClient(); // Subscriber

    sub.subscribe('admin:commands', (err, count) => {
        if (err) {
            console.error('❌ Failed to subscribe to Redis channel:', err);
        } else {
            console.log(`✅ Subscribed to ${count} Redis channel(s) for admin commands.`);
        }
    });

    sub.on('message', (channel: string, message: string) => {
        if (channel !== 'admin:commands') return;

        try {
            const command: MaintenanceCommand = JSON.parse(message);

        if (command.type === 'prepareShutdown') {
            const delay = command.payload?.delay ?? 600;
            triggerMaintenanceSequence(delay);
        }
        } catch (err) {
            console.error('❌ Invalid admin command format:', err);
        }
    });
}

// --- Internal Logic ---

function triggerMaintenanceSequence(delaySeconds: number): void {
  if (!io) {
    console.error('❌ Socket.IO instance not initialized for maintenance.');
    return;
  }

  console.log(`🛠️ Scheduled maintenance in ${delaySeconds} seconds`);

  io.emit('system:maintenance', {
    message: `System entering maintenance mode in ${delaySeconds / 60} minutes.`,
    startsIn: delaySeconds
  });

  setTimeout(() => {
    enterRestrictedMode();

    io?.emit('system:disconnecting', {
      message: 'Server is restarting now. Please reconnect shortly.'
    });

    setTimeout(() => {
      io?.close(() => {
        console.log('✅ Socket.IO server closed. Exiting process.');
        process.exit(0);
      });
    }, 3000);
  }, delaySeconds * 1000);
}
