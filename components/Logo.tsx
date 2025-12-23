
import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`${sizes[size]} ${className} relative flex items-center justify-center`}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        {/* Lock Body - Solid Professional Base */}
        <rect x="20" y="45" width="60" height="45" rx="12" className="fill-govblue dark:fill-blue-500" />
        
        {/* Open Shackle - Styled as a Bar Chart / Growth */}
        <path 
          d="M35 45V30C35 21.7157 41.7157 15 50 15C58.2843 15 65 21.7157 65 30H75C75 16.1929 63.8071 5 50 5C36.1929 5 25 16.1929 25 30V45H35Z" 
          className="fill-govgreen dark:fill-green-400"
        />
        
        {/* Decorative Growth Bars on the Shackle */}
        <rect x="28" y="25" width="4" height="8" rx="1" className="fill-white opacity-40" />
        <rect x="38" y="18" width="4" height="12" rx="1" className="fill-white opacity-40" />
        <rect x="48" y="12" width="4" height="15" rx="1" className="fill-white opacity-40" />

        {/* Intelligence Spark / Keyhole */}
        <circle cx="50" cy="67" r="6" className="fill-govorange" />
        <path d="M50 73V80" stroke="white" strokeWidth="3" strokeLinecap="round" className="opacity-80" />
      </svg>
    </div>
  );
};

export const OldLogo: React.FC<LogoProps> = ({ size = 'md' }) => {
    const sizes = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-16 h-16',
        xl: 'w-24 h-24'
    };
    return (
        <div className={`relative ${sizes[size]} flex items-center justify-center`}>
            <div className="absolute bottom-0 w-full h-3/5 bg-govblue rounded-md shadow-sm z-10"></div>
            <div className="absolute -top-1 right-0 w-5/8 h-3/4 border-4 border-govgreen rounded-t-full transform translate-x-1 -translate-y-1"></div>
            <div className="absolute bottom-1/4 w-1/4 h-1/4 bg-govorange rounded-full z-20"></div>
        </div>
    );
};

export default Logo;
