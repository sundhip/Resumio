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
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300">
            {errorMessage}
          </div>
        )}

        {/* Profile Photo Section */}
        <div className="p-4 rounded-xl bg-[#F4F4F1] dark:bg-[#0C1113] border border-[#E7E7E2] dark:border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Profile Avatar"
                className="w-14 h-14 rounded-full object-cover ring-2 ring-[#1F8FA6]/30"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#1F8FA6]/10 text-[#1F8FA6] dark:text-[#5FD3E8] font-bold text-base flex items-center justify-center border border-[#1F8FA6]/20">
                {(fullName || 'Candidate').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-[#111312] dark:text-[#F2F6F7]">Profile Photo</p>
              <p className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB] mt-0.5">JPG, PNG or WEBP (Max 5MB)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#111719] hover:bg-[#E7E7E2] dark:hover:bg-white/10 border border-[#E7E7E2] dark:border-white/10 text-[#111312] dark:text-[#F2F6F7] transition-colors shadow-xs">
              <Camera className="w-3.5 h-3.5 text-[#1F8FA6]" />
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
                className="p-1.5 rounded-lg text-[#5E6460] dark:text-[#9AA7AB] hover:text-rose-400 hover:bg-[#E7E7E2] dark:hover:bg-white/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Responsive Form Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <Input
            label="Full Name *"
            placeholder="e.g. Rahul Kumar"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            leftIcon={<User className="w-4 h-4 text-[#5E6460] dark:text-[#9AA7AB]" />}
            required
          />

          <Input
            label="Professional Headline *"
            placeholder="e.g. Senior Full Stack Developer"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            leftIcon={<Briefcase className="w-4 h-4 text-[#5E6460] dark:text-[#9AA7AB]" />}
            helperText="Appears directly under your name"
          />

          <Input
            label="Phone Number"
            placeholder="e.g. +91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone className="w-4 h-4 text-[#5E6460] dark:text-[#9AA7AB]" />}
          />

          <Input
            label="Location (City, Country)"
            placeholder="e.g. Chennai, India"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            leftIcon={<MapPin className="w-4 h-4 text-[#5E6460] dark:text-[#9AA7AB]" />}
          />

          {/* Full-width Professional Summary Textarea */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-[13px] font-semibold text-[#5E6460] dark:text-[#9AA7AB] block">
              Professional Summary
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell recruiters about your professional background, strengths and career goals."
              className="w-full p-3.5 text-xs sm:text-sm rounded-lg bg-white dark:bg-[#0C1113] text-[#111312] dark:text-[#F2F6F7] border border-[#E7E7E2] dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#1F8FA6]/40 focus:border-[#1F8FA6] transition-all resize-y min-h-[100px]"
            />
            <p className="text-[11px] text-[#8A928D] dark:text-[#657378]">
              Write a comprehensive overview of your focus areas and technical domains.
            </p>
          </div>
        </div>
      </form>
    </Modal>
  );
};
