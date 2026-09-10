import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import type { CandidateProfile } from '../../types';
import { User, Phone, MapPin, Briefcase, Camera, Trash2, Save } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CandidateProfile;
  onProfileUpdated: (updatedProfile: CandidateProfile, newCompletion: number) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
}) => {
  const { showToast } = useToast();

  const [fullName, setFullName] = useState(profile.full_name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [location, setLocation] = useState(profile.location || '');
  const [headline, setHeadline] = useState(profile.headline || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [photoUrl, setPhotoUrl] = useState(profile.photo_url || '');

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setLocation(profile.location || '');
      setHeadline(profile.headline || '');
      setBio(profile.bio || '');
      setPhotoUrl(profile.photo_url || '');
      setErrorMessage(null);
    }
  }, [isOpen, profile]);

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('error', 'Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Image file must be under 5MB.');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const res = await api.uploadCandidatePhoto(file);
      if (res.success) {
        setPhotoUrl(res.photoUrl);
        showToast('success', 'Profile photo updated successfully.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Photo upload failed.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    setIsUploadingPhoto(true);
    try {
      const res = await api.removeCandidatePhoto();
      if (res.success) {
        setPhotoUrl('');
        showToast('info', 'Profile photo removed.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Unable to remove photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.updateCandidateBasicProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        location: location.trim(),
        headline: headline.trim(),
        bio: bio.trim(),
        photoUrl: photoUrl.trim(),
      });

      if (res.success && res.profile) {
        showToast('success', 'Profile updated successfully.');
        onProfileUpdated(res.profile, res.profile.profile_completion);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to update profile. Please try again.');
      showToast('error', err.message || 'Update failed.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Personal Information"
      description="Update your basic contact coordinates, professional headline, and background summary."
      size="lg"
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
            Save Changes
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-control bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
            {errorMessage}
          </div>
        )}

        {/* Profile Photo Controls */}
        <div className="p-3.5 rounded-control bg-slate-50/70 dark:bg-surface-dark-bg/60 border border-slate-200/70 dark:border-surface-dark-border/70 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Profile Avatar"
                className="w-14 h-14 rounded-full object-cover ring-2 ring-brand-500/30"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-lg flex items-center justify-center">
                {fullName.slice(0, 2).toUpperCase() || 'RK'}
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">Profile Photo</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">JPG, PNG or WEBP (Max 5MB)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-medium bg-white dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border hover:border-brand-500 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs">
              <Camera className="w-3.5 h-3.5 text-brand-500" />
              <span>{isUploadingPhoto ? 'Uploading...' : 'Upload Photo'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoFileChange}
                disabled={isUploadingPhoto}
              />
            </label>

            {photoUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={isUploadingPhoto}
                title="Remove photo"
                className="p-1.5 rounded-control text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-surface-dark-hover transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Full Name *"
            placeholder="e.g. Rahul Kumar"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
            required
          />

          <Input
            label="Professional Headline *"
            placeholder="e.g. Senior Full Stack Developer"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            leftIcon={<Briefcase className="w-4 h-4" />}
            helperText="Appears directly under your name"
          />

          <Input
            label="Phone Number"
            placeholder="e.g. +91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone className="w-4 h-4" />}
          />

          <Input
            label="Location (City, Country)"
            placeholder="e.g. Chennai, India"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            leftIcon={<MapPin className="w-4 h-4" />}
          />

          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
              Professional Summary
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell recruiters about your professional background, strengths and career goals."
              className="w-full p-3 text-xs sm:text-sm rounded-control bg-white dark:bg-surface-dark-input text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-surface-dark-border focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Write a comprehensive overview of your focus areas and technical domains.
            </p>
          </div>
        </div>
      </form>
    </Modal>
  );
};
