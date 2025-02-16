import React, { useState } from 'react';
import { uploadImage, generateNickname } from '../api/client';
import ImageUpload from './ImageUpload';
import ResultsDisplay from './ResultsDisplay';

interface GenerationResult {
  nickname: string;
  analysis: string;
  cached?: boolean;
}

const NicknameGenerator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFile, setLastFile] = useState<File | null>(null);

  const handleImageUpload = async (file: File) => {
    setLoading(true);
    setError('');
    setResult(null);
    setLastFile(file);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        try {
          const base64Image = reader.result as string;
          
          // Upload image with retry
          const uploadResult = await uploadImage(base64Image);
          
          // Generate nickname with retry and caching
          const nicknameResult = await generateNickname(uploadResult.url);
          
          setResult({
            nickname: nicknameResult.data.nickname,
            analysis: nicknameResult.data.analysis,
            cached: nicknameResult.cached
          });
          
          setRetryCount(0); // Reset retry count on success
        } catch (err: any) {
          const errorMessage = err.response?.data?.error || 'Failed to process image';
          setError(errorMessage);
          setRetryCount(prev => prev + 1);
        }
      };

      reader.onerror = () => {
        setError('Failed to read image file');
      };
    } catch (err) {
      setError('Failed to process image');
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (retryCount < 3 && lastFile) {
      setError('');
      setResult(null);
      // The retry logic is handled by the withRetry utility
      handleImageUpload(lastFile);
    } else {
      setError('Maximum retry attempts reached or no file to retry. Please try again later.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-xl">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        AI Nickname Generator
      </h1>
      
      <ImageUpload onUpload={handleImageUpload} isLoading={loading} />
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 rounded-lg">
          <p className="text-red-700">{error}</p>
          {retryCount < 3 && lastFile && (
            <button
              onClick={handleRetry}
              className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
            >
              Try Again
            </button>
          )}
        </div>
      )}
      
      {result && !error && (
        <div className="mt-8">
          <div className="p-6 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Your Nickname</h2>
              {result.cached && (
                <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
                  Cached
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-indigo-600 mb-4">{result.nickname}</p>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Analysis</h3>
              <p className="text-gray-700">{result.analysis}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NicknameGenerator; 