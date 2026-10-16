import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Pill } from '../../components/kit/Pill';
import { ScoreRing } from '../../components/kit/ScoreRing';
import { ProfileHeader } from '../../components/candidate/ProfileHeader';
import { EditProfileModal } from '../../components/candidate/EditProfileModal';
import { EducationSection } from '../../components/candidate/EducationSection';
import { SkillsSection } from '../../components/candidate/SkillsSection';
import { ExperienceSection } from '../../components/candidate/ExperienceSection';
import { ProjectsSection } from '../../components/candidate/ProjectsSection';
import { CertificationsSection } from '../../components/candidate/CertificationsSection';
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
import {
  Mail,
  Phone,
  MapPin,
  Edit3,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Briefcase,
  GraduationCap,
  Code2,
  FolderGit2,
  Award,
  FileText,
  ShieldCheck,
  Globe,
  Lock,
  Download,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Eye,
  Layers,
} from 'lucide-react';

const GithubIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

interface CandidateProfilePageProps {
  onNavigate?: (path: string) => void;
}

export const CandidateProfilePage: React.FC<CandidateProfilePageProps> = ({ onNavigate }) => {
  const { user, updateProfileContext, logout } = useAuth();
  const { showToast } = useToast();

  const [data, setData] = useState<FullCandidateProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Tabs: Profile Sections | GitHub & Evidence | Privacy & Consents
  const [activeTab, setActiveTab] = useState<'sections' | 'github' | 'privacy'>('sections');

  // Collapsible sections state (all expanded by default)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    bio: false,
    experience: false,
    education: false,
    skills: false,
    projects: false,
    certifications: false,
  });

  const toggleSection = (section: string) => {
    setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Modals
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState<boolean>(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);

  // GitHub & Verification State
  const [githubUsername, setGithubUsername] = useState<string>('');
  const [githubResult, setGithubResult] = useState<any>(null);
  const [isVerifyingGithub, setIsVerifyingGithub] = useState(false);
  const [portfolioUrl, setPortfolioUrl] = useState<string>('');
  const [portfolioResult, setPortfolioResult] = useState<any>(null);
  const [isVerifyingPortfolio, setIsVerifyingPortfolio] = useState(false);

  // Privacy & Consent State
  const [consents, setConsents] = useState<any>({ talentPoolInclusion: true, trainingDataInclusion: false });
  const [profileAccessLogs, setProfileAccessLogs] = useState<any[]>([]);
  const [isExportingData, setIsExportingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const loadConsentsAndLogs = async () => {
    try {
      const [cRes, lRes] = await Promise.all([
        api.getCandidateConsents(),
        api.getProfileAccessLogs(),
      ]);
      if (cRes.success && cRes.data) setConsents(cRes.data);
      if (lRes.success && lRes.data) setProfileAccessLogs(lRes.data);
    } catch (err: any) {
      console.warn('Consents/Logs notice:', err.message);
    }
  };

  useEffect(() => {
    loadFullProfile();
    loadConsentsAndLogs();
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
      showToast('success', 'Project added', itemData.title);
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

  // GitHub Verification
  const handleVerifyGitHub = async () => {
    if (!githubUsername.trim()) {
      showToast('warning', 'Username Required', 'Please enter your public GitHub username.');
      return;
    }
    setIsVerifyingGithub(true);
    try {
      const res = await api.verifyGitHub({ githubUsername: githubUsername.trim() });
      if (res.success && res.data) {
        setGithubResult(res.data);
        showToast('success', 'GitHub Verified', `Verified ${res.data.verifiedSkills.filter((s: any) => s.isVerified).length} claimed skills with repository evidence.`);
        loadFullProfile();
      }
    } catch (err: any) {
      showToast('error', 'GitHub Verification Failed', err.message);
    } finally {
      setIsVerifyingGithub(false);
    }
  };

  // Portfolio Verification
  const handleVerifyPortfolio = async () => {
    if (!portfolioUrl.trim()) {
      showToast('warning', 'URL Required', 'Please enter your portfolio website URL.');
      return;
    }
    setIsVerifyingPortfolio(true);
    try {
      const res = await api.verifyPortfolio(portfolioUrl.trim());
      if (res.success && res.data) {
        setPortfolioResult(res.data);
        showToast('success', 'Portfolio Verified', 'Fetched safely through Resumio SSRF-hardened proxy.');
      }
    } catch (err: any) {
      showToast('error', 'Portfolio Verification Failed', err.message);
    } finally {
      setIsVerifyingPortfolio(false);
    }
  };

  // Privacy Handlers
  const handleSaveConsents = async (updated: any) => {
    try {
      const res = await api.updateCandidateConsents(updated);
      if (res.success && res.data) {
        setConsents(res.data);
        showToast('success', 'Consents Updated', 'Your privacy preferences are active.');
      }
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message);
    }
  };

  const handleExportData = async () => {
    setIsExportingData(true);
    try {
      const res = await api.exportCandidateData();
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resumio-gdpr-data-export-${user?.id || 'candidate'}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('success', 'Data Package Exported', 'Downloaded complete GDPR/CCPA personal data archive.');
    } catch (err: any) {
      showToast('error', 'Export Failed', err.message);
    } finally {
      setIsExportingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await api.deleteCandidateAccount();
      showToast('info', 'Account Purged', 'Your account and all associated personal data have been completely erased.');
      logout();
    } catch (err: any) {
      showToast('error', 'Deletion Failed', err.message);
      setIsDeletingAccount(false);
    }
  };

  // Download original uploaded resume
  const handleDownloadResume = async () => {
    try {
      const res = await api.getResume();
      if (res.success && res.resume) {
        window.open(res.resume.file_url, '_blank');
      } else {
        showToast('error', 'Resume unavailable', 'No resume file uploaded yet.');
      }
    } catch (err: any) {
      showToast('error', 'Download error', err.message);
    }
  };

  // Calculate Next Best Action
  const calculateNextBestAction = () => {
    if (!data) return { text: 'Complete your profile', points: 10, action: () => setIsEditProfileModalOpen(true) };
    if (!data.profile.bio || data.profile.bio.trim().length === 0) {
      return { text: 'Add Professional Summary', points: 10, action: () => setIsEditProfileModalOpen(true) };
    }
    if (data.experience.length === 0) {
      return { text: 'Add Work Experience', points: 15, action: () => setCollapsed(prev => ({ ...prev, experience: false })) };
    }
    if (data.skills.length === 0) {
      return { text: 'Add Technical Skills', points: 15, action: () => setCollapsed(prev => ({ ...prev, skills: false })) };
    }
    if (data.projects.length === 0) {
      return { text: 'Add Key Projects', points: 10, action: () => setCollapsed(prev => ({ ...prev, projects: false })) };
    }
    if (!githubResult) {
      return { text: 'Verify GitHub Repositories', points: 15, action: () => setActiveTab('github') };
    }
    if (data.certifications.length === 0) {
      return { text: 'Add Accreditations & Certifications', points: 10, action: () => setCollapsed(prev => ({ ...prev, certifications: false })) };
    }
    return { text: 'Profile is fully optimized!', points: 0, action: () => {} };
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-pulse">
        <div className="h-44 rounded-2xl bg-black/5 dark:bg-white/5 border border-[#E7E7E2] dark:border-white/8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-64 rounded-2xl bg-black/5 dark:bg-white/5 border border-[#E7E7E2] dark:border-white/8" />
            <div className="h-64 rounded-2xl bg-black/5 dark:bg-white/5 border border-[#E7E7E2] dark:border-white/8" />
          </div>
          <div className="space-y-4">
            <div className="h-64 rounded-2xl bg-black/5 dark:bg-white/5 border border-[#E7E7E2] dark:border-white/8" />
          </div>
        </div>
      </div>
    );
  }

  const completionPercentage = data.completion ?? data.profile.profile_completion ?? 75;
  const nextBestAction = calculateNextBestAction();

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16">
      {/* Profile Header Card */}
      <ProfileHeader
        profile={data.profile}
        completion={completionPercentage}
        onEditClick={() => setIsEditProfileModalOpen(true)}
      />

      {/* Completion Ring & Next Best Action Hero Bento */}
      <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            {/* Score Ring Component */}
            <div className="shrink-0">
              <ScoreRing
                score={completionPercentage}
                size={84}
                strokeWidth={7}
                color="teal"
                label="Strength"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-[#111312] dark:text-[#F2F6F7] tracking-tight">
                  Profile Completeness & Verification
                </h3>
                <Pill variant="micro-status" color={completionPercentage >= 80 ? 'teal' : 'neutral'}>
                  {completionPercentage >= 80 ? 'All-Star Ready' : 'In Progress'}
                </Pill>
              </div>
              <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] max-w-lg leading-relaxed font-medium">
                Profiles with 80%+ completion receive 3.4x more recruiter inquiries and match faster against published criteria.
              </p>
            </div>
          </div>

          {/* Next Best Action Pill / Button */}
          {nextBestAction.points > 0 && (
            <div className="p-3.5 rounded-xl bg-[#1F8FA6]/10 border border-[#1F8FA6]/20 flex items-center justify-between gap-4 shrink-0">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-[#1F8FA6] dark:text-[#5FD3E8] uppercase tracking-wider block">
                  Next Best Action
                </span>
                <span className="text-xs font-bold text-[#111312] dark:text-[#F2F6F7]">
                  {nextBestAction.text}
                </span>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={nextBestAction.action}
                className="text-xs shrink-0"
              >
                +{nextBestAction.points}% Lift
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-[#E7E7E2] dark:border-white/8 overflow-x-auto pb-px scrollbar-none">
        <button
          onClick={() => setActiveTab('sections')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
            activeTab === 'sections'
              ? 'border-[#1F8FA6] text-[#1F8FA6] dark:text-[#5FD3E8] bg-[#1F8FA6]/10'
              : 'border-transparent text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:hover:text-[#F2F6F7]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Profile Sections</span>
        </button>

        <button
          onClick={() => setActiveTab('github')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
            activeTab === 'github'
              ? 'border-[#1F8FA6] text-[#1F8FA6] dark:text-[#5FD3E8] bg-[#1F8FA6]/10'
              : 'border-transparent text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:hover:text-[#F2F6F7]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>GitHub & Evidence Verification</span>
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
            activeTab === 'privacy'
              ? 'border-[#1F8FA6] text-[#1F8FA6] dark:text-[#5FD3E8] bg-[#1F8FA6]/10'
              : 'border-transparent text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:hover:text-[#F2F6F7]'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Privacy & Consent Controls</span>
        </button>
      </div>

      {/* Tab 1: Collapsible Profile Sections */}
      {activeTab === 'sections' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column: Collapsible Section Cards */}
          <div className="lg:col-span-2 space-y-4">
            {/* Section 1: Professional Summary / Bio (Collapsible) */}
            <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl overflow-hidden shadow-2xs">
              <div
                onClick={() => toggleSection('bio')}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors border-b border-[#E7E7E2] dark:border-white/8"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1F8FA6]/10 text-[#1F8FA6] flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#111312] dark:text-[#F2F6F7]">
                      Professional Summary
                    </h3>
                    <p className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB]">
                      Executive technical overview and career objectives
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditProfileModalOpen(true);
                    }}
                    leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                  >
                    Edit Bio
                  </Button>
                  <button
                    type="button"
                    className="p-1 text-[#8C928E] hover:text-[#111312] dark:hover:text-[#F2F6F7]"
                  >
                    {collapsed.bio ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!collapsed.bio && (
                <div className="p-5">
                  {data.profile.bio ? (
                    <p className="text-xs sm:text-sm text-[#111312] dark:text-[#F2F6F7] leading-relaxed whitespace-pre-line font-medium">
                      {data.profile.bio}
                    </p>
                  ) : (
                    <div className="p-6 text-center rounded-xl bg-black/[0.015] dark:bg-white/[0.02] border border-dashed border-[#E7E7E2] dark:border-white/10 space-y-2">
                      <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
                        No professional summary written yet. Add your executive overview to lift match scores.
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
                </div>
              )}
            </div>

            {/* Section 2: Work Experience (Collapsible) */}
            <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl overflow-hidden shadow-2xs">
              <div
                onClick={() => toggleSection('experience')}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors border-b border-[#E7E7E2] dark:border-white/8"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1F8FA6]/10 text-[#1F8FA6] flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#111312] dark:text-[#F2F6F7]">
                        Work Experience
                      </h3>
                      <Pill variant="micro-status" color="neutral">
                        <span className="figure">{data.experience.length}</span> Roles
                      </Pill>
                    </div>
                    <p className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB]">
                      Chronological employment history and impact
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-1 text-[#8C928E] hover:text-[#111312] dark:hover:text-[#F2F6F7]"
                  >
                    {collapsed.experience ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!collapsed.experience && (
                <div className="p-2 sm:p-4">
                  <ExperienceSection
                    experienceList={data.experience}
                    onAdd={handleAddExperience}
                    onUpdate={handleUpdateExperience}
                    onDelete={handleDeleteExperience}
                  />
                </div>
              )}
            </div>

            {/* Section 3: Education (Collapsible) */}
            <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl overflow-hidden shadow-2xs">
              <div
                onClick={() => toggleSection('education')}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors border-b border-[#E7E7E2] dark:border-white/8"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1F8FA6]/10 text-[#1F8FA6] flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#111312] dark:text-[#F2F6F7]">
                        Education
                      </h3>
                      <Pill variant="micro-status" color="neutral">
                        <span className="figure">{data.education.length}</span> Degrees
                      </Pill>
                    </div>
                    <p className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB]">
                      Academic background and degrees
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-1 text-[#8C928E] hover:text-[#111312] dark:hover:text-[#F2F6F7]"
                  >
                    {collapsed.education ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!collapsed.education && (
                <div className="p-2 sm:p-4">
                  <EducationSection
                    educationList={data.education}
                    onAdd={handleAddEducation}
                    onUpdate={handleUpdateEducation}
                    onDelete={handleDeleteEducation}
                  />
                </div>
              )}
            </div>

            {/* Section 4: Technical Skills (Collapsible) */}
            <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl overflow-hidden shadow-2xs">
              <div
                onClick={() => toggleSection('skills')}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors border-b border-[#E7E7E2] dark:border-white/8"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1F8FA6]/10 text-[#1F8FA6] flex items-center justify-center">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#111312] dark:text-[#F2F6F7]">
                        Technical Skills
                      </h3>
                      <Pill variant="micro-status" color="teal">
                        <span className="figure">{data.skills.length}</span> Skills
                      </Pill>
                    </div>
                    <p className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB]">
                      Categorized competencies and proficiency levels
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-1 text-[#8C928E] hover:text-[#111312] dark:hover:text-[#F2F6F7]"
                  >
                    {collapsed.skills ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!collapsed.skills && (
                <div className="p-2 sm:p-4">
                  <SkillsSection
                    skillsList={data.skills}
                    onAdd={handleAddSkill}
                    onUpdate={handleUpdateSkill}
                    onDelete={handleDeleteSkill}
                  />
                </div>
              )}
            </div>

            {/* Section 5: Projects (Collapsible) */}
            <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl overflow-hidden shadow-2xs">
              <div
                onClick={() => toggleSection('projects')}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors border-b border-[#E7E7E2] dark:border-white/8"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1F8FA6]/10 text-[#1F8FA6] flex items-center justify-center">
                    <FolderGit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#111312] dark:text-[#F2F6F7]">
                        Featured Projects
                      </h3>
                      <Pill variant="micro-status" color="neutral">
                        <span className="figure">{data.projects.length}</span> Projects
                      </Pill>
                    </div>
                    <p className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB]">
                      Open-source builds, architectures, and applications
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-1 text-[#8C928E] hover:text-[#111312] dark:hover:text-[#F2F6F7]"
                  >
                    {collapsed.projects ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!collapsed.projects && (
                <div className="p-2 sm:p-4">
                  <ProjectsSection
                    projects={data.projects}
                    onAdd={handleAddProject}
                    onUpdate={handleUpdateProject}
                    onDelete={handleDeleteProject}
                  />
                </div>
              )}
            </div>

            {/* Section 6: Certifications (Collapsible) */}
            <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl overflow-hidden shadow-2xs">
              <div
                onClick={() => toggleSection('certifications')}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors border-b border-[#E7E7E2] dark:border-white/8"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1F8FA6]/10 text-[#1F8FA6] flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#111312] dark:text-[#F2F6F7]">
                        Certifications & Licenses
                      </h3>
                      <Pill variant="micro-status" color="neutral">
                        <span className="figure">{data.certifications.length}</span> Verified
                      </Pill>
                    </div>
                    <p className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB]">
                      Industry accredited certifications
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-1 text-[#8C928E] hover:text-[#111312] dark:hover:text-[#F2F6F7]"
                  >
                    {collapsed.certifications ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!collapsed.certifications && (
                <div className="p-2 sm:p-4">
                  <CertificationsSection
                    certifications={data.certifications}
                    onAdd={handleAddCertification}
                    onUpdate={handleUpdateCertification}
                    onDelete={handleDeleteCertification}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Resume & Contact Coordinates */}
          <div className="space-y-6">
            {/* Resume Quick Widget */}
            <ResumeStatusCard
              resume={data.resume}
              onNavigateToResumePage={() => onNavigate?.('resume')}
              onPreview={() => setIsPreviewModalOpen(true)}
              onDownload={handleDownloadResume}
            />

            {/* Contact Coordinates */}
            <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-5 shadow-2xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#111312] dark:text-[#F2F6F7]">
                  Contact Coordinates
                </h3>
                <p className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB]">
                  Direct candidate contact details
                </p>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.015] dark:bg-white/[0.02] border border-[#E7E7E2] dark:border-white/8">
                  <Mail className="w-4 h-4 text-[#1F8FA6] shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[#8C928E] block text-[10px] uppercase font-semibold">
                      Email Address
                    </span>
                    <span className="font-medium text-[#111312] dark:text-[#F2F6F7] truncate block">
                      {data.profile.email || user?.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.015] dark:bg-white/[0.02] border border-[#E7E7E2] dark:border-white/8">
                  <Phone className="w-4 h-4 text-[#1F8FA6] shrink-0" />
                  <div>
                    <span className="text-[#8C928E] block text-[10px] uppercase font-semibold">
                      Phone Number
                    </span>
                    <span className="font-medium text-[#111312] dark:text-[#F2F6F7]">
                      {data.profile.phone || 'Not provided'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.015] dark:bg-white/[0.02] border border-[#E7E7E2] dark:border-white/8">
                  <MapPin className="w-4 h-4 text-[#1F8FA6] shrink-0" />
                  <div>
                    <span className="text-[#8C928E] block text-[10px] uppercase font-semibold">
                      Location
                    </span>
                    <span className="font-medium text-[#111312] dark:text-[#F2F6F7]">
                      {data.profile.location || 'Not provided'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: GitHub & Evidence Verification (Screen 6 Requirement) */}
      {activeTab === 'github' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#111312] dark:bg-white/10 text-white flex items-center justify-center">
                  <GithubIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
                    GitHub Connect & Evidence Verification
                  </h3>
                  <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
                    Verify claimed skills through public repository commits, stars, original code ratio, and language footprints.
                  </p>
                </div>
              </div>
              <Pill variant="micro-status" color="teal">Read-Only</Pill>
            </div>

            <div className="flex gap-2.5 max-w-xl">
              <input
                type="text"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                placeholder="Enter your GitHub username (e.g. torvalds)"
                className="flex-1 text-xs rounded-xl border border-[#E7E7E2] dark:border-white/10 bg-white dark:bg-[#151D20] text-[#111312] dark:text-[#F2F6F7] p-2.5 outline-none focus:border-[#1F8FA6]"
              />
              <Button
                variant="primary"
                size="md"
                onClick={handleVerifyGitHub}
                isLoading={isVerifyingGithub}
                leftIcon={<ShieldCheck className="w-4 h-4" />}
              >
                Verify GitHub Evidence
              </Button>
            </div>

            {githubResult && (
              <div className="space-y-5 pt-4 border-t border-[#E7E7E2] dark:border-white/8">
                {/* Verification Metrics Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-[#E7E7E2] dark:border-white/8 text-center">
                    <div className="text-[10px] text-[#8C928E] uppercase font-bold">Total Stars</div>
                    <div className="text-base font-bold text-[#111312] dark:text-[#F2F6F7] figure mt-0.5">⭐ {githubResult.totalStars}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-[#E7E7E2] dark:border-white/8 text-center">
                    <div className="text-[10px] text-[#8C928E] uppercase font-bold">Analyzed Repos</div>
                    <div className="text-base font-bold text-[#111312] dark:text-[#F2F6F7] figure mt-0.5">{githubResult.analyzedReposCount}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-[#E7E7E2] dark:border-white/8 text-center">
                    <div className="text-[10px] text-[#8C928E] uppercase font-bold">Original Code Ratio</div>
                    <div className="text-base font-bold text-emerald-600 figure mt-0.5">{Math.round(githubResult.originalReposRatio * 100)}%</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-[#E7E7E2] dark:border-white/8 text-center">
                    <div className="text-[10px] text-[#8C928E] uppercase font-bold">Verified Skills</div>
                    <div className="text-base font-bold text-[#1F8FA6] figure mt-0.5">
                      {githubResult.verifiedSkills.filter((s: any) => s.isVerified).length}
                    </div>
                  </div>
                </div>

                {/* Authenticity Notes */}
                {githubResult.authenticityNotes?.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-black/[0.015] dark:bg-white/[0.02] border border-[#E7E7E2] dark:border-white/8 text-xs space-y-1.5">
                    <span className="text-[10px] font-bold text-[#8C928E] uppercase tracking-wider block">
                      Authenticity Observations (Neutral Analysis)
                    </span>
                    {githubResult.authenticityNotes.map((note: string, idx: number) => (
                      <div key={idx} className="text-[#5E6460] dark:text-[#9AA7AB] flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Verified Skills Grid */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-[#111312] dark:text-[#F2F6F7] uppercase tracking-wider">
                    Claimed vs Evidenced Skills
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {githubResult.verifiedSkills?.map((skill: any) => (
                      <div
                        key={skill.skillName}
                        className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                          skill.isVerified
                            ? 'bg-emerald-50/20 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                            : 'bg-black/[0.02] dark:bg-white/[0.02] border-[#E7E7E2] dark:border-white/8 opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#111312] dark:text-[#F2F6F7]">{skill.skillName}</span>
                          <Pill variant="micro-status" color={skill.isVerified ? 'teal' : 'neutral'}>
                            {skill.badge}
                          </Pill>
                        </div>
                        {skill.evidenceSources?.length > 0 && (
                          <div className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB] space-y-0.5">
                            {skill.evidenceSources.slice(0, 2).map((ev: any, i: number) => (
                              <a
                                key={i}
                                href={ev.repoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#1F8FA6] hover:underline flex items-center gap-1 truncate"
                              >
                                <ExternalLink className="w-3 h-3 shrink-0" />
                                <span className="truncate">{ev.repoName} ({ev.matchedOn})</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Portfolio SSRF Protected Verification */}
          <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1F8FA6]/10 text-[#1F8FA6] flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
                    Portfolio Website Verification
                  </h3>
                  <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
                    SSRF-hardened proxy fetcher with DNS rebinding and private IP protection.
                  </p>
                </div>
              </div>
              <Pill variant="micro-status" color="teal">DNS Guarded</Pill>
            </div>

            <div className="flex gap-2.5 max-w-xl">
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://yourportfolio.dev"
                className="flex-1 text-xs rounded-xl border border-[#E7E7E2] dark:border-white/10 bg-white dark:bg-[#151D20] text-[#111312] dark:text-[#F2F6F7] p-2.5 outline-none focus:border-[#1F8FA6]"
              />
              <Button
                variant="primary"
                size="md"
                onClick={handleVerifyPortfolio}
                isLoading={isVerifyingPortfolio}
                leftIcon={<Globe className="w-4 h-4" />}
              >
                Verify Portfolio
              </Button>
            </div>

            {portfolioResult && (
              <div className="p-3.5 rounded-xl bg-black/[0.015] dark:bg-white/[0.02] border border-[#E7E7E2] dark:border-white/8 text-xs space-y-1">
                <span className="font-semibold text-[#111312] dark:text-[#F2F6F7]">
                  Verified URL: {portfolioResult.portfolioUrl}
                </span>
                <p className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB]">
                  Fetched {Math.round(portfolioResult.contentLengthBytes / 1024)} KB content safely.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Privacy & Consent Controls (Screen 6 Requirement) */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          {/* Data Portability (GDPR Art 20) */}
          <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-6 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
                  Data Portability & Export (GDPR Art. 20 / CCPA / DPDP)
                </h3>
                <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] mt-0.5">
                  Download a complete, machine-readable JSON archive containing all profile data, applications, resumes, verifications, and audit logs.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={handleExportData}
                isLoading={isExportingData}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Download My Archive
              </Button>
            </div>
          </div>

          {/* Privacy Consents Toggles */}
          <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
              Data Retention & Usage Consents
            </h3>
            <div className="space-y-3">
              <label className="flex items-start gap-3.5 p-3.5 rounded-xl border border-[#E7E7E2] dark:border-white/8 cursor-pointer hover:bg-black/[0.015] dark:hover:bg-white/[0.02]">
                <input
                  type="checkbox"
                  checked={consents.talentPoolInclusion}
                  onChange={(e) => handleSaveConsents({ ...consents, talentPoolInclusion: e.target.checked })}
                  className="mt-1 rounded border-slate-300 text-[#1F8FA6] focus:ring-[#1F8FA6]"
                />
                <div>
                  <span className="text-xs font-bold text-[#111312] dark:text-[#F2F6F7] block">
                    Talent Pool Inclusion (Recommended)
                  </span>
                  <span className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
                    Allows verified hiring partners to discover your profile for matching open opportunities.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3.5 p-3.5 rounded-xl border border-[#E7E7E2] dark:border-white/8 cursor-pointer hover:bg-black/[0.015] dark:hover:bg-white/[0.02]">
                <input
                  type="checkbox"
                  checked={consents.trainingDataInclusion}
                  onChange={(e) => handleSaveConsents({ ...consents, trainingDataInclusion: e.target.checked })}
                  className="mt-1 rounded border-slate-300 text-[#1F8FA6] focus:ring-[#1F8FA6]"
                />
                <div>
                  <span className="text-xs font-bold text-[#111312] dark:text-[#F2F6F7] block">
                    Anonymized AI Model Training (Opt-In)
                  </span>
                  <span className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
                    Contribute anonymized skill vectors to train offline matching models. All PII is permanently stripped before training.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Profile Access Audit Logs */}
          <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
                  Recruiter Profile Access Audit Log
                </h3>
                <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
                  DPDP and GDPR transparency log of every recruiter who viewed your profile.
                </p>
              </div>
              <Pill variant="micro-status" color="neutral">
                <span className="figure">{profileAccessLogs.length}</span> Views
              </Pill>
            </div>

            {profileAccessLogs.length === 0 ? (
              <div className="p-4 rounded-xl bg-black/[0.015] dark:bg-white/[0.02] text-center text-xs text-[#5E6460] dark:text-[#9AA7AB]">
                No external recruiters have accessed your profile yet.
              </div>
            ) : (
              <div className="border border-[#E7E7E2] dark:border-white/8 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-black/[0.02] dark:bg-white/[0.02] border-b border-[#E7E7E2] dark:border-white/8 text-[#5E6460] dark:text-[#9AA7AB] font-semibold">
                    <tr>
                      <th className="p-3">Recruiter / Viewer</th>
                      <th className="p-3">Organization</th>
                      <th className="p-3">Purpose</th>
                      <th className="p-3">Accessed At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E7E2] dark:divide-white/8">
                    {profileAccessLogs.map((log: any) => (
                      <tr key={log.id} className="text-[#111312] dark:text-[#F2F6F7]">
                        <td className="p-3 font-semibold">{log.viewerName} ({log.viewerRole})</td>
                        <td className="p-3">{log.organizationName || 'Verified Partner'}</td>
                        <td className="p-3 text-[#5E6460] dark:text-[#9AA7AB]">{log.purpose}</td>
                        <td className="p-3 text-[#5E6460] dark:text-[#9AA7AB] figure">{new Date(log.accessedAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Account Deletion ("Right to be Forgotten") */}
          <div className="bg-rose-50/20 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-6 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-base font-bold">
                Permanent Account & Data Purge ("Right to be Forgotten")
              </h3>
            </div>
            <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed">
              Permanently deletes all candidate records across database and storage files. This action is immediate, cascading, and cannot be undone.
            </p>

            {showDeleteConfirm ? (
              <div className="p-4 rounded-xl bg-rose-100 dark:bg-rose-900/30 border border-rose-300 dark:border-rose-800 space-y-3">
                <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                  Are you absolutely certain? This will delete all applications, test scores, resumes, and credentials forever.
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(false)} disabled={isDeletingAccount}>
                    Cancel
                  </Button>
                  <Button variant="danger" size="sm" onClick={handleDeleteAccount} isLoading={isDeletingAccount} leftIcon={<Trash2 className="w-3.5 h-3.5" />}>
                    Yes, Delete My Account
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)} leftIcon={<Trash2 className="w-3.5 h-3.5" />}>
                Delete My Account
              </Button>
            )}
          </div>
        </div>
      )}

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
