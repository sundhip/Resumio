import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { CertificationModal } from './CertificationModal';
import type { CandidateCertification } from '../../types';
import {
  Award,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  Calendar,
  Building,
  CheckCircle2,
} from 'lucide-react';

interface CertificationsSectionProps {
  certifications: CandidateCertification[];
  onAdd: (data: Omit<CandidateCertification, 'id' | 'candidate_profile_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdate: (id: string, data: Omit<CandidateCertification, 'id' | 'candidate_profile_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const CertificationsSection: React.FC<CertificationsSectionProps> = ({
  certifications,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CandidateCertification | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: CandidateCertification) => {
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
          <div className="w-8 h-8 rounded-control bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <CardTitle>Certifications & Licenses</CardTitle>
            <CardDescription>
              Industry certificates, cloud credentials, and accredited qualifications
            </CardDescription>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleOpenAdd}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Certification
        </Button>
      </CardHeader>

      {/* List / Empty State */}
      {certifications.length === 0 ? (
        <div className="p-8 text-center rounded-control bg-slate-50/60 dark:bg-surface-dark-bg/40 border border-dashed border-slate-200 dark:border-surface-dark-border space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-surface-dark-card text-slate-400 flex items-center justify-center mx-auto">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No certifications added yet.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Add professional credentials like AWS, GCP, Azure, PMP, or Cisco to boost your profile score.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleOpenAdd} leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Add Certification
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {certifications.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-card border border-slate-200/80 dark:border-surface-dark-border bg-slate-50/50 dark:bg-surface-dark-card flex flex-col justify-between gap-2.5 transition-shadow hover:shadow-subtle"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <div className="p-1 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0">
                      <Award className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {item.name}
                      </h4>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5 flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-400" />
                        {item.issuing_organization}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      title="Edit certification"
                      className="p-1.5 rounded-control text-slate-400 hover:text-brand-600 hover:bg-slate-200/60 dark:hover:bg-surface-dark-hover transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(item.id)}
                      title="Delete certification"
                      className="p-1.5 rounded-control text-slate-400 hover:text-rose-600 hover:bg-slate-200/60 dark:hover:bg-surface-dark-hover transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Dates & Details */}
                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                  {item.issue_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Issued: {item.issue_date}
                    </span>
                  )}
                  {item.expiration_date && (
                    <span>
                      Expires: {item.expiration_date}
                    </span>
                  )}
                  {item.credential_id && (
                    <span className="text-slate-500 dark:text-slate-400">
                      ID: {item.credential_id}
                    </span>
                  )}
                </div>
              </div>

              {/* Credential link */}
              {item.credential_url && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-surface-dark-border/60">
                  <a
                    href={item.credential_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Verify Credential
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <CertificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        certificationToEdit={editingItem}
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
        title="Delete Certification?"
        description="Are you sure you want to delete this certification? This action cannot be undone."
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
          This record will be permanently deleted from your candidate profile.
        </p>
      </Modal>
    </Card>
  );
};
