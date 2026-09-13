import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ApplicationStatusBadge } from '../../components/applications/ApplicationStatusBadge';
import { CandidateApplicationDetailsModal } from './CandidateApplicationDetailsModal';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import type { CandidateApplicationItem, CandidateApplicationStats, RealApplicationStatus } from '../../types';
import {
  Briefcase,
  Building2,
  Calendar,
  ChevronRight,
  Search,
  FileText,
  Send,
} from 'lucide-react';

interface ApplicationsPageProps {
  onNavigate?: (path: string, params?: Record<string, any>) => void;
}

export const ApplicationsPage: React.FC<ApplicationsPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();

  const [applications, setApplications] = useState<CandidateApplicationItem[]>([]);
  const [stats, setStats] = useState<CandidateApplicationStats>({
    total: 0,
    applied: 0,
    under_review: 0,
    shortlisted: 0,
    rejected: 0,
    withdrawn: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState<'All' | RealApplicationStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCandidateApplications();
      if (res.success) {
        setApplications(res.applications);
        setStats(res.stats);
      }
    } catch (err: any) {
      showToast('error', 'Unable to load applications', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const formatSalary = (app: CandidateApplicationItem) => {
    if (!app.salaryDisclosed || (!app.salaryMin && !app.salaryMax)) {
      return null;
    }
    const curr = app.currency === 'INR' ? '₹' : app.currency === 'USD' ? '$' : `${app.currency} `;
    if (app.salaryMin && app.salaryMax) {
      return `${curr}${app.salaryMin.toLocaleString()} – ${curr}${app.salaryMax.toLocaleString()}`;
    }
    if (app.salaryMin) {
      return `From ${curr}${app.salaryMin.toLocaleString()}`;
    }
    return `Up to ${curr}${app.salaryMax?.toLocaleString()}`;
  };

  // Filtered applications
  const filteredApplications = applications.filter((app) => {
    const matchesTab = activeTab === 'All' || app.status === activeTab;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      (app.jobTitle || '').toLowerCase().includes(query) ||
      (app.company || '').toLowerCase().includes(query) ||
      (app.location || '').toLowerCase().includes(query);

    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              My Applications
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              {stats.total} Total
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track real-time status progression, view submitted resumes, and manage active applications.
          </p>
        </div>

        {onNavigate && (
          <Button
            variant="primary"
            size="md"
            onClick={() => onNavigate('jobs')}
            leftIcon={<Briefcase className="w-4 h-4" />}
          >
            Explore More Jobs
          </Button>
        )}
      </div>

      {/* Real Statistics Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="sm" className="space-y-1">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Total Submitted
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.total}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">All applications</p>
        </Card>

        <Card padding="sm" className="space-y-1 border-amber-200/50 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10">
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Under Review
          </span>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
            {stats.under_review}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Being evaluated</p>
        </Card>

        <Card padding="sm" className="space-y-1 border-emerald-200/50 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Shortlisted
          </span>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {stats.shortlisted}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Advanced to next stage</p>
        </Card>

        <Card padding="sm" className="space-y-1">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Decisions & Closed
          </span>
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
            {stats.rejected + stats.withdrawn}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {stats.rejected} rejected • {stats.withdrawn} withdrawn
          </p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card padding="sm" className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['All', 'Applied', 'Under Review', 'Shortlisted', 'Rejected', 'Withdrawn'] as const).map((tab) => {
            const count =
              tab === 'All'
                ? stats.total
                : tab === 'Applied'
                ? stats.applied
                : tab === 'Under Review'
                ? stats.under_review
                : tab === 'Shortlisted'
                ? stats.shortlisted
                : tab === 'Rejected'
                ? stats.rejected
                : stats.withdrawn;

            const isSelected = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-control text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-surface-dark-input text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-surface-dark-border text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search by role, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </Card>

      {/* Applications List */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 rounded-card bg-slate-100 dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border" />
          ))}
        </div>
      ) : filteredApplications.length === 0 ? (
        <Card padding="lg" className="text-center py-12 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto shadow-xs">
            <Send className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {searchQuery || activeTab !== 'All' ? 'No applications match filter' : 'No applications submitted yet'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {searchQuery || activeTab !== 'All'
                ? 'Try changing the status tab or clearing your search criteria.'
                : 'Browse published opportunities across top companies and submit your resume directly.'}
            </p>
          </div>
          {searchQuery || activeTab !== 'All' ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setActiveTab('All');
              }}
            >
              Reset Filters
            </Button>
          ) : (
            onNavigate && (
              <Button
                variant="primary"
                size="md"
                onClick={() => onNavigate('jobs')}
                leftIcon={<Briefcase className="w-4 h-4" />}
              >
                Browse Job Opportunities
              </Button>
            )
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredApplications.map((app) => {
            const salary = formatSalary(app);
            return (
              <Card
                key={app.id}
                padding="md"
                className="hover:border-slate-300 dark:hover:border-surface-dark-border/90 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {/* Company Initial */}
                  <div className="w-12 h-12 rounded-control bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-slate-200/80 dark:border-surface-dark-border flex items-center justify-center text-slate-800 dark:text-slate-200 font-bold text-base shrink-0">
                    {(app.company || 'C').charAt(0)}
                  </div>

                  <div className="min-w-0 space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {app.jobTitle}
                      </h3>
                      <ApplicationStatusBadge status={app.status} size="sm" showDot />
                    </div>

                    <div className="flex items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                        <Building2 className="w-3.5 h-3.5 text-brand-600" />
                        {app.company}
                      </span>
                      <span>•</span>
                      <span>{app.location || 'Remote'} ({app.workMode})</span>
                      <span>•</span>
                      <span>{app.employmentType}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Applied on {new Date(app.appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {salary && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-brand-600 dark:text-brand-400">
                            {salary}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Resume Snapshot & Cover note preview */}
                    <div className="flex items-center gap-3 pt-0.5 flex-wrap">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-surface-dark-input px-2 py-0.5 rounded border border-slate-200/60 dark:border-surface-dark-border">
                        <FileText className="w-3 h-3 text-rose-500" />
                        <span className="truncate max-w-[200px]">{app.resumeFilename}</span>
                      </div>

                      {app.coverLetter && (
                        <span className="text-[11px] text-slate-400 italic truncate max-w-[280px]">
                          "{app.coverLetter}"
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-surface-dark-border">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedApplicationId(app.id)}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                  >
                    View Status & Details
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Application Details Modal */}
      {selectedApplicationId && (
        <CandidateApplicationDetailsModal
          applicationId={selectedApplicationId}
          isOpen={Boolean(selectedApplicationId)}
          onClose={() => setSelectedApplicationId(null)}
          onWithdrawSuccess={loadApplications}
        />
      )}
    </div>
  );
};
