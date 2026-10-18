import React, { useState, Suspense, lazy } from 'react';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

// Route Code Splitting via React.lazy
const AuthPage = lazy(() => import('./pages/auth/AuthPage').then(m => ({ default: m.AuthPage })));
const CandidateDashboard = lazy(() => import('./pages/candidate/CandidateDashboard').then(m => ({ default: m.CandidateDashboard })));
const RecruiterDashboard = lazy(() => import('./pages/recruiter/RecruiterDashboard').then(m => ({ default: m.RecruiterDashboard })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const CandidateProfilePage = lazy(() => import('./pages/candidate/CandidateProfilePage').then(m => ({ default: m.CandidateProfilePage })));
const ResumePage = lazy(() => import('./pages/candidate/ResumePage').then(m => ({ default: m.ResumePage })));
const ResumeBuilderPage = lazy(() => import('./pages/candidate/ResumeBuilderPage').then(m => ({ default: m.ResumeBuilderPage })));
const CompanyProfilePage = lazy(() => import('./pages/recruiter/CompanyProfilePage').then(m => ({ default: m.CompanyProfilePage })));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ComponentShowcase = lazy(() => import('./pages/design-system/ComponentShowcase').then(m => ({ default: m.ComponentShowcase })));
const MatchLabPage = lazy(() => import('./pages/MatchLabPage').then(m => ({ default: m.MatchLabPage })));

// Phase 3 Job Management & Discovery Pages
const RecruiterJobsPage = lazy(() => import('./pages/recruiter/RecruiterJobsPage').then(m => ({ default: m.RecruiterJobsPage })));
const CreateJobPage = lazy(() => import('./pages/recruiter/CreateJobPage').then(m => ({ default: m.CreateJobPage })));
const EditJobPage = lazy(() => import('./pages/recruiter/EditJobPage').then(m => ({ default: m.EditJobPage })));
const CandidateJobsPage = lazy(() => import('./pages/candidate/CandidateJobsPage').then(m => ({ default: m.CandidateJobsPage })));
const JobDetailsPage = lazy(() => import('./pages/candidate/JobDetailsPage').then(m => ({ default: m.JobDetailsPage })));
const RecommendationsPage = lazy(() => import('./pages/candidate/RecommendationsPage').then(m => ({ default: m.RecommendationsPage })));
const CandidateExperiencePage = lazy(() => import('./pages/candidate/CandidateExperiencePage').then(m => ({ default: m.CandidateExperiencePage })));

// Phase 4 Job Applications & Recruitment Pipeline Pages
const ApplicationsPage = lazy(() => import('./pages/candidate/ApplicationsPage').then(m => ({ default: m.ApplicationsPage })));
const RecruiterJobApplicantsPage = lazy(() => import('./pages/recruiter/RecruiterJobApplicantsPage').then(m => ({ default: m.RecruiterJobApplicantsPage })));

// Phase 7 Interviews & Analytics Pages
const CandidateInterviewsPage = lazy(() => import('./pages/candidate/CandidateInterviewsPage').then(m => ({ default: m.CandidateInterviewsPage })));
const RecruiterInterviewsPage = lazy(() => import('./pages/recruiter/RecruiterInterviewsPage').then(m => ({ default: m.RecruiterInterviewsPage })));
const RecruitmentAnalyticsPage = lazy(() => import('./pages/recruiter/RecruitmentAnalyticsPage').then(m => ({ default: m.RecruitmentAnalyticsPage })));

// Phase 8 AI Recruitment Intelligence Pages
const AICandidateSearchPage = lazy(() => import('./pages/recruiter/AICandidateSearchPage').then(m => ({ default: m.AICandidateSearchPage })));
const RecruiterWorkspacePage = lazy(() => import('./pages/recruiter/RecruiterWorkspacePage').then(m => ({ default: m.RecruiterWorkspacePage })));

// Phase 5 LLM Data Augmentation Research Pipeline Page
const ResearchPipelinePage = lazy(() => import('./pages/admin/ResearchPipelinePage').then(m => ({ default: m.ResearchPipelinePage })));

// Phase 4 Skill Ontology & Knowledge Base Page
const SkillOntologyPage = lazy(() => import('./pages/admin/SkillOntologyPage').then(m => ({ default: m.SkillOntologyPage })));

// Phase 10 Platform, Integrations & Benchmark Pages
const PlatformIntegrationsPage = lazy(() => import('./pages/recruiter/PlatformIntegrationsPage').then(m => ({ default: m.PlatformIntegrationsPage })));
const BenchmarkPage = lazy(() => import('./pages/public/BenchmarkPage').then(m => ({ default: m.BenchmarkPage })));
const DesignSystemCatalogPage = lazy(() => import('./pages/dev/DesignSystemCatalogPage').then(m => ({ default: m.DesignSystemCatalogPage })));
const ReferenceMatchPage = lazy(() => import('./pages/dev/ReferenceMatchPage').then(m => ({ default: m.ReferenceMatchPage })));
const LandingPage = lazy(() => import('./pages/public/LandingPage').then(m => ({ default: m.LandingPage })));
const HowScoringWorksPage = lazy(() => import('./pages/public/HowScoringWorksPage').then(m => ({ default: m.HowScoringWorksPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/legal/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsPage = lazy(() => import('./pages/legal/TermsPage').then(m => ({ default: m.TermsPage })));
const AIUsePage = lazy(() => import('./pages/legal/AIUsePage').then(m => ({ default: m.AIUsePage })));

const RouteLoadingFallback = () => (
  <div className="w-full min-h-[400px] flex flex-col items-center justify-center space-y-4" role="status" aria-live="polite">
    <div className="w-10 h-10 rounded-xl bg-[#1F8FA6] animate-pulse flex items-center justify-center text-white font-bold text-lg shadow-[0_4px_16px_rgba(43,179,201,0.35)]">
      R
    </div>
    <span className="sr-only">Loading Resumio view...</span>
  </div>
);

export const App: React.FC = () => {
  const { isAuthenticated, role, isLoading } = useAuth();

  const getInitialPath = (): string => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const qRoute = searchParams.get('route');
      if (qRoute) return qRoute;

      const path = window.location.pathname.replace(/^\//, '').replace(/\/$/, '');
      if (path === 'dev/design-system' || path === 'dev-design-system') return 'dev-design-system';
      if (path === 'dev/reference-match' || path === 'dev-reference-match') return 'dev-reference-match';
      if (path === 'benchmark' || path === 'public-benchmark') return 'public-benchmark';
      if (path === 'how-scoring-works' || path === 'methodology' || path === 'scoring-methodology') return 'how-scoring-works';
      if (path === 'privacy' || path === 'privacy-policy') return 'privacy';
      if (path === 'terms' || path === 'terms-of-service') return 'terms';
      if (path === 'ai-use' || path === 'ai-governance') return 'ai-use';
      if (path === 'auth' || path === 'login' || path === 'signup') return 'auth';
      if (path === 'recruiter/workspace' || path === 'recruiter-workspace') return 'recruiter-workspace';
      if (path === 'candidate/dashboard' || path === 'recruiter/dashboard') return 'dashboard';
      if (path === 'candidate/resume' || path === 'resume') return 'resume';
      if (path === 'candidate/recommendations') return 'candidate-experience';
      if (path === 'jobs' || path === 'recruiter/jobs') return path === 'jobs' ? 'jobs' : 'recruiter-jobs';
      if (path === 'settings') return 'settings';
      if (path === 'landing') return 'landing';

      const hash = window.location.hash.replace(/^#\/?/, '');
      if (hash) return hash.replace('/', '-');
      if (path) return path.replace(/\//g, '-');
    } catch {
      // fallback
    }
    return 'landing';
  };

  const [currentPath, setCurrentPath] = useState<string>(getInitialPath);
  const [navigationParams, setNavigationParams] = useState<Record<string, any>>({});

  const handleNavigate = (path: string, params?: Record<string, any>) => {
    setCurrentPath(path);
    if (params) {
      setNavigationParams(params);
    } else {
      setNavigationParams({});
    }
  };

  // Loading state during token validation
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F4F1] dark:bg-[#050708] text-[#111312] dark:text-[#F2F6F7]">
        <div className="w-12 h-12 rounded-2xl bg-[#1F8FA6] flex items-center justify-center text-white font-bold text-xl shadow-[0_4px_16px_rgba(43,179,201,0.35)] animate-pulse">
          R
        </div>
        <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] mt-3 font-medium">Initializing Resumio...</p>
      </div>
    );
  }

  // Handle unauthenticated routes
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        {(() => {
          if (currentPath === 'auth') {
            return (
              <AuthPage
                onNavigate={handleNavigate}
                initialRole={navigationParams.role}
                initialMode={navigationParams.mode}
              />
            );
          }
          if (currentPath === 'how-scoring-works') {
            return <HowScoringWorksPage onNavigate={handleNavigate} />;
          }
          if (currentPath === 'privacy') {
            return <PrivacyPolicyPage onNavigate={handleNavigate} />;
          }
          if (currentPath === 'terms') {
            return <TermsPage onNavigate={handleNavigate} />;
          }
          if (currentPath === 'ai-use') {
            return <AIUsePage onNavigate={handleNavigate} />;
          }
          if (currentPath === 'public-benchmark' || currentPath === 'benchmark') {
            return <BenchmarkPage onNavigate={handleNavigate} />;
          }
          if (currentPath === 'dev-design-system') {
            return <DesignSystemCatalogPage />;
          }
          if (currentPath === 'dev-reference-match') {
            return <ReferenceMatchPage />;
          }
          return <LandingPage onNavigate={handleNavigate} />;
        })()}
      </Suspense>
    );
  }

  // Handle standalone public pages when authenticated
  if (
    currentPath === 'landing' ||
    currentPath === 'how-scoring-works' ||
    currentPath === 'privacy' ||
    currentPath === 'terms' ||
    currentPath === 'ai-use'
  ) {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        {currentPath === 'landing' && <LandingPage onNavigate={handleNavigate} />}
        {currentPath === 'how-scoring-works' && <HowScoringWorksPage onNavigate={handleNavigate} />}
        {currentPath === 'privacy' && <PrivacyPolicyPage onNavigate={handleNavigate} />}
        {currentPath === 'terms' && <TermsPage onNavigate={handleNavigate} />}
        {currentPath === 'ai-use' && <AIUsePage onNavigate={handleNavigate} />}
      </Suspense>
    );
  }

  // Render active page within AppLayout
  const renderCurrentPage = () => {
    switch (currentPath) {
      case 'dashboard':
        if (role === 'admin') {
          return <AdminDashboard />;
        }
        if (role === 'recruiter') {
          return <RecruiterDashboard onNavigate={handleNavigate} />;
        }
        return <CandidateDashboard onNavigate={handleNavigate} />;

      // Candidate Profile & Resume
      case 'profile':
        if (role === 'recruiter') {
          return <CompanyProfilePage />;
        }
        if (role === 'admin') {
          return <AdminDashboard />;
        }
        return <CandidateProfilePage onNavigate={handleNavigate} />;

      case 'resume':
        return <ResumePage onNavigate={handleNavigate} />;

      case 'resume-builder':
        return <ResumeBuilderPage onNavigate={handleNavigate} />;

      // Recruiter Job Postings & Management
      case 'recruiter-jobs':
        return <RecruiterJobsPage onNavigate={handleNavigate} />;

      case 'create-job':
        return <CreateJobPage onNavigate={handleNavigate} />;

      case 'edit-job':
        return (
          <EditJobPage
            jobId={navigationParams.jobId || ''}
            onNavigate={handleNavigate}
          />
        );

      // Candidate Job Discovery & Details
      case 'jobs':
        return <CandidateJobsPage onNavigate={handleNavigate} />;

      case 'job-details':
        return (
          <JobDetailsPage
            jobId={navigationParams.jobId || ''}
            onNavigate={handleNavigate}
          />
        );

      case 'recommendations':
        return <RecommendationsPage onNavigate={handleNavigate} />;

      case 'candidate-experience':
      case 'career-hub':
        return <CandidateExperiencePage onNavigate={handleNavigate} />;

      // Phase 4: Candidate Applications
      case 'applications':
        return <ApplicationsPage onNavigate={handleNavigate} />;

      // Phase 7: Candidate Interviews
      case 'interviews':
        return <CandidateInterviewsPage onNavigate={handleNavigate} />;

      // Phase 4: Recruiter Applicant Pipeline
      case 'applicants':
      case 'job-applicants':
        return (
          <RecruiterJobApplicantsPage
            jobId={navigationParams.jobId}
            onNavigate={handleNavigate}
          />
        );

      // Phase 7: Recruiter Interviews & Analytics
      case 'recruiter-interviews':
        return <RecruiterInterviewsPage onNavigate={handleNavigate} />;

      case 'recruiter-analytics':
        return <RecruitmentAnalyticsPage onNavigate={handleNavigate} />;

      // Phase 8: Enterprise Recruiter Workspace & Pipeline
      case 'recruiter-workspace':
        return <RecruiterWorkspacePage onNavigate={handleNavigate} />;

      // Phase 8: Recruiter AI Candidate Search
      case 'recruiter-ai-search':
        return <AICandidateSearchPage onNavigate={handleNavigate} />;

      // Recruiter Organization Profile
      case 'company-profile':
        return <CompanyProfilePage />;

      // Admin Management
      case 'admin-users':
        return <AdminDashboard />;

      case 'research-pipeline':
        return <ResearchPipelinePage />;

      // Skill Ontology & KB Management
      case 'skills-ontology':
      case 'skills-admin':
      case 'skills':
        return <SkillOntologyPage onNavigate={handleNavigate} />;

      // Common Settings & DS
      case 'settings':
        return <SettingsPage />;

      case 'match-lab':
        return <MatchLabPage />;

      // Phase 10: Platform Integrations & Public Benchmark
      case 'platform-integrations':
      case 'platform':
      case 'integrations':
        return <PlatformIntegrationsPage onNavigate={handleNavigate} />;

      case 'public-benchmark':
      case 'benchmark':
      case 'benchmarks':
        return <BenchmarkPage onNavigate={handleNavigate} />;

      case 'dev-design-system':
      case 'design-system':
        return <DesignSystemCatalogPage />;

      case 'dev-reference-match':
      case 'reference-match':
        return <ReferenceMatchPage />;

      case 'how-scoring-works':
      case 'methodology':
      case 'scoring-methodology':
        return <HowScoringWorksPage onNavigate={handleNavigate} />;

      case 'privacy':
        return <PrivacyPolicyPage onNavigate={handleNavigate} />;

      case 'terms':
        return <TermsPage onNavigate={handleNavigate} />;

      case 'ai-use':
        return <AIUsePage onNavigate={handleNavigate} />;

      default:
        if (role === 'admin') {
          return <AdminDashboard />;
        }
        if (role === 'recruiter') {
          return <RecruiterDashboard onNavigate={handleNavigate} />;
        }
        return <CandidateDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <AppLayout currentPath={currentPath} onNavigate={handleNavigate}>
      <Suspense fallback={<RouteLoadingFallback />}>
        {renderCurrentPage()}
      </Suspense>
    </AppLayout>
  );
};

export default App;
