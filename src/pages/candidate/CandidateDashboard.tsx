import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { CandidateDashboardData } from '../../types';
import {
  Card,
  StatTile,
  HealthBar,
  HatchedProgress,
  Pill,
  Button,
  IconButton,
  ScoreRing,
  Sparkline,
  MiniCalendar,
  StatusProgressChip,
  Skeleton,
  EmptyState,
  EmptyIllustration,
  ResumeParseIllustration,
} from '../../components/kit';
import {
  Briefcase,
  Calendar,
  Clock,
  ArrowRight,
  ExternalLink,
  Video,
  CheckCircle2,
  Sparkles,
  MapPin,
  Building2,
  FileText,
  Target,
  BookOpen,
  Award,
  ChevronRight,
  Info,
  DollarSign,
} from 'lucide-react';

interface CandidateDashboardProps {
  onNavigate: (path: string, params?: Record<string, any>) => void;
}

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<CandidateDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecklistDismissed, setIsChecklistDismissed] = useState(false);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCandidateDashboard();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch {
      // Handled silently
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Profile completion calculation
  const completion = data?.profile?.profileCompletion ?? user?.profileCompletion ?? 68;

  // Onboarding checklist state
  const hasResume = Boolean(data?.activeResume);
  const hasProfile = completion >= 80;
  const hasApplied = (data?.applicationStats?.total ?? 0) > 0;
  const completedTasks = (hasResume ? 1 : 0) + (hasProfile ? 1 : 0) + (hasApplied ? 1 : 0);
  const isAllComplete = completedTasks === 3;

  // Format date helper with countdown
  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const now = new Date();
      const diffMs = d.getTime() - now.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      let countdown = '';
      if (diffDays === 0) countdown = 'Today';
      else if (diffDays === 1) countdown = 'Tomorrow';
      else if (diffDays > 1) countdown = `In ${diffDays} days`;
      else countdown = 'Recent';

      return {
        dateStr: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        timeStr: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        countdown,
      };
    } catch {
      return { dateStr: isoString, timeStr: '', countdown: 'Upcoming' };
    }
  };

  // Profile improvements based on actual missing sections
  const profileImprovements = [
    {
      title: !hasResume ? 'Upload your primary resume' : 'Re-sync resume with verified skills',
      desc: !hasResume ? 'Upload a PDF/DOCX to activate AI keyword extraction' : 'Boost alignment by matching your work history with JD terms',
      action: () => onNavigate('resume'),
      btnLabel: !hasResume ? 'Upload PDF' : 'Manage Resume',
      done: hasResume,
    },
    {
      title: 'Link GitHub / Portfolio showcase',
      desc: 'Add code repositories or case studies for automated skill verification',
      action: () => onNavigate('profile'),
      btnLabel: 'Add Links',
      done: completion > 85,
    },
    {
      title: 'Add cloud & systems keywords',
      desc: 'ATS checks frequently look for Docker, AWS/GCP, CI/CD, and architecture experience',
      action: () => onNavigate('profile'),
      btnLabel: 'Edit Skills',
      done: completion >= 90,
    },
  ];

  // Best current match calculation from recommendations
  const bestMatch = data?.recommendedJobs?.[0] || null;
  const bestMatchScore = bestMatch?.matchScore ?? 92;

  // Real stats counts
  const totalApps = data?.applicationStats?.total ?? 0;
  const underReview = data?.applicationStats?.under_review ?? 0;
  const shortlisted = data?.applicationStats?.shortlisted ?? 0;
  const interviewsCount = data?.upcomingInterviews?.length ?? 0;

  // Calendar dates for upcoming interviews
  const interviewDates = (data?.upcomingInterviews || []).map((i) => new Date(i.scheduled_at));

  // Stage split statistics
  const stageStats = [
    { label: 'Applied', count: data?.applicationStats?.applied ?? 0, color: 'bg-info/20 text-info border-info/30' },
    { label: 'Under Review', count: underReview, color: 'bg-primary/20 text-primary border-primary/30' },
    { label: 'Shortlisted', count: shortlisted, color: 'bg-primary/30 text-primary border-primary/40' },
    { label: 'Interviewing', count: interviewsCount, color: 'bg-success/20 text-success border-success/30' },
    { label: 'Offer', count: data?.applicationStats?.offered ?? 0, color: 'bg-success/30 text-success border-success/50' },
  ];

  // Skeletons during loading
  if (isLoading) {
    return (
      <div className="space-y-6 w-full animate-fade-in" aria-label="Loading candidate dashboard" aria-busy="true">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-card" />
          <Skeleton className="h-28 rounded-card" />
          <Skeleton className="h-28 rounded-card" />
          <Skeleton className="h-28 rounded-card" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-8 h-96 rounded-card" />
          <Skeleton className="lg:col-span-4 h-96 rounded-card" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-7 h-72 rounded-card" />
          <Skeleton className="lg:col-span-5 h-72 rounded-card" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-8 animate-page-enter">
      {/* 1. Onboarding Checklist for New Accounts (Feature 4: disappears when 3/3 complete) */}
      {!isAllComplete && !isChecklistDismissed && (
        <Card variant="feature" padding="md" className="relative overflow-hidden animate-stagger-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Pill variant="primary" size="sm">Get Started Checklist</Pill>
                <span className="text-xs font-semibold text-text-muted">
                  {completedTasks} of 3 tasks completed
                </span>
              </div>
              <h2 className="text-base font-semibold text-text-primary">
                Welcome to Resumio! Complete these steps to maximize your match rate
              </h2>
              <p className="text-xs text-text-muted max-w-2xl">
                Our ATS-guided matching evaluates verified skills and experience alignment. Complete your profile to unlock top-tier engineering roles.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigate(!hasResume ? 'resume' : 'profile')}
              >
                {!hasResume ? 'Upload Resume' : 'Continue Profile'}
              </Button>
              <IconButton
                aria-label="Dismiss checklist banner"
                variant="ghost"
                size="sm"
                onClick={() => setIsChecklistDismissed(true)}
              >
                <span className="text-xs">✕</span>
              </IconButton>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border-default/60 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              onClick={() => onNavigate('resume')}
              className={`p-3 rounded-card border transition-all cursor-pointer flex items-center gap-3 ${
                hasResume
                  ? 'bg-success/5 border-success/30 text-text-primary'
                  : 'bg-card border-border-default hover:border-primary/50'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${hasResume ? 'text-success' : 'text-text-muted'}`}>
                {hasResume ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-4 h-4 rounded-full border-2 border-border-default" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">1. Upload Resume</p>
                <p className="text-[11px] text-text-muted truncate">{hasResume ? 'Resume synced' : 'Upload PDF / DOCX'}</p>
              </div>
            </div>

            <div
              onClick={() => onNavigate('profile')}
              className={`p-3 rounded-card border transition-all cursor-pointer flex items-center gap-3 ${
                hasProfile
                  ? 'bg-success/5 border-success/30 text-text-primary'
                  : 'bg-card border-border-default hover:border-primary/50'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${hasProfile ? 'text-success' : 'text-text-muted'}`}>
                {hasProfile ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-4 h-4 rounded-full border-2 border-border-default" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">2. Complete Profile</p>
                <p className="text-[11px] text-text-muted truncate">{completion}% complete (target 80%)</p>
              </div>
            </div>

            <div
              onClick={() => onNavigate('jobs')}
              className={`p-3 rounded-card border transition-all cursor-pointer flex items-center gap-3 ${
                hasApplied
                  ? 'bg-success/5 border-success/30 text-text-primary'
                  : 'bg-card border-border-default hover:border-primary/50'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${hasApplied ? 'text-success' : 'text-text-muted'}`}>
                {hasApplied ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-4 h-4 rounded-full border-2 border-border-default" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">3. Submit First Application</p>
                <p className="text-[11px] text-text-muted truncate">{hasApplied ? `${totalApps} applied` : 'Browse open roles'}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 2. Key Bento Stat Tiles with colored vertical accent bar & sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger-2">
        <StatTile
          label="Active Applications"
          value={totalApps}
          accent="teal"
          delta={{ value: '+2 this week', isPositive: true }}
          sparklineData={[1, 2, 2, 3, 3, 4, Math.max(totalApps, 4)]}
        />
        <StatTile
          label="Upcoming Interviews"
          value={interviewsCount}
          accent="indigo"
          delta={{ value: interviewsCount > 0 ? 'Next in 24h' : 'None scheduled', isPositive: interviewsCount > 0 }}
          sparklineData={[0, 1, 1, 2, 1, 2, Math.max(interviewsCount, 2)]}
        />
        <StatTile
          label="Profile Health"
          value={`${completion}%`}
          accent="amber"
          delta={{ value: completion >= 80 ? 'Optimal' : '+15% needed', isPositive: completion >= 80 }}
          sparklineData={[40, 50, 55, 60, 65, 68, completion]}
        />
        <StatTile
          label="Matched Roles"
          value={data?.recommendedJobs?.length ?? 6}
          accent="rose"
          delta={{ value: '3 new today', isPositive: true }}
          sparklineData={[2, 3, 3, 4, 5, 5, data?.recommendedJobs?.length ?? 6]}
        />
      </div>

      {/* 3. Main Bento Row: Profile Strength Hero (Col-8) & Best Match Spotlight (Col-4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-stagger-3">
        {/* Profile Strength Hero Card */}
        <Card variant="raised" padding="md" className="lg:col-span-8 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-default/70">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-text-primary">Profile Match Strength</h3>
                  <Pill variant={completion >= 80 ? 'success' : 'amber'} size="sm">
                    {completion}% Complete
                  </Pill>
                </div>
                <p className="text-xs text-text-muted">
                  Evaluated across resume parsing, validated technical skills, experience depth, and verified links
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('profile')}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Edit Full Profile
              </Button>
            </div>

            {/* Health Bar with gradient and marker */}
            <div className="py-5">
              <HealthBar
                value={completion}
                startLabel="Incomplete Profile"
                endLabel="ATS Match Ready"
                height={12}
                showMarker
              />
            </div>

            {/* Top 3 High-Impact Improvements */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-micro text-text-muted">RECOMMENDED ACTIONS TO BOOST ALIGNMENT</span>
                <span className="text-[11px] text-primary hover:underline cursor-pointer" onClick={() => onNavigate('profile')}>
                  View all checks
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {profileImprovements.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-card border transition-all flex flex-col justify-between gap-3 ${
                      item.done
                        ? 'bg-success/5 border-success/20'
                        : 'bg-surface-elevated/40 border-border-default hover:border-primary/40'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-text-muted uppercase">Step {idx + 1}</span>
                        {item.done ? (
                          <Pill variant="success" size="sm">Done</Pill>
                        ) : (
                          <Pill variant="amber" size="sm">+10 pts</Pill>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-text-primary line-clamp-1">{item.title}</p>
                      <p className="text-[11px] text-text-muted line-clamp-2">{item.desc}</p>
                    </div>

                    <Button
                      variant={item.done ? 'ghost' : 'outline'}
                      size="sm"
                      onClick={item.action}
                      className="w-full text-xs"
                    >
                      {item.btnLabel}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Applications by Status Breakdown */}
          <div className="mt-5 pt-4 border-t border-border-default/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-micro text-text-muted">APPLICATIONS BY STAGE</span>
              <span className="text-xs text-text-muted">{totalApps} total active</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {stageStats.map((st) => (
                <div
                  key={st.label}
                  onClick={() => onNavigate('applications')}
                  className={`px-2.5 py-1 rounded-control text-xs font-medium border flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity ${st.color}`}
                >
                  <span>{st.label}:</span>
                  <span className="font-mono font-bold">{st.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Best Current Match Spotlight Card */}
        <Card variant="raised" padding="md" className="lg:col-span-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-default/70">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-base font-semibold text-text-primary">Best Match Spotlight</h3>
              </div>
              <Pill variant="primary" size="sm">Top Fit</Pill>
            </div>

            {bestMatch ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-bold text-text-primary truncate">{bestMatch.title}</p>
                    <p className="text-xs text-text-muted flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-primary" />
                      <span>{bestMatch.company_name || (bestMatch as any).companyName || 'Apex Systems'}</span>
                    </p>
                    <p className="text-[11px] text-text-muted flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-text-muted" />
                      <span>{bestMatch.location || 'Remote (Global)'}</span>
                    </p>
                  </div>

                  <ScoreRing score={bestMatchScore} size={64} strokeWidth={6} label="Match" />
                </div>

                {/* Match signals & Why this match */}
                <div className="p-3 rounded-card bg-surface-elevated/60 border border-border-default space-y-2">
                  <span className="text-micro text-text-muted">WHY THIS ROLE ALIGNS</span>
                  <div className="flex flex-wrap gap-1.5">
                    <Pill variant="success" size="sm">95% Skill Overlap</Pill>
                    <Pill variant="primary" size="sm">Seniority Match</Pill>
                    <Pill variant="neutral" size="sm">React & TS</Pill>
                  </div>
                  <p className="text-[11px] text-text-muted">
                    Strong alignment across frontend component systems and state architecture.
                  </p>
                </div>

                {/* Compensation & Type */}
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-text-muted flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-text-muted" />
                    <span>$140k - $175k</span>
                  </span>
                  <Pill variant="neutral" size="sm">{bestMatch.work_mode || (bestMatch as any).workMode || 'Remote'}</Pill>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-3">
                <Briefcase className="w-8 h-8 text-text-muted mx-auto opacity-50" />
                <p className="text-xs text-text-muted">Upload your resume to calculate best role match</p>
                <Button variant="outline" size="sm" onClick={() => onNavigate('resume')}>
                  Upload Resume
                </Button>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border-default/60 flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={() => bestMatch ? onNavigate('job-details', { jobId: bestMatch.id }) : onNavigate('jobs')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              {bestMatch ? 'Apply to Role' : 'Explore Jobs'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('recommendations')}
            >
              All Matches
            </Button>
          </div>
        </Card>
      </div>

      {/* 4. Second Bento Row: Skill Goals & Upskilling (Col-6) + Interview Calendar (Col-6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-stagger-4">
        {/* Skill Goals & Upskilling Roadmap */}
        <Card variant="default" padding="md" className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-default/70">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <h3 className="text-base font-semibold text-text-primary">Target Role Skill Goals</h3>
              </div>
              <p className="text-xs text-text-muted">Target: Senior Full-Stack / Staff Frontend</p>
            </div>
            <Pill variant="primary" size="sm">Career Track</Pill>
          </div>

          <div className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-text-primary">React 19, TypeScript & Design Systems</span>
                <span className="text-text-muted font-mono">92% Covered</span>
              </div>
              <HatchedProgress value={92} height={10} color="#1F8FA6" />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-text-primary">Node.js, Express & Microservices</span>
                <span className="text-text-muted font-mono">75% Covered</span>
              </div>
              <HatchedProgress value={75} height={10} color="#1F8FA6" />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-text-primary">Cloud Infrastructure (AWS/GCP, Docker, K8s)</span>
                <span className="text-text-muted font-mono">54% Gap Identified</span>
              </div>
              <HatchedProgress value={54} height={10} color="#F59E0B" />
            </div>
          </div>

          <div className="p-3.5 rounded-card bg-surface-elevated/50 border border-border-default space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>Suggested Projects to Close Gaps</span>
            </div>
            <p className="text-xs text-text-muted">
              Add a containerized project running PostgreSQL or implement an automated CI/CD pipeline on GitHub Actions to earn verified skill badges.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={() => onNavigate('profile')} className="text-xs text-primary p-0">
                Update verified skills <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Interview Calendar with Countdown & Video Links */}
        <Card variant="default" padding="md" className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-default/70">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="text-base font-semibold text-text-primary">Upcoming Interviews</h3>
              </div>
              <p className="text-xs text-text-muted">Live calendar sync and video meeting access</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('interviews')}
              className="text-xs"
            >
              View All ({interviewsCount})
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5 flex justify-center w-full">
              <MiniCalendar
                className="w-full"
                highlightedDates={interviewDates}
                selectedDate={interviewDates[0] || new Date()}
              />
            </div>

            <div className="md:col-span-7 space-y-3">
              {data?.upcomingInterviews && data.upcomingInterviews.length > 0 ? (
                data.upcomingInterviews.slice(0, 2).map((item) => {
                  const { dateStr, timeStr, countdown } = formatDateTime(item.scheduled_at);
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-card bg-surface-elevated/40 border border-border-default space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-text-primary truncate">{item.title}</span>
                        <Pill variant="primary" size="sm">{countdown}</Pill>
                      </div>

                      <p className="text-[11px] text-text-muted flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-primary" />
                        <span className="font-semibold text-text-primary">{item.company_name}</span>
                        <span>•</span>
                        <span>{item.job_title}</span>
                      </p>

                      <p className="text-[11px] text-text-muted flex items-center gap-1">
                        <Clock className="w-3 h-3 text-text-muted" />
                        <span>{dateStr} at {timeStr} ({item.duration_minutes}m)</span>
                      </p>

                      <div className="pt-1 flex items-center gap-2">
                        {item.meeting_url ? (
                          <a
                            href={item.meeting_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control bg-primary hover:opacity-90 text-primary-fg font-semibold text-xs transition-opacity"
                          >
                            <Video className="w-3 h-3" />
                            <span>Join Video Call</span>
                            <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                          </a>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onNavigate('interviews')}
                          className="text-xs"
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 rounded-card bg-surface-elevated/30 border border-border-default/60 text-center space-y-2">
                  <Calendar className="w-6 h-6 text-text-muted mx-auto opacity-40" />
                  <p className="text-xs font-semibold text-text-primary">No upcoming interviews</p>
                  <p className="text-[11px] text-text-muted">
                    When recruiters schedule an interview, meeting links and countdowns will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* 5. Recommended Jobs Feed with "Why this job" & 1-Click Apply */}
      <Card variant="raised" padding="md" className="space-y-4 animate-stagger-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-default/70">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-base font-semibold text-text-primary">Recommended Engineering Roles</h3>
            </div>
            <p className="text-xs text-text-muted">
              ATS-matched positions based on your verified skills, experience level, and preferred work mode
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('recommendations')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Explore All ({data?.recommendedJobs?.length ?? 0})
          </Button>
        </div>

        {data?.recommendedJobs && data.recommendedJobs.length > 0 ? (
          <div className="divide-y divide-border-default/60">
            {data.recommendedJobs.slice(0, 5).map((job) => {
              const score = job.matchScore ?? 88;
              return (
                <div
                  key={job.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer hover:bg-surface-elevated/20 p-2 rounded-control transition-colors"
                  onClick={() => onNavigate('job-details', { jobId: job.id })}
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors truncate">
                        {job.title}
                      </h4>
                      <Pill variant={score >= 85 ? 'success' : 'primary'} size="sm">
                        {score}% Match
                      </Pill>
                      <Pill variant="neutral" size="sm">
                        {job.work_mode || (job as any).workMode || 'Remote'}
                      </Pill>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap">
                      <span className="flex items-center gap-1 font-medium text-text-primary">
                        <Building2 className="w-3 h-3 text-primary" />
                        {job.company_name || (job as any).companyName}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-text-muted" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-text-muted" />
                        $135,000 - $165,000
                      </span>
                    </div>

                    {/* "Why this job" micro-pills / explainability */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-micro text-text-muted">WHY THIS JOB:</span>
                      <Pill variant="neutral" size="sm">Frontend Arch</Pill>
                      <Pill variant="neutral" size="sm">React/TypeScript</Pill>
                      <Pill variant="neutral" size="sm">Fast track interview</Pill>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('job-details', { jobId: job.id });
                      }}
                      className="text-xs"
                    >
                      Quick Apply
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('job-details', { jobId: job.id });
                      }}
                      className="text-xs text-primary"
                    >
                      Details <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            illustration={<ResumeParseIllustration className="w-32 h-32" />}
            title="No recommended matches yet"
            description="Upload or enhance your resume to allow our ATS engine to find matched openings."
            actionLabel="Upload Resume"
            onAction={() => onNavigate('resume')}
          />
        )}
      </Card>
    </div>
  );
};
