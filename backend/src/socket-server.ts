// import cors from 'cors';
// import dotenv from 'dotenv';
// import express from 'express';
// import { createServer } from 'http';
// import { Server } from 'socket.io';
// import { dbOperations } from '@/db/operations';
// import authRouter from '@/api/routes/authRoutes'; // Import the auth routes
// import gameRouter from '@/events/gameRoutes'; // Import the game routes
// import { setupGameEvents } from '@/socket/events/gameEvents';
// import { authenticateAdmin, authenticateSession } from '@/lib/auth/middleware';
// import { DiscordUserRequest } from '@/types/types';
// import cookieParser from 'cookie-parser';
// import eventRouter from './eventRoutes';
// import { setupWaitingRoom } from './controllers/socket/events/waitingRoom';

// dotenv.config();

// const port = process.env.PORT || 3001;
// const app = express();
// const server = createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: process.env.CLIENT_URL || "http://localhost:3000",
//     credentials: true
//   }
// });

// console.log('Attempting to use port:', port);
// console.log('Environment port:', process.env.port);


// app.use(cors({
//   origin: process.env.CLIENT_URL || "http://localhost:3000",
//   credentials: true
// }));
// app.use(cookieParser());
// app.use(express.json());


// app.post('/api/openings', async (req, res) => {
//   const { position } = req.body;
//   try {
//     const openings = await dbOperations.GetOpening(position.toString());
//     res.json({ status: 'Success', data: openings });
//   } catch (error: any) {
//     console.error('Failed to fetch openings:', error);
//     res.status(500).json({
//       error: 'Failed to fetch openings'
//     });
//   }
// });
// // Setup Socket.IO events
// setupGameEvents(io);
// setupWaitingRoom(io);

// server.listen(Number(port), '0.0.0.0', () => {
//   console.log(`Server running on port ${port}`);
// });