import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import {
  KeyRound,
  Sun,
  Moon,
  LogOut,
  ShieldCheck,
  Lock,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, role, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await api.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      if (res.success) {
        showToast('success', 'Password changed successfully!', 'Your account security credentials were updated.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Unable to update password.');
      showToast('error', err.message || 'Failed to update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="pb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Account Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your account credentials, security preferences, and workspace appearance.
        </p>
      </div>

      {/* 1. Account Information */}
      <Card padding="md">
        <CardHeader>
          <div>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Basic identity credentials linked to your Resumio session
            </CardDescription>
          </div>
          <Badge variant="purple" size="md">
            {role?.toUpperCase()}
          </Badge>
        </CardHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-control bg-slate-50 dark:bg-surface-dark-bg border border-slate-200/70 dark:border-surface-dark-border/70 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">
              Registered Name
            </span>
            <p className="font-semibold text-sm text-slate-900 dark:text-white">
              {user?.name || 'User'}
            </p>
          </div>

          <div className="p-3.5 rounded-control bg-slate-50 dark:bg-surface-dark-bg border border-slate-200/70 dark:border-surface-dark-border/70 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">
              Email Address
            </span>
            <p className="font-semibold text-sm text-slate-900 dark:text-white">
              {user?.email}
            </p>
          </div>

          {user?.company && (
            <div className="p-3.5 rounded-control bg-slate-50 dark:bg-surface-dark-bg border border-slate-200/70 dark:border-surface-dark-border/70 space-y-1 sm:col-span-2">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                Company Workspace
              </span>
              <p className="font-semibold text-sm text-slate-900 dark:text-white">
                {user?.company}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* 2. Change Password */}
      <Card padding="md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-brand-500" />
            <div>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your account password. Securely encrypted with bcrypt hash.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleChangePassword} className="space-y-4 pt-1 max-w-lg">
          {passwordError && (
            <div className="p-3 rounded-control bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
              {passwordError}
            </div>
          )}

          <Input
            label="Current Password *"
            type="password"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <Input
            label="New Password *"
            type="password"
            placeholder="Min 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <Input
            label="Confirm New Password *"
            type="password"
            placeholder="Repeat new password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <Button
            type="submit"
            variant="primary"
            isLoading={isChangingPassword}
            leftIcon={<ShieldCheck className="w-4 h-4" />}
          >
            Update Password
          </Button>
        </form>
      </Card>

      {/* 3. Theme Appearance Preferences */}
      <Card padding="md">
        <CardHeader>
          <div>
            <CardTitle>Workspace Theme</CardTitle>
            <CardDescription>
              Select your preferred visual appearance mode
            </CardDescription>
          </div>
        </CardHeader>

        <div className="grid grid-cols-2 gap-4 max-w-md pt-1">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-card border-2 text-left transition-all flex items-center gap-3 ${
              theme === 'light'
                ? 'border-brand-600 bg-brand-50/60 dark:bg-brand-950/40 shadow-xs'
                : 'border-slate-200 dark:border-surface-dark-border bg-white dark:bg-surface-dark-card hover:bg-slate-50'
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Light Mode</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Clean neutral workspace</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-card border-2 text-left transition-all flex items-center gap-3 ${
              theme === 'dark'
                ? 'border-brand-600 bg-brand-50/60 dark:bg-brand-950/40 shadow-xs'
                : 'border-slate-200 dark:border-surface-dark-border bg-white dark:bg-surface-dark-card hover:bg-slate-50'
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-400 flex items-center justify-center shrink-0">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Dark Mode</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Charcoal SaaS surface</p>
            </div>
          </button>
        </div>
      </Card>

      {/* 4. Session & Logout */}
      <Card padding="md" className="border-rose-200/60 dark:border-rose-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-rose-700 dark:text-rose-400">
              Sign Out of Session
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Terminates your current JWT authenticated session on this browser.
            </p>
          </div>

          <Button
            variant="destructive"
            onClick={logout}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Log Out
          </Button>
        </div>
      </Card>
    </div>
  );
};
