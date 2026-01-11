import React from 'react';

export const SpeakerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.858 5.858a3 3 0 104.243 4.243L5.858 14.343a3 3 0 00-4.243-4.243l4.243-4.243zM11 5.05L5.05 11" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 14.14V19.5a2.5 2.5 0 01-5 0V18" />
  </svg>
);
