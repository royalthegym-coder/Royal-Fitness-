
import React from 'react';
import { GYM_INFO } from '../../../constants';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'receipt' | 'custom';
  showText?: boolean;
  className?: string;
  customSizeClass?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', showText = true, className = '', customSizeClass }) => {
  
  // Size mapping for the container/image
  const sizeClasses: Record<string, string> = {
    sm: 'h-8 w-8',
    md: 'h-16 w-16', 
    lg: 'h-20 w-20',
    xl: 'h-24 w-24',
    '2xl': 'h-32 w-32', 
    '3xl': 'h-56 w-56',
    receipt: 'h-24 w-24',
    custom: customSizeClass || 'h-16 w-16',
  };

  // Text size mapping
  const textSizes: Record<string, string> = {
    sm: 'text-sm',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-3xl',
    '2xl': 'text-4xl',
    '3xl': 'text-6xl',
    receipt: 'text-3xl',
    custom: 'text-xl',
  };

  // Subtext size mapping
  const subTextSizes: Record<string, string> = {
    sm: 'text-[0.5rem]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-sm',
    '2xl': 'text-base',
    '3xl': 'text-lg',
    receipt: 'text-xs',
    custom: 'text-xs',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* 🦁 Logo Image with Glow Effect */}
      <div className="relative group">
        <div className={`absolute -inset-2 ${size === '2xl' ? 'bg-amber-500/40' : 'bg-yellow-500/20'} rounded-full blur-xl opacity-0 group-hover:opacity-100 transition duration-500`}></div>
        <img 
          src={GYM_INFO.logo} 
          alt="Royal The Gym" 
          className={`${sizeClasses[size] || sizeClasses.md} object-contain drop-shadow-2xl filter transition-transform hover:scale-105 z-10 relative`}
          onError={(e) => {
             (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>

      {/* 👑 Golden Text (Royal The Gym) */}
      {showText && (
        <div className="flex flex-col justify-center">
          <h1 className={`${textSizes[size] || textSizes.md} font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-600 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] leading-none`}>
            ROYAL
          </h1>
          <span className={`text-white/80 font-bold tracking-[0.2em] uppercase ${subTextSizes[size] || subTextSizes.md}`}>
            THE GYM
          </span>
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
