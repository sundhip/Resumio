import React, { useState } from 'react';

// ==========================================
// 1. AreaChart (with FinGlow vertical-bar texture & tooltip)
// ==========================================

export interface AreaDataPoint {
  label: string;
  value: number;
}

export interface AreaChartProps {
  data: AreaDataPoint[];
  height?: number; // default 220
  color?: string; // default #1F8FA6
  className?: string;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  height = 220,
  color = '#1F8FA6',
  className = '',
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(data.length - 1);

  if (!data || data.length < 2) return null;

  const minVal = Math.min(...data.map((d) => d.value));
  const maxVal = Math.max(...data.map((d) => d.value));
  const range = maxVal - minVal || 1;
  const paddingX = 24;
  const paddingY = 24;
  const chartWidth = 600;
  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * innerWidth;
    const y = paddingY + innerHeight - ((d.value - minVal) / range) * innerHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const firstPt = points[0];
  const lastPt = points[points.length - 1];
  const areaD = `${pathD} L ${lastPt.x} ${height - paddingY} L ${firstPt.x} ${height - paddingY} Z`;

  const hoveredPt = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className={`relative w-full ${className}`}>
      {/* Interactive Tooltip readout */}
      {hoveredPt && (
        <div
          className="absolute z-20 pointer-events-none transform -translate-x-1/2 -top-1 transition-all duration-150"
          style={{ left: `${(hoveredPt.x / chartWidth) * 100}%` }}
        >
          <div className="bg-[#111312] dark:bg-[#111719] text-white border border-[#E7E7E2]/20 dark:border-white/10 px-2.5 py-1 rounded-[8px] shadow-lg text-center whitespace-nowrap">
            <div className="text-[10px] text-[#9AA7AB] uppercase font-semibold tracking-wider">
              {hoveredPt.label}
            </div>
            <div className="figure text-xs font-bold text-[#5FD3E8]">
              {hoveredPt.value}
            </div>
          </div>
        </div>
      )}

      <svg
        viewBox={`0 0 ${chartWidth} ${height}`}
        className="w-full h-auto overflow-visible select-none"
      >
        <defs>
          <linearGradient id="areaGradientTeal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.30" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>

          {/* FinGlow signature: vertical bar pattern */}
          <pattern id="verticalBarPattern" width="16" height="100%" patternUnits="userSpaceOnUse">
            <line x1="8" y1="0" x2="8" y2={height} stroke="currentColor" strokeWidth="1" className="text-black/3 dark:text-white/4" />
          </pattern>
        </defs>

        {/* Vertical background bars */}
        <rect
          x={paddingX}
          y={paddingY}
          width={innerWidth}
          height={innerHeight}
          fill="url(#verticalBarPattern)"
        />

        {/* Horizontal gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
          const y = paddingY + innerHeight * pct;
          return (
            <line
              key={idx}
              x1={paddingX}
              y1={y}
              x2={chartWidth - paddingX}
              y2={y}
              stroke="currentColor"
              strokeDasharray="4 4"
              className="text-black/5 dark:text-white/5"
            />
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#areaGradientTeal)" />

        {/* Primary Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Interactive Data Point Dots and Vertical Guide */}
        {points.map((pt, i) => {
          const isHovered = i === hoverIndex;
          return (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoverIndex(i)}
            >
              {isHovered && (
                <line
                  x1={pt.x}
                  y1={paddingY}
                  x2={pt.x}
                  y2={height - paddingY}
                  stroke={color}
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  className="opacity-75"
                />
              )}
              {/* Invisible larger hit target */}
              <circle cx={pt.x} cy={pt.y} r="12" fill="transparent" />
              {/* Visible dot */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? '5' : '3.5'}
                fill={isHovered ? color : '#FFFFFF'}
                stroke={color}
                strokeWidth="2"
                className="transition-all duration-150"
              />
            </g>
          );
        })}
      </svg>

      {/* X-axis labels */}
      <div className="flex justify-between px-6 pt-2 text-[11px] font-medium text-[#8C928E] dark:text-[#5F6C70]">
        {data.map((d, i) => (
          <span key={i}>{d.label}</span>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 2. BarChart
// ==========================================

export interface BarDataPoint {
  label: string;
  value: number;
  color?: 'teal' | 'pink' | 'yellow' | 'green' | 'aqua' | 'orange';
}

const BAR_COLOR_MAP: Record<string, string> = {
  teal: 'bg-[#1F8FA6] hover:bg-[#2BB3C9]',
  pink: 'bg-[#D98BE8] hover:bg-[#E2A6EE]',
  yellow: 'bg-[#F2C94C] hover:bg-[#F6D672]',
  green: 'bg-[#7ED957] hover:bg-[#96E175]',
  aqua: 'bg-[#5FD3E8] hover:bg-[#7EE0F1]',
  orange: 'bg-[#F29B4B] hover:bg-[#F5B16F]',
};

export const BarChart: React.FC<{ data: BarDataPoint[]; height?: number; className?: string }> = ({
  data,
  height = 160,
  className = '',
}) => {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-end justify-between gap-3" style={{ height: `${height}px` }}>
        {data.map((item, idx) => {
          const pct = (item.value / max) * 100;
          const colorClass = BAR_COLOR_MAP[item.color || 'teal'];

          return (
            <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
              {/* Tooltip on hover */}
              <span className="figure text-[10px] font-bold text-[#111312] dark:text-[#F2F6F7] opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                {item.value}
              </span>

              {/* Bar */}
              <div className="w-full max-w-[36px] bg-[#E7E7E2] dark:bg-white/10 rounded-t-[8px] h-full flex items-end overflow-hidden">
                <div
                  className={`w-full rounded-t-[8px] transition-all duration-500 ${colorClass}`}
                  style={{ height: `${pct}%` }}
                />
              </div>

              {/* Label */}
              <span className="text-[11px] font-medium text-[#5E6460] dark:text-[#9AA7AB] mt-2 truncate w-full text-center">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// 3. Donut Chart
// ==========================================

export interface DonutSegment {
  label: string;
  value: number;
  colorHex: string;
}

export const Donut: React.FC<{
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  className?: string;
}> = ({ segments, size = 160, strokeWidth = 20, centerLabel, className = '' }) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div className={`flex flex-col sm:flex-row items-center gap-6 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
          {segments.map((seg, idx) => {
            const pct = seg.value / total;
            const strokeDasharray = `${pct * circumference} ${circumference}`;
            const strokeDashoffset = -currentOffset;
            currentOffset += pct * circumference;

            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={seg.colorHex}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500 hover:opacity-85"
              />
            );
          })}
        </svg>

        {centerLabel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="figure text-xl font-bold leading-none text-[#111312] dark:text-[#F2F6F7]">
              {total}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#5E6460] dark:text-[#9AA7AB] mt-1">
              {centerLabel}
            </span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="space-y-2 text-xs">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: seg.colorHex }}
              />
              <span className="text-[#5E6460] dark:text-[#9AA7AB] font-medium">
                {seg.label}
              </span>
            </div>
            <span className="figure font-semibold text-[#111312] dark:text-[#F2F6F7]">
              {Math.round((seg.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
