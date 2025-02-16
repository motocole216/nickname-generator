import { describe, it, expect, jest, beforeAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock OpenAI
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
    }
  }
}));

describe('Image API Integration Tests', () => {
  let app: express.Application;
  let mockOpenAI: any;
  let cloudinary: any;

  beforeAll(() => {
    app = express();
    app.use(express.json({ limit: '10mb' }));
    app.use('/api/images', require('../../routes/image').default);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get fresh instances of mocks
    const OpenAI = jest.requireMock('openai');
    mockOpenAI = new OpenAI();
    cloudinary = jest.requireMock('cloudinary');
  });

  describe('POST /api/images/upload', () => {
    it('should upload image successfully', async () => {
      const mockCloudinaryResponse = {
        secure_url: 'https://cloudinary.com/test.jpg',
        public_id: 'test123'
      };

      cloudinary.v2.uploader.upload.mockResolvedValue(mockCloudinaryResponse);

      const response = await request(app)
        .post('/api/images/upload')
        .send({
          image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        url: mockCloudinaryResponse.secure_url,
        public_id: mockCloudinaryResponse.public_id
      });
    });

    it('should handle rate limiting', async () => {
      const mockCloudinaryResponse = {
        secure_url: 'https://cloudinary.com/test.jpg',
        public_id: 'test123'
      };

      cloudinary.v2.uploader.upload.mockResolvedValue(mockCloudinaryResponse);

      // Make maximum allowed requests
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/images/upload')
          .send({
            image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...'
          });
      }

      // This request should be rate limited
      const response = await request(app)
        .post('/api/images/upload')
        .send({
          image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...'
        });

      expect(response.status).toBe(429);
      expect(response.body).toHaveProperty('error', 'Too many requests. Please try again later.');
    });
  });

  describe('POST /api/images/generate-nickname', () => {
    it('should generate nickname successfully', async () => {
      const mockVisionResponse = {
        choices: [{
          message: {
            content: 'A majestic mountain peak covered in snow'
          }
        }]
      };

      const mockNicknameResponse = {
        choices: [{
          message: {
            content: 'Frosty Peak'
          }
        }]
      };

      mockOpenAI.chat.completions.create
        .mockResolvedValueOnce(mockVisionResponse)
        .mockResolvedValueOnce(mockNicknameResponse);

      const response = await request(app)
        .post('/api/images/generate-nickname')
        .send({
          imageUrl: 'https://example.com/mountain.jpg'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          nickname: 'Frosty Peak',
          analysis: 'A majestic mountain peak covered in snow'
        }
      });
    });

    it('should handle OpenAI API errors gracefully', async () => {
      mockOpenAI.chat.completions.create
        .mockRejectedValue(new Error('OpenAI API Error'));

      const response = await request(app)
        .post('/api/images/generate-nickname')
        .send({
          imageUrl: 'https://example.com/mountain.jpg'
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: 'OpenAI API Error',
        details: expect.any(Object)
      });
    });
  });

  describe('DELETE /api/images/:id', () => {
    it('should delete image successfully', async () => {
      cloudinary.v2.uploader.destroy.mockResolvedValue({ result: 'ok' });

      const response = await request(app)
        .delete('/api/images/test123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Image deleted successfully'
      });
    });

    it('should handle non-existent images', async () => {
      cloudinary.v2.uploader.destroy.mockResolvedValue({ result: 'not found' });

      const response = await request(app)
        .delete('/api/images/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Image not found or already deleted');
    });
  });
}); 