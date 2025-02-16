import { Request, Response, NextFunction } from 'express';
import { AppError } from './error';

export const timeoutMiddleware = (timeout: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only apply timeout to specific routes that need it
    if (req.path.includes('/api/image/generate') || req.path.includes('/api/image/upload')) {
      const timeoutId = setTimeout(() => {
        const error = new AppError('Request timeout. Please try again.', 408);
        next(error);
      }, timeout);

      // Clear timeout when the response is sent
      res.on('finish', () => {
        clearTimeout(timeoutId);
      });

      // Clear timeout if there's an error
      res.on('error', () => {
        clearTimeout(timeoutId);
      });
    }
    next();
  };
}; 