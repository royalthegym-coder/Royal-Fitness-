
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
      {/* 🦁 Custom SVG Logo */}
      <div className={`relative group ${sizeClasses[size] || sizeClasses.md}`}>
        <div className={`absolute -inset-2 ${size === '2xl' ? 'bg-amber-500/40' : 'bg-yellow-500/20'} rounded-full blur-xl opacity-0 group-hover:opacity-100 transition duration-500`}></div>
        
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl filter transition-transform hover:scale-105 z-10 relative">
            <defs>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FCD34D" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#B45309" />
                </linearGradient>
                <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0f172a" />
                    <stop offset="100%" stopColor="#1e3a8a" />
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>

            {/* Outer Ring */}
            <circle cx="100" cy="100" r="95" fill="url(#blueGradient)" stroke="url(#goldGradient)" strokeWidth="6" />
            <circle cx="100" cy="100" r="88" fill="none" stroke="#000" strokeOpacity="0.5" strokeWidth="1" />
            
            {/* Inner Decorative Ring */}
            <circle cx="100" cy="100" r="72" fill="none" stroke="url(#goldGradient)" strokeWidth="2" strokeDasharray="3 3" />

            {/* Text Paths */}
            <path id="topCurve" d="M 25,100 A 75,75 0 0,1 175,100" fill="none" />
            <path id="bottomCurve" d="M 35,100 A 65,65 0 0,0 165,100" fill="none" />

            {/* Text */}
            <text width="200" fontSize="26" fontWeight="900" fontFamily="serif" letterSpacing="4" fill="url(#goldGradient)" style={{ textShadow: '1px 1px 2px black' }}>
                <textPath href="#topCurve" startOffset="50%" textAnchor="middle">ROYAL</textPath>
            </text>
            
            {/* For bottom text, we need to reverse the path or adjust. Using a simpler method for bottom text often works better with separate path definition or just flipping. 
                Let's use a path that goes left-to-right but follows the bottom arc.
            */}
            <path id="bottomCurveFixed" d="M 30,100 A 70,70 0 0,0 170,100" fill="none" />
            {/* Actually, to make text upright on bottom, we need to draw path from right to left (170 to 30) */}
            <path id="bottomCurveCorrect" d="M 165,100 A 65,65 0 0,1 35,100" fill="none" />
            
            <text width="200" fontSize="18" fontWeight="bold" fontFamily="serif" letterSpacing="3" fill="url(#goldGradient)" style={{ textShadow: '1px 1px 2px black' }}>
                <textPath href="#bottomCurveCorrect" startOffset="50%" textAnchor="middle">THE GYM</textPath>
            </text>

            {/* Central Lion/Crown Composition */}
            <g transform="translate(100, 105)">
                 {/* Lion Face Base (Shield-like) */}
                 <path d="M-25 -20 C -25 -20, -35 0, -25 25 C -15 45, 0 55, 0 55 C 0 55, 15 45, 25 25 C 35 0, 25 -20, 25 -20 Z" fill="url(#goldGradient)" stroke="#78350f" strokeWidth="1" />
                 
                 {/* Eyes */}
                 <circle cx="-10" cy="0" r="3" fill="#000" />
                 <circle cx="10" cy="0" r="3" fill="#000" />
                 
                 {/* Nose */}
                 <path d="M-5 15 L5 15 L0 25 Z" fill="#000" />

                 {/* Crown (On top of Lion) */}
                 <g transform="translate(0, -35)">
                    <path d="M-20 0 L-10 15 L0 -5 L10 15 L20 0 L20 20 L-20 20 Z" fill="url(#goldGradient)" stroke="#78350f" strokeWidth="1" />
                    <circle cx="0" cy="-5" r="3" fill="url(#goldGradient)" />
                    <circle cx="-20" cy="0" r="2" fill="url(#goldGradient)" />
                    <circle cx="20" cy="0" r="2" fill="url(#goldGradient)" />
                 </g>

                 {/* Dumbbells (Behind) */}
                 <g transform="translate(0, 0) rotate(45)" opacity="0.8">
                    <rect x="-40" y="-4" width="80" height="8" fill="url(#goldGradient)" rx="2" />
                    <rect x="-45" y="-10" width="10" height="20" fill="url(#goldGradient)" rx="2" />
                    <rect x="35" y="-10" width="10" height="20" fill="url(#goldGradient)" rx="2" />
                 </g>
                 <g transform="translate(0, 0) rotate(-45)" opacity="0.8">
                    <rect x="-40" y="-4" width="80" height="8" fill="url(#goldGradient)" rx="2" />
                    <rect x="-45" y="-10" width="10" height="20" fill="url(#goldGradient)" rx="2" />
                    <rect x="35" y="-10" width="10" height="20" fill="url(#goldGradient)" rx="2" />
                 </g>
            </g>
        </svg>
      </div>

      {/* 👑 Side Text (Optional - for when logo is small or needs label) */}
      {showText && (
        <div className="flex flex-col justify-center">
          <h1 className={`${textSizes[size] || textSizes.md} font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-600 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] leading-none`}>
            ROYAL
          </h1>
          <span className={`text-white/80 font-bold tracking-[0.2em] uppercase ${size === 'sm' ? 'text-[0.5rem]' : 'text-xs'}`}>
            THE GYM
          </span>
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
