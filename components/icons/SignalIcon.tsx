
import React from 'react';

export const SignalIcon: React.FC<{ className?: string; strength?: number }> = ({ className, strength = 4 }) => {
    // strength 0-4
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path fillOpacity={strength >= 1 ? 1 : 0.3} d="M2 18h3v4H2z" />
            <path fillOpacity={strength >= 2 ? 1 : 0.3} d="M7 13h3v9H7z" />
            <path fillOpacity={strength >= 3 ? 1 : 0.3} d="M12 8h3v14h-3z" />
            <path fillOpacity={strength >= 4 ? 1 : 0.3} d="M17 3h3v19h-3z" />
        </svg>
    );
};
