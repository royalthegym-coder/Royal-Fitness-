
import React from 'react';

const IconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={`w-5 h-5 ${className || ''}`}>{children}</span>
);

export const AetherIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25V4.5m5.25-1.5l-1.125 1.95M20.25 7.5l-1.95 1.125M21.75 12h-2.25m1.125 5.25l-1.95-1.125M17.25 20.25l-1.125-1.95M12 21.75v-2.25m-5.25 1.5l1.125-1.95M3.75 16.5l1.95-1.125M2.25 12h2.25m-1.125-5.25l1.95 1.125M6.75 3.75l1.125 1.95" />
        </svg>
    </IconWrapper>
);
