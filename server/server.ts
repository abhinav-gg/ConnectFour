import compression from "compression";
import cookieParser from "cookie-parser";
import express from 'express';
import helmet from "helmet";
import morgan from "morgan";
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handler } from '../build/handler.js';
import app from "./api.js";
import { redirectWwwToRoot } from "./lib/middleware/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static('/static'));
app.use(redirectWwwToRoot);
app.disable("x-powered-by");
app.use(compression());
app.use(morgan("tiny"));
app.use(cookieParser());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "default-src": ["'self' 'unsafe-inline' *.fontawesome.com"],
      "script-src": ["'self' 'unsafe-inline' *.fontawesome.com"],
      "img-src": ["'self' blob: data:"]
    },
  },
}));

// ----- Routes ----- //
app.get('/favicon.ico', (req, res) => {
  // Send favicon.png if favicon.ico is requested
  res.sendFile(path.join(__dirname, '..', '/build', '/client', 'favicon.png'));
});
// ------------------ //

app.use(handler);

app.listen(3000, () => {
  console.log('Server started. Listening on port 3000');
});