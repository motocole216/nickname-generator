import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import OpenAI from 'openai';
import { cacheService } from '../services/cache';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure OpenAI with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Image validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_DIMENSION = 2048;

export const validateImage = (base64String: string): { valid: boolean; error?: string } => {
  // Check if the string is a valid base64 image
  const match = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  
  if (!match) {
    return { valid: false, error: 'Invalid image format' };
  }

  const mimeType = match[1];
  const base64Data = match[2];
  
  // Check file type
  if (!ALLOWED_FORMATS.includes(mimeType)) {
    return { valid: false, error: 'Unsupported file type. Please use JPEG, PNG, or WebP' };
  }
  
  // Check file size
  const sizeInBytes = Buffer.from(base64Data, 'base64').length;
  if (sizeInBytes > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 5MB limit' };
  }
  
  return { valid: true };
};

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.body.image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Validate image
    const validation = validateImage(req.body.image);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Upload with optimization settings
    const result = await cloudinary.uploader.upload(req.body.image, {
      folder: 'nicknames',
      transformation: [
        { width: MAX_IMAGE_DIMENSION, height: MAX_IMAGE_DIMENSION, crop: 'limit' },
        { quality: 'auto:good', fetch_format: 'auto' }
      ],
      resource_type: 'image'
    });

    res.status(200).json({ 
      url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
};

export const deleteImage = async (req: Request, res: Response) => {
  try {
    const { public_id } = req.params;
    
    if (!public_id) {
      return res.status(400).json({ error: 'No image ID provided' });
    }

    // Delete the image from Cloudinary
    const result = await cloudinary.uploader.destroy(public_id);
    
    if (result.result === 'ok') {
      res.status(200).json({ message: 'Image deleted successfully' });
    } else {
      res.status(404).json({ error: 'Image not found or already deleted' });
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
};

export const cleanupUnusedImages = async (req: Request, res: Response) => {
  try {
    // Get list of images older than 24 hours
    const result = await cloudinary.search
      .expression('folder:nicknames AND uploaded_at<1d')
      .execute();

    const deletedImages = [];
    for (const resource of result.resources) {
      await cloudinary.uploader.destroy(resource.public_id);
      deletedImages.push(resource.public_id);
    }

    res.status(200).json({ 
      message: 'Cleanup completed',
      deletedCount: deletedImages.length,
      deletedImages
    });
  } catch (error) {
    console.error('Error cleaning up images:', error);
    res.status(500).json({ error: 'Failed to cleanup images' });
  }
};

export const generateNickname = async (req: Request, res: Response) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'No image URL provided' });
    }

    // Check cache first
    const cacheKey = `nickname:${imageUrl}`;
    const cachedResult = cacheService.get<{ nickname: string, analysis: string }>(cacheKey);
    
    if (cachedResult) {
      return res.status(200).json({
        success: true,
        data: cachedResult,
        cached: true
      });
    }

    // If not in cache, generate new nickname
    const imageAnalysis = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this image and describe the main subject, focusing on notable features, colors, and characteristics that could inspire a creative nickname. Be concise." },
            { type: "image_url", image_url: { url: imageUrl } }
          ],
        },
      ],
      max_tokens: 150,
    });

    const imageDescription = imageAnalysis.choices[0]?.message?.content || '';

    const nicknameResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a creative nickname generator. Generate a fun, memorable, and appropriate nickname based on the image description provided. The nickname should be 1-3 words long and suitable for all audiences."
        },
        {
          role: "user",
          content: `Based on this image description, generate a creative nickname: ${imageDescription}`
        }
      ],
      max_tokens: 50,
      temperature: 0.8,
    });

    const nickname = nicknameResponse.choices[0]?.message?.content?.trim() || 'Mysterious Being';

    const result = {
      nickname,
      analysis: imageDescription
    };

    // Cache the result
    cacheService.set(cacheKey, result);

    return res.status(200).json({
      success: true,
      data: result,
      cached: false
    });

  } catch (error) {
    console.error('Error generating nickname:', error);
    res.status(500).json({ error: 'Failed to generate nickname' });
  }
};

// Rate limiting middleware
export const rateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: new Map<string, number>(),
  maxRequestsPerWindow: 10, // Maximum requests per window

  resetCounter: function() {
    this.maxRequests.clear();
  },

  increment: function(ip: string): boolean {
    const currentRequests = this.maxRequests.get(ip) || 0;
    if (currentRequests >= this.maxRequestsPerWindow) {
      return false;
    }
    this.maxRequests.set(ip, currentRequests + 1);
    return true;
  }
};

// Reset the rate limiter counter every window
export const rateLimiterInterval = setInterval(() => rateLimiter.resetCounter(), rateLimiter.windowMs);

export const generateImage = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'No prompt provided' });
    }

    // Check rate limit
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (!rateLimiter.increment(clientIp)) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    // Generate image description using OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500
    });

    const imageDescription = response.choices[0]?.message?.content;
    if (!imageDescription) {
      throw new Error('Failed to generate image description');
    }

    // Upload image to Cloudinary (imageDescription is now guaranteed to be string)
    const uploadResult = await cloudinary.uploader.upload(imageDescription, {
      folder: 'nicknames'
    });

    res.status(200).json({
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id
    });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: 'Failed to generate image description' });
  }
};

export const listImages = async (req: Request, res: Response) => {
  try {
    const result = await cloudinary.search
      .expression('folder:nicknames')
      .execute();

    res.status(200).json({
      images: result.resources
    });
  } catch (error) {
    console.error('Error listing images:', error);
    res.status(500).json({ error: 'Failed to list images' });
  }
}; 