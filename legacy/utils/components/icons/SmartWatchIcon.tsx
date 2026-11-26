
import React from 'react';

const IconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={className || "w-5 h-5"}>{children}</span>
);

export const SmartWatchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    </IconWrapper>
);
