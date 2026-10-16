import React from 'react';

export interface ArcGaugeProps {
  score: number; // 0 to 100
  size?: number; // width in px, default 160
  strokeWidth?: number;
  label?: string;
  statusText?: string;
  className?: string;
}

export const ArcGauge: React.FC<ArcGaugeProps> = ({
  score,
  size = 160,
  strokeWidth = 12,
  label = 'ATS Score',
  statusText,
  className = '',
}) => {
  const clampedScore = Math.min(100, Math.max(0, score));
  const radius = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size / 2 + 10;

  // 180-degree semicircle arc
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const arcLength = Math.PI * radius;
  const activeOffset = arcLength * (1 - clampedScore / 100);

  // Status message based on score
  const computedStatus =
    statusText ||
    (clampedScore >= 85
      ? 'Exceptional Fit'
      : clampedScore >= 70
      ? 'Strong Match'
      : clampedScore >= 50
      ? 'Moderate Match'
      : 'Low Fit');

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <div className="relative" style={{ width: size, height: size * 0.65 }}>
        <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${size} ${size * 0.7}`}>
          <defs>
            <linearGradient id="arcHealthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#D98BE8" />
              <stop offset="33%" stopColor="#5FD3E8" />
              <stop offset="66%" stopColor="#7ED957" />
              <stop offset="100%" stopColor="#F2C94C" />
            </linearGradient>
          </defs>

          {/* Background track arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="text-[#E7E7E2] dark:text-white/10"
          />

          {/* Active arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="url(#arcHealthGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={activeOffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center justify-center text-center">
          <span className="figure text-3xl font-extrabold tracking-tight text-[#111312] dark:text-[#F2F6F7]">
            {clampedScore}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5E6460] dark:text-[#9AA7AB]">
            {label}
          </span>
        </div>
      </div>

      <div className="mt-1 text-xs font-medium text-[#1F8FA6] dark:text-[#5FD3E8]">
        {computedStatus}
      </div>
    </div>
  );
};
