import React, { useState, useEffect } from 'react';
import { Pill } from '../kit/Pill';
import { Button } from '../kit/Button';
import { Sparkles, X, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';

interface ProductTourCalloutProps {
  tourKey: string;
  title: string;
  description: string;
  tipText?: string;
  badgeText?: string;
  onExploreMore?: () => void;
  className?: string;
}

export const ProductTourCallout: React.FC<ProductTourCalloutProps> = ({
  tourKey,
  title,
  description,
  tipText,
  badgeText = 'First Visit Guide',
  onExploreMore,
  className = '',
}) => {
  const storageId = `resumio_tour_callout_${tourKey}`;
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem(storageId) === 'true';
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, [storageId]);

  const handleDismiss = () => {
    localStorage.setItem(storageId, 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label={title}
      className={`relative p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#1F8FA6]/10 via-[#2BB3C9]/5 to-transparent border border-[#1F8FA6]/30 dark:border-[#5FD3E8]/30 shadow-[0_8px_24px_rgba(31,143,166,0.12)] backdrop-blur-xs animate-in fade-in slide-in-from-top-2 duration-300 ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#1F8FA6] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-[0_2px_8px_rgba(43,179,201,0.4)]">
            <Sparkles className="w-4 h-4 text-white" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Pill variant="micro-status" color="teal">
                {badgeText}
              </Pill>
              <h3 className="text-sm font-bold text-[#111312] dark:text-[#F2F6F7] tracking-tight">
                {title}
              </h3>
            </div>

            <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed max-w-2xl font-medium">
              {description}
            </p>

            {tipText && (
              <div className="pt-1 flex items-center gap-1.5 text-[11px] text-[#1F8FA6] dark:text-[#5FD3E8] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Tip: {tipText}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onExploreMore && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onExploreMore}
              trailingIcon={<ChevronRight className="w-3.5 h-3.5" />}
              className="text-xs hidden sm:inline-flex"
            >
              Learn More
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-xs text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:hover:text-[#F2F6F7]"
          >
            Got it
          </Button>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-full text-[#8C928E] dark:text-[#5F6C70] hover:text-[#111312] dark:hover:text-[#F2F6F7] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Dismiss tour guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
