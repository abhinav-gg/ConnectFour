import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { Request, Response } from 'express';
import { createServer } from 'http';
import { getRedisClient } from '@/redis/redis';
import pool from '@/db/pool'; // Adjust the import based on your database setup

dotenv.config();

const port = process.env.PORT || 3001;
const app = express();
const server = createServer(app);

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

app.get('/', (req, res) => {
  res.send(`Backend is certainly running on port ${port}!`);
});

app.head('/health', (req, res) => {
  res.status(200).end();
});

app.get('/all', async (_req: Request, res: Response) => {

  console.log('Fetching all keys from Redis...');

  const redis = await getRedisClient();
  const keys = await redis.keys('*');

  const result: Record<string, string | null> = {};
  for (const key of keys) {
    const value = await redis.get(key);
    result[key] = value;
  }

  res.json(result);
});

// POST /add — body: { key: string, value: string }
app.post('/add', async (req: Request, res: Response): Promise<void> => {
  const { key, value } = req.body;

  if (typeof key !== 'string' || typeof value !== 'string') {
    res.status(400).json({ error: 'Key and value must be strings' });
    return;
  }

  const redis = await getRedisClient();
  await redis.set(key, value);

  res.json({ success: true, key, value });
});

app.get('/get/:key', async (req: Request, res: Response): Promise<void> => {
  const { key } = req.params;
  if (typeof key !== 'string') {
    res.status(400).json({ error: 'Key must be a string' });
    return;
  }
  const redis = await getRedisClient();
  const value = await redis.get(key);
  if (value === null) {
    res.status(404).json({ error: `Key "${key}" not found` });
  }
  else {
    res.json({ key, value });
  }
}
);

app.get('/database-test', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: 'Database connection is working', time: result.rows[0].now });
  }
  catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
}
);

app.get('/health', (req, res) => {
  res.status(200).json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      mode: process.env.NODE_ENV
    }
  );
});


server.listen(Number(port), '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received: closing DB pool...');
  await pool.end();
  process.exit(0);
});