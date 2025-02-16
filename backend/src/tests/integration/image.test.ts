import { describe, it, expect, jest, beforeAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { app } from '../../server';
import { v2 as cloudinary } from 'cloudinary';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test nickname' } }]
        })
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

    // Mock Cloudinary uploader
    (cloudinary.uploader.upload as jest.Mock).mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/test/image/upload/test123',
      public_id: 'test123'
    });
    (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });
  });

  describe('POST /api/images/upload', () => {
    it('should upload image successfully', async () => {
      const response = await request(app)
        .post('/api/images/upload')
        .send({
          image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('url', 'https://res.cloudinary.com/test/image/upload/test123');
      expect(response.body).toHaveProperty('public_id', 'test123');
    });

    it('should handle rate limiting', async () => {
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
      const response = await request(app)
        .delete('/api/images/test123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Image deleted successfully'
      });
    });

    it('should handle non-existent images', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'not found' });

      const response = await request(app)
        .delete('/api/images/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Image not found or already deleted');
    });
  });
}); 