
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, onClick }) => {
  return (
    <div 
      className={`bg-white/5 dark:bg-gray-800/30 backdrop-blur-xl border border-white/10 dark:border-gray-700/30 shadow-2xl rounded-2xl transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-amber-500/10 hover:border-amber-500/30' : ''} ${className}`} 
      onClick={onClick}
    >
      {title && (
        <div className="border-b border-white/5 dark:border-gray-700/50 px-6 py-4">
          <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">{title}</h3>
        </div>
      )}
      <div className="p-6 relative z-10">
        {children}
      </div>
    </div>
  );
};

export default Card;
