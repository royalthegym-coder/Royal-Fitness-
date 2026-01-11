
import React from 'react';

const IconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={`w-5 h-5 ${className || ''}`}>{children}</span>
);

export const ServerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 0 0-3 3m16.5-6h.008v.008H21.75v-.008Zm-.008 6h.008v.008H21.75v-.008Zm0-9h.008v.008H21.75v-.008ZM3 14.25a3 3 0 0 1 3-3m13.5 6a3 3 0 0 0 3-3m-16.5-6a3 3 0 0 1 3-3m13.5 6a3 3 0 0 0 3-3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 19.5h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 0 0 3 3m13.5-6a3 3 0 0 1 3 3m-16.5 0h.008v.008H5.25v-.008Zm16.5 0h.008v.008H21.75v-.008ZM5.25 4.5h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 0 0 3 3m13.5-6a3 3 0 0 1 3 3m-16.5 0h.008v.008H5.25v-.008Zm16.5 0h.008v.008H21.75v-.008Z" />
        </svg>
    </IconWrapper>
);
