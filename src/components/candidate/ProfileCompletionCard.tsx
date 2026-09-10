import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { CheckCircle2, Circle, Sparkles, ChevronRight } from 'lucide-react';
import type { FullCandidateProfileData } from '../../types';

interface ProfileCompletionCardProps {
  data: FullCandidateProfileData;
  onNavigateToSection?: (sectionId: string) => void;
}

export const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({
  data,
  onNavigateToSection,
}) => {
  const { profile, education, skills, experience, projects, certifications, resume } = data;

  const checklistItems = [
    {
      id: 'basic-info',
      label: 'Personal Information',
      weight: 10,
      completed: Boolean(profile.full_name && profile.email),
      tip: 'Full name and email address',
    },
    {
      id: 'photo',
      label: 'Profile Photo',
      weight: 10,
      completed: Boolean(profile.photo_url),
      tip: 'Upload a professional headshot',
    },
    {
      id: 'headline',
      label: 'Professional Headline',
      weight: 10,
      completed: Boolean(profile.headline && profile.headline.trim().length > 0),
      tip: 'Job title & core specialization',
    },
    {
      id: 'summary',
      label: 'Summary / Bio',
      weight: 10,
      completed: Boolean(profile.bio && profile.bio.trim().length > 0),
      tip: 'Professional executive summary',
    },
    {
      id: 'education',
      label: 'Education',
      weight: 10,
      completed: education.length > 0,
      tip: 'Degrees and academic milestones',
    },
    {
      id: 'skills',
      label: 'Technical Skills',
      weight: 10,
      completed: skills.length > 0,
      tip: 'Skills with proficiency levels',
    },
    {
      id: 'experience',
      label: 'Work Experience',
      weight: 10,
      completed: experience.length > 0,
      tip: 'Employment history and roles',
    },
    {
      id: 'projects',
      label: 'Projects',
      weight: 10,
      completed: projects.length > 0,
      tip: 'Applications and open-source builds',
    },
    {
      id: 'certifications',
      label: 'Certifications',
      weight: 10,
      completed: certifications.length > 0,
      tip: 'Accredited certificates & licenses',
    },
    {
      id: 'resume',
      label: 'Resume Uploaded',
      weight: 10,
      completed: Boolean(resume),
      tip: 'Active PDF / DOCX resume file',
    },
  ];

  const completedCount = checklistItems.filter((item) => item.completed).length;
  const score = data.completion ?? profile.profile_completion ?? (completedCount * 10);

  // Determine color theme based on score
  const getScoreColor = () => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/60';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/60';
    return 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 border-brand-200 dark:border-brand-800/60';
  };

  const getProgressGradient = () => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-brand-500';
  };

  return (
    <Card padding="md" className="space-y-4">
      <CardHeader>
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-500" />
            Profile Strength
          </CardTitle>
          <CardDescription>
            Complete your profile to increase visibility to recruiters
          </CardDescription>
        </div>

        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getScoreColor()}`}>
          {score}% Complete
        </span>
      </CardHeader>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-surface-dark-input overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${getProgressGradient()}`}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <span>{completedCount} of 10 sections completed</span>
          <span>{score === 100 ? 'All Star Profile' : `${100 - score}% remaining`}</span>
        </div>
      </div>

      {/* Checklist items */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-surface-dark-border">
        {checklistItems.map((item) => (
          <div
            key={item.id}
            onClick={() => {
              if (!item.completed && onNavigateToSection) {
                onNavigateToSection(item.id);
              }
            }}
            className={`flex items-center justify-between p-2 rounded-control text-xs transition-colors ${
              item.completed
                ? 'bg-slate-50/60 dark:bg-surface-dark-bg/40 text-slate-600 dark:text-slate-400'
                : 'bg-brand-50/30 dark:bg-brand-950/20 text-slate-800 dark:text-slate-200 border border-brand-100/50 dark:border-brand-900/40 cursor-pointer hover:bg-brand-100/40'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {item.completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
              )}
              <div className="min-w-0">
                <span className={`font-semibold block truncate ${item.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                  {item.label}
                </span>
                {!item.completed && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate">
                    {item.tip}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[11px] font-semibold text-slate-400">
                +{item.weight}%
              </span>
              {!item.completed && onNavigateToSection && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
