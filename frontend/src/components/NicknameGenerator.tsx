import React, { useState } from 'react';
import { uploadImage, generateNickname } from '../api/client';

const NicknameGenerator: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [nickname, setNickname] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setError('');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = async () => {
        try {
          const base64Image = reader.result as string;
          
          // Upload image
          const uploadResult = await uploadImage(base64Image);
          
          // Generate nickname
          const nicknameResult = await generateNickname(uploadResult.url);
          setNickname(nicknameResult.nickname);
        } catch (err) {
          setError('Failed to process image. Please try again.');
          console.error('Error:', err);
        } finally {
          setLoading(false);
        }
      };
    } catch (err) {
      setError('Failed to read image file');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
      <h1 className="text-2xl font-bold text-center mb-6">AI Nickname Generator</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Upload your photo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !selectedFile}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 ${
            (loading || !selectedFile) && 'opacity-50 cursor-not-allowed'
          }`}
        >
          {loading ? 'Generating...' : 'Generate Nickname'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {nickname && !error && (
        <div className="mt-6 p-4 bg-green-50 rounded-md">
          <h2 className="text-lg font-semibold text-green-800">Your Nickname:</h2>
          <p className="mt-2 text-xl text-green-700">{nickname}</p>
        </div>
      )}
    </div>
  );
};

export default NicknameGenerator; 