import React, { useState } from 'react';
import ImageUpload from '../components/ImageUpload';
import ResultsDisplay from '../components/ResultsDisplay';

const Generate: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);

  const handleImageUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: Implement API call to backend
      // For now, just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      setResults(['Nickname 1', 'Nickname 2', 'Nickname 3']);
    } catch (err) {
      setError('Failed to generate nicknames. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
        Generate Your Nicknames
      </h1>
      
      <ImageUpload onUpload={handleImageUpload} isLoading={isLoading} />
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {results.length > 0 && (
        <ResultsDisplay results={results} />
      )}
    </div>
  );
};

export default Generate; 