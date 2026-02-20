
import React from 'react';

export const FitbitIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <circle cx="12" cy="12" r="2.5" />
        <circle cx="3.5" cy="12" r="2" />
        <circle cx="20.5" cy="12" r="2" />
        <circle cx="12" cy="3.5" r="2" />
        <circle cx="12" cy="20.5" r="2" />
        <circle cx="6" cy="6" r="1.5" opacity="0.5" />
        <circle cx="18" cy="6" r="1.5" opacity="0.5" />
        <circle cx="6" cy="18" r="1.5" opacity="0.5" />
        <circle cx="18" cy="18" r="1.5" opacity="0.5" />
    </svg>
);
