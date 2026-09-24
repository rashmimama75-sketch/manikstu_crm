import React from 'react';

export default function HeaderFrieze() {
  return (
    <svg
      className="frieze"
      viewBox="0 0 880 58"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Decorative Warli folk-art border"
    >
      <defs>
        <pattern id="warliTop" width="220" height="58" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="#F1E6C8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <line x1="0" y1="46" x2="220" y2="46" strokeDasharray="1.5 5" strokeWidth="1.2" opacity="0.55" />
            {/* Tree */}
            <line x1="20" y1="46" x2="20" y2="22" />
            <line x1="20" y1="26" x2="10" y2="14" />
            <line x1="20" y1="24" x2="16" y2="10" />
            <line x1="20" y1="22" x2="20" y2="8" />
            <line x1="20" y1="24" x2="24" y2="10" />
            <line x1="20" y1="26" x2="30" y2="14" />
            <circle cx="10" cy="14" r="1.4" fill="#F1E6C8" />
            <circle cx="16" cy="10" r="1.4" fill="#F1E6C8" />
            <circle cx="20" cy="8" r="1.4" fill="#F1E6C8" />
            <circle cx="24" cy="10" r="1.4" fill="#F1E6C8" />
            <circle cx="30" cy="14" r="1.4" fill="#F1E6C8" />
            {/* Dancer 1 */}
            <circle cx="58" cy="18" r="3.2" />
            <path d="M55 22 L58 32 L61 22" />
            <line x1="55" y1="22" x2="48" y2="16" />
            <line x1="61" y1="22" x2="68" y2="18" />
            <line x1="58" y1="32" x2="52" y2="44" />
            <line x1="58" y1="32" x2="64" y2="44" />
            {/* Joined hands */}
            <line x1="68" y1="18" x2="80" y2="18" />
            {/* Dancer 2 */}
            <circle cx="88" cy="18" r="3.2" />
            <path d="M85 22 L88 32 L91 22" />
            <line x1="91" y1="22" x2="98" y2="16" />
            <line x1="85" y1="22" x2="80" y2="18" />
            <line x1="88" y1="32" x2="82" y2="44" />
            <line x1="88" y1="32" x2="94" y2="44" />
            {/* Sun */}
            <circle cx="130" cy="20" r="6" />
            <line x1="130" y1="9" x2="130" y2="5" />
            <line x1="130" y1="31" x2="130" y2="35" />
            <line x1="119" y1="20" x2="115" y2="20" />
            <line x1="141" y1="20" x2="145" y2="20" />
            <line x1="122" y1="12" x2="119" y2="9" />
            <line x1="138" y1="12" x2="141" y2="9" />
            <line x1="122" y1="28" x2="119" y2="31" />
            <line x1="138" y1="28" x2="141" y2="31" />
            {/* Hut */}
            <path d="M166 46 L166 32 L178 24 L190 32 L190 46 Z" />
            <line x1="178" y1="46" x2="178" y2="36" />
          </g>
        </pattern>
      </defs>
      <rect width="880" height="58" fill="url(#warliTop)" />
    </svg>
  );
}
