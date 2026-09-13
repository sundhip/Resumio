import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import type { JobFormData, WorkMode, JobEmploymentType, SalaryPeriod } from '../../types';
import {
  Briefcase,
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  DollarSign,
  GraduationCap,
  Sparkles,
  Plus,
  X,
  Eye,
  CheckCircle2,
  FileText,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

interface CreateJobPageProps {
  onNavigate: (path: string, params?: Record<string, any>) => void;
}

const COMMON_SKILLS_SUGGESTIONS = [
  'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Go', 'Java', 'C++',
  'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 'REST APIs', 'Docker', 'Kubernetes',
  'AWS', 'GCP', 'Azure', 'CI/CD', 'Git', 'Tailwind CSS', 'Next.js', 'HTML/CSS',
  'System Design', 'Agile', 'Product Management', 'UI/UX Design', 'Machine Learning'
];

export const CreateJobPage: React.FC<CreateJobPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();

  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    company_name: '',
    location: '',
    employment_type: 'Full-time',
    work_mode: 'Remote',
    description: '',
    responsibilities: '',
    min_experience: 1,
    max_experience: 5,
    qualification: "Bachelor's Degree",
    salary_disclosed: true,
    salary_min: 80000,
    salary_max: 130000,
    currency: 'USD',
    salary_period: 'Yearly',
    deadline: '',
    required_skills: [],
    preferred_skills: []
  });

  const [requiredSkillInput, setRequiredSkillInput] = useState('');
  const [preferredSkillInput, setPreferredSkillInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-fill company name if profile exists
  useEffect(() => {
    const fetchCompanyProfile = async () => {
      try {
        const res = await api.getCompanyProfile();
        if (res.success && res.data?.company_name) {
          setFormData((prev) => ({
            ...prev,
            company_name: prev.company_name || res.data.company_name || '',
            location: prev.location || res.data.location || ''
          }));
        }
      } catch (e) {
        // Silently ignore if not found
      }
    };
    fetchCompanyProfile();
  }, []);

  const handleAddRequiredSkill = (skill: string) => {
    const clean = skill.trim();
    if (!clean) return;
    if (formData.required_skills.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      setRequiredSkillInput('');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      required_skills: [...prev.required_skills, clean]
    }));
    setRequiredSkillInput('');
    if (errors.required_skills) {
      setErrors((prev) => ({ ...prev, required_skills: '' }));
    }
  };

  const handleRemoveRequiredSkill = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      required_skills: prev.required_skills.filter((_, i) => i !== index)
    }));
  };

  const handleAddPreferredSkill = (skill: string) => {
    const clean = skill.trim();
    if (!clean) return;
    if (formData.preferred_skills.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      setPreferredSkillInput('');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      preferred_skills: [...prev.preferred_skills, clean]
    }));
    setPreferredSkillInput('');
  };

  const handleRemovePreferredSkill = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      preferred_skills: prev.preferred_skills.filter((_, i) => i !== index)
    }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.title.trim()) errs.title = 'Job title is required';
    if (!(formData.company_name || '').trim()) errs.company_name = 'Company name is required';
    if (!formData.location.trim()) errs.location = 'Job location is required';
    if (!formData.description.trim()) errs.description = 'Job description is required';
    if ((formData.required_skills || []).length === 0) {
      errs.required_skills = 'Please add at least one required skill tag';
    }

    if (
      formData.min_experience !== null &&
      formData.max_experience !== null &&
      formData.min_experience !== undefined &&
      formData.max_experience !== undefined &&
      formData.min_experience > formData.max_experience
    ) {
      errs.experience = 'Minimum experience cannot exceed maximum experience';
    }

    if (
      formData.salary_disclosed &&
      formData.salary_min !== null &&
      formData.salary_max !== null &&
      formData.salary_min !== undefined &&
      formData.salary_max !== undefined &&
      formData.salary_min > formData.salary_max
    ) {
      errs.salary = 'Minimum salary cannot exceed maximum salary';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (publishImmediately: boolean) => {
    if (!validate()) {
      showToast('error', 'Validation Error', 'Please complete all required fields properly.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createJob(formData, publishImmediately);
      if (res.success) {
        showToast(
          'success',
          publishImmediately ? 'Job Published!' : 'Draft Saved!',
          publishImmediately
            ? 'Your job posting is live and discoverable by candidates.'
            : 'Your draft has been saved. You can edit and publish it anytime.'
        );
        onNavigate('recruiter-jobs');
      }
    } catch (err: any) {
      showToast('error', 'Failed to save job', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => onNavigate('recruiter-jobs')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Job Postings
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              <Briefcase className="w-5 h-5" />
            </span>
            Create New Job Posting
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Define role requirements, skills, experience criteria, and compensation to attract qualified candidates.
          </p>
        </div>

        {/* Action Buttons Top */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewOpen(true)}
            className="gap-1.5"
          >
            <Eye className="w-4 h-4" /> Preview
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleSubmit(false)}
            isLoading={isSubmitting}
            className="gap-1.5"
          >
            <FileText className="w-4 h-4" /> Save Draft
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSubmit(true)}
            isLoading={isSubmitting}
            className="gap-1.5 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" /> Publish Job
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Basic Role Information */}
          <Card>
            <CardHeader className="border-b border-slate-100 dark:border-surface-dark-border pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Role Overview
              </CardTitle>
              <CardDescription>Primary job title, company designation, and physical / remote location.</CardDescription>
            </CardHeader>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Job Title <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Senior Frontend Engineer, AI Research Scientist"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (errors.title) setErrors({ ...errors, title: '' });
                  }}
                  error={errors.title}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Company Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Acme Corp"
                    value={formData.company_name}
                    onChange={(e) => {
                      setFormData({ ...formData, company_name: e.target.value });
                      if (errors.company_name) setErrors({ ...errors, company_name: '' });
                    }}
                    error={errors.company_name}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Location / Region <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. San Francisco, CA or Remote Worldwide"
                    value={formData.location}
                    onChange={(e) => {
                      setFormData({ ...formData, location: e.target.value });
                      if (errors.location) setErrors({ ...errors, location: '' });
                    }}
                    error={errors.location}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Employment Type
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-control bg-white dark:bg-surface-dark-card border border-slate-300 dark:border-surface-dark-border text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    value={formData.employment_type}
                    onChange={(e) => setFormData({ ...formData, employment_type: e.target.value as JobEmploymentType })}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Work Mode
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-control bg-white dark:bg-surface-dark-card border border-slate-300 dark:border-surface-dark-border text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    value={formData.work_mode}
                    onChange={(e) => setFormData({ ...formData, work_mode: e.target.value as WorkMode })}
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 2: Job Description & Key Responsibilities */}
          <Card>
            <CardHeader className="border-b border-slate-100 dark:border-surface-dark-border pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Job Details & Responsibilities
              </CardTitle>
              <CardDescription>Provide a comprehensive overview of the team mission, daily responsibilities, and culture.</CardDescription>
            </CardHeader>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Job Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={6}
                  placeholder="Describe the opportunity, what makes this team unique, and high-level project goals..."
                  className={`w-full px-3.5 py-2.5 rounded-control bg-white dark:bg-surface-dark-card border ${
                    errors.description ? 'border-rose-500' : 'border-slate-300 dark:border-surface-dark-border'
                  } text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500`}
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    if (errors.description) setErrors({ ...errors, description: '' });
                  }}
                />
                {errors.description && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Key Responsibilities
                </label>
                <textarea
                  rows={4}
                  placeholder="• Architect and ship scalable microservices&#10;• Collaborate with cross-functional design and product leads&#10;• Mentor junior engineers and uphold code review standards"
                  className="w-full px-3.5 py-2.5 rounded-control bg-white dark:bg-surface-dark-card border border-slate-300 dark:border-surface-dark-border text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500 font-mono text-xs"
                  value={formData.responsibilities || ''}
                  onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                />
                <p className="text-[11px] text-slate-400 mt-1">Tip: Use bullet points for easy scanning by candidates.</p>
              </div>
            </div>
          </Card>

          {/* Section 3: Skills Requirements */}
          <Card>
            <CardHeader className="border-b border-slate-100 dark:border-surface-dark-border pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Required & Preferred Skills
              </CardTitle>
              <CardDescription>
                Categorize skills clearly. Required skills drive profile matching and strict criteria.
              </CardDescription>
            </CardHeader>

            <div className="p-5 space-y-6">
              {/* Required Skills */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Required Skills (Must-Have) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Press Enter or click + to add</span>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. React, TypeScript, GraphQL..."
                    value={requiredSkillInput}
                    onChange={(e) => setRequiredSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddRequiredSkill(requiredSkillInput);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleAddRequiredSkill(requiredSkillInput)}
                    className="shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </Button>
                </div>

                {errors.required_skills && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.required_skills}
                  </p>
                )}

                {/* Selected Required Skills */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.required_skills.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No required skills added yet.</p>
                  ) : (
                    formData.required_skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveRequiredSkill(index)}
                          className="text-brand-400 hover:text-brand-600 dark:hover:text-brand-200 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Quick suggestions */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-surface-dark-border">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Quick Add Suggestions:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_SKILLS_SUGGESTIONS.slice(0, 10).map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleAddRequiredSkill(skill)}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-surface-dark-border text-slate-600 dark:text-slate-300 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/40 transition-colors cursor-pointer"
                      >
                        + {skill}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preferred Skills */}
              <div className="pt-4 border-t border-slate-100 dark:border-surface-dark-border">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Preferred Skills (Nice-to-Have)
                  </label>
                  <span className="text-[11px] text-slate-400">Optional</span>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Docker, Redis, Kubernetes..."
                    value={preferredSkillInput}
                    onChange={(e) => setPreferredSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPreferredSkill(preferredSkillInput);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleAddPreferredSkill(preferredSkillInput)}
                    className="shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </Button>
                </div>

                {/* Selected Preferred Skills */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.preferred_skills.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No preferred skills added.</p>
                  ) : (
                    formData.preferred_skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemovePreferredSkill(index)}
                          className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Column: Criteria, Compensation, Dates */}
        <div className="space-y-6">
          {/* Experience & Education */}
          <Card>
            <CardHeader className="border-b border-slate-100 dark:border-surface-dark-border pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Candidate Criteria
              </CardTitle>
            </CardHeader>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Experience Range (Years)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Min Years</span>
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      value={formData.min_experience !== null && formData.min_experience !== undefined ? formData.min_experience : ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          min_experience: e.target.value === '' ? null : parseInt(e.target.value, 10)
                        })
                      }
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Max Years</span>
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      value={formData.max_experience !== null && formData.max_experience !== undefined ? formData.max_experience : ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_experience: e.target.value === '' ? null : parseInt(e.target.value, 10)
                        })
                      }
                    />
                  </div>
                </div>
                {errors.experience && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.experience}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Minimum Qualification
                </label>
                <select
                  className="w-full px-3 py-2 rounded-control bg-white dark:bg-surface-dark-card border border-slate-300 dark:border-surface-dark-border text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  value={formData.qualification || "Bachelor's Degree"}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                >
                  <option value="Not Specified">Not Specified / Any</option>
                  <option value="High School">High School Diploma</option>
                  <option value="Associate">Associate Degree</option>
                  <option value="Bachelor's Degree">Bachelor's Degree</option>
                  <option value="Master's Degree">Master's Degree</option>
                  <option value="Doctorate / Ph.D.">Doctorate / Ph.D.</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Application Deadline
                </label>
                <Input
                  type="date"
                  value={formData.deadline || ''}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
            </div>
          </Card>

          {/* Compensation Card */}
          <Card>
            <CardHeader className="border-b border-slate-100 dark:border-surface-dark-border pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Compensation & Benefits
              </CardTitle>
            </CardHeader>

            <div className="p-4 space-y-4">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.salary_disclosed}
                  onChange={(e) => setFormData({ ...formData, salary_disclosed: e.target.checked })}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Disclose compensation publicly
                </span>
              </label>

              {formData.salary_disclosed && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">Currency</span>
                      <select
                        className="w-full px-2.5 py-1.5 rounded-control bg-white dark:bg-surface-dark-card border border-slate-300 dark:border-surface-dark-border text-xs text-slate-900 dark:text-slate-100"
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CAD">CAD ($)</option>
                        <option value="AUD">AUD ($)</option>
                        <option value="INR">INR (₹)</option>
                        <option value="SGD">SGD ($)</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">Period</span>
                      <select
                        className="w-full px-2.5 py-1.5 rounded-control bg-white dark:bg-surface-dark-card border border-slate-300 dark:border-surface-dark-border text-xs text-slate-900 dark:text-slate-100"
                        value={formData.salary_period}
                        onChange={(e) => setFormData({ ...formData, salary_period: e.target.value as SalaryPeriod })}
                      >
                        <option value="Yearly">Per Year</option>
                        <option value="Monthly">Per Month</option>
                        <option value="Hourly">Per Hour</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">Min Amount</span>
                      <Input
                        type="number"
                        min={0}
                        step={1000}
                        placeholder="80000"
                        value={formData.salary_min !== null && formData.salary_min !== undefined ? formData.salary_min : ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            salary_min: e.target.value === '' ? null : parseFloat(e.target.value)
                          })
                        }
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">Max Amount</span>
                      <Input
                        type="number"
                        min={0}
                        step={1000}
                        placeholder="120000"
                        value={formData.salary_max !== null && formData.salary_max !== undefined ? formData.salary_max : ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            salary_max: e.target.value === '' ? null : parseFloat(e.target.value)
                          })
                        }
                      />
                    </div>
                  </div>

                  {errors.salary && (
                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.salary}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Submission Summary Card */}
          <div className="p-4 rounded-card bg-slate-50 dark:bg-surface-dark-card border border-slate-200/80 dark:border-surface-dark-border text-xs space-y-3">
            <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Publishing Standards
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
              Published jobs immediately appear in Candidate Search and Profile Recommendation feeds. You can close or edit postings at any time.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <Button
                variant="primary"
                className="w-full justify-center"
                onClick={() => handleSubmit(true)}
                isLoading={isSubmitting}
              >
                Publish Job Now
              </Button>
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={() => handleSubmit(false)}
                isLoading={isSubmitting}
              >
                Save as Draft
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Candidate Live Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Candidate View Preview"
        size="lg"
      >
        <div className="space-y-6">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-control text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>This is how candidates will view your job posting on Resumio.</span>
          </div>

          {/* Header Preview */}
          <div className="p-5 rounded-card bg-white dark:bg-surface-dark-card border border-slate-200/80 dark:border-surface-dark-border space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {formData.title || 'Untitled Job Role'}
                </h2>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-brand-600" />
                  {formData.company_name || 'Company Name'}
                </p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-surface-dark-border">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {formData.location || 'Location'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {formData.employment_type} • {formData.work_mode}
              </span>
              {formData.salary_disclosed && formData.salary_min && formData.salary_max && (
                <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="w-3.5 h-3.5" />
                  {formData.currency} {formData.salary_min.toLocaleString()} - {formData.salary_max.toLocaleString()} / {(formData.salary_period || 'Yearly').toLowerCase()}
                </span>
              )}
            </div>
          </div>

          {/* Details & Requirements */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed bg-slate-50 dark:bg-surface-dark-bg/50 p-4 rounded-control border border-slate-200/60 dark:border-surface-dark-border">
                {formData.description || 'No description entered yet.'}
              </p>
            </div>

            {formData.responsibilities && (
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Key Responsibilities</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed bg-slate-50 dark:bg-surface-dark-bg/50 p-4 rounded-control border border-slate-200/60 dark:border-surface-dark-border font-mono text-xs">
                  {formData.responsibilities}
                </p>
              </div>
            )}

            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {formData.required_skills.length === 0 ? (
                  <span className="text-xs text-slate-400">None specified</span>
                ) : (
                  formData.required_skills.map((s, i) => (
                    <Badge key={i} variant="primary">{s}</Badge>
                  ))
                )}
              </div>
            </div>

            {formData.preferred_skills.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Preferred Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {formData.preferred_skills.map((s, i) => (
                    <Badge key={i} variant="secondary">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-surface-dark-border">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close Preview
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
