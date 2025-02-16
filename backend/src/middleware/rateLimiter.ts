import { Request, Response, NextFunction } from 'express';

class RateLimiter {
  private requests: Map<string, number[]>;
  public windowMs: number;
  private maxRequests: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {  // 100 requests per 15 minutes
    this.requests = new Map();
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    
    // Cleanup old entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [ip, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(timestamp => now - timestamp < this.windowMs);
      if (validTimestamps.length === 0) {
        this.requests.delete(ip);
      } else {
        this.requests.set(ip, validTimestamps);
      }
    }
  }

  increment(clientIp: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(clientIp) || [];
    
    // Remove old timestamps
    const validTimestamps = timestamps.filter(timestamp => now - timestamp < this.windowMs);
    
    if (validTimestamps.length >= this.maxRequests) {
      this.requests.set(clientIp, validTimestamps);
      return false;
    }
    
    validTimestamps.push(now);
    this.requests.set(clientIp, validTimestamps);
    return true;
  }

  // Cleanup when the application shuts down
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

const rateLimiter = new RateLimiter();

// Cleanup on process termination
process.on('SIGINT', () => {
  rateLimiter.destroy();
  process.exit();
});

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