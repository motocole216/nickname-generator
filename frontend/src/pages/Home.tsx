import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Welcome to Nickname Generator
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        Upload your photo and get unique, personalized nicknames based on your appearance!
      </p>
      <Link
        to="/generate"
        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
      >
        Get Started
      </Link>
    </div>
  );
};

export default Home; 