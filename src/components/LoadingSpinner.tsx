import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message = 'Carregando dados...', 
  fullScreen = false 
}) => {
  const spinnerSize = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  const content = (
    <div className="text-center">
      <div className={`relative ${spinnerSize[size]} mx-auto mb-4`}>
        <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-[#3D5AFE] animate-spin"></div>
        <div className="absolute inset-1 rounded-full border-r-2 border-l-2 border-[#00E676] animate-pulse"></div>
      </div>
      {message && <p className="text-gray-300 font-light text-sm mt-2">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      {content}
    </div>
  );
};

export default LoadingSpinner;