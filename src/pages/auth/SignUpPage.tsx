import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import type { Role } from '../../types';
import {
  User,
  Building2,
  Sun,
  Moon,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface SignUpPageProps {
  onSwitchToSignIn: () => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onSwitchToSignIn }) => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [selectedRole, setSelectedRole] = useState<Role>('candidate');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email || 'demo@resumio.ai', selectedRole);
  };

  return (
    <div className="min-h-screen w-full flex bg-surface-light-bg dark:bg-surface-dark-bg text-slate-900 dark:text-slate-100 transition-colors">
      {/* Left Brand Area (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-950 via-[#0f1220] to-[#1c1538] text-white p-12 flex-col justify-between relative overflow-hidden border-r border-slate-800/80">
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

        <div className="relative z-10 space-y-6 max-w-md my-auto py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-900/60 border border-brand-500/30 text-brand-300">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            Zero Setup Required
          </div>

          <h2 className="text-4xl font-extrabold tracking-tight leading-tight text-white">
            Transform your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-300">
              recruitment workflow.
            </span>
          </h2>

          <p className="text-slate-300 text-sm leading-relaxed">
            Join thousands of modern tech companies and world-class engineers using Resumio's AI matching platform.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-400">
          © 2026 Resumio Technologies Inc. All rights reserved.
        </div>
      </div>

      {/* Right Form Area */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-14 max-w-xl mx-auto w-full">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4">
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

        {/* Center Registration Form */}
        <div className="space-y-6 my-auto">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Create your account
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Select your role to personalize your workspace experience
            </p>
          </div>

          {/* Role Selection Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => setSelectedRole('candidate')}
              className={`p-4 rounded-card border-2 cursor-pointer transition-all ${
                selectedRole === 'candidate'
                  ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-950/40 shadow-xs'
                  : 'border-slate-200 dark:border-surface-dark-border bg-white dark:bg-surface-dark-card hover:border-slate-300'
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-2">
                <User className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Candidate</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Find your next role & get AI matched
              </p>
            </div>

            <div
              onClick={() => setSelectedRole('recruiter')}
              className={`p-4 rounded-card border-2 cursor-pointer transition-all ${
                selectedRole === 'recruiter'
                  ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-950/40 shadow-xs'
                  : 'border-slate-200 dark:border-surface-dark-border bg-white dark:bg-surface-dark-card hover:border-slate-300'
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
                <Building2 className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Recruiter</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Find great talent & screen with AI
              </p>
            </div>
          </div>

          {/* Inputs */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <Input
              label="Full Name"
              placeholder="e.g. Rahul Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {selectedRole === 'recruiter' && (
              <Input
                label="Company Name"
                placeholder="e.g. Nexus AI Technologies"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              Create {selectedRole === 'candidate' ? 'Candidate' : 'Recruiter'} Account
            </Button>
          </form>

          {/* Switch to Sign In */}
          <div className="text-center text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <button
              onClick={onSwitchToSignIn}
              className="text-brand-600 dark:text-brand-400 font-semibold hover:underline"
            >
              Sign in
            </button>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-400 pt-4">
          By signing up, you agree to Resumio's Terms of Service & Privacy Policy.
        </div>
      </div>
    </div>
  );
};
