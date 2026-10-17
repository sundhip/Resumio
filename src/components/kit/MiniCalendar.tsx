import React, { useState } from 'react';

export interface CalendarEventDot {
  day: number;
  color: 'teal' | 'pink' | 'yellow' | 'green' | 'aqua' | 'orange';
  tooltip?: string;
}

export interface MiniCalendarProps {
  events?: CalendarEventDot[];
  selectedDay?: number;
  onSelectDay?: (day: number) => void;
  monthName?: string;
  year?: number;
  className?: string;
}

const DOT_COLORS: Record<string, string> = {
  teal: 'bg-[#1F8FA6]',
  pink: 'bg-[#D98BE8]',
  yellow: 'bg-[#F2C94C]',
  green: 'bg-[#7ED957]',
  aqua: 'bg-[#5FD3E8]',
  orange: 'bg-[#F29B4B]',
};

export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  events = [
    { day: 4, color: 'teal', tooltip: 'AI Interview' },
    { day: 12, color: 'pink', tooltip: 'Application deadline' },
    { day: 19, color: 'green', tooltip: 'Hiring manager debrief' },
    { day: 26, color: 'yellow', tooltip: 'Technical review' },
  ],
  selectedDay: propSelectedDay,
  onSelectDay,
  monthName = 'October',
  year = 2026,
  className = '',
}) => {
  const [activeDay, setActiveDay] = useState<number>(propSelectedDay || 16);

  const daysInMonth = 31;
  const startDayOfWeek = 3; // Wednesday (0 = Sun, 1 = Mon, ..., 3 = Wed)
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const handleDayClick = (day: number) => {
    setActiveDay(day);
    if (onSelectDay) onSelectDay(day);
  };

  return (
    <div className={`w-full max-w-[340px] p-4 rounded-[20px] bg-white dark:bg-[#0C1113] border border-[#E7E7E2] dark:border-white/6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-[#111312] dark:text-[#F2F6F7]">
          {monthName} {year}
        </span>
        <div className="flex items-center gap-1.5 text-[#8C928E] dark:text-[#5F6C70]">
          <button
            type="button"
            className="w-9 h-9 min-h-[36px] min-w-[36px] rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            aria-label="Previous month"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            className="w-9 h-9 min-h-[36px] min-w-[36px] rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            aria-label="Next month"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {daysOfWeek.map((dow, idx) => (
          <span
            key={idx}
            className="text-[11px] font-semibold text-[#8C928E] dark:text-[#5F6C70] uppercase"
          >
            {dow}
          </span>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {/* Leading empty spaces */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="h-11 min-h-[44px] min-w-[36px] w-full" />
        ))}

        {/* Calendar days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isSelected = day === activeDay;
          const dayEvents = events.filter((e) => e.day === day);

          return (
            <button
              key={day}
              type="button"
              aria-label={`October ${day}, 2026`}
              onClick={() => handleDayClick(day)}
              className={`h-11 min-h-[44px] min-w-[36px] w-full rounded-xl flex flex-col items-center justify-center relative text-xs font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F8FA6] ${
                isSelected
                  ? 'bg-[#167A8C] text-white font-bold shadow-sm'
                  : 'text-[#111312] dark:text-[#F2F6F7] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <span className="figure">{day}</span>

              {/* Event Dots */}
              {dayEvents.length > 0 && (
                <div className="absolute bottom-1 flex items-center justify-center gap-0.5">
                  {dayEvents.map((ev, eIdx) => (
                    <span
                      key={eIdx}
                      className={`w-1 h-1 rounded-full ${
                        isSelected ? 'bg-white' : DOT_COLORS[ev.color] || DOT_COLORS.teal
                      }`}
                      title={ev.tooltip}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
