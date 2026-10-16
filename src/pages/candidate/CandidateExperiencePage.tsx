import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ApplyModal } from '../../components/applications/ApplyModal';
import {
  Sparkles,
  Compass,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Globe,
  Sliders,
  TrendingUp,
  Download,
  Trash2,
  Lock,
  Eye,
  BookOpen,
  ArrowRight,
  Briefcase,
  Building2,
  MapPin,
  Clock,
  Layers,
  Award,
} from 'lucide-react';

const GithubIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

interface CandidateExperiencePageProps {
  onNavigate: (path: string, params?: Record<string, any>) => void;
}

export const CandidateExperiencePage: React.FC<CandidateExperiencePageProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'recommendations' | 'roadmap' | 'verification' | 'privacy'>('recommendations');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);

  // Tab 1: Recommendations & Preferences
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<any>({
    preferredLocations: [],
    preferredWorkModes: ['Remote', 'Hybrid', 'On-site'],
    minSalary: undefined,
    maxSalary: undefined,
    targetJobTitles: [],
  });
  const [showPreferencesEditor, setShowPreferencesEditor] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [selectedJobForApply, setSelectedJobForApply] = useState<any>(null);

  // Tab 2: Upskilling Roadmap & Simulator
  const [roadmap, setRoadmap] = useState<any>(null);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false);
  const [simJobId, setSimJobId] = useState<string>('');
  const [simNewSkill, setSimNewSkill] = useState<string>('');
  const [simSkillsList, setSimSkillsList] = useState<string[]>([]);
  const [simExtraYears, setSimExtraYears] = useState<number>(0);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Tab 3: Verifications
  const [githubUsername, setGithubUsername] = useState<string>('');
  const [githubResult, setGithubResult] = useState<any>(null);
  const [isVerifyingGithub, setIsVerifyingGithub] = useState(false);

  const [portfolioUrl, setPortfolioUrl] = useState<string>('');
  const [portfolioResult, setPortfolioResult] = useState<any>(null);
  const [isVerifyingPortfolio, setIsVerifyingPortfolio] = useState(false);

  const [linkedinExportText, setLinkedinExportText] = useState<string>('');
  const [isSavingLinkedin, setIsSavingLinkedin] = useState(false);

  // Tab 4: Privacy & Consent
  const [consents, setConsents] = useState<any>({ talentPoolInclusion: true, trainingDataInclusion: false });
  const [profileAccessLogs, setProfileAccessLogs] = useState<any[]>([]);
  const [isExportingData, setIsExportingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load Initial Data
  const loadDashboard = async () => {
    setIsLoadingDashboard(true);
    try {
      const res = await api.getCandidateDashboard();
      if (res.success && res.data) {
        setDashboardData(res.data);
      }
    } catch (err: any) {
      console.warn('Dashboard fetch notice:', err.message);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const res = await api.getJobRecommendations();
      if (res.success && res.data) {
        setRecommendations(res.data.recommendations || []);
        if (res.data.preferences) {
          setPreferences(res.data.preferences);
        }
      }
    } catch (err: any) {
      console.warn('Recommendations fetch notice:', err.message);
    }
  };

  const loadRoadmap = async () => {
    setIsLoadingRoadmap(true);
    try {
      const res = await api.getUpskillingRoadmap();
      if (res.success && res.data) {
        setRoadmap(res.data);
      }
    } catch (err: any) {
      console.warn('Roadmap fetch notice:', err.message);
    } finally {
      setIsLoadingRoadmap(false);
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
      console.warn('Consents/Logs fetch notice:', err.message);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadRecommendations();
    loadRoadmap();
    loadConsentsAndLogs();
  }, []);

  // Handlers
  const handleSavePreferences = async () => {
    setIsSavingPreferences(true);
    try {
      await api.updateJobPreferences(preferences);
      showToast('success', 'Preferences Saved', 'Job recommendations have been tuned to your stated preferences.');
      setShowPreferencesEditor(false);
      loadRecommendations();
    } catch (err: any) {
      showToast('error', 'Failed to save preferences', err.message);
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleDismissJob = async (jobId: string) => {
    try {
      await api.dismissJobRecommendation(jobId);
      setRecommendations(prev => prev.filter(j => j.jobId !== jobId));
      showToast('info', 'Recommendation Dismissed', 'We will not show this job recommendation again.');
    } catch (err: any) {
      showToast('error', 'Error dismissing job', err.message);
    }
  };

  const handleRunSimulation = async () => {
    if (!simJobId) {
      showToast('warning', 'Target Job Required', 'Please select a target job to simulate.');
      return;
    }
    setIsSimulating(true);
    try {
      const res = await api.runWhatIfSimulation({
        jobId: simJobId,
        hypotheticalSkills: simSkillsList,
        hypotheticalExperienceYears: Number(simExtraYears),
      });
      if (res.success && res.data) {
        setSimulationResult(res.data);
        showToast('success', 'Simulation Complete', `Projected score change: +${res.data.scoreDelta}%`);
      }
    } catch (err: any) {
      showToast('error', 'Simulation Failed', err.message);
    } finally {
      setIsSimulating(false);
    }
  };

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
        loadDashboard();
      }
    } catch (err: any) {
      showToast('error', 'GitHub Verification Failed', err.message);
    } finally {
      setIsVerifyingGithub(false);
    }
  };

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
        loadDashboard();
      }
    } catch (err: any) {
      showToast('error', 'Portfolio Verification Failed', err.message);
    } finally {
      setIsVerifyingPortfolio(false);
    }
  };

  const handleSaveLinkedinExport = async () => {
    if (!linkedinExportText.trim()) return;
    setIsSavingLinkedin(true);
    try {
      await api.verifyLinkedInExport({
        handleOrUrl: user?.email || 'candidate_export',
        exportSummary: linkedinExportText.trim(),
      });
      showToast('success', 'LinkedIn Data Saved', 'Candidate data export imported without web scraping.');
      setLinkedinExportText('');
      loadDashboard();
    } catch (err: any) {
      showToast('error', 'Import Failed', err.message);
    } finally {
      setIsSavingLinkedin(false);
    }
  };

  const handleSaveConsents = async (updated: any) => {
    try {
      const res = await api.updateCandidateConsents(updated);
      if (res.success && res.data) {
        setConsents(res.data);
        showToast('success', 'Consents Updated', 'Your privacy and data retention preferences are active.');
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-surface-dark-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Candidate Career Hub & Evidence Verification
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Explainable job recommendations, counterfactual upskilling roadmaps, GitHub evidence verification, and complete GDPR/CCPA data rights.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportData}
            isLoading={isExportingData}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export My Data
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveTab('privacy')}
            leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
          >
            Privacy & Rights
          </Button>
        </div>
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-surface-dark-card border-slate-200 dark:border-surface-dark-border">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Resume Strength</span>
            <TrendingUp className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {dashboardData?.resumeStrength || 75}%
            </span>
            <Badge variant="success" size="sm">ATS Ready</Badge>
          </div>
          <div className="w-full bg-slate-100 dark:bg-surface-dark-bg h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-brand-600 h-1.5 rounded-full"
              style={{ width: `${dashboardData?.resumeStrength || 75}%` }}
            />
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-surface-dark-card border-slate-200 dark:border-surface-dark-border">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Verified Skills</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {dashboardData?.verifiedSkillsCount || 0}
            </span>
            <span className="text-xs text-slate-400">of {dashboardData?.skillsCount || 0} claimed</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Verified by public GitHub commits
          </p>
        </Card>

        <Card className="p-4 bg-white dark:bg-surface-dark-card border-slate-200 dark:border-surface-dark-border">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Active Applications</span>
            <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {dashboardData?.applications?.length || 0}
            </span>
            <Badge variant="info" size="sm">In Review</Badge>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {dashboardData?.upcomingInterviews?.length || 0} upcoming interviews
          </p>
        </Card>

        <Card className="p-4 bg-white dark:bg-surface-dark-card border-slate-200 dark:border-surface-dark-border">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Profile Access Audit</span>
            <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {profileAccessLogs.length}
            </span>
            <span className="text-xs text-slate-400">recruiter views</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Full DPDP/GDPR visibility
          </p>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-surface-dark-border overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors border-b-2 -mb-px whitespace-nowrap ${
            activeTab === 'recommendations'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Job Recommendations & Why ({recommendations.length})
        </button>

        <button
          onClick={() => setActiveTab('roadmap')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors border-b-2 -mb-px whitespace-nowrap ${
            activeTab === 'roadmap'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Upskilling Roadmap & What-If Simulator
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors border-b-2 -mb-px whitespace-nowrap ${
            activeTab === 'verification'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Evidence & Verification (GitHub / Portfolio)
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors border-b-2 -mb-px whitespace-nowrap ${
            activeTab === 'privacy'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4" />
          Data Rights & Privacy (GDPR / DPDP)
        </button>
      </div>

      {/* Tab 1: Explainable Recommendations */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Explainable Job Recommendations
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Transparent ranking computed with zero protected attributes (no gender, age, nationality, photo).
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowPreferencesEditor(!showPreferencesEditor)}
              leftIcon={<Sliders className="w-3.5 h-3.5" />}
            >
              {showPreferencesEditor ? 'Hide Preferences' : 'Tune Preferences'}
            </Button>
          </div>

          {/* Preferences Card */}
          {showPreferencesEditor && (
            <Card className="p-4 bg-slate-50 dark:bg-surface-dark-card border-brand-200 dark:border-brand-900/60 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Stated Job Search Preferences
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Work Modes
                  </label>
                  <div className="flex items-center gap-3">
                    {['Remote', 'Hybrid', 'On-site'].map((mode: any) => (
                      <label key={mode} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={preferences.preferredWorkModes?.includes(mode)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPreferences({ ...preferences, preferredWorkModes: [...preferences.preferredWorkModes, mode] });
                            } else {
                              setPreferences({ ...preferences, preferredWorkModes: preferences.preferredWorkModes.filter((m: string) => m !== mode) });
                            }
                          }}
                          className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                        {mode}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Minimum Annual Salary ($)
                  </label>
                  <input
                    type="number"
                    value={preferences.minSalary || ''}
                    onChange={(e) => setPreferences({ ...preferences, minSalary: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="e.g. 90000"
                    className="w-full text-xs rounded-lg border-slate-300 dark:border-surface-dark-border dark:bg-surface-dark-bg p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={() => setShowPreferencesEditor(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSavePreferences} isLoading={isSavingPreferences}>
                  Save Preferences
                </Button>
              </div>
            </Card>
          )}

          {/* Recommendations List */}
          {recommendations.length === 0 ? (
            <Card className="p-8 text-center bg-white dark:bg-surface-dark-card border-slate-200 dark:border-surface-dark-border space-y-2">
              <Sparkles className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                No active job recommendations matching your profile
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Upload or update your skills in the Resume Manager, or expand your location and salary preferences to see new opportunities.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <Card
                  key={rec.jobId}
                  className="p-5 bg-white dark:bg-surface-dark-card border-slate-200 dark:border-surface-dark-border hover:border-brand-300 dark:hover:border-brand-700 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {rec.jobTitle}
                        </h3>
                        <Badge variant="primary" size="sm">
                          {rec.recommendationScore}% Match
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {rec.companyName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {rec.location} ({rec.workMode})
                        </span>
                        {rec.salaryRange && (
                          <>
                            <span>•</span>
                            <span>{rec.salaryRange}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDismissJob(rec.jobId)}
                      >
                        Not Interested
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedJobForApply({ id: rec.jobId, title: rec.jobTitle, company_name: rec.companyName, location: rec.location })}
                        leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                      >
                        Preview & Apply
                      </Button>
                    </div>
                  </div>

                  {/* Why this job section */}
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200/60 dark:border-surface-dark-border/60 text-xs space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Why this recommendation
                    </span>
                    <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                      {rec.reasonsWhy?.map((reason: string, i: number) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Matched vs Missing Skills Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                    <span className="font-semibold text-slate-500 text-[11px] mr-1">Skills:</span>
                    {rec.matchedSkills?.map((skill: string) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      >
                        ✓ {skill}
                      </span>
                    ))}
                    {rec.missingSkills?.map((skill: string) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                      >
                        + {skill}
                      </span>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Upskilling Roadmap & What-If Simulator */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6">
          {/* Upskilling Roadmap Summary */}
          {roadmap && (
            <Card className="p-5 bg-gradient-to-r from-brand-50 to-indigo-50/40 dark:from-surface-dark-card dark:to-surface-dark-card border-brand-200 dark:border-surface-dark-border space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Counterfactual Upskilling Roadmap
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Aggregated across {roadmap.totalTargetJobsAnalyzed} published target jobs. Missing skills ranked by real match score gain ($+\Delta S$).
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Current Match</div>
                    <div className="text-base font-bold text-slate-900 dark:text-white">{roadmap.currentAverageScore}%</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-brand-600" />
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-emerald-600">Projected Match</div>
                    <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">{roadmap.projectedAverageScore}%</div>
                  </div>
                </div>
              </div>

              {/* Steps List */}
              <div className="space-y-3 pt-3">
                {roadmap.steps?.map((step: any) => (
                  <div
                    key={step.step}
                    className="p-4 rounded-xl bg-white dark:bg-surface-dark-bg border border-slate-200 dark:border-surface-dark-border space-y-2.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-xs">
                          {step.step}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Learn {step.skillName}
                        </h4>
                        <Badge variant="success" size="sm">
                          +{step.impactScoreDelta}% Match Impact
                        </Badge>
                      </div>
                      <span className="text-xs text-slate-500">
                        Est. {step.estimatedHours} hrs • {step.difficulty}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Unlocks higher alignment across {step.jobsImpactedCount} target position(s): {step.targetJobTitles?.slice(0, 3).join(', ')}.
                    </p>

                    {/* Curated Authentic Resources (Truthfulness Guarantee) */}
                    <div className="pt-2 border-t border-slate-100 dark:border-surface-dark-border space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Curated Learning Resources (No Hallucinated Links)
                      </span>
                      {step.curatedResources?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {step.curatedResources.map((res: any) => (
                            <a
                              key={res.id}
                              href={res.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2.5 rounded-lg border border-slate-200 dark:border-surface-dark-border bg-slate-50/50 dark:bg-surface-dark-card hover:border-brand-400 flex items-center justify-between text-xs group"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="font-semibold text-brand-600 dark:text-brand-400 truncate group-hover:underline flex items-center gap-1">
                                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                                  <span>{res.title}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {res.provider} • {res.resourceType}
                                </div>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-surface-dark-card border border-dashed border-slate-300 dark:border-surface-dark-border text-xs text-slate-500 flex items-center gap-2">
                          <Compass className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{step.searchSuggestion}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Interactive What-If Simulator */}
          <Card className="p-5 bg-white dark:bg-surface-dark-card border-slate-200 dark:border-surface-dark-border space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Interactive What-If Scenario Simulator
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Test how adding specific evidenced skills or experience years alters your Phase 6 match score for any target job.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Target Job
                </label>
                <select
                  value={simJobId}
                  onChange={(e) => setSimJobId(e.target.value)}
                  className="w-full text-xs rounded-lg border-slate-300 dark:border-surface-dark-border dark:bg-surface-dark-bg p-2"
                >
                  <option value="">Select a job...</option>
                  {recommendations.map(r => (
                    <option key={r.jobId} value={r.jobId}>
                      {r.jobTitle} ({r.companyName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Add Hypothetical Skill
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={simNewSkill}
                    onChange={(e) => setSimNewSkill(e.target.value)}
                    placeholder="e.g. Docker, GraphQL"
                    className="flex-1 text-xs rounded-lg border-slate-300 dark:border-surface-dark-border dark:bg-surface-dark-bg p-2"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (simNewSkill.trim() && !simSkillsList.includes(simNewSkill.trim())) {
                        setSimSkillsList([...simSkillsList, simNewSkill.trim()]);
                        setSimNewSkill('');
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Extra Experience (Years)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={simExtraYears}
                  onChange={(e) => setSimExtraYears(Number(e.target.value))}
                  className="w-full text-xs rounded-lg border-slate-300 dark:border-surface-dark-border dark:bg-surface-dark-bg p-2"
                />
              </div>
            </div>

            {simSkillsList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] font-semibold text-slate-400">Hypothetical skills:</span>
                {simSkillsList.map(s => (
                  <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-brand-50 text-brand-700 border border-brand-200 flex items-center gap-1">
                    {s}
                    <button
                      onClick={() => setSimSkillsList(simSkillsList.filter(item => item !== s))}
                      className="hover:text-rose-600 font-bold ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleRunSimulation}
                isLoading={isSimulating}
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Run What-If Simulation
              </Button>
            </div>

            {/* Simulation Results Display */}
            {simulationResult && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-dark-bg border border-slate-200 dark:border-surface-dark-border space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Simulation Output: {simulationResult.jobTitle}
                  </h4>
                  <Badge variant="success" size="md">
                    +{simulationResult.scoreDelta}% Score Increase
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-white dark:bg-surface-dark-card border border-slate-200 text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Baseline Score</div>
                    <div className="text-lg font-bold text-slate-800 dark:text-slate-200">{simulationResult.baseScore}%</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white dark:bg-surface-dark-card border border-emerald-200 text-center">
                    <div className="text-[10px] text-emerald-600 uppercase font-bold">Simulated Score</div>
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{simulationResult.simulatedScore}%</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white dark:bg-surface-dark-card border border-slate-200 text-center col-span-2 sm:col-span-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Score Delta</div>
                    <div className="text-lg font-bold text-brand-600">+{simulationResult.scoreDelta} pts</div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab 3: Evidence & Verification */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          {/* GitHub Verification Card */}
          <Card className="p-5 bg-white dark:bg-surface-dark-card border-slate-200 dark:border-surface-dark-border space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GithubIcon className="w-5 h-5 text-slate-900 dark:text-white" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  GitHub Repository Evidence Verification
                </h3>
              </div>
              <Badge variant="info" size="sm">Read-Only Public Data</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Connect your public GitHub username to match claimed skills against real commits, languages, and stars. Unverifiable claims are presented neutrally without penalty.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                placeholder="Enter GitHub username (e.g. torvalds)"
                className="flex-1 text-xs rounded-lg border-slate-300 dark:border-surface-dark-border dark:bg-surface-dark-bg p-2.5"
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

            {/* GitHub Verification Results */}
            {githubResult && (
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-surface-dark-border">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-surface-dark-bg text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Total Stars</div>
                    <div className="text-base font-bold text-slate-900 dark:text-white">⭐ {githubResult.totalStars}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-surface-dark-bg text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Analyzed Repos</div>
                    <div className="text-base font-bold text-slate-900 dark:text-white">{githubResult.analyzedReposCount}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-surface-dark-bg text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Original Code Ratio</div>
                    <div className="text-base font-bold text-emerald-600">{Math.round(githubResult.originalReposRatio * 100)}%</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-surface-dark-bg text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Verified Skills</div>
                    <div className="text-base font-bold text-brand-600">
                      {githubResult.verifiedSkills.filter((s: any) => s.isVerified).length}
                    </div>
                  </div>
                </div>

                {/* Neutral Authenticity Notes */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-surface-dark-bg border border-slate-200 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Authenticity Observations (Neutral Analysis)
                  </span>
                  {githubResult.authenticityNotes?.map((note: string, idx: number) => (
                    <div key={idx} className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>

                {/* Skill Verification Badges */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Claimed Skills Verification Evidence
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {githubResult.verifiedSkills?.map((skill: any) => (
                      <div
                        key={skill.skillName}
                        className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                          skill.isVerified
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-50 dark:bg-surface-dark-bg border-slate-200 dark:border-surface-dark-border opacity-70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">{skill.skillName}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              skill.isVerified
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {skill.badge}
                          </span>
                        </div>
                        {skill.evidenceSources?.length > 0 && (
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                            {skill.evidenceSources.slice(0, 2).map((ev: any, i: number) => (
                              <a
                                key={i}
                                href={ev.repoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-brand-600 hover:underline flex items-center gap-1 truncate"
                              >
                                <ExternalLink className="w-3 h-3 shrink-0" />
                                <span>{ev.repoName} ({ev.matchedOn})</span>
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
          </Card>

          {/* Portfolio SSRF-Hardened Verification */}
          <Card className="p-5 bg-white dark:bg-surface-dark-card border-slate-200 dark:border-surface-dark-border space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-brand-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Portfolio Website Verification (SSRF Protected)
                </h3>
              </div>
              <Badge variant="success" size="sm">DNS Rebinding Guarded</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Fetched through Resumio's SSRF-hardened fetcher. Private IP ranges, AWS metadata endpoints, and DNS rebinding attacks are strictly blocked.
            </p>

            <div className="flex gap-2">
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://yourdomain.com"
                className="flex-1 text-xs rounded-lg border-slate-300 dark:border-surface-dark-border dark:bg-surface-dark-bg p-2.5"
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
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-surface-dark-bg border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold">
                  <span>Verified URL: {portfolioResult.portfolioUrl}</span>
                  <span>{Math.round(portfolioResult.contentLengthBytes / 1024)} KB fetched</span>
                </div>
                <div className="p-2.5 rounded bg-white dark:bg-surface-dark-card border border-slate-200 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed max-h-32 overflow-y-auto">
                  {portfolioResult.textSnippet || 'Portfolio site verified successfully.'}
                </div>
              </div>
            )}
          </Card>

          {/* LinkedIn Manual Data Import */}
          <Card className="p-5 bg-white dark:bg-surface-dark-card border-slate-200 dark:border-surface-dark-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                LinkedIn Profile Data (Manual Candidate Export)
              </h3>
              <Badge variant="neutral" size="sm">Zero Web Scraping</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Resumio adheres to LinkedIn platform rules and never performs unauthorized web scraping. Paste or import your candidate data export summary below.
            </p>
            <textarea
              rows={3}
              value={linkedinExportText}
              onChange={(e) => setLinkedinExportText(e.target.value)}
              placeholder="Paste exported LinkedIn bio or public resume headline..."
              className="w-full text-xs rounded-lg border-slate-300 dark:border-surface-dark-border dark:bg-surface-dark-bg p-2.5"
            />
            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSaveLinkedinExport}
                isLoading={isSavingLinkedin}
              >
                Import LinkedIn Bio
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 4: Privacy, Consent & GDPR / DPDP Data Rights */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          {/* Data Portability (GDPR Art 20) */}
          <Card className="p-5 bg-white dark:bg-surface-dark-card border-slate-200 dark:border-surface-dark-border space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Data Portability & Export (GDPR Art. 20 / CCPA / DPDP)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Download a complete, machine-readable JSON package containing all profile data, applications, resumes, verifications, and audit logs.
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
          </Card>

          {/* Privacy Consents Toggles */}
          <Card className="p-5 bg-white dark:bg-surface-dark-card border-slate-200 dark:border-surface-dark-border space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Data Retention & Usage Consents
            </h3>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-surface-dark-border cursor-pointer hover:bg-slate-50 dark:hover:bg-surface-dark-bg">
                <input
                  type="checkbox"
                  checked={consents.talentPoolInclusion}
                  onChange={(e) => handleSaveConsents({ ...consents, talentPoolInclusion: e.target.checked })}
                  className="mt-1 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Talent Pool Inclusion (Recommended)
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Allows verified hiring partners to discover your profile for matching open opportunities.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-surface-dark-border cursor-pointer hover:bg-slate-50 dark:hover:bg-surface-dark-bg">
                <input
                  type="checkbox"
                  checked={consents.trainingDataInclusion}
                  onChange={(e) => handleSaveConsents({ ...consents, trainingDataInclusion: e.target.checked })}
                  className="mt-1 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Anonymized AI Model Training (Opt-In)
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Contribute anonymized, de-identified skill embeddings to improve matching models. All PII is permanently stripped before training.
                  </span>
                </div>
              </label>
            </div>
          </Card>

          {/* Profile Access Audit Logs */}
          <Card className="p-5 bg-white dark:bg-surface-dark-card border-slate-200 dark:border-surface-dark-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Recruiter Profile Access Audit Log
              </h3>
              <Badge variant="neutral" size="sm">{profileAccessLogs.length} Total Views</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              In accordance with DPDP and GDPR transparency principles, you can see every recruiter and hiring organization who reviewed your profile.
            </p>

            {profileAccessLogs.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-surface-dark-bg text-center text-xs text-slate-500">
                No external recruiters have accessed your profile yet.
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-surface-dark-border rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-surface-dark-bg border-b border-slate-200 dark:border-surface-dark-border text-slate-500 font-semibold">
                    <tr>
                      <th className="p-2.5">Recruiter / Viewer</th>
                      <th className="p-2.5">Organization</th>
                      <th className="p-2.5">Purpose</th>
                      <th className="p-2.5">Accessed At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-surface-dark-border">
                    {profileAccessLogs.map((log: any) => (
                      <tr key={log.id} className="text-slate-700 dark:text-slate-300">
                        <td className="p-2.5 font-semibold">{log.viewerName} ({log.viewerRole})</td>
                        <td className="p-2.5">{log.organizationName || 'Verified Partner'}</td>
                        <td className="p-2.5">{log.purpose}</td>
                        <td className="p-2.5 text-slate-400">{new Date(log.accessedAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Account Deletion (Right to be Forgotten) */}
          <Card className="p-5 bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 space-y-3">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-sm font-bold">
                Permanent Account & Data Deletion ("Right to be Forgotten")
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Permanently purges all candidate data across SQLite, MongoDB, and disk files (resumes, avatars, applications, builder drafts, and verifications). This action is immediate, cascading, and irreversible.
            </p>

            {showDeleteConfirm ? (
              <div className="p-3.5 rounded-lg bg-rose-100 dark:bg-rose-900/40 border border-rose-300 dark:border-rose-800 space-y-3">
                <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                  Are you absolutely certain? This will delete all your applications, test scores, resumes, and account credentials forever.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeletingAccount}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDeleteAccount}
                    isLoading={isDeletingAccount}
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Yes, Purge My Account Forever
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete My Account
              </Button>
            )}
          </Card>
        </div>
      )}

      {/* Pre-Apply Modal */}
      {selectedJobForApply && (
        <ApplyModal
          isOpen={Boolean(selectedJobForApply)}
          onClose={() => setSelectedJobForApply(null)}
          job={selectedJobForApply}
          onSuccess={() => {
            setSelectedJobForApply(null);
            loadDashboard();
          }}
          onNavigateToResumeManager={() => onNavigate('resume')}
        />
      )}
    </div>
  );
};
