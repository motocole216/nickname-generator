import axios from 'axios';
import { withRetry } from '../utils/retry';
import { nicknameCache } from '../utils/cache';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  maxBodyLength: Infinity, // Allow large payloads for base64 images
  maxContentLength: Infinity,
});

export const uploadImage = async (imageData: string) => {
  return withRetry(async () => {
    try {
      const response = await apiClient.post('/image/upload', { image: imageData });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  });
};

export const generateNickname = async (imageUrl: string) => {
  // Check cache first
  const cacheKey = `nickname:${imageUrl}`;
  const cachedResult = nicknameCache.get(cacheKey);
  
  if (cachedResult) {
    return { ...cachedResult, cached: true };
  }

  // If not in cache, make API request with retry
  const result = await withRetry(async () => {
    const response = await apiClient.post('/image/generate-nickname', { imageUrl });
    return response.data;
  });

  // Cache the result if successful
  if (result.success && result.data) {
    nicknameCache.set(cacheKey, result.data);
  }

  return { ...result, cached: false };
};

export default apiClient; 