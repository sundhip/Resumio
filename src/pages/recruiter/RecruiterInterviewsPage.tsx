import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { InterviewStatusBadge } from '../../components/interviews/InterviewStatusBadge';
import { RescheduleInterviewModal } from '../../components/interviews/RescheduleInterviewModal';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import type { InterviewItem, RealInterviewStatus } from '../../types';
import {
  Calendar,
  Clock,
  Video,
  ExternalLink,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  UserX,
} from 'lucide-react';

interface RecruiterInterviewsPageProps {
  onNavigate?: (path: string, params?: Record<string, any>) => void;
}

export const RecruiterInterviewsPage: React.FC<RecruiterInterviewsPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();

  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0,
  });
  const [statusFilter, setStatusFilter] = useState<'All' | RealInterviewStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [reschedulingInterview, setReschedulingInterview] = useState<InterviewItem | null>(null);
  const [cancellingInterview, setCancellingInterview] = useState<InterviewItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const loadInterviews = async () => {
    setIsLoading(true);
    try {
      const res = await api.getRecruiterInterviews({
        status: statusFilter !== 'All' ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
      });
      if (res.success) {
        setInterviews(res.interviews);
        setStats(res.stats);
      }
    } catch (err: any) {
      showToast('error', 'Failed to load interviews', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadInterviews();
  };

  const handleStatusUpdate = async (interviewId: string, newStatus: 'Completed' | 'No Show') => {
    try {
      const res = await api.updateInterviewStatus(interviewId, newStatus);
      if (res.success) {
        showToast('success', 'Status Updated', `Interview successfully marked as ${newStatus}.`);
        loadInterviews();
      }
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingInterview) return;
    setIsCancelling(true);
    try {
      const res = await api.cancelInterview(cancellingInterview.id, cancelReason);
      if (res.success) {
        showToast('success', 'Interview Cancelled', 'The interview has been cancelled and the candidate notified.');
        setCancellingInterview(null);
        setCancelReason('');
        loadInterviews();
      }
    } catch (err: any) {
      showToast('error', 'Cancellation Failed', err.message);
    } finally {
      setIsCancelling(false);
    }
  };

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
              Interview Management
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              {stats.scheduled} Active Upcoming
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor, reschedule, conduct, and record results for candidate interview sessions across all job postings.
          </p>
        </div>

        {onNavigate && (
          <Button
            variant="primary"
            size="md"
            onClick={() => onNavigate('applicants')}
            leftIcon={<Users className="w-4 h-4" />}
          >
            Applicant Pipeline
          </Button>
        )}
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="sm" className="space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Sessions</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
          <p className="text-[11px] text-slate-400">All historical sessions</p>
        </Card>

        <Card padding="sm" className="space-y-1">
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Upcoming / Active</span>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.scheduled}</div>
          <p className="text-[11px] text-slate-400">Scheduled & Rescheduled</p>
        </Card>

        <Card padding="sm" className="space-y-1">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Completed</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.completed}</div>
          <p className="text-[11px] text-slate-400">Conducted successfully</p>
        </Card>

        <Card padding="sm" className="space-y-1">
          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase">Cancelled / No Show</span>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.cancelled + stats.noShow}</div>
          <p className="text-[11px] text-slate-400">{stats.noShow} no show, {stats.cancelled} cancelled</p>
        </Card>
      </div>

      {/* Filters and Search Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['All', 'Scheduled', 'Rescheduled', 'Completed', 'Cancelled', 'No Show'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-control text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-surface-dark-card text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-surface-dark-border hover:bg-slate-50 dark:hover:bg-surface-dark-hover'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate or role..."
            leftIcon={<Search className="w-3.5 h-3.5 text-slate-400" />}
            className="w-full sm:w-60"
          />
          <Button type="submit" variant="secondary" size="md">
            Filter
          </Button>
        </form>
      </div>

      {/* Interviews List */}
      {isLoading ? (
        <div className="space-y-4 py-4 animate-pulse">
          <div className="h-28 rounded-card bg-slate-100 dark:bg-surface-dark-card" />
          <div className="h-28 rounded-card bg-slate-100 dark:bg-surface-dark-card" />
        </div>
      ) : interviews.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600" />}
          title="No interviews found"
          description={
            statusFilter !== 'All'
              ? `No interviews with status "${statusFilter}". Try switching filters.`
              : 'Schedule candidate interviews from the Applicant Pipeline.'
          }
          actionLabel={onNavigate ? "Go to Applicants Pipeline" : undefined}
          onAction={onNavigate ? () => onNavigate('applicants') : undefined}
        />
      ) : (
        <div className="space-y-4">
          {interviews.map((item) => {
            const { dateStr, timeStr } = formatDateTime(item.scheduledAt);
            const isActionable = item.status === 'Scheduled' || item.status === 'Rescheduled';

            return (
              <Card
                key={item.id}
                padding="md"
                className={`space-y-4 transition-all ${
                  isActionable
                    ? 'border-l-4 border-l-indigo-600'
                    : 'opacity-90 hover:opacity-100'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={
                        item.candidatePhoto ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                      }
                      alt={item.candidateName || 'Candidate'}
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 dark:ring-surface-dark-border shrink-0 mt-0.5"
                    />

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          {item.candidateName || 'Candidate'}
                        </h3>
                        <InterviewStatusBadge status={item.status} size="sm" />
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-surface-dark-input text-slate-600 dark:text-slate-400">
                          {item.interviewType}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{item.title}</span> • Job: {item.jobTitle}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {item.interviewType === 'Video' && item.meetingUrl && isActionable && (
                      <a
                        href={item.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-control bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Join Call
                        <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                      </a>
                    )}

                    {isActionable && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setReschedulingInterview(item)}
                          leftIcon={<Clock className="w-3.5 h-3.5" />}
                        >
                          Reschedule
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleStatusUpdate(item.id, 'Completed')}
                          leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        >
                          Complete
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleStatusUpdate(item.id, 'No Show')}
                          leftIcon={<UserX className="w-3.5 h-3.5 text-amber-600" />}
                        >
                          No Show
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setCancellingInterview(item)}
                          leftIcon={<XCircle className="w-3.5 h-3.5" />}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Timing Strip */}
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
                      {item.interviewType === 'Video' ? item.meetingUrl : item.location || 'N/A'}
                    </p>
                  </div>
                </div>

                {item.rescheduleReason && (
                  <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-control border border-amber-200 dark:border-amber-900/60">
                    <strong>Reschedule Note:</strong> {item.rescheduleReason}
                  </p>
                )}

                {item.cancellationReason && (
                  <p className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 p-2 rounded-control border border-rose-200 dark:border-rose-900/60">
                    <strong>Cancellation Reason:</strong> {item.cancellationReason}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingInterview && (
        <RescheduleInterviewModal
          interview={reschedulingInterview}
          isOpen={!!reschedulingInterview}
          onClose={() => setReschedulingInterview(null)}
          onSuccess={loadInterviews}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {cancellingInterview && (
        <Modal
          isOpen={!!cancellingInterview}
          onClose={() => {
            setCancellingInterview(null);
            setCancelReason('');
          }}
          size="sm"
          title="Cancel Interview Session?"
          description={`Are you sure you want to cancel the interview "${cancellingInterview.title}" with ${cancellingInterview.candidateName}? This will notify the candidate in-app.`}
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCancellingInterview(null);
                  setCancelReason('');
                }}
                disabled={isCancelling}
              >
                Keep Interview
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmCancel}
                isLoading={isCancelling}
                leftIcon={<XCircle className="w-3.5 h-3.5" />}
              >
                Confirm Cancellation
              </Button>
            </>
          }
        >
          <div className="space-y-2 py-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Reason for Cancellation (Optional)
            </label>
            <Input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Position filled, scheduling conflict"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
