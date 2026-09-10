import React, { useState } from 'react';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight, Video } from 'lucide-react';
import type { Interview } from '../../types';

export interface CalendarProps {
  interviews?: Interview[];
  onSelectDate?: (dateStr: string) => void;
  selectedDate?: string;
  className?: string;
}

export const Calendar: React.FC<CalendarProps> = ({
  interviews = [],
  onSelectDate,
  selectedDate,
  className,
}) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date(2026, 8, 1)); // Sep 2026

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  // Days calculations
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDaysInMonth = new Date(year, month, 0).getDate();

  const days: { dayNumber: number; currentMonth: boolean; dateStr: string }[] = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevDaysInMonth - i;
    const m = month === 0 ? 12 : month;
    const y = month === 0 ? year - 1 : year;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ dayNumber: d, currentMonth: false, dateStr });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push({ dayNumber: i, currentMonth: true, dateStr });
  }

  // Next month leading days to fill grid (35 or 42 cells)
  const remaining = 35 - days.length > 0 ? 35 - days.length : 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const m = month === 11 ? 1 : month + 2;
    const y = month === 11 ? year + 1 : year;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push({ dayNumber: i, currentMonth: false, dateStr });
  }

  const todayStr = '2026-09-10'; // Matching our environment timestamp

  const hasInterview = (dateStr: string) => {
    return interviews.some((it) => it.date === dateStr);
  };

  return (
    <div className={clsx('w-full', className)}>
      {/* Month & Nav */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {monthNames[month]} {year}
        </h4>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1 rounded-control text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-dark-hover transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded-control text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-dark-hover transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-1">
        <span>Su</span>
        <span>Mo</span>
        <span>Tu</span>
        <span>We</span>
        <span>Th</span>
        <span>Fr</span>
        <span>Sa</span>
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(({ dayNumber, currentMonth, dateStr }, idx) => {
          const isToday = dateStr === todayStr;
          const isSelected = selectedDate === dateStr;
          const hasEvent = hasInterview(dateStr);

          return (
            <button
              key={idx}
              onClick={() => {
                if (currentMonth && onSelectDate) onSelectDate(dateStr);
              }}
              className={clsx(
                'h-8 text-xs rounded-control flex flex-col items-center justify-center relative transition-all duration-150 select-none',
                !currentMonth && 'text-slate-300 dark:text-slate-700 pointer-events-none opacity-40',
                currentMonth && !isSelected && !isToday && 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-surface-dark-hover',
                isToday && !isSelected && 'border border-brand-500/50 text-brand-600 dark:text-brand-400 font-bold bg-brand-50/40 dark:bg-brand-950/30',
                isSelected && 'bg-brand-600 text-white font-bold shadow-sm'
              )}
            >
              <span>{dayNumber}</span>
              {hasEvent && (
                <span
                  className={clsx(
                    'w-1 h-1 rounded-full absolute bottom-1',
                    isSelected ? 'bg-white' : 'bg-brand-500'
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Upcoming events preview */}
      {interviews.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-surface-dark-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Upcoming ({interviews.length})
            </span>
          </div>
          <div className="space-y-2">
            {interviews.map((int) => (
              <div
                key={int.id}
                className="p-2.5 rounded-control bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200/60 dark:border-surface-dark-border/60 flex items-start justify-between gap-2 text-left"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-500" />
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {int.jobTitle}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {int.date} • {int.time} ({int.type})
                  </p>
                </div>
                <a
                  href={int.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-1.5 rounded bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/80 text-brand-600 dark:text-brand-400 transition-colors"
                  title="Join Meeting"
                >
                  <Video className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
