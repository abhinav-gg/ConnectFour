import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import pool from '@/db/rds/rdsClient'; // Adjust the import based on your database setup
import authRouter from './controllers/api/routes/authRoutes';
import gameRouter from './controllers/api/routes/gameRoutes';
import { devTestRoutes } from './controllers/api/index';
import { myConfig } from '@config/env';
import { bootstrapAPI } from './bootstrap';
import { API_VERSION } from './versions';

const port = myConfig.API_PORT || 3001;
const app = express();
const server = createServer(app);

app.use(cors({
  origin: myConfig.CLIENT_URL,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Set up sub routes
app.use('/auth', authRouter);
app.use('/game', gameRouter);

if (myConfig.NODE_ENV !== 'production') {
  app.use('/', devTestRoutes)
}

/////////////////////// MAIN ///////////////////////

app.get('/', (req, res) => {
  res.send(`Backend is certainly running on port ${port}!`);
});

app.head('/health', (req, res) => {
  res.status(200).end();
});

app.get('/health', (req, res) => {
  res.status(200).json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      mode: myConfig.NODE_ENV
    }
  );
});

async function startAPI() {

  await bootstrapAPI();

  server.listen(Number(port), '0.0.0.0', () => {
    console.log(`(${API_VERSION}) API Server running on port ${port}`);
  });
}

startAPI().catch((err) => {
  console.error('Startup failed:', err);
  process.exit(1); // ! Exit with error so host/service restarts
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
    // await closeAllClients();
  } catch (err) {
    console.error('Error disconnecting Redis client:', err);
  }
  process.exit(0);
});