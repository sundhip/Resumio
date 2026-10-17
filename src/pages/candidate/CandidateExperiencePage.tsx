import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Pill } from '../../components/kit/Pill';
import { StatTile } from '../../components/kit/StatTile';
import { HatchedProgress } from '../../components/kit/HatchedProgress';
import { Switch } from '../../components/kit/Switch';
import { ApplyModal } from '../../components/applications/ApplyModal';
import {
  Sparkles,
  Compass,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Globe,
  Sliders,
  TrendingUp,
  Download,
  Trash2,
  Lock,
  BookOpen,
  Briefcase,
  Building2,
  Check,
  Play,
} from 'lucide-react';

const GithubIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

export type SkillProgressStatus = 'not_started' | 'in_progress' | 'mastered';

interface CandidateExperiencePageProps {
  onNavigate: (path: string, params?: Record<string, any>) => void;
}

export const CandidateExperiencePage: React.FC<CandidateExperiencePageProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  // Active Tab defaults to 'roadmap' (Skill Gap and Roadmap)
  const [activeTab, setActiveTab] = useState<'roadmap' | 'simulator' | 'recommendations' | 'verification' | 'privacy'>('roadmap');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);

  // Skill Gap Progress Tracker state (persisted locally)
  const [skillProgress, setSkillProgress] = useState<Record<string, SkillProgressStatus>>(() => {
    try {
      const saved = localStorage.getItem('resumio_skill_progress');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // What-If Toggle switch inside roadmap
  const [showWhatIfInRoadmap, setShowWhatIfInRoadmap] = useState(true);

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
        if (res.data.steps && res.data.steps.length > 0 && !simJobId && recommendations.length > 0) {
          setSimJobId(recommendations[0].jobId);
        }
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

  // Update Skill Progress Tracker
  const updateSkillStatus = (skillName: string, status: SkillProgressStatus) => {
    const updated = { ...skillProgress, [skillName]: status };
    setSkillProgress(updated);
    try {
      localStorage.setItem('resumio_skill_progress', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save skill progress', err);
    }
    showToast(
      'info',
      'Progress Updated',
      `${skillName} marked as ${status === 'mastered' ? 'Mastered' : status === 'in_progress' ? 'In Progress' : 'Not Started'}.`
    );
  };

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
        showToast('success', 'Simulation Complete', `Projected score change: +${res.data.scoreDelta} pts`);
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

  // Compute skill gap stats
  const totalSteps = roadmap?.steps?.length || 0;
  const masteredCount = roadmap?.steps?.filter((s: any) => skillProgress[s.skillName] === 'mastered').length || 0;
  const inProgressCount = roadmap?.steps?.filter((s: any) => skillProgress[s.skillName] === 'in_progress').length || 0;
  const progressPercent = totalSteps > 0 ? Math.round((masteredCount / totalSteps) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E7E7E2] dark:border-white/8 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1F8FA6] to-[#0D6A7D] text-white flex items-center justify-center font-bold shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#111312] dark:text-[#F2F6F7] tracking-tight">
                  Skill Gap & Career Roadmap
                </h1>
                <Pill variant="micro-status" color="teal">AI Guided</Pill>
              </div>
              <p className="mt-0.5 text-xs text-[#5E6460] dark:text-[#9AA7AB] font-medium">
                Counterfactual upskilling roadmap, ranked score-lift gaps, verified curated resources, and interactive what-if simulator.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('jobs')}
            leftIcon={<Briefcase className="w-3.5 h-3.5" />}
          >
            Explore Jobs
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveTab('simulator')}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            What-If Simulator
          </Button>
        </div>
      </div>

      {/* FinGlow / Vestmark StatTiles Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Target Jobs Analyzed"
          value={<span className="figure">{roadmap?.totalTargetJobsAnalyzed || recommendations.length || 0}</span>}
          accentColor="#1F8FA6"
          hint="Requisitions across active employers"
        />
        <StatTile
          label="Current Average Match"
          value={<span className="figure">{roadmap?.currentAverageScore || 72}%</span>}
          accentColor="#F59E0B"
          hint="Baseline competency alignment"
        />
        <StatTile
          label="Projected Average Match"
          value={<span className="figure">{roadmap?.projectedAverageScore || 88}%</span>}
          accentColor="#10B981"
          hint="Target with roadmap completion"
        />
        <StatTile
          label="Net Projected Lift"
          value={
            <span className="figure text-[#1F8FA6]">
              +{(roadmap?.projectedAverageScore || 88) - (roadmap?.currentAverageScore || 72)} pts
            </span>
          }
          accentColor="#1F8FA6"
          hint="Cumulative ATS match score boost"
        />
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 border-b border-[#E7E7E2] dark:border-white/8 overflow-x-auto pb-px scrollbar-none">
        <button
          onClick={() => setActiveTab('roadmap')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
            activeTab === 'roadmap'
              ? 'border-[#1F8FA6] text-[#1F8FA6] dark:text-[#5FD3E8] bg-[#1F8FA6]/10'
              : 'border-transparent text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:hover:text-[#F2F6F7]'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Skill Gap Roadmap ({totalSteps})</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
            activeTab === 'simulator'
              ? 'border-[#1F8FA6] text-[#1F8FA6] dark:text-[#5FD3E8] bg-[#1F8FA6]/10'
              : 'border-transparent text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:hover:text-[#F2F6F7]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>What-If Scenario Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab('recommendations')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
            activeTab === 'recommendations'
              ? 'border-[#1F8FA6] text-[#1F8FA6] dark:text-[#5FD3E8] bg-[#1F8FA6]/10'
              : 'border-transparent text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:hover:text-[#F2F6F7]'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Target Jobs & Fit ({recommendations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
            activeTab === 'verification'
              ? 'border-[#1F8FA6] text-[#1F8FA6] dark:text-[#5FD3E8] bg-[#1F8FA6]/10'
              : 'border-transparent text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:hover:text-[#F2F6F7]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Evidence Verification</span>
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
          <span>Privacy & Consents</span>
        </button>
      </div>

      {/* Tab 1: Skill Gap Roadmap (Screen 5 Core) */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6">
          {/* Progress Tracker Strip */}
          <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#111312] dark:text-[#F2F6F7]">
                    Roadmap Mastery Tracker
                  </h3>
                  <Pill variant="micro-status" color="teal">
                    <span className="figure">{masteredCount}/{totalSteps}</span> Complete
                  </Pill>
                </div>
                <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] mt-0.5 font-medium">
                  Mark skills as In Progress or Mastered as you work through verified learning modules.
                </p>
              </div>

              {/* What-If Simulator Quick Toggle */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-[#5E6460] dark:text-[#9AA7AB]">
                  Include What-If Simulator:
                </span>
                <Switch
                  checked={showWhatIfInRoadmap}
                  onChange={setShowWhatIfInRoadmap}
                  aria-label="Toggle What-If Simulator preview in roadmap"
                />
              </div>
            </div>

            {/* HatchedProgress */}
            <div className="pt-1">
              <HatchedProgress
                value={progressPercent}
                height="h-3"
                color="teal"
                striped={true}
                animated={inProgressCount > 0}
              />
              <div className="flex justify-between items-center text-[11px] text-[#5E6460] dark:text-[#9AA7AB] mt-1.5 font-medium">
                <span>{masteredCount} Mastered • {inProgressCount} In Progress</span>
                <span className="figure font-bold text-[#1F8FA6]">{progressPercent}% Gap Closed</span>
              </div>
            </div>
          </div>

          {/* Ranked List of Skills to Learn */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7] tracking-tight">
                  Ranked Priority Skill Gaps
                </h3>
                <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] mt-0.5">
                  Ordered by quantifiable match score gain ($+\Delta S$). Links verified against official ontologies.
                </p>
              </div>
            </div>

            {isLoadingRoadmap ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map(n => (
                  <div key={n} className="h-44 rounded-2xl bg-black/5 dark:bg-white/5 border border-[#E7E7E2] dark:border-white/8" />
                ))}
              </div>
            ) : (!roadmap || !roadmap.steps || roadmap.steps.length === 0) ? (
              <Card padding="lg" className="text-center py-12 space-y-3 border border-[#E7E7E2] dark:border-white/8 rounded-2xl bg-white dark:bg-[#0D1214]">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-[#111312] dark:text-[#F2F6F7]">
                  No Critical Skill Gaps Detected
                </h4>
                <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] max-w-md mx-auto">
                  Your profile matches 90%+ across active requisitions. Explore open jobs to apply directly.
                </p>
                <Button variant="primary" size="sm" onClick={() => onNavigate('jobs')}>
                  Browse Open Jobs
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {roadmap.steps.map((step: any, idx: number) => {
                  const currentStatus = skillProgress[step.skillName] || 'not_started';

                  return (
                    <div
                      key={step.step || idx}
                      className={`bg-white dark:bg-[#0D1214] border rounded-2xl p-5 shadow-2xs transition-all duration-200 space-y-4 ${
                        currentStatus === 'mastered'
                          ? 'border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/10 dark:bg-emerald-950/10'
                          : currentStatus === 'in_progress'
                          ? 'border-[#1F8FA6]/40 dark:border-[#1F8FA6]/30'
                          : 'border-[#E7E7E2] dark:border-white/8 hover:border-[#1F8FA6]/30'
                      }`}
                    >
                      {/* Top Row: Rank Badge, Title, Points Impact, Status Buttons */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#1F8FA6]/10 text-[#1F8FA6] flex items-center justify-center font-extrabold text-xs figure shrink-0">
                            #{step.step || idx + 1}
                          </div>

                          <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h4 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
                                Learn {step.skillName}
                              </h4>
                              <Pill variant="micro-status" color="teal">
                                <span className="figure font-bold">+{step.impactScoreDelta}%</span> Match Lift
                              </Pill>
                            </div>
                            <span className="text-xs text-[#5E6460] dark:text-[#9AA7AB] font-medium">
                              Est. {step.estimatedHours || 12} hrs • {step.difficulty || 'Intermediate'}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Progress Selector Buttons */}
                        <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-[#E7E7E2] dark:border-white/8 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => updateSkillStatus(step.skillName, 'not_started')}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                              currentStatus === 'not_started'
                                ? 'bg-white dark:bg-[#151D20] text-[#111312] dark:text-[#F2F6F7] shadow-2xs font-semibold'
                                : 'text-[#8C928E] hover:text-[#111312] dark:hover:text-[#F2F6F7]'
                            }`}
                          >
                            Not Started
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSkillStatus(step.skillName, 'in_progress')}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                              currentStatus === 'in_progress'
                                ? 'bg-[#1F8FA6] text-white shadow-2xs font-semibold'
                                : 'text-[#8C928E] hover:text-[#111312] dark:hover:text-[#F2F6F7]'
                            }`}
                          >
                            <Play className="w-3 h-3" />
                            <span>In Progress</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSkillStatus(step.skillName, 'mastered')}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                              currentStatus === 'mastered'
                                ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                                : 'text-[#8C928E] hover:text-[#111312] dark:hover:text-[#F2F6F7]'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span>Mastered</span>
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed">
                        Unlocks higher alignment across <span className="font-semibold text-[#111312] dark:text-[#F2F6F7]">{step.jobsImpactedCount || 2} target position(s)</span>
                        {step.targetJobTitles?.length > 0 && `: ${step.targetJobTitles.slice(0, 3).join(', ')}`}.
                      </p>

                      {/* Curated Authentic Resources (Rule 2: Zero Hallucinated Links) */}
                      <div className="pt-3 border-t border-[#E7E7E2] dark:border-white/8 space-y-2">
                        <span className="text-[10px] font-bold text-[#8C928E] dark:text-[#5F6C70] uppercase tracking-wider block">
                          Verified Curated Learning Resources
                        </span>
                        {step.curatedResources?.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {step.curatedResources.map((res: any) => (
                              <a
                                key={res.id || res.url}
                                href={res.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-3 rounded-xl border border-[#E7E7E2] dark:border-white/8 bg-black/[0.015] dark:bg-white/[0.02] hover:border-[#1F8FA6]/50 hover:bg-[#1F8FA6]/5 transition-all flex items-center justify-between text-xs group cursor-pointer"
                              >
                                <div className="min-w-0 pr-2 space-y-0.5">
                                  <div className="font-semibold text-[#1F8FA6] dark:text-[#5FD3E8] truncate group-hover:underline flex items-center gap-1.5">
                                    <BookOpen className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">{res.title}</span>
                                  </div>
                                  <div className="text-[11px] text-[#8C928E] dark:text-[#5F6C70] truncate">
                                    {res.provider || 'Official Documentation'} • {res.resourceType || 'Reference'}
                                  </div>
                                </div>
                                <ExternalLink className="w-3.5 h-3.5 text-[#8C928E] group-hover:text-[#1F8FA6] shrink-0" />
                              </a>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-black/[0.015] dark:bg-white/[0.02] border border-dashed border-[#E7E7E2] dark:border-white/10 text-xs text-[#5E6460] dark:text-[#9AA7AB] flex items-center gap-2">
                            <Compass className="w-4 h-4 text-[#8C928E] shrink-0" />
                            <span>{step.searchSuggestion || `Search official documentation for ${step.skillName}`}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Optional In-Roadmap What-If Simulator Card */}
          {showWhatIfInRoadmap && (
            <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1F8FA6]/10 text-[#1F8FA6] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#111312] dark:text-[#F2F6F7]">
                    Interactive What-If Scenario Sandbox
                  </h3>
                  <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
                    Simulate how mastering skills alters your match score against any published job opening.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-[#111312] dark:text-[#F2F6F7] block mb-1.5">
                    Target Opportunity
                  </label>
                  <select
                    value={simJobId}
                    onChange={(e) => setSimJobId(e.target.value)}
                    aria-label="Target Opportunity"
                    className="w-full text-xs rounded-xl border border-[#E7E7E2] dark:border-white/10 bg-white dark:bg-[#151D20] text-[#111312] dark:text-[#F2F6F7] p-2.5 outline-none focus:border-[#1F8FA6]"
                  >
                    <option value="">Select a target role...</option>
                    {recommendations.map(r => (
                      <option key={r.jobId} value={r.jobId}>
                        {r.jobTitle} ({r.companyName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#111312] dark:text-[#F2F6F7] block mb-1.5">
                    Add Hypothetical Skill
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={simNewSkill}
                      onChange={(e) => setSimNewSkill(e.target.value)}
                      placeholder="e.g. Docker, GraphQL"
                      aria-label="Add Hypothetical Skill"
                      className="flex-1 text-xs rounded-xl border border-[#E7E7E2] dark:border-white/10 bg-white dark:bg-[#151D20] text-[#111312] dark:text-[#F2F6F7] p-2.5 outline-none focus:border-[#1F8FA6]"
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
                  <label className="text-xs font-semibold text-[#111312] dark:text-[#F2F6F7] block mb-1.5">
                    Extra Experience (Years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={simExtraYears}
                    onChange={(e) => setSimExtraYears(Number(e.target.value))}
                    aria-label="Extra Experience (Years)"
                    className="w-full text-xs rounded-xl border border-[#E7E7E2] dark:border-white/10 bg-white dark:bg-[#151D20] text-[#111312] dark:text-[#F2F6F7] p-2.5 outline-none focus:border-[#1F8FA6]"
                  />
                </div>
              </div>

              {simSkillsList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center pt-1">
                  <span className="text-[11px] font-semibold text-[#8C928E]">Testing skills:</span>
                  {simSkillsList.map(s => (
                    <span
                      key={s}
                      className="px-2.5 py-0.5 rounded-full text-xs bg-[#1F8FA6]/10 text-[#1F8FA6] border border-[#1F8FA6]/20 flex items-center gap-1 font-medium"
                    >
                      {s}
                      <button
                        onClick={() => setSimSkillsList(simSkillsList.filter(item => item !== s))}
                        className="hover:text-rose-600 font-bold ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-1">
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

              {simulationResult && (
                <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-[#E7E7E2] dark:border-white/8 space-y-3 mt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#111312] dark:text-[#F2F6F7] uppercase tracking-wider">
                      Simulation Projection: {simulationResult.jobTitle}
                    </h4>
                    <Pill variant="micro-status" color="teal">
                      <span className="figure font-bold">+{simulationResult.scoreDelta} pts</span> Increase
                    </Pill>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-white dark:bg-[#151D20] border border-[#E7E7E2] dark:border-white/8 text-center">
                      <div className="text-[10px] text-[#8C928E] uppercase font-bold">Baseline Score</div>
                      <div className="text-lg font-bold text-[#111312] dark:text-[#F2F6F7] figure">{simulationResult.baseScore}%</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-[#151D20] border border-emerald-300 dark:border-emerald-800 text-center">
                      <div className="text-[10px] text-emerald-600 uppercase font-bold">Simulated Score</div>
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 figure">{simulationResult.simulatedScore}%</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-[#151D20] border border-[#1F8FA6]/30 text-center">
                      <div className="text-[10px] text-[#1F8FA6] uppercase font-bold">Net Score Lift</div>
                      <div className="text-lg font-bold text-[#1F8FA6] figure">+{simulationResult.scoreDelta} pts</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Dedicated What-If Scenario Simulator View */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-6 shadow-2xs space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7] tracking-tight">
                What-If Scenario Simulator
              </h3>
              <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
                Evaluate hypothetical skills and experience additions against any published job opening using Resumio's explainable deterministic scoring engine.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#111312] dark:text-[#F2F6F7] block mb-1.5">
                  Select Target Job
                </label>
                <select
                  value={simJobId}
                  onChange={(e) => setSimJobId(e.target.value)}
                  aria-label="Select Target Job"
                  className="w-full text-xs rounded-xl border border-[#E7E7E2] dark:border-white/10 bg-white dark:bg-[#151D20] text-[#111312] dark:text-[#F2F6F7] p-2.5 outline-none focus:border-[#1F8FA6]"
                >
                  <option value="">Select a target role...</option>
                  {recommendations.map(r => (
                    <option key={r.jobId} value={r.jobId}>
                      {r.jobTitle} ({r.companyName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#111312] dark:text-[#F2F6F7] block mb-1.5">
                  Add Hypothetical Skill
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={simNewSkill}
                    onChange={(e) => setSimNewSkill(e.target.value)}
                    placeholder="e.g. AWS Lambda, Kubernetes"
                    aria-label="Hypothetical Skill"
                    className="flex-1 text-xs rounded-xl border border-[#E7E7E2] dark:border-white/10 bg-white dark:bg-[#151D20] text-[#111312] dark:text-[#F2F6F7] p-2.5 outline-none focus:border-[#1F8FA6]"
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
                <label className="text-xs font-semibold text-[#111312] dark:text-[#F2F6F7] block mb-1.5">
                  Extra Experience Years
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={simExtraYears}
                  onChange={(e) => setSimExtraYears(Number(e.target.value))}
                  aria-label="Extra Experience Years"
                  className="w-full text-xs rounded-xl border border-[#E7E7E2] dark:border-white/10 bg-white dark:bg-[#151D20] text-[#111312] dark:text-[#F2F6F7] p-2.5 outline-none focus:border-[#1F8FA6]"
                />
              </div>
            </div>

            {simSkillsList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] font-semibold text-[#8C928E]">Tested skills:</span>
                {simSkillsList.map(s => (
                  <span
                    key={s}
                    className="px-2.5 py-0.5 rounded-full text-xs bg-[#1F8FA6]/10 text-[#1F8FA6] border border-[#1F8FA6]/20 flex items-center gap-1 font-medium"
                  >
                    {s}
                    <button
                      onClick={() => setSimSkillsList(simSkillsList.filter(item => item !== s))}
                      className="hover:text-rose-600 font-bold ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="primary"
                size="md"
                onClick={handleRunSimulation}
                isLoading={isSimulating}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Run What-If Simulation
              </Button>
            </div>

            {simulationResult && (
              <div className="p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-[#E7E7E2] dark:border-white/8 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#111312] dark:text-[#F2F6F7] uppercase tracking-wider">
                    Simulation Output: {simulationResult.jobTitle}
                  </h4>
                  <Pill variant="micro-status" color="teal">
                    <span className="figure font-bold">+{simulationResult.scoreDelta} pts</span> Increase
                  </Pill>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-white dark:bg-[#151D20] border border-[#E7E7E2] dark:border-white/8 text-center">
                    <div className="text-[10px] text-[#8C928E] uppercase font-bold">Baseline Score</div>
                    <div className="text-2xl font-bold text-[#111312] dark:text-[#F2F6F7] figure mt-1">{simulationResult.baseScore}%</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-[#151D20] border border-emerald-300 dark:border-emerald-800 text-center">
                    <div className="text-[10px] text-emerald-600 uppercase font-bold">Simulated Score</div>
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 figure mt-1">{simulationResult.simulatedScore}%</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-[#151D20] border border-[#1F8FA6]/30 text-center">
                    <div className="text-[10px] text-[#1F8FA6] uppercase font-bold">Net Score Gain</div>
                    <div className="text-2xl font-bold text-[#1F8FA6] figure mt-1">+{simulationResult.scoreDelta} pts</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Target Jobs & Fit */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7] tracking-tight">
                Recommended Opportunities
              </h3>
              <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
                Matched against your current skill ontology and evidenced profile.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowPreferencesEditor(!showPreferencesEditor)}
              leftIcon={<Sliders className="w-3.5 h-3.5" />}
            >
              Preferences
            </Button>
          </div>

          {showPreferencesEditor && (
            <Card padding="md" className="border border-[#E7E7E2] dark:border-white/8 rounded-2xl bg-white dark:bg-[#0D1214] space-y-4">
              <h4 className="text-xs font-bold text-[#111312] dark:text-[#F2F6F7] uppercase tracking-wider">
                Opportunity Preferences
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#111312] dark:text-[#F2F6F7] block mb-1">
                    Work Modes
                  </label>
                  <div className="flex gap-3">
                    {['Remote', 'Hybrid', 'On-site'].map(mode => (
                      <label key={mode} className="flex items-center gap-1.5 text-xs text-[#5E6460] dark:text-[#9AA7AB]">
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
                        />
                        {mode}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#111312] dark:text-[#F2F6F7] block mb-1">
                    Minimum Annual Salary ($)
                  </label>
                  <input
                    type="number"
                    value={preferences.minSalary || ''}
                    onChange={(e) => setPreferences({ ...preferences, minSalary: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="e.g. 100000"
                    className="w-full text-xs rounded-xl border border-[#E7E7E2] dark:border-white/10 bg-white dark:bg-[#151D20] p-2 text-[#111312] dark:text-[#F2F6F7]"
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

          {recommendations.length === 0 ? (
            <Card padding="lg" className="text-center py-12 space-y-2 border border-[#E7E7E2] dark:border-white/8 rounded-2xl bg-white dark:bg-[#0D1214]">
              <Sparkles className="w-8 h-8 text-[#8C928E] mx-auto" />
              <h3 className="text-sm font-bold text-[#111312] dark:text-[#F2F6F7]">
                No matching opportunities found
              </h3>
              <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] max-w-md mx-auto">
                Update your skills or adjust preferences to broaden search recommendations.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div
                  key={rec.jobId}
                  className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 hover:border-[#1F8FA6]/30 rounded-2xl p-5 shadow-2xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
                          {rec.jobTitle}
                        </h4>
                        <Pill variant="micro-status" color="teal">
                          <span className="figure">{rec.recommendationScore}%</span> Match
                        </Pill>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#5E6460] dark:text-[#9AA7AB] font-medium">
                        <span className="flex items-center gap-1 font-semibold text-[#111312] dark:text-[#F2F6F7]">
                          <Building2 className="w-3.5 h-3.5 text-[#1F8FA6]" />
                          {rec.companyName}
                        </span>
                        <span>•</span>
                        <span>{rec.location} ({rec.workMode})</span>
                        {rec.salaryRange && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-[#1F8FA6] figure">{rec.salaryRange}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="secondary" size="sm" onClick={() => handleDismissJob(rec.jobId)}>
                        Dismiss
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedJobForApply({ id: rec.jobId, title: rec.jobTitle, company_name: rec.companyName, location: rec.location })}
                        leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>

                  {/* Why this recommendation */}
                  {rec.reasonsWhy?.length > 0 && (
                    <div className="p-3 rounded-xl bg-black/[0.015] dark:bg-white/[0.02] border border-[#E7E7E2] dark:border-white/8 text-xs space-y-1">
                      <span className="text-[10px] font-bold text-[#8C928E] uppercase tracking-wider block">
                        Why this recommendation
                      </span>
                      <ul className="space-y-1 text-[#5E6460] dark:text-[#9AA7AB]">
                        {rec.reasonsWhy.map((reason: string, i: number) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Evidence & Verifications */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          {/* GitHub Verification */}
          <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <GithubIcon className="w-5 h-5 text-[#111312] dark:text-[#F2F6F7]" />
                <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
                  GitHub Repository Evidence Verification
                </h3>
              </div>
              <Pill variant="micro-status" color="teal">Read-Only Public Data</Pill>
            </div>
            <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed">
              Connect your public GitHub username to match claimed skills against real repository commits, languages, and stars. Unverifiable claims are presented neutrally without penalty.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                placeholder="Enter GitHub username (e.g. octocat)"
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
              <div className="space-y-4 pt-4 border-t border-[#E7E7E2] dark:border-white/8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-[#E7E7E2] dark:border-white/8 text-center">
                    <div className="text-[10px] text-[#8C928E] uppercase font-bold">Total Stars</div>
                    <div className="text-base font-bold text-[#111312] dark:text-[#F2F6F7] figure">⭐ {githubResult.totalStars}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-[#E7E7E2] dark:border-white/8 text-center">
                    <div className="text-[10px] text-[#8C928E] uppercase font-bold">Analyzed Repos</div>
                    <div className="text-base font-bold text-[#111312] dark:text-[#F2F6F7] figure">{githubResult.analyzedReposCount}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-[#E7E7E2] dark:border-white/8 text-center">
                    <div className="text-[10px] text-[#8C928E] uppercase font-bold">Original Code Ratio</div>
                    <div className="text-base font-bold text-emerald-600 figure">{Math.round(githubResult.originalReposRatio * 100)}%</div>
                  </div>
                  <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-[#E7E7E2] dark:border-white/8 text-center">
                    <div className="text-[10px] text-[#8C928E] uppercase font-bold">Verified Skills</div>
                    <div className="text-base font-bold text-[#1F8FA6] figure">
                      {githubResult.verifiedSkills.filter((s: any) => s.isVerified).length}
                    </div>
                  </div>
                </div>

                {/* Skill Verification Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {githubResult.verifiedSkills?.map((skill: any) => (
                    <div
                      key={skill.skillName}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
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
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Portfolio SSRF-Hardened Verification */}
          <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Globe className="w-5 h-5 text-[#1F8FA6]" />
                <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
                  Portfolio Website Verification (SSRF Protected)
                </h3>
              </div>
              <Pill variant="micro-status" color="teal">DNS Guarded</Pill>
            </div>
            <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
              Fetched through Resumio's SSRF-hardened fetcher. Private IP ranges, AWS metadata endpoints, and DNS rebinding attacks are strictly blocked.
            </p>

            <div className="flex gap-2">
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://yourdomain.com"
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
          </div>
        </div>
      )}

      {/* Tab 5: Privacy, Consents & GDPR Rights */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          {/* Data Portability (GDPR Art 20) */}
          <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-6 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
                  Data Portability & Export (GDPR Art. 20 / CCPA / DPDP)
                </h3>
                <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
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
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#E7E7E2] dark:border-white/8 cursor-pointer hover:bg-black/[0.015] dark:hover:bg-white/[0.02]">
                <input
                  type="checkbox"
                  checked={consents.talentPoolInclusion}
                  onChange={(e) => handleSaveConsents({ ...consents, talentPoolInclusion: e.target.checked })}
                  className="mt-1 rounded border-[#DCDCD7] text-[#1F8FA6] focus:ring-[#1F8FA6]"
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

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#E7E7E2] dark:border-white/8 cursor-pointer hover:bg-black/[0.015] dark:hover:bg-white/[0.02]">
                <input
                  type="checkbox"
                  checked={consents.trainingDataInclusion}
                  onChange={(e) => handleSaveConsents({ ...consents, trainingDataInclusion: e.target.checked })}
                  className="mt-1 rounded border-[#DCDCD7] text-[#1F8FA6] focus:ring-[#1F8FA6]"
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

          {/* Account Deletion */}
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
