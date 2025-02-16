import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import OpenAI from 'openai';

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

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Generate a fun, creative nickname based on this image. Keep it friendly and appropriate." },
            { type: "image_url", image_url: imageUrl }
          ],
        },
      ],
    });

    if (!response?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    const nickname = response.choices[0].message.content;
    res.status(200).json({ nickname });
  } catch (error) {
    console.error('Error generating nickname:', error);
    res.status(500).json({ error: 'Failed to generate nickname' });
  }
}; 