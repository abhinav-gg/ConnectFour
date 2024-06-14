import express from 'express';
import expressWs from 'express-ws';
// import { ApiHandler } from './lib/handler/index.js';

const API_ROUTE = '/api/v0/ws';

const { app } = expressWs(express());
const port = process.env.PORT || 4000; // Render needs a port specification or it keeps resetting itself when looking for open ports

// const srv = new ApiHandler();

// app.ws(API_ROUTE, (ws, req) => {
//   ws.on('message', srv.handleMessage.bind(srv, ws));
//   ws.on('close', srv.handleClose.bind(srv, ws));
// });

app.get('/test', (req, res) => {
  res.send('Hello World!')
})

export default app;
