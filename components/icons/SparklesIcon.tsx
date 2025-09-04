
import React from 'react';

export const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 3L9.25 8.75L3.5 11.5L9.25 14.25L12 20L14.75 14.25L20.5 11.5L14.75 8.75L12 3Z" />
    <path d="M5 3L6.25 6.25L9.5 7.5L6.25 8.75L5 12L3.75 8.75L0.5 7.5L3.75 6.25L5 3Z" />
    <path d="M19 12L17.75 15.25L14.5 16.5L17.75 17.75L19 21L20.25 17.75L23.5 16.5L20.25 15.25L19 12Z" />
  </svg>
);
