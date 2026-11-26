
import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'receipt' | 'custom';
  showText?: boolean;
  className?: string;
  customSizeClass?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', showText = true, className = '', customSizeClass }) => {
  
  // Size mapping for the container
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

  // Text size mapping (for the side text if enabled)
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

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* 🚀 Custom SVG Logo */}
      <div className={`relative group ${sizeClasses[size] || sizeClasses.md}`}>
        <div className={`absolute -inset-2 ${size === '2xl' ? 'bg-cyan-500/40' : 'bg-blue-500/20'} rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500 transform rotate-45`}></div>
        
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl filter transition-transform duration-500 group-hover:scale-105 z-10 relative">
            <defs>
                <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00FF00" />
                    <stop offset="50%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                <linearGradient id="neonGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00FF00" />
                    <stop offset="100%" stopColor="#4ade80" />
                </linearGradient>
                <linearGradient id="darkBgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e1b4b" />
                    <stop offset="100%" stopColor="#020617" />
                </linearGradient>
                <filter id="hyperIntensity">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <filter id="subtleGlow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Glowing Aura Background */}
            <circle cx="100" cy="100" r="75" fill="url(#primaryGradient)" opacity="0.15" filter="url(#hyperIntensity)" />

            {/* Futuristic Outer Ring Structure */}
            <circle cx="100" cy="100" r="85" fill="none" stroke="url(#neonGlow)" strokeWidth="1.5" strokeDasharray="10 15" opacity="0.6" className="origin-center animate-[spin_20s_linear_infinite]" />
            <circle cx="100" cy="100" r="95" fill="none" stroke="url(#primaryGradient)" strokeWidth="0.5" opacity="0.3" />

            {/* Central Hexagon Core */}
            <path d="M 100 20 L 170 60 L 170 140 L 100 180 L 30 140 L 30 60 Z" fill="url(#darkBgGradient)" stroke="url(#primaryGradient)" strokeWidth="3" strokeLinejoin="round" />
            
            {/* Dynamic Abstract Fitness Motif (Double F forming a lightning/kettlebell hybrid) */}
            <g transform="translate(100, 100)" filter="url(#hyperIntensity)">
                {/* Slanted dynamic lines to represent motion and speed */}
                <path d="M -30 -40 L -5 -40 L 10 -15 L 30 -15 L 10 20 L -10 20 L -25 -5 L -45 -5 Z" fill="url(#neonGlow)" />
                {/* Second interrelated wave forming the second 'F' */}
                <path d="M -10 -5 L 15 -5 L 35 25 L 15 25 L 5 45 L -20 45 L -5 15 L -25 15 Z" fill="#ffffff" opacity="0.9" />
                
                {/* Energy Sphere in the center */}
                <circle cx="-5" cy="5" r="8" fill="#ffffff" filter="url(#subtleGlow)" />
            </g>

            {/* Technical HUD accoutrements */}
            <path d="M 30 60 L 45 60 M 170 60 L 155 60 M 100 20 L 100 35 M 100 180 L 100 165" stroke="url(#primaryGradient)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {/* 🔮 Side Text */}
      {showText && (
        <div className="flex flex-col justify-center">
          <h1 className={`${textSizes[size] || textSizes.md} font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] leading-none italic`}>
            FITNESS
          </h1>
          <span className={`text-amber-400 font-bold tracking-[0.3em] uppercase ${size === 'sm' ? 'text-[0.45rem]' : 'text-[0.65rem]'} mt-1`}>
            FUTURE • PRO APP
          </span>
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
