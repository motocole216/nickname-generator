import React from 'react';

interface ResultsDisplayProps {
  results: string[];
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        Your Generated Nicknames
      </h2>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((nickname, index) => (
          <div
            key={index}
            className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <p className="text-lg font-medium text-gray-900">{nickname}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsDisplay; 