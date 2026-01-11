
import React from 'react';

export const SmartBandIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="8" y="2" width="8" height="20" rx="3" />
        <path d="M12 6v2" />
        <path d="M12 16v2" />
        <rect x="9.5" y="9" width="5" height="6" rx="1" fill="currentColor" fillOpacity="0.1" />
    </svg>
);
