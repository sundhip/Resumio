import React from 'react';
import { useCountUp } from '../../hooks/useCountUp';

export interface ScoreRingProps {
  score: number; // 0 to 100
  size?: number; // default 96px
  strokeWidth?: number; // default 8px
  color?: 'teal' | 'pink' | 'yellow' | 'green' | 'aqua' | 'orange';
  label?: string;
  sublabel?: string;
  animate?: boolean;
  className?: string;
}

const RING_COLORS: Record<string, string> = {
  teal: '#1F8FA6',
  pink: '#D98BE8',
  yellow: '#F2C94C',
  green: '#7ED957',
  aqua: '#5FD3E8',
  orange: '#F29B4B',
};

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  size = 96,
  strokeWidth = 8,
  color = 'teal',
  label,
  sublabel,
  animate = true,
  className = '',
}) => {
  const clampedScore = Math.min(100, Math.max(0, score));
  const animatedScore = useCountUp(clampedScore, animate ? 280 : 0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedScore / 100) * circumference;
  const strokeColor = RING_COLORS[color] || RING_COLORS.teal;

  return (
    <div className={`relative inline-flex flex-col items-center justify-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-[#E7E7E2] dark:text-white/10"
          />
          {/* Active progress stroke with smooth draw-in */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 280ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </svg>

        {/* Center number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="figure text-xl font-bold leading-none text-[#111312] dark:text-[#F2F6F7]">
            {animatedScore}%
          </span>
          {label && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#5E6460] dark:text-[#9AA7AB] mt-0.5">
              {label}
            </span>
          )}
        </div>
      </div>

      {sublabel && (
        <span className="text-xs text-[#5E6460] dark:text-[#9AA7AB] mt-2 text-center">
          {sublabel}
        </span>
      )}
    </div>
  );
};
