import React from 'react';
import { Card } from './Card';

export interface StatTileProps {
  label: string;
  value: string | number;
  delta?: {
    value: string;
    isPositive?: boolean;
    period?: string;
  };
  accentColor?: 'teal' | 'pink' | 'yellow' | 'green' | 'aqua' | 'orange';
  sparkline?: React.ReactNode;
  icon?: React.ReactNode;
  tooltip?: string;
  className?: string;
}

const ACCENT_COLOR_MAP: Record<string, string> = {
  teal: 'bg-[#1F8FA6]',
  pink: 'bg-[#D98BE8]',
  yellow: 'bg-[#F2C94C]',
  green: 'bg-[#7ED957]',
  aqua: 'bg-[#5FD3E8]',
  orange: 'bg-[#F29B4B]',
};

export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  delta,
  accentColor = 'teal',
  sparkline,
  icon,
  tooltip,
  className = '',
}) => {
  const barColor = ACCENT_COLOR_MAP[accentColor] || ACCENT_COLOR_MAP.teal;

  return (
    <Card className={`flex flex-col justify-between ${className}`} title={tooltip}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {/* Vertical colored accent bar */}
          <div className={`w-1 h-5 rounded-full ${barColor}`} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5E6460] dark:text-[#9AA7AB]">
            {label}
          </span>
        </div>
        {icon && <div className="text-[#5E6460] dark:text-[#9AA7AB]">{icon}</div>}
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-2">
        <div className="figure text-[28px] font-bold leading-none tracking-tight text-[#111312] dark:text-[#F2F6F7]">
          {value}
        </div>
        {sparkline && <div className="w-20 h-7 flex-shrink-0">{sparkline}</div>}
      </div>

      {delta && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded-full font-medium ${
              delta.isPositive
                ? 'bg-[#E3F5EA] text-[#166534] dark:bg-[#7ED957]/15 dark:text-[#7ED957]'
                : 'bg-[#FEE2E2] text-[#B91C1C] dark:bg-[#F2677A]/15 dark:text-[#F2677A]'
            }`}
          >
            {delta.isPositive ? '+' : ''}
            {delta.value}
          </span>
          {delta.period && (
            <span className="text-[#8C928E] dark:text-[#5F6C70]">{delta.period}</span>
          )}
        </div>
      )}
    </Card>
  );
};
