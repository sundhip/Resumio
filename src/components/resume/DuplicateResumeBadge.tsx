import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { ResumeDuplicateResponse } from '../../types';
import { AlertTriangle, Copy } from 'lucide-react';

interface DuplicateResumeBadgeProps {
  resumeId: string;
  variant?: 'badge' | 'banner';
}

export const DuplicateResumeBadge: React.FC<DuplicateResumeBadgeProps> = ({
  resumeId,
  variant = 'badge',
}) => {
  const [data, setData] = useState<ResumeDuplicateResponse | null>(null);

  useEffect(() => {
    if (resumeId) {
      loadDuplicateStatus();
    }
  }, [resumeId]);

  const loadDuplicateStatus = async () => {
    try {
      const res = await api.getResumeDuplicates(resumeId);
      if (res.success && res.data && res.data.hasDuplicate) {
        setData(res.data);
      } else {
        setData(null);
      }
    } catch {
      // Handled silently
    }
  };

  if (!data || !data.hasDuplicate) return null;

  if (variant === 'badge') {
    return (
      <span
        title={data.privacySafeMessage}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
      >
        <Copy className="w-3 h-3 text-amber-600" />
        {data.highestSimilarityType}
      </span>
    );
  }

  return (
    <div className="p-3 rounded-card bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <div className="space-y-0.5">
        <p className="font-bold">
          {data.highestSimilarityType === 'Exact Duplicate'
            ? 'Identical Resume Detected'
            : 'Potential Duplicate Resume'}
        </p>
        <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
          {data.privacySafeMessage}
        </p>
      </div>
    </div>
  );
};
