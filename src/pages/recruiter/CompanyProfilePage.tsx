import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import type { RecruiterProfile } from '../../types';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Edit3,
  Save,
  X,
  Briefcase,
} from 'lucide-react';

export const CompanyProfilePage: React.FC = () => {
  const { user, profile, updateProfileContext } = useAuth();
  const { showToast } = useToast();

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');

  // Sync state from profile
  useEffect(() => {
    if (profile && 'company_name' in profile) {
      const p = profile as RecruiterProfile;
      setFullName(p.full_name || user?.name || '');
      setPhone(p.phone || '');
      setCompanyName(p.company_name || user?.company || '');
      setCompanyLogo(p.company_logo || '');
      setIndustry(p.industry || '');
      setLocation(p.location || '');
      setWebsite(p.website || '');
      setDescription(p.description || '');
    } else {
      api.getRecruiterProfile()
        .then((res) => {
          if (res.profile) {
            updateProfileContext(res.profile);
            setFullName(res.profile.full_name || '');
            setPhone(res.profile.phone || '');
            setCompanyName(res.profile.company_name || '');
            setCompanyLogo(res.profile.company_logo || '');
            setIndustry(res.profile.industry || '');
            setLocation(res.profile.location || '');
            setWebsite(res.profile.website || '');
            setDescription(res.profile.description || '');
          }
        })
        .catch(() => {
          showToast('error', 'Unable to retrieve recruiter profile.');
        });
    }
  }, [profile, user]);

  const handleCancel = () => {
    if (profile && 'company_name' in profile) {
      const p = profile as RecruiterProfile;
      setFullName(p.full_name || '');
      setPhone(p.phone || '');
      setCompanyName(p.company_name || '');
      setCompanyLogo(p.company_logo || '');
      setIndustry(p.industry || '');
      setLocation(p.location || '');
      setWebsite(p.website || '');
      setDescription(p.description || '');
    }
    setIsEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !companyName.trim()) {
      showToast('error', 'Recruiter name and company name are required.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.updateRecruiterProfile({
        fullName,
        phone,
        companyName,
        companyLogo,
        industry,
        location,
        website,
        description,
      });

      if (res.success && res.profile) {
        updateProfileContext(res.profile);
        setIsEditing(false);
        showToast('success', 'Company profile updated successfully!', `Profile completion score: ${res.profile.profile_completion}%.`);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update company profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentProfile = profile as RecruiterProfile | null;
  const completion = currentProfile?.profile_completion || user?.profileCompletion || 40;

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Company & Recruiter Profile
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your organization information, company brand, and recruiter contact coordinates.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {!isEditing ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsEditing(true)}
              leftIcon={<Edit3 className="w-4 h-4" />}
            >
              Edit Company Profile
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="md"
              onClick={handleCancel}
              leftIcon={<X className="w-4 h-4" />}
              disabled={isSaving}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Main Company Card */}
      <Card padding="lg" className="relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="relative shrink-0">
              {companyLogo || currentProfile?.company_logo ? (
                <img
                  src={companyLogo || currentProfile?.company_logo}
                  alt={companyName || 'Company Logo'}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-2 ring-brand-500/30 border border-slate-200 dark:border-surface-dark-border"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-card">
                  {(companyName || 'C').charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                  {companyName || currentProfile?.company_name || user?.company || 'Company Name'}
                </h2>
                <Badge variant="purple" size="sm">
                  Verified Employer
                </Badge>
              </div>

              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {industry || currentProfile?.industry || 'Industry not specified'}
              </p>

              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {location || currentProfile?.location || 'Headquarters location not specified'}
                </span>
                {website && (
                  <>
                    <span>•</span>
                    <a
                      href={website.startsWith('http') ? website : `https://${website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      {website.replace(/^https?:\/\//, '')}
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Completion Progress Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-surface-dark-border space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600 dark:text-slate-400">Company Profile Completion</span>
            <span className="text-brand-600 dark:text-brand-400 font-bold">{completion}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-600 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </Card>

      {/* View vs Edit Mode */}
      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-6">
          <Card padding="md" className="space-y-4">
            <CardHeader>
              <div>
                <CardTitle>Edit Company & Recruiter Details</CardTitle>
                <CardDescription>
                  Update your organization profile and primary hiring manager contact details.
                </CardDescription>
              </div>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300 pt-1">
                Company Details
              </div>

              <Input
                label="Company Name *"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Nexus AI Technologies"
                required
              />

              <Input
                label="Industry / Domain"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Artificial Intelligence & Enterprise Software"
              />

              <Input
                label="Company Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA (or Remote)"
              />

              <Input
                label="Company Website URL"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourcompany.com"
              />

              <div className="sm:col-span-2">
                <Input
                  label="Company Logo URL"
                  value={companyLogo}
                  onChange={(e) => setCompanyLogo(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  helperText="Direct image URL for company brand logo"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  Company Description
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your company mission, product line, and hiring culture..."
                  className="w-full p-3 text-xs sm:text-sm rounded-control bg-white dark:bg-surface-dark-input text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-surface-dark-border focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="sm:col-span-2 text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300 pt-3 border-t border-slate-100 dark:border-surface-dark-border">
                Lead Recruiter Details
              </div>

              <Input
                label="Recruiter Full Name *"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                required
              />

              <Input
                label="Recruiter Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 (415) 555-0192"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-surface-dark-border">
              <Button variant="secondary" type="button" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Changes
              </Button>
            </div>
          </Card>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left 2 Columns: Description & Recruiter */}
          <div className="md:col-span-2 space-y-6">
            <Card padding="md">
              <CardHeader>
                <CardTitle>About the Company</CardTitle>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
              </CardHeader>
              {description ? (
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {description}
                </p>
              ) : (
                <div className="p-6 text-center rounded-control bg-slate-50/50 dark:bg-surface-dark-bg/50 border border-dashed border-slate-200 dark:border-surface-dark-border">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No company description provided yet. Click "Edit Company Profile" to add your company background.
                  </p>
                </div>
              )}
            </Card>

            {/* Phase 2 Feature Placeholders */}
            <Card padding="md" className="border-dashed border-slate-200 dark:border-surface-dark-border bg-slate-50/30 dark:bg-surface-dark-bg/20">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-surface-dark-border">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Active Job Openings
                  </h3>
                </div>
                <Badge variant="neutral" size="sm">
                  Phase 2 Feature
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Job creation, applicant tracking pipelines, and automated resume screening will be available in Phase 2.
              </p>
            </Card>
          </div>

          {/* Right Column: Lead Recruiter & Contact */}
          <div className="space-y-6">
            <Card padding="md">
              <CardHeader>
                <CardTitle>Hiring Manager Contact</CardTitle>
              </CardHeader>

              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3 p-3 rounded-control bg-slate-50 dark:bg-surface-dark-bg border border-slate-200/60 dark:border-surface-dark-border/60">
                  <User className="w-4 h-4 text-brand-500 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Recruiter Name
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {fullName || currentProfile?.full_name || user?.name || 'Recruiter'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-control bg-slate-50 dark:bg-surface-dark-bg border border-slate-200/60 dark:border-surface-dark-border/60">
                  <Mail className="w-4 h-4 text-brand-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Work Email
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white truncate block">
                      {user?.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-control bg-slate-50 dark:bg-surface-dark-bg border border-slate-200/60 dark:border-surface-dark-border/60">
                  <Phone className="w-4 h-4 text-brand-500 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Phone Number
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {phone || currentProfile?.phone || 'Not provided'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
