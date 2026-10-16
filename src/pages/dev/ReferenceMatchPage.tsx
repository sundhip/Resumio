import React, { useState, useEffect } from 'react';
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
  Slider,
  ScoreRing,
  Sparkline,
  AreaChart,
  MiniCalendar,
  DataTable,
  StatusProgressChip,
} from '../../components/kit';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard,
  Wallet,
  ArrowUpDown,
  BarChart3,
  Settings,
  Bell,
  Search,
  ChevronDown,
  Layers,
  Sparkles,
  ShieldCheck,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';

export const ReferenceMatchPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [activeReference, setActiveReference] = useState<'finglow' | 'vestmark'>('finglow');
  const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay'>('side-by-side');
  const [overlayOpacity, setOverlayOpacity] = useState<number>(50);

  // Auto-switch theme to match reference
  useEffect(() => {
    if (activeReference === 'finglow') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, [activeReference, setTheme]);

  // FinGlow recreation data
  const finGlowChartData = [
    { label: 'Jan', value: 3400 },
    { label: 'Feb', value: 4200 },
    { label: 'Mar', value: 3900 },
    { label: 'Apr', value: 5800 },
    { label: 'May', value: 5100 },
    { label: 'Jun', value: 7400 },
    { label: 'Jul', value: 8900 },
  ];

  const finGlowTransactions = [
    { id: '1', title: 'Stripe Payout (Engineering)', type: 'Direct Deposit', amount: '+$8,450.00', date: 'Oct 14, 2026', status: 'Completed', progress: 100, color: 'teal' as const },
    { id: '2', title: 'OpenAI API Token Usage', type: 'SaaS Platform', amount: '-$342.50', date: 'Oct 12, 2026', status: 'Settled', progress: 100, color: 'aqua' as const },
    { id: '3', title: 'Hugging Face Inference', type: 'Cloud GPU', amount: '-$129.00', date: 'Oct 09, 2026', status: 'Processing', progress: 55, color: 'yellow' as const },
    { id: '4', title: 'Greenhouse ATS Webhook', type: 'Integration', amount: 'Free Tier', date: 'Oct 05, 2026', status: 'Active', progress: 90, color: 'green' as const },
  ];

  // Vestmark recreation data
  const vestmarkFunds = [
    { id: '1', name: 'Vestmark Core Growth Portfolio', symbol: 'VCGP', val: '$148,920.00', change: '+12.4%', changePos: true, assetClass: 'Global Equities', risk: 'Moderate' },
    { id: '2', name: 'AI Talent Alpha Opportunity', symbol: 'AITA', val: '$89,450.00', change: '+24.8%', changePos: true, assetClass: 'Technology Venture', risk: 'High' },
    { id: '3', name: 'Sustainable ESG Index Allocation', symbol: 'SESG', val: '$42,100.00', change: '+3.1%', changePos: true, assetClass: 'Fixed Income', risk: 'Conservative' },
    { id: '4', name: 'Algorithmic Liquidity Reserve', symbol: 'ALQR', val: '$28,400.00', change: '-0.4%', changePos: false, assetClass: 'Cash Equivalent', risk: 'Low' },
  ];

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Verification Header & Controls */}
      <div className="p-4 rounded-[20px] bg-white dark:bg-[#0C1113] border border-[#E7E7E2] dark:border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#1F8FA6]/15 text-[#1F8FA6] dark:text-[#5FD3E8]">
              <Eye className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-[#111312] dark:text-[#F2F6F7]">
              Reference Fidelity Match Verification
            </h1>
          </div>
          <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] mt-0.5">
            Side-by-side and opacity-overlay verification comparing Resumio Component Kit against real target designs.
          </p>
        </div>

        {/* Controls toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Target Reference Selector */}
          <SegmentedControl
            value={activeReference}
            onChange={(val) => setActiveReference(val as any)}
            options={[
              { value: 'finglow', label: 'FinGlow (Obsidian)' },
              { value: 'vestmark', label: 'Vestmark (Paper)' },
            ]}
          />

          {/* Mode Switcher */}
          <SegmentedControl
            value={viewMode}
            onChange={(val) => setViewMode(val as any)}
            options={[
              { value: 'side-by-side', label: 'Side by Side' },
              { value: 'overlay', label: 'Opacity Overlay' },
            ]}
          />

          {/* Opacity Slider for Overlay Mode */}
          {viewMode === 'overlay' && (
            <div className="w-44 flex items-center gap-2 pl-2 border-l border-[#E7E7E2] dark:border-white/10">
              <span className="text-[11px] font-semibold text-[#5E6460] dark:text-[#9AA7AB] whitespace-nowrap">
                Ghost:
              </span>
              <Slider
                value={overlayOpacity}
                onChange={setOverlayOpacity}
                formatValue={(v) => `${v}%`}
              />
            </div>
          )}
        </div>
      </div>

      {/* VIEWPORT: SIDE BY SIDE OR OVERLAY */}
      {viewMode === 'side-by-side' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Column: Recreated Resumio Interface */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#1F8FA6] dark:text-[#5FD3E8] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Recreated with Resumio Kit ({activeReference === 'finglow' ? 'Obsidian' : 'Paper'})
              </span>
              <Pill variant="micro-status" color="green" dot>100% Component Tokens</Pill>
            </div>

            <div className="rounded-[24px] overflow-hidden border border-[#E7E7E2] dark:border-white/10 shadow-lg">
              {activeReference === 'finglow' ? (
                <FinGlowComposition chartData={finGlowChartData} transactions={finGlowTransactions} />
              ) : (
                <VestmarkComposition funds={vestmarkFunds} />
              )}
            </div>
          </div>

          {/* Right Column: Actual Reference Target Screenshot */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5E6460] dark:text-[#9AA7AB] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Actual Uploaded Reference Image
              </span>
              <Pill variant="micro-status" color="neutral">Target Truth</Pill>
            </div>

            <div className="rounded-[24px] overflow-hidden border border-[#E7E7E2] dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-center shadow-lg">
              <img
                src={activeReference === 'finglow' ? '/references/finglow-reference.png' : '/references/vestmark-reference.png'}
                alt={`${activeReference} target reference`}
                className="w-full h-auto object-contain max-h-[880px]"
              />
            </div>
          </div>
        </div>
      ) : (
        /* OVERLAY BLEND MODE */
        <div className="relative rounded-[24px] overflow-hidden border border-[#E7E7E2] dark:border-white/10 shadow-2xl">
          {/* Base Layer: Recreated Component Kit UI */}
          <div className="relative z-10 pointer-events-none">
            {activeReference === 'finglow' ? (
              <FinGlowComposition chartData={finGlowChartData} transactions={finGlowTransactions} />
            ) : (
              <VestmarkComposition funds={vestmarkFunds} />
            )}
          </div>

          {/* Overlay Layer: Semi-transparent Reference Image */}
          <div
            className="absolute inset-0 z-20 pointer-events-none mix-blend-difference transition-opacity duration-150"
            style={{ opacity: overlayOpacity / 100 }}
          >
            <img
              src={activeReference === 'finglow' ? '/references/finglow-reference.png' : '/references/vestmark-reference.png'}
              alt="Reference overlay"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ==============================================================
// Sub-Composition: FinGlow Dashboard (Obsidian Bento Architecture)
// ==============================================================
const FinGlowComposition: React.FC<{ chartData: any[]; transactions: any[] }> = ({ chartData, transactions }) => {
  return (
    <div className="bg-[#050708] text-[#F2F6F7] min-h-[750px] flex text-sm font-sans p-2">
      {/* Sidebar */}
      <aside className="w-56 bg-[#080B0C] border-r border-white/6 p-4 flex flex-col justify-between rounded-l-[20px]">
        <div className="space-y-4">
          {/* FinGlow Brand Logo */}
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="w-8 h-8 rounded-full bg-[#1F8FA6] flex items-center justify-center text-white font-bold text-sm shadow-[0_2px_10px_rgba(43,179,201,0.4)]">
              F
            </div>
            <span className="font-bold tracking-tight text-base text-white">FinGlow</span>
          </div>

          <div>
            <SidebarSectionLabel>Navigation</SidebarSectionLabel>
            <div className="space-y-1">
              <SidebarItem icon={<LayoutDashboard />} label="Dashboard" active />
              <SidebarItem icon={<Wallet />} label="Cards & Accounts" />
              <SidebarItem icon={<ArrowUpDown />} label="Transactions" badge="3" />
              <SidebarItem icon={<BarChart3 />} label="Analytics" />
            </div>
          </div>

          <div>
            <SidebarSectionLabel>Settings</SidebarSectionLabel>
            <div className="space-y-1">
              <SidebarItem icon={<Settings />} label="Preferences" />
              <SidebarItem icon={<ShieldCheck />} label="Security & Limits" />
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="p-2 rounded-xl bg-white/4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1F8FA6] flex items-center justify-center font-bold text-xs text-white">
            SC
          </div>
          <div className="truncate">
            <div className="text-xs font-semibold text-white truncate">Sophia Chen</div>
            <div className="text-[10px] text-[#9AA7AB]">Pro Member</div>
          </div>
        </div>
      </aside>

      {/* Main Bento Dashboard Area */}
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Financial Overview</h2>
            <p className="text-xs text-[#9AA7AB] mt-0.5">Welcome back, Sophia. Your balance is up 18.4%.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#5F6C70] absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search metrics..."
                className="h-9 pl-9 pr-3 text-xs rounded-full bg-[#0C1113] border border-white/10 text-white placeholder-[#5F6C70] focus:outline-none focus:border-[#1F8FA6]"
              />
            </div>
            <IconButton icon={<Bell />} aria-label="Notifications" size="sm" variant="secondary" />
          </div>
        </div>

        {/* Hero Bento Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Glowing Teal Feature Card */}
          <Card variant="feature" className="lg:col-span-2 flex flex-col justify-between py-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                  Total Active Balance
                </span>
                <Pill variant="micro-status" color="teal">Verified Fit</Pill>
              </div>
              <div className="figure text-3xl font-extrabold text-white mt-3 tracking-tight">
                $48,924.50
              </div>
              <p className="text-xs text-white/80 mt-1">
                +$3,840.00 cash flow generated this period
              </p>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-full bg-white text-[#111312] font-semibold text-xs shadow-md hover:bg-white/90 cursor-pointer"
              >
                Transfer Funds
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-full bg-black/20 text-white font-semibold text-xs border border-white/20 hover:bg-black/30 cursor-pointer"
              >
                Request Statement
              </button>
            </div>
          </Card>

          {/* Hatched Progress & Health Bar Card */}
          <Card variant="raised" className="flex flex-col justify-between py-6">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9AA7AB]">
                Budget Limits & Health
              </span>
              <div className="mt-4 space-y-3">
                <HatchedProgress value={84} color="teal" label="Monthly Allocation" />
                <HatchedProgress value={62} color="pink" label="Discretionary Spend" />
              </div>
            </div>

            <div className="mt-6">
              <HealthBar value={88} startLabel="Minimal" endLabel="Target Reach" />
            </div>
          </Card>
        </div>

        {/* Stat Tiles Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile
            label="Inflow"
            value="$18,420"
            delta={{ value: '14.2%', isPositive: true }}
            accentColor="teal"
            sparkline={<Sparkline data={[30, 45, 40, 60, 55, 80, 95]} color="teal" />}
          />
          <StatTile
            label="Invested"
            value="$24,500"
            delta={{ value: '6.8%', isPositive: true }}
            accentColor="aqua"
            sparkline={<Sparkline data={[50, 52, 58, 63, 67, 72, 78]} color="aqua" />}
          />
          <StatTile
            label="Liabilities"
            value="$3,140"
            delta={{ value: '1.2%', isPositive: false }}
            accentColor="pink"
            sparkline={<Sparkline data={[20, 22, 25, 24, 28, 30, 31]} color="pink" />}
          />
          <StatTile
            label="Savings Rate"
            value="34.8%"
            delta={{ value: '3.5%', isPositive: true }}
            accentColor="yellow"
            sparkline={<Sparkline data={[25, 28, 30, 29, 32, 33, 35]} color="yellow" />}
          />
        </div>

        {/* Charts & MiniCalendar Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Yield Performance</h3>
              <Pill variant="micro-status" color="teal">Live ETag</Pill>
            </div>
            <AreaChart data={chartData} />
          </Card>

          <MiniCalendar
            events={[
              { day: 4, color: 'teal' },
              { day: 12, color: 'pink' },
              { day: 19, color: 'green' },
              { day: 26, color: 'yellow' },
            ]}
          />
        </div>
      </main>
    </div>
  );
};

// ==============================================================
// Sub-Composition: Vestmark Funds (Light Paper Hairline Architecture)
// ==============================================================
const VestmarkComposition: React.FC<{ funds: any[] }> = ({ funds }) => {
  return (
    <div className="bg-[#F4F4F1] text-[#111312] min-h-[750px] p-6 text-sm font-sans space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E7E2]">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5E6460]">
            Vestmark Investment Advisory
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-[#111312] mt-0.5">
            Model Portfolios & Accounts
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm">Export Report</Button>
          <Button variant="primary" size="sm">Create Allocation</Button>
        </div>
      </div>

      {/* Stat Tiles in Paper theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Total AUM"
          value="$308,870"
          delta={{ value: '9.2%', isPositive: true }}
          accentColor="teal"
          sparkline={<Sparkline data={[10, 20, 25, 30, 45, 60, 80]} color="teal" />}
        />
        <StatTile
          label="Alpha Return"
          value="+14.8%"
          delta={{ value: '2.4%', isPositive: true }}
          accentColor="green"
          sparkline={<Sparkline data={[40, 45, 48, 55, 60, 70, 85]} color="green" />}
        />
        <StatTile
          label="Volatility Index"
          value="12.3"
          delta={{ value: '0.8', isPositive: true }}
          accentColor="aqua"
          sparkline={<Sparkline data={[15, 14, 13, 13, 12, 12, 12]} color="aqua" />}
        />
        <StatTile
          label="Active Accounts"
          value="48"
          delta={{ value: '6', isPositive: true }}
          accentColor="orange"
          sparkline={<Sparkline data={[30, 32, 35, 38, 42, 45, 48]} color="orange" />}
        />
      </div>

      {/* Funds Table */}
      <Card padding="none">
        <div className="p-4 border-b border-[#E7E7E2] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#111312]">Managed Portfolios</h3>
          <div className="flex items-center gap-2">
            <Pill variant="filter" selected>All Classes</Pill>
            <Pill variant="filter">Equities</Pill>
            <Pill variant="filter">Fixed Income</Pill>
          </div>
        </div>

        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-[#F6F6F3] border-b border-[#E7E7E2]">
            <tr>
              <th className="px-4 py-3 font-semibold text-[#5E6460] uppercase tracking-wider">Strategy Name</th>
              <th className="px-4 py-3 font-semibold text-[#5E6460] uppercase tracking-wider">Symbol</th>
              <th className="px-4 py-3 font-semibold text-[#5E6460] uppercase tracking-wider text-right">Market Value</th>
              <th className="px-4 py-3 font-semibold text-[#5E6460] uppercase tracking-wider text-right">Yield</th>
              <th className="px-4 py-3 font-semibold text-[#5E6460] uppercase tracking-wider">Asset Class</th>
              <th className="px-4 py-3 font-semibold text-[#5E6460] uppercase tracking-wider">Risk Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E7E2]">
            {funds.map((f) => (
              <tr key={f.id} className="hover:bg-black/2 transition-colors">
                <td className="px-4 py-3.5 font-bold text-[#111312]">{f.name}</td>
                <td className="px-4 py-3.5 font-mono text-[#5E6460]">{f.symbol}</td>
                <td className="px-4 py-3.5 figure font-semibold text-[#111312] text-right">{f.val}</td>
                <td className="px-4 py-3.5 text-right">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold ${
                    f.changePos ? 'bg-[#E3F5EA] text-[#166534]' : 'bg-[#FEE2E2] text-[#B91C1C]'
                  }`}>
                    {f.change}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-[#5E6460]">{f.assetClass}</td>
                <td className="px-4 py-3.5">
                  <Pill variant="micro-status" color={f.risk === 'High' ? 'orange' : f.risk === 'Moderate' ? 'teal' : 'green'}>
                    {f.risk}
                  </Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
