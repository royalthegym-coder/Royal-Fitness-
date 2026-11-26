import React from 'react';

const IconWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="w-5 h-5">{children}</span>
);

export const HealthIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper>
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    </IconWrapper>
);

export const StepsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper>
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    </IconWrapper>
);

export const HeartRateIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper>
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    </IconWrapper>
);

export const CaloriesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper>
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v11.494m-6.364-8.864L12 3.5m6.364 4.389L12 3.5M6.364 12.747L12 17.5m6.364-4.753L12 17.5m-6.364-8.864l12.728 0m-12.728 5.618l12.728 0" />
        </svg>
    </IconWrapper>
);

export const SleepIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper>
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
    </IconWrapper>
);
