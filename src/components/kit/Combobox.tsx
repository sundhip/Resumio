import React, { useState, useRef, useEffect } from 'react';

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
  category?: string;
}

export interface ComboboxProps {
  label?: string;
  placeholder?: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
  error?: string;
  className?: string;
}

export const Combobox: React.FC<ComboboxProps> = ({
  label,
  placeholder = 'Select or search...',
  options,
  value,
  onChange,
  helperText,
  error,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#5E6460] dark:text-[#9AA7AB] mb-1.5">
          {label}
        </label>
      )}

      {/* Input / Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-10 rounded-[12px] text-sm bg-white dark:bg-[#0C1113] text-[#111312] dark:text-[#F2F6F7] border px-3.5 flex items-center justify-between cursor-pointer transition-all duration-150 ${
          error
            ? 'border-[#F2677A]'
            : isOpen
            ? 'border-[#1F8FA6] ring-2 ring-[#1F8FA6]/30'
            : 'border-[#E7E7E2] dark:border-white/10 hover:border-[#1F8FA6]/50'
        }`}
      >
        <span className={selectedOption ? 'font-medium' : 'text-[#8C928E] dark:text-[#5F6C70]'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-[#8C928E] transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 p-2 rounded-[16px] bg-white dark:bg-[#111719] border border-[#E7E7E2] dark:border-white/10 shadow-[0_8px_24px_rgba(17,19,18,0.12)] max-h-60 overflow-y-auto">
          {/* Search box inside dropdown */}
          <div className="mb-2 px-1">
            <input
              type="text"
              autoFocus
              placeholder="Type to filter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 px-2.5 rounded-[8px] text-xs bg-[#F4F4F1] dark:bg-[#0C1113] text-[#111312] dark:text-[#F2F6F7] border border-[#E7E7E2] dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#1F8FA6]"
            />
          </div>

          {filteredOptions.length === 0 ? (
            <div className="py-3 text-center text-xs text-[#8C928E] dark:text-[#5F6C70]">
              No matches found
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-[10px] text-sm cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#1F8FA6]/15 text-[#1F8FA6] dark:text-[#5FD3E8] font-semibold'
                      : 'hover:bg-black/5 dark:hover:bg-white/5 text-[#111312] dark:text-[#F2F6F7]'
                  }`}
                >
                  <div>
                    <div>{opt.label}</div>
                    {opt.sublabel && (
                      <div className="text-xs text-[#8C928E] dark:text-[#5F6C70]">
                        {opt.sublabel}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <svg className="w-4 h-4 text-[#1F8FA6] dark:text-[#5FD3E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {error ? (
        <p className="mt-1.5 text-xs text-[#F2677A] font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-[#8C928E] dark:text-[#5F6C70]">{helperText}</p>
      ) : null}
    </div>
  );
};
