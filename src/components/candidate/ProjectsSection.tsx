import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ProjectModal } from './ProjectModal';
import type { CandidateProject } from '../../types';
import {
  FolderGit2,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  GitBranch,
  Calendar,
} from 'lucide-react';

interface ProjectsSectionProps {
  projects: CandidateProject[];
  onAdd: (data: Omit<CandidateProject, 'id' | 'candidate_profile_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdate: (id: string, data: Omit<CandidateProject, 'id' | 'candidate_profile_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  projects,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CandidateProject | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: CandidateProject) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await onDelete(deletingId);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card padding="md" className="space-y-4">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-control bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <FolderGit2 className="w-4 h-4" />
          </div>
          <div>
            <CardTitle>Projects</CardTitle>
            <CardDescription>
              Key applications, repositories, open-source work, and system architectures
            </CardDescription>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleOpenAdd}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Project
        </Button>
      </CardHeader>

      {/* List / Empty State */}
      {projects.length === 0 ? (
        <div className="p-8 text-center rounded-control bg-slate-50/60 dark:bg-surface-dark-bg/40 border border-dashed border-slate-200 dark:border-surface-dark-border space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-surface-dark-card text-slate-400 flex items-center justify-center mx-auto">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No projects added yet.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Highlight personal projects, systems, open-source work, or enterprise builds.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleOpenAdd} leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Add Project
          </Button>
        </div>
      ) : (
        <div className="space-y-4 divide-y divide-slate-100 dark:divide-surface-dark-border">
          {projects.map((item, idx) => {
            const techList = item.technologies
              ? item.technologies.split(',').map((t) => t.trim()).filter(Boolean)
              : [];

            return (
              <div
                key={item.id}
                className={`flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                  idx > 0 ? 'pt-4' : ''
                }`}
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.name}
                    </h4>
                    {item.role && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-brand-900/60">
                        {item.role}
                      </span>
                    )}
                  </div>

                  {(item.start_date || item.end_date) && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {item.start_date || 'N/A'} — {item.end_date || 'Present'}
                      </span>
                    </div>
                  )}

                  {item.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                      {item.description}
                    </p>
                  )}

                  {techList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {techList.map((tech, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-surface-dark-input text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-surface-dark-border"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Links */}
                  <div className="flex items-center gap-3 pt-1 flex-wrap">
                    {item.project_url && (
                      <a
                        href={item.project_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Live Demo
                      </a>
                    )}
                    {item.github_url && (
                      <a
                        href={item.github_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        Repository
                      </a>
                    )}
                  </div>
                </div>

                {/* Edit / Delete actions */}
                <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    title="Edit project"
                    className="p-1.5 rounded-control text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-surface-dark-hover transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingId(item.id)}
                    title="Delete project"
                    className="p-1.5 rounded-control text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-surface-dark-hover transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectToEdit={editingItem}
        onSave={async (data) => {
          if (editingItem) {
            await onUpdate(editingItem.id, data);
          } else {
            await onAdd(data);
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        title="Delete Project?"
        description="Are you sure you want to remove this project? This action cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingId(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600 dark:text-slate-400">
          This project record will be permanently deleted from your candidate profile.
        </p>
      </Modal>
    </Card>
  );
};
