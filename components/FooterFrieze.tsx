import React from 'react';

export default function FooterFrieze() {
  return (
    <svg
      className="frieze footer-frieze"
      viewBox="0 0 880 58"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Decorative Warli folk-art bottom border"
    >
      <defs>
        <pattern id="warliBottom" width="220" height="58" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="#3A7030" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
            <line x1="0" y1="12" x2="220" y2="12" strokeDasharray="1.5 5" strokeWidth="1.2" opacity="0.55" />
            {/* Ox / Bullock */}
            <g transform="translate(24,30)">
              <line x1="0" y1="0" x2="20" y2="0" />
              <line x1="20" y1="0" x2="26" y2="-6" />
              <line x1="0" y1="0" x2="-4" y2="10" />
              <line x1="8" y1="0" x2="6" y2="10" />
              <line x1="14" y1="0" x2="16" y2="10" />
              <line x1="20" y1="0" x2="22" y2="10" />
              <line x1="26" y1="-6" x2="30" y2="-9" />
              <line x1="26" y1="-6" x2="24" y2="-11" />
            </g>
            {/* Dancers */}
            <circle cx="90" cy="10" r="3.2" />
            <path d="M87 14 L90 24 L93 14" />
            <line x1="87" y1="14" x2="80" y2="8" />
            <line x1="93" y1="14" x2="100" y2="10" />
            <line x1="90" y1="24" x2="84" y2="36" />
            <line x1="90" y1="24" x2="96" y2="36" />
            <line x1="100" y1="10" x2="112" y2="10" />
            <circle cx="120" cy="10" r="3.2" />
            <path d="M117 14 L120 24 L123 14" />
            <line x1="123" y1="14" x2="130" y2="8" />
            <line x1="117" y1="14" x2="112" y2="10" />
            <line x1="120" y1="24" x2="114" y2="36" />
            <line x1="120" y1="24" x2="126" y2="36" />
            {/* Paddy stalk */}
            <g transform="translate(168,10)">
              <line x1="0" y1="0" x2="0" y2="26" />
              <line x1="0" y1="4" x2="-6" y2="0" />
              <line x1="0" y1="8" x2="6" y2="4" />
              <line x1="0" y1="12" x2="-6" y2="8" />
              <line x1="0" y1="16" x2="6" y2="12" />
              <line x1="0" y1="20" x2="-6" y2="16" />
            </g>
          </g>
        </pattern>
      </defs>
      <rect width="880" height="58" fill="url(#warliBottom)" />
    </svg>
  );
}
