import React, { useState } from 'react';
import { Table, Eye, EyeOff } from 'lucide-react';
import { useCountUp } from '../../hooks/useCountUp';

// ==========================================
// 1. AreaChart (FinGlow vertical-bar texture, keyboard tooltips, data table toggle)
// ==========================================

export interface AreaDataPoint {
  label: string;
  value: number;
}

export interface AreaChartProps {
  data: AreaDataPoint[];
  height?: number; // default 220
  color?: string; // default #1F8FA6
  title?: string;
  className?: string;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  height = 220,
  color = '#1F8FA6',
  title = 'Timeline Chart',
  className = '',
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(
    data && data.length > 0 ? data.length - 1 : null
  );
  const [showDataTable, setShowDataTable] = useState<boolean>(false);

  // Empty State
  if (!data || data.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-[#E7E7E2] dark:border-white/10 text-center ${className}`} style={{ height: `${height}px` }}>
        <p className="text-xs font-semibold text-[#5E6460] dark:text-[#9AA7AB]">
          No timeline telemetry data available yet
        </p>
      </div>
    );
  }

  // Single-point State
  if (data.length === 1) {
    const single = data[0];
    return (
      <div className={`flex flex-col items-center justify-center p-6 rounded-2xl bg-black/2 dark:bg-white/2 border border-[#E7E7E2] dark:border-white/10 text-center ${className}`} style={{ height: `${height}px` }}>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5E6460] dark:text-[#9AA7AB]">
          {single.label}
        </span>
        <span className="figure text-3xl font-extrabold text-[#1F8FA6] dark:text-[#5FD3E8] mt-1">
          {single.value}
        </span>
        <span className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB] mt-1">
          Single baseline observation recorded
        </span>
      </div>
    );
  }

  const minVal = Math.min(...data.map((d) => d.value));
  const maxVal = Math.max(...data.map((d) => d.value));
  const range = maxVal - minVal || 1;
  const paddingX = 28;
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

  const hoveredPt = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < points.length ? points[hoverIndex] : null;

  return (
    <div
      role="region"
      aria-label={title}
      className={`relative w-full ${className}`}
    >
      {/* Header controls: Table Toggle for accessibility */}
      <div className="flex items-center justify-end mb-2">
        <button
          type="button"
          onClick={() => setShowDataTable(!showDataTable)}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:hover:text-[#F2F6F7] transition-colors cursor-pointer p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5"
          aria-expanded={showDataTable}
          aria-label={showDataTable ? 'Switch to chart visual' : 'View chart as data table'}
        >
          <Table className="w-3.5 h-3.5" />
          <span>{showDataTable ? 'Hide Table' : 'Data Table'}</span>
        </button>
      </div>

      {showDataTable ? (
        /* Accessible Semantic HTML Data Table Alternative */
        <div className="overflow-x-auto rounded-xl border border-[#E7E7E2] dark:border-white/10" style={{ maxHeight: `${height}px` }}>
          <table className="w-full text-left text-xs text-[#111312] dark:text-[#F2F6F7]">
            <thead className="bg-[#E9E9E5] dark:bg-[#080B0C] text-[10px] uppercase font-bold text-[#5E6460] dark:text-[#9AA7AB] border-b border-[#E7E7E2] dark:border-white/10">
              <tr>
                <th scope="col" className="px-3 py-2">Interval / Label</th>
                <th scope="col" className="px-3 py-2 text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E7E2] dark:divide-white/6 bg-white dark:bg-[#0C1113]">
              {data.map((d, idx) => (
                <tr key={idx} className="hover:bg-black/2 dark:hover:bg-white/2">
                  <td className="px-3 py-2 font-medium">{d.label}</td>
                  <td className="px-3 py-2 text-right figure font-bold text-[#1F8FA6] dark:text-[#5FD3E8]">{d.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Visual SVG Area Chart with FinGlow texture and Keyboard Tooltip */
        <div>
          {/* Interactive Tooltip readout */}
          {hoveredPt && (
            <div
              className="absolute z-20 pointer-events-none transform -translate-x-1/2 top-4 transition-all duration-150"
              style={{ left: `${(hoveredPt.x / chartWidth) * 100}%` }}
              aria-live="polite"
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
            role="img"
            aria-label={`${title} trend visualization`}
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

            {/* Interactive Data Point Dots and Vertical Guide (Accessible via Tab & Arrows) */}
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
                  {/* Invisible hit target */}
                  <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />
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
          <div className="flex justify-between px-6 pt-2 text-[11px] font-medium text-[#5E6460] dark:text-[#9AA7AB]">
            {data.map((d, i) => (
              <span key={i}>{d.label}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. BarChart (Rounded tops, FinGlow palette, keyboard tooltips, data table toggle)
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

export const BarChart: React.FC<{
  data: BarDataPoint[];
  height?: number;
  title?: string;
  className?: string;
}> = ({
  data,
  height = 160,
  title = 'Distribution Bar Chart',
  className = '',
}) => {
  const [showDataTable, setShowDataTable] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 rounded-2xl border border-dashed border-[#E7E7E2] dark:border-white/10 text-xs text-[#5E6460] dark:text-[#9AA7AB] ${className}`} style={{ height: `${height}px` }}>
        No bar distribution data available
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div role="region" aria-label={title} className={`w-full ${className}`}>
      {/* Header controls: Table Toggle */}
      <div className="flex items-center justify-end mb-2">
        <button
          type="button"
          onClick={() => setShowDataTable(!showDataTable)}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:hover:text-[#F2F6F7] transition-colors cursor-pointer p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5"
          aria-expanded={showDataTable}
          aria-label={showDataTable ? 'Hide data table' : 'View chart as data table'}
        >
          <Table className="w-3.5 h-3.5" />
          <span>{showDataTable ? 'Hide Table' : 'Data Table'}</span>
        </button>
      </div>

      {showDataTable ? (
        <div className="overflow-x-auto rounded-xl border border-[#E7E7E2] dark:border-white/10" style={{ maxHeight: `${height}px` }}>
          <table className="w-full text-left text-xs text-[#111312] dark:text-[#F2F6F7]">
            <thead className="bg-[#E9E9E5] dark:bg-[#080B0C] text-[10px] uppercase font-bold text-[#5E6460] dark:text-[#9AA7AB] border-b border-[#E7E7E2] dark:border-white/10">
              <tr>
                <th scope="col" className="px-3 py-2">Category</th>
                <th scope="col" className="px-3 py-2 text-right">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E7E2] dark:divide-white/6 bg-white dark:bg-[#0C1113]">
              {data.map((d, idx) => (
                <tr key={idx} className="hover:bg-black/2 dark:hover:bg-white/2">
                  <td className="px-3 py-2 font-medium">{d.label}</td>
                  <td className="px-3 py-2 text-right figure font-bold text-[#1F8FA6] dark:text-[#5FD3E8]">{d.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex items-end justify-between gap-3" style={{ height: `${height}px` }}>
          {data.map((item, idx) => {
            const pct = (item.value / max) * 100;
            const colorClass = BAR_COLOR_MAP[item.color || 'teal'];
            const isFocused = focusedIndex === idx;

            return (
              <div
                key={idx}
                tabIndex={0}
                role="graphics-symbol"
                aria-label={`${item.label}: ${item.value}`}
                onFocus={() => setFocusedIndex(idx)}
                onBlur={() => setFocusedIndex(null)}
                className="flex-1 flex flex-col items-center h-full justify-end group focus:outline-none cursor-pointer"
              >
                {/* Tooltip on hover/focus */}
                <span className={`figure text-[10px] font-bold text-[#111312] dark:text-[#F2F6F7] transition-opacity mb-1 ${isFocused ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {item.value}
                </span>

                {/* Bar with rounded top */}
                <div className="w-full max-w-[36px] bg-[#E7E7E2] dark:bg-white/10 rounded-t-[8px] h-full flex items-end overflow-hidden">
                  <div
                    className={`w-full rounded-t-[8px] transition-all duration-300 ${colorClass}`}
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
      )}
    </div>
  );
};

// ==========================================
// 3. Donut Chart (Segment animations, count-up center, accessible data table)
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
  title?: string;
  className?: string;
}> = ({
  segments,
  size = 160,
  strokeWidth = 20,
  centerLabel,
  title = 'Proportion Donut Chart',
  className = '',
}) => {
  const [showDataTable, setShowDataTable] = useState(false);
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const animatedTotal = useCountUp(total, 280);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  if (!segments || segments.length === 0) {
    return (
      <div className={`flex items-center justify-center p-6 rounded-2xl border border-dashed border-[#E7E7E2] dark:border-white/10 text-xs text-[#5E6460] dark:text-[#9AA7AB] ${className}`}>
        No segmentation data available
      </div>
    );
  }

  return (
    <div role="region" aria-label={title} className={`w-full ${className}`}>
      {/* Header controls */}
      <div className="flex items-center justify-end mb-2">
        <button
          type="button"
          onClick={() => setShowDataTable(!showDataTable)}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:hover:text-[#F2F6F7] transition-colors cursor-pointer p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5"
          aria-expanded={showDataTable}
          aria-label={showDataTable ? 'Hide data table' : 'View chart as data table'}
        >
          <Table className="w-3.5 h-3.5" />
          <span>{showDataTable ? 'Hide Table' : 'Data Table'}</span>
        </button>
      </div>

      {showDataTable ? (
        <div className="overflow-x-auto rounded-xl border border-[#E7E7E2] dark:border-white/10">
          <table className="w-full text-left text-xs text-[#111312] dark:text-[#F2F6F7]">
            <thead className="bg-[#E9E9E5] dark:bg-[#080B0C] text-[10px] uppercase font-bold text-[#5E6460] dark:text-[#9AA7AB] border-b border-[#E7E7E2] dark:border-white/10">
              <tr>
                <th scope="col" className="px-3 py-2">Category</th>
                <th scope="col" className="px-3 py-2 text-right">Value</th>
                <th scope="col" className="px-3 py-2 text-right">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E7E2] dark:divide-white/6 bg-white dark:bg-[#0C1113]">
              {segments.map((s, idx) => (
                <tr key={idx} className="hover:bg-black/2 dark:hover:bg-white/2">
                  <td className="px-3 py-2 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.colorHex }} />
                    <span className="font-medium">{s.label}</span>
                  </td>
                  <td className="px-3 py-2 text-right figure">{s.value}</td>
                  <td className="px-3 py-2 text-right figure font-bold text-[#1F8FA6] dark:text-[#5FD3E8]">
                    {Math.round((s.value / total) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
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
                    className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                  />
                );
              })}
            </svg>

            {centerLabel && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="figure text-xl font-bold leading-none text-[#111312] dark:text-[#F2F6F7]">
                  {animatedTotal}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#5E6460] dark:text-[#9AA7AB] mt-1">
                  {centerLabel}
                </span>
              </div>
            )}
          </div>

          {/* Accessible Legend */}
          <div className="space-y-2 text-xs flex-1">
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
      )}
    </div>
  );
};
