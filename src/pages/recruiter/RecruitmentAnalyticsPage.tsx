import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { api } from '../../services/api';
import type { RecruitmentAnalyticsData } from '../../types';
import {
  TrendingUp,
  Calendar,
  Sparkles,
  Layers,
  PieChart,
  Award,
} from 'lucide-react';

interface RecruitmentAnalyticsPageProps {
  onNavigate?: (path: string, params?: Record<string, any>) => void;
}

export const RecruitmentAnalyticsPage: React.FC<RecruitmentAnalyticsPageProps> = ({ onNavigate }) => {
  const [data, setData] = useState<RecruitmentAnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [jobId, setJobId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await api.getRecruitmentAnalytics({
        dateRange,
        jobId: jobId !== 'all' ? jobId : undefined,
      });
      if (res.success) {
        setData(res.data);
      }
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, jobId]);

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Recruitment Analytics & Insights
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              Live DB Aggregations
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Data-driven performance metrics, hiring velocity, AI match quality distributions, and interview outcomes.
          </p>
        </div>

        {/* Filters Strip */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {data?.jobs && data.jobs.length > 0 && (
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              aria-label="Filter by Job Posting"
              className="h-8 px-2.5 rounded-control text-xs font-semibold bg-white dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All Job Postings</option>
              {data.jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          )}

          {/* Date Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-surface-dark-card p-1 rounded-control border border-slate-200 dark:border-surface-dark-border">
            {(
              [
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
                { id: '90d', label: '90 Days' },
                { id: 'all', label: 'All Time' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setDateRange(t.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-control transition-all ${
                  dateRange === t.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4 py-8 animate-pulse">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="h-24 rounded-card bg-slate-100 dark:bg-surface-dark-card" />
            <div className="h-24 rounded-card bg-slate-100 dark:bg-surface-dark-card" />
            <div className="h-24 rounded-card bg-slate-100 dark:bg-surface-dark-card" />
            <div className="h-24 rounded-card bg-slate-100 dark:bg-surface-dark-card" />
          </div>
          <div className="h-64 rounded-card bg-slate-100 dark:bg-surface-dark-card" />
        </div>
      ) : !data ? (
        <EmptyState
          icon={<TrendingUp className="w-10 h-10 text-slate-300 dark:text-slate-600" />}
          title="No analytics data available"
          description="Analytics will automatically compute as candidates apply to your job postings."
        />
      ) : (
        <>
          {/* Executive Overview KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            <Card padding="sm" className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Postings</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{data.overview.activeJobs}</div>
              <p className="text-[11px] text-slate-400">{data.overview.totalJobs} total created</p>
            </Card>

            <Card padding="sm" className="space-y-1">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Applications</span>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.overview.totalApplications}</div>
              <p className="text-[11px] text-slate-400">{data.overview.underReview} in review</p>
            </Card>

            <Card padding="sm" className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Shortlisted Talent</span>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{data.overview.shortlisted}</div>
              <p className="text-[11px] text-slate-400">
                {data.overview.totalApplications > 0
                  ? `${Math.round((data.overview.shortlisted / data.overview.totalApplications) * 100)}% conversion`
                  : '0% conversion'}
              </p>
            </Card>

            <Card padding="sm" className="space-y-1">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Interview Sessions</span>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{data.overview.totalInterviews}</div>
              <p className="text-[11px] text-slate-400">{data.overview.completedInterviews} completed</p>
            </Card>

            <Card padding="sm" className="space-y-1 col-span-2 sm:col-span-4 lg:col-span-1 border-brand-200 dark:border-brand-800 bg-brand-50/30 dark:bg-brand-950/20">
              <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Avg Match Score
              </span>
              <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">{data.overview.averageMatchScore}%</div>
              <p className="text-[11px] text-slate-400">
                {data.overview.averageMatchScore >= 80
                  ? 'High quality pipeline'
                  : data.overview.averageMatchScore >= 60
                  ? 'Good talent alignment'
                  : 'Developing pipeline'}
              </p>
            </Card>
          </div>

          {/* Charts Grid: Application Trend & Pipeline Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Application Volume Trend */}
            <Card padding="md" className="lg:col-span-2 space-y-4">
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-brand-600" />
                      Application Volume Over Time
                    </CardTitle>
                    <CardDescription>
                      Daily candidate submission trends for selected period ({dateRange})
                    </CardDescription>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {data.applicationTrend.reduce((acc, curr) => acc + curr.count, 0)} total in range
                  </span>
                </div>
              </CardHeader>

              {/* Accessible CSS Bar Chart */}
              <div className="space-y-2 pt-2">
                <div className="h-44 flex items-end gap-1 sm:gap-2 px-2 border-b border-slate-200 dark:border-surface-dark-border pb-1">
                  {data.applicationTrend.map((pt, idx) => {
                    const maxCount = Math.max(...data.applicationTrend.map((p) => p.count), 1);
                    const heightPct = Math.max(Math.round((pt.count / maxCount) * 100), 4);
                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
                      >
                        {/* Hover Tooltip */}
                        <div className="absolute -top-8 bg-slate-900 text-white text-[10px] py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          {pt.label}: {pt.count} apps
                        </div>
                        <div
                          className={`w-full rounded-t transition-all ${
                            pt.count > 0
                              ? 'bg-brand-500 dark:bg-brand-400 group-hover:bg-brand-600'
                              : 'bg-slate-100 dark:bg-surface-dark-bg'
                          }`}
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* X-Axis labels */}
                <div className="flex justify-between text-[10px] text-slate-400 px-2 pt-1 font-medium">
                  <span>{data.applicationTrend[0]?.label}</span>
                  <span>{data.applicationTrend[Math.floor(data.applicationTrend.length / 2)]?.label}</span>
                  <span>{data.applicationTrend[data.applicationTrend.length - 1]?.label}</span>
                </div>
              </div>
            </Card>

            {/* 2. Pipeline Status Breakdown */}
            <Card padding="md" className="space-y-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-indigo-600" />
                  Application Pipeline Status
                </CardTitle>
                <CardDescription>
                  Distribution across recruitment stages
                </CardDescription>
              </CardHeader>

              <div className="space-y-3 pt-2">
                {data.statusDistribution.map((st) => (
                  <div key={st.status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {st.status}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {st.count} ({st.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-surface-dark-bg overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          st.status === 'Shortlisted'
                            ? 'bg-emerald-500'
                            : st.status === 'Under Review'
                            ? 'bg-amber-500'
                            : st.status === 'Applied'
                            ? 'bg-blue-500'
                            : st.status === 'Rejected'
                            ? 'bg-rose-500'
                            : 'bg-slate-400'
                        }`}
                        style={{ width: `${st.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Second Row: AI Match Score Distribution & Interview Velocity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Match Quality Distribution */}
            <Card padding="md" className="space-y-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-600" />
                  AI Match Score Distribution
                </CardTitle>
                <CardDescription>
                  Resume-to-Job alignment across applicant pool (Phase 6 Engine)
                </CardDescription>
              </CardHeader>

              <div className="space-y-3 pt-1">
                {data.scoreDistribution.map((sc) => (
                  <div key={sc.range} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white">{sc.label}</span>
                        <span className="text-[11px] text-slate-400">({sc.range})</span>
                      </div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {sc.count} applicants ({sc.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-surface-dark-bg overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          sc.label === 'Strong Match'
                            ? 'bg-emerald-500'
                            : sc.label === 'Good Match'
                            ? 'bg-blue-500'
                            : sc.label === 'Partial Match'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${sc.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Interview Metrics */}
            <Card padding="md" className="space-y-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  Interview Outcomes & Velocity
                </CardTitle>
                <CardDescription>
                  Session execution and completion rates
                </CardDescription>
              </CardHeader>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-card bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-100 dark:border-surface-dark-border space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Active Scheduled</span>
                  <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    {data.interviewMetrics.scheduled + data.interviewMetrics.rescheduled}
                  </div>
                  <p className="text-[11px] text-slate-400">{data.interviewMetrics.rescheduled} rescheduled</p>
                </div>

                <div className="p-3 rounded-card bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-100 dark:border-surface-dark-border space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Conducted</span>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {data.interviewMetrics.completed}
                  </div>
                  <p className="text-[11px] text-slate-400">Successful sessions</p>
                </div>

                <div className="p-3 rounded-card bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-100 dark:border-surface-dark-border space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Cancelled / No Show</span>
                  <div className="text-xl font-bold text-rose-600 dark:text-rose-400">
                    {data.interviewMetrics.cancelled + data.interviewMetrics.noShow}
                  </div>
                  <p className="text-[11px] text-slate-400">{data.interviewMetrics.noShow} no show</p>
                </div>

                <div className="p-3 rounded-card bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-100 dark:border-surface-dark-border space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Completion Rate</span>
                  <div className="text-xl font-bold text-brand-600 dark:text-brand-400">
                    {data.interviewMetrics.completionRate}%
                  </div>
                  <p className="text-[11px] text-slate-400">Efficiency rating</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Job Performance Summary Table */}
          <Card padding="md" className="space-y-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-600" />
                Job Posting Performance Summary
              </CardTitle>
              <CardDescription>
                Recruitment metrics broken down by individual job posting
              </CardDescription>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-surface-dark-bg text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-surface-dark-border">
                  <tr>
                    <th className="py-2.5 px-3">Job Posting Title</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-center">Applicants</th>
                    <th className="py-2.5 px-3 text-center">Shortlisted</th>
                    <th className="py-2.5 px-3 text-center">Avg Match</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-surface-dark-border">
                  {data.jobs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        No job postings created yet.
                      </td>
                    </tr>
                  ) : (
                    data.jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-surface-dark-hover/50">
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                          {job.title}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              job.status === 'Published'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : job.status === 'Draft'
                                ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}
                          >
                            {job.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                          {job.applicantsCount}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                          {job.shortlistedCount}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {job.averageScore !== null ? (
                            <span className="font-bold text-brand-600 dark:text-brand-400">
                              {job.averageScore}%
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onNavigate?.('job-applicants', { jobId: job.id })}
                            className="text-xs"
                          >
                            View Pipeline
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
