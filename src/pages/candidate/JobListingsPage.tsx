import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MatchScore } from '../../components/ui/MatchScore';
import { Tabs } from '../../components/ui/Tabs';
import { SearchInput } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { MOCK_JOBS } from '../../mockData';
import type { Job } from '../../types';
import { useToast } from '../../context/ToastContext';
import {
  Building2,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Send,
} from 'lucide-react';

export const JobListingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedJobs, setSavedJobs] = useState<string[]>(['job-02']);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyModalJob, setApplyModalJob] = useState<Job | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const { showToast } = useToast();

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (savedJobs.includes(id)) {
      setSavedJobs((prev) => prev.filter((j) => j !== id));
      showToast('info', 'Job removed from saved list');
    } else {
      setSavedJobs((prev) => [...prev, id]);
      showToast('success', 'Job saved to your bookmarks!');
    }
  };

  const handleApply = () => {
    if (!applyModalJob) return;
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      setApplyModalJob(null);
      showToast('success', 'Application Submitted!', `Your AI profile and resume were sent to ${applyModalJob.company}.`);
    }, 1000);
  };

  const filteredJobs = MOCK_JOBS.filter((job) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (job.title || '').toLowerCase().includes(q) ||
      (job.company || '').toLowerCase().includes(q) ||
      (job.tags || []).some((t) => (t || '').toLowerCase().includes(q));

    if (activeTab === 'saved') return matchesSearch && savedJobs.includes(job.id);
    if (activeTab === 'recommended') return matchesSearch && (job.matchScoreForUser || 0) >= 90;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Explore Opportunities
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse high-growth roles automatically matched with your AI resume profile.
          </p>
        </div>
      </div>

      {/* Filter & Tabs Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Tabs
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="boxed"
          tabs={[
            { id: 'all', label: 'All Jobs', count: MOCK_JOBS.length },
            { id: 'recommended', label: 'AI Recommended', count: 2 },
            { id: 'saved', label: 'Saved', count: savedJobs.length },
          ]}
        />

        <div className="w-full md:w-80">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder="Search by title, skill, or company..."
          />
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredJobs.map((job) => {
          const isSaved = savedJobs.includes(job.id);
          return (
            <Card
              key={job.id}
              variant="interactive"
              padding="md"
              onClick={() => setSelectedJob(job)}
              className="flex flex-col justify-between gap-4 group"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-control bg-gradient-to-br from-brand-50 to-indigo-50 dark:from-brand-950/60 dark:to-surface-dark-card border border-brand-200/60 dark:border-brand-800/40 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-sm shrink-0">
                      {(job.company || 'C').charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        {job.company}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => toggleSave(job.id, e)}
                    className="p-1.5 rounded-control text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-surface-dark-hover transition-colors"
                  >
                    {isSaved ? (
                      <BookmarkCheck className="w-5 h-5 text-brand-600 dark:text-brand-400 fill-current" />
                    ) : (
                      <Bookmark className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Match Score & Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  {job.matchScoreForUser && (
                    <MatchScore score={job.matchScoreForUser} variant="pill" size="sm" />
                  )}
                  <Badge variant="neutral" size="sm">
                    {job.workplace}
                  </Badge>
                  <Badge variant="neutral" size="sm">
                    {job.experienceLevel} Level
                  </Badge>
                </div>

                {/* Snippet */}
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                {/* Skill tags */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {job.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-[11px] rounded bg-slate-100 dark:bg-surface-dark-bg text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-surface-dark-border"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-surface-dark-border">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {job.salaryRange}
                </span>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setApplyModalJob(job);
                  }}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Quick Apply
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <Modal
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          title={
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-control bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
                {selectedJob.company.charAt(0)}
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {selectedJob.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedJob.company} • {selectedJob.location} ({selectedJob.workplace})
                </p>
              </div>
            </div>
          }
          size="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {selectedJob.salaryRange}
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setSelectedJob(null)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setApplyModalJob(selectedJob);
                    setSelectedJob(null);
                  }}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Apply with AI Profile
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {selectedJob.matchScoreForUser && (
              <div className="p-4 rounded-card bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200/60 dark:border-brand-800/40">
                <MatchScore score={selectedJob.matchScoreForUser} variant="bar" />
              </div>
            )}

            <div className="space-y-2">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Role Description
              </h5>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed p-3.5 rounded-control bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200 dark:border-surface-dark-border">
                {selectedJob.description}
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Required Qualifications & Skills
              </h5>
              <div className="flex flex-wrap gap-2">
                {selectedJob.requiredSkills.map((sk, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Instant Apply Modal */}
      {applyModalJob && (
        <Modal
          isOpen={!!applyModalJob}
          onClose={() => setApplyModalJob(null)}
          title="Confirm AI Application"
          description={`Submit your verified Resumio profile and resume to ${applyModalJob.company} for ${applyModalJob.title}.`}
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setApplyModalJob(null)} disabled={isApplying}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleApply}
                isLoading={isApplying}
                rightIcon={<Send className="w-4 h-4" />}
              >
                {isApplying ? 'Submitting...' : 'Submit Application'}
              </Button>
            </>
          }
        >
          <div className="p-3.5 rounded-control bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200/60 dark:border-brand-800/40 text-xs space-y-1">
            <p className="font-semibold text-brand-700 dark:text-brand-300">
              ✨ Fast-Track Verification
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              Your 94% AI Match score and verified skill credentials will be prioritized in the recruiter's incoming screening queue.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};
