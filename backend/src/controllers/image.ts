import { Request, Response, NextFunction } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { cacheService } from '../services/cache';
import { AppError } from '../middleware/error';
import { analyzeImage, generateNicknameFromDescription, openai } from '../services/openai';
import { config } from '../config/env';
import { validateImage, MAX_IMAGE_DIMENSION } from '../services/validation';
import {
  ImageUploadResult,
  ImageDeleteResult,
  NicknameResult,
  ImageListResult,
  CleanupResult
} from '../types/image';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET
});

// Image validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // Increased to 10MB
const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

const handleError = (error: any, res: Response) => {
  console.error('Error:', error);
  res.status(500).json({ error: 'An unexpected error occurred' });
};

export const uploadImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body.image) {
      throw new AppError('No image provided', 400);
    }

    // Validate image
    const validation = validateImage(req.body.image);
    if (!validation.valid) {
      throw new AppError(validation.error || 'Invalid image', 400);
    }

    // Upload with optimization settings
    const result = await cloudinary.uploader.upload(req.body.image, {
      folder: 'nicknames',
      transformation: [
        { width: MAX_IMAGE_DIMENSION, height: MAX_IMAGE_DIMENSION, crop: 'limit' },
        { quality: 'auto:good', fetch_format: 'auto' },
        { flags: 'preserve_transparency' }
      ],
      resource_type: 'image'
    });

    const response: ImageUploadResult = {
      success: true,
      imageUrl: result.secure_url,
      public_id: result.public_id
    };

    res.status(200).json(response);
  } catch (error: unknown) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

export const deleteImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { public_id } = req.params;
    
    if (!public_id) {
      throw new AppError('No image ID provided', 400);
    }

    // Delete the image from Cloudinary
    const result = await cloudinary.uploader.destroy(public_id);
    
    if (result.result === 'ok') {
      const response: ImageDeleteResult = {
        success: true,
        message: 'Image deleted successfully'
      };
      res.status(200).json(response);
    } else {
      throw new AppError('Image not found or already deleted', 404);
    }
  } catch (error: unknown) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

export const generateNickname = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      throw new AppError('No image URL provided', 400);
    }

    // Check cache first
    const cacheKey = `nickname:${imageUrl}`;
    const cachedResult = cacheService.get<NicknameResult>(cacheKey);
    
    if (cachedResult) {
      res.status(200).json({
        success: true,
        data: cachedResult,
        cached: true
      });
      return;
    }

    // Generate new nickname using our service
    const imageAnalysis = await analyzeImage(imageUrl);
    const nickname = await generateNicknameFromDescription(imageAnalysis);

    const result: NicknameResult = { nickname, analysis: imageAnalysis };
    cacheService.set(cacheKey, result);

    res.status(200).json({
      success: true,
      data: result,
      cached: false
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

export const generateImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      throw new AppError('No prompt provided', 400);
    }

    // Generate image using OpenAI
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "url",
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new AppError('Failed to generate image', 500);
    }

    // Upload the generated image to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(imageUrl, {
      folder: 'nicknames',
      transformation: [
        { width: MAX_IMAGE_DIMENSION, height: MAX_IMAGE_DIMENSION, crop: 'limit' },
        { quality: 'auto:good', fetch_format: 'auto' }
      ]
    });

    const result: ImageUploadResult = {
      success: true,
      imageUrl: uploadResult.secure_url,
      public_id: uploadResult.public_id
    };

    res.status(200).json(result);
  } catch (error: unknown) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

export const listImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await cloudinary.search
      .expression('folder:nicknames')
      .sort_by('created_at', 'desc')
      .max_results(100)
      .execute();

    const response: ImageListResult = {
      success: true,
      images: result.resources
    };

    res.status(200).json(response);
  } catch (error: unknown) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

export const cleanupUnusedImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await cloudinary.search
      .expression('folder:nicknames AND uploaded_at<1d')
      .execute();

    const deletedImages: string[] = [];
    for (const resource of result.resources) {
      try {
        await cloudinary.uploader.destroy(resource.public_id);
        deletedImages.push(resource.public_id);
      } catch (err) {
        console.error(`Failed to delete image ${resource.public_id}:`, err);
        // Continue with other deletions even if one fails
      }
    }

    const response: CleanupResult = {
      success: true,
      message: 'Cleanup completed',
      deletedCount: deletedImages.length,
      deletedImages
    };

    res.status(200).json(response);
  } catch (error: unknown) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    } else {
      next(error);
    }
  }
}; 