import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { AuthPage } from './pages/auth/AuthPage';
import { CandidateDashboard } from './pages/candidate/CandidateDashboard';
import { RecruiterDashboard } from './pages/recruiter/RecruiterDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { CandidateProfilePage } from './pages/candidate/CandidateProfilePage';
import { ResumePage } from './pages/candidate/ResumePage';
import { CompanyProfilePage } from './pages/recruiter/CompanyProfilePage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { ComponentShowcase } from './pages/design-system/ComponentShowcase';

// Phase 3 Job Management & Discovery Pages
import { RecruiterJobsPage } from './pages/recruiter/RecruiterJobsPage';
import { CreateJobPage } from './pages/recruiter/CreateJobPage';
import { EditJobPage } from './pages/recruiter/EditJobPage';
import { CandidateJobsPage } from './pages/candidate/CandidateJobsPage';
import { JobDetailsPage } from './pages/candidate/JobDetailsPage';
import { RecommendationsPage } from './pages/candidate/RecommendationsPage';

// Phase 4 Job Applications & Recruitment Pipeline Pages
import { ApplicationsPage } from './pages/candidate/ApplicationsPage';
import { RecruiterJobApplicantsPage } from './pages/recruiter/RecruiterJobApplicantsPage';

// Phase 7 Interviews & Analytics Pages
import { CandidateInterviewsPage } from './pages/candidate/CandidateInterviewsPage';
import { RecruiterInterviewsPage } from './pages/recruiter/RecruiterInterviewsPage';
import { RecruitmentAnalyticsPage } from './pages/recruiter/RecruitmentAnalyticsPage';

// Phase 8 AI Recruitment Intelligence Pages
import { AICandidateSearchPage } from './pages/recruiter/AICandidateSearchPage';

export const App: React.FC = () => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>('dashboard');
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-light-bg dark:bg-surface-dark-bg text-slate-900 dark:text-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-glow-purple animate-pulse">
          R
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
          Initializing Resumio...
        </p>
      </div>
    );
  }

  // If user is not authenticated, show unified Phase 1 Auth Page
  if (!isAuthenticated) {
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

      // Phase 8: Recruiter AI Candidate Search
      case 'recruiter-ai-search':
        return <AICandidateSearchPage onNavigate={handleNavigate} />;

      // Recruiter Organization Profile
      case 'company-profile':
        return <CompanyProfilePage />;

      // Admin Management
      case 'admin-users':
        return <AdminDashboard />;

      // Common Settings & DS
      case 'settings':
        return <SettingsPage />;

      case 'design-system':
        return <ComponentShowcase />;

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
