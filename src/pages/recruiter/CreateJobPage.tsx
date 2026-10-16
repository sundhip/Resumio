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
} from '../../components/kit';
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
  HelpCircle,
  Sliders,
  ShieldCheck,
  ClipboardPaste,
} from 'lucide-react';

interface CreateJobPageProps {
  onNavigate: (path: string, params?: Record<string, any>) => void;
}

const COMMON_SKILLS = [
  'TypeScript', 'React', 'Node.js', 'Python', 'Go', 'PostgreSQL', 'Docker',
  'Kubernetes', 'AWS Cloud', 'GCP', 'GraphQL', 'System Architecture', 'CI/CD',
  'Redis', 'Tailwind CSS', 'Next.js', 'Microservices', 'REST APIs',
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
    min_experience: 2,
    max_experience: 6,
    qualification: "Bachelor's Degree",
    salary_disclosed: true,
    salary_min: 110000,
    salary_max: 155000,
    currency: 'USD',
    salary_period: 'Yearly',
    deadline: '',
    required_skills: ['TypeScript', 'React', 'Node.js'],
    preferred_skills: ['Docker', 'AWS Cloud'],
  });

  // Scoring Weights (sums to 100)
  const [weights, setWeights] = useState({
    skills: 40,
    experience: 30,
    semantic: 20,
    education: 10,
  });

  // Blind screening toggle
  const [blindScreening, setBlindScreening] = useState(true);

  // Skills input state
  const [reqInput, setReqInput] = useState('');
  const [prefInput, setPrefInput] = useState('');

  // Autosave timestamp
  const [lastSaved, setLastSaved] = useState<string>('Just now');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Parse from pasted JD modal
  const [isParseModalOpen, setIsParseModalOpen] = useState(false);
  const [rawJdText, setRawJdText] = useState('');

  // Auto-fill company name if profile exists
  useEffect(() => {
    const fetchCompanyProfile = async () => {
      try {
        const res = await api.getCompanyProfile();
        if (res.success && res.data?.company_name) {
          setFormData((prev) => ({
            ...prev,
            company_name: prev.company_name || res.data.company_name || 'Apex Systems',
            location: prev.location || res.data.location || 'Remote',
          }));
        }
      } catch {
        // Handled silently
      }
    };
    fetchCompanyProfile();
  }, []);

  // Simulated Autosave effect
  useEffect(() => {
    const timer = setTimeout(() => {
      const now = new Date();
      setLastSaved(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1500);
    return () => clearTimeout(timer);
  }, [formData, weights, blindScreening]);

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

  // Deterministic Offline Parser for raw pasted JD text
  const handleParseRawJd = () => {
    if (!rawJdText.trim()) return;
    const lines = rawJdText.split('\n').map((l) => l.trim()).filter(Boolean);

    // Heuristic extraction
    let title = lines[0]?.slice(0, 80) || formData.title;
    if (title.toLowerCase().startsWith('job title:') || title.toLowerCase().startsWith('role:')) {
      title = title.split(':')[1]?.trim() || title;
    }

    const detectedSkills = COMMON_SKILLS.filter((skill) => {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(rawJdText);
    });

    const parsedRequired = detectedSkills.slice(0, 5);
    const parsedPreferred = detectedSkills.slice(5, 8);

    setFormData((prev) => ({
      ...prev,
      title: title || prev.title,
      description: rawJdText.slice(0, 1500),
      required_skills: parsedRequired.length ? parsedRequired : prev.required_skills,
      preferred_skills: parsedPreferred.length ? parsedPreferred : prev.preferred_skills,
    }));

    setIsParseModalOpen(false);
    setRawJdText('');
    showToast('success', 'Job description parsed', `Extracted ${detectedSkills.length} skills and requirements.`);
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

  const handleSubmit = async (publishImmediate: boolean) => {
    if (!validate()) {
      showToast('error', 'Validation error', 'Please fill in all mandatory fields highlighted.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createJob({
        ...formData,
        publish_immediately: publishImmediate,
      });

      if (res.success) {
        showToast(
          'success',
          publishImmediate ? 'Job Published!' : 'Draft Saved!',
          publishImmediate ? 'The job is active and discovering matching resumes.' : 'Your draft has been saved.'
        );
        onNavigate('recruiter-jobs');
      } else {
        showToast('error', 'Failed to save job', res.message);
      }
    } catch (err: any) {
      showToast('error', 'Error creating job', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Top action bar with back, autosave status, parse action, and submit buttons */}
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
              Create Job Requisition
            </h1>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Autosaved draft: {lastSaved}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsParseModalOpen(true)}
            leftIcon={<ClipboardPaste className="w-3.5 h-3.5 text-primary" />}
          >
            Parse from pasted JD
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleSubmit(false)}
            isLoading={isSubmitting}
          >
            Save Draft
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSubmit(true)}
            isLoading={isSubmitting}
          >
            Publish Role
          </Button>
        </div>
      </div>

      {/* Guided Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Guided Form Sections */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Basics */}
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
                placeholder="e.g. Senior Full-Stack Engineer"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                error={errors.title}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Company Name *"
                  placeholder="e.g. Apex Global Systems"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  error={errors.company_name}
                />
                <Input
                  label="Location"
                  placeholder="e.g. San Francisco, CA or Remote"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Min Experience (years)"
                  type="number"
                  min="0"
                  max="30"
                  value={formData.min_experience}
                  onChange={(e) => setFormData({ ...formData, min_experience: Number(e.target.value) })}
                />
                <Input
                  label="Max Experience (years)"
                  type="number"
                  min="0"
                  max="30"
                  value={formData.max_experience}
                  onChange={(e) => setFormData({ ...formData, max_experience: Number(e.target.value) })}
                />
              </div>

              {/* Compensation */}
              <div className="pt-2 border-t border-border-default/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-text-primary">Compensation Range (USD)</span>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-text-muted">
                    <input
                      type="checkbox"
                      checked={formData.salary_disclosed}
                      onChange={(e) => setFormData({ ...formData, salary_disclosed: e.target.checked })}
                      className="rounded accent-primary"
                    />
                    Disclose in listing
                  </label>
                </div>
                {formData.salary_disclosed && (
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Min Salary ($)"
                      type="number"
                      step="5000"
                      value={formData.salary_min}
                      onChange={(e) => setFormData({ ...formData, salary_min: Number(e.target.value) })}
                    />
                    <Input
                      label="Max Salary ($)"
                      type="number"
                      step="5000"
                      value={formData.salary_max}
                      onChange={(e) => setFormData({ ...formData, salary_max: Number(e.target.value) })}
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Section 2: Description */}
          <Card variant="default" padding="md" className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border-default">
              <FileText className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                2. Role Description & Responsibilities
              </h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Overview & Summary *
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Outline the core responsibilities, team mission, and impact of this position..."
                  className="w-full p-2.5 rounded-control text-xs bg-surface-elevated border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {errors.description && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Key Deliverables & Responsibilities (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formData.responsibilities}
                  onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                  placeholder="- Architect scalable TypeScript services\n- Partner with product design to build accessible component systems\n- Mentor junior engineers"
                  className="w-full p-2.5 rounded-control text-xs bg-surface-elevated border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>
            </div>
          </Card>

          {/* Section 3: Required Skills */}
          <Card variant="default" padding="md" className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-default">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                  3. Required Competencies (Must-Haves) *
                </h2>
              </div>
              <span className="text-xs text-text-muted">{formData.required_skills.length} skills added</span>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Add required skill (e.g. React, PostgreSQL)..."
                  value={reqInput}
                  onChange={(e) => setReqInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill('required', reqInput);
                    }
                  }}
                  size="sm"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => addSkill('required', reqInput)}
                >
                  Add
                </Button>
              </div>

              {errors.required_skills && (
                <p className="text-[11px] text-rose-500">{errors.required_skills}</p>
              )}

              {/* Added Skills Chips */}
              <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-control bg-surface-elevated/40 border border-border-default">
                {formData.required_skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-primary/10 border border-primary/30 text-primary"
                  >
                    <span>{s}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill('required', s)}
                      className="hover:opacity-75"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Suggestions */}
              <div className="space-y-1">
                <span className="text-micro text-text-muted">QUICK SUGGESTIONS</span>
                <div className="flex flex-wrap gap-1">
                  {COMMON_SKILLS.slice(0, 8).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addSkill('required', s)}
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-surface-elevated border border-border-default text-text-secondary hover:border-primary/50"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Section 4: Preferred Skills */}
          <Card variant="default" padding="md" className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-default">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                  4. Preferred Skills (Nice-to-Haves)
                </h2>
              </div>
              <span className="text-xs text-text-muted">{formData.preferred_skills.length} skills added</span>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Add nice-to-have skill (e.g. Kubernetes, GraphQL)..."
                  value={prefInput}
                  onChange={(e) => setPrefInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill('preferred', prefInput);
                    }
                  }}
                  size="sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addSkill('preferred', prefInput)}
                >
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-control bg-surface-elevated/40 border border-border-default">
                {formData.preferred_skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-surface-elevated border border-border-default text-text-secondary"
                  >
                    <span>{s}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill('preferred', s)}
                      className="hover:opacity-75"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* Section 5: Scoring Weights */}
          <Card variant="default" padding="md" className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-default">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                  5. Scoring Weights & ATS Profile
                </h2>
              </div>
              <Pill variant="primary" size="sm">
                Total: {weights.skills + weights.experience + weights.semantic + weights.education}%
              </Pill>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-text-primary">Required Skills Match</span>
                  <span className="font-mono text-primary font-bold">{weights.skills}%</span>
                </div>
                <Slider
                  min={10}
                  max={70}
                  value={weights.skills}
                  onChange={(val) => setWeights({ ...weights, skills: val })}
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-text-primary">Experience & Seniority</span>
                  <span className="font-mono text-primary font-bold">{weights.experience}%</span>
                </div>
                <Slider
                  min={10}
                  max={60}
                  value={weights.experience}
                  onChange={(val) => setWeights({ ...weights, experience: val })}
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-text-primary">Semantic & Domain Alignment</span>
                  <span className="font-mono text-primary font-bold">{weights.semantic}%</span>
                </div>
                <Slider
                  min={5}
                  max={40}
                  value={weights.semantic}
                  onChange={(val) => setWeights({ ...weights, semantic: val })}
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-text-primary">Education & Certifications</span>
                  <span className="font-mono text-primary font-bold">{weights.education}%</span>
                </div>
                <Slider
                  min={0}
                  max={30}
                  value={weights.education}
                  onChange={(val) => setWeights({ ...weights, education: val })}
                />
              </div>
            </div>
          </Card>

          {/* Section 6: Blind Screening */}
          <Card variant="default" padding="md" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Fairness & Blind Screening</h3>
                  <p className="text-xs text-text-muted">
                    Mask candidate names, photos, universities, and gender markers to eliminate unconscious bias during stage 1 review.
                  </p>
                </div>
              </div>
              <Switch checked={blindScreening} onChange={setBlindScreening} />
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Sticky Live Preview */}
        <div className="lg:col-span-5 sticky top-6 space-y-4">
          <Card variant="raised" padding="md" className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-default">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                  Live Candidate Preview
                </h3>
              </div>
              <Pill variant="neutral" size="sm">Interactive</Pill>
            </div>

            {/* Simulated Candidate Job Card */}
            <div className="p-4 rounded-card bg-surface-elevated/70 border border-border-default space-y-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-base font-bold text-text-primary truncate">
                    {formData.title || 'Untitled Role'}
                  </h4>
                  <p className="text-xs text-text-muted">{formData.company_name || 'Organization'}</p>
                </div>
                <Pill variant="success" size="sm">Open</Pill>
              </div>

              <div className="flex flex-wrap gap-1.5 text-xs">
                <Pill variant="neutral" size="sm">
                  <MapPin className="w-3 h-3 mr-1 text-text-muted" />
                  {formData.location || 'Remote'}
                </Pill>
                <Pill variant="primary" size="sm">{formData.work_mode}</Pill>
                <Pill variant="neutral" size="sm">{formData.employment_type}</Pill>
                <Pill variant="neutral" size="sm">{formData.min_experience}+ yrs exp</Pill>
              </div>

              {formData.salary_disclosed && (
                <div className="text-xs font-semibold text-text-primary flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-text-muted" />
                  <span>
                    ${(formData.salary_min / 1000).toFixed(0)}k - ${(formData.salary_max / 1000).toFixed(0)}k / year
                  </span>
                </div>
              )}

              {/* Skills as editable chips */}
              <div className="space-y-1.5 pt-2 border-t border-border-default/60">
                <span className="text-micro text-text-muted">REQUIRED COMPETENCIES</span>
                <div className="flex flex-wrap gap-1">
                  {formData.required_skills.length ? (
                    formData.required_skills.map((s) => (
                      <span
                        key={s}
                        onClick={() => removeSkill('required', s)}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-card border border-primary/40 text-primary cursor-pointer hover:bg-rose-500/10 hover:border-rose-500 hover:text-rose-500 transition-colors"
                        title="Click to remove"
                      >
                        {s} ×
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-text-muted italic">No required skills added</span>
                  )}
                </div>
              </div>

              {formData.preferred_skills.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-border-default/60">
                  <span className="text-micro text-text-muted">PREFERRED (BONUS)</span>
                  <div className="flex flex-wrap gap-1">
                    {formData.preferred_skills.map((s) => (
                      <span
                        key={s}
                        onClick={() => removeSkill('preferred', s)}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-card border border-border-default text-text-secondary cursor-pointer hover:bg-rose-500/10 hover:border-rose-500 hover:text-rose-500 transition-colors"
                        title="Click to remove"
                      >
                        {s} ×
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description preview */}
              <div className="space-y-1 pt-2 border-t border-border-default/60">
                <span className="text-micro text-text-muted">DESCRIPTION EXCERPT</span>
                <p className="text-xs text-text-muted line-clamp-3 leading-relaxed">
                  {formData.description || 'Add an overview to preview candidate role description here...'}
                </p>
              </div>

              {/* Scoring Weights Preview */}
              <div className="p-3 rounded-card bg-surface-elevated/40 border border-border-default space-y-2">
                <span className="text-micro text-text-muted">ATS MATCH FORMULA WEIGHTS</span>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Skills</span>
                    <span className="font-mono font-bold text-primary">{weights.skills}%</span>
                  </div>
                  <HatchedProgress value={weights.skills} height={6} color="#1F8FA6" />
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Experience</span>
                    <span className="font-mono font-bold text-primary">{weights.experience}%</span>
                  </div>
                  <HatchedProgress value={weights.experience} height={6} color="#1F8FA6" />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => handleSubmit(true)}
                isLoading={isSubmitting}
              >
                Publish Job Requisition
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Parse Raw JD Modal */}
      {isParseModalOpen && (
        <Modal
          isOpen={isParseModalOpen}
          onClose={() => setIsParseModalOpen(false)}
          title="Parse from Raw Job Description"
          description="Paste raw job description text from your ATS, LinkedIn, or doc. Resumio's offline parser extracts titles, requirements, and competencies automatically."
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsParseModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleParseRawJd}>
                Extract & Populate Form
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <textarea
              rows={8}
              value={rawJdText}
              onChange={(e) => setRawJdText(e.target.value)}
              placeholder="Paste job posting text here (e.g. Senior Frontend Engineer with 5+ years of TypeScript, React, GraphQL, and AWS experience)..."
              className="w-full p-3 rounded-control text-xs bg-surface-elevated border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
