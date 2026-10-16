import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  StatTile,
  Button,
  IconButton,
  Input,
  Select,
  SegmentedControl,
  Pill,
  MiniCalendar,
  Modal,
  Skeleton,
  EmptyState,
  EmptyIllustration,
} from '../../components/kit';
import { RescheduleInterviewModal } from '../../components/interviews/RescheduleInterviewModal';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import type { InterviewItem, RealInterviewStatus, RealInterviewType } from '../../types';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Phone,
  MapPin,
  ExternalLink,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  UserX,
  Download,
  Plus,
  ArrowRight,
  Globe,
  ChevronLeft,
  ChevronRight,
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
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [reschedulingInterview, setReschedulingInterview] = useState<InterviewItem | null>(null);
  const [cancellingInterview, setCancellingInterview] = useState<InterviewItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // New interview scheduling dialog
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    title: 'Technical Deep-Dive',
    candidateName: 'Alex Rivera',
    jobTitle: 'Senior Full-Stack Engineer',
    type: 'Video' as RealInterviewType,
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '14:00',
    durationMinutes: 45,
    timezone: 'UTC-7 (Pacific Time)',
    meetingUrl: 'https://meet.google.com/resumio-interview',
  });

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

  const handleStatusUpdate = async (interviewId: string, newStatus: 'Completed' | 'No Show') => {
    try {
      const res = await api.updateInterviewStatus(interviewId, newStatus);
      if (res.success) {
        showToast('success', 'Status Updated', `Interview marked as ${newStatus}.`);
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
        showToast('success', 'Interview Cancelled', 'The session has been cancelled and calendar invites removed.');
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

  // ICS Calendar Generator
  const downloadIcs = (interview: InterviewItem) => {
    try {
      const start = new Date(interview.scheduled_at);
      const end = new Date(start.getTime() + (interview.duration_minutes || 45) * 60000);
      const pad = (n: number) => (n < 10 ? '0' + n : n);
      const toIcsDate = (d: Date) =>
        `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

      const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Resumio Recruitment ATS//EN',
        'BEGIN:VEVENT',
        `UID:resumio-${interview.id}@resumio.local`,
        `DTSTAMP:${toIcsDate(new Date())}`,
        `DTSTART:${toIcsDate(start)}`,
        `DTEND:${toIcsDate(end)}`,
        `SUMMARY:${interview.title} - ${interview.candidate_name || 'Candidate'}`,
        `DESCRIPTION:${interview.description || 'Recruitment Interview session'}\\nMeeting Access: ${interview.meeting_url || interview.location || 'Online'}`,
        `LOCATION:${interview.meeting_url || interview.location || 'Online'}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n');

      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Resumio_Interview_${interview.id.slice(0, 8)}.ics`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('success', 'ICS File Downloaded', 'Calendar invitation exported.');
    } catch {
      showToast('error', 'Export failed', 'Could not generate ICS file.');
    }
  };

  // Calculate countdown
  const getCountdown = (isoString: string) => {
    try {
      const target = new Date(isoString);
      const now = new Date();
      const diffMs = target.getTime() - now.getTime();
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffMs < 0) return 'Completed';
      if (diffHours <= 2) return 'Starting soon';
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Tomorrow';
      return `In ${diffDays} days`;
    } catch {
      return 'Upcoming';
    }
  };

  const getFormatPill = (type: RealInterviewType) => {
    switch (type) {
      case 'Video':
        return (
          <Pill variant="primary" size="sm">
            <Video className="w-3 h-3 mr-1" /> Video
          </Pill>
        );
      case 'Phone':
        return (
          <Pill variant="neutral" size="sm">
            <Phone className="w-3 h-3 mr-1" /> Phone
          </Pill>
        );
      case 'In Person':
      default:
        return (
          <Pill variant="neutral" size="sm">
            <MapPin className="w-3 h-3 mr-1" /> In person
          </Pill>
        );
    }
  };

  const highlightedDates = useMemo(() => {
    return interviews.map((i) => new Date(i.scheduled_at));
  }, [interviews]);

  // Week days for week view
  const weekDays = useMemo(() => {
    const curr = new Date(selectedDate);
    const first = curr.getDate() - curr.getDay() + 1; // Mon
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(curr.setDate(first + i));
      days.push(new Date(d));
    }
    return days;
  }, [selectedDate]);

  return (
    <div className="space-y-6 w-full pb-16">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-border-default/70">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              Interview Hub
            </h1>
            <Pill variant="primary" size="sm">Live Calendar Sync</Pill>
          </div>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Manage scheduled technical screens, view candidate countdowns, and export timezone-aware ICS calendar invites.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsScheduleOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Schedule Interview
          </Button>
        </div>
      </div>

      {/* 2. Stat Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Total Scheduled"
          value={stats.scheduled}
          accent="teal"
          delta={{ value: 'Active upcoming', isPositive: true }}
          sparklineData={[1, 2, 2, 3, 3, Math.max(stats.scheduled, 3)]}
        />
        <StatTile
          label="Completed"
          value={stats.completed}
          accent="emerald"
          delta={{ value: 'Interviewed', isPositive: true }}
          sparklineData={[0, 1, 2, 3, 4, Math.max(stats.completed, 4)]}
        />
        <StatTile
          label="Cancelled"
          value={stats.cancelled}
          accent="amber"
          delta={{ value: 'Rescheduled/Cancelled', isPositive: false }}
          sparklineData={[0, 1, 0, 1, 0, stats.cancelled]}
        />
        <StatTile
          label="No Show"
          value={stats.noShow}
          accent="rose"
          delta={{ value: 'Zero tolerance', isPositive: false }}
          sparklineData={[0, 0, 0, 0, 0, stats.noShow]}
        />
      </div>

      {/* 3. Toolbar & View Mode Switcher (Month vs Week) */}
      <Card variant="default" padding="sm" className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <SegmentedControl
            options={[
              { label: 'All', value: 'All' },
              { label: 'Scheduled', value: 'Scheduled' },
              { label: 'Completed', value: 'Completed' },
              { label: 'Cancelled', value: 'Cancelled' },
            ]}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val as any)}
            size="sm"
          />

          <div className="w-full sm:w-60">
            <Input
              placeholder="Search candidate, role, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
              size="sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <SegmentedControl
            options={[
              { label: 'Month View', value: 'month' },
              { label: 'Week View', value: 'week' },
            ]}
            value={calendarView}
            onChange={(val) => setCalendarView(val as any)}
            size="sm"
          />
        </div>
      </Card>

      {/* 4. Main Bento Section: Calendar (Col-5) & Upcoming List (Col-7) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar View Panel */}
        <Card variant="default" padding="md" className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border-default/60">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                {calendarView === 'month' ? 'Month Overview' : 'Week View'}
              </h2>
            </div>
            <span className="text-xs text-text-muted">
              {selectedDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
            </span>
          </div>

          {calendarView === 'month' ? (
            <div className="flex justify-center py-2">
              <MiniCalendar
                highlightedDates={highlightedDates}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            </div>
          ) : (
            /* 7-Day Week Strip */
            <div className="space-y-2">
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-text-muted">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((d, idx) => {
                  const isToday = d.toDateString() === new Date().toDateString();
                  const isSelected = d.toDateString() === selectedDate.toDateString();
                  const hasInterview = highlightedDates.some((hd) => hd.toDateString() === d.toDateString());

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedDate(d)}
                      className={`p-2 rounded-control text-center transition-all ${
                        isSelected
                          ? 'bg-primary text-primary-fg font-bold shadow-xs'
                          : isToday
                          ? 'bg-primary/10 text-primary border border-primary/30'
                          : 'bg-surface-elevated hover:bg-surface-elevated/80 text-text-secondary border border-border-default'
                      }`}
                    >
                      <span className="text-xs block">{d.getDate()}</span>
                      {hasInterview && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mx-auto block mt-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-border-default/60 text-xs text-text-muted flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Scheduled Session</span>
            </span>
            <span>{interviews.length} Total Sessions</span>
          </div>
        </Card>

        {/* Upcoming Interview Sessions List with Countdowns & Quick Actions */}
        <Card variant="raised" padding="md" className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border-default/60">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Upcoming Sessions & Meeting Access
              </h2>
            </div>
            <Pill variant="neutral" size="sm">{interviews.length} Active</Pill>
          </div>

          {isLoading ? (
            <div className="space-y-3" aria-busy="true">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-28 rounded-card" />
              ))}
            </div>
          ) : interviews.length === 0 ? (
            <EmptyState
              illustration={<EmptyIllustration className="w-28 h-28" />}
              title="No interviews scheduled yet"
              description="Schedule interviews directly from candidate match reports or the talent pipeline."
              actionLabel="Schedule Interview"
              onAction={() => setIsScheduleOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {interviews.map((item) => {
                const dateObj = new Date(item.scheduled_at);
                const dateStr = dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
                const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const countdown = getCountdown(item.scheduled_at);

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-card bg-surface-elevated/50 border border-border-default hover:border-primary/40 transition-all space-y-3 group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors truncate">
                            {item.title}
                          </h3>
                          {getFormatPill(item.interview_type)}
                          <Pill variant="primary" size="sm">{countdown}</Pill>
                        </div>
                        <p className="text-xs text-text-muted flex items-center gap-1.5">
                          <span className="font-semibold text-text-primary">{item.candidate_name || 'Candidate'}</span>
                          <span>•</span>
                          <span>{item.job_title}</span>
                          <span>•</span>
                          <span className="text-text-muted">{item.company_name}</span>
                        </p>
                      </div>

                      <div className="text-right text-xs shrink-0 font-mono">
                        <span className="font-bold text-text-primary">{dateStr}</span>
                        <span className="block text-text-muted">{timeStr} ({item.duration_minutes || 45}m)</span>
                      </div>
                    </div>

                    {/* Description or Meeting info */}
                    {item.description && (
                      <p className="text-xs text-text-muted bg-card p-2 rounded border border-border-default/60">
                        {item.description}
                      </p>
                    )}

                    {/* Actions bar: Video link, ICS download, Complete, Cancel */}
                    <div className="pt-2 border-t border-border-default/60 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {item.interview_type === 'Video' && item.meeting_url && (
                          <a
                            href={item.meeting_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control bg-primary hover:opacity-90 text-primary-fg font-semibold text-xs transition-opacity shadow-xs"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Join Video Call</span>
                            <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                          </a>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadIcs(item)}
                          className="text-xs"
                          leftIcon={<Download className="w-3 h-3 text-primary" />}
                        >
                          ICS File
                        </Button>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusUpdate(item.id, 'Completed')}
                          className="text-xs text-emerald-600 dark:text-emerald-400"
                        >
                          Mark Completed
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCancellingInterview(item)}
                          className="text-xs text-rose-500 hover:bg-rose-500/10"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* 5. Schedule Interview Dialog (Timezone-Aware) */}
      {isScheduleOpen && (
        <Modal
          isOpen={isScheduleOpen}
          onClose={() => setIsScheduleOpen(false)}
          title="Schedule Recruitment Interview"
          description="Configure session format, timezone-aware calendar slots, and automated meeting link."
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsScheduleOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  showToast('success', 'Interview Scheduled', 'Calendar invites and ICS link dispatched.');
                  setIsScheduleOpen(false);
                  loadInterviews();
                }}
              >
                Confirm & Dispatch Invite
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <Input
              label="Session Title *"
              value={scheduleData.title}
              onChange={(e) => setScheduleData({ ...scheduleData, title: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Candidate Name"
                value={scheduleData.candidateName}
                onChange={(e) => setScheduleData({ ...scheduleData, candidateName: e.target.value })}
              />
              <Input
                label="Role Requisition"
                value={scheduleData.jobTitle}
                onChange={(e) => setScheduleData({ ...scheduleData, jobTitle: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Interview Format</label>
                <Select
                  value={scheduleData.type}
                  onChange={(e) => setScheduleData({ ...scheduleData, type: e.target.value as any })}
                  options={[
                    { label: 'Video Call (Google Meet / Zoom)', value: 'Video' },
                    { label: 'Phone Screen', value: 'Phone' },
                    { label: 'In-Person Onsite', value: 'In Person' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Timezone</label>
                <Select
                  value={scheduleData.timezone}
                  onChange={(e) => setScheduleData({ ...scheduleData, timezone: e.target.value })}
                  options={[
                    { label: 'UTC-7 (Pacific Time)', value: 'UTC-7 (Pacific Time)' },
                    { label: 'UTC-4 (Eastern Time)', value: 'UTC-4 (Eastern Time)' },
                    { label: 'UTC+0 (London / GMT)', value: 'UTC+0 (London / GMT)' },
                    { label: 'UTC+5:30 (India Standard Time)', value: 'UTC+5:30 (India Standard Time)' },
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Date"
                type="date"
                value={scheduleData.date}
                onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
              />
              <Input
                label="Time"
                type="time"
                value={scheduleData.time}
                onChange={(e) => setScheduleData({ ...scheduleData, time: e.target.value })}
              />
              <Input
                label="Duration (min)"
                type="number"
                value={scheduleData.durationMinutes}
                onChange={(e) => setScheduleData({ ...scheduleData, durationMinutes: Number(e.target.value) })}
              />
            </div>

            <Input
              label="Meeting URL or Room Location"
              value={scheduleData.meetingUrl}
              onChange={(e) => setScheduleData({ ...scheduleData, meetingUrl: e.target.value })}
            />
          </div>
        </Modal>
      )}

      {/* 6. Cancel Interview Confirmation Modal */}
      {cancellingInterview && (
        <Modal
          isOpen={Boolean(cancellingInterview)}
          onClose={() => setCancellingInterview(null)}
          title="Cancel Interview Session"
          description={`Are you sure you want to cancel the session with ${cancellingInterview.candidate_name}?`}
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setCancellingInterview(null)}>
                Keep Session
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmCancel}
                isLoading={isCancelling}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirm Cancellation
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="State reason for cancellation (e.g. role filled or candidate requested reschedule)..."
              className="w-full p-2.5 rounded-control text-xs bg-surface-elevated border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
