import React from 'react';

interface SmartStockLogoProps {
  className?: string;
  showText?: boolean;
  darkText?: boolean;
}

export function SmartStockLogo({
  className = '',
  showText = true,
  darkText = true,
}: SmartStockLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 ${className}`}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="28" height="28" rx="7" fill="#4F46E5" />
        <path
          d="M8.5 10.25L14 7L19.5 10.25V17.75L14 21L8.5 17.75V10.25Z"
          stroke="white"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path d="M14 13.75V21" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
        <path d="M19.5 10.25L14 13.75L8.5 10.25" stroke="white" strokeWidth="1.75" strokeLinejoin="round" />
      </svg>
      {showText && (
        <span
          className={`font-display text-lg font-bold tracking-tight ${
            darkText ? 'text-slate-900' : 'text-white'
          }`}
        >
          SmartStock
        </span>
      )}
    </span>
  );
}
