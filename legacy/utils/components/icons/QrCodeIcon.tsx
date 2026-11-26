
import React from 'react';

export const QrCodeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <span className={`w-5 h-5 ${className}`}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6.5 6.5v-2.5m-4 0v2.5m10-8.94A8.49 8.49 0 0119.5 12a8.49 8.49 0 01-3.44 6.5M4.5 12A8.49 8.49 0 017.94 5.5" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h.01M15 10h.01M9 14h.01M15 14h.01M5 19h2m-2-6h2m10 6h2m-2-6h2M5 5h2M5 9h2m10-4h2M15 5h2" />
        </svg>
    </span>
);
