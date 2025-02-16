import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadImage = async (imageData: string) => {
  const response = await apiClient.post('/image/upload', { image: imageData });
  return response.data;
};

export const generateNickname = async (imageUrl: string) => {
  const response = await apiClient.post('/image/generate-nickname', { imageUrl });
  return response.data;
};

export default apiClient; 