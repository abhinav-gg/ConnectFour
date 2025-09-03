
import express from 'express';
import { createServer } from 'http';
import { myConfig } from '@config/env';
import { verifySocket, sendSocketUserToGame } from '@/lib/middleware/game.middleware';
import { initSocketIO } from '@/controllers/socket/index'
import { registerSocketHandler } from '@/controllers/socket/handlers'
import { bootstrapSocket } from './bootstrap';
import { SOCKET_VERSION } from './versions';

const port = myConfig.SOCKET_PORT;
const server = createServer(express());


const io = initSocketIO(server)

io.use(verifySocket);
io.use(sendSocketUserToGame);

// Handle connections
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);
  
  // add simple rate limiter here for anything that is not a ping
  socket.onAny((event) => {
    if (event !== 'ping') {
      // Implement your rate limiting logic here TODO
    } 
  });

  // Add more handlers here
  registerSocketHandler.game(socket);
  registerSocketHandler.matchmaking(socket);


  socket.on('auth:me', async () => {

    verifySocket(socket, async (err) => {
      if (err) {
        console.error('Socket authentication failed:', err);
        socket.disconnect(true);
        return;
      }
    });

    // send response for the user to re-ping the api....

  });


  // Listen for the ping event from the client
  socket.on("ping", () => {
    // console.log(`Received ping from ${socket.id}`);
    // You can respond with a pong if you want
    socket.emit("message", { event: "pong", data: "pong" });
  });


});

io.on('disconnect', async (socket) => {
  
  // Clean up user state, remove from rooms, etc.
  console.log(`Cleaning up user ${socket.id}`);
  
  // Leave all rooms
  socket.rooms.forEach((room: string) => {
    if (room !== socket.id) {
      socket.leave(room);
      console.log(`User ${socket.id} left room ${room}`);
    }
    });
});


async function startSocketio() {

  await bootstrapSocket();

  server.listen(Number(port), '0.0.0.0', () => {
    console.log(`(${SOCKET_VERSION}) Socket server running on port ${port}`);
  });

}

startSocketio().catch((err) => {
  console.error('Startup failed:', err);
  process.exit(1); // ! Exit with error so host/service restarts
});