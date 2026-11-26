
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
  glow?: 'none' | 'amber' | 'cyan' | 'purple' | 'red' | 'green';
}

const Card: React.FC<CardProps> = ({ children, className = '', title, onClick, glow = 'none' }) => {
  
  const glowStyles = {
    none: 'hover:border-white/20',
    amber: 'hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]',
    cyan: 'hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]',
    purple: 'hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]',
    red: 'hover:border-red-500/50 hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]',
    green: 'hover:border-green-500/50 hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]'
  };

  return (
    <div 
      className={`glass-panel rounded-[2.5rem] overflow-hidden transition-all duration-500 relative group ${onClick ? 'cursor-pointer transform hover:-translate-y-1' : ''} ${glowStyles[glow]} ${className}`} 
      onClick={onClick}
    >
      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

      {title && (
        <div className="px-8 py-6 border-b border-white/5 relative z-10 flex items-center justify-between bg-black/20">
          <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400 uppercase tracking-widest italic">{title}</h3>
          <div className="h-1.5 w-1.5 rounded-full bg-white/20 group-hover:bg-amber-500 transition-colors duration-500 shadow-[0_0_10px_currentColor]"></div>
        </div>
      )}
      
      <div className={`relative z-10 w-full h-full ${title ? 'p-6' : 'p-0'}`}>
        {children}
      </div>
    </div>
  );
};

export default Card;
