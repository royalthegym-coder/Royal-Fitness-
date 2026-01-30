
import React from 'react';

// Shared Gradient Definition
const RoyalGradient = () => (
    <defs>
        <linearGradient id="royal-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="50%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        <linearGradient id="royal-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
    </defs>
);

const IconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={`w-6 h-6 ${className || ''}`}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="url(#royal-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <RoyalGradient />
        {children}
    </svg>
  </span>
);

export const DashboardIcon = () => (
  <IconWrapper>
    <path d="M4 4h6v6H4V4z" fill="url(#royal-gold)" fillOpacity="0.1" />
    <path d="M14 4h6v6h-6V4z" />
    <path d="M4 14h6v6H4v-6z" />
    <path d="M14 14h6v6h-6v-6z" fill="url(#royal-gold)" fillOpacity="0.1" />
  </IconWrapper>
);

export const SparkleIcon = () => (
    <IconWrapper>
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M12 21v-1m0-16a1 1 0 011 1v2.069a8.956 8.956 0 015.931 5.931H20a1 1 0 110 2h-2.069a8.956 8.956 0 01-5.931 5.931V20a1 1 0 11-2 0v-2.069a8.956 8.956 0 01-5.931-5.931H4a1 1 0 110-2h2.069a8.956 8.956 0 015.931-5.931V4a1 1 0 011-1z" />
    </IconWrapper>
);

export const PackageIcon = () => (
  <IconWrapper>
    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7v10l8 4" fill="url(#royal-gold)" fillOpacity="0.1" />
  </IconWrapper>
);

export const MembersIcon: React.FC<{className?: string}> = ({className}) => (
  <span className={`w-6 h-6 ${className}`}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="url(#royal-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <RoyalGradient />
        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.282-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.282.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" fill="url(#royal-gold)" fillOpacity="0.1" />
    </svg>
  </span>
);

export const BillingIcon = () => (
  <IconWrapper>
    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </IconWrapper>
);

export const NotificationsIcon = () => (
    <IconWrapper>
        <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </IconWrapper>
);

export const WorkoutIcon = () => (
  <IconWrapper>
    <path d="M13 10V3L4 14h7v7l9-11h-7z" fill="url(#royal-gold)" fillOpacity="0.2" />
  </IconWrapper>
);

export const DietIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className}>
    <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-12v4m-2-2h4m5 4v4m-2-2h4M17 3l-4.5 4.5M17 3h-2M17 3v2" />
  </IconWrapper>
);

export const StaffIcon = () => (
  <IconWrapper>
    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </IconWrapper>
);

export const ExpensesIcon = () => (
  <IconWrapper>
    <path d="M9 8h6m-5 4h4m2 8H8a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2z" />
  </IconWrapper>
);

export const ReportsIcon = () => (
  <IconWrapper>
    <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </IconWrapper>
);

export const SettingsIcon = () => (
  <IconWrapper>
    <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </IconWrapper>
);

export const LeadsIcon = () => (
    <IconWrapper>
      <path d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </IconWrapper>
);

export const MembershipIcon = () => (
    <IconWrapper>
        <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </IconWrapper>
);
