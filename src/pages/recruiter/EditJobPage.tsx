import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import {
  Card,
  Button,
  IconButton,
  Input,
  Select,
  Slider,
  Switch,
  Pill,
  Modal,
  HatchedProgress,
  Skeleton,
} from '../../components/kit';
import type { JobFormData, WorkMode, JobEmploymentType, JobPosting } from '../../types';
import {
  Briefcase,
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  DollarSign,
  Sparkles,
  Plus,
  X,
  Eye,
  FileText,
  Sliders,
  ShieldCheck,
  ClipboardPaste,
} from 'lucide-react';

interface EditJobPageProps {
  jobId: string;
  onNavigate: (path: string, params?: Record<string, any>) => void;
}

const COMMON_SKILLS = [
  'TypeScript', 'React', 'Node.js', 'Python', 'Go', 'PostgreSQL', 'Docker',
  'Kubernetes', 'AWS Cloud', 'GCP', 'GraphQL', 'System Architecture', 'CI/CD',
  'Redis', 'Tailwind CSS', 'Next.js', 'Microservices', 'REST APIs',
];

export const EditJobPage: React.FC<EditJobPageProps> = ({ jobId, onNavigate }) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [originalJob, setOriginalJob] = useState<JobPosting | null>(null);

  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    company_name: '',
    location: '',
    employment_type: 'Full-time',
    work_mode: 'Remote',
    description: '',
    responsibilities: '',
    min_experience: 2,
    max_experience: 6,
    qualification: "Bachelor's Degree",
    salary_disclosed: true,
    salary_min: 110000,
    salary_max: 155000,
    currency: 'USD',
    salary_period: 'Yearly',
    deadline: '',
    required_skills: [],
    preferred_skills: [],
  });

  const [weights, setWeights] = useState({
    skills: 40,
    experience: 30,
    semantic: 20,
    education: 10,
  });

  const [blindScreening, setBlindScreening] = useState(true);
  const [reqInput, setReqInput] = useState('');
  const [prefInput, setPrefInput] = useState('');
  const [lastSaved, setLastSaved] = useState<string>('Saved');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isParseModalOpen, setIsParseModalOpen] = useState(false);
  const [rawJdText, setRawJdText] = useState('');

  useEffect(() => {
    const fetchJob = async () => {
      setIsLoading(true);
      try {
        const res = await api.getJob(jobId);
        if (res.success && res.job) {
          const j = res.job;
          setOriginalJob(j);
          setFormData({
            title: j.title || '',
            company_name: j.company_name || '',
            location: j.location || '',
            employment_type: j.employment_type || 'Full-time',
            work_mode: j.work_mode || 'Remote',
            description: j.description || '',
            responsibilities: j.responsibilities || '',
            min_experience: j.min_experience ?? 2,
            max_experience: j.max_experience ?? 6,
            qualification: j.qualification || "Bachelor's Degree",
            salary_disclosed: j.salary_disclosed ?? true,
            salary_min: j.salary_min ?? 100000,
            salary_max: j.salary_max ?? 150000,
            currency: j.currency || 'USD',
            salary_period: j.salary_period || 'Yearly',
            deadline: j.deadline || '',
            required_skills: j.required_skills || [],
            preferred_skills: j.preferred_skills || [],
          });
        }
      } catch (err: any) {
        showToast('error', 'Failed to load job', err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  const addSkill = (type: 'required' | 'preferred', skill: string) => {
    const clean = skill.trim();
    if (!clean) return;
    if (type === 'required') {
      if (!formData.required_skills.some((s) => s.toLowerCase() === clean.toLowerCase())) {
        setFormData((prev) => ({ ...prev, required_skills: [...prev.required_skills, clean] }));
      }
      setReqInput('');
    } else {
      if (!formData.preferred_skills.some((s) => s.toLowerCase() === clean.toLowerCase())) {
        setFormData((prev) => ({ ...prev, preferred_skills: [...prev.preferred_skills, clean] }));
      }
      setPrefInput('');
    }
  };

  const removeSkill = (type: 'required' | 'preferred', skill: string) => {
    if (type === 'required') {
      setFormData((prev) => ({
        ...prev,
        required_skills: prev.required_skills.filter((s) => s !== skill),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        preferred_skills: prev.preferred_skills.filter((s) => s !== skill),
      }));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.title.trim()) errs.title = 'Job title is required';
    if (!formData.company_name.trim()) errs.company_name = 'Company name is required';
    if (!formData.description.trim()) errs.description = 'Job description is required';
    if (formData.required_skills.length === 0) errs.required_skills = 'Add at least one required skill';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleUpdate = async () => {
    if (!validate()) {
      showToast('error', 'Validation error', 'Please fill in all mandatory fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.updateJob(jobId, formData);
      if (res.success) {
        showToast('success', 'Job Updated', 'Your changes have been saved to the database.');
        onNavigate('recruiter-jobs');
      } else {
        showToast('error', 'Update Failed', res.message);
      }
    } catch (err: any) {
      showToast('error', 'Update Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 w-full animate-fade-in" aria-busy="true">
        <Skeleton className="h-14 rounded-card" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Skeleton className="lg:col-span-7 h-96 rounded-card" />
          <Skeleton className="lg:col-span-5 h-96 rounded-card" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-border-default/70">
        <div className="flex items-center gap-3">
          <IconButton
            aria-label="Back to jobs list"
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('recruiter-jobs')}
          >
            <ArrowLeft className="w-4 h-4" />
          </IconButton>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              Edit Job Requisition
            </h1>
            <p className="text-xs text-text-muted">ID: {jobId} • Status: {originalJob?.status || 'Open'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('applicants', { jobId })}
          >
            View Applicants
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleUpdate}
            isLoading={isSubmitting}
          >
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <Card variant="default" padding="md" className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border-default">
              <Briefcase className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                1. Requisition Basics
              </h2>
            </div>

            <div className="space-y-3">
              <Input
                label="Job Title *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                error={errors.title}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Company Name *"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  error={errors.company_name}
                />
                <Input
                  label="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Work Mode</label>
                  <Select
                    value={formData.work_mode}
                    onChange={(e) => setFormData({ ...formData, work_mode: e.target.value as WorkMode })}
                    options={[
                      { label: 'Remote', value: 'Remote' },
                      { label: 'Hybrid', value: 'Hybrid' },
                      { label: 'On-site', value: 'On-site' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Employment Type</label>
                  <Select
                    value={formData.employment_type}
                    onChange={(e) => setFormData({ ...formData, employment_type: e.target.value as JobEmploymentType })}
                    options={[
                      { label: 'Full-time', value: 'Full-time' },
                      { label: 'Part-time', value: 'Part-time' },
                      { label: 'Contract', value: 'Contract' },
                      { label: 'Internship', value: 'Internship' },
                    ]}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card variant="default" padding="md" className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border-default">
              <FileText className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                2. Role Description
              </h2>
            </div>
            <textarea
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2.5 rounded-control text-xs bg-surface-elevated border border-border-default text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </Card>

          <Card variant="default" padding="md" className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-default">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                  3. Required Competencies
                </h2>
              </div>
              <span className="text-xs text-text-muted">{formData.required_skills.length} skills</span>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Add skill..."
                  value={reqInput}
                  onChange={(e) => setReqInput(e.target.value)}
                  size="sm"
                />
                <Button variant="primary" size="sm" onClick={() => addSkill('required', reqInput)}>
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5 p-2 rounded-control bg-surface-elevated/40 border border-border-default">
                {formData.required_skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-primary/10 border border-primary/30 text-primary"
                  >
                    <span>{s}</span>
                    <button type="button" onClick={() => removeSkill('required', s)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-5 sticky top-6 space-y-4">
          <Card variant="raised" padding="md" className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-default">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                  Live Preview
                </h3>
              </div>
              <Pill variant="neutral" size="sm">Live</Pill>
            </div>

            <div className="p-4 rounded-card bg-surface-elevated/70 border border-border-default space-y-3">
              <h4 className="text-base font-bold text-text-primary truncate">
                {formData.title || 'Untitled Role'}
              </h4>
              <p className="text-xs text-text-muted">{formData.company_name} • {formData.location || 'Remote'}</p>
              <div className="flex flex-wrap gap-1">
                {formData.required_skills.map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded text-[11px] font-medium bg-card border border-primary/40 text-primary">
                    {s}
                  </span>
                ))}
              </div>
              <p className="text-xs text-text-muted line-clamp-4 leading-relaxed">
                {formData.description}
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={handleUpdate}
              isLoading={isSubmitting}
            >
              Update Requisition
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};
