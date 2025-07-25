
import express from 'express';
import { createServer } from 'http';
import { myConfig } from '@config/env';
import { verifySocket } from '@/lib/auth/middleware'
import { initSocketIO } from '@/controllers/socket/index'
import pool from './db/rds/rdsClient';
import { checkDynamoHealth } from './db/dynamodb/dynamoClient';
import { checkRedisHealth } from './redis/redisHelper';

const VERSION = "0.0.1"

const port = myConfig.SOCKET_PORT;
const server = createServer(express());


const io = initSocketIO(server)

io.use(verifySocket);

// Handle connections
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);
  
  // registerWaitingRoomHandlers(socket);
  // registerGameHandlers(socket);
  // Add more handlers here
  
  
  // Listen for the ping event from the client
  socket.on("ping", () => {
    console.log(`Received ping from ${socket.id}`);
    
    // You can respond with a pong if you want
    socket.emit("pong", { time: new Date().toISOString() });
  });

});

async function startSocketio() {

  if (!await checkRedisHealth())
    console.error("No Redis :(")

  if (!await checkDynamoHealth())
    console.error("No Dynamo :(")

  server.listen(Number(port), '0.0.0.0', () => {
    console.log(`(${VERSION}) Socket server running on port ${port}`);
  });

}

startSocketio().catch(console.error);


