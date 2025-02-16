import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { validateImage, uploadImage, deleteImage, cleanupUnusedImages, generateNickname, rateLimiter, generateImage, listImages } from '../image';

// Mock OpenAI
const mockOpenAIInstance = {
  chat: {
    completions: {
      create: jest.fn()
    }
  }
};

jest.mock('openai', () => {
  const mockCreate = jest.fn();
  return jest.fn(() => ({
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
      upload: jest.fn(),
      destroy: jest.fn()
    },
    search: {
      expression: jest.fn().mockReturnThis(),
      execute: jest.fn()
    }
  }
}));

// Mock types for cloudinary
declare module 'cloudinary' {
  namespace v2 {
    namespace search {
      function execute(): Promise<any>;
    }
  }
}

// Define response types
interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
}

interface CloudinaryDeleteResponse {
  result: string;
}

interface CloudinaryListResponse {
  resources: Array<{
    public_id: string;
  }>;
}

// Define mock response type
type MockResponse = {
  json: jest.Mock;
  status: jest.Mock;
} & Partial<Response>;

// Declare global augmentations
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidResponse(): R;
    }
  }
  var mockOpenAICreate: jest.SpyInstance;
  var mockCloudinaryUpload: jest.SpyInstance;
  var mockCloudinaryDestroy: jest.SpyInstance;
  var mockCloudinaryExecute: jest.SpyInstance;
}

