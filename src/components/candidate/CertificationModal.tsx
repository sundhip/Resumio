import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { CandidateCertification } from '../../types';
import { Award, Building, Calendar, Hash, ExternalLink, Save } from 'lucide-react';

interface CertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificationToEdit?: CandidateCertification | null;
  onSave: (data: Omit<CandidateCertification, 'id' | 'candidate_profile_id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

export const CertificationModal: React.FC<CertificationModalProps> = ({
  isOpen,
  onClose,
  certificationToEdit,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [issuingOrganization, setIssuingOrganization] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [credentialUrl, setCredentialUrl] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (certificationToEdit) {
        setName(certificationToEdit.name || '');
        setIssuingOrganization(certificationToEdit.issuing_organization || '');
        setIssueDate(certificationToEdit.issue_date || '');
        setExpirationDate(certificationToEdit.expiration_date || '');
        setCredentialId(certificationToEdit.credential_id || '');
        setCredentialUrl(certificationToEdit.credential_url || '');
      } else {
        setName('');
        setIssuingOrganization('');
        setIssueDate('');
        setExpirationDate('');
        setCredentialId('');
        setCredentialUrl('');
      }
      setErrorMessage(null);
    }
  }, [isOpen, certificationToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Certification name is required.');
      return;
    }
    if (!issuingOrganization.trim()) {
      setErrorMessage('Issuing organization is required.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        issuing_organization: issuingOrganization.trim(),
        issue_date: issueDate.trim(),
        expiration_date: expirationDate.trim(),
        does_not_expire: !expirationDate.trim(),
        credential_id: credentialId.trim(),
        credential_url: credentialUrl.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to save certification. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={certificationToEdit ? 'Edit Certification' : 'Add Certification'}
      description="List professional certificates, licenses, cloud credentials, or industry qualifications."
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
            {certificationToEdit ? 'Save Changes' : 'Add Certification'}
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
              label="Certification Name *"
              placeholder="e.g. AWS Certified Solutions Architect - Associate"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<Award className="w-4 h-4" />}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <Input
              label="Issuing Organization *"
              placeholder="e.g. Amazon Web Services (AWS), Google Cloud, Microsoft"
              value={issuingOrganization}
              onChange={(e) => setIssuingOrganization(e.target.value)}
              leftIcon={<Building className="w-4 h-4" />}
              required
            />
          </div>

          <Input
            label="Issue Date"
            placeholder="YYYY-MM (e.g. 2023-08)"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
          />

          <Input
            label="Expiration Date"
            placeholder="YYYY-MM (e.g. 2026-08, or leave blank if does not expire)"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
          />

          <Input
            label="Credential ID"
            placeholder="e.g. AWS-PSA-1082947"
            value={credentialId}
            onChange={(e) => setCredentialId(e.target.value)}
            leftIcon={<Hash className="w-4 h-4" />}
          />

          <Input
            label="Credential Verification URL"
            placeholder="https://www.credly.com/badges/..."
            value={credentialUrl}
            onChange={(e) => setCredentialUrl(e.target.value)}
            leftIcon={<ExternalLink className="w-4 h-4" />}
          />
        </div>
      </form>
    </Modal>
  );
};
