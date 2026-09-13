import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import type { JobPosting, JobFilterParams, WorkMode, JobEmploymentType } from '../../types';
import {
  Briefcase,
  Search,
  MapPin,
  DollarSign,
  Filter,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Building2,
  GraduationCap,
  ArrowRight,
} from 'lucide-react';

interface CandidateJobsPageProps {
  onNavigate: (path: string, params?: Record<string, any>) => void;
}

export const CandidateJobsPage: React.FC<CandidateJobsPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();

  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkModes, setSelectedWorkModes] = useState<WorkMode[]>([]);
  const [selectedEmploymentTypes, setSelectedEmploymentTypes] = useState<JobEmploymentType[]>([]);
  const [locationFilter, setLocationFilter] = useState('');
  const [minExpFilter, setMinExpFilter] = useState<string>('');
  const [maxExpFilter, setMaxExpFilter] = useState<string>('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillSearchInput, setSkillSearchInput] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'salary_high' | 'salary_low'>('newest');

  // Mobile filters drawer open/close
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const fetchJobs = useCallback(async (pageToLoad: number = 1) => {
    setIsLoading(true);
    try {
      const params: JobFilterParams = {
        page: pageToLoad,
        limit: 10,
        sort: sortBy
      };

      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (selectedWorkModes.length > 0) params.work_mode = selectedWorkModes.join(',');
      if (selectedEmploymentTypes.length > 0) params.employment_type = selectedEmploymentTypes.join(',');
      if (locationFilter.trim()) params.location = locationFilter.trim();
      if (minExpFilter) params.min_exp = parseInt(minExpFilter, 10);
      if (maxExpFilter) params.max_exp = parseInt(maxExpFilter, 10);
      if (selectedSkills.length > 0) params.skills = selectedSkills.join(',');

      const res = await api.getPublicJobs(params);
      if (res.success) {
        setJobs(res.jobs);
        setTotalCount(res.total);
        setTotalPages(res.totalPages);
        setCurrentPage(res.page);
      }
    } catch (err: any) {
      showToast('error', 'Failed to discover jobs', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [
    searchQuery,
    selectedWorkModes,
    selectedEmploymentTypes,
    locationFilter,
    minExpFilter,
    maxExpFilter,
    selectedSkills,
    sortBy
  ]);

  useEffect(() => {
    fetchJobs(1);
  }, [fetchJobs]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedWorkModes([]);
    setSelectedEmploymentTypes([]);
    setLocationFilter('');
    setMinExpFilter('');
    setMaxExpFilter('');
    setSelectedSkills([]);
    setSortBy('newest');
  };

  const hasActiveFilters =
    searchQuery ||
    selectedWorkModes.length > 0 ||
    selectedEmploymentTypes.length > 0 ||
    locationFilter ||
    minExpFilter ||
    maxExpFilter ||
    selectedSkills.length > 0;

  const toggleWorkMode = (mode: WorkMode) => {
    setSelectedWorkModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
    );
  };

  const toggleEmploymentType = (type: JobEmploymentType) => {
    setSelectedEmploymentTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleAddSkill = (skill: string) => {
    const s = skill.trim();
    if (!s) return;
    if (!selectedSkills.some((sk) => sk.toLowerCase() === s.toLowerCase())) {
      setSelectedSkills([...selectedSkills, s]);
    }
    setSkillSearchInput('');
  };

  const handleRemoveSkill = (skill: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s !== skill));
  };

  const formatSalary = (job: JobPosting) => {
    if (!job.salary_disclosed || (!job.salary_min && !job.salary_max)) {
      return null;
    }
    const curr = job.currency || 'USD';
    const period = job.salary_period ? `/${job.salary_period.toLowerCase()}` : '';
    if (job.salary_min && job.salary_max) {
      return `${curr} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} ${period}`;
    }
    if (job.salary_min) {
      return `From ${curr} ${job.salary_min.toLocaleString()} ${period}`;
    }
    return `Up to ${curr} ${job.salary_max?.toLocaleString()} ${period}`;
  };

  const formatRelativeTime = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-16">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              <Briefcase className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Explore Job Opportunities
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Discover verified roles matching your skills, career experience, and location preferences.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('recommendations')}
            className="gap-2 border-brand-200 dark:border-brand-800/60 text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-950/40"
          >
            <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            Profile Recommendations
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterDrawerOpen(true)}
            className="lg:hidden gap-1.5"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters {hasActiveFilters && '(Active)'}
          </Button>
        </div>
      </div>

      {/* Main Search & Sort Bar */}
      <Card className="p-4 bg-white dark:bg-surface-dark-card border-slate-200/80 dark:border-surface-dark-border shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, skills, company name, or keywords..."
              className="w-full pl-10 pr-4 py-2.5 rounded-control bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200 dark:border-surface-dark-border text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <select
              className="px-3.5 py-2.5 rounded-control bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200 dark:border-surface-dark-border text-xs sm:text-sm text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="salary_high">Highest Salary</option>
              <option value="salary_low">Lowest Salary</option>
            </select>

            <Button type="submit" variant="primary" size="md" className="gap-1.5 px-5">
              Search
            </Button>
          </div>
        </form>
      </Card>

      {/* Main Grid: Filters Sidebar + Job Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Desktop Sidebar Filters */}
        <div className="hidden lg:block lg:col-span-1 space-y-5">
          <Card className="p-4 bg-white dark:bg-surface-dark-card border-slate-200/80 dark:border-surface-dark-border">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-surface-dark-border mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-brand-600" /> Filters
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                >
                  Reset All
                </button>
              )}
            </div>

            {/* Work Mode */}
            <div className="space-y-2 mb-5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Work Mode
              </span>
              {(['Remote', 'Hybrid', 'On-site'] as WorkMode[]).map((mode) => (
                <label key={mode} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedWorkModes.includes(mode)}
                    onChange={() => toggleWorkMode(mode)}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                  />
                  <span>{mode}</span>
                </label>
              ))}
            </div>

            {/* Employment Type */}
            <div className="space-y-2 mb-5 pt-4 border-t border-slate-100 dark:border-surface-dark-border">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Employment Type
              </span>
              {(['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'] as JobEmploymentType[]).map((type) => (
                <label key={type} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedEmploymentTypes.includes(type)}
                    onChange={() => toggleEmploymentType(type)}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>

            {/* Experience (Years) */}
            <div className="space-y-2 mb-5 pt-4 border-t border-slate-100 dark:border-surface-dark-border">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Experience (Years)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Min</span>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={minExpFilter}
                    onChange={(e) => setMinExpFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-control bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200 dark:border-surface-dark-border text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Max</span>
                  <input
                    type="number"
                    min={0}
                    placeholder="10"
                    value={maxExpFilter}
                    onChange={(e) => setMaxExpFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-control bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200 dark:border-surface-dark-border text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2 mb-5 pt-4 border-t border-slate-100 dark:border-surface-dark-border">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Location
              </span>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. San Francisco, CA"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-control bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200 dark:border-surface-dark-border text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400"
                />
              </div>
            </div>

            {/* Skills Filter */}
            <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-surface-dark-border">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Skills Filter
              </span>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="e.g. React"
                  value={skillSearchInput}
                  onChange={(e) => setSkillSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill(skillSearchInput);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 rounded-control bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200 dark:border-surface-dark-border text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddSkill(skillSearchInput)}
                  className="px-2 py-1 text-xs shrink-0"
                >
                  Add
                </Button>
              </div>

              {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {selectedSkills.map((sk) => (
                    <span
                      key={sk}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60"
                    >
                      {sk}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(sk)}
                        className="hover:text-rose-500 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Listings Main Column */}
        <div className="lg:col-span-3 space-y-4">
          {/* Results meta bar */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Showing <span className="text-slate-900 dark:text-white font-bold">{totalCount}</span> open {totalCount === 1 ? 'position' : 'positions'}
            </span>
            {hasActiveFilters && (
              <span className="text-[11px] font-medium text-brand-600 dark:text-brand-400">
                Filtered search active
              </span>
            )}
          </div>

          {/* Loading Skeleton */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-5 animate-pulse space-y-3 bg-white dark:bg-surface-dark-card">
                  <div className="h-5 bg-slate-200 dark:bg-surface-dark-border rounded w-1/3" />
                  <div className="h-4 bg-slate-100 dark:bg-surface-dark-border/60 rounded w-1/4" />
                  <div className="h-3 bg-slate-100 dark:bg-surface-dark-border/40 rounded w-3/4" />
                  <div className="flex gap-2 pt-2">
                    <div className="h-6 w-16 bg-slate-200 dark:bg-surface-dark-border rounded-full" />
                    <div className="h-6 w-16 bg-slate-200 dark:bg-surface-dark-border rounded-full" />
                  </div>
                </Card>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <Card className="p-12 text-center bg-white dark:bg-surface-dark-card border-dashed">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-surface-dark-border flex items-center justify-center mx-auto text-slate-400 mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No jobs match your criteria</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
                Try adjusting your search keywords, broadening your experience filter, or resetting applied filters.
              </p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  Clear All Filters
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-3.5">
              {jobs.map((job) => {
                const salaryStr = formatSalary(job);
                return (
                  <Card
                    key={job.id}
                    className="p-5 hover:border-brand-300 dark:hover:border-brand-800/80 transition-all duration-200 group bg-white dark:bg-surface-dark-card cursor-pointer"
                    onClick={() => onNavigate('job-details', { jobId: job.id })}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                            {job.title}
                          </h2>
                          <Badge variant="primary" className="text-[10px] uppercase">
                            {job.work_mode}
                          </Badge>
                          <Badge variant="default" className="text-[10px]">
                            {job.employment_type}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-brand-600" />
                            {job.company_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {job.location}
                          </span>
                          {(job.min_experience !== null || job.max_experience !== null) && (
                            <span className="flex items-center gap-1">
                              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                              {job.min_experience ?? 0}
                              {job.max_experience ? ` - ${job.max_experience} yrs` : '+ yrs'}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 pt-1 leading-relaxed">
                          {job.description}
                        </p>

                        {/* Skills Chips */}
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {job.required_skills?.slice(0, 4).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/40"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.preferred_skills?.slice(0, 2).map((skill, idx) => (
                            <span
                              key={`p-${idx}`}
                              className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-surface-dark-border text-slate-600 dark:text-slate-300"
                            >
                              {skill}
                            </span>
                          ))}
                          {((job.required_skills?.length || 0) + (job.preferred_skills?.length || 0)) > 6 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium text-slate-400">
                              +{(job.required_skills?.length || 0) + (job.preferred_skills?.length || 0) - 6} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right column: Salary & Action */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-surface-dark-border">
                        {salaryStr && (
                          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            {salaryStr}
                          </div>
                        )}
                        <span className="text-[11px] text-slate-400">
                          {formatRelativeTime(job.published_at || job.created_at)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/50"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('job-details', { jobId: job.id });
                          }}
                        >
                          View Role <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-surface-dark-border">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1 || isLoading}
                onClick={() => fetchJobs(currentPage - 1)}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </Button>

              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Page <span className="font-bold text-slate-900 dark:text-white">{currentPage}</span> of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages || isLoading}
                onClick={() => fetchJobs(currentPage + 1)}
                className="gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Modal */}
      <Modal
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Search & Discovery Filters"
        size="md"
      >
        <div className="space-y-4">
          {/* Work Mode */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Work Mode
            </span>
            <div className="flex flex-wrap gap-2">
              {(['Remote', 'Hybrid', 'On-site'] as WorkMode[]).map((mode) => (
                <label key={mode} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 p-2 rounded-control border border-slate-200 dark:border-surface-dark-border cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedWorkModes.includes(mode)}
                    onChange={() => toggleWorkMode(mode)}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>{mode}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Employment Type */}
          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-surface-dark-border">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Employment Type
            </span>
            <div className="flex flex-wrap gap-2">
              {(['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'] as JobEmploymentType[]).map((type) => (
                <label key={type} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 p-2 rounded-control border border-slate-200 dark:border-surface-dark-border cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEmploymentTypes.includes(type)}
                    onChange={() => toggleEmploymentType(type)}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-surface-dark-border">
            {hasActiveFilters ? (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Clear All
              </Button>
            ) : <div />}

            <Button variant="primary" size="sm" onClick={() => setIsFilterDrawerOpen(false)}>
              Apply Filters
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
