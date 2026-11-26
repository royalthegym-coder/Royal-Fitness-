
import React from 'react';

const IconWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="w-5 h-5">{children}</span>
);

export const HandWaveIcon: React.FC = () => (
    <IconWrapper>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 12c0 2.21-1.002 4.2-2.636 5.514M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v2.25m0 0v2.25m0-2.25h.008m-12 3v-2.25m0 0V5.25m0 2.25H3.75" />
        </svg>
    </IconWrapper>
);