describe('Image Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: MockResponse;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockOpenAICreate: jest.SpyInstance;
  let mockCloudinaryUpload: jest.SpyInstance;
  let mockCloudinaryDestroy: jest.SpyInstance;
  let mockCloudinaryExecute: jest.SpyInstance;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnThis();
    mockReq = {
      body: {},
      ip: '127.0.0.1',
      params: {}
    };
    mockRes = {
      json: mockJson,
      status: mockStatus
    } as MockResponse;

    // Set up OpenAI mock response
    mockOpenAICreate = jest.spyOn(global, 'mockOpenAICreate').mockResolvedValue({
      choices: [
        {
          message: {
            content: 'Test generated content'
          }
        }
      ]
    });

    // Set up Cloudinary mock responses
    mockCloudinaryUpload = jest.spyOn(global, 'mockCloudinaryUpload').mockResolvedValue({
      secure_url: 'https://test-url.com/image.jpg',
      public_id: 'test-public-id'
    });

    mockCloudinaryDestroy = jest.spyOn(global, 'mockCloudinaryDestroy').mockResolvedValue({
      result: 'ok'
    });

    mockCloudinaryExecute = jest.spyOn(global, 'mockCloudinaryExecute').mockResolvedValue({
      resources: [
        { public_id: 'test-image-1' },
        { public_id: 'test-image-2' }
      ]
    });
  });

  afterEach(() => {
    mockOpenAICreate.mockRestore();
    mockCloudinaryUpload.mockRestore();
    mockCloudinaryDestroy.mockRestore();
    mockCloudinaryExecute.mockRestore();
  });

  describe('validateImage', () => {
    it('should validate correct image format', () => {
      const validBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';
      const result = validateImage(validBase64);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid image format', () => {
      const invalidBase64 = 'invalid-format';
      const result = validateImage(invalidBase64);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid image format');
    });

    it('should reject oversized images', () => {
      const largeBase64 = `data:image/jpeg;base64,${Buffer.alloc(6 * 1024 * 1024).toString('base64')}`;
      const result = validateImage(largeBase64);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('File size exceeds 5MB limit');
    });
  });

  describe('uploadImage', () => {
    const mockUploadResult = {
      secure_url: 'https://cloudinary.com/image.jpg',
      public_id: 'test123'
    };

    beforeEach(() => {
      (cloudinary.uploader.upload as jest.Mock).mockResolvedValue(mockUploadResult);
    });

    it('should successfully upload a valid image', async () => {
      mockReq.body = {
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
      };

      await uploadImage(mockReq as Request, mockRes as Response);

      expect(cloudinary.uploader.upload).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        url: mockUploadResult.secure_url,
        public_id: mockUploadResult.public_id
      });
    });

    it('should handle missing image', async () => {
      mockReq.body = {};

      await uploadImage(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'No image provided' });
    });

    it('should handle upload errors', async () => {
      mockReq.body = {
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
      };
      (cloudinary.uploader.upload as jest.Mock).mockRejectedValue(new Error('Upload failed'));

      await uploadImage(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to upload image' });
    });
  });

  describe('deleteImage', () => {
    it('should delete an image successfully', async () => {
      mockReq.params = { public_id: 'test-public-id' };

      await deleteImage(mockReq as Request, mockRes as Response);

      expect(global.mockCloudinaryDestroy).toHaveBeenCalledWith('test-public-id');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Image deleted successfully'
      });
    });

    it('should handle deletion errors', async () => {
      mockReq.params = { public_id: 'test-public-id' };
      global.mockCloudinaryDestroy.mockRejectedValue(new Error('Deletion Error'));

      await deleteImage(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Failed to delete image'
      });
    });
  });

  describe('cleanupUnusedImages', () => {
    const mockResources = [
      { public_id: 'image1' },
      { public_id: 'image2' }
    ];

    beforeEach(() => {
      (cloudinary.search.execute as jest.Mock).mockResolvedValue({ resources: mockResources });
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });
    });

    it('should successfully cleanup unused images', async () => {
      await cleanupUnusedImages(mockReq as Request, mockRes as Response);

      expect(cloudinary.search.expression).toHaveBeenCalledWith('folder:nicknames AND uploaded_at<1d');
      expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(2);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Cleanup completed',
        deletedCount: 2,
        deletedImages: ['image1', 'image2']
      });
    });

    it('should handle cleanup errors', async () => {
      (cloudinary.search.execute as jest.Mock).mockRejectedValue(new Error('Search failed'));

      await cleanupUnusedImages(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to cleanup images' });
    });
  });

  describe('generateNickname', () => {
    it('should generate a nickname from an image URL', async () => {
      mockReq.body = { imageUrl: 'https://example.com/image.jpg' };

      const mockVisionResponse: OpenAIResponse = {
        choices: [{
          message: {
            content: 'A cute brown dog with floppy ears'
          }
        }]
      };

      const mockNicknameResponse: OpenAIResponse = {
        choices: [{
          message: {
            content: 'Floppy Paws'
          }
        }]
      };

      mockOpenAIInstance.chat.completions.create
        .mockResolvedValueOnce(mockVisionResponse)
        .mockResolvedValueOnce(mockNicknameResponse);

      await generateNickname(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          nickname: 'Floppy Paws',
          analysis: 'A cute brown dog with floppy ears'
        }
      });
    });

    it('should handle missing image URL', async () => {
      mockReq.body = {};

      await generateNickname(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'No image URL provided' });
    });

    it('should handle API errors', async () => {
      mockReq.body = { imageUrl: 'https://example.com/image.jpg' };

      mockOpenAIInstance.chat.completions.create
        .mockRejectedValue(new Error('API Error'));

      await generateNickname(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'API Error',
        details: expect.any(Error)
      });
    });
  });

  describe('Rate Limiter', () => {
    it('should track requests per IP', () => {
      const ip = '127.0.0.1';
      
      // Should allow maxRequestsPerWindow requests
      for (let i = 0; i < rateLimiter.maxRequestsPerWindow; i++) {
        expect(rateLimiter.increment(ip)).toBe(true);
      }

      // Should block additional requests
      expect(rateLimiter.increment(ip)).toBe(false);
    });

    it('should reset counter after window expires', () => {
      const ip = '127.0.0.1';
      
      // Max out requests
      for (let i = 0; i < rateLimiter.maxRequestsPerWindow; i++) {
        rateLimiter.increment(ip);
      }

      // Simulate window reset
      rateLimiter.resetCounter();

      // Should allow requests again
      expect(rateLimiter.increment(ip)).toBe(true);
    });
  });

  describe('generateImage', () => {
    it('should generate an image successfully', async () => {
      mockReq.body = { prompt: 'test prompt' };
      
      await generateImage(mockReq as Request, mockRes as Response);
      
      expect(global.mockOpenAICreate).toHaveBeenCalledWith({
        model: 'gpt-4-vision-preview',
        messages: expect.any(Array),
        max_tokens: 500
      });
      
      expect(global.mockCloudinaryUpload).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        imageUrl: 'https://test-url.com/image.jpg',
        publicId: 'test-public-id'
      });
    });

    it('should handle OpenAI API errors', async () => {
      mockReq.body = { prompt: 'test prompt' };
      global.mockOpenAICreate.mockRejectedValue(new Error('API Error'));

      await generateImage(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Failed to generate image description'
      });
    });

    it('should handle rate limiting', async () => {
      mockReq.body = { prompt: 'test prompt' };
      
      // Simulate hitting rate limit
      for (let i = 0; i < 11; i++) {
        await generateImage(mockReq as Request, mockRes as Response);
      }

      expect(mockStatus).toHaveBeenCalledWith(429);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Too many requests. Please try again later.'
      });
    });
  });

  describe('listImages', () => {
    it('should list images successfully', async () => {
      await listImages(mockReq as Request, mockRes as Response);

      expect(global.mockCloudinaryExecute).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        images: [
          { public_id: 'test-image-1' },
          { public_id: 'test-image-2' }
        ]
      });
    });

    it('should handle listing errors', async () => {
      global.mockCloudinaryExecute.mockRejectedValue(new Error('Listing Error'));

      await listImages(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Failed to list images'
      });
    });
  });
}); 