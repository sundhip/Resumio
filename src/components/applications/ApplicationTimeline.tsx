import React from 'react';
import type { StatusTimelineItem } from '../../types';
import {
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Search,
  User,
  Building2,
  Shield,
} from 'lucide-react';

interface ApplicationTimelineProps {
  timeline: StatusTimelineItem[];
  className?: string;
}

export const ApplicationTimeline: React.FC<ApplicationTimelineProps> = ({ timeline, className = '' }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-slate-400">
        No status history available.
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Applied':
        return <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'Under Review':
        return <Search className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'Shortlisted':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'Rejected':
        return <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'Withdrawn':
        return <RotateCcw className="w-4 h-4 text-slate-500 dark:text-slate-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'Applied':
        return 'bg-blue-100 dark:bg-blue-950/80 border-blue-300 dark:border-blue-800';
      case 'Under Review':
        return 'bg-amber-100 dark:bg-amber-950/80 border-amber-300 dark:border-amber-800';
      case 'Shortlisted':
        return 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800';
      case 'Rejected':
        return 'bg-rose-100 dark:bg-rose-950/80 border-rose-300 dark:border-rose-800';
      case 'Withdrawn':
        return 'bg-slate-100 dark:bg-surface-dark-input border-slate-300 dark:border-surface-dark-border';
      default:
        return 'bg-slate-100 dark:bg-surface-dark-input border-slate-200 dark:border-surface-dark-border';
    }
  };

  const getActorBadge = (role: string) => {
    switch (role) {
      case 'candidate':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-surface-dark-bg text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-surface-dark-border">
            <User className="w-3 h-3" /> Candidate
          </span>
        );
      case 'recruiter':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60">
            <Building2 className="w-3 h-3" /> Hiring Team
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
            <Shield className="w-3 h-3" /> Admin
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-surface-dark-border">
        {timeline.map((item, idx) => {
          const isLatest = idx === timeline.length - 1;
          const statusBg = getStatusBg(item.newStatus);
          const icon = getStatusIcon(item.newStatus);

          return (
            <div key={item.id || idx} className="relative group">
              {/* Timeline Node Dot */}
              <div
                className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-transform shadow-xs ${statusBg} ${
                  isLatest ? 'ring-2 ring-brand-500/20 scale-110' : ''
                }`}
              >
                {icon}
              </div>

              {/* Timeline Content */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {item.newStatus}
                  </span>
                  {getActorBadge(item.changedByRole)}
                  {isLatest && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-brand-600 text-white shadow-2xs">
                      Current
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 dark:text-slate-500">
                  {new Date(item.changedAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>

                {item.note && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-surface-dark-bg/60 p-2.5 rounded-control border border-slate-200/80 dark:border-surface-dark-border mt-1 leading-relaxed">
                    {item.note}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
