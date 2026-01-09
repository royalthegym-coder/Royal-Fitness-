import React from 'react';
import { QrCodeIcon } from './QrCodeIcon';

const IconWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="w-6 h-6">{children}</span>
);

export const LiveWorkoutIcon: React.FC = () => (
    <IconWrapper>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.375a9.375 9.375 0 100-18.75 9.375 9.375 0 000 18.75zM21 12h-2.25m-13.5 0H3M12 3.375v2.25m0 13.5v2.25m-4.243-12.022L6.343 7.843m9.9 9.9l-1.414-1.414" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75v1.5l2.25 3" />
        </svg>
    </IconWrapper>
);

export const HapticFeedbackIcon: React.FC = () => (
    <IconWrapper>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5l-1.5-1.5m10.5 10.5l1.5 1.5m-12-1.5l1.5-1.5m9 9l-1.5-1.5M12 6v.01M12 18v.01M18 12h-.01M6 12h.01" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5a4.5 4.5 0 100-9 4.5 4.5 0 000 9z" />
        </svg>
    </IconWrapper>
);

export const WatchQrCodeIcon: React.FC = () => (
    <IconWrapper>
       <QrCodeIcon />
    </IconWrapper>
);

export const WatchNotificationIcon: React.FC = () => (
    <IconWrapper>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
    </IconWrapper>
);

export const HealthSyncIcon: React.FC = () => (
    <IconWrapper>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H6.75A2.25 2.25 0 004.5 3.75v3.75m15 0V3.75A2.25 2.25 0 0017.25 1.5h-3.75m-9 15v3.75A2.25 2.25 0 006.75 22.5h3.75m3.75 0h3.75a2.25 2.25 0 002.25-2.25V18" />
        </svg>
    </IconWrapper>
);
