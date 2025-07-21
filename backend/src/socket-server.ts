import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { setupSocketIO } from './controllers/socket/socket';

dotenv.config();

const port = process.env.PORT || 3001;

const server = createServer(express());

// Setup Socket.IO
const io = setupSocketIO(server);

server.listen(Number(port), '0.0.0.0', () => {
  console.log(`Socket server running on port ${port}`);
});

export { io, server };