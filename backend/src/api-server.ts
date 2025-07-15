import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { Request, Response } from 'express';
import { createServer } from 'http';
import { getRedisClient, closeRedisClient } from '@/redis/redisClient';
import pool from '@/db/rds/rdsClient'; // Adjust the import based on your database setup
import { loadTemplate, sendEmail } from '@/lib/email/emails'; // Adjust the import based on your email template loading logic
import { dynamoDBOps } from './db/dynamodb/ops';
import authRouter from './controllers/api/routes/authRoutes';


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

// Set up sub routes
app.use('/auth', authRouter);







/////////////////////// MAIN ///////////////////////

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

// app.get('/ping-astrochamp', async (req: Request, res: Response) => {
//   try {
//     console.log("attempt to send")
//     let emailtmplt = loadTemplate('verify-email.html');
//     if (!emailtmplt) {
//       res.status(500).json({ error: 'Email template not found' });
//       return;
//     }
//     await sendEmail("ivanoconnor@hotmail.co.uk", "Hello There", emailtmplt!);
//     res.json({ message: 'Email sent successfully' });
//   }
//   catch (error) {
//     console.error('Error sending email:', error);
//     res.status(500).json({ error: 'Failed to send email' });
//   }
// }
// );

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

// (async () => {
//   try {
//     const res = await pool.query(`
//       SELECT schema_name 
//       FROM information_schema.schemata 
//       WHERE schema_name = 'con4_schema'
//     `);
//     if (res.rowCount === 0) {
//       throw new Error("Required schema 'con4_schema' does not exist in the database.");
//     }
//     console.log("Schema 'con4_schema' verified successfully.");
//   } catch (error) {
//     console.error('Database schema verification failed:', error);
//     process.exit(1); // Exit process if schema doesn't exist
//   }
// })();

server.listen(Number(port), '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received: closing DB pool...');
  try {
    await pool.end();
    console.log('Database pool closed.');
  } catch (err) {
    console.error('Error closing DB pool:', err);
  }

  try {
    await closeRedisClient();
  } catch (err) {
    console.error('Error disconnecting Redis client:', err);
  }
  process.exit(0);
});