import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { StatTile } from '../../components/ui/StatTile';
import { ScoreRing } from '../../components/ui/ScoreRing';
import { GradientHealthBar } from '../../components/ui/GradientHealthBar';
import { Slider } from '../../components/ui/Slider';
import { useTheme } from '../../context/ThemeContext';
import {
  Sparkles,
  Sun,
  Moon,
  Laptop,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Layers,
  Sliders,
  BarChart,
  Search,
} from 'lucide-react';

export const DesignSystemCatalogPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [sliderVal, setSliderVal] = useState<number>(75);
  const [inputVal, setInputVal] = useState<string>('alex.smith@example.com');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Top Title & Theme Controller */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-light-border dark:border-surface-dark-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Resumio Design System & Component Visual Truth
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Accessible, WCAG 2.2 AA compliant UI primitives inspired by FinGlow (Dark Bento & Neon Accents) and Vestmark (Light Hairlines & Warm Grey).
          </p>
        </div>

        {/* 3-Mode Theme Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-control bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/60 dark:border-slate-700/60">
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-bold transition-all ${
              theme === 'light'
                ? 'bg-white text-slate-950 shadow-subtle'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5" /> Light
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-bold transition-all ${
              theme === 'dark'
                ? 'bg-slate-900 text-teal-300 shadow-glow-teal'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5" /> Dark
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-bold transition-all ${
              theme === 'system'
                ? 'bg-teal-500 text-slate-950 shadow-subtle font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" /> System
          </button>
        </div>
      </div>

      {/* 1. Stat Tiles & Bento Cards */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-500" /> Bento Stat Tiles (FinGlow / Vestmark)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile
            label="Total Candidates"
            value="12,340"
            delta={{ value: '+14.8%', isPositive: true }}
            subtitle="Indexed in talent pool"
          />
          <StatTile
            label="Average Match Rate"
            value="84.2%"
            delta={{ value: '+3.2%', isPositive: true }}
            subtitle="BM25 + Semantic Cosine"
          />
          <StatTile
            label="Time to Hire"
            value="18.4d"
            delta={{ value: '-46% vs Ind.', isPositive: true }}
            subtitle="Industry avg: 34.0d"
          />
          <StatTile
            label="Recruiter Collision"
            value="0.0%"
            delta={{ value: 'Zero Overlap', isNeutral: true }}
            subtitle="Real-time SSE active"
          />
        </div>
      </section>

      {/* 2. Candidate Fit Hero Visualization */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <BarChart className="w-4 h-4 text-teal-500" /> Score Rings & Multi-Color Gradient Health Bars
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card padding="md" className="flex items-center justify-around">
            <ScoreRing score={96} size={110} strokeWidth={9} label="Top Match" />
            <ScoreRing score={74} size={110} strokeWidth={9} label="Strong Fit" />
            <ScoreRing score={42} size={110} strokeWidth={9} label="Low Match" />
          </Card>

          <Card padding="md" className="md:col-span-2 space-y-4 flex flex-col justify-center">
            <GradientHealthBar score={92} label="Candidate #A4F9 Pipeline Fit Health" />
            <GradientHealthBar score={68} label="Mid-Tier Engineering Match" />
            <GradientHealthBar score={38} label="Incomplete Qualifications Match" />
          </Card>
        </div>
      </section>

      {/* 3. Interactive Controls & Buttons */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-teal-500" /> Interactive Buttons, Sliders & Inputs
        </h2>
        <Card padding="md" className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary Action</Button>
            <Button variant="secondary">Secondary Action</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="destructive">Destructive Action</Button>
            <Button variant="ghost">Ghost Button</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-4">
              <Input
                label="Candidate Email"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-4">
              <Slider
                label="Dynamic Weight Slider"
                value={sliderVal}
                onChange={setSliderVal}
              />
            </div>
          </div>
        </Card>
      </section>

      {/* 4. Badges & Status Chips */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Status Chips & Pills
        </h2>
        <Card padding="md" className="flex flex-wrap items-center gap-3">
          <Badge variant="success">Shortlisted</Badge>
          <Badge variant="info">Interview Scheduled</Badge>
          <Badge variant="warning">Under Review</Badge>
          <Badge variant="error">Rejected</Badge>
          <Badge variant="brand">AI Verified</Badge>
        </Card>
      </section>
    </div>
  );
};
