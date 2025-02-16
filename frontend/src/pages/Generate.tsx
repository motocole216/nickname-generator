import React from 'react';
import NicknameGenerator from '../components/NicknameGenerator';

const Generate: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Generate Your AI Nickname
          </h1>
          <p className="text-lg text-gray-600">
            Upload a photo and let our AI create a unique nickname just for you!
          </p>
        </div>
        
        <NicknameGenerator />
        
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Our AI analyzes your photo and generates a creative nickname based on what it sees.
            Results are cached for 24 hours for faster retrieval.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Generate; 