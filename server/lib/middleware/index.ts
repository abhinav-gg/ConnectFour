import type express from 'express';

/**
 * Middleware function to redirect requests from 'www' subdomain to the root domain.
 * @param req The request object.
 * @param res The response object.
 * @param next The next function.
 */
export function redirectWwwToRoot(req: express.Request, res: express.Response, next: express.NextFunction): void {
  if (req.hostname) {
    if (req.hostname.slice(0, 4) === 'www.') {
      const host = req.hostname.slice(4);
      return res.redirect(301, req.protocol + '://' + host + req.originalUrl);
    }
  } else {
    res.status(400).send('Invalid request');
  }
  next();
};

/**
 * Middleware function to disable caching for specific routes.
 * @param req The request object (unused).
 * @param res The response object.
 * @param next The next function.
 */
export function disableCaching(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
  };
  res.set(headers);
  res.removeHeader('ETag');
  next();
}