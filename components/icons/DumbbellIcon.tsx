import React from 'react';

export const DumbbellIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 8V6a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 16v2a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16v2a2 2 0 002 2h4a2 2 0 002-2v-2" />
    </svg>
);