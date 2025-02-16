import { ImageValidationResult } from '../types/image';

// Image validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_DIMENSION = 2048;

export const validateImage = (base64String: string): ImageValidationResult => {
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
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }
  
  return { valid: true };
}; 