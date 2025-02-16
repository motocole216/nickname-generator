import { Request, Response, NextFunction } from 'express';
import { rateLimiter } from '../controllers/image';

export const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

  if (!rateLimiter.increment(clientIp)) {
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(rateLimiter.windowMs / 1000) // seconds
    });
    return;
  }

  next();
}; 