import React, { useState } from 'react';
import { Pill } from './Pill';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface StatusCellData {
  label: string;
  progressPct: number; // 0 to 100
  color?: 'teal' | 'pink' | 'yellow' | 'green' | 'aqua' | 'orange';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isPulsing, setIsPulsing] = useState(false);

  const handleSort = (key: string) => {
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 280);
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === valB) return 0;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return sortOrder === 'asc' ? -1 : 1;
    });
  }, [data, sortKey, sortOrder]);

  return (
    <div className={`w-full overflow-x-auto rounded-[20px] border border-[#E7E7E2] dark:border-white/6 bg-white dark:bg-[#0C1113] ${className}`}>
      <table className="w-full text-left border-collapse">
        {/* Sticky Header */}
        <thead className="sticky top-0 bg-[#F4F4F1] dark:bg-[#111719] border-b border-[#E7E7E2] dark:border-white/6 z-10">
          <tr>
            {columns.map((col) => {
              const isSorted = sortKey === col.key;
              return (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5E6460] dark:text-[#9AA7AB] select-none ${
                    col.sortable ? 'cursor-pointer hover:text-[#111312] dark:hover:text-[#F2F6F7]' : ''
                  } ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  }`}
                >
                  <div className={`inline-flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : ''}`}>
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-[#8C928E] dark:text-[#5F6C70]">
                        {isSorted ? (
                          sortOrder === 'asc' ? '↑' : '↓'
                        ) : (
                          '↕'
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        {/* Rows with hairline dividers */}
        <tbody className="divide-y divide-[#E7E7E2] dark:divide-white/6 text-sm">
          {sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-sm text-[#8C928E] dark:text-[#5F6C70]"
              >
                No records found
              </td>
            </tr>
          ) : (
            sortedData.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors ${isPulsing ? 'animate-rank-pulse' : ''} ${
                  onRowClick
                    ? 'cursor-pointer hover:bg-[#F6F6F3] dark:hover:bg-white/4'
                    : 'hover:bg-[#FAFAF8] dark:hover:bg-white/2'
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3.5 text-[#111312] dark:text-[#F2F6F7] ${
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    }`}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// Special Status Chip with thin progress bar helper component
export const StatusProgressChip: React.FC<StatusCellData> = ({
  label,
  progressPct,
  color = 'teal',
}) => {
  const COLOR_MAP: Record<string, string> = {
    teal: 'bg-[#1F8FA6]',
    pink: 'bg-[#D98BE8]',
    yellow: 'bg-[#F2C94C]',
    green: 'bg-[#7ED957]',
    aqua: 'bg-[#5FD3E8]',
    orange: 'bg-[#F29B4B]',
  };

  const barColor = COLOR_MAP[color] || COLOR_MAP.teal;

  return (
    <div className="inline-flex flex-col gap-1 min-w-[110px]">
      <div className="flex items-center justify-between">
        <Pill variant="micro-status" color={color} dot>
          {label}
        </Pill>
        <span className="figure text-[10px] font-semibold text-[#8C928E] dark:text-[#5F6C70]">
          {progressPct}%
        </span>
      </div>
      {/* Thin status progress bar */}
      <div className="w-full h-1 bg-[#E7E7E2] dark:bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
        />
      </div>
    </div>
  );
};
