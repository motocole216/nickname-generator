import { Request, Response, NextFunction } from 'express';
import cloudinary from '../../services/cloudinary';
import { AppError } from '../../middleware/error';
import { validateImage, MAX_IMAGE_DIMENSION } from '../../services/validation';
import { ImageUploadResult } from '../../types/image';

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

    try {
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
    } catch (cloudinaryError: any) {
      console.error('Cloudinary upload error:', cloudinaryError);
      throw new AppError(
        `Failed to upload image to Cloudinary: ${cloudinaryError.message || 'Unknown error'}`,
        500
      );
    }
  } catch (error: any) {
    console.error('Upload handler error:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: `Server error: ${error.message || 'Unknown error'}`
      });
    }
  }
}; 