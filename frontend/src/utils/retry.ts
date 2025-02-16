interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableStatuses: number[];
}

const defaultConfig: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504]
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const calculateBackoff = (attempt: number, config: RetryConfig): number => {
  const delay = config.initialDelay * Math.pow(config.backoffFactor, attempt - 1);
  return Math.min(delay, config.maxDelay);
};

export const isRetryableError = (error: any, config: RetryConfig): boolean => {
  if (!error.response) return true; // Network errors are retryable
  return config.retryableStatuses.includes(error.response.status);
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const fullConfig = { ...defaultConfig, ...config };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= fullConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      if (attempt === fullConfig.maxAttempts || !isRetryableError(error, fullConfig)) {
        throw error;
      }

      const delay = calculateBackoff(attempt, fullConfig);
      await sleep(delay);
    }
  }

  throw lastError;
} 