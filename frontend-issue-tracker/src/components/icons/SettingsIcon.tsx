import React from 'react';

interface IconProps {
  className?: string;
}

export const SettingsIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className || 'w-6 h-6'}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.542-.912 3.513.558 2.601 2.1a1.724 1.724 0 001.066 2.574c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.912 1.542-.559 3.513-2.1 2.601a1.724 1.724 0 00-2.574 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.542.912-3.513-.558-2.601-2.1a1.724 1.724 0 00-1.066-2.574c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.912-1.542.558-3.513 2.1-2.601.966.571 2.197.092 2.574-1.066z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);
