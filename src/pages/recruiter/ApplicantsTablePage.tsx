import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MatchScore } from '../../components/ui/MatchScore';
import { SearchInput } from '../../components/ui/Input';
import { Dropdown } from '../../components/ui/Dropdown';
import { Modal } from '../../components/ui/Modal';
import { MOCK_CANDIDATES } from '../../mockData';
import type { Candidate, ApplicationStatus } from '../../types';
import { useToast } from '../../context/ToastContext';
import {
  MoreHorizontal,
  Download,
  Calendar,
  CheckCircle2,
  XCircle,
  Sparkles,
  FileText,
  LayoutGrid,
  List,
} from 'lucide-react';

interface ApplicantsTablePageProps {
  onNavigate: (path: string) => void;
}

export const ApplicantsTablePage: React.FC<ApplicantsTablePageProps> = ({ onNavigate }) => {
  const [candidates, setCandidates] = useState<Candidate[]>(MOCK_CANDIDATES);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [rejectModalCandidate, setRejectModalCandidate] = useState<Candidate | null>(null);
  const [sortBy, setSortBy] = useState<'score_desc' | 'score_asc' | 'name_asc' | 'exp_desc'>('score_desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const { showToast } = useToast();

  const handleStatusChange = (candId: string, newStatus: ApplicationStatus) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === candId ? { ...c, status: newStatus } : c))
    );
    showToast('success', `Candidate status updated to "${newStatus}"`);
  };

  const handleConfirmRejection = () => {
    if (rejectModalCandidate) {
      handleStatusChange(rejectModalCandidate.id, 'Rejected');
      setRejectModalCandidate(null);
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.appliedJob.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.skills.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesScore = c.aiScore >= minScoreFilter;

    return matchesSearch && matchesStatus && matchesScore;
  }).sort((a, b) => {
    if (sortBy === 'score_desc') return b.aiScore - a.aiScore;
    if (sortBy === 'score_asc') return a.aiScore - b.aiScore;
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
    if (sortBy === 'exp_desc') return b.experienceYears - a.experienceYears;
    return 0;
  });

  const totalPages = Math.ceil(filteredCandidates.length / pageSize) || 1;
  const paginatedCandidates = filteredCandidates.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Applicant Pipeline
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review, screen, filter, and advance candidates with AI Match recommendations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-surface-dark-bg p-1 rounded-control border border-slate-200 dark:border-surface-dark-border">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-surface-dark-card text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Table
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-surface-dark-card text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Kanban
            </button>
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={() => showToast('info', 'Exporting CSV report...')}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
          <Button
            variant="ai"
            size="md"
            onClick={() => onNavigate('ai-screening')}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            AI Screening Hub
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card padding="sm" className="space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="w-full md:w-80">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Search candidate, skill, or role..."
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 text-xs sm:text-sm rounded-control bg-white dark:bg-surface-dark-input text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-surface-dark-border focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="all">All Statuses</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Interview">Interview</option>
              <option value="Screening">Screening</option>
              <option value="Under Review">Under Review</option>
              <option value="Applied">Applied</option>
              <option value="Rejected">Rejected</option>
            </select>

            {/* AI Score Filter */}
            <select
              value={minScoreFilter}
              onChange={(e) => setMinScoreFilter(Number(e.target.value))}
              className="h-10 px-3 text-xs sm:text-sm rounded-control bg-white dark:bg-surface-dark-input text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-surface-dark-border focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value={0}>All AI Scores</option>
              <option value={90}>Score ≥ 90% (Top Fit)</option>
              <option value={80}>Score ≥ 80% (Strong)</option>
              <option value={70}>Score ≥ 70% (Good)</option>
            </select>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setCurrentPage(1);
              }}
              className="h-10 px-3 text-xs sm:text-sm rounded-control bg-white dark:bg-surface-dark-input text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-surface-dark-border focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="score_desc">Sort: Highest Match</option>
              <option value="score_asc">Sort: Lowest Match</option>
              <option value="name_asc">Sort: Candidate Name</option>
              <option value="exp_desc">Sort: Most Experience</option>
            </select>

            <span className="text-xs text-slate-400 px-2 shrink-0">
              Showing {filteredCandidates.length} of {candidates.length}
            </span>
          </div>
        </div>
      {/* Main Table or Kanban Pipeline View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {(['Applied', 'Screening', 'Interview', 'Shortlisted'] as ApplicationStatus[]).map((colStatus) => {
            const colCandidates = candidates.filter((c) => c.status === colStatus);
            return (
              <div
                key={colStatus}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const candId = e.dataTransfer.getData('text/plain');
                  if (candId) {
                    handleStatusChange(candId, colStatus);
                  }
                }}
                className="flex flex-col bg-slate-50/80 dark:bg-surface-dark-bg/60 rounded-xl p-3 border border-slate-200/80 dark:border-surface-dark-border min-h-[500px]"
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      {colStatus}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white dark:bg-surface-dark-card text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-surface-dark-border shadow-xs">
                      {colCandidates.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {colCandidates.length === 0 ? (
                    <div className="border border-dashed border-slate-200 dark:border-surface-dark-border rounded-lg p-6 text-center text-xs text-slate-400">
                      Drop candidate here
                    </div>
                  ) : (
                    colCandidates.map((cand) => (
                      <div
                        key={cand.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', cand.id);
                        }}
                        onClick={() => setSelectedCandidate(cand)}
                        className="p-3.5 rounded-lg bg-white dark:bg-surface-dark-card border border-slate-200/90 dark:border-surface-dark-border shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={cand.avatar}
                              alt={cand.name}
                              className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                            />
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {cand.name}
                              </h4>
                              <p className="text-[10px] text-slate-400 truncate">{cand.title}</p>
                            </div>
                          </div>
                          <MatchScore score={cand.aiScore} variant="pill" size="sm" />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-surface-dark-border">
                          <span>{cand.experienceYears} yrs exp</span>
                          <span className="text-[10px] text-brand-600 dark:text-brand-400 font-medium truncate max-w-[120px]">
                            {cand.appliedJob}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Main Table */
        <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-surface-dark-border bg-slate-50/75 dark:bg-surface-dark-bg/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-5">Candidate</th>
                <th className="py-3.5 px-4">Job Role</th>
                <th className="py-3.5 px-4">AI Match</th>
                <th className="py-3.5 px-4">Key Skills</th>
                <th className="py-3.5 px-4">Experience</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-surface-dark-border text-xs sm:text-sm">
              {paginatedCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No candidates match the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedCandidates.map((cand) => (
                  <tr
                    key={cand.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-surface-dark-hover/50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedCandidate(cand)}
                  >
                    {/* Candidate */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={cand.avatar}
                          alt={cand.name}
                          className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 dark:ring-surface-dark-border shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {cand.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{cand.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Job */}
                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                      {cand.appliedJob}
                    </td>

                    {/* AI Match */}
                    <td className="py-3.5 px-4">
                      <MatchScore score={cand.aiScore} variant="pill" size="sm" />
                    </td>

                    {/* Skills */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 flex-wrap max-w-xs">
                        {cand.skills.slice(0, 2).map((s, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-[10px] rounded bg-slate-100 dark:bg-surface-dark-bg text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-surface-dark-border"
                          >
                            {s.name}
                          </span>
                        ))}
                        {cand.skills.length > 2 && (
                          <span className="text-[10px] text-slate-400">
                            +{cand.skills.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Experience */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {cand.experienceYears} yrs
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <Badge status={cand.status} showDot size="sm" />
                    </td>

                    {/* Actions Dropdown */}
                    <td
                      className="py-3.5 px-5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Dropdown
                        align="right"
                        width="sm"
                        trigger={
                          <button className="p-1.5 rounded-control text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-surface-dark-hover">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        }
                        items={[
                          {
                            id: 'view',
                            label: 'View Profile',
                            icon: <FileText className="w-4 h-4 text-slate-400" />,
                            onClick: () => setSelectedCandidate(cand),
                          },
                          {
                            id: 'interview',
                            label: 'Schedule Interview',
                            icon: <Calendar className="w-4 h-4 text-indigo-500" />,
                            onClick: () => {
                              handleStatusChange(cand.id, 'Interview');
                              onNavigate('interviews');
                            },
                          },
                          {
                            id: 'shortlist',
                            label: 'Mark Shortlisted',
                            icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
                            onClick: () => handleStatusChange(cand.id, 'Shortlisted'),
                          },
                          {
                            id: 'div',
                            label: '',
                            divider: true,
                          },
                          {
                            id: 'reject',
                            label: 'Reject Candidate',
                            icon: <XCircle className="w-4 h-4 text-rose-500" />,
                            destructive: true,
                            onClick: () => setRejectModalCandidate(cand),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* High-Capacity Pagination Footer */}
        {filteredCandidates.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-slate-50/75 dark:bg-surface-dark-bg/60 border-t border-slate-200 dark:border-surface-dark-border text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-2 rounded-control bg-white dark:bg-surface-dark-input text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-surface-dark-border"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>
                Showing {Math.min((currentPage - 1) * pageSize + 1, filteredCandidates.length)} -{' '}
                {Math.min(currentPage * pageSize, filteredCandidates.length)} of {filteredCandidates.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="px-2 font-medium text-slate-700 dark:text-slate-300">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
      )}

      {/* Candidate Deep Profile Drawer/Modal */}
      {selectedCandidate && (
        <Modal
          isOpen={!!selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          title={
            <div className="flex items-center gap-3">
              <img
                src={selectedCandidate.avatar}
                alt={selectedCandidate.name}
                className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
              />
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {selectedCandidate.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedCandidate.title} • {selectedCandidate.location}
                </p>
              </div>
            </div>
          }
          size="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setRejectModalCandidate(selectedCandidate);
                    setSelectedCandidate(null);
                  }}
                >
                  Reject
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    handleStatusChange(selectedCandidate.id, 'Shortlisted');
                    setSelectedCandidate(null);
                  }}
                >
                  Shortlist
                </Button>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  handleStatusChange(selectedCandidate.id, 'Interview');
                  setSelectedCandidate(null);
                  onNavigate('interviews');
                }}
                leftIcon={<Calendar className="w-4 h-4" />}
              >
                Schedule Interview
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-4 rounded-card bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200 dark:border-surface-dark-border flex items-center justify-between">
              <MatchScore score={selectedCandidate.aiScore} variant="circle" />
              <div className="text-right">
                <span className="text-xs text-slate-400">Compensation Expectation</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedCandidate.salaryExpectation}
                </p>
                <span className="text-xs text-slate-400">{selectedCandidate.education}</span>
              </div>
            </div>

            <div className="space-y-1">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Professional Overview
              </h5>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed p-3 rounded-control bg-white dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border">
                {selectedCandidate.summary}
              </p>
            </div>

            <div className="space-y-1">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Extracted Skills
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {selectedCandidate.skills.map((s, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-xs rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60 font-medium"
                  >
                    {s.name} ({s.level})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modal for Rejection */}
      {rejectModalCandidate && (
        <Modal
          isOpen={!!rejectModalCandidate}
          onClose={() => setRejectModalCandidate(null)}
          title="Confirm Rejection"
          description={`Are you sure you want to reject ${rejectModalCandidate.name} for ${rejectModalCandidate.appliedJob}?`}
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setRejectModalCandidate(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmRejection}>
                Reject Candidate
              </Button>
            </>
          }
        >
          <p className="text-xs text-slate-600 dark:text-slate-400">
            This will move the candidate's status to <strong>Rejected</strong>. They will receive a respectful notification update.
          </p>
        </Modal>
      )}
    </div>
  );
};
