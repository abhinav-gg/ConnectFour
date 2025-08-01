
import express from 'express';
import { createServer } from 'http';
import { myConfig } from '@config/env';
import { verifySocket } from '@/lib/game.middleware';
import { initSocketIO } from '@/controllers/socket/index'
import { handleDisconnect, registerSocketHandler } from '@/controllers/socket/handlers'
import { bootstrap } from './bootstrap';
import { liveGameService } from './services/livegame.service';


const VERSION = "0.0.1"

const port = myConfig.SOCKET_PORT;
const server = createServer(express());


const io = initSocketIO(server)

io.use(verifySocket);

// Handle connections
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);
  

  // Add more handlers here
  // registerSocketHandler.game(socket);
  // registerSocketHandler.matchmaking(socket);
  // registerSocketHandler.reg(socket);

  // Listen for the ping event from the client
  socket.on("ping", () => {
    console.log(`Received ping from ${socket.id}`);
    
    // You can respond with a pong if you want
    socket.emit("pong", { time: new Date().toISOString() });
  });
});

io.on('disconnect', async (socket) => {
  handleDisconnect(socket);
  await liveGameService.HandleDisconnect(socket.userId);
});


async function startSocketio() {

  await bootstrap()

  server.listen(Number(port), '0.0.0.0', () => {
    console.log(`(${VERSION}) Socket server running on port ${port}`);
  });

}

startSocketio().catch(console.error);


