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
      {/* DevDash Logo - Custom SVG */}
      <div className={`${sizeClasses[size]} flex items-center justify-center font-bold text-foreground`}>
        <svg width="24" height="24" viewBox="0 0 1 1" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path
            d="M0.751042 0.5V0.251042H0.5V0H0V0.5H0.251042V0.751042H0.5V1H1V0.5H0.751042Z"
            fill="currentColor"
          />
        </svg>
      </div>
      
      {showText && (
        <span className={`font-bold ${textSizeClasses[size]} font-sans tracking-tight text-foreground`}>
          DevDash
        </span>
      )}
    </div>
  );
};

export default DevDashLogo;
