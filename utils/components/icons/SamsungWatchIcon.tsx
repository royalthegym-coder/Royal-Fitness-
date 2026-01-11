
import React from 'react';

export const SamsungWatchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2C7.58 2 4 5.58 4 10v4c0 4.42 3.58 8 8 8s8-3.58 8-8v-4c0-4.42-3.58-8-8-8zm0 18c-3.31 0-6-2.69-6-6v-4c0-3.31 2.69-6 6-6s6 2.69 6 6v4c0 3.31-2.69 6-6 6z" opacity="0.3"/>
        <path d="M9 22h6c.55 0 1-.45 1-1v-2h-8v2c0 .55.45 1 1 1zm0-20h6c.55 0 1 .45 1 1v2h-8V3c0-.55.45-1 1-1z" />
        <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="2" fill="none"/>
        <circle cx="12" cy="12" r="2" fill="currentColor"/>
        <path d="M12 12l2.5 -2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);
