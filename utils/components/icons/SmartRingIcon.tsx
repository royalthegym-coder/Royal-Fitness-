
import React from 'react';

export const SmartRingIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="7" />
        <path d="M12 5v2m0 10v2m7-7h-2M7 12H5" opacity="0.5"/>
        <path d="M16.95 7.05l-1.41 1.41M8.46 15.54l-1.41 1.41M16.95 16.95l-1.41-1.41M8.46 8.46l-1.41-1.41" opacity="0.5"/>
        <circle cx="12" cy="12" r="9" strokeOpacity="0.2" />
    </svg>
);
