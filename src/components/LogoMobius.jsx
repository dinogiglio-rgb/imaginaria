import React from 'react';

export default function LogoMobius({ size = 48, className = '' }) {
  return (
    <svg
      width={size}
      height={size * 0.6}
      viewBox="0 0 120 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="mobius-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF7F6A" />
          <stop offset="50%" stopColor="#D97CB8" />
          <stop offset="100%" stopColor="#A084E8" />
        </linearGradient>
      </defs>
      {/* Anello sinistro */}
      <ellipse
        cx="42" cy="36" rx="28" ry="20"
        stroke="url(#mobius-grad)"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      />
      {/* Anello destro */}
      <ellipse
        cx="78" cy="36" rx="28" ry="20"
        stroke="url(#mobius-grad)"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      />
      {/* Sovrapposizione centrale per effetto nastro */}
      <ellipse
        cx="42" cy="36" rx="28" ry="20"
        stroke="url(#mobius-grad)"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="44 88"
        strokeDashoffset="0"
      />
    </svg>
  );
}
