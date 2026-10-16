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
        return 'bg-[#1F8FA6]/10 dark:bg-indigo-950/60 text-[#1F8FA6] dark:text-[#5FD3E8] border-[#1F8FA6]/30 dark:border-[#1F8FA6]/30/60';
      case 'Beginner':
        return 'bg-[#E9E9E5] dark:bg-surface-dark-bg text-[#111312] dark:text-[#F2F6F7] border-[#E7E7E2] dark:border-surface-dark-border';
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
          className="p-3.5 rounded-xl bg-[#0d101d] border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 animate-fade-in"
        >
          <input
            type="text"
            placeholder="Type skill name (e.g. TypeScript, React, Python)..."
            value={skillName}
            onChange={(e) => setSkillName(e.target.value)}
            className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm rounded-lg bg-[#121624] text-slate-100 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
            autoFocus
            required
          />

          <select
            value={proficiency}
            onChange={(e) => setProficiency(e.target.value as SkillProficiency)}
            className="px-3.5 py-2.5 text-xs sm:text-sm rounded-lg bg-[#121624] text-slate-100 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
          >
            <option value="Beginner" className="bg-[#121624] text-slate-100">Beginner</option>
            <option value="Intermediate" className="bg-[#121624] text-slate-100">Intermediate</option>
            <option value="Advanced" className="bg-[#121624] text-slate-100">Advanced</option>
            <option value="Expert" className="bg-[#121624] text-slate-100">Expert</option>
          </select>

          <Button variant="primary" size="sm" type="submit" isLoading={isAdding}>
            Add Skill
          </Button>
        </form>
      )}

      {/* Skills Chip Collection / Empty State */}
      {skillsList.length === 0 ? (
        <div className="p-8 text-center rounded-control bg-[#F4F4F1]/60 dark:bg-surface-dark-bg/40 border border-dashed border-[#E7E7E2] dark:border-surface-dark-border space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#E9E9E5] dark:bg-surface-dark-card text-[#8A928D] dark:text-[#657378] flex items-center justify-center mx-auto">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#111312] dark:text-[#F2F6F7]">
              No skills added yet.
            </p>
            <p className="text-xs text-[#8A928D] dark:text-[#657378] dark:text-[#5E6460] dark:text-[#9AA7AB] mt-0.5">
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
              <span className="font-bold text-[#111312] dark:text-[#F2F6F7]">{skill.name}</span>
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
                className="p-1 rounded-full text-[#8A928D] dark:text-[#657378] hover:text-brand-600 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <Edit3 className="w-3 h-3" />
              </button>

              {/* Remove skill × */}
              <button
                type="button"
                onClick={() => onDelete(skill.id)}
                title="Remove skill"
                className="p-1 rounded-full text-[#8A928D] dark:text-[#657378] hover:text-rose-600 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
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
        size="md"
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
        <div className="space-y-3 py-1 text-left">
          <label className="text-[13px] font-semibold text-[#8A928D] dark:text-[#9AA7AB] block">
            Proficiency Level
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(['Beginner', 'Intermediate', 'Advanced', 'Expert'] as SkillProficiency[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setEditProficiency(level)}
                className={`p-3 rounded-xl text-left border text-xs font-semibold transition-all ${
                  editProficiency === level
                    ? 'border-brand-500 bg-brand-950/40 text-brand-300 shadow-sm ring-1 ring-brand-500/50'
                    : 'border-slate-800 bg-[#0d101d] text-[#8A928D] dark:text-[#9AA7AB] hover:bg-[#121624]'
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
