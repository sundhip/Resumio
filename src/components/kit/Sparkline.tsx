import React from 'react';

export interface SparklineProps {
  data: number[];
  color?: 'teal' | 'pink' | 'yellow' | 'green' | 'aqua' | 'orange';
  width?: number;
  height?: number;
  showDot?: boolean;
  className?: string;
}

const COLOR_CONFIG: Record<string, { stroke: string; fill: string }> = {
  teal: { stroke: '#1F8FA6', fill: 'rgba(31,143,166,0.15)' },
  pink: { stroke: '#D98BE8', fill: 'rgba(217,139,232,0.15)' },
  yellow: { stroke: '#F2C94C', fill: 'rgba(242,201,76,0.15)' },
  green: { stroke: '#7ED957', fill: 'rgba(126,217,87,0.15)' },
  aqua: { stroke: '#5FD3E8', fill: 'rgba(95,211,232,0.15)' },
  orange: { stroke: '#F29B4B', fill: 'rgba(242,155,75,0.15)' },
};

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = 'teal',
  width = 80,
  height = 28,
  showDot = true,
  className = '',
}) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;
  const chartHeight = height - padding * 2;
  const chartWidth = width - padding * 2;

  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((val - min) / range) * chartHeight;
    return { x, y };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const lastPt = points[points.length - 1];
  const firstPt = points[0];
  const fillD = `${pathD} L ${lastPt.x} ${height} L ${firstPt.x} ${height} Z`;

  const conf = COLOR_CONFIG[color] || COLOR_CONFIG.teal;
  const gradientId = `sparkline-grad-${color}-${Math.random().toString(36).substr(2, 5)}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible ${className}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={conf.stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={conf.stroke} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Gradient area */}
      <path d={fillD} fill={`url(#${gradientId})`} />

      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={conf.stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Terminal end dot */}
      {showDot && (
        <circle
          cx={lastPt.x}
          cy={lastPt.y}
          r="2.5"
          fill={conf.stroke}
          className="transition-transform duration-200"
        />
      )}
    </svg>
  );
};
