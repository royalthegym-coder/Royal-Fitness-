
import React from 'react';

const IconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={`w-6 h-6 ${className || ''}`}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {children}
    </svg>
  </span>
);

export const DashboardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
    <circle cx="15" cy="15" r="2" fill="currentColor" opacity="0.5">
        <animate attributeName="r" values="1;3;1" dur="2s" repeatCount="indefinite" />
    </circle>
  </IconWrapper>
);
