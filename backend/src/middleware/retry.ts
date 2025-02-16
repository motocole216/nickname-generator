import { Request, Response, NextFunction } from 'express';

interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors: string[];
}

const defaultConfig: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EPIPE', 'EHOSTUNREACH']
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const calculateBackoff = (attempt: number, config: RetryConfig): number => {
  const delay = config.initialDelay * Math.pow(config.backoffFactor, attempt - 1);
  return Math.min(delay, config.maxDelay);
};

const isRetryableError = (error: any, config: RetryConfig): boolean => {
  if (!error.code) return false;
  return config.retryableErrors.includes(error.code);
};

export const retryMiddleware = (config: Partial<RetryConfig> = {}) => {
  const fullConfig = { ...defaultConfig, ...config };

  return async (req: Request, res: Response, next: NextFunction) => {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= fullConfig.maxAttempts; attempt++) {
      try {
        await next();
        return;
      } catch (error: any) {
        lastError = error;

        if (attempt === fullConfig.maxAttempts || !isRetryableError(error, fullConfig)) {
          next(error);
          return;
        }

        const delay = calculateBackoff(attempt, fullConfig);
        await sleep(delay);
      }
    }

    next(lastError);
  };
};

export default retryMiddleware; 