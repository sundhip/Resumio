import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { EducationModal } from './EducationModal';
import type { CandidateEducation } from '../../types';
import { GraduationCap, Plus, Edit3, Trash2, Calendar, MapPin } from 'lucide-react';

interface EducationSectionProps {
  educationList: CandidateEducation[];
  onAdd: (data: Omit<CandidateEducation, 'id' | 'candidate_profile_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdate: (id: string, data: Omit<CandidateEducation, 'id' | 'candidate_profile_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const EducationSection: React.FC<EducationSectionProps> = ({
  educationList,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CandidateEducation | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: CandidateEducation) => {
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
          <div className="w-8 h-8 rounded-control bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <CardTitle>Education</CardTitle>
            <CardDescription>
              Degrees, fields of study, institutions, and academic milestones
            </CardDescription>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleOpenAdd}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Education
        </Button>
      </CardHeader>

      {/* List / Empty State */}
      {educationList.length === 0 ? (
        <div className="p-8 text-center rounded-control bg-[#F4F4F1]/60 dark:bg-surface-dark-bg/40 border border-dashed border-[#E7E7E2] dark:border-surface-dark-border space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#E9E9E5] dark:bg-surface-dark-card text-[#8A928D] dark:text-[#657378] flex items-center justify-center mx-auto">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#111312] dark:text-[#F2F6F7]">
              No education added yet.
            </p>
            <p className="text-xs text-[#8A928D] dark:text-[#657378] dark:text-[#5E6460] dark:text-[#9AA7AB] mt-0.5">
              Add your university degrees, colleges, or diplomas to showcase your qualifications.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleOpenAdd} leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Add Education
          </Button>
        </div>
      ) : (
        <div className="space-y-3 divide-y divide-slate-100 dark:divide-surface-dark-border">
          {educationList.map((item, idx) => (
            <div
              key={item.id}
              className={`flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                idx > 0 ? 'pt-3.5' : ''
              }`}
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-[#111312] dark:text-[#F2F6F7]">
                    {item.degree} — {item.field_of_study}
                  </h4>
                  {item.grade_or_gpa && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#E9E9E5] dark:bg-surface-dark-bg text-[#111312] dark:text-[#F2F6F7]">
                      {item.grade_or_gpa}
                    </span>
                  )}
                </div>

                <p className="text-xs font-medium text-[#111312] dark:text-[#F2F6F7]">
                  {item.institution}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-[#8A928D] dark:text-[#657378] dark:text-[#5E6460] dark:text-[#9AA7AB] flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {item.start_date} — {item.currently_studying ? 'Present' : item.end_date || 'N/A'}
                  </span>
                  {item.location && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {item.location}
                      </span>
                    </>
                  )}
                </div>

                {item.description && (
                  <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] mt-1.5 leading-relaxed whitespace-pre-line">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Edit / Delete action buttons */}
              <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(item)}
                  title="Edit education"
                  className="p-1.5 rounded-control text-[#8A928D] dark:text-[#657378] hover:text-brand-600 hover:bg-[#E9E9E5] dark:hover:bg-surface-dark-hover transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingId(item.id)}
                  title="Delete education"
                  className="p-1.5 rounded-control text-[#8A928D] dark:text-[#657378] hover:text-rose-600 hover:bg-[#E9E9E5] dark:hover:bg-surface-dark-hover transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <EducationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        educationToEdit={editingItem}
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
        title="Delete Education Record?"
        description="Are you sure you want to delete this education entry? This action cannot be undone."
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
        <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
          This record will be permanently removed from your candidate profile and database.
        </p>
      </Modal>
    </Card>
  );
};
