
import React from 'react';

const IconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={`w-6 h-6 ${className || ''}`}>{children}</span>
);

export const SmartBandIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className}>
         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <rect x="6" y="4" width="12" height="16" rx="3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 10h6" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v2" />
        </svg>
    </IconWrapper>
);
