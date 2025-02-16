import { beforeEach } from '@jest/globals';

// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.OPENAI_API_KEY = 'test-api-key';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-api-key';
process.env.CLOUDINARY_API_SECRET = 'test-secret';

// Reset rate limiter between tests
jest.resetModules();
beforeEach(() => {
  jest.resetModules();
  const { rateLimiter } = require('../controllers/image');
  rateLimiter.maxRequests.clear();
}); 