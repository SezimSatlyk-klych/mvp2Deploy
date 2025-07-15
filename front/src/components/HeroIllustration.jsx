import React from 'react';

function HeroIllustration() {
  // SVG-абстракция вместо 3D-персонажа
  return (
    <svg width="320" height="320" viewBox="0 0 320 320" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="320" y2="320" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6fd6ff" />
          <stop offset="1" stopColor="#4f8cff" />
        </linearGradient>
      </defs>
      <circle cx="160" cy="160" r="140" fill="url(#bg)" />
      <rect x="90" y="120" width="140" height="80" rx="30" fill="#fff" opacity="0.8"/>
      <rect x="120" y="150" width="80" height="20" rx="10" fill="#4f8cff" opacity="0.7"/>
      <circle cx="160" cy="180" r="12" fill="#6fd6ff" />
    </svg>
  );
}

export default HeroIllustration; 