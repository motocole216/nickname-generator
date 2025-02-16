import { Request, Response, NextFunction } from 'express';
import cloudinary from '../../services/cloudinary';
import { AppError } from '../../middleware/error';
import { ImageListResult, CleanupResult } from '../../types/image';

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