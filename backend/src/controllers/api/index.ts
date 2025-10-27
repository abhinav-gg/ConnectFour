import { Router, Request, Response } from 'express';
import { getRedisClient } from '@/redis/redisClient';
import pool from '@/db/rds/rdsClient'; // Adjust the import based on your database setup
import { dynamoDBOps } from '@/db/dynamodb/ops';
import { rdsDBOps } from '@/db/rds/ops';
import { createRedisJson, scanKeysPaginated } from '@/redis/redisHelper';
import { JobRegistry } from '@/jobs';
import { JobKeys } from '@/jobs/jobKeys';
import { enterMaintenanceMode, exitMaintenanceMode } from '@/lib/maintenance';

const app = Router();

async function getRedisValue(key: string): Promise<string | null> {
  const redis = await getRedisClient();
  let resp;
  try {
    resp = await redis.get(key);
  } catch {
    try {
      const rJ = createRedisJson(redis);
      resp = await rJ.get(key);
    } catch (err) {
      return null; // or throw, depending on your design
    }
  } 
  if (!resp) {
      return null;
  }
  return resp;
}

app.get('/all', async (_req: Request, res: Response) => {
  try {
    const r = await getRedisClient();
    const { keys } = await scanKeysPaginated(r, '*');
    const result: Record<string, string | null> = {};

    for (const key of keys) {
      result[key] = await getRedisValue(key);
    }

    console.log('✅ Scan complete, sending response');
    res.json({ keys: Object.entries(result).map(([key, value]) => ({ key, value })) });
  } catch (error) {
    console.error('❌ Redis scan error:', error);
    res.status(500).json({ 
      error: 'Redis scan failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

  
app.get('/get/:key', async (req: Request, res: Response): Promise<void> => {
  const { key } = req.params;
  if (typeof key !== 'string') {
      res.status(400).json({ error: 'Key must be a string' });
      return;
  }

  const value = await getRedisValue(key);
  if (value) {
      res.json({ key, value });
  } else {
      res.status(404).json({ error: 'Key not found' });
  }
});

app.get('/clearredis', async (req: Request, res: Response): Promise<void> => {
  
  const redis = await getRedisClient();
  let message = {game: '', user: '', bull: ''};
  try {
    const { keys } = await scanKeysPaginated(redis, 'game:*'); // Adjust the pattern as needed
    if (keys.length > 0) {
      await redis.del(...keys);
      message.game = 'Redis cache cleared successfully';
    } else {
      message.game = 'No keys found to clear';
    }
  } catch (error) {
    console.error('Error clearing Redis cache:', error);
    res.status(500).json({ error: 'Failed to clear Redis cache' });
  }
  try {
    const { keys } = await scanKeysPaginated(redis, 'user:*'); // Adjust the pattern as needed
    if (keys.length > 0) {
      await redis.del(...keys);
      message.user = 'Redis cache cleared successfully';
    } else {
      message.user = 'No keys found to clear';
    }
  } catch (error) {
    console.error('Error clearing Redis cache:', error);
    res.status(500).json({ error: 'Failed to clear Redis cache' });
  }
  try {
    const { keys } = await scanKeysPaginated(redis, 'bull:*'); // Adjust the pattern as needed
    if (keys.length > 0) {
      await redis.del(...keys);
      message.bull = 'Redis cache cleared successfully';
    } else {
      message.bull = 'No keys found to clear';
    }
  } catch (error) {
    console.error('Error clearing Redis cache:', error);
    res.status(500).json({ error: 'Failed to clear Redis cache' });
  }

  res.json(message);  
});

app.get('/dynamo-test', async (req: Request, res: Response) => {
try {
    const gameData = await dynamoDBOps.game.readAllGames();
    console.log(gameData);
    res.json({ message: 'Dynamo Connected successfully' });
}
catch (error) {
    console.error('DynamoDB connection error:', error);
    res.status(500).json({ error: 'DynamoDB connection failed' });
}
});

app.get('/test/email', async (req: Request, res: Response) => {
try {
    console.log("attempt to send")
    await JobRegistry.getEmailQueue().add(
      JobKeys.email.stringId("123543", Date.now().toString()),
      { subject: "hi", to: "agupta.cam7@gmail.com", html: "<h1>Test Email</h1>" }
    );
    res.json({ message: 'Email sent successfully' });
}
catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
}
}
);

app.get('/database-test', async (req: Request, res: Response) => {
  try {
      const result = await pool.query('SELECT * FROM users;');
      res.json({ message: 'Database connection is working', user: JSON.stringify(result.rows[0]) });
  }
  catch (error) {
      console.error('Database connection error:', error);
      res.status(500).json({ error: 'Database connection failed' });
  }
});

app.get('/suicide', async (req: Request, res: Response) => {
  try {
    const uuid = await rdsDBOps.user.getIDByEmail("agupta.cam7@gmail.com");
    if (uuid) {
      await rdsDBOps.user.dropUserByID(uuid);
      res.status(200).json({ error: 'Dropped user' });
      return;
    }
    res.status(200).json({ error: 'User doesn\'t exist' });
  }
  catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
}
);


app.get('/maintenance/on', async (req: Request, res: Response) => {
  try {
    // Enable maintenance mode
    await enterMaintenanceMode();
    res.json({ message: 'Maintenance mode enabled' });
  } catch (error) {
    console.error('Error enabling maintenance mode:', error);
    res.status(500).json({ error: 'Failed to enable maintenance mode' });
  }
});

app.get('/maintenance/off', async (req: Request, res: Response) => {
  try {
    // Disable maintenance mode
    await exitMaintenanceMode();
    res.json({ message: 'Maintenance mode disabled' });
  } catch (error) {
    console.error('Error disabling maintenance mode:', error);
    res.status(500).json({ error: 'Failed to disable maintenance mode' });
  }
});

export { app as devTestRoutes };

