import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import type { Role } from '../../types';
import {
  Sparkles,
  CheckCircle2,
  Lock,
  Mail,
  Sun,
  Moon,
  ArrowRight,
} from 'lucide-react';

interface SignInPageProps {
  onSwitchToSignUp: () => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({ onSwitchToSignUp }) => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('rahul.kumar@resumio.ai');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState<Role>('candidate');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, selectedRole);
  };

  const handleQuickDemo = (role: Role) => {
    setSelectedRole(role);
    if (role === 'candidate') {
      setEmail('rahul.kumar@resumio.ai');
    } else if (role === 'recruiter') {
      setEmail('sarah.j@talentcorp.io');
    } else {
      setEmail('alex.admin@resumio.ai');
    }
    login(email, role);
  };

  return (
    <div className="min-h-screen w-full flex bg-surface-light-bg dark:bg-surface-dark-bg text-slate-900 dark:text-slate-100 transition-colors">
      {/* Left Brand Visual Hero (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-950 via-[#0f1220] to-[#1c1538] text-white p-12 flex-col justify-between relative overflow-hidden border-r border-slate-800/80">
        {/* Subtle glow circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-brand-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-control bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-glow-purple">
            R
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight text-white">Resumio</span>
            <span className="text-[10px] ml-2 font-semibold px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
              AI Platform
            </span>
          </div>
        </div>

        {/* Central Showcase Graphic */}
        <div className="relative z-10 space-y-6 max-w-md my-auto py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-900/60 border border-brand-500/30 text-brand-300">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            Next-Generation Resume Intelligence
          </div>

          <h2 className="text-4xl font-extrabold tracking-tight leading-tight text-white">
            Hire Smarter. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-300">
              Match Better.
            </span>
          </h2>

          <p className="text-slate-300 text-sm leading-relaxed">
            Resumio combines deep semantic parsing with multi-dimensional candidate evaluation to eliminate hiring friction.
          </p>

          <div className="space-y-3 pt-2">
            {[
              'Sub-second neural resume screening & skill extraction',
              'Fair, unbiased semantic fit scores with full explainability',
              'Unified workspace for candidates and enterprise recruiters',
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Footer */}
        <div className="relative z-10 text-xs text-slate-400 flex items-center justify-between">
          <span>© 2026 Resumio Technologies Inc.</span>
          <span>Enterprise Grade Security</span>
        </div>
      </div>

      {/* Right Form Area */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-14 max-w-xl mx-auto w-full">
        {/* Top bar with Theme Toggle */}
        <div className="flex items-center justify-between pb-6">
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-control bg-brand-600 flex items-center justify-center text-white font-bold">
              R
            </div>
            <span className="font-bold text-base text-slate-900 dark:text-white">Resumio</span>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-control text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-dark-hover ml-auto transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>

        {/* Center Form Box */}
        <div className="space-y-6 my-auto">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Welcome back
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Sign in to your Resumio recruitment workspace
            </p>
          </div>

          {/* Quick Persona Demo Selector */}
          <div className="p-3 rounded-card bg-slate-50 dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Quick One-Click Demo Sign In:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('candidate')}
                className="py-1.5 px-2 text-xs font-semibold rounded-control bg-white dark:bg-surface-dark-bg border border-slate-200 dark:border-surface-dark-border hover:border-brand-500 text-slate-800 dark:text-slate-200 transition-all text-center"
              >
                Candidate
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('recruiter')}
                className="py-1.5 px-2 text-xs font-semibold rounded-control bg-white dark:bg-surface-dark-bg border border-slate-200 dark:border-surface-dark-border hover:border-brand-500 text-slate-800 dark:text-slate-200 transition-all text-center"
              >
                Recruiter
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="py-1.5 px-2 text-xs font-semibold rounded-control bg-white dark:bg-surface-dark-bg border border-slate-200 dark:border-surface-dark-border hover:border-brand-500 text-slate-800 dark:text-slate-200 transition-all text-center"
              >
                Admin
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <a href="#" className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
                  Forgot password?
                </a>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* Switch to Sign Up */}
          <div className="text-center text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToSignUp}
              className="text-brand-600 dark:text-brand-400 font-semibold hover:underline"
            >
              Create account
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-400 pt-6">
          By continuing, you agree to Resumio's Terms of Service & Privacy Policy.
        </div>
      </div>
    </div>
  );
};
