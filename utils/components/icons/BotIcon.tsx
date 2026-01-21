
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
  <span className={`w-6 h-6 ${className || ''}`}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="url(#royal-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <RoyalGradient />
        {children}
    </svg>
  </span>
);

export const BotIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className}>
        <path d="M7.5 8.25v-1.5a3.375 3.375 0 013.375-3.375h1.5a3.375 3.375 0 013.375 3.375v1.5M9 11.25h6M9 15h6m-6.75-4.5h.008v.008H8.25v-.008zm4.5 0h.008v.008h-.008v-.008zm4.5 0h.008v.008h-.008v-.008zm-12 3.75a3 3 0 013-3h12a3 3 0 013 3v6a3 3 0 01-3 3H6a3 3 0 01-3-3v-6z" />
    </IconWrapper>
);
