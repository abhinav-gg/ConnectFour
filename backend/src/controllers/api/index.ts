import express, { Router } from 'express';
import { Request, Response } from 'express';
import { createServer } from 'http';
import { getRedisClient } from '@/redis/redisClient';
import pool from '@/db/rds/rdsClient'; // Adjust the import based on your database setup
import { dynamoDBOps } from '@/db/dynamodb/ops';
import authRouter from '@/controllers/api/routes/authRoutes';
import { sendEmailVerifyCode } from '@/lib/email/verifyCodes';
import { rdsDBOps } from '@/db/rds/ops';
import { redisOps } from '@/redis/ops';
import { scanKeysPaginated } from '@/redis/redisHelper';

const app = Router();


app.get('/all', async (_req: Request, res: Response) => {
  try {
    const r = await getRedisClient();
    const result = await scanKeysPaginated(r, '*');
    
    console.log('✅ Scan complete, sending response');
    res.json(result);
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
const redis = await getRedisClient();
const resp = await redis.get(key);
if (!resp) {
    res.status(404).json({ error: `Key "${key}" not found` });
}
else {
    res.json({ key, resp });
}
}
);

app.get('/add-test', async (req: Request, res: Response): Promise<void> => {
  const r = await redisOps();

  await r.game.addGameMove("testGameId", 7);
  await r.game.addGameMove("testGameId", 2);
  await r.game.addGameMove("testGameId", 3);

  const moves = await r.game.getGameMoves("testGameId");
  console.log("Moves in Redis:", moves);
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
    await sendEmailVerifyCode("123543", "Chipinje", "agupta.cam7@gmail.com")
    // await sendEmailVerifyCode("123543", "Chipinje", "connect-four@outlook.com")
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
  
export { app as devTestRoutes };

