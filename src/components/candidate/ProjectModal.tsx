import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { CandidateProject } from '../../types';
import { Layers, User, Code2, Globe, GitBranch, Calendar, Save } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectToEdit?: CandidateProject | null;
  onSave: (data: Omit<CandidateProject, 'id' | 'candidate_profile_id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  projectToEdit,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [technologies, setTechnologies] = useState('');
  const [description, setDescription] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (projectToEdit) {
        setName(projectToEdit.name || '');
        setRole(projectToEdit.role || '');
        setTechnologies(projectToEdit.technologies || '');
        setDescription(projectToEdit.description || '');
        setProjectUrl(projectToEdit.project_url || '');
        setGithubUrl(projectToEdit.github_url || '');
        setStartDate(projectToEdit.start_date || '');
        setEndDate(projectToEdit.end_date || '');
      } else {
        setName('');
        setRole('');
        setTechnologies('');
        setDescription('');
        setProjectUrl('');
        setGithubUrl('');
        setStartDate('');
        setEndDate('');
      }
      setErrorMessage(null);
    }
  }, [isOpen, projectToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Project name is required.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        role: role.trim(),
        technologies: technologies.trim(),
        description: description.trim(),
        project_url: projectUrl.trim(),
        github_url: githubUrl.trim(),
        start_date: startDate.trim(),
        end_date: endDate.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to save project. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={projectToEdit ? 'Edit Project' : 'Add Project'}
      description="Showcase applications, systems, open-source repositories, or client work you've built."
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
            {projectToEdit ? 'Save Changes' : 'Add Project'}
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
          <div className="sm:col-span-2">
            <Input
              label="Project Name *"
              placeholder="e.g. AI Resume Screening Platform"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<Layers className="w-4 h-4" />}
              required
            />
          </div>

          <Input
            label="Your Role / Contribution"
            placeholder="e.g. Lead Full Stack Architect"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
          />

          <Input
            label="Technologies Used"
            placeholder="e.g. React, TypeScript, Node.js, SQLite"
            value={technologies}
            onChange={(e) => setTechnologies(e.target.value)}
            leftIcon={<Code2 className="w-4 h-4" />}
            helperText="Comma separated list"
          />

          <Input
            label="Live Project / Demo URL"
            placeholder="https://myproject.com"
            value={projectUrl}
            onChange={(e) => setProjectUrl(e.target.value)}
            leftIcon={<Globe className="w-4 h-4" />}
          />

          <Input
            label="GitHub Repository URL"
            placeholder="https://github.com/username/repo"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            leftIcon={<GitBranch className="w-4 h-4" />}
          />

          <Input
            label="Start Date"
            placeholder="YYYY-MM (e.g. 2024-01)"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
          />

          <Input
            label="End Date"
            placeholder="YYYY-MM (e.g. 2024-06)"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
          />

          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
              Project Description & Architectural Details
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the problem solved, architectural choices, scale, performance improvements, and outcomes..."
              className="w-full p-2.5 text-xs sm:text-sm rounded-control bg-white dark:bg-surface-dark-input text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-surface-dark-border focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
