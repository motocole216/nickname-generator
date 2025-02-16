import OpenAI from 'openai';
import { config } from '../config/env';
import { AppError } from '../middleware/error';

export const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
  timeout: 30000, // 30 second timeout
  maxRetries: 3
});

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000
};

async function withRetry<T>(
  operation: () => Promise<T>,
  retryConfig: RetryConfig = defaultRetryConfig
): Promise<T> {
  let lastError: Error;
  let delay = retryConfig.initialDelay;

  for (let attempt = 1; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Don't retry if it's a validation error or if we've run out of attempts
      if (error.status === 400 || attempt === retryConfig.maxRetries) {
        throw error;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * 2, retryConfig.maxDelay);
    }
  }

  throw lastError!;
}

export async function analyzeImage(imageUrl: string): Promise<string> {
  return withRetry(async () => {
    try {
      console.log('Analyzing image:', imageUrl);
      
      // Since we don't have Vision API access yet, let's use GPT-4 Turbo
      // with a basic description of the image
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert at analyzing images and creating concise, descriptive summaries that capture the essence of what you see."
          },
          {
            role: "user",
            content: `The image URL is: ${imageUrl}. Please provide a brief description focusing on notable features, colors, and characteristics that could inspire a creative nickname. Note: Since you cannot see the image directly, focus on generating a creative description based on any visual cues in the URL or filename.`
          }
        ],
        max_tokens: 150,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new AppError('Failed to generate image analysis', 500);
      }

      return content;
    } catch (error: any) {
      console.error('OpenAI API Error:', {
        status: error.status,
        message: error.message,
        details: error.response?.data || error
      });

      if (error.status === 429) {
        throw new AppError('Rate limit exceeded. Please try again later.', 429);
      }
      if (error.status === 401) {
        throw new AppError('Invalid API key or unauthorized access', 401);
      }
      if (error.status === 400) {
        throw new AppError(`Bad request: ${error.message}`, 400);
      }
      throw new AppError(`OpenAI service error: ${error.message}`, 500);
    }
  });
}

export async function generateNicknameFromDescription(description: string): Promise<string> {
  return withRetry(async () => {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",  // This model we have access to
        messages: [
          {
            role: "system",
            content: "You are a creative nickname generator. Generate a fun, memorable, and appropriate nickname based on the image description provided. The nickname should be 1-3 words long and suitable for all audiences."
          },
          {
            role: "user",
            content: `Based on this image description, generate a creative nickname: ${description}`
          }
        ],
        max_tokens: 50,
        temperature: 0.8,
      });

      const nickname = response.choices[0]?.message?.content?.trim();
      if (!nickname) {
        throw new AppError('Failed to generate nickname', 500);
      }

      return nickname;
    } catch (error: any) {
      console.error('OpenAI API Error:', {
        status: error.status,
        message: error.message,
        details: error.response?.data || error
      });
      
      if (error.status === 429) {
        throw new AppError('Rate limit exceeded. Please try again later.', 429);
      }
      throw new AppError(`OpenAI service error: ${error.message}`, 500);
    }
  });
} 