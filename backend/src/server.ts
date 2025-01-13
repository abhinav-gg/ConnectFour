import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import expressWs from 'express-ws';
import { dbOperations } from '@/db/operations';
import authRouter from '@/authRoutes'; // Import the auth routes
import { setupGameEvents } from '@/events/gameEvents';
import { authenticateAdmin, authenticateJWT } from '@/lib/auth/middleware';

dotenv.config();

const port = process.env.PORT || 3001;
const { app } = expressWs(express());

console.log('Attempting to use port:', port);
console.log('Environment port:', process.env.port);

app.get('/', (req, res) => {
  res.send(`Backend is running on port ${port}!`);
});

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

app.head('/health', (req, res) => {
  res.status(200).end();
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.post('/api/openings', async (req, res) => {
  const { position } = req.body;
  console.log('Position:', position);
  try {
    const openings = await dbOperations.GetOpening(position.toString());
    res.json({ status: 'Success', data: openings });
  } catch (error: any) {
    console.error('Failed to fetch openings:', error);
    res.status(500).json({
      error: 'Failed to fetch openings'
    });
  }
});

app.post('/api/make-opening', authenticateJWT, authenticateAdmin, async (req, res) => {
  const { position, description } = req.body;
  console.log('Position:', position, 'Description:', description);
  try {
    const creation = await dbOperations.CreateOpening(position.toString(), description.toString());
    res.json({ status: 'Success' });
  } catch (error: any) {
    console.error('Failed to fetch openings:', error);
    res.status(500).json({
      error: 'Failed to fetch openings'
    });
  }
});

app.use('/api/auth', authRouter);

setupGameEvents(app);

app.listen(Number(port), '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});