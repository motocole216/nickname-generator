import { Request, Response, NextFunction } from 'express';
import cloudinary from '../../services/cloudinary';
import { AppError } from '../../middleware/error';
import { cacheService } from '../../services/cache';
import { analyzeImage, generateNicknameFromDescription, openai } from '../../services/openai';
import { ImageUploadResult, NicknameResult } from '../../types/image';
import { MAX_IMAGE_DIMENSION } from '../../services/validation';

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