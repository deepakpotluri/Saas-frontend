import React from 'react';

const LoadingSpinner = ({ small = false }) => {
  return (
    <div className={`flex ${small ? 'justify-start' : 'justify-center'} items-center py-${small ? '2' : '16'}`}>
      <div className={`animate-spin rounded-full ${small ? 'h-6 w-6' : 'h-12 w-12'} border-t-2 border-b-2 border-blue-400`}></div>
      <span className={`ml-4 ${small ? 'text-sm' : 'text-lg'} text-gray-600`}>
        {small ? 'Loading...' : 'Loading data...'}
      </span>
    </div>
  );
};

export default LoadingSpinner;