export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export interface NicknameResult {
  nickname: string;
  analysis: string;
}

export interface ImageUploadResult {
  success: boolean;
  imageUrl: string;
  public_id: string;
}

export interface ImageDeleteResult {
  success: boolean;
  message: string;
}

export interface ImageListResult {
  success: boolean;
  images: any[];
}

export interface CleanupResult {
  success: boolean;
  message: string;
  deletedCount: number;
  deletedImages: string[];
} 