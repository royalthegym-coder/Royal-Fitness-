
import React from 'react';

const RoyalGradient = () => (
    <defs>
        <linearGradient id="royal-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="50%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
    </defs>
);

const IconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={`w-6 h-6 ${className}`}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="url(#royal-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <RoyalGradient />
        {children}
    </svg>
  </span>
);

export const DollarSignIcon: React.FC<{className?: string}> = ({ className }) => (
    <IconWrapper className={className}>
        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </IconWrapper>
);
