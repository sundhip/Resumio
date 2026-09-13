import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import type { AdminStats, AdminUserItem } from '../../types';
import {
  Users,
  User,
  Building2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    candidatesCount: 0,
    recruitersCount: 0,
    activeUsersCount: 0,
  });
  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
      ]);

      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats);
      }
      if (usersRes.success && usersRes.users) {
        setUsersList(usersRes.users);
      }
    } catch {
      showToast('error', 'Unable to fetch admin statistics from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Admin Platform Overview
            </h1>
            <Badge variant="purple" size="sm">
              Root Level
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real database metrics, user accounts, and authentication system health.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          onClick={loadAdminData}
          isLoading={isLoading}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh Data
        </Button>
      </div>

      {/* Real Database KPI Metric Cards */}
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
          change="Active accounts"
          trend="neutral"
          icon={<User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
        />
        <StatCard
          label="Registered Recruiters"
          value={stats.recruitersCount}
          change="Employer accounts"
          trend="neutral"
          icon={<Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
        />
        <StatCard
          label="Active Status Accounts"
          value={stats.activeUsersCount}
          change="100% operational"
          trend="up"
          icon={<ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
        />
      </div>

      {/* User Management Foundation Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-surface-dark-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              User Management Foundation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live SQLite database user table records ({usersList.length} total)
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
                <th className="py-3 px-5 text-right">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-surface-dark-border text-xs sm:text-sm">
              {usersList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    No users loaded.
                  </td>
                </tr>
              ) : (
                usersList.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-surface-dark-hover/50 transition-colors"
                  >
                    <td className="py-3 px-5 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span>{u.name}</span>
                          {u.company && (
                            <span className="text-[10px] text-slate-400 block -mt-0.5">
                              {u.company}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {u.email}
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        variant={u.role === 'admin' ? 'purple' : u.role === 'recruiter' ? 'brand' : 'neutral'}
                        size="sm"
                      >
                        {u.role.toUpperCase()}
                      </Badge>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {u.status}
                      </span>
                    </td>

                    <td className="py-3 px-5 text-right text-xs text-slate-500 dark:text-slate-400">
                      {u.createdAt}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
