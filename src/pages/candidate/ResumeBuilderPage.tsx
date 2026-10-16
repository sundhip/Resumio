import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  Copy,
  Check,
  Plus,
  Trash2,
  Wand2,
  Sliders,
  Send,
  Eye,
  Edit3
} from 'lucide-react';
import type {
  TailorAnalysisReport,
  ResumeHealthReport,
  AtsSimulationResult,
  AtsSimulationPack,
  BulletRewriteResult
} from '../../../packages/shared/src/index.js';

type BuilderTab = 'builder' | 'tailor' | 'rewriter' | 'simulator' | 'health' | 'grounded';
type TemplateId = 'classic_ats' | 'modern_clean' | 'technical_compact';

export const ResumeBuilderPage: React.FC<{ onNavigate?: (path: string) => void }> = () => {
  const [activeTab, setActiveTab] = useState<BuilderTab>('builder');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('modern_clean');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Resume Data State
  const [resumeData, setResumeData] = useState<any>({
    personal: {
      fullName: 'Rahul Sharma',
      email: 'rahul.sharma@resumio.demo',
      phone: '+91 98765 43210',
      location: 'Chennai, Tamil Nadu',
      headline: 'Senior Full-Stack & Systems Engineer',
      linkedin: 'linkedin.com/in/rahulsharma-demo',
      github: 'github.com/rahulsharma-demo'
    },
    summary: 'Senior software engineer with 5+ years of experience architecting distributed TypeScript and Python microservices, leading technical teams, and optimizing search ranking algorithms.',
    experience: [
      {
        company: 'Nexora Technologies',
        role: 'Senior Software Engineer',
        location: 'Chennai, India',
        startDate: '2022-03',
        endDate: 'Present',
        isCurrent: true,
        bullets: [
          'Architected and deployed distributed event-driven microservices using Node.js and Redis, reducing end-to-end API latency by 42%.',
          'Spearheaded migration of core database cluster to PostgreSQL, scaling throughput by 3x across 150k daily active users.',
          'Mentored 6 junior engineers on unit testing and CI/CD pipelines, improving overall team sprint velocity by 25%.'
        ]
      },
      {
        company: 'Apex Cloud Systems',
        role: 'Software Engineer',
        location: 'Bangalore, India',
        startDate: '2019-06',
        endDate: '2022-02',
        isCurrent: false,
        bullets: [
          'Developed responsive React 18 single-page applications with Tailwind CSS, increasing user session engagement by 35%.',
          'Implemented OAuth2 authentication and RBAC security policies, protecting over 50,000 candidate profiles.',
          'Resolved critical memory leaks in search indexer, saving $12,000 annually in cloud infrastructure overhead.'
        ]
      }
    ],
    skills: {
      languages: ['TypeScript', 'JavaScript', 'Python', 'SQL', 'Go'],
      frameworks: ['React', 'Node.js', 'Express', 'Tailwind CSS', 'FastAPI'],
      tools: ['PostgreSQL', 'Redis', 'Docker', 'AWS', 'Git', 'Kafka'],
      softSkills: ['System Design', 'Agile Leadership', 'Cross-Functional Collaboration']
    },
    education: [
      {
        institution: 'Anna University',
        degree: 'B.Tech in Computer Science and Engineering',
        location: 'Chennai, India',
        graduationYear: '2019',
        gpa: '8.8 / 10'
      }
    ],
    projects: [
      {
        name: 'Resumio Open-Source Evaluator',
        role: 'Creator & Maintainer',
        technologies: ['TypeScript', 'Node.js', 'SQLite', 'Tailwind CSS'],
        url: 'https://github.com/resumio/resumio',
        bullets: [
          'Designed ATS simulation algorithms evaluating candidate text extraction across 4 parser heuristics.',
          'Achieved 96.8% parse fidelity across 10,000 synthetic resume benchmarks.'
        ]
      }
    ],
    achievements: [
      'Published engineering paper on Monotonic Learning-to-Rank algorithms in Applied AI 2024.',
      'Recipient of Nexora Annual Engineering Excellence Award 2023.'
    ]
  });

  // Tailor-to-Job State
  const [targetJob, setTargetJob] = useState({
    title: 'Staff Full-Stack Engineer',
    company: 'FinGlow Digital Assets',
    minYearsExperience: 5,
    requiredSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'Distributed Systems'],
    preferredSkills: ['GraphQL', 'Kubernetes', 'FastAPI', 'Rust'],
    description: 'Looking for a Staff Full-Stack Engineer to architect mission-critical financial dashboards, lead distributed services scaling, and build responsive interfaces.'
  });
  const [tailorReport, setTailorReport] = useState<TailorAnalysisReport | null>(null);

  // Bullet Rewriter State
  const [inputBullet, setInputBullet] = useState('Responsible for creating backend APIs and managing server databases.');
  const [userMetric, setUserMetric] = useState('achieving 99.9% uptime across 200k requests');
  const [rewriteResult, setRewriteResult] = useState<BulletRewriteResult | null>(null);

  // ATS Simulator State
  const [selectedPack, setSelectedPack] = useState<AtsSimulationPack>('strict_legacy');
  const [simulationResult, setSimulationResult] = useState<AtsSimulationResult | null>(null);

  // Resume Health State
  const [healthReport, setHealthReport] = useState<ResumeHealthReport | null>(null);

  // Grounded Extras State
  const [groundedSummary, setGroundedSummary] = useState<any>(null);
  const [groundedCoverLetter, setGroundedCoverLetter] = useState<any>(null);
  const [copiedText, setCopiedText] = useState(false);

  // Load candidate saved resume doc on initial render
  useEffect(() => {
    fetch('/api/optimizer/builder/load', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.document) {
          setSelectedTemplate(data.document.templateId || 'modern_clean');
          if (data.document.resumeData) {
            setResumeData(data.document.resumeData);
          }
        }
      })
      .catch(() => {});
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Run Tailor Analysis
  const handleRunTailor = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/optimizer/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: {
            skills: [
              ...resumeData.skills.languages,
              ...resumeData.skills.frameworks,
              ...resumeData.skills.tools
            ],
            experience: resumeData.experience,
            education: resumeData.education,
            projects: resumeData.projects,
            achievements: resumeData.achievements,
            document: {
              extractedText: `${resumeData.summary} ${resumeData.experience.map((e: any) => e.bullets.join(' ')).join(' ')}`
            }
          },
          jobData: targetJob
        })
      });
      const data = await res.json();
      if (data.success) {
        setTailorReport(data.report);
        showToast('Tailoring analysis completed successfully.');
      }
    } catch (err: any) {
      showToast('Tailor analysis failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Run Bullet Rewrite
  const handleRewriteBullet = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/optimizer/rewrite-bullet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bullet: inputBullet, userMetric, targetRole: targetJob.title })
      });
      const data = await res.json();
      if (data.success) {
        setRewriteResult(data);
      }
    } catch (err: any) {
      showToast('Rewrite failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Run ATS Simulation
  const handleRunSimulation = async (pack: AtsSimulationPack = selectedPack) => {
    setIsLoading(true);
    setSelectedPack(pack);
    try {
      const rawText = `
${resumeData.personal.fullName}
${resumeData.personal.email} | ${resumeData.personal.phone} | ${resumeData.personal.location}

Summary
${resumeData.summary}

Experience
${resumeData.experience.map((exp: any) => `
${exp.role} - ${exp.company} (${exp.startDate} - ${exp.endDate})
${exp.bullets.map((b: string) => `• ${b}`).join('\n')}
`).join('\n')}

Technical Skills
Languages: ${resumeData.skills.languages.join(', ')}
Frameworks: ${resumeData.skills.frameworks.join(', ')}
Tools: ${resumeData.skills.tools.join(', ')}

Education
${resumeData.education.map((edu: any) => `${edu.degree}, ${edu.institution} (${edu.graduationYear})`).join('\n')}
`;

      const res = await fetch('/api/optimizer/simulate-ats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText, pack })
      });
      const data = await res.json();
      if (data.success) {
        setSimulationResult(data.simulation);
      }
    } catch (err: any) {
      showToast('Simulation failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Run Resume Health
  const handleRunHealthCheck = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/optimizer/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: {
            personal: resumeData.personal,
            summary: resumeData.summary,
            skills: [
              ...resumeData.skills.languages,
              ...resumeData.skills.frameworks,
              ...resumeData.skills.tools
            ],
            experience: resumeData.experience,
            education: resumeData.education,
            projects: resumeData.projects,
            achievements: resumeData.achievements
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setHealthReport(data.health);
        showToast('Resume health calculated.');
      }
    } catch (err: any) {
      showToast('Health check failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Run Grounded Extras
  const handleGenerateGroundedSummary = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/optimizer/grounded/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateFacts: {
            name: resumeData.personal.fullName,
            currentRole: resumeData.personal.headline,
            yearsOfExperience: 5,
            companies: resumeData.experience.map((e: any) => e.company),
            skills: [
              ...resumeData.skills.languages,
              ...resumeData.skills.frameworks,
              ...resumeData.skills.tools
            ],
            education: resumeData.education,
            verifiedAchievements: resumeData.achievements,
            verifiedProjects: resumeData.projects
          },
          targetJob
        })
      });
      const data = await res.json();
      if (data.success) {
        setGroundedSummary(data.result);
      }
    } catch (err: any) {
      showToast('Summary generation failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateGroundedCoverLetter = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/optimizer/grounded/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateFacts: {
            name: resumeData.personal.fullName,
            currentRole: resumeData.personal.headline,
            yearsOfExperience: 5,
            companies: resumeData.experience.map((e: any) => e.company),
            skills: [
              ...resumeData.skills.languages,
              ...resumeData.skills.frameworks,
              ...resumeData.skills.tools
            ],
            education: resumeData.education,
            verifiedAchievements: resumeData.achievements,
            verifiedProjects: resumeData.projects
          },
          targetJob
        })
      });
      const data = await res.json();
      if (data.success) {
        setGroundedCoverLetter(data.result);
      }
    } catch (err: any) {
      showToast('Cover letter generation failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Export Resume File
  const handleExport = async (format: 'pdf' | 'docx' | 'html') => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/optimizer/builder/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
          resumeData,
          format
        })
      });

      if (!res.ok) throw new Error('Export request failed.');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resumeData.personal.fullName.replace(/\s+/g, '_')}_ATS_Resume.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast(`Exported ${format.toUpperCase()} successfully.`);
    } catch (err: any) {
      showToast('Export failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Run Automated CI Round-Trip Test in Browser
  const handleRunRoundTripTest = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/optimizer/builder/round-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: selectedTemplate })
      });
      const data = await res.json();
      if (data.success && data.result) {
        showToast(
          `Round-Trip Fidelity: ${(data.result.fidelityScore * 100).toFixed(1)}% (${
            data.result.passed ? 'PASSED >= 95%' : 'FAILED'
          })`
        );
      }
    } catch (err: any) {
      showToast('Round trip test failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Save to Database
  const handleSaveDocument = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/optimizer/builder/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          templateId: selectedTemplate,
          resumeData,
          title: `${resumeData.personal.fullName} - ATS Resume`
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Resume saved to your account.');
      }
    } catch (err: any) {
      showToast('Save failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-sm font-medium animate-slide-in">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-600/10 via-indigo-600/10 to-teal-500/10 border border-brand-500/20 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-600 dark:text-brand-300">
                Phase 7 ATS Studio
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                True Single-Column Text-Layer Engine
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              ATS-Guided Resume Optimizer & Builder
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
              Construct high-fidelity ATS-safe resumes, calibrate job tailoring with the Phase 6 Match Engine, rewrite quantified XYZ bullets with zero fabrication, and simulate heuristic parsing across 4 industry rule packs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveDocument}
              disabled={isLoading}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl transition flex items-center gap-2 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Save Document
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
          {[
            { id: 'builder', label: 'Resume Builder & Templates', icon: <Edit3 className="w-4 h-4" /> },
            { id: 'tailor', label: 'Tailor-to-Job Analysis', icon: <Sliders className="w-4 h-4" /> },
            { id: 'rewriter', label: 'Google XYZ Bullet Studio', icon: <Wand2 className="w-4 h-4" /> },
            { id: 'simulator', label: 'ATS Parser Simulator', icon: <Layers className="w-4 h-4" /> },
            { id: 'health', label: 'Resume Health Suite', icon: <Activity className="w-4 h-4" /> },
            { id: 'grounded', label: 'Grounded Cover Letter', icon: <Send className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as BuilderTab)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: BUILDER & LIVE PREVIEW */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Form Controls */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  1. Choose ATS Template
                </h3>
                <button
                  onClick={handleRunRoundTripTest}
                  disabled={isLoading}
                  className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Test Parse Fidelity (CI)
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'classic_ats', label: 'Classic ATS', desc: 'Serif, 0.75in margins, hyper-compatible' },
                  { id: 'modern_clean', label: 'Modern Clean', desc: 'Sans-serif, clean divider lines' },
                  { id: 'technical_compact', label: 'Tech Compact', desc: 'Dense tabular grid, high data signal' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id as TemplateId)}
                    className={`p-3 rounded-xl border text-left transition ${
                      selectedTemplate === t.id
                        ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20 ring-1 ring-brand-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-900 dark:text-white">{t.label}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{t.desc}</div>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" /> True Text PDF
                </button>
                <button
                  onClick={() => handleExport('docx')}
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" /> Clean DOCX
                </button>
                <button
                  onClick={() => handleExport('html')}
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" /> HTML
                </button>
              </div>
            </div>

            {/* Form Editor */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                2. Contact & Personal Info
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={resumeData.personal.fullName}
                    onChange={e => setResumeData({
                      ...resumeData,
                      personal: { ...resumeData.personal, fullName: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 block mb-1">Headline</label>
                  <input
                    type="text"
                    value={resumeData.personal.headline}
                    onChange={e => setResumeData({
                      ...resumeData,
                      personal: { ...resumeData.personal, headline: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 block mb-1">Email</label>
                  <input
                    type="email"
                    value={resumeData.personal.email}
                    onChange={e => setResumeData({
                      ...resumeData,
                      personal: { ...resumeData.personal, email: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={resumeData.personal.phone}
                    onChange={e => setResumeData({
                      ...resumeData,
                      personal: { ...resumeData.personal, phone: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1 text-xs">Summary</label>
                <textarea
                  rows={3}
                  value={resumeData.summary}
                  onChange={e => setResumeData({ ...resumeData, summary: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Experience Bullets Editor */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  3. Experience & Quantified Bullets
                </h3>
                <span className="text-[11px] text-slate-500">Google XYZ Impact Recommended</span>
              </div>

              {resumeData.experience.map((exp: any, idx: number) => (
                <div key={idx} className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span>{exp.role} at {exp.company}</span>
                    <span className="text-slate-500 font-normal">{exp.startDate} - {exp.endDate}</span>
                  </div>
                  <div className="space-y-1.5">
                    {exp.bullets.map((b: string, bIdx: number) => (
                      <div key={bIdx} className="flex items-start gap-1.5">
                        <span className="text-brand-500 mt-1">•</span>
                        <input
                          type="text"
                          value={b}
                          onChange={e => {
                            const newExp = [...resumeData.experience];
                            newExp[idx].bullets[bIdx] = e.target.value;
                            setResumeData({ ...resumeData, experience: newExp });
                          }}
                          className="flex-1 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Categorized Skills Matrix */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                4. Categorized Skills Matrix
              </h3>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-300 block mb-1">Languages:</span>
                  <input
                    type="text"
                    value={resumeData.skills.languages.join(', ')}
                    onChange={e => setResumeData({
                      ...resumeData,
                      skills: { ...resumeData.skills, languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }
                    })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-300 block mb-1">Frameworks:</span>
                  <input
                    type="text"
                    value={resumeData.skills.frameworks.join(', ')}
                    onChange={e => setResumeData({
                      ...resumeData,
                      skills: { ...resumeData.skills, frameworks: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }
                    })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-300 block mb-1">Tools & Infrastructure:</span>
                  <input
                    type="text"
                    value={resumeData.skills.tools.join(', ')}
                    onChange={e => setResumeData({
                      ...resumeData,
                      skills: { ...resumeData.skills, tools: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }
                    })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Live Rendered ATS Preview */}
          <div className="lg:col-span-7">
            <div className="sticky top-20 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-md">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-brand-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Live ATS Render ({selectedTemplate})
                  </span>
                </div>
                <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded">
                  ✓ True Text-Layer Active
                </span>
              </div>

              {/* Formatted Resume Body */}
              <div className="max-w-xl mx-auto space-y-6 text-slate-900 dark:text-slate-100 font-sans">
                {/* Header */}
                <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800">
                  <h2 className="text-2xl font-bold tracking-tight">{resumeData.personal.fullName}</h2>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">
                    {resumeData.personal.headline}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 space-x-2">
                    <span>{resumeData.personal.email}</span>
                    <span>•</span>
                    <span>{resumeData.personal.phone}</span>
                    <span>•</span>
                    <span>{resumeData.personal.location}</span>
                  </p>
                </div>

                {/* Summary */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 pb-1 border-b border-slate-200 dark:border-slate-800">
                    Professional Summary
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">
                    {resumeData.summary}
                  </p>
                </div>

                {/* Experience */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 pb-1 border-b border-slate-200 dark:border-slate-800">
                    Work Experience
                  </h4>
                  <div className="space-y-4 mt-3">
                    {resumeData.experience.map((exp: any, i: number) => (
                      <div key={i} className="text-xs space-y-1">
                        <div className="flex justify-between font-semibold">
                          <span>{exp.role} — <span className="font-normal text-slate-600 dark:text-slate-400">{exp.company}</span></span>
                          <span className="text-[11px] text-slate-500 font-normal">{exp.startDate} – {exp.endDate}</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 pl-1">
                          {exp.bullets.map((b: string, bi: number) => (
                            <li key={bi} className="leading-relaxed">{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills Matrix */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 pb-1 border-b border-slate-200 dark:border-slate-800">
                    Technical Skills Matrix
                  </h4>
                  <div className="text-xs mt-2 space-y-1 text-slate-700 dark:text-slate-300">
                    <div><span className="font-semibold">Languages:</span> {resumeData.skills.languages.join(', ')}</div>
                    <div><span className="font-semibold">Frameworks:</span> {resumeData.skills.frameworks.join(', ')}</div>
                    <div><span className="font-semibold">Tools & Cloud:</span> {resumeData.skills.tools.join(', ')}</div>
                  </div>
                </div>

                {/* Projects */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 pb-1 border-b border-slate-200 dark:border-slate-800">
                    High-Signal Projects
                  </h4>
                  <div className="mt-2 space-y-3">
                    {resumeData.projects.map((proj: any, pi: number) => (
                      <div key={pi} className="text-xs">
                        <div className="font-semibold">{proj.name} — <span className="font-normal text-slate-500">{proj.technologies?.join(', ')}</span></div>
                        <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 pl-1 mt-1">
                          {proj.bullets.map((b: string, bi: number) => (
                            <li key={bi}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Education */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 pb-1 border-b border-slate-200 dark:border-slate-800">
                    Education
                  </h4>
                  <div className="mt-2 space-y-2 text-xs">
                    {resumeData.education.map((edu: any, ei: number) => (
                      <div key={ei} className="flex justify-between">
                        <span><span className="font-semibold">{edu.degree}</span>, {edu.institution}</span>
                        <span className="text-slate-500">{edu.graduationYear}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TAILOR-TO-JOB ANALYSIS */}
      {activeTab === 'tailor' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Target Job Specification
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Select or paste a target position to run ATS gap analysis, keyword-stuffing detection, and Phase 6 match scoring.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">Target Job Title</label>
                <input
                  type="text"
                  value={targetJob.title}
                  onChange={e => setTargetJob({ ...targetJob, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                />
              </div>
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">Company</label>
                <input
                  type="text"
                  value={targetJob.company}
                  onChange={e => setTargetJob({ ...targetJob, company: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">Min Years Experience</label>
                <input
                  type="number"
                  value={targetJob.minYearsExperience}
                  onChange={e => setTargetJob({ ...targetJob, minYearsExperience: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-3 text-xs">
              <label className="text-slate-600 dark:text-slate-400 block mb-1">Required Skills (Comma separated)</label>
              <input
                type="text"
                value={targetJob.requiredSkills.join(', ')}
                onChange={e => setTargetJob({
                  ...targetJob,
                  requiredSkills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleRunTailor}
                disabled={isLoading}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition"
              >
                <Sliders className="w-4 h-4" /> Run ATS Tailor Analysis
              </button>
            </div>
          </div>

          {tailorReport && (
            <div className="space-y-6">
              {/* Top Score Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Current Match Score</div>
                  <div className="text-3xl font-extrabold text-brand-600 dark:text-brand-400 mt-2">
                    {tailorReport.currentScore}
                    <span className="text-xs text-slate-400 font-normal"> / 100</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Calculated via Phase 6 Scorer V2</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Potential After Optimizing</div>
                  <div className="text-3xl font-extrabold text-teal-600 dark:text-teal-400 mt-2">
                    {tailorReport.potentialOptimizedScore}
                    <span className="text-xs text-slate-400 font-normal"> / 100</span>
                  </div>
                  <div className="text-[11px] text-teal-600 dark:text-teal-400 font-medium mt-1">
                    +{tailorReport.potentialOptimizedScore - tailorReport.currentScore} pts available
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Required Skill Coverage</div>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                    {(tailorReport.skillCoverage.requiredCoverageRatio * 100).toFixed(0)}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {tailorReport.skillCoverage.matchedRequired.length} of {targetJob.requiredSkills.length} required
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Keyword Stuffing Guard</div>
                  <div className="flex items-center gap-2 mt-2">
                    {tailorReport.keywordStuffing.isManipulative ? (
                      <span className="text-red-500 font-bold text-sm flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" /> Warning
                      </span>
                    ) : (
                      <span className="text-teal-500 font-bold text-sm flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Healthy Density
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Max word density: {tailorReport.keywordStuffing.maxDensityPercent}%
                  </div>
                </div>
              </div>

              {/* Truthfulness Rule Section */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-brand-500" />
                      Truthfulness Rule: Missing Skills Inquiry
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      We never auto-insert unevidenced keywords. Review missing skills and confirm if you possess verified experience.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tailorReport.skillCoverage.missingRequired.map((skill, idx) => (
                    <div key={idx} className="p-3.5 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">{skill}</div>
                        <div className="text-[10px] text-amber-700 dark:text-amber-400">Required by job description</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Do you have this?</span>
                        <button
                          onClick={() => {
                            setResumeData({
                              ...resumeData,
                              skills: {
                                ...resumeData.skills,
                                tools: [...resumeData.skills.tools, skill]
                              }
                            });
                            showToast(`Added verified skill '${skill}' to your skills matrix.`);
                          }}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold rounded-lg transition"
                        >
                          Yes, Add
                        </button>
                      </div>
                    </div>
                  ))}

                  {tailorReport.skillCoverage.missingRequired.length === 0 && (
                    <div className="col-span-2 p-4 text-center text-xs text-teal-600 dark:text-teal-400 font-medium">
                      ✓ All required skills matched to your resume!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GOOGLE XYZ BULLET REWRITER */}
      {activeTab === 'rewriter' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400">
              Strict No-Fabrication Guarantee
            </span>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mt-2">
              Google XYZ Impact Bullet Coach
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Transform generic duty descriptions into impactful accomplishment statements: <span className="font-semibold text-slate-800 dark:text-slate-200">Accomplished [X] as measured by [Y], by doing [Z]</span>. Zero fabricated metrics or tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Column */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Original Weak Bullet Point
                </label>
                <textarea
                  rows={3}
                  value={inputBullet}
                  onChange={e => setInputBullet(e.target.value)}
                  placeholder="e.g. Responsible for creating backend APIs and managing server databases."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Your Real Metric / Outcome (Optional)
                </label>
                <input
                  type="text"
                  value={userMetric}
                  onChange={e => setUserMetric(e.target.value)}
                  placeholder="e.g. cutting query latency by 45% or saving 10 hours weekly"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  If left blank, the rewriter will insert an explicit metric placeholder instead of fabricating data.
                </p>
              </div>

              <button
                onClick={handleRewriteBullet}
                disabled={isLoading}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Wand2 className="w-4 h-4" /> Rewrite with Google XYZ Formula
              </button>
            </div>

            {/* Output Column */}
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Rewritten Impact Statement
                </span>
                {rewriteResult && (
                  <span className="text-[11px] bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> No Fabrication Verified
                  </span>
                )}
              </div>

              {rewriteResult ? (
                <div className="space-y-4">
                  <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white leading-relaxed">
                    {rewriteResult.rewrittenBullet}
                  </div>

                  {rewriteResult.suggestedPromptIfMissingMetric && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                      <div className="font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Missing Metric Prompt:
                      </div>
                      <div className="mt-1">{rewriteResult.suggestedPromptIfMissingMetric}</div>
                    </div>
                  )}

                  <div className="text-[11px] space-y-1 text-slate-500">
                    <div><span className="font-semibold">Action [Z]:</span> {rewriteResult.components.action}</div>
                    <div><span className="font-semibold">Accomplishment [X]:</span> {rewriteResult.components.accomplished}</div>
                    <div><span className="font-semibold">Measurement [Y]:</span> {rewriteResult.components.measured}</div>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(rewriteResult.rewrittenBullet);
                      showToast('Copied rewritten bullet to clipboard.');
                    }}
                    className="w-full py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Bullet to Clipboard
                  </button>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  Click rewrite to generate an ATS-grade XYZ impact statement.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ATS SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  ATS Parser Simulator
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Simulate extraction outcomes across 4 heuristic parsing engines used by enterprise recruiting platforms.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {[
                  { id: 'strict_legacy', label: 'Strict Legacy' },
                  { id: 'lenient_modern', label: 'Lenient Modern' },
                  { id: 'keyword_scanner', label: 'Keyword Scanner' },
                  { id: 'semantic_ats', label: 'Semantic ATS' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleRunSimulation(p.id as AtsSimulationPack)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      selectedPack === p.id
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {simulationResult && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Score & Issues */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Parse Confidence Score</div>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {simulationResult.parseConfidenceScore}
                    <span className="text-xs text-slate-400 font-normal"> / 100</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Extracted {simulationResult.extractedSections.length} sections and {simulationResult.extractedSkills.length} skills.
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Detected Parser Issues ({simulationResult.issuesDetected.length})
                  </h4>

                  <div className="space-y-2">
                    {simulationResult.issuesDetected.map((issue, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs space-y-1 ${
                          issue.severity === 'critical'
                            ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50'
                            : issue.severity === 'warning'
                            ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                            : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50'
                        }`}
                      >
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                          <span>{issue.title}</span>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-900">
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">{issue.description}</p>
                        {issue.autoFixAvailable && (
                          <div className="pt-1">
                            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">
                              ✓ Auto-Fix recommendation available
                            </span>
                          </div>
                        )}
                      </div>
                    ))}

                    {simulationResult.issuesDetected.length === 0 && (
                      <div className="p-4 text-center text-xs text-teal-600 font-medium">
                        ✓ No parsing defects detected for this rule pack.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Extracted Text Pane */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Simulated Extracted Output
                  </h4>
                  <span className="text-[11px] text-slate-500">As perceived by parser algorithms</span>
                </div>

                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-y-auto max-h-[460px] leading-relaxed whitespace-pre-wrap">
                  {simulationResult.extractedText}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: RESUME HEALTH SUITE */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Resume Health Suite
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                8 diagnostic dimensions evaluating document rigor, action-verb vitality, spelling fidelity, and privacy protections.
              </p>
            </div>
            <button
              onClick={handleRunHealthCheck}
              disabled={isLoading}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition"
            >
              <Activity className="w-4 h-4" /> Calculate Health Score
            </button>
          </div>

          {healthReport && (
            <div className="space-y-6">
              {/* Overall Score */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Resume Strength Score
                  </div>
                  <div className="text-4xl font-black text-brand-600 dark:text-brand-400 mt-2">
                    {healthReport.strengthScore}
                    <span className="text-sm font-normal text-slate-400"> / 100</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Decoupled from job fit: measures pure structural and linguistic quality.
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Quantification Ratio
                  </div>
                  <div className="text-4xl font-black text-teal-600 dark:text-teal-400 mt-2">
                    {healthReport.diagnostics.quantification.quantificationRatioPercent}%
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Target: ≥50% of bullets containing measurable numbers or outcomes.
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Action Verb Vitality
                  </div>
                  <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
                    {healthReport.diagnostics.actionVerbs.strongVerbRatioPercent}%
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Ratio of active power verbs (architected, pioneered) vs passive verbs.
                  </p>
                </div>
              </div>

              {/* Privacy and Spelling Checks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                    Privacy & Bias Risk Audit
                  </h4>
                  {healthReport.diagnostics.personalDataWarnings.length > 0 ? (
                    <div className="space-y-2">
                      {healthReport.diagnostics.personalDataWarnings.map((w, wi) => (
                        <div key={wi} className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                          {w}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 text-xs font-medium rounded-xl">
                      ✓ No personal bias risks detected (no photo, marital status, or DOB).
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                    Technical Terminology & Typo Check
                  </h4>
                  {healthReport.diagnostics.spellingTypos.flaggedWords.length > 0 ? (
                    <div className="space-y-2">
                      {healthReport.diagnostics.spellingTypos.flaggedWords.map((f, fi) => (
                        <div key={fi} className="p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-xl text-xs flex justify-between items-center">
                          <span className="line-through text-red-600">{f.word}</span>
                          <span className="text-teal-600 font-semibold">→ {f.suggestion}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 text-xs font-medium rounded-xl">
                      ✓ All technical terms spelled according to industry canonical standards.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: GROUNDED EXTRAS */}
      {activeTab === 'grounded' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400">
                Candidate Profile Grounding Only
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-base mt-2">
                Grounded Professional Summary & Cover Letter
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Generated strictly from verified facts already present in your resume. Every claim is cross-checked against the NoFabricationValidator.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleGenerateGroundedSummary}
                disabled={isLoading}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4" /> Generate 3-Sentence Summary
              </button>
              <button
                onClick={handleGenerateGroundedCoverLetter}
                disabled={isLoading}
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 text-xs font-semibold rounded-xl flex items-center gap-2 transition"
              >
                <Send className="w-4 h-4" /> Generate Grounded Cover Letter
              </button>
            </div>
          </div>

          {/* Results Display */}
          {(groundedSummary || groundedCoverLetter) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Output Document */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    {groundedCoverLetter ? 'Tailored Cover Letter Draft' : 'Professional Summary'}
                  </h4>
                  <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded">
                    ✓ Grounded
                  </span>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {groundedCoverLetter?.text || groundedSummary?.text}
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(groundedCoverLetter?.text || groundedSummary?.text);
                    setCopiedText(true);
                    setTimeout(() => setCopiedText(false), 3000);
                  }}
                  className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition text-slate-800 dark:text-white"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-teal-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedText ? 'Copied to Clipboard' : 'Copy Generated Text'}
                </button>
              </div>

              {/* Review Before Use & Verified Facts */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-500" />
                  Review Before Use: Verified Evidence Facts
                </h4>
                <p className="text-xs text-slate-500">
                  Every phrase is tied directly to the verified resume facts listed below:
                </p>

                <div className="space-y-2">
                  {(groundedCoverLetter?.groundedFacts || groundedSummary?.groundedFacts || []).map((fact: string, fi: number) => (
                    <div key={fi} className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                      <span>{fact}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-xl text-xs text-blue-800 dark:text-blue-300">
                  <div className="font-semibold mb-1">Human Verification Step:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    <li>Ensure target company name aligns with your prospective application.</li>
                    <li>Verify personal tone matches your communication preference.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
