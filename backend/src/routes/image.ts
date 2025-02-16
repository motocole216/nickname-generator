import express from 'express';
import { uploadImage, generateNickname } from '../controllers/image';

const router = express.Router();

// Route to handle image upload and nickname generation
router.post('/upload', uploadImage);
router.post('/generate-nickname', generateNickname);

export { router }; 