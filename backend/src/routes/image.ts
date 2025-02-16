import express, { Router } from 'express';
import { rateLimiterMiddleware } from '../middleware/rateLimiter';
import { uploadImage } from './handlers/upload';
import { deleteImage } from './handlers/delete';
import { generateNickname, generateImage } from './handlers/generate';
import { listImages, cleanupUnusedImages } from './handlers/manage';

const router: Router = express.Router();

// Route to handle image operations
router.post('/upload', rateLimiterMiddleware, uploadImage);
router.post('/generate-nickname', rateLimiterMiddleware, generateNickname);
router.post('/generate', rateLimiterMiddleware, generateImage);
router.delete('/:public_id', rateLimiterMiddleware, deleteImage);
router.get('/list', rateLimiterMiddleware, listImages);
router.post('/cleanup', rateLimiterMiddleware, cleanupUnusedImages);

export default router; 