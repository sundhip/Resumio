import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  User,
  Building2,
  Lock,
  Mail,
  Sun,
  Moon,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, adminLogin, registerCandidate, registerRecruiter, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  // Mode & Role State
  const [roleMode, setRoleMode] = useState<'candidate' | 'recruiter' | 'admin'>('candidate');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('rahul.kumar@resumio.ai');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('Candidate123!');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Error & Status
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Forgot Password Modal
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const handleRoleChange = (newRole: 'candidate' | 'recruiter' | 'admin') => {
    setRoleMode(newRole);
    setErrorMessage(null);
    if (newRole === 'admin') {
      setIsRegistering(false);
      setEmail('admin@resumio.ai');
      setPassword('AdminPass123!');
    } else if (newRole === 'candidate') {
      setEmail('rahul.kumar@resumio.ai');
      setPassword('Candidate123!');
    } else {
      setEmail('sarah.j@talentcorp.io');
      setPassword('Recruiter123!');
    }
  };

  const handleDemoFill = (type: 'candidate' | 'recruiter' | 'admin') => {
    setRoleMode(type);
    setIsRegistering(false);
    setErrorMessage(null);
    if (type === 'candidate') {
      setEmail('rahul.kumar@resumio.ai');
      setPassword('Candidate123!');
    } else if (type === 'recruiter') {
      setEmail('sarah.j@talentcorp.io');
      setPassword('Recruiter123!');
    } else {
      setEmail('admin@resumio.ai');
      setPassword('AdminPass123!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (roleMode === 'admin') {
        await adminLogin(email, password);
        showToast('success', 'Welcome Admin!', 'Platform management console loaded.');
        return;
      }

      if (isRegistering) {
        if (password !== confirmPassword) {
          setErrorMessage('Passwords do not match.');
          setIsSubmitting(false);
          return;
        }

        if (password.length < 8) {
          setErrorMessage('Password must be at least 8 characters.');
          setIsSubmitting(false);
          return;
        }

        if (roleMode === 'candidate') {
          await registerCandidate({ fullName, email, password, confirmPassword });
          showToast('success', 'Account created!', 'Welcome to Resumio Candidate Portal.');
        } else if (roleMode === 'recruiter') {
          if (!companyName.trim()) {
            setErrorMessage('Company name is required for recruiter registration.');
            setIsSubmitting(false);
            return;
          }
          await registerRecruiter({ fullName, email, companyName, password, confirmPassword });
          showToast('success', 'Recruiter account created!', 'Welcome to Resumio Recruiter Portal.');
        }
      } else {
        await login(email, password);
        showToast('success', 'Sign in successful!', `Welcome back to Resumio.`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setIsForgotPasswordOpen(false);
    showToast('info', 'Password Reset Email Sent', `Instructions to reset your password have been sent to ${forgotEmail}.`);
    setForgotEmail('');
  };

  return (
    <div className="min-h-screen w-full flex bg-surface-light-bg dark:bg-surface-dark-bg text-slate-900 dark:text-slate-100 transition-colors">
      {/* Left Brand Visual Hero (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-950 via-[#0f1220] to-[#1c1538] text-white p-12 flex-col justify-between relative overflow-hidden border-r border-slate-800/80">
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
              Phase 1
            </span>
          </div>
        </div>

        {/* Central Graphic */}
        <div className="relative z-10 space-y-6 max-w-md my-auto py-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-900/60 border border-brand-500/30 text-brand-300">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            AI Resume Screening & Recruitment Platform
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-white">
            Hire Smarter. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-300">
              Match Better.
            </span>
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed">
            Phase 1 establishes the core authentication, role-based security, candidate profile manager, and recruiter company workspace.
          </p>

          <div className="space-y-3 pt-2">
            {[
              'Enterprise-grade bcrypt password hashing',
              'Role-isolated protected candidate, recruiter & admin portals',
              'Relational profile management with dynamic completion scoring',
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
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Secure Database Foundation
          </span>
        </div>
      </div>

      {/* Right Form Area */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-12 max-w-xl mx-auto w-full">
        {/* Top Header with Theme Switcher */}
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
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>

        {/* Center Auth Card */}
        <div className="space-y-5 my-auto">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {roleMode === 'admin'
                ? 'Admin Security Portal'
                : isRegistering
                ? `Create ${roleMode === 'candidate' ? 'Candidate' : 'Recruiter'} Account`
                : `Welcome to Resumio`}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {roleMode === 'admin'
                ? 'Authorized administrator login with restricted access'
                : isRegistering
                ? 'Enter your basic details to initialize your recruitment profile'
                : 'Sign in to access your role-specific dashboard and profile'}
            </p>
          </div>

          {/* Role Switcher Cards */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleRoleChange('candidate')}
              className={`p-2.5 rounded-card border text-left transition-all ${
                roleMode === 'candidate'
                  ? 'border-brand-600 bg-brand-50/70 dark:bg-brand-950/60 shadow-xs'
                  : 'border-slate-200 dark:border-surface-dark-border bg-white dark:bg-surface-dark-card hover:bg-slate-50 dark:hover:bg-surface-dark-hover'
              }`}
            >
              <User className="w-4 h-4 text-brand-600 dark:text-brand-400 mb-1" />
              <p className="text-xs font-bold text-slate-900 dark:text-white">Candidate</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Job seeker</p>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('recruiter')}
              className={`p-2.5 rounded-card border text-left transition-all ${
                roleMode === 'recruiter'
                  ? 'border-brand-600 bg-brand-50/70 dark:bg-brand-950/60 shadow-xs'
                  : 'border-slate-200 dark:border-surface-dark-border bg-white dark:bg-surface-dark-card hover:bg-slate-50 dark:hover:bg-surface-dark-hover'
              }`}
            >
              <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mb-1" />
              <p className="text-xs font-bold text-slate-900 dark:text-white">Recruiter</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Employer</p>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('admin')}
              className={`p-2.5 rounded-card border text-left transition-all ${
                roleMode === 'admin'
                  ? 'border-brand-600 bg-brand-50/70 dark:bg-brand-950/60 shadow-xs'
                  : 'border-slate-200 dark:border-surface-dark-border bg-white dark:bg-surface-dark-card hover:bg-slate-50 dark:hover:bg-surface-dark-hover'
              }`}
            >
              <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400 mb-1" />
              <p className="text-xs font-bold text-slate-900 dark:text-white">Admin</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Platform</p>
            </button>
          </div>

          {/* Quick Demo Fill Buttons */}
          <div className="p-3 rounded-control bg-slate-50 dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Quick Test Demo:
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => handleDemoFill('candidate')}
                className="px-2 py-1 text-[11px] font-medium rounded bg-white dark:bg-surface-dark-bg border border-slate-200 dark:border-surface-dark-border hover:border-brand-500 text-slate-700 dark:text-slate-300"
              >
                Candidate
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('recruiter')}
                className="px-2 py-1 text-[11px] font-medium rounded bg-white dark:bg-surface-dark-bg border border-slate-200 dark:border-surface-dark-border hover:border-brand-500 text-slate-700 dark:text-slate-300"
              >
                Recruiter
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('admin')}
                className="px-2 py-1 text-[11px] font-medium rounded bg-white dark:bg-surface-dark-bg border border-slate-200 dark:border-surface-dark-border hover:border-brand-500 text-slate-700 dark:text-slate-300"
              >
                Admin
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-control bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegistering && (
              <Input
                label="Full Name"
                placeholder="e.g. Alex Morgan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />
            )}

            {isRegistering && roleMode === 'recruiter' && (
              <Input
                label="Company Name"
                placeholder="e.g. CloudScale Technologies"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                leftIcon={<Building2 className="w-4 h-4" />}
                required
              />
            )}

            <Input
              label="Email Address"
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
                {!isRegistering && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                type="password"
                placeholder={isRegistering ? 'Min 8 characters' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
            </div>

            {isRegistering && (
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
            )}

            {!isRegistering && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="remember-me" className="text-xs text-slate-600 dark:text-slate-400 select-none">
                  Remember me on this device
                </label>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              size="lg"
              isLoading={isSubmitting || isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {roleMode === 'admin'
                ? 'Sign In to Admin Portal'
                : isRegistering
                ? `Create ${roleMode === 'candidate' ? 'Candidate' : 'Recruiter'} Account`
                : `Sign In as ${roleMode === 'candidate' ? 'Candidate' : 'Recruiter'}`}
            </Button>
          </form>

          {/* Toggle between Register and Login (Candidate & Recruiter only) */}
          {roleMode !== 'admin' && (
            <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
              {isRegistering ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(false);
                      setErrorMessage(null);
                    }}
                    className="text-brand-600 dark:text-brand-400 font-semibold hover:underline"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(true);
                      setErrorMessage(null);
                    }}
                    className="text-brand-600 dark:text-brand-400 font-semibold hover:underline"
                  >
                    Create {roleMode} account
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-400 pt-6">
          Resumio AI Recruitment Platform • Phase 1 Security Architecture
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        title="Reset Account Password"
        description="Enter the email address associated with your Resumio account to receive password reset instructions."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsForgotPasswordOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleForgotPasswordSubmit}>
              Send Reset Link
            </Button>
          </>
        }
      >
        <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
          <Input
            label="Account Email"
            type="email"
            placeholder="you@company.com"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />
        </form>
      </Modal>
    </div>
  );
};
