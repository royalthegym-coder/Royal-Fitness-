import React from 'react';

const IconWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="w-5 h-5">{children}</span>
);

export const SupportIcon: React.FC = () => (
    <IconWrapper>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.375a9.375 9.375 0 100-18.75 9.375 9.375 0 000 18.75zM12 14.625a2.625 2.625 0 100-5.25 2.625 2.625 0 000 5.25z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.375h.008v.008h-.008v-.008z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 9.375h.008v.008H6.75v-.008zM12 14.625v3.375m-3.375-6.375a1.125 1.125 0 011.125-1.125h4.5a1.125 1.125 0 011.125 1.125" />
        </svg>
    </IconWrapper>
);
