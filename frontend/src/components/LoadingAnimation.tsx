import React from 'react';

const LoadingAnimation = () => {
  return (
    <div className="flex justify-center items-center h-screen w-full">
      <div className="flex space-x-2">
        {/* Connect 4 pieces */}
        <div className="w-16 h-16 bg-red-500 rounded-full animate-bounce"></div>
        <div className="w-16 h-16 bg-yellow-400 rounded-full animate-bounce delay-200"></div>
        <div className="w-16 h-16 bg-red-500 rounded-full animate-bounce delay-400"></div>
        <div className="w-16 h-16 bg-yellow-400 rounded-full animate-bounce delay-600"></div>
      </div>
    </div>
  );
};

export default LoadingAnimation; 