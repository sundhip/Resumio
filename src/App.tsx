import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { AuthPage } from './pages/auth/AuthPage';
import { CandidateDashboard } from './pages/candidate/CandidateDashboard';
import { RecruiterDashboard } from './pages/recruiter/RecruiterDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { CandidateProfilePage } from './pages/candidate/CandidateProfilePage';
import { ResumePage } from './pages/candidate/ResumePage';
import { ResumeBuilderPage } from './pages/candidate/ResumeBuilderPage';
import { CompanyProfilePage } from './pages/recruiter/CompanyProfilePage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { ComponentShowcase } from './pages/design-system/ComponentShowcase';
import { MatchLabPage } from './pages/MatchLabPage';

// Phase 3 Job Management & Discovery Pages
import { RecruiterJobsPage } from './pages/recruiter/RecruiterJobsPage';
import { CreateJobPage } from './pages/recruiter/CreateJobPage';
import { EditJobPage } from './pages/recruiter/EditJobPage';
import { CandidateJobsPage } from './pages/candidate/CandidateJobsPage';
import { JobDetailsPage } from './pages/candidate/JobDetailsPage';
import { RecommendationsPage } from './pages/candidate/RecommendationsPage';
import { CandidateExperiencePage } from './pages/candidate/CandidateExperiencePage';

// Phase 4 Job Applications & Recruitment Pipeline Pages
import { ApplicationsPage } from './pages/candidate/ApplicationsPage';
import { RecruiterJobApplicantsPage } from './pages/recruiter/RecruiterJobApplicantsPage';

// Phase 7 Interviews & Analytics Pages
import { CandidateInterviewsPage } from './pages/candidate/CandidateInterviewsPage';
import { RecruiterInterviewsPage } from './pages/recruiter/RecruiterInterviewsPage';
import { RecruitmentAnalyticsPage } from './pages/recruiter/RecruitmentAnalyticsPage';

// Phase 8 AI Recruitment Intelligence Pages
import { AICandidateSearchPage } from './pages/recruiter/AICandidateSearchPage';
import { RecruiterWorkspacePage } from './pages/recruiter/RecruiterWorkspacePage';

// Phase 5 LLM Data Augmentation Research Pipeline Page
import { ResearchPipelinePage } from './pages/admin/ResearchPipelinePage';

// Phase 4 Skill Ontology & Knowledge Base Page
import { SkillOntologyPage } from './pages/admin/SkillOntologyPage';

// Phase 10 Platform, Integrations & Benchmark Pages
import { PlatformIntegrationsPage } from './pages/recruiter/PlatformIntegrationsPage';
import { BenchmarkPage } from './pages/public/BenchmarkPage';
import { DesignSystemCatalogPage } from './pages/dev/DesignSystemCatalogPage';
import { ReferenceMatchPage } from './pages/dev/ReferenceMatchPage';

export const App: React.FC = () => {
  const { isAuthenticated, role, isLoading } = useAuth();

  const getInitialPath = (): string => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const qRoute = searchParams.get('route');
      if (qRoute) return qRoute;

      const path = window.location.pathname.replace(/^\//, '');
      if (path === 'dev/design-system' || path === 'dev-design-system') return 'dev-design-system';
      if (path === 'dev/reference-match' || path === 'dev-reference-match') return 'dev-reference-match';
      if (path === 'benchmark' || path === 'public-benchmark') return 'public-benchmark';

      const hash = window.location.hash.replace(/^#\/?/, '');
      if (hash) return hash.replace('/', '-');
    } catch {
      // fallback
    }
    return 'dashboard';
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
        <p className="mt-4 text-xs font-semibold text-[#5E6460] dark:text-[#9AA7AB] tracking-wider uppercase">
          Initializing Resumio...
        </p>
      </div>
    );
  }

  // Allow direct dev route access even if not authenticated
  const isDevRoute = currentPath === 'dev-design-system' || currentPath === 'dev-reference-match' || currentPath === 'public-benchmark';

  // If user is not authenticated and not visiting a dev route, show unified Phase 1 Auth Page
  if (!isAuthenticated && !isDevRoute) {
    return <AuthPage />;
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
      {renderCurrentPage()}
    </AppLayout>
  );
};

export default App;
