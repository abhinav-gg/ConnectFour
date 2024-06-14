import express from 'express';
import expressWs from 'express-ws';
// import { ApiHandler } from './lib/handler/index.js';

const API_ROUTE = '/api/v0/ws';

const { app } = expressWs(express());
// const srv = new ApiHandler();

// app.ws(API_ROUTE, (ws, req) => {
//   ws.on('message', srv.handleMessage.bind(srv, ws));
//   ws.on('close', srv.handleClose.bind(srv, ws));
// });

export default app;