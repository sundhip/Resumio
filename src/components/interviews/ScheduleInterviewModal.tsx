import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import type { RealInterviewType } from '../../types';
import { Calendar, Video, Phone, MapPin, Link } from 'lucide-react';

interface ScheduleInterviewModalProps {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  applicationId,
  candidateName,
  jobTitle,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [title, setTitle] = useState('Technical Interview');
  const [interviewType, setInterviewType] = useState<RealInterviewType>('Video');
  const [date, setDate] = useState(defaultDateStr);
  const [time, setTime] = useState('10:30');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [meetingUrl, setMeetingUrl] = useState('https://meet.google.com/');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('Please join 5 minutes prior to the start time with your camera and audio ready.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('error', 'Missing Information', 'Please enter an interview title.');
      return;
    }

    if (!date || !time) {
      showToast('error', 'Missing Date/Time', 'Please select both date and time for the interview.');
      return;
    }

    const scheduledDate = new Date(`${date}T${time}:00`);
    if (isNaN(scheduledDate.getTime())) {
      showToast('error', 'Invalid Date/Time', 'Please select a valid scheduled date and time.');
      return;
    }

    if (interviewType === 'Video') {
      if (!meetingUrl.trim()) {
        showToast('error', 'Meeting URL Required', 'Please provide a video meeting link (Google Meet, Zoom, Teams, etc.).');
        return;
      }
      try {
        const u = new URL(meetingUrl.trim());
        if (!['http:', 'https:'].includes(u.protocol)) {
          showToast('error', 'Invalid URL', 'Meeting URL must start with https:// or http://');
          return;
        }
      } catch {
        showToast('error', 'Invalid URL', 'Please enter a valid web URL format.');
        return;
      }
    }

    if (interviewType === 'In Person' && !location.trim()) {
      showToast('error', 'Location Required', 'Please enter the office or physical interview location.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.scheduleInterview({
        applicationId,
        title: title.trim(),
        interviewType,
        scheduledAt: scheduledDate.toISOString(),
        durationMinutes,
        location: interviewType === 'In Person' ? location.trim() : '',
        meetingUrl: interviewType === 'Video' ? meetingUrl.trim() : '',
        description: description.trim(),
      });

      if (res.success) {
        showToast('success', 'Interview Scheduled', `Interview scheduled with ${candidateName} for ${date} at ${time}.`);
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      showToast('error', 'Scheduling Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Schedule Candidate Interview"
      description={`Set up an interview session for ${candidateName} for the "${jobTitle}" position.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1 text-xs sm:text-sm">
        {/* Interview Title */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Interview Round / Title *
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Technical Round 1, System Design, Final HR Interview"
            required
          />
        </div>

        {/* Interview Type Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Interview Type *
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setInterviewType('Video')}
              className={`p-2.5 rounded-card border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                interviewType === 'Video'
                  ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500'
                  : 'border-slate-200 dark:border-surface-dark-border bg-slate-50 dark:bg-surface-dark-bg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-surface-dark-hover'
              }`}
            >
              <Video className="w-4 h-4 text-brand-600" />
              <span>Video Call</span>
            </button>

            <button
              type="button"
              onClick={() => setInterviewType('Phone')}
              className={`p-2.5 rounded-card border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                interviewType === 'Phone'
                  ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500'
                  : 'border-slate-200 dark:border-surface-dark-border bg-slate-50 dark:bg-surface-dark-bg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-surface-dark-hover'
              }`}
            >
              <Phone className="w-4 h-4 text-indigo-600" />
              <span>Phone Call</span>
            </button>

            <button
              type="button"
              onClick={() => setInterviewType('In Person')}
              className={`p-2.5 rounded-card border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                interviewType === 'In Person'
                  ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500'
                  : 'border-slate-200 dark:border-surface-dark-border bg-slate-50 dark:bg-surface-dark-bg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-surface-dark-hover'
              }`}
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>In Person</span>
            </button>
          </div>
        </div>

        {/* Date, Time & Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Date *
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
              Time *
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
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDurationMinutes(Number(e.target.value))}
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

        {/* Video Meeting URL */}
        {interviewType === 'Video' && (
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Meeting URL *
            </label>
            <Input
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://meet.google.com/xxx-xxxx-xxx or https://zoom.us/j/xxx"
              leftIcon={<Link className="w-3.5 h-3.5 text-slate-400" />}
              required
            />
          </div>
        )}

        {/* In Person Location */}
        {interviewType === 'In Person' && (
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Office / Address Location *
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. 4th Floor, Tech Hub Tower, Bengaluru"
              leftIcon={<MapPin className="w-3.5 h-3.5 text-slate-400" />}
              required
            />
          </div>
        )}

        {/* Instructions / Notes for Candidate */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Candidate Instructions & Notes
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide any instructions, preparation topics, or interview format details for the candidate..."
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
            leftIcon={<Calendar className="w-4 h-4" />}
          >
            Confirm & Schedule
          </Button>
        </div>
      </form>
    </Modal>
  );
};
