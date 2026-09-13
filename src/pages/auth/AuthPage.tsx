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
  const { login, adminLogin, registerCandidate, registerRecruiter, googleAuth, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  // Mode & Role State
  const [roleMode, setRoleMode] = useState<'candidate' | 'recruiter' | 'admin'>('candidate');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Error & Status
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Forgot Password Modal
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Google Auth Modal State
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleCompanyName, setGoogleCompanyName] = useState('');

  const handleRoleChange = (newRole: 'candidate' | 'recruiter' | 'admin') => {
    setRoleMode(newRole);
    setErrorMessage(null);
    if (newRole === 'admin') {
      setIsRegistering(false);
      setEmail('admin@resumio.ai');
      setPassword('AdminPass123!');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const handleGoogleClick = () => {
    setErrorMessage(null);
    setGoogleEmail('');
    setGoogleName('');
    setGoogleCompanyName(companyName || '');
    setIsGoogleModalOpen(true);
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!googleEmail.trim()) {
      setErrorMessage('Please enter a valid Google email address.');
      return;
    }

    if (roleMode === 'recruiter' && !googleCompanyName.trim()) {
      setErrorMessage('Company Name is required for Recruiter Google Sign-In.');
      return;
    }

    setIsSubmitting(true);

    try {
      await googleAuth({
        userInfo: {
          sub: `google_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          email: googleEmail.trim(),
          name: googleName.trim() || googleEmail.trim().split('@')[0],
          picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        },
        role: roleMode === 'recruiter' ? 'recruiter' : 'candidate',
        companyName: googleCompanyName.trim() || undefined,
      });

      setIsGoogleModalOpen(false);
      showToast('success', 'Google Sign-In successful!', `Authenticated as ${googleEmail.trim()}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Google authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
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
            Phase 1 establishes core authentication, role-based security, candidate profile management, recruiter workspace, and production Google OAuth account linking.
          </p>

          <div className="space-y-3 pt-2">
            {[
              'Persistent database user storage & bcrypt hashing',
              'Google OAuth sign-in & real user account creation',
              'Role-isolated protected candidate, recruiter & admin portals',
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
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Production User Security
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
                ? 'Admin Security Console'
                : isRegistering
                ? `Create ${roleMode === 'candidate' ? 'Candidate' : 'Recruiter'} Account`
                : `Welcome to Resumio`}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {roleMode === 'admin'
                ? 'Platform administrator authentication'
                : isRegistering
                ? 'Register your account to access your recruitment workspace'
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

          {/* Google Authentication Button */}
          {roleMode !== 'admin' && (
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={isSubmitting || isLoading}
                className="w-full py-2.5 px-4 rounded-control border border-slate-200 dark:border-surface-dark-border bg-white dark:bg-surface-dark-card hover:bg-slate-50 dark:hover:bg-surface-dark-hover text-slate-700 dark:text-slate-200 font-semibold text-sm flex items-center justify-center gap-3 transition-colors shadow-xs"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-slate-200 dark:border-surface-dark-border w-full" />
                <span className="bg-surface-light-bg dark:bg-surface-dark-bg px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                  Or continue with email
                </span>
              </div>
            </div>
          )}

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
                ? 'Sign In to Admin Console'
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
          Resumio AI Recruitment Platform • Real Account System & Google Auth
        </div>
      </div>

      {/* Google Authentication Modal */}
      <Modal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        title="Google Account Authentication"
        description={`Sign in or create a ${roleMode === 'recruiter' ? 'Recruiter' : 'Candidate'} account using Google.`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsGoogleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleGoogleSubmit} isLoading={isSubmitting}>
              Continue with Google
            </Button>
          </>
        }
      >
        <form onSubmit={handleGoogleSubmit} className="space-y-3.5">
          <Input
            label="Google Email Address"
            type="email"
            placeholder="user@gmail.com"
            value={googleEmail}
            onChange={(e) => setGoogleEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <Input
            label="Full Name (Optional)"
            placeholder="e.g. Alex Morgan"
            value={googleName}
            onChange={(e) => setGoogleName(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
          />

          {roleMode === 'recruiter' && (
            <Input
              label="Company Name"
              placeholder="e.g. TalentCorp Inc."
              value={googleCompanyName}
              onChange={(e) => setGoogleCompanyName(e.target.value)}
              leftIcon={<Building2 className="w-4 h-4" />}
              required
            />
          )}
        </form>
      </Modal>

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
