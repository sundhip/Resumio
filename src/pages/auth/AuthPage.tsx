import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/kit/Button';
import { Pill } from '../../components/kit/Pill';
import { ScoreRing } from '../../components/kit/ScoreRing';
import { HealthBar } from '../../components/kit/HealthBar';
import { Modal } from '../../components/kit/Overlays';
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
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
  Shield,
} from 'lucide-react';

interface AuthPageProps {
  onNavigate?: (route: string, params?: Record<string, any>) => void;
  initialRole?: 'candidate' | 'recruiter' | 'admin';
  initialMode?: 'login' | 'register';
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onNavigate,
  initialRole = 'candidate',
  initialMode = 'login',
}) => {
  const { login, adminLogin, registerCandidate, registerRecruiter, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  // Mode & Role State
  const [roleMode, setRoleMode] = useState<'candidate' | 'recruiter' | 'admin'>(initialRole);
  const [isRegistering, setIsRegistering] = useState<boolean>(initialMode === 'register');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Password Visibility Toggle
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Error
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Forgot Password Modal
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Password Strength Calculation
  const calculatePasswordStrength = (pass: string): { score: number; label: string; color: string } => {
    if (!pass) return { score: 0, label: 'Not entered', color: 'bg-[#DCDCD7] dark:bg-white/10' };
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;

    if (score <= 25) return { score, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 50) return { score, label: 'Fair', color: 'bg-amber-500' };
    if (score <= 75) return { score, label: 'Good', color: 'bg-blue-500' };
    return { score, label: 'Strong', color: 'bg-emerald-500' };
  };

  const passwordStrength = calculatePasswordStrength(password);

  const handleRoleSelect = (role: 'candidate' | 'recruiter' | 'admin') => {
    setRoleMode(role);
    setErrorMessage(null);
    if (role === 'admin') {
      setIsRegistering(false);
      setEmail('admin.demo@resumio.local');
      setPassword('DemoPass123!');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const handleFillDemo = async (role: 'candidate' | 'recruiter' | 'admin', autoSubmit: boolean = false) => {
    setRoleMode(role);
    setIsRegistering(false);
    setErrorMessage(null);
    let demoEmail = '';
    let demoPassword = 'DemoPass123!';

    if (role === 'admin') {
      demoEmail = 'admin.demo@resumio.local';
    } else if (role === 'recruiter') {
      demoEmail = 'recruiter.demo@resumio.local';
    } else {
      demoEmail = 'candidate.demo@resumio.local';
    }

    setEmail(demoEmail);
    setPassword(demoPassword);

    if (autoSubmit) {
      setIsSubmitting(true);
      try {
        if (role === 'admin') {
          await adminLogin(demoEmail, demoPassword);
          showToast('success', 'Admin Portal Loaded', 'Authenticated as Platform Administrator.');
        } else {
          await login(demoEmail, demoPassword);
          showToast('success', `${role === 'candidate' ? 'Candidate' : 'Recruiter'} Portal Loaded`, `Signed in as ${demoEmail}.`);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Demo login failed. Ensure test server is running.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    if (isRegistering) {
      if (!fullName.trim()) {
        setErrorMessage('Please provide your full legal or professional name.');
        return;
      }
      if (roleMode === 'recruiter' && !companyName.trim()) {
        setErrorMessage('Please provide your hiring organization or company name.');
        return;
      }
      if (password.length < 8) {
        setErrorMessage('Password must contain at least 8 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please re-enter your password.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (roleMode === 'admin') {
        await adminLogin(email.trim(), password);
        showToast('success', 'Administrator Session Active', 'Signed in with system privileges.');
      } else if (isRegistering) {
        if (roleMode === 'recruiter') {
          await registerRecruiter({
            email: email.trim(),
            password,
            fullName: fullName.trim(),
            companyName: companyName.trim(),
          });
          showToast('success', 'Recruiter Account Created', 'Welcome to Resumio Hiring Workspace.');
        } else {
          await registerCandidate({
            email: email.trim(),
            password,
            fullName: fullName.trim(),
          });
          showToast('success', 'Candidate Account Created', 'Welcome to Resumio Career Hub.');
        }
      } else {
        await login(email.trim(), password);
        showToast('success', 'Session Authenticated', `Signed in as ${email.trim()}.`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F1] dark:bg-[#050708] text-[#111312] dark:text-[#F2F6F7] flex flex-col justify-center transition-colors">
      {/* Top Bar with Logo & Navigation */}
      <header className="h-16 px-6 sm:px-10 flex items-center justify-between border-b border-[#E7E7E2] dark:border-white/8 shrink-0">
        <div
          onClick={() => onNavigate ? onNavigate('landing') : undefined}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-8 h-8 rounded-full bg-[#1F8FA6] flex items-center justify-center text-white font-extrabold text-sm shadow-[0_2px_12px_rgba(43,179,201,0.4)]">
            R
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base tracking-tight text-[#111312] dark:text-[#F2F6F7]">
              Resumio
            </span>
            <Pill variant="micro-status" color="teal">Authentication</Pill>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              onClick={() => onNavigate('landing')}
              className="text-xs font-semibold text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:hover:text-[#F2F6F7] flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Landing</span>
            </button>
          )}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:hover:text-[#F2F6F7] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Split Layout: Form Left, Brand Visual Right */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 max-w-7xl w-full mx-auto p-4 sm:p-8 gap-8 items-center">
        {/* Form Column */}
        <div className="max-w-md w-full mx-auto space-y-6">
          {/* Header Title */}
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111312] dark:text-[#F2F6F7] tracking-tight">
              {isRegistering ? 'Create Your Account' : 'Welcome to Resumio'}
            </h1>
            <p className="text-xs sm:text-sm text-[#5E6460] dark:text-[#9AA7AB] font-medium">
              {isRegistering
                ? 'Join Resumio for explainable, ATS-guided talent matching.'
                : 'Sign in to access your recruitment pipelines or candidate career hub.'}
            </p>
          </div>

          {/* Mode Segmented Switcher (Sign In vs Register) */}
          <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-[#E7E7E2] dark:border-white/8">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(false);
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                !isRegistering
                  ? 'bg-white dark:bg-[#151D20] text-[#111312] dark:text-[#F2F6F7] shadow-2xs'
                  : 'text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:hover:text-[#F2F6F7]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegistering(true);
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                isRegistering
                  ? 'bg-white dark:bg-[#151D20] text-[#111312] dark:text-[#F2F6F7] shadow-2xs'
                  : 'text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:hover:text-[#F2F6F7]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Role Chooser as Two Large Cards */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[#5E6460] dark:text-[#9AA7AB] uppercase tracking-wider block">
              Select Your Role
            </span>
            <div className="grid grid-cols-2 gap-3">
              {/* Candidate Card */}
              <button
                type="button"
                onClick={() => handleRoleSelect('candidate')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  roleMode === 'candidate'
                    ? 'border-[#1F8FA6] bg-[#1F8FA6]/10 ring-2 ring-[#1F8FA6]/20'
                    : 'border-[#E7E7E2] dark:border-white/8 bg-white dark:bg-[#0D1214] hover:border-[#1F8FA6]/30'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-[#1F8FA6]/15 text-[#1F8FA6] flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#111312] dark:text-[#F2F6F7]">
                    Candidate
                  </div>
                  <div className="text-[10px] text-[#5E6460] dark:text-[#9AA7AB] mt-0.5 leading-tight">
                    Job seeker & resume builder
                  </div>
                </div>
              </button>

              {/* Recruiter Card */}
              <button
                type="button"
                onClick={() => handleRoleSelect('recruiter')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  roleMode === 'recruiter'
                    ? 'border-[#1F8FA6] bg-[#1F8FA6]/10 ring-2 ring-[#1F8FA6]/20'
                    : 'border-[#E7E7E2] dark:border-white/8 bg-white dark:bg-[#0D1214] hover:border-[#1F8FA6]/30'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#111312] dark:text-[#F2F6F7]">
                    Recruiter
                  </div>
                  <div className="text-[10px] text-[#5E6460] dark:text-[#9AA7AB] mt-0.5 leading-tight">
                    Hiring team & pipeline review
                  </div>
                </div>
              </button>
            </div>

            {/* Subtle Administrator Option */}
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => handleRoleSelect('admin')}
                className={`text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                  roleMode === 'admin'
                    ? 'text-[#1F8FA6] dark:text-[#5FD3E8] underline'
                    : 'text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:hover:text-[#F2F6F7]'
                }`}
              >
                <Shield className="w-3 h-3" />
                <span>Platform Administrator Console</span>
              </button>
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="text-xs font-semibold text-[#111312] dark:text-[#F2F6F7] block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Maya Lin"
                  className="w-full text-xs rounded-xl border border-[#E7E7E2] dark:border-white/10 bg-white dark:bg-[#151D20] text-[#111312] dark:text-[#F2F6F7] p-2.5 outline-none focus:border-[#1F8FA6]"
                />
              </div>
            )}

            {isRegistering && roleMode === 'recruiter' && (
              <div>
                <label className="text-xs font-semibold text-[#111312] dark:text-[#F2F6F7] block mb-1">
                  Hiring Organization / Company
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Stripe, Acme Corp"
                  className="w-full text-xs rounded-xl border border-[#E7E7E2] dark:border-white/10 bg-white dark:bg-[#151D20] text-[#111312] dark:text-[#F2F6F7] p-2.5 outline-none focus:border-[#1F8FA6]"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-[#111312] dark:text-[#F2F6F7] block mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full text-xs rounded-xl border border-[#E7E7E2] dark:border-white/10 bg-white dark:bg-[#151D20] text-[#111312] dark:text-[#F2F6F7] p-2.5 pl-9 outline-none focus:border-[#1F8FA6]"
                />
                <Mail className="w-4 h-4 text-[#8C928E] absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Password with Visibility Toggle & Strength Meter */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-[#111312] dark:text-[#F2F6F7]">
                  Password
                </label>
                {!isRegistering && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-[11px] font-semibold text-[#1F8FA6] dark:text-[#5FD3E8] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs rounded-xl border border-[#E7E7E2] dark:border-white/10 bg-white dark:bg-[#151D20] text-[#111312] dark:text-[#F2F6F7] p-2.5 pl-9 pr-10 outline-none focus:border-[#1F8FA6]"
                />
                <Lock className="w-4 h-4 text-[#8C928E] absolute left-3 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-[#8C928E] hover:text-[#111312] dark:hover:text-[#F2F6F7] absolute right-2.5 top-2 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter (if registering) */}
              {isRegistering && password.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className="text-[#5E6460] dark:text-[#9AA7AB]">Password Strength:</span>
                    <span className="font-bold text-[#111312] dark:text-[#F2F6F7]">{passwordStrength.label}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.score}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[#5E6460] dark:text-[#9AA7AB] block">
                    Use 8+ characters with uppercase, numbers, and symbols.
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password (if registering) */}
            {isRegistering && (
              <div>
                <label className="text-xs font-semibold text-[#111312] dark:text-[#F2F6F7] block mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs rounded-xl border border-[#E7E7E2] dark:border-white/10 bg-white dark:bg-[#151D20] text-[#111312] dark:text-[#F2F6F7] p-2.5 pl-9 pr-10 outline-none focus:border-[#1F8FA6]"
                  />
                  <Lock className="w-4 h-4 text-[#8C928E] absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="p-1.5 text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:hover:text-[#F2F6F7] absolute right-2.5 top-2 cursor-pointer"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {!isRegistering && (
              <label className="flex items-center gap-2 text-xs text-[#5E6460] dark:text-[#9AA7AB] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#DCDCD7] text-[#1F8FA6] focus:ring-[#1F8FA6]"
                />
                <span>Remember this workstation for 30 days</span>
              </label>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting || isLoading}
              className="w-full"
            >
              {isRegistering
                ? `Create ${roleMode === 'recruiter' ? 'Recruiter' : 'Candidate'} Account`
                : `Sign In to ${roleMode === 'admin' ? 'Admin Console' : roleMode === 'recruiter' ? 'Recruiter Portal' : 'Candidate Portal'}`}
            </Button>
          </form>

          {/* One-Click Instant Demo Login Strip */}
          <div className="pt-2 border-t border-[#E7E7E2] dark:border-white/8 space-y-2.5">
            <span className="text-[10px] font-bold text-[#5E6460] dark:text-[#9AA7AB] uppercase tracking-wider block text-center">
              1-Click Instant Demo Access (Pre-Seeded)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleFillDemo('candidate', true)}
                className="text-[11px] px-2 py-1.5"
              >
                Candidate Demo
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleFillDemo('recruiter', true)}
                className="text-[11px] px-2 py-1.5"
              >
                Recruiter Demo
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleFillDemo('admin', true)}
                className="text-[11px] px-2 py-1.5"
              >
                Admin Demo
              </Button>
            </div>
          </div>
        </div>

        {/* Brand Visual Column (Right) */}
        <div className="hidden lg:flex flex-col justify-center items-center relative p-8">
          {/* Subtle teal radial glow background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-[#1F8FA6]/15 rounded-full blur-[100px] pointer-events-none -z-10" />

          <div className="w-full max-w-md bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/10 rounded-2xl p-6 shadow-2xl space-y-5">
            {/* Live Component Preview */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E7E2] dark:border-white/8">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1F8FA6]/10 text-[#1F8FA6] flex items-center justify-center font-bold text-xs">
                  AI
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#111312] dark:text-[#F2F6F7]">
                    Deterministic Match Engine
                  </h4>
                  <span className="text-[10px] text-[#5E6460] dark:text-[#9AA7AB]">
                    Offline Ready • 42ms Latency
                  </span>
                </div>
              </div>
              <Pill variant="micro-status" color="teal">Active</Pill>
            </div>

            <div className="flex items-center gap-4">
              <ScoreRing
                score={94}
                size={76}
                strokeWidth={6}
                color="teal"
                label="Fit"
              />
              <div className="space-y-1 flex-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#111312] dark:text-[#F2F6F7]">Skill Overlap</span>
                  <span className="figure text-[#1F8FA6] font-bold">6/6 (98%)</span>
                </div>
                <HealthBar current={98} target={100} height="h-2" color="teal" />
                <span className="text-[10px] text-[#5E6460] dark:text-[#9AA7AB] block mt-1">
                  Traceable evidence span verified at line 42.
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#E7E7E2] dark:border-white/8 text-xs text-[#5E6460] dark:text-[#9AA7AB]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Zero automated rejections; humans make every hire decision.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Demographic markers strictly excluded from evaluation models.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Argon2id password hashing & encrypted session persistence.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <Modal
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
          title="Reset Your Password"
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed">
              Enter your registered email address. We will generate a secure reset token or guide you through k-anonymity recovery.
            </p>
            <div>
              <label className="text-xs font-semibold text-[#111312] dark:text-[#F2F6F7] block mb-1">
                Registered Email
              </label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full text-xs rounded-xl border border-[#E7E7E2] dark:border-white/10 bg-white dark:bg-[#151D20] text-[#111312] dark:text-[#F2F6F7] p-2.5 outline-none focus:border-[#1F8FA6]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsForgotPasswordOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  showToast('info', 'Reset Link Dispatched', `Password instructions sent to ${forgotEmail || email || 'registered email'}.`);
                  setIsForgotPasswordOpen(false);
                }}
              >
                Send Recovery Instructions
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
