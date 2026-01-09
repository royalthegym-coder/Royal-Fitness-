
import React from 'react';

export const NfcIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4h-4v-4H8m1-9v6m0 0v6m0-6h6m-6 0H4m12-4h.01M16 16h.01M16 12h.01M8 8h.01M8 12h.01M8 16h.01" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18v18H3z" opacity="0.1"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 8h4m-4 4h4m-4 4h4" />
    </svg>
);
