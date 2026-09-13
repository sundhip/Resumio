import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProfileHeader } from '../../components/candidate/ProfileHeader';
import { EditProfileModal } from '../../components/candidate/EditProfileModal';
import { EducationSection } from '../../components/candidate/EducationSection';
import { SkillsSection } from '../../components/candidate/SkillsSection';
import { ExperienceSection } from '../../components/candidate/ExperienceSection';
import { ProjectsSection } from '../../components/candidate/ProjectsSection';
import { CertificationsSection } from '../../components/candidate/CertificationsSection';
import { ProfileCompletionCard } from '../../components/candidate/ProfileCompletionCard';
import { ResumeStatusCard } from '../../components/candidate/ResumeStatusCard';
import { ResumePreviewModal } from '../../components/candidate/ResumePreviewModal';
import type {
  FullCandidateProfileData,
  CandidateProfile,
  CandidateEducation,
  CandidateExperience,
  CandidateProject,
  CandidateCertification,
  SkillProficiency,
} from '../../types';
import { Mail, Phone, MapPin, Edit3, Sparkles } from 'lucide-react';

interface CandidateProfilePageProps {
  onNavigate?: (path: string) => void;
}

export const CandidateProfilePage: React.FC<CandidateProfilePageProps> = ({ onNavigate }) => {
  const { user, updateProfileContext } = useAuth();
  const { showToast } = useToast();

  const [data, setData] = useState<FullCandidateProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState<boolean>(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);

  // Fetch complete profile on mount
  const loadFullProfile = async () => {
    try {
      setIsLoading(true);
      const res = await api.getFullCandidateProfile();
      if (res.data) {
        setData(res.data);
        if (res.data.profile) {
          updateProfileContext(res.data.profile);
        }
      }
    } catch (err: any) {
      showToast('error', 'Failed to load candidate profile', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFullProfile();
  }, []);

  // Profile modal callback
  const handleProfileUpdated = (updatedProfile: CandidateProfile, newCompletion: number) => {
    if (data) {
      setData({
        ...data,
        profile: updatedProfile,
        completion: newCompletion,
      });
    }
    updateProfileContext(updatedProfile);
  };

  // Education Handlers
  const handleAddEducation = async (
    itemData: Omit<CandidateEducation, 'id' | 'candidate_profile_id' | 'created_at' | 'updated_at'>
  ) => {
    const res = await api.addEducation(itemData);
    if (res.success && res.education) {
      if (data) {
        setData({
          ...data,
          education: [...data.education, res.education],
          completion: res.completion ?? data.completion,
          profile: {
            ...data.profile,
            profile_completion: res.completion ?? data.profile.profile_completion,
          },
        });
      }
      showToast('success', 'Education added', `${itemData.degree} at ${itemData.institution}`);
    }
  };

  const handleUpdateEducation = async (
    id: string,
    itemData: Omit<CandidateEducation, 'id' | 'candidate_profile_id' | 'created_at' | 'updated_at'>
  ) => {
    const res = await api.updateEducation(id, itemData);
    if (res.success && res.education) {
      if (data) {
        setData({
          ...data,
          education: data.education.map((e) => (e.id === id ? res.education! : e)),
        });
      }
      showToast('success', 'Education updated');
    }
  };

  const handleDeleteEducation = async (id: string) => {
    const res = await api.deleteEducation(id);
    if (res.success) {
      if (data) {
        setData({
          ...data,
          education: data.education.filter((e) => e.id !== id),
          completion: res.completion ?? data.completion,
          profile: {
            ...data.profile,
            profile_completion: res.completion ?? data.profile.profile_completion,
          },
        });
      }
      showToast('success', 'Education removed');
    }
  };

  // Skills Handlers
  const handleAddSkill = async (skillData: { name: string; proficiency: SkillProficiency }) => {
    const res = await api.addSkill(skillData);
    if (res.success && res.skill) {
      if (data) {
        setData({
          ...data,
          skills: [...data.skills, res.skill],
          completion: res.completion ?? data.completion,
          profile: {
            ...data.profile,
            profile_completion: res.completion ?? data.profile.profile_completion,
          },
        });
      }
      showToast('success', 'Skill added', `${skillData.name} (${skillData.proficiency})`);
    }
  };

  const handleUpdateSkill = async (id: string, skillData: { name: string; proficiency: SkillProficiency }) => {
    const res = await api.updateSkill(id, skillData);
    if (res.success && res.skill) {
      if (data) {
        setData({
          ...data,
          skills: data.skills.map((s) => (s.id === id ? res.skill! : s)),
        });
      }
      showToast('success', 'Skill proficiency updated');
    }
  };

  const handleDeleteSkill = async (id: string) => {
    const res = await api.deleteSkill(id);
    if (res.success) {
      if (data) {
        setData({
          ...data,
          skills: data.skills.filter((s) => s.id !== id),
          completion: res.completion ?? data.completion,
          profile: {
            ...data.profile,
            profile_completion: res.completion ?? data.profile.profile_completion,
          },
        });
      }
      showToast('success', 'Skill removed');
    }
  };

  // Experience Handlers
  const handleAddExperience = async (
    itemData: Omit<CandidateExperience, 'id' | 'candidate_profile_id' | 'created_at' | 'updated_at'>
  ) => {
    const res = await api.addExperience(itemData);
    if (res.success && res.experience) {
      if (data) {
        setData({
          ...data,
          experience: [res.experience, ...data.experience],
          completion: res.completion ?? data.completion,
          profile: {
            ...data.profile,
            profile_completion: res.completion ?? data.profile.profile_completion,
          },
        });
      }
      showToast('success', 'Experience added', `${itemData.job_title} at ${itemData.company}`);
    }
  };

  const handleUpdateExperience = async (
    id: string,
    itemData: Omit<CandidateExperience, 'id' | 'candidate_profile_id' | 'created_at' | 'updated_at'>
  ) => {
    const res = await api.updateExperience(id, itemData);
    if (res.success && res.experience) {
      if (data) {
        setData({
          ...data,
          experience: data.experience.map((e) => (e.id === id ? res.experience! : e)),
        });
      }
      showToast('success', 'Experience updated');
    }
  };

  const handleDeleteExperience = async (id: string) => {
    const res = await api.deleteExperience(id);
    if (res.success) {
      if (data) {
        setData({
          ...data,
          experience: data.experience.filter((e) => e.id !== id),
          completion: res.completion ?? data.completion,
          profile: {
            ...data.profile,
            profile_completion: res.completion ?? data.profile.profile_completion,
          },
        });
      }
      showToast('success', 'Experience removed');
    }
  };

  // Projects Handlers
  const handleAddProject = async (
    itemData: Omit<CandidateProject, 'id' | 'candidate_profile_id' | 'created_at' | 'updated_at'>
  ) => {
    const res = await api.addProject(itemData);
    if (res.success && res.project) {
      if (data) {
        setData({
          ...data,
          projects: [...data.projects, res.project],
          completion: res.completion ?? data.completion,
          profile: {
            ...data.profile,
            profile_completion: res.completion ?? data.profile.profile_completion,
          },
        });
      }
      showToast('success', 'Project added', itemData.name);
    }
  };

  const handleUpdateProject = async (
    id: string,
    itemData: Omit<CandidateProject, 'id' | 'candidate_profile_id' | 'created_at' | 'updated_at'>
  ) => {
    const res = await api.updateProject(id, itemData);
    if (res.success && res.project) {
      if (data) {
        setData({
          ...data,
          projects: data.projects.map((p) => (p.id === id ? res.project! : p)),
        });
      }
      showToast('success', 'Project updated');
    }
  };

  const handleDeleteProject = async (id: string) => {
    const res = await api.deleteProject(id);
    if (res.success) {
      if (data) {
        setData({
          ...data,
          projects: data.projects.filter((p) => p.id !== id),
          completion: res.completion ?? data.completion,
          profile: {
            ...data.profile,
            profile_completion: res.completion ?? data.profile.profile_completion,
          },
        });
      }
      showToast('success', 'Project removed');
    }
  };

  // Certifications Handlers
  const handleAddCertification = async (
    itemData: Omit<CandidateCertification, 'id' | 'candidate_profile_id' | 'created_at' | 'updated_at'>
  ) => {
    const res = await api.addCertification(itemData);
    if (res.success && res.certification) {
      if (data) {
        setData({
          ...data,
          certifications: [...data.certifications, res.certification],
          completion: res.completion ?? data.completion,
          profile: {
            ...data.profile,
            profile_completion: res.completion ?? data.profile.profile_completion,
          },
        });
      }
      showToast('success', 'Certification added', itemData.name);
    }
  };

  const handleUpdateCertification = async (
    id: string,
    itemData: Omit<CandidateCertification, 'id' | 'candidate_profile_id' | 'created_at' | 'updated_at'>
  ) => {
    const res = await api.updateCertification(id, itemData);
    if (res.success && res.certification) {
      if (data) {
        setData({
          ...data,
          certifications: data.certifications.map((c) => (c.id === id ? res.certification! : c)),
        });
      }
      showToast('success', 'Certification updated');
    }
  };

  const handleDeleteCertification = async (id: string) => {
    const res = await api.deleteCertification(id);
    if (res.success) {
      if (data) {
        setData({
          ...data,
          certifications: data.certifications.filter((c) => c.id !== id),
          completion: res.completion ?? data.completion,
          profile: {
            ...data.profile,
            profile_completion: res.completion ?? data.profile.profile_completion,
          },
        });
      }
      showToast('success', 'Certification removed');
    }
  };

  // Resume Actions
  const handleDownloadResume = async () => {
    if (!data?.resume) return;
    try {
      await api.downloadResume();
      showToast('success', 'Download initiated', data.resume.original_filename);
    } catch (err: any) {
      showToast('error', 'Download failed', err.message);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-6 w-full animate-pulse">
        <div className="h-40 bg-slate-200 dark:bg-surface-dark-card rounded-modal" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-44 bg-slate-100 dark:bg-surface-dark-card rounded-card" />
            <div className="h-56 bg-slate-100 dark:bg-surface-dark-card rounded-card" />
            <div className="h-56 bg-slate-100 dark:bg-surface-dark-card rounded-card" />
          </div>
          <div className="space-y-6">
            <div className="h-64 bg-slate-100 dark:bg-surface-dark-card rounded-card" />
            <div className="h-48 bg-slate-100 dark:bg-surface-dark-card rounded-card" />
          </div>
        </div>
      </div>
    );
  }

  const completionScore = data.completion || data.profile.profile_completion || 0;

  return (
    <div className="space-y-6 w-full">
      {/* Top Profile Header Hero */}
      <ProfileHeader
        profile={data.profile}
        completion={completionScore}
        onEditClick={() => setIsEditProfileModalOpen(true)}
      />

      {/* Main Grid: 2 Columns for Sections, 1 Column for Strength & Resume Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Professional Summary */}
          <Card padding="md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-control bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle>Professional Summary</CardTitle>
                  <CardDescription>
                    Executive overview of your technical background, domain focus, and career objectives
                  </CardDescription>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditProfileModalOpen(true)}
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              >
                Edit Bio
              </Button>
            </CardHeader>

            {data.profile.bio ? (
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {data.profile.bio}
              </p>
            ) : (
              <div className="p-6 text-center rounded-control bg-slate-50/50 dark:bg-surface-dark-bg/50 border border-dashed border-slate-200 dark:border-surface-dark-border space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No professional summary written yet. Click "Edit Bio" to add your introduction.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditProfileModalOpen(true)}
                >
                  Add Bio (+10%)
                </Button>
              </div>
            )}
          </Card>

          {/* Work Experience */}
          <ExperienceSection
            experienceList={data.experience}
            onAdd={handleAddExperience}
            onUpdate={handleUpdateExperience}
            onDelete={handleDeleteExperience}
          />

          {/* Education */}
          <EducationSection
            educationList={data.education}
            onAdd={handleAddEducation}
            onUpdate={handleUpdateEducation}
            onDelete={handleDeleteEducation}
          />

          {/* Technical Skills */}
          <SkillsSection
            skillsList={data.skills}
            onAdd={handleAddSkill}
            onUpdate={handleUpdateSkill}
            onDelete={handleDeleteSkill}
          />

          {/* Projects */}
          <ProjectsSection
            projects={data.projects}
            onAdd={handleAddProject}
            onUpdate={handleUpdateProject}
            onDelete={handleDeleteProject}
          />

          {/* Certifications */}
          <CertificationsSection
            certifications={data.certifications}
            onAdd={handleAddCertification}
            onUpdate={handleUpdateCertification}
            onDelete={handleDeleteCertification}
          />
        </div>

        {/* Right Column: Profile Strength, Resume Card, and Contact Coordinates */}
        <div className="space-y-6">
          {/* Profile Strength Checklist */}
          <ProfileCompletionCard
            data={data}
            onNavigateToSection={(id) => {
              if (id === 'resume') {
                onNavigate?.('resume');
              } else {
                setIsEditProfileModalOpen(true);
              }
            }}
          />

          {/* Resume Quick Widget */}
          <ResumeStatusCard
            resume={data.resume}
            onNavigateToResumePage={() => onNavigate?.('resume')}
            onPreview={() => setIsPreviewModalOpen(true)}
            onDownload={handleDownloadResume}
          />

          {/* Contact Coordinates */}
          <Card padding="md">
            <CardHeader>
              <div>
                <CardTitle className="text-base">Contact Coordinates</CardTitle>
                <CardDescription>Verified candidate contact information</CardDescription>
              </div>
            </CardHeader>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-3 p-3 rounded-control bg-slate-50 dark:bg-surface-dark-bg border border-slate-200/60 dark:border-surface-dark-border/60">
                <Mail className="w-4 h-4 text-brand-500 shrink-0" />
                <div className="min-w-0">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Email Address
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white truncate block">
                    {data.profile.email || user?.email}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-control bg-slate-50 dark:bg-surface-dark-bg border border-slate-200/60 dark:border-surface-dark-border/60">
                <Phone className="w-4 h-4 text-brand-500 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Phone Number
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {data.profile.phone || 'Not provided'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-control bg-slate-50 dark:bg-surface-dark-bg border border-slate-200/60 dark:border-surface-dark-border/60">
                <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Location
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {data.profile.location || 'Not provided'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Profile & Photo Modal */}
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        profile={data.profile}
        onProfileUpdated={handleProfileUpdated}
      />

      {/* PDF In-Browser Preview Modal */}
      {data.resume && (
        <ResumePreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          filename={data.resume.original_filename}
          onDownload={handleDownloadResume}
        />
      )}
    </div>
  );
};
