import { memo } from "react";

export const AnimatedHero = memo(() => {
  return (
    <div className="relative h-64 w-full flex items-center justify-center md:h-80">
      <svg
        viewBox="0 0 360 280"
        className="h-52 w-[18rem] md:h-72 md:w-[22rem] drop-shadow-lg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f8fff9" />
            <stop offset="100%" stopColor="#e7f6ea" />
          </linearGradient>

          <linearGradient id="sunGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>

          <linearGradient id="hillGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>

          <linearGradient id="fieldGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>

          <filter id="softGlow">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <style>
            {`
              @keyframes sunPulse {
                0%, 100% { transform: scale(1); opacity: 0.9; }
                50% { transform: scale(1.06); opacity: 1; }
              }

              @keyframes drift {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-3px); }
              }

              @keyframes cropSway {
                0%, 100% { transform: rotate(0deg); }
                50% { transform: rotate(-3deg); }
              }

              @keyframes shimmerSweep {
                0% { transform: translateX(-22px); opacity: 0; }
                30% { opacity: 0.55; }
                100% { transform: translateX(22px); opacity: 0; }
              }

              .sun {
                animation: sunPulse 4s ease-in-out infinite;
                transform-origin: 270px 74px;
              }

              .floating-layer {
                animation: drift 5.5s ease-in-out infinite;
              }

              .crop {
                animation: cropSway 3.6s ease-in-out infinite;
                transform-origin: center 235px;
              }

              .field-shimmer {
                animation: shimmerSweep 3.4s ease-in-out infinite;
              }
            `}
          </style>
        </defs>

        {/* Backplate */}
        <rect x="20" y="20" width="320" height="240" rx="34" fill="url(#skyGradient)" />

        {/* Sun */}
        <g className="sun" filter="url(#softGlow)">
          <circle cx="270" cy="74" r="28" fill="url(#sunGradient)" />
          <circle cx="270" cy="74" r="40" fill="none" stroke="#facc15" strokeOpacity="0.25" />
        </g>

        {/* Hills */}
        <g className="floating-layer" style={{ animationDelay: "0.2s" }}>
          <path d="M 20 184 C 92 132, 162 132, 228 184 L 20 184 Z" fill="url(#hillGradient)" opacity="0.58" />
          <path d="M 120 184 C 176 144, 246 144, 340 184 L 120 184 Z" fill="#22c55e" opacity="0.5" />
        </g>

        {/* Main field */}
        <path d="M 20 184 L 340 184 L 340 260 L 20 260 Z" fill="url(#fieldGradient)" />

        {/* Field furrows */}
        <path d="M 58 260 C 82 232, 96 212, 112 184" stroke="#a3e635" strokeOpacity="0.5" strokeWidth="2" fill="none" />
        <path d="M 128 260 C 146 236, 162 214, 176 184" stroke="#a3e635" strokeOpacity="0.45" strokeWidth="2" fill="none" />
        <path d="M 196 260 C 212 238, 230 215, 244 184" stroke="#a3e635" strokeOpacity="0.45" strokeWidth="2" fill="none" />
        <path d="M 266 260 C 284 236, 302 212, 320 184" stroke="#a3e635" strokeOpacity="0.5" strokeWidth="2" fill="none" />

        {/* Farmer hat silhouette */}
        <g className="floating-layer" style={{ animationDuration: "6s" }}>
          <ellipse cx="94" cy="160" rx="32" ry="8" fill="#14532d" opacity="0.9" />
          <path d="M 79 158 C 79 144, 109 144, 109 158 Z" fill="#166534" />
          <rect x="91" y="160" width="6" height="22" rx="2" fill="#166534" />
        </g>

        {/* Crop cluster */}
        <g className="crop" style={{ animationDelay: "0.25s" }}>
          <path d="M 208 238 L 208 200" stroke="#fef9c3" strokeWidth="3" strokeLinecap="round" />
          <path d="M 208 203 C 198 204, 195 196, 201 191" stroke="#fef08a" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M 208 212 C 198 213, 194 205, 201 200" stroke="#fde047" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M 208 221 C 198 222, 194 214, 201 209" stroke="#fde047" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M 208 203 C 218 204, 221 196, 215 191" stroke="#fef08a" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M 208 212 C 218 213, 222 205, 215 200" stroke="#fde047" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M 208 221 C 218 222, 222 214, 215 209" stroke="#fde047" strokeWidth="3" strokeLinecap="round" fill="none" />
        </g>

        {/* Soft moving highlight */}
        <rect x="154" y="188" width="18" height="64" rx="9" fill="#dcfce7" fillOpacity="0.18" className="field-shimmer" />
      </svg>
    </div>
  );
});

AnimatedHero.displayName = "AnimatedHero";
