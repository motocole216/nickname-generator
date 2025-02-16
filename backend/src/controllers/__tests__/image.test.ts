import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { validateImage, uploadImage, deleteImage, cleanupUnusedImages, generateNickname } from '../image';

// Mock cloudinary
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

// Mock OpenAI
jest.mock('openai', () => {
  const mockCreate = jest.fn();
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate
      }
    }
  }));
});

describe('Image Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const mockJson = jest.fn();
  const mockStatus = jest.fn();

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      json: mockJson,
      status: mockStatus.mockReturnThis()
    };
    jest.clearAllMocks();

    // Reset OpenAI mock for each test
    const OpenAI = jest.requireMock('openai');
    const mockOpenAI = new OpenAI();
    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [{
        message: {
          content: 'Cool Nickname'
        }
      }]
    });
  });

  describe('validateImage', () => {
    it('should validate correct image format', () => {
      const validImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
      const result = validateImage(validImage);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid image format', () => {
      const invalidImage = 'not-a-base64-image';
      const result = validateImage(invalidImage);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid image format');
    });

    it('should reject unsupported file types', () => {
      const invalidType = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      const result = validateImage(invalidType);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unsupported file type. Please use JPEG, PNG, or WebP');
    });

    it('should reject oversized images', () => {
      // Create a large base64 string (>5MB)
      const largeBase64 = `data:image/jpeg;base64,${'A'.repeat(7000000)}`;
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
      mockRequest.body = {
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
      };

      await uploadImage(mockRequest as Request, mockResponse as Response);

      expect(cloudinary.uploader.upload).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        url: mockUploadResult.secure_url,
        public_id: mockUploadResult.public_id
      });
    });

    it('should handle missing image', async () => {
      mockRequest.body = {};

      await uploadImage(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'No image provided' });
    });

    it('should handle upload errors', async () => {
      mockRequest.body = {
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
      };
      (cloudinary.uploader.upload as jest.Mock).mockRejectedValue(new Error('Upload failed'));

      await uploadImage(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to upload image' });
    });
  });

  describe('deleteImage', () => {
    beforeEach(() => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });
    });

    it('should successfully delete an image', async () => {
      mockRequest.params = { public_id: 'test123' };

      await deleteImage(mockRequest as Request, mockResponse as Response);

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('test123');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Image deleted successfully' });
    });

    it('should handle missing public_id', async () => {
      mockRequest.params = {};

      await deleteImage(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'No image ID provided' });
    });

    it('should handle non-existent images', async () => {
      mockRequest.params = { public_id: 'nonexistent' };
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'not found' });

      await deleteImage(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Image not found or already deleted' });
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
      await cleanupUnusedImages(mockRequest as Request, mockResponse as Response);

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

      await cleanupUnusedImages(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to cleanup images' });
    });
  });

  describe('generateNickname', () => {
    it('should generate a nickname from an image URL', async () => {
      mockRequest.body = {
        imageUrl: 'https://example.com/image.jpg'
      };

      await generateNickname(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ nickname: 'Cool Nickname' });
    });

    it('should handle missing image URL', async () => {
      mockRequest.body = {};

      await generateNickname(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'No image URL provided' });
    });

    it('should handle API errors', async () => {
      mockRequest.body = {
        imageUrl: 'https://example.com/image.jpg'
      };

      // Mock API error
      const OpenAI = jest.requireMock('openai');
      const mockOpenAI = new OpenAI();
      mockOpenAI.chat.completions.create.mockImplementationOnce(() => {
        throw new Error('API Error');
      });

      await generateNickname(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to generate nickname' });
    });
  });
}); 