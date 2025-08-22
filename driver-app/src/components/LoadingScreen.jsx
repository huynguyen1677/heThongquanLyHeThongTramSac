import React from 'react';
import { Zap } from 'lucide-react';

const LoadingSpinner = ({ size = 'md', color = 'blue', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    gray: 'border-gray-500',
    white: 'border-white'
  };

  return (
    <div 
      className={`
        animate-spin rounded-full border-2 border-transparent 
        ${colorClasses[color]} border-t-transparent
        ${sizeClasses[size]} 
        ${className}
      `}
      style={{
        borderTopColor: 'transparent'
      }}
    />
  );
};

const LoadingScreen = ({ 
  message = 'Đang tải...', 
  submessage = '', 
  showLogo = true 
}) => {
  return (
    <div className="loading-screen min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
      <div className="text-center">
        {showLogo && (
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center animate-pulse">
              <Zap size={40} className="text-white" />
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-center mb-4">
          <LoadingSpinner size="lg" color="blue" className="mr-3" />
          <span className="text-lg font-medium text-gray-700">{message}</span>
        </div>
        
        {submessage && (
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {submessage}
          </p>
        )}
      </div>
    </div>
  );
};

const InlineLoading = ({ 
  message = 'Đang tải...', 
  size = 'md',
  className = '' 
}) => {
  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <LoadingSpinner size={size} color="blue" className="mr-2" />
      <span className="text-gray-600">{message}</span>
    </div>
  );
};

export { LoadingSpinner, LoadingScreen, InlineLoading };
export default LoadingScreen;
