import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, SearchInput } from '../../components/ui/Input';
import { MatchScore } from '../../components/ui/MatchScore';
import { Dropdown } from '../../components/ui/Dropdown';
import { Modal } from '../../components/ui/Modal';
import { Tabs } from '../../components/ui/Tabs';
import { EmptyState } from '../../components/ui/EmptyState';
import { CardSkeleton, TableSkeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../context/ToastContext';
import type { ApplicationStatus } from '../../types';
import {
  Sparkles,
  Plus,
  Trash2,
  FileText,
  MoreVertical,
} from 'lucide-react';

export const ComponentShowcase: React.FC = () => {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tab1');
  const [inputValue, setInputValue] = useState('');
  const [showSkeletons, setShowSkeletons] = useState(false);
  const { showToast } = useToast();

  const statuses: ApplicationStatus[] = [
    'Applied',
    'Screening',
    'Under Review',
    'Shortlisted',
    'Interview',
    'Selected',
    'Rejected',
    'Withdrawn',
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-surface-dark-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Resumio Design System & Component Library
            </h1>
            <Badge variant="purple" size="sm">
              Design Tokens v1.0
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Standardized atomic UI building blocks, typography, semantic status systems, and theme layers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowSkeletons((prev) => !prev)}
          >
            {showSkeletons ? 'Show Components' : 'Test Skeletons'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsDemoModalOpen(true)}
          >
            Open Modal
          </Button>
        </div>
      </div>

      {showSkeletons ? (
        <div className="space-y-6 animate-fade-in">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Skeleton Loaders Preview</h2>
          <CardSkeleton count={3} />
          <TableSkeleton rows={4} />
        </div>
      ) : (
        <div className="space-y-10 animate-fade-in">
          {/* Section 1: Buttons */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              1. Button System
            </h2>
            <Card padding="md" className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="destructive" leftIcon={<Trash2 className="w-4 h-4" />}>
                  Destructive
                </Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ai" leftIcon={<Sparkles className="w-4 h-4" />}>
                  AI Action
                </Button>
                <Button variant="primary" isLoading>
                  Loading
                </Button>
                <Button variant="primary" disabled>
                  Disabled
                </Button>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-surface-dark-border">
                <Button size="sm">Small (36px)</Button>
                <Button size="md">Medium (40px)</Button>
                <Button size="lg">Large (44px)</Button>
              </div>
            </Card>
          </section>

          {/* Section 2: AI Match Score Components */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              2. AI Match Score Visualizations
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MatchScore score={94} variant="card" />
              <Card padding="md" className="flex items-center justify-center">
                <MatchScore score={91} variant="circle" />
              </Card>
              <Card padding="md" className="flex flex-col justify-center">
                <MatchScore score={85} variant="bar" />
              </Card>
              <Card padding="md" className="flex flex-col justify-center items-start gap-2">
                <span className="text-xs text-slate-400">Pill Variants:</span>
                <MatchScore score={95} variant="pill" size="lg" />
                <MatchScore score={88} variant="pill" size="md" />
                <MatchScore score={74} variant="pill" size="sm" />
              </Card>
            </div>
          </section>

          {/* Section 3: Status Badges */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              3. Semantic Status Badges
            </h2>
            <Card padding="md">
              <div className="flex flex-wrap gap-2.5">
                {statuses.map((status) => (
                  <Badge key={status} status={status} showDot size="md" />
                ))}
              </div>
            </Card>
          </section>

          {/* Section 4: Form Controls */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              4. Form System & Inputs
            </h2>
            <Card padding="md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Standard Input"
                  placeholder="Enter job role..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  helperText="Use concise recruitment title"
                />

                <SearchInput
                  placeholder="Global search with shortcut (⌘ K)"
                  shortcut="⌘ K"
                />

                <Input
                  label="Success Validation State"
                  value="rahul.kumar@resumio.ai"
                  isSuccess
                  readOnly
                />

                <Input
                  label="Error Validation State"
                  value="invalid-email-format"
                  error="Please enter a valid work email address."
                  readOnly
                />
              </div>
            </Card>
          </section>

          {/* Section 5: Tabs & Dropdowns */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              5. Tabs & Dropdown Menus
            </h2>
            <Card padding="md" className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs text-slate-400 block font-semibold">Pills Tab Style:</span>
                <Tabs
                  activeTab={activeTab}
                  onChange={setActiveTab}
                  variant="pills"
                  tabs={[
                    { id: 'tab1', label: 'All Jobs', count: 12 },
                    { id: 'tab2', label: 'Recommended', count: 4 },
                    { id: 'tab3', label: 'Saved', count: 2 },
                  ]}
                />
              </div>

              <div className="space-y-2">
                <span className="text-xs text-slate-400 block font-semibold">Boxed Tab Style:</span>
                <Tabs
                  activeTab={activeTab}
                  onChange={setActiveTab}
                  variant="boxed"
                  tabs={[
                    { id: 'tab1', label: 'Pipeline View' },
                    { id: 'tab2', label: 'Kanban Board' },
                    { id: 'tab3', label: 'AI Match Table' },
                  ]}
                />
              </div>

              <div className="pt-2 flex items-center gap-4">
                <Dropdown
                  trigger={
                    <Button variant="secondary" rightIcon={<MoreVertical className="w-4 h-4" />}>
                      Action Menu Dropdown
                    </Button>
                  }
                  items={[
                    { id: '1', label: 'View Candidate Profile', icon: <FileText className="w-4 h-4" /> },
                    { id: '2', label: 'Schedule Technical Round', icon: <Plus className="w-4 h-4 text-brand-500" /> },
                    { id: 'd', label: '', divider: true },
                    { id: '3', label: 'Reject Candidate', destructive: true, icon: <Trash2 className="w-4 h-4" /> },
                  ]}
                />
              </div>
            </Card>
          </section>

          {/* Section 6: Toast Notifications */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              6. Toast Notification System
            </h2>
            <Card padding="md">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={() => showToast('success', 'Profile updated successfully!', 'AI score refreshed.')}
                >
                  Trigger Success Toast
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => showToast('error', 'Unable to upload file', 'File size exceeds 15MB limit.')}
                >
                  Trigger Error Toast
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => showToast('info', 'Batch screening finished', '14 new candidates scored.')}
                >
                  Trigger Info Toast
                </Button>
              </div>
            </Card>
          </section>

          {/* Section 7: Empty State Preview */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              7. Intentional Empty State
            </h2>
            <EmptyState
              icon={<FileText className="w-6 h-6" />}
              title="No applications submitted yet"
              description="Explore open opportunities matching your verified AI skill matrix and apply in one click."
              actionLabel="Browse Available Jobs"
              onAction={() => showToast('info', 'Navigating to jobs...')}
            />
          </section>
        </div>
      )}

      {/* Demo Modal */}
      <Modal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        title="Confirm Candidate Advancement"
        description="Are you sure you want to advance this candidate to the Technical Round?"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDemoModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setIsDemoModalOpen(false);
                showToast('success', 'Candidate advanced to Technical Interview!');
              }}
            >
              Confirm & Schedule
            </Button>
          </>
        }
      >
        <div className="p-3.5 rounded-control bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200/60 dark:border-brand-800/40 text-xs space-y-1">
          <p className="font-semibold text-brand-700 dark:text-brand-300">
            AI Summary: High Confidence Fit (94%)
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            Candidate exceeds baseline requirements for React and system architecture.
          </p>
        </div>
      </Modal>
    </div>
  );
};
