import React from 'react';

interface DevDashLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const DevDashLogo: React.FC<DevDashLogoProps> = ({ 
  size = 'md', 
  showText = true, 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* DevDash Logo - Code Symbol */}
      <div className={`${sizeClasses[size]} flex items-center justify-center font-bold text-primary`}>
        <span className="text-xl font-mono">&lt;/&gt;</span>
      </div>
      
      {showText && (
        <span className={`font-bold ${textSizeClasses[size]} font-mono tracking-tight text-primary`}>
          DevDash
        </span>
      )}
    </div>
  );
};

export default DevDashLogo;
