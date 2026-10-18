import React from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { CandidateProfile } from '../../types';
import { MapPin, Mail, Phone, Edit3, Camera, Sparkles } from 'lucide-react';

interface ProfileHeaderProps {
  profile: CandidateProfile;
  completion: number;
  onEditClick: () => void;
  onPhotoUploadClick?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  completion,
  onEditClick,
  onPhotoUploadClick,
}) => {
  const getInitials = (name: string) => {
    if (!name) return 'C';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="rounded-[20px] bg-white dark:bg-[#0C1113] border border-[#E7E7E2] dark:border-white/10 p-5 sm:p-6 shadow-subtle relative overflow-hidden transition-colors">
      {/* Top subtle decorative gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1F8FA6] via-[#5FD3E8] to-[#D98BE8]" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
          {/* Avatar with Initials fallback and photo badge */}
          <div className="relative group shrink-0 self-start sm:self-auto">
            {profile.photo_url ? (
              <img
                src={profile.photo_url}
                alt={profile.full_name || 'Candidate'}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-3 ring-brand-500/30 border-2 border-white dark:border-[#0C1113] shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 text-white font-bold text-2xl sm:text-3xl flex items-center justify-center ring-3 ring-brand-500/20 shadow-sm select-none">
                {getInitials(profile.full_name)}
              </div>
            )}

            {onPhotoUploadClick && (
              <button
                type="button"
                onClick={onPhotoUploadClick}
                title="Change profile photo"
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#111312] dark:bg-[#0C1113]/85 hover:bg-brand-600 text-white shadow-xs transition-all border border-white dark:border-[#0C1113]"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Identity & Contacts */}
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-[#111312] dark:text-[#F2F6F7] tracking-tight truncate">
                {profile.full_name || 'Candidate Name'}
              </h1>
              <Badge variant="purple" size="sm">
                Candidate
              </Badge>
            </div>

            <p className="text-sm font-medium text-[#111312] dark:text-[#F2F6F7]">
              {profile.headline || 'No professional headline set yet.'}
            </p>

            <div className="flex items-center gap-3 text-xs text-[#5E6460] dark:text-[#9AA7AB] flex-wrap pt-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#8A928D] dark:text-[#657378]" />
                {profile.location || 'Location not specified'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-[#8A928D] dark:text-[#657378]" />
                {profile.email || 'Email'}
              </span>
              {profile.phone && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#8A928D] dark:text-[#657378]" />
                    {profile.phone}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Action & Dynamic Completion Pill */}
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[#E7E7E2] dark:border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#5E6460] dark:text-[#9AA7AB] font-medium">
              Profile Strength:
            </span>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#1F8FA6]/10 text-[#1F8FA6] dark:text-[#5FD3E8] border border-[#1F8FA6]/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#1F8FA6] dark:text-[#5FD3E8]" />
              {completion}%
            </span>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={onEditClick}
            leftIcon={<Edit3 className="w-4 h-4" />}
          >
            Edit Profile
          </Button>
        </div>
      </div>
    </div>
  );
};
