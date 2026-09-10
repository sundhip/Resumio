import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { CandidateEducation } from '../../types';
import { GraduationCap, Building, MapPin, Calendar, Award, Save } from 'lucide-react';

interface EducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  educationToEdit?: CandidateEducation | null;
  onSave: (data: Omit<CandidateEducation, 'id' | 'candidate_profile_id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

export const EducationModal: React.FC<EducationModalProps> = ({
  isOpen,
  onClose,
  educationToEdit,
  onSave,
}) => {
  const [degree, setDegree] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [institution, setInstitution] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentlyStudying, setCurrentlyStudying] = useState(false);
  const [gradeOrGpa, setGradeOrGpa] = useState('');
  const [description, setDescription] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (educationToEdit) {
        setDegree(educationToEdit.degree || '');
        setFieldOfStudy(educationToEdit.field_of_study || '');
        setInstitution(educationToEdit.institution || '');
        setLocation(educationToEdit.location || '');
        setStartDate(educationToEdit.start_date || '');
        setEndDate(educationToEdit.end_date || '');
        setCurrentlyStudying(Boolean(educationToEdit.currently_studying));
        setGradeOrGpa(educationToEdit.grade_or_gpa || '');
        setDescription(educationToEdit.description || '');
      } else {
        setDegree('');
        setFieldOfStudy('');
        setInstitution('');
        setLocation('');
        setStartDate('');
        setEndDate('');
        setCurrentlyStudying(false);
        setGradeOrGpa('');
        setDescription('');
      }
      setErrorMessage(null);
    }
  }, [isOpen, educationToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!degree.trim()) {
      setErrorMessage('Degree is required (e.g. B.Tech, M.S., B.S.).');
      return;
    }
    if (!fieldOfStudy.trim()) {
      setErrorMessage('Field of study is required (e.g. Computer Science).');
      return;
    }
    if (!institution.trim()) {
      setErrorMessage('Institution / University name is required.');
      return;
    }
    if (!startDate.trim()) {
      setErrorMessage('Start date is required.');
      return;
    }
    if (!currentlyStudying && endDate && endDate < startDate) {
      setErrorMessage('End date must be on or after start date.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        degree: degree.trim(),
        field_of_study: fieldOfStudy.trim(),
        institution: institution.trim(),
        location: location.trim(),
        start_date: startDate.trim(),
        end_date: currentlyStudying ? '' : endDate.trim(),
        currently_studying: currentlyStudying,
        grade_or_gpa: gradeOrGpa.trim(),
        description: description.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to save education. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={educationToEdit ? 'Edit Education Record' : 'Add Education Record'}
      description="Add your degree, university, study period, and academic credentials."
      size="md"
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
            {educationToEdit ? 'Save Changes' : 'Add Education'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {errorMessage && (
          <div className="p-3 rounded-control bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Degree *"
            placeholder="e.g. B.Tech, M.S., B.Sc."
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            leftIcon={<GraduationCap className="w-4 h-4" />}
            required
          />

          <Input
            label="Field of Study *"
            placeholder="e.g. Computer Science & Engineering"
            value={fieldOfStudy}
            onChange={(e) => setFieldOfStudy(e.target.value)}
            leftIcon={<Award className="w-4 h-4" />}
            required
          />

          <div className="sm:col-span-2">
            <Input
              label="Institution / University *"
              placeholder="e.g. Anna University, IIT Madras"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              leftIcon={<Building className="w-4 h-4" />}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <Input
              label="Location (City, Country)"
              placeholder="e.g. Chennai, India"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              leftIcon={<MapPin className="w-4 h-4" />}
            />
          </div>

          <Input
            label="Start Date *"
            placeholder="YYYY-MM (e.g. 2020-08)"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
            required
          />

          <Input
            label="End Date"
            placeholder="YYYY-MM (e.g. 2024-05)"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={currentlyStudying}
            leftIcon={<Calendar className="w-4 h-4" />}
            helperText={currentlyStudying ? 'Disabled while studying' : ''}
          />

          <div className="sm:col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="currently-studying-chk"
              checked={currentlyStudying}
              onChange={(e) => {
                setCurrentlyStudying(e.target.checked);
                if (e.target.checked) setEndDate('');
              }}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <label
              htmlFor="currently-studying-chk"
              className="text-xs text-slate-700 dark:text-slate-300 select-none font-medium cursor-pointer"
            >
              I currently study here
            </label>
          </div>

          <div className="sm:col-span-2">
            <Input
              label="Grade / GPA / Percentage"
              placeholder="e.g. CGPA: 8.7 / 10 or 3.8 GPA"
              value={gradeOrGpa}
              onChange={(e) => setGradeOrGpa(e.target.value)}
              leftIcon={<Award className="w-4 h-4" />}
            />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
              Description & Highlights (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Major focus areas, coursework, honors, or thesis topics..."
              className="w-full p-2.5 text-xs sm:text-sm rounded-control bg-white dark:bg-surface-dark-input text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-surface-dark-border focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
