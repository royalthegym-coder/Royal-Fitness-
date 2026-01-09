import React from 'react';

const IconWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="w-5 h-5">{children}</span>
);

export const BotIcon: React.FC = () => (
    <IconWrapper>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25v-1.5a3.375 3.375 0 013.375-3.375h1.5a3.375 3.375 0 013.375 3.375v1.5M9 11.25h6M9 15h6m-6.75-4.5h.008v.008H8.25v-.008zm4.5 0h.008v.008h-.008v-.008zm4.5 0h.008v.008h-.008v-.008zm-12 3.75a3 3 0 013-3h12a3 3 0 013 3v6a3 3 0 01-3 3H6a3 3 0 01-3-3v-6z" />
        </svg>
    </IconWrapper>
);
