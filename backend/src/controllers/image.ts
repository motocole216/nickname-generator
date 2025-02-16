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
  apiKey: 'your-openai-api-key-here', // Replace with your actual API key
});

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.body.image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const result = await cloudinary.uploader.upload(req.body.image, {
      folder: 'nicknames'
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

    const nickname = response.choices[0]?.message?.content || 'Cool Person';

    res.status(200).json({ nickname });
  } catch (error) {
    console.error('Error generating nickname:', error);
    res.status(500).json({ error: 'Failed to generate nickname' });
  }
}; 