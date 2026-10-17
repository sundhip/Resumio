import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { CandidateExperience, EmploymentType } from '../../types';
import { Briefcase, Building2, MapPin, Calendar, Save } from 'lucide-react';

interface ExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  experienceToEdit?: CandidateExperience | null;
  onSave: (data: Omit<CandidateExperience, 'id' | 'candidate_profile_id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

export const ExperienceModal: React.FC<ExperienceModalProps> = ({
  isOpen,
  onClose,
  experienceToEdit,
  onSave,
}) => {
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('Full-time');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentlyWorking, setCurrentlyWorking] = useState(false);
  const [description, setDescription] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (experienceToEdit) {
        setJobTitle(experienceToEdit.job_title || '');
        setCompany(experienceToEdit.company || '');
        setEmploymentType(experienceToEdit.employment_type || 'Full-time');
        setLocation(experienceToEdit.location || '');
        setStartDate(experienceToEdit.start_date || '');
        setEndDate(experienceToEdit.end_date || '');
        setCurrentlyWorking(Boolean(experienceToEdit.currently_working));
        setDescription(experienceToEdit.description || '');
      } else {
        setJobTitle('');
        setCompany('');
        setEmploymentType('Full-time');
        setLocation('');
        setStartDate('');
        setEndDate('');
        setCurrentlyWorking(false);
        setDescription('');
      }
      setErrorMessage(null);
    }
  }, [isOpen, experienceToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!jobTitle.trim()) {
      setErrorMessage('Job title is required (e.g. Senior Frontend Engineer).');
      return;
    }
    if (!company.trim()) {
      setErrorMessage('Company / Organization name is required.');
      return;
    }
    if (!startDate.trim()) {
      setErrorMessage('Start date is required.');
      return;
    }
    if (!currentlyWorking && endDate && endDate < startDate) {
      setErrorMessage('End date must be on or after start date.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        job_title: jobTitle.trim(),
        company: company.trim(),
        employment_type: employmentType,
        location: location.trim(),
        start_date: startDate.trim(),
        end_date: currentlyWorking ? '' : endDate.trim(),
        currently_working: currentlyWorking,
        description: description.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to save experience. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={experienceToEdit ? 'Edit Work Experience' : 'Add Work Experience'}
      description="Add your previous and current professional roles, milestones, and contributions."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {experienceToEdit ? 'Save Changes' : 'Add Experience'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <Input
            label="Job Title *"
            placeholder="e.g. Senior Software Engineer"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            leftIcon={<Briefcase className="w-4 h-4 text-[#8A928D] dark:text-[#657378]" />}
            required
          />

          <Input
            label="Company Name *"
            placeholder="e.g. Acme Technologies"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            leftIcon={<Building2 className="w-4 h-4 text-[#8A928D] dark:text-[#657378]" />}
            required
          />

          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-[#8A928D] dark:text-[#9AA7AB] block">
              Employment Type
            </label>
            <select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg bg-white dark:bg-[#0C1113] text-[#111312] dark:text-[#F2F6F7] border border-[#E7E7E2] dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#1F8FA6]/40 focus:border-[#1F8FA6] transition-all"
            >
              <option value="Full-time" className="bg-white dark:bg-[#111719] text-[#111312] dark:text-[#F2F6F7]">Full-time</option>
              <option value="Part-time" className="bg-white dark:bg-[#111719] text-[#111312] dark:text-[#F2F6F7]">Part-time</option>
              <option value="Internship" className="bg-white dark:bg-[#111719] text-[#111312] dark:text-[#F2F6F7]">Internship</option>
              <option value="Contract" className="bg-white dark:bg-[#111719] text-[#111312] dark:text-[#F2F6F7]">Contract</option>
              <option value="Freelance" className="bg-white dark:bg-[#111719] text-[#111312] dark:text-[#F2F6F7]">Freelance</option>
              <option value="Other" className="bg-white dark:bg-[#111719] text-[#111312] dark:text-[#F2F6F7]">Other</option>
            </select>
          </div>

          <Input
            label="Location (City, Country / Remote)"
            placeholder="e.g. Chennai, India (Hybrid)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            leftIcon={<MapPin className="w-4 h-4 text-[#5E6460] dark:text-[#9AA7AB]" />}
          />

          <Input
            label="Start Date *"
            placeholder="YYYY-MM (e.g. 2022-06)"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4 text-[#5E6460] dark:text-[#9AA7AB]" />}
            required
          />

          <Input
            label="End Date"
            placeholder="YYYY-MM (e.g. 2024-01)"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={currentlyWorking}
            leftIcon={<Calendar className="w-4 h-4 text-[#5E6460] dark:text-[#9AA7AB]" />}
            helperText={currentlyWorking ? 'Disabled while working here' : ''}
          />

          <div className="sm:col-span-2 flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="currently-working-chk"
              checked={currentlyWorking}
              onChange={(e) => {
                setCurrentlyWorking(e.target.checked);
                if (e.target.checked) setEndDate('');
              }}
              className="rounded border-[#E7E7E2] dark:border-white/10 bg-white dark:bg-[#0C1113] text-[#1F8FA6] focus:ring-[#1F8FA6]/40 w-4 h-4 cursor-pointer"
            />
            <label
              htmlFor="currently-working-chk"
              className="text-xs text-[#5E6460] dark:text-[#9AA7AB] select-none font-medium cursor-pointer"
            >
              I currently work in this role
            </label>
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-[13px] font-semibold text-[#5E6460] dark:text-[#9AA7AB] block">
              Role Description & Key Accomplishments
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your responsibilities, architectural impact, systems scaled, and achievements..."
              className="w-full p-3.5 text-xs sm:text-sm rounded-lg bg-white dark:bg-[#0C1113] text-[#111312] dark:text-[#F2F6F7] border border-[#E7E7E2] dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#1F8FA6]/40 focus:border-[#1F8FA6] transition-all resize-y min-h-[100px]"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
