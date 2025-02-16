import { Request, Response, NextFunction } from 'express';
import cloudinary from '../../services/cloudinary';
import { AppError } from '../../middleware/error';
import { ImageDeleteResult } from '../../types/image';

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