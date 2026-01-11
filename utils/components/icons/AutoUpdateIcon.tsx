import React from 'react';

export const AutoUpdateIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 20v-5h-5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 9a9 9 0 0 1 14.13-4.13" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 15a9 9 0 0 1-14.13 4.13" />
    </svg>
);
