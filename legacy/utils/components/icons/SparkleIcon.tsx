
import React from 'react';

export const SparkleIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M19 3v4M17 5h4M14 21v-4M12 19h4M12 8a2 2 0 100-4 2 2 0 000 4zM3 15a2 2 0 100-4 2 2 0 000 4zM21 15a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
);
