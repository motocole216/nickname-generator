import { Router } from 'express';
import { uploadImage, deleteImage, generateNickname } from '../controllers/image';
import { rateLimiterMiddleware } from '../middleware/rateLimiter';

const router = Router();

// Route to handle image upload and nickname generation
router.post('/upload', rateLimiterMiddleware, uploadImage);
router.post('/generate-nickname', rateLimiterMiddleware, generateNickname);
router.delete('/:id', rateLimiterMiddleware, deleteImage);

export default router; 