import { jest } from '@jest/globals';
import type { ChatCompletion } from 'openai/resources';
import type { Response } from 'express';

// Define response types
interface OpenAIResponse {
  choices: [{ message: { content: string } }];
}

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
}

interface CloudinaryDeleteResponse {
  result: string;
}

interface CloudinaryListResponse {
  resources: Array<{ public_id: string; secure_url: string }>;
}

// Define RateLimiter type
type RateLimiter = {
  windowMs: number;
  maxRequests: Map<string, number>;
  maxRequestsPerWindow: number;
  resetCounter: () => void;
  increment: (ip: string) => boolean;
};

// Declare global augmentations
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidResponse(): R;
    }
  }
  var mockOpenAICreate: jest.SpyInstance<Promise<OpenAIResponse>>;
  var mockCloudinaryUpload: jest.SpyInstance<Promise<CloudinaryUploadResponse>>;
  var mockCloudinaryDestroy: jest.SpyInstance<Promise<CloudinaryDeleteResponse>>;
  var mockCloudinaryExecute: jest.SpyInstance<Promise<CloudinaryListResponse>>;
}

// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.OPENAI_API_KEY = 'test-api-key';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-api-key';
process.env.CLOUDINARY_API_SECRET = 'test-secret';

// Create mock functions
const mockCreate = jest.fn();
const mockUpload = jest.fn();
const mockDestroy = jest.fn();
const mockExecute = jest.fn();

// Set up default mock implementations
mockCreate.mockImplementation(() => Promise.resolve({
  choices: [{
    message: {
      content: 'Test generated content'
    }
  }]
}));

mockUpload.mockImplementation(() => Promise.resolve({
  secure_url: 'https://test-url.com/image.jpg',
  public_id: 'test-public-id'
}));

mockDestroy.mockImplementation(() => Promise.resolve({
  result: 'ok'
}));

mockExecute.mockImplementation(() => Promise.resolve({
  resources: [
    { public_id: 'test-image-1' },
    { public_id: 'test-image-2' }
  ]
}));

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate
      }
    }
  }));
});

// Mock Cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: mockUpload,
      destroy: mockDestroy
    },
    search: {
      expression: jest.fn().mockReturnThis(),
      execute: mockExecute
    }
  }
}));

// Mock rate limiter
jest.mock('../controllers/image', () => {
  const originalModule = jest.requireActual('../controllers/image') as {
    rateLimiter: RateLimiter;
  };
  return {
    ...originalModule,
    rateLimiter: {
      windowMs: 15 * 60 * 1000,
      maxRequests: new Map<string, number>(),
      maxRequestsPerWindow: 10,
      resetCounter: () => {
        originalModule.rateLimiter.maxRequests.clear();
      },
      increment: (ip: string) => {
        const currentRequests = originalModule.rateLimiter.maxRequests.get(ip) || 0;
        if (currentRequests >= originalModule.rateLimiter.maxRequestsPerWindow) {
          return false;
        }
        originalModule.rateLimiter.maxRequests.set(ip, currentRequests + 1);
        return true;
      }
    }
  };
});

// Add custom matchers
expect.extend({
  toBeValidResponse(received: Response) {
    const pass = received && typeof received.status === 'function' && typeof received.json === 'function';
    return {
      pass,
      message: () => `expected ${received} to be a valid Express Response object`
    };
  }
});

// Reset all mocks before each test
beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  
  // Reset rate limiter
  const { rateLimiter } = require('../controllers/image');
  rateLimiter.maxRequests.clear();
  
  // Reset OpenAI mock
  mockCreate.mockReset();
  mockCreate.mockImplementation(() => Promise.resolve({
    choices: [{
      message: {
        content: 'Test generated content'
      }
    }]
  }));
  
  // Reset Cloudinary mocks
  mockUpload.mockReset();
  mockUpload.mockImplementation(() => Promise.resolve({
    secure_url: 'https://test-url.com/image.jpg',
    public_id: 'test-public-id'
  }));
  
  mockDestroy.mockReset();
  mockDestroy.mockImplementation(() => Promise.resolve({
    result: 'ok'
  }));
  
  mockExecute.mockReset();
  mockExecute.mockImplementation(() => Promise.resolve({
    resources: [
      { public_id: 'test-image-1' },
      { public_id: 'test-image-2' }
    ]
  }));
});

// Mock implementations
global.mockOpenAICreate = jest.spyOn(jest, 'fn').mockResolvedValue({
  choices: [{ message: { content: 'Test nickname' } }]
});

global.mockCloudinaryUpload = jest.spyOn(jest, 'fn').mockResolvedValue({
  secure_url: 'https://test-url.com/image.jpg',
  public_id: 'test-public-id'
});

global.mockCloudinaryDestroy = jest.spyOn(jest, 'fn').mockResolvedValue({
  result: 'ok'
});

global.mockCloudinaryExecute = jest.spyOn(jest, 'fn').mockResolvedValue({
  resources: [
    { public_id: 'test-id-1', secure_url: 'https://test-url.com/1.jpg' },
    { public_id: 'test-id-2', secure_url: 'https://test-url.com/2.jpg' }
  ]
});

// Clean up after all tests
afterAll(() => {
  jest.restoreAllMocks();
  
  // Clean up rate limiter interval
  const { rateLimiterInterval } = require('../controllers/image');
  clearInterval(rateLimiterInterval);
}); 