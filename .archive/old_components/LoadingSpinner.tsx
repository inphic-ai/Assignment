import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-stone-200 border-t-orange-500 rounded-full animate-spin"></div>
        <p className="text-stone-500 text-sm">載入中...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
