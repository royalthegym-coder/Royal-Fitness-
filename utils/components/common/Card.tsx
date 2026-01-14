
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
      className={`bg-white/80 dark:bg-gray-800/60 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-xl rounded-xl transition-all duration-300 hover:shadow-2xl hover:border-amber-500/30 ${className}`} 
      onClick={onClick}
    >
      {title && (
        <div className="border-b border-gray-200/50 dark:border-gray-700/50 px-6 py-4 bg-gradient-to-r from-transparent via-gray-100/10 to-transparent">
          <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-400 shadow-sm">{title}</h3>
        </div>
      )}
      <div className="p-6 relative z-10">
        {children}
      </div>
    </div>
  );
};

export default Card;
