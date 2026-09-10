import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import type { InterviewItem } from '../../types';
import { Clock, Link, MapPin } from 'lucide-react';

interface RescheduleInterviewModalProps {
  interview: InterviewItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RescheduleInterviewModal: React.FC<RescheduleInterviewModalProps> = ({
  interview,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();

  const [date, setDate] = useState('');
  const [time, setTime] = useState('11:00');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [location, setLocation] = useState('');
  const [reason, setReason] = useState('Schedule adjustment due to interviewer availability');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (interview && isOpen) {
      try {
        const d = new Date(interview.scheduledAt);
        if (!isNaN(d.getTime())) {
          setDate(d.toISOString().split('T')[0]);
          const hours = String(d.getHours()).padStart(2, '0');
          const minutes = String(d.getMinutes()).padStart(2, '0');
          setTime(`${hours}:${minutes}`);
        }
      } catch {
        setDate('');
      }
      setDurationMinutes(interview.durationMinutes || 45);
      setMeetingUrl(interview.meetingUrl || '');
      setLocation(interview.location || '');
      setReason('');
    }
  }, [interview, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interview) return;

    if (!date || !time) {
      showToast('error', 'Missing Date/Time', 'Please select a new date and time.');
      return;
    }

    const scheduledDate = new Date(`${date}T${time}:00`);
    if (isNaN(scheduledDate.getTime())) {
      showToast('error', 'Invalid Date/Time', 'Please provide a valid date and time.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.rescheduleInterview(interview.id, {
        scheduledAt: scheduledDate.toISOString(),
        durationMinutes,
        meetingUrl: interview.interviewType === 'Video' ? meetingUrl.trim() : undefined,
        location: interview.interviewType === 'In Person' ? location.trim() : undefined,
        reason: reason.trim(),
      });

      if (res.success) {
        showToast('success', 'Interview Rescheduled', `Interview rescheduled to ${date} at ${time}. Candidate has been notified.`);
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      showToast('error', 'Rescheduling Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!interview) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Reschedule Interview"
      description={`Change date, time, or link for ${interview.candidateName ? interview.candidateName + "'s" : ''} "${interview.title}".`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1 text-xs sm:text-sm">
        {/* Date, Time & Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              New Date *
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              New Time *
            </label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Duration
            </label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-control border border-slate-200 dark:border-surface-dark-border bg-white dark:bg-surface-dark-input text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes (1 hr)</option>
              <option value={90}>90 minutes (1.5 hr)</option>
            </select>
          </div>
        </div>

        {/* Video Meeting URL (if Video) */}
        {interview.interviewType === 'Video' && (
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Meeting URL
            </label>
            <Input
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              leftIcon={<Link className="w-3.5 h-3.5 text-slate-400" />}
            />
          </div>
        )}

        {/* Location (if In Person) */}
        {interview.interviewType === 'In Person' && (
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Location / Office
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              leftIcon={<MapPin className="w-3.5 h-3.5 text-slate-400" />}
            />
          </div>
        )}

        {/* Reschedule Reason */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Reschedule Reason & Note for Candidate
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Brief reason or updated instructions for the candidate..."
            rows={2}
            className="w-full p-2.5 rounded-control text-xs bg-white dark:bg-surface-dark-input text-slate-900 dark:text-white border border-slate-200 dark:border-surface-dark-border focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-surface-dark-border">
          <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            leftIcon={<Clock className="w-4 h-4" />}
          >
            Confirm Reschedule
          </Button>
        </div>
      </form>
    </Modal>
  );
};
