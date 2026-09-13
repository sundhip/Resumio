import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { InterviewStatusBadge } from '../../components/interviews/InterviewStatusBadge';
import { api } from '../../services/api';
import type { InterviewItem } from '../../types';
import {
  Calendar,
  Clock,
  Video,
  Phone,
  MapPin,
  ExternalLink,
  Building2,
  Briefcase,
  User,
} from 'lucide-react';

interface CandidateInterviewsPageProps {
  onNavigate?: (path: string, params?: Record<string, any>) => void;
}

export const CandidateInterviewsPage: React.FC<CandidateInterviewsPageProps> = ({ onNavigate }) => {
  const [upcoming, setUpcoming] = useState<InterviewItem[]>([]);
  const [past, setPast] = useState<InterviewItem[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [isLoading, setIsLoading] = useState(true);

  const loadInterviews = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCandidateInterviews();
      if (res.success) {
        setUpcoming(res.upcoming);
        setPast(res.past);
      }
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, []);

  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return {
        dateStr: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        timeStr: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      };
    } catch {
      return { dateStr: isoString, timeStr: '' };
    }
  };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              My Interviews
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              {upcoming.length} Upcoming
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Access meeting links, view scheduled session timings, and review interview preparation instructions.
          </p>
        </div>

        {onNavigate && (
          <Button
            variant="outline"
            size="md"
            onClick={() => onNavigate('applications')}
            leftIcon={<Briefcase className="w-4 h-4" />}
          >
            View Applications
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-surface-dark-border pb-2">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-control text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'upcoming'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-dark-hover'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Upcoming Sessions ({upcoming.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('past')}
          className={`px-4 py-2 rounded-control text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'past'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-dark-hover'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Interview History ({past.length})</span>
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4 py-4 animate-pulse">
          <div className="h-32 rounded-card bg-slate-100 dark:bg-surface-dark-card" />
          <div className="h-32 rounded-card bg-slate-100 dark:bg-surface-dark-card" />
        </div>
      ) : activeTab === 'upcoming' ? (
        upcoming.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600" />}
            title="No upcoming interviews"
            description="When employers shortlist your profile and schedule an interview, it will appear here."
            actionLabel={onNavigate ? "Explore Open Positions" : undefined}
            onAction={onNavigate ? () => onNavigate('jobs') : undefined}
          />
        ) : (
          <div className="space-y-4">
            {upcoming.map((item) => {
              const { dateStr, timeStr } = formatDateTime(item.scheduledAt);
              return (
                <Card
                  key={item.id}
                  padding="md"
                  className="space-y-4 border-l-4 border-l-brand-600 hover:border-slate-300 dark:hover:border-surface-dark-border transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </h3>
                        <InterviewStatusBadge status={item.status} size="sm" />
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-surface-dark-input text-slate-600 dark:text-slate-400">
                          {item.interviewType}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-brand-600" />
                          {item.companyName}
                        </span>
                        <span>•</span>
                        <span>Role: {item.jobTitle}</span>
                        {item.recruiterName && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              Interviewer: {item.recruiterName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Join Meeting Action */}
                    <div className="shrink-0">
                      {item.interviewType === 'Video' && item.meetingUrl ? (
                        <a
                          href={item.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-control bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors shadow-sm"
                        >
                          <Video className="w-4 h-4" />
                          Join Video Call
                          <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                        </a>
                      ) : item.interviewType === 'Phone' ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs border border-indigo-200 dark:border-indigo-800">
                          <Phone className="w-3.5 h-3.5" />
                          Phone Interview
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-200 dark:border-emerald-800">
                          <MapPin className="w-3.5 h-3.5" />
                          On-Site Meeting
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Date & Time Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-card bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-100 dark:border-surface-dark-border text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Date</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-brand-600" />
                        {dateStr}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Time</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        {timeStr}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Duration</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {item.durationMinutes} minutes
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Location / Link</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                        {item.interviewType === 'Video'
                          ? 'Online Video Room'
                          : item.location || 'Location provided in notes'}
                      </p>
                    </div>
                  </div>

                  {/* Reschedule Note (if rescheduled) */}
                  {item.status === 'Rescheduled' && item.rescheduleReason && (
                    <div className="p-2.5 rounded-card bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                      <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
                      <div>
                        <span className="font-bold">Rescheduled: </span>
                        <span>{item.rescheduleReason}</span>
                      </div>
                    </div>
                  )}

                  {/* Description / Preparation Notes */}
                  {item.description && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Employer Instructions & Preparation
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-surface-dark-card p-3 rounded-card border border-slate-200/60 dark:border-surface-dark-border">
                        {item.description}
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )
      ) : (
        /* Past Interviews Tab */
        past.length === 0 ? (
          <EmptyState
            icon={<Clock className="w-10 h-10 text-slate-300 dark:text-slate-600" />}
            title="No past interview records"
            description="Completed and past interview records will be archived here."
          />
        ) : (
          <div className="space-y-3">
            {past.map((item) => {
              const { dateStr, timeStr } = formatDateTime(item.scheduledAt);
              return (
                <Card key={item.id} padding="sm" className="opacity-90 hover:opacity-100 transition-opacity">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </h4>
                        <InterviewStatusBadge status={item.status} size="sm" />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.companyName} • {item.jobTitle} • {dateStr} at {timeStr}
                      </p>
                    </div>

                    {item.cancellationReason && (
                      <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                        Cancelled: {item.cancellationReason}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};
