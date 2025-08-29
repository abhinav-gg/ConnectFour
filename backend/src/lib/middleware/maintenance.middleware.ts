import { Request, Response, NextFunction } from 'express';
import { isMaintenance, getMaintenanceStatus } from '@/lib/maintenance';
import { Socket } from 'socket.io';

export function maintenanceMiddleware(req: Request, res: any, next: NextFunction) {
  if (isMaintenance()) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'System is currently under maintenance. Please try again later.',
      status: getMaintenanceStatus(),
      retryAfter: 300 // seconds
    });
  }
  next();
}

export function socketMaintenanceMiddleware(socket: Socket, next: Function) {
  if (isMaintenance()) {
    const error = new Error('System is under maintenance');
    (error as any).data = { 
      code: 'MAINTENANCE_MODE',
      message: 'System is currently under maintenance. Please try again later.'
    };
    return next(error);
  }
  next();
}