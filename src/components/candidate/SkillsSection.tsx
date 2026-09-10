import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';
import type { CandidateSkill, SkillProficiency } from '../../types';
import { Award, Plus, X, Edit3 } from 'lucide-react';

interface SkillsSectionProps {
  skillsList: CandidateSkill[];
  onAdd: (data: { name: string; proficiency: SkillProficiency }) => Promise<void>;
  onUpdate: (id: string, data: { name: string; proficiency: SkillProficiency }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({
  skillsList,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const { showToast } = useToast();

  const [skillName, setSkillName] = useState('');
  const [proficiency, setProficiency] = useState<SkillProficiency>('Advanced');
  const [isAdding, setIsAdding] = useState(false);
  const [quickInputOpen, setQuickInputOpen] = useState(false);

  // Edit State
  const [editingSkill, setEditingSkill] = useState<CandidateSkill | null>(null);
  const [editProficiency, setEditProficiency] = useState<SkillProficiency>('Advanced');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = skillName.trim();
    if (!clean) return;

    // Check duplicate locally
    const duplicate = skillsList.some(
      (s) => s.name.toLowerCase() === clean.toLowerCase()
    );
    if (duplicate) {
      showToast('error', `"${clean}" is already in your skills list.`);
      return;
    }

    setIsAdding(true);
    try {
      await onAdd({ name: clean, proficiency });
      setSkillName('');
      setQuickInputOpen(false);
    } catch (err: any) {
      showToast('error', err.message || 'Unable to add skill.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateProficiency = async () => {
    if (!editingSkill) return;
    setIsUpdating(true);
    try {
      await onUpdate(editingSkill.id, {
        name: editingSkill.name,
        proficiency: editProficiency,
      });
      setEditingSkill(null);
    } catch (err: any) {
      showToast('error', err.message || 'Unable to update skill.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getProficiencyColor = (level: SkillProficiency) => {
    switch (level) {
      case 'Expert':
        return 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60';
      case 'Advanced':
        return 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800/60';
      case 'Intermediate':
        return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60';
      case 'Beginner':
        return 'bg-slate-100 dark:bg-surface-dark-bg text-slate-700 dark:text-slate-300 border-slate-200 dark:border-surface-dark-border';
    }
  };

  return (
    <Card padding="md" className="space-y-4">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-control bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <CardTitle>Skills & Technical Proficiencies</CardTitle>
            <CardDescription>
              Core programming languages, frameworks, developer tooling, and domain skills
            </CardDescription>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setQuickInputOpen((prev) => !prev)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          {quickInputOpen ? 'Cancel' : 'Add Skill'}
        </Button>
      </CardHeader>

      {/* Quick Add Form Bar */}
      {quickInputOpen && (
        <form
          onSubmit={handleAddSubmit}
          className="p-3.5 rounded-control bg-slate-50 dark:bg-surface-dark-bg border border-slate-200 dark:border-surface-dark-border flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 animate-fade-in"
        >
          <input
            type="text"
            placeholder="Type skill name (e.g. TypeScript, React, Python)..."
            value={skillName}
            onChange={(e) => setSkillName(e.target.value)}
            className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-control bg-white dark:bg-surface-dark-card text-slate-900 dark:text-white border border-slate-200 dark:border-surface-dark-border focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            autoFocus
            required
          />

          <select
            value={proficiency}
            onChange={(e) => setProficiency(e.target.value as SkillProficiency)}
            className="px-3 py-2 text-xs sm:text-sm rounded-control bg-white dark:bg-surface-dark-card text-slate-900 dark:text-white border border-slate-200 dark:border-surface-dark-border focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Expert">Expert</option>
          </select>

          <Button variant="primary" size="sm" type="submit" isLoading={isAdding}>
            Add Skill
          </Button>
        </form>
      )}

      {/* Skills Chip Collection / Empty State */}
      {skillsList.length === 0 ? (
        <div className="p-8 text-center rounded-control bg-slate-50/60 dark:bg-surface-dark-bg/40 border border-dashed border-slate-200 dark:border-surface-dark-border space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-surface-dark-card text-slate-400 flex items-center justify-center mx-auto">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No skills added yet.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Add technical skills, programming languages, and tools to highlight your competencies.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setQuickInputOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Add Skill
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 pt-1">
          {skillsList.map((skill) => (
            <div
              key={skill.id}
              className={`inline-flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full border text-xs font-semibold select-none transition-all group ${getProficiencyColor(
                skill.proficiency
              )}`}
            >
              <span className="font-bold text-slate-900 dark:text-white">{skill.name}</span>
              <span className="text-[10px] uppercase font-bold opacity-75">
                • {skill.proficiency}
              </span>

              {/* Edit proficiency button */}
              <button
                type="button"
                onClick={() => {
                  setEditingSkill(skill);
                  setEditProficiency(skill.proficiency);
                }}
                title="Edit proficiency"
                className="p-1 rounded-full text-slate-400 hover:text-brand-600 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <Edit3 className="w-3 h-3" />
              </button>

              {/* Remove skill × */}
              <button
                type="button"
                onClick={() => onDelete(skill.id)}
                title="Remove skill"
                className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Edit Skill Proficiency Modal */}
      <Modal
        isOpen={Boolean(editingSkill)}
        onClose={() => setEditingSkill(null)}
        title={`Edit Skill: ${editingSkill?.name}`}
        description="Update your verified proficiency tier for this skill."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingSkill(null)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateProficiency} isLoading={isUpdating}>
              Update Proficiency
            </Button>
          </>
        }
      >
        <div className="space-y-3 py-1">
          <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
            Proficiency Level
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['Beginner', 'Intermediate', 'Advanced', 'Expert'] as SkillProficiency[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setEditProficiency(level)}
                className={`p-2.5 rounded-control text-left border text-xs font-semibold transition-all ${
                  editProficiency === level
                    ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 shadow-2xs'
                    : 'border-slate-200 dark:border-surface-dark-border bg-white dark:bg-surface-dark-card hover:bg-slate-50'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </Card>
  );
};
