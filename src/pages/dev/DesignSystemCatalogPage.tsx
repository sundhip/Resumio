import React, { useState } from 'react';
import {
  Card,
  StatTile,
  HealthBar,
  HatchedProgress,
  Pill,
  SidebarItem,
  SidebarSectionLabel,
  Button,
  IconButton,
  SegmentedControl,
  Switch,
  Input,
  Select,
  Combobox,
  Slider,
  Tabs,
  Stepper,
  ScoreRing,
  ArcGauge,
  Sparkline,
  AreaChart,
  BarChart,
  Donut,
  MiniCalendar,
  AvatarStack,
  DataTable,
  StatusProgressChip,
  Tooltip,
  Popover,
  Toast,
  Dialog,
  Drawer,
  Skeleton,
  EmptyState,
  ErrorState,
  EmptyIllustration,
  ResumeParseIllustration,
  MatchFitIllustration,
  InterviewIllustration,
  SecurityIllustration,
  SkillGapIllustration,
  AnalyticsIllustration,
  WorkflowIllustration,
  UploadIllustration,
} from '../../components/kit';
import { useTheme } from '../../context/ThemeContext';
import {
  Sparkles,
  Sun,
  Moon,
  Laptop,
  CheckCircle,
  Search,
  LayoutDashboard,
  Briefcase,
  Users,
  Settings,
  Bell,
  Eye,
  Sliders,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';

export const DesignSystemCatalogPage: React.FC = () => {
  const { theme, setTheme } = useTheme();

  // Component test states
  const [activeTab, setActiveTab] = useState<'all' | 'primitives' | 'inputs' | 'data-viz' | 'overlays' | 'illustrations' | 'tokens'>('all');
  const [segmentedVal, setSegmentedVal] = useState<'week' | 'month' | 'year'>('month');
  const [switchVal, setSwitchVal] = useState<boolean>(true);
  const [sliderVal, setSliderVal] = useState<number>(78);
  const [inputVal, setInputVal] = useState<string>('senior.ml.engineer@example.com');
  const [selectVal, setSelectVal] = useState<string>('hybrid');
  const [comboboxVal, setComboboxVal] = useState<string>('react');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(true);

  // Mock data for DataViz
  const areaData = [
    { label: 'Jan', value: 45 },
    { label: 'Feb', value: 52 },
    { label: 'Mar', value: 68 },
    { label: 'Apr', value: 61 },
    { label: 'May', value: 79 },
    { label: 'Jun', value: 92 },
    { label: 'Jul', value: 88 },
  ];

  const barData = [
    { label: 'Python', value: 95, color: 'teal' as const },
    { label: 'TypeScript', value: 88, color: 'aqua' as const },
    { label: 'PyTorch', value: 82, color: 'pink' as const },
    { label: 'Docker', value: 74, color: 'green' as const },
    { label: 'PostgreSQL', value: 65, color: 'yellow' as const },
    { label: 'AWS', value: 58, color: 'orange' as const },
  ];

  const donutSegments = [
    { label: 'Semantic Cosine', value: 45, colorHex: '#1F8FA6' },
    { label: 'BM25 Keyword', value: 25, colorHex: '#5FD3E8' },
    { label: 'Experience Match', value: 20, colorHex: '#7ED957' },
    { label: 'Role Alignment', value: 10, colorHex: '#F2C94C' },
  ];

  const tableData = [
    { id: '1', name: 'Sophia Chen', role: 'Staff ML Engineer', score: 94, stage: 'Technical Screen', progress: 85, color: 'teal' as const },
    { id: '2', name: 'Marcus Vance', role: 'Senior Backend Engineer', score: 88, stage: 'System Design', progress: 65, color: 'aqua' as const },
    { id: '3', name: 'Elena Rostova', role: 'Lead Frontend Architect', score: 82, stage: 'Hiring Manager', progress: 40, color: 'pink' as const },
    { id: '4', name: 'David Kim', role: 'Data Platform Engineer', score: 76, stage: 'Application Review', progress: 20, color: 'yellow' as const },
  ];

  const tableColumns = [
    { key: 'name', header: 'Candidate', sortable: true },
    { key: 'role', header: 'Target Role', sortable: true },
    {
      key: 'score',
      header: 'ATS Score',
      align: 'center' as const,
      sortable: true,
      render: (row: any) => (
        <span className="figure font-bold text-[#1F8FA6] dark:text-[#5FD3E8]">
          {row.score}%
        </span>
      ),
    },
    {
      key: 'stage',
      header: 'Pipeline Stage',
      render: (row: any) => (
        <StatusProgressChip
          label={row.stage}
          progressPct={row.progress}
          color={row.color}
        />
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E7E7E2] dark:border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#1F8FA6]/15 text-[#1F8FA6] dark:text-[#5FD3E8]">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#111312] dark:text-[#F2F6F7]">
              Resumio Design System & Component Kit
            </h1>
          </div>
          <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] mt-1">
            Production-grade UI primitives built to exact FinGlow (Obsidian) and Vestmark (Paper) specifications. WCAG 2.2 AA compliant.
          </p>
        </div>

        {/* Global Theme Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#E9E9E5] dark:bg-[#080B0C] border border-[#E7E7E2] dark:border-white/10">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-white text-[#111312] shadow-sm'
                : 'text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312]'
            }`}
          >
            <Sun className="w-3.5 h-3.5" /> Light (Paper)
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#1F8FA6] text-white shadow-[0_2px_10px_rgba(43,179,201,0.35)]'
                : 'text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312]'
            }`}
          >
            <Moon className="w-3.5 h-3.5" /> Dark (Obsidian)
          </button>
          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              theme === 'system'
                ? 'bg-white dark:bg-[#111719] text-[#111312] dark:text-[#F2F6F7] shadow-sm'
                : 'text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312]'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" /> System
          </button>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <Tabs
        variant="pills"
        tabs={[
          { id: 'all', label: 'All Components' },
          { id: 'primitives', label: 'Cards & Primitives' },
          { id: 'inputs', label: 'Inputs & Controls' },
          { id: 'data-viz', label: 'Data Visualization' },
          { id: 'overlays', label: 'Overlays & Modals' },
          { id: 'illustrations', label: 'Original SVG Set' },
          { id: 'tokens', label: 'Token Inspector & A11y' },
        ]}
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as any)}
      />

      {/* SECTION 1: CARDS & STAT TILES */}
      {(activeTab === 'all' || activeTab === 'primitives') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5E6460] dark:text-[#9AA7AB]">
              Cards & Stat Tiles (Bento Architecture)
            </h2>
            <Pill variant="micro-status" color="green" dot>WCAG 2.2 AA</Pill>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile
              label="Talent Pool"
              value="14,290"
              delta={{ value: '18.4%', isPositive: true, period: 'vs last month' }}
              accentColor="teal"
              sparkline={<Sparkline data={[20, 35, 40, 30, 55, 75, 90]} color="teal" />}
            />
            <StatTile
              label="Match Accuracy"
              value="87.6%"
              delta={{ value: '4.2%', isPositive: true, period: 'calibrated' }}
              accentColor="aqua"
              sparkline={<Sparkline data={[60, 65, 70, 68, 75, 80, 88]} color="aqua" />}
            />
            <StatTile
              label="Interview Velocity"
              value="3.2d"
              delta={{ value: '0.8d', isPositive: true, period: 'faster' }}
              accentColor="pink"
              sparkline={<Sparkline data={[50, 48, 45, 42, 38, 35, 32]} color="pink" />}
            />
            <StatTile
              label="Rejected / Bias Filter"
              value="0"
              delta={{ value: '0%', isPositive: true, period: 'human-in-the-loop' }}
              accentColor="green"
              sparkline={<Sparkline data={[0, 0, 0, 0, 0, 0, 0]} color="green" />}
            />
          </div>

          {/* Card Variants */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <Card variant="default">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5E6460] dark:text-[#9AA7AB]">Default Surface Card</span>
              <h3 className="text-lg font-bold text-[#111312] dark:text-[#F2F6F7] mt-2">Clean Border & Contrast</h3>
              <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] mt-1">Light: pure white with hairline border. Dark: blackish #0C1113 with 1px border.</p>
            </Card>

            <Card variant="raised">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5E6460] dark:text-[#9AA7AB]">Raised Elevated Card</span>
              <h3 className="text-lg font-bold text-[#111312] dark:text-[#F2F6F7] mt-2">Inner Highlight Depth</h3>
              <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] mt-1">Light: muted warm surface #F6F6F3. Dark: elevated obsidian #111719.</p>
            </Card>

            <Card variant="feature">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/80">Teal Hero Gradient Card</span>
              <h3 className="text-lg font-bold text-white mt-2">FinGlow Signature Accent</h3>
              <p className="text-xs text-white/80 mt-1">Linear gradient #1B8197 to #176F83 with soft glow.</p>
            </Card>
          </div>
        </section>
      )}

      {/* SECTION 2: GAUGES, PROGRESS & PILLS */}
      {(activeTab === 'all' || activeTab === 'primitives' || activeTab === 'data-viz') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5E6460] dark:text-[#9AA7AB]">
              Gauges, Progress Bars & Pills
            </h2>
            <Pill variant="micro-status" color="teal" dot>Interactive</Pill>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Arc Gauge */}
            <Card className="flex flex-col items-center justify-center py-6">
              <ArcGauge score={sliderVal} label="ATS Match Fit" />
              <div className="w-full mt-4">
                <Slider label="Simulate Fit Score" value={sliderVal} onChange={setSliderVal} />
              </div>
            </Card>

            {/* Score Rings & Health Bar */}
            <Card className="flex flex-col justify-between py-6">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5E6460] dark:text-[#9AA7AB]">
                  Gradient Health Bar & Score Ring
                </span>
                <div className="mt-4 flex items-center justify-around">
                  <ScoreRing score={sliderVal} label="Score" color="teal" />
                  <ScoreRing score={85} label="Skills" color="pink" />
                </div>
              </div>

              <div className="mt-6">
                <HealthBar value={sliderVal} startLabel="Minimal" endLabel="Target Reach" />
              </div>
            </Card>

            {/* Hatched Progress & Pills */}
            <Card className="flex flex-col justify-between py-6">
              <div className="space-y-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5E6460] dark:text-[#9AA7AB]">
                  Hatched Diagonal Progress Bars
                </span>
                <HatchedProgress value={92} color="teal" label="Semantic Core" />
                <HatchedProgress value={68} color="aqua" label="Experience Depth" />
                <HatchedProgress value={45} color="pink" label="Certification Fit" />
              </div>

              <div className="mt-5 pt-4 border-t border-[#E7E7E2] dark:border-white/10 flex flex-wrap gap-2">
                <Pill variant="micro-status" color="teal" dot>Active</Pill>
                <Pill variant="micro-status" color="pink" dot>Interview</Pill>
                <Pill variant="micro-status" color="green" dot>Offered</Pill>
                <Pill variant="delta-positive">+14.2%</Pill>
                <Pill variant="delta-negative">-3.8%</Pill>
                <Pill variant="info">Verified</Pill>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* SECTION 3: INPUTS & CONTROLS */}
      {(activeTab === 'all' || activeTab === 'inputs') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5E6460] dark:text-[#9AA7AB]">
              Inputs, Controls & Selectors
            </h2>
            <Pill variant="micro-status" color="aqua" dot>Accessible Forms</Pill>
          </div>

          <Card className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <Input
                label="Search Candidates"
                placeholder="e.g. PyTorch, Distributed Systems..."
                leadingIcon={<Search />}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onClear={() => setInputVal('')}
                helperText="Type a keyword to run hybrid BM25 + cosine search"
              />

              <Input
                label="Error Validation State"
                value="invalid_query@@"
                error="Special characters not permitted in strict term search"
                onChange={() => {}}
              />
            </div>

            <div className="space-y-4">
              <Select
                label="Workplace Mode"
                value={selectVal}
                onChange={(e) => setSelectVal(e.target.value)}
                options={[
                  { value: 'hybrid', label: 'Hybrid (3 days office)' },
                  { value: 'remote', label: 'Fully Remote' },
                  { value: 'onsite', label: 'Onsite Only' },
                ]}
                helperText="Filtered by candidate stated preference"
              />

              <Combobox
                label="Primary Technology Stack"
                value={comboboxVal}
                onChange={setComboboxVal}
                options={[
                  { value: 'react', label: 'React 19 / TypeScript' },
                  { value: 'python', label: 'Python / FastAPI' },
                  { value: 'rust', label: 'Rust / WebAssembly' },
                  { value: 'pytorch', label: 'PyTorch / HuggingFace' },
                ]}
                helperText="Searchable ontology vocabulary"
              />
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#5E6460] dark:text-[#9AA7AB] mb-2">
                  Segmented Time Range
                </label>
                <SegmentedControl
                  value={segmentedVal}
                  onChange={setSegmentedVal}
                  options={[
                    { value: 'week', label: '7D' },
                    { value: 'month', label: '30D' },
                    { value: 'year', label: '1Y' },
                  ]}
                />
              </div>

              <div className="pt-2">
                <Switch
                  checked={switchVal}
                  onChange={setSwitchVal}
                  label="Fairness Anonymization"
                  description="Masks names, institutions, and dates before scoring"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Button variant="primary" size="sm">Primary Button</Button>
                <Button variant="secondary" size="sm">Secondary</Button>
                <Button variant="teal" size="sm">Teal Glow</Button>
                <IconButton icon={<Bell />} aria-label="Notifications" size="sm" variant="secondary" />
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* SECTION 4: DATA VISUALIZATION & CHARTS */}
      {(activeTab === 'all' || activeTab === 'data-viz') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5E6460] dark:text-[#9AA7AB]">
              Charts, Calendar & Data Tables
            </h2>
            <Pill variant="micro-status" color="yellow" dot>Tabular Figures</Pill>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Area Chart */}
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
                    Match Yield & Applications
                  </h3>
                  <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
                    FinGlow vertical-bar background texture with interactive tooltip
                  </p>
                </div>
                <Pill variant="delta-positive">+24.5% vs avg</Pill>
              </div>
              <AreaChart data={areaData} />
            </Card>

            {/* Mini Calendar with Event Dots */}
            <MiniCalendar
              events={[
                { day: 5, color: 'teal', tooltip: 'AI Pipeline Review' },
                { day: 12, color: 'pink', tooltip: 'Candidate Interview' },
                { day: 19, color: 'green', tooltip: 'Final Offer Approval' },
                { day: 27, color: 'yellow', tooltip: 'Audit Check' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            {/* Bar Chart */}
            <Card className="lg:col-span-2">
              <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7] mb-1">
                Top In-Demand Skills Breakdown
              </h3>
              <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] mb-4">
                Multi-accent categories: teal, aqua, pink, green, yellow, orange
              </p>
              <BarChart data={barData} />
            </Card>

            {/* Donut Chart */}
            <Card>
              <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7] mb-1">
                Scoring Weight Distribution
              </h3>
              <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] mb-4">
                Traceable component weights
              </p>
              <Donut segments={donutSegments} centerLabel="Weights" />
            </Card>
          </div>

          {/* Data Table */}
          <div className="pt-2">
            <DataTable
              columns={tableColumns}
              data={tableData}
              keyExtractor={(row) => row.id}
            />
          </div>
        </section>
      )}

      {/* SECTION 5: OVERLAYS, STEPPER & MODALS */}
      {(activeTab === 'all' || activeTab === 'overlays') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5E6460] dark:text-[#9AA7AB]">
              Overlays, Dialogs, Drawers & Steppers
            </h2>
            <Pill variant="micro-status" color="pink" dot>Keyboard-Trapped</Pill>
          </div>

          <Card className="space-y-6">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5E6460] dark:text-[#9AA7AB] block mb-3">
                Application Progression Stepper
              </span>
              <Stepper
                currentStep={currentStep}
                onStepClick={setCurrentStep}
                steps={[
                  { id: 1, title: 'Resume Parsed', description: 'Deterministic offline text extractor' },
                  { id: 2, title: 'Semantic Scoring', description: 'Cosine & BM25 retrieval' },
                  { id: 3, title: 'Evidence Verification', description: 'GitHub repo validation' },
                  { id: 4, title: 'Final Human Decision', description: 'Recruiter hire/reject review' },
                ]}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-[#E7E7E2] dark:border-white/10">
              <Button variant="primary" onClick={() => setIsDialogOpen(true)}>
                Open Confirmation Dialog
              </Button>
              <Button variant="secondary" onClick={() => setIsDrawerOpen(true)}>
                Open Candidate Drawer
              </Button>

              <Tooltip content="Traceable to Section 4.2 evidence span">
                <button type="button" className="inline-flex items-center gap-1.5 text-xs text-[#1F8FA6] font-semibold underline cursor-pointer">
                  <Info className="w-3.5 h-3.5" /> Explainable Tooltip
                </button>
              </Tooltip>

              <Popover
                trigger={
                  <Button variant="ghost" size="sm">
                    Open Popover Card
                  </Button>
                }
                title="Traceable Score Weights"
                content={
                  <div>
                    <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
                      Semantic Cosine (0.45) + BM25 Keywords (0.25) + Experience Fit (0.20) + Role Alignment (0.10).
                    </p>
                  </div>
                }
              />
            </div>

            {/* Toast Demo */}
            {showToast && (
              <div className="pt-2">
                <Toast
                  title="Profile Evidence Verified"
                  description="3 public GitHub repositories linked with 42 verified commits in PyTorch & TypeScript."
                  variant="success"
                  onClose={() => setShowToast(false)}
                />
              </div>
            )}
          </Card>

          {/* Dialog Modal */}
          <Dialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            title="Confirm Stage Advancement"
            description="Advance Sophia Chen to Technical Interview stage?"
            footer={
              <>
                <Button variant="secondary" size="sm" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={() => setIsDialogOpen(false)}>
                  Advance Stage
                </Button>
              </>
            }
          >
            <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed">
              This will send a notification to the candidate and generate an interview scheduling link. No auto-reject is ever performed.
            </p>
          </Dialog>

          {/* Drawer Panel */}
          <Drawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            title="Candidate Deep Dive: Sophia Chen"
          >
            <div className="space-y-4">
              <div className="p-4 rounded-[16px] bg-[#F4F4F1] dark:bg-[#111719] border border-[#E7E7E2] dark:border-white/10">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#111312] dark:text-[#F2F6F7]">Overall Fit Score</span>
                  <span className="figure text-xl font-bold text-[#1F8FA6]">94%</span>
                </div>
                <HealthBar value={94} className="mt-3" />
              </div>
              <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed">
                Extracted 14 core skills with 100% deterministic fallback available. 3 repositories verified via GitHub OAuth.
              </p>
              <Button variant="primary" className="w-full" onClick={() => setIsDrawerOpen(false)}>
                Close Drawer
              </Button>
            </div>
          </Drawer>
        </section>
      )}

      {/* SECTION 6: ORIGINAL SVG ILLUSTRATIONS */}
      {(activeTab === 'all' || activeTab === 'illustrations') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5E6460] dark:text-[#9AA7AB]">
              Original Soft-Gradient SVG Illustration Set (9 Glyphs)
            </h2>
            <Pill variant="micro-status" color="teal" dot>Handcrafted Vector</Pill>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4">
            <Card className="flex flex-col items-center justify-center p-6 text-center">
              <EmptyIllustration />
              <span className="text-xs font-bold mt-2 text-[#111312] dark:text-[#F2F6F7]">Empty State</span>
              <span className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB]">Clean slate empty canvas</span>
            </Card>

            <Card className="flex flex-col items-center justify-center p-6 text-center">
              <ResumeParseIllustration />
              <span className="text-xs font-bold mt-2 text-[#111312] dark:text-[#F2F6F7]">Resume Parser</span>
              <span className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB]">Scanning text structure</span>
            </Card>

            <Card className="flex flex-col items-center justify-center p-6 text-center">
              <MatchFitIllustration />
              <span className="text-xs font-bold mt-2 text-[#111312] dark:text-[#F2F6F7]">Match Fit Target</span>
              <span className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB]">Verified fit bullseye</span>
            </Card>

            <Card className="flex flex-col items-center justify-center p-6 text-center">
              <InterviewIllustration />
              <span className="text-xs font-bold mt-2 text-[#111312] dark:text-[#F2F6F7]">Interview Schedule</span>
              <span className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB]">Timetable & dialogue</span>
            </Card>

            <Card className="flex flex-col items-center justify-center p-6 text-center">
              <SecurityIllustration />
              <span className="text-xs font-bold mt-2 text-[#111312] dark:text-[#F2F6F7]">Security & Privacy</span>
              <span className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB]">Bias-free protection shield</span>
            </Card>

            <Card className="flex flex-col items-center justify-center p-6 text-center">
              <SkillGapIllustration />
              <span className="text-xs font-bold mt-2 text-[#111312] dark:text-[#F2F6F7]">Skill Gap Bridge</span>
              <span className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB]">Missing skill roadmap</span>
            </Card>

            <Card className="flex flex-col items-center justify-center p-6 text-center">
              <AnalyticsIllustration />
              <span className="text-xs font-bold mt-2 text-[#111312] dark:text-[#F2F6F7]">Analytics & Metrics</span>
              <span className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB]">Yield curves & KPIs</span>
            </Card>

            <Card className="flex flex-col items-center justify-center p-6 text-center">
              <WorkflowIllustration />
              <span className="text-xs font-bold mt-2 text-[#111312] dark:text-[#F2F6F7]">Workflow Pipeline</span>
              <span className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB]">Recruiter stage transition</span>
            </Card>

            <Card className="flex flex-col items-center justify-center p-6 text-center">
              <UploadIllustration />
              <span className="text-xs font-bold mt-2 text-[#111312] dark:text-[#F2F6F7]">Document Upload</span>
              <span className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB]">PDF/DOCX cloud intake</span>
            </Card>
          </div>
        </section>
      )}

      {/* SECTION 7: TOKEN INSPECTOR & ACCESSIBILITY AUDIT */}
      {(activeTab === 'all' || activeTab === 'tokens') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5E6460] dark:text-[#9AA7AB]">
              Live Design Contract Token Inspector & Contrast Ratios
            </h2>
            <Pill variant="micro-status" color="green" dot>Contrast Passed 4.5:1+</Pill>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dark Obsidian Tokens */}
            <Card>
              <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7] mb-3 flex items-center justify-between">
                <span>Dark Mode Tokens (Obsidian)</span>
                <span className="text-xs font-mono text-[#5FD3E8]">canvas: #050708</span>
              </h3>
              <div className="space-y-2 text-xs">
                {[
                  { name: 'Canvas Base', hex: '#050708', usage: 'Page background with faint teal radial glow', contrast: '19.4:1 vs #F2F6F7' },
                  { name: 'Sidebar Shell', hex: '#080B0C', usage: 'Navigation container', contrast: '18.1:1 vs #F2F6F7' },
                  { name: 'Card Surface', hex: '#0C1113', usage: 'Bento standard cards', contrast: '16.5:1 vs #F2F6F7' },
                  { name: 'Raised Card', hex: '#111719', usage: 'Elevated popups and hover states', contrast: '14.8:1 vs #F2F6F7' },
                  { name: 'Brand Accent Teal', hex: '#1F8FA6', usage: 'Primary buttons, active nav, glowing pills', contrast: '4.8:1 vs Canvas' },
                  { name: 'Category Pink', hex: '#D98BE8', usage: 'Accent bar & chart segment', contrast: '8.2:1 vs Canvas' },
                  { name: 'Category Yellow', hex: '#F2C94C', usage: 'Warning & chart category', contrast: '11.5:1 vs Canvas' },
                  { name: 'Category Green', hex: '#7ED957', usage: 'Success & offer stages', contrast: '10.8:1 vs Canvas' },
                ].map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-black/5 dark:bg-white/4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: t.hex }} />
                      <div>
                        <span className="font-semibold text-[#111312] dark:text-[#F2F6F7]">{t.name}</span>
                        <span className="font-mono text-[10px] text-[#5E6460] dark:text-[#9AA7AB] ml-2">{t.hex}</span>
                      </div>
                    </div>
                    <span className="font-medium text-[#15803D] dark:text-[#7ED957] text-[11px]">{t.contrast}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Light Paper Tokens */}
            <Card>
              <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7] mb-3 flex items-center justify-between">
                <span>Light Mode Tokens (Paper)</span>
                <span className="text-xs font-mono text-[#1F8FA6]">surface: #F4F4F1</span>
              </h3>
              <div className="space-y-2 text-xs">
                {[
                  { name: 'Outer Canvas', hex: '#E9E9E5', usage: 'Framing gutter warm grey', contrast: '16.2:1 vs #111312' },
                  { name: 'App Surface', hex: '#F4F4F1', usage: 'Main application background', contrast: '17.8:1 vs #111312' },
                  { name: 'Card Surface', hex: '#FFFFFF', usage: 'Crisp cards with hairline border', contrast: '19.8:1 vs #111312' },
                  { name: 'Muted Card', hex: '#F6F6F3', usage: 'Raised chips and code containers', contrast: '18.1:1 vs #111312' },
                  { name: 'Primary Button Ink', hex: '#111312', usage: 'Vestmark ink black button with white text', contrast: '19.8:1 vs White' },
                  { name: 'Hairline Border', hex: '#E7E7E2', usage: '1px hairline dividers', contrast: 'Subtle 1.2:1' },
                  { name: 'Delta Green Pill', hex: '#E3F5EA', usage: 'Positive match/metric badge', contrast: '5.2:1 text (#15803D)' },
                  { name: 'Info Blue Chip', hex: '#E6EEFF', usage: 'Candidate status tag', contrast: '6.4:1 text (#2F5BEA)' },
                ].map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-black/5 dark:bg-white/4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: t.hex }} />
                      <div>
                        <span className="font-semibold text-[#111312] dark:text-[#F2F6F7]">{t.name}</span>
                        <span className="font-mono text-[10px] text-[#5E6460] dark:text-[#9AA7AB] ml-2">{t.hex}</span>
                      </div>
                    </div>
                    <span className="font-medium text-[#15803D] dark:text-[#7ED957] text-[11px]">{t.contrast}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
};
