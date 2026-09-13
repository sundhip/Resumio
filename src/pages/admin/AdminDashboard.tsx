import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Tabs } from '../../components/ui/Tabs';
import { ApplicationStatusBadge } from '../../components/applications/ApplicationStatusBadge';
import type {
  AdminStats,
  AdminUserItem,
  AdminJobItem,
  AdminApplicationItem,
  AdminSystemHealth,
} from '../../types';
import {
  Users,
  User,
  Building2,
  RefreshCw,
  Briefcase,
  Database,
  Search,
  Activity,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'jobs' | 'applications'>('overview');
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    candidatesCount: 0,
    recruitersCount: 0,
    activeUsersCount: 0,
    jobsCount: 0,
    applicationsCount: 0,
    interviewsCount: 0,
  });
  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
  const [jobsList, setJobsList] = useState<AdminJobItem[]>([]);
  const [appsList, setAppsList] = useState<AdminApplicationItem[]>([]);
  const [systemHealth, setSystemHealth] = useState<AdminSystemHealth | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { showToast } = useToast();

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, usersRes, jobsRes, appsRes, sysRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminJobs(),
        api.getAdminApplications(),
        api.getAdminSystemHealth(),
      ]);

      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats);
      }
      if (usersRes.success && usersRes.users) {
        setUsersList(usersRes.users);
      }
      if (jobsRes.success && jobsRes.jobs) {
        setJobsList(jobsRes.jobs);
      }
      if (appsRes.success && appsRes.applications) {
        setAppsList(appsRes.applications);
      }
      if (sysRes.success && sysRes.health) {
        setSystemHealth(sysRes.health);
      }
    } catch (err: any) {
      showToast('error', 'Unable to fetch admin statistics from database.', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Action handlers for toggling User status
  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    setActionLoadingId(userId);
    try {
      const res = await api.toggleAdminUserStatus(userId, nextStatus);
      if (res.success) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u))
        );
        showToast('success', `User status updated to ${nextStatus}.`);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update user status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Action handlers for toggling Job status
  const handleToggleJobStatus = async (jobId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Active' ? 'Closed' : 'Active';
    setActionLoadingId(jobId);
    try {
      const res = await api.toggleAdminJobStatus(jobId, nextStatus);
      if (res.success) {
        setJobsList((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, status: nextStatus } : j))
        );
        showToast('success', `Job status updated to ${nextStatus}.`);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update job status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered Lists
  const filteredUsers = usersList.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q) ||
      (u.company || '').toLowerCase().includes(q)
    );
  });

  const filteredJobs = jobsList.filter((j) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      (j.title || '').toLowerCase().includes(q) ||
      (j.company || '').toLowerCase().includes(q) ||
      (j.recruiterName || '').toLowerCase().includes(q) ||
      (j.location || '').toLowerCase().includes(q)
    );
  });

  const filteredApps = appsList.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      (a.candidateName || '').toLowerCase().includes(q) ||
      (a.jobTitle || '').toLowerCase().includes(q) ||
      (a.company || '').toLowerCase().includes(q) ||
      (a.status || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Admin Platform Console
            </h1>
            <Badge variant="purple" size="sm">
              Root System
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real SQLite database metrics, user accounts, job postings, applications, and system health.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          onClick={loadAdminData}
          isLoading={isLoading}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh Database
        </Button>
      </div>

      {/* Tabs Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Tabs
          activeTab={activeTab}
          onChange={(tab) => {
            setActiveTab(tab as any);
            setSearchQuery('');
          }}
          variant="boxed"
          tabs={[
            { id: 'overview', label: 'Platform Overview' },
            { id: 'users', label: 'User Accounts', count: usersList.length },
            { id: 'jobs', label: 'All Jobs', count: jobsList.length },
            { id: 'applications', label: 'All Applications', count: appsList.length },
          ]}
        />

        {activeTab !== 'overview' && (
          <div className="w-full md:w-80">
            <Input
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
        )}
      </div>

      {/* Tab Content: Platform Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* KPI Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              label="Total Database Users"
              value={stats.totalUsers}
              change="Real DB count"
              trend="neutral"
              icon={<Users className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
            />
            <StatCard
              label="Registered Candidates"
              value={stats.candidatesCount}
              change="Active jobseekers"
              trend="neutral"
              icon={<User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
            />
            <StatCard
              label="Employer Recruiters"
              value={stats.recruitersCount}
              change="Verified accounts"
              trend="neutral"
              icon={<Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
            />
            <StatCard
              label="Active Job Postings"
              value={stats.jobsCount || jobsList.length}
              change="Live in database"
              trend="up"
              icon={<Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* System Database Table Health */}
            <Card padding="md" className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-surface-dark-border pb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    SQLite Database Record Health
                  </h3>
                </div>
                <Badge variant="success" size="sm">
                  {systemHealth?.status.toUpperCase() || 'HEALTHY'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {systemHealth?.tables &&
                  Object.entries(systemHealth.tables).map(([table, count]) => (
                    <div
                      key={table}
                      className="p-3 rounded-control bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200/70 dark:border-surface-dark-border/70"
                    >
                      <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                        {table}
                      </p>
                      <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                        {count}
                      </p>
                    </div>
                  ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card padding="md" className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-surface-dark-border pb-3">
                <Activity className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Quick Console Navigation
                </h3>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('users')}
                  className="w-full p-3 rounded-control bg-slate-50 dark:bg-surface-dark-bg/60 hover:bg-slate-100 dark:hover:bg-surface-dark-hover border border-slate-200/70 dark:border-surface-dark-border/70 flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white transition-colors cursor-pointer"
                >
                  <span>Manage Platform Users</span>
                  <Badge variant="neutral" size="sm">{usersList.length}</Badge>
                </button>

                <button
                  onClick={() => setActiveTab('jobs')}
                  className="w-full p-3 rounded-control bg-slate-50 dark:bg-surface-dark-bg/60 hover:bg-slate-100 dark:hover:bg-surface-dark-hover border border-slate-200/70 dark:border-surface-dark-border/70 flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white transition-colors cursor-pointer"
                >
                  <span>Manage Job Postings</span>
                  <Badge variant="neutral" size="sm">{jobsList.length}</Badge>
                </button>

                <button
                  onClick={() => setActiveTab('applications')}
                  className="w-full p-3 rounded-control bg-slate-50 dark:bg-surface-dark-bg/60 hover:bg-slate-100 dark:hover:bg-surface-dark-hover border border-slate-200/70 dark:border-surface-dark-border/70 flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white transition-colors cursor-pointer"
                >
                  <span>View Candidate Applications</span>
                  <Badge variant="neutral" size="sm">{appsList.length}</Badge>
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab Content: User Management */}
      {activeTab === 'users' && (
        <Card padding="none" className="overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-slate-100 dark:border-surface-dark-border flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                User Management Foundation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Live SQLite database records ({filteredUsers.length} total)
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-surface-dark-border bg-slate-50/75 dark:bg-surface-dark-bg/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-5">User</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-surface-dark-border text-xs sm:text-sm">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No users match your query.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const displayName = u.name || u.email || 'User';
                    const initial = displayName.charAt(0).toUpperCase();
                    const roleName = (u.role || 'user').toUpperCase();

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-surface-dark-hover/50 transition-colors"
                      >
                        <td className="py-3 px-5 font-semibold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-xs shrink-0">
                              {initial}
                            </div>
                            <div>
                              <span>{displayName}</span>
                              {u.company && (
                                <span className="text-[10px] text-slate-400 block -mt-0.5">
                                  {u.company}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                          {u.email || '-'}
                        </td>

                        <td className="py-3 px-4">
                          <Badge
                            variant={u.role === 'admin' ? 'purple' : u.role === 'recruiter' ? 'brand' : 'neutral'}
                            size="sm"
                          >
                            {roleName}
                          </Badge>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                              u.status === 'suspended'
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.status === 'suspended' ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                            />
                            {(u.status || 'active').toUpperCase()}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">
                          {u.createdAt || '-'}
                        </td>

                        <td className="py-3 px-5 text-right">
                          {u.role !== 'admin' && (
                            <Button
                              variant={u.status === 'suspended' ? 'primary' : 'destructive'}
                              size="sm"
                              isLoading={actionLoadingId === u.id}
                              onClick={() => handleToggleUserStatus(u.id, u.status)}
                            >
                              {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab Content: Job Management */}
      {activeTab === 'jobs' && (
        <Card padding="none" className="overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-slate-100 dark:border-surface-dark-border flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Platform Job Postings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                All employer job listings across the platform ({filteredJobs.length} total)
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-surface-dark-border bg-slate-50/75 dark:bg-surface-dark-bg/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-5">Job Title</th>
                  <th className="py-3 px-4">Company & Recruiter</th>
                  <th className="py-3 px-4">Location / Mode</th>
                  <th className="py-3 px-4">Applicants</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-surface-dark-border text-xs sm:text-sm">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No job postings match your query.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((j) => (
                    <tr
                      key={j.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-surface-dark-hover/50 transition-colors"
                    >
                      <td className="py-3 px-5 font-semibold text-slate-900 dark:text-white">
                        <div>
                          <span>{j.title}</span>
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {j.employmentType}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                        <div>
                          <span className="font-semibold">{j.company}</span>
                          <span className="text-[10px] text-slate-400 block">
                            By {j.recruiterName}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">
                        {j.location} ({j.workMode})
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        <Badge variant="brand" size="sm">{j.applicantsCount} Applicants</Badge>
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant={j.status === 'Active' ? 'success' : 'neutral'} size="sm">
                          {j.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-5 text-right">
                        <Button
                          variant={j.status === 'Closed' ? 'primary' : 'secondary'}
                          size="sm"
                          isLoading={actionLoadingId === j.id}
                          onClick={() => handleToggleJobStatus(j.id, j.status)}
                        >
                          {j.status === 'Closed' ? 'Reopen Job' : 'Close Job'}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab Content: Application Management */}
      {activeTab === 'applications' && (
        <Card padding="none" className="overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-slate-100 dark:border-surface-dark-border flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Candidate Applications Audit
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                All submitted applications across candidates and jobs ({filteredApps.length} total)
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-surface-dark-border bg-slate-50/75 dark:bg-surface-dark-bg/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-5">Candidate</th>
                  <th className="py-3 px-4">Position & Company</th>
                  <th className="py-3 px-4">Match Score</th>
                  <th className="py-3 px-4">Pipeline Status</th>
                  <th className="py-3 px-5 text-right">Applied Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-surface-dark-border text-xs sm:text-sm">
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">
                      No applications match your query.
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((a) => (
                    <tr
                      key={a.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-surface-dark-hover/50 transition-colors"
                    >
                      <td className="py-3 px-5 font-semibold text-slate-900 dark:text-white">
                        <div>
                          <span>{a.candidateName}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {a.candidateEmail}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-700 dark:text-slate-300">
                        <div>
                          <span className="font-semibold">{a.jobTitle}</span>
                          <span className="text-[10px] text-slate-400 block">
                            {a.company}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant={a.matchScore >= 80 ? 'success' : a.matchScore >= 60 ? 'brand' : 'warning'}
                          size="sm"
                        >
                          {a.matchScore}% Match
                        </Badge>
                      </td>

                      <td className="py-3 px-4">
                        <ApplicationStatusBadge status={a.status as any} size="sm" showDot />
                      </td>

                      <td className="py-3 px-5 text-right text-xs text-slate-500 dark:text-slate-400">
                        {a.createdAt || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
