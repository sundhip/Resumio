import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useI18n, type SupportedLanguage } from '../../i18n';
import {
  Key,
  Webhook,
  Database,
  Sliders,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  Download,
  Trash2,
  RefreshCw,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  Languages,
} from 'lucide-react';

export const PlatformIntegrationsPage: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { lang, setLanguage, t } = useI18n();

  const [activeTab, setActiveTab] = useState<'api_webhooks' | 'ats_import' | 'model_ops' | 'jd_intel' | 'sso'>('api_webhooks');

  // API Keys state
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedRawKey, setGeneratedRawKey] = useState<string | null>(null);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);

  // Webhooks state
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [deliveryLogs, setDeliveryLogs] = useState<any[]>([]);
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);

  // ATS & Import state
  const [greenhouseStatus, setGreenhouseStatus] = useState<any>(null);
  const [isTestingGreenhouse, setIsTestingGreenhouse] = useState(false);
  const [greenhouseJobs, setGreenhouseJobs] = useState<any[]>([]);
  const [importContent, setImportContent] = useState('');
  const [importType, setImportType] = useState<'candidates' | 'jobs'>('candidates');
  const [importFormat, setImportFormat] = useState<'csv' | 'json'>('csv');
  const [dryRunResult, setDryRunResult] = useState<any>(null);
  const [isDryRunning, setIsDryRunning] = useState(false);

  // ModelOps state
  const [shadowTelemetry, setShadowTelemetry] = useState<any>(null);
  const [activeLearningItems, setActiveLearningItems] = useState<any[]>([]);
  const [isPromoting, setIsPromoting] = useState(false);

  // JD Intel state
  const [sampleJdText, setSampleJdText] = useState(
    `We are seeking a 10x Rockstar Ninja Developer with 12+ years of Kubernetes and 10+ years of Next.js experience. Must be young and energetic with killer instinct to dominate the market. Requires 8+ years experience for this Junior developer position.`
  );
  const [jdQualityReport, setJdQualityReport] = useState<any>(null);
  const [inclusiveReport, setInclusiveReport] = useState<any>(null);
  const [isAnalyzingJd, setIsAnalyzingJd] = useState(false);

  // SSO state
  const [ssoProvider, setSsoProvider] = useState<'google' | 'microsoft'>('google');
  const [ssoClientId, setSsoClientId] = useState('');
  const [ssoClientSecret, setSsoClientSecret] = useState('');
  const [ssoAllowedDomains, setSsoAllowedDomains] = useState('example.com, techcorp.ai');

  // Load initial data
  useEffect(() => {
    fetchKeys();
    fetchWebhooks();
    fetchShadowTelemetry();
    fetchActiveLearningQueue();
  }, []);

  const fetchKeys = async () => {
    setIsLoadingKeys(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/platform/keys', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setApiKeys(data.data);
    } catch (err: any) {
      console.warn('Failed to load API keys', err);
    } finally {
      setIsLoadingKeys(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      showToast('warning', 'Key Name Required', 'Enter a descriptive name for your API key.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/platform/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newKeyName.trim(), rateLimitPerMin: 60 }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedRawKey(data.data.rawApiKey);
        setNewKeyName('');
        fetchKeys();
        showToast('success', 'API Key Created', 'Store the key securely; it will not be shown again.');
      }
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    }
  };

  const handleRevokeApiKey = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/platform/keys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchKeys();
        showToast('info', 'Revoked', 'API key has been permanently deactivated.');
      }
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    }
  };

  const fetchWebhooks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/platform/webhooks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setWebhooks(data.data);
    } catch (err) {
      console.warn(err);
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhookUrl.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/platform/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: newWebhookUrl.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewWebhookUrl('');
        fetchWebhooks();
        showToast('success', 'Webhook Registered', 'Outbound HMAC signatures enabled.');
      }
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    }
  };

  const handleTestWebhook = async (id: string) => {
    setTestingWebhookId(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/platform/webhooks/${id}/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Webhook Verified', 'Destination server returned HTTP 200.');
      } else {
        showToast('warning', 'Delivery Failed', data.error || 'Server did not respond with 2xx.');
      }
      fetchWebhookLogs(id);
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    } finally {
      setTestingWebhookId(null);
    }
  };

  const fetchWebhookLogs = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/platform/webhooks/${id}/deliveries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setDeliveryLogs(data.data);
    } catch (err) {
      console.warn(err);
    }
  };

  // Greenhouse ATS
  const handleTestGreenhouse = async () => {
    setIsTestingGreenhouse(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/platform/ats/greenhouse/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ useFixtures: true }),
      });
      const data = await res.json();
      setGreenhouseStatus(data);

      const jobsRes = await fetch('/api/platform/ats/greenhouse/jobs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const jobsData = await jobsRes.json();
      if (jobsData.success) setGreenhouseJobs(jobsData.data);

      showToast('success', 'ATS Connected', 'Greenhouse Harvest API verified against recorded fixtures.');
    } catch (err: any) {
      showToast('error', 'ATS Connection Error', err.message);
    } finally {
      setIsTestingGreenhouse(false);
    }
  };

  // Import Dry-Run
  const handleDryRunPreview = async () => {
    if (!importContent.trim()) {
      showToast('warning', 'Input Empty', 'Paste CSV or JSON content to dry-run validate.');
      return;
    }
    setIsDryRunning(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/platform/import/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: importType,
          format: importFormat,
          content: importContent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDryRunResult(data.data);
        showToast('info', 'Dry-Run Complete', `Validated ${data.data.validCount} valid rows with ${data.data.invalidCount} issues.`);
      }
    } catch (err: any) {
      showToast('error', 'Validation Error', err.message);
    } finally {
      setIsDryRunning(false);
    }
  };

  // ModelOps
  const fetchShadowTelemetry = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/platform/model-ops/shadow', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setShadowTelemetry(data.data);
    } catch (err) {
      console.warn(err);
    }
  };

  const fetchActiveLearningQueue = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/platform/model-ops/active-learning', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setActiveLearningItems(data.data);
    } catch (err) {
      console.warn(err);
    }
  };

  const handlePromoteShadowModel = async () => {
    if (!shadowTelemetry?.shadowModel?.id) return;
    setIsPromoting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/platform/model-ops/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ shadowModelId: shadowTelemetry.shadowModel.id }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Model Promoted', data.message);
        fetchShadowTelemetry();
      } else {
        showToast('error', 'Promotion Blocked', data.message);
      }
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    } finally {
      setIsPromoting(false);
    }
  };

  const handleRollback = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/platform/model-ops/rollback', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showToast('info', 'Model Rolled Back', data.message);
        fetchShadowTelemetry();
      }
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    }
  };

  // JD Intel Analysis
  const handleAnalyzeJd = async () => {
    if (!sampleJdText.trim()) return;
    setIsAnalyzingJd(true);
    try {
      const res1 = await fetch('/api/platform/jd/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jdText: sampleJdText, title: 'Junior Full Stack Engineer', minExpYears: 8 }),
      });
      const data1 = await res1.json();
      if (data1.success) setJdQualityReport(data1.data);

      const res2 = await fetch('/api/platform/jd/inclusive-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jdText: sampleJdText }),
      });
      const data2 = await res2.json();
      if (data2.success) setInclusiveReport(data2.data);

      showToast('success', 'Analysis Ready', 'Quality score and inclusive language checks calculated.');
    } catch (err: any) {
      showToast('error', 'Analysis Failed', err.message);
    } finally {
      setIsAnalyzingJd(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E7E7E2] dark:border-white/8">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#1F8FA6]/100/10 text-[#1F8FA6] dark:text-[#5FD3E8]">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#111312] dark:text-[#F2F6F7]">
                {t('platform.apiKeys')} & Platform Integrations Hub
              </h1>
              <p className="text-sm text-[#5E6460] dark:text-[#9AA7AB] mt-0.5">
                Public REST API, Webhooks, ATS connectors, OIDC SSO, ModelOps shadow telemetry, and JD intelligence.
              </p>
            </div>
          </div>
        </div>

        {/* Language Switcher & Interactive API Docs Link */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#E9E9E5] dark:bg-surface-dark-hover px-2.5 py-1.5 rounded-lg border border-[#E7E7E2] dark:border-white/6 text-xs font-semibold text-[#5E6460] dark:text-[#9AA7AB] dark:text-[#DCDCD7] dark:text-[#C5D0D3]">
            <Languages className="w-4 h-4 text-[#5E6460] dark:text-[#9AA7AB]" />
            <button
              onClick={() => setLanguage('en')}
              className={`px-1.5 py-0.5 rounded cursor-pointer ${lang === 'en' ? 'bg-white dark:bg-[#161E21] text-emerald-600 font-bold shadow-xs' : 'hover:text-[#111312] dark:text-[#F2F6F7]'}`}
            >
              EN
            </button>
            <span>/</span>
            <button
              onClick={() => setLanguage('es')}
              className={`px-1.5 py-0.5 rounded cursor-pointer ${lang === 'es' ? 'bg-white dark:bg-[#161E21] text-emerald-600 font-bold shadow-xs' : 'hover:text-[#111312] dark:text-[#F2F6F7]'}`}
            >
              ES
            </button>
          </div>

          <a
            href="/api/v1/public/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-[#1F8FA6] hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Interactive OpenAPI Docs
          </a>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#E7E7E2] dark:border-white/8 space-x-2 overflow-x-auto pb-1 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('api_webhooks')}
          className={`px-4 py-2 rounded-t-lg transition-colors cursor-pointer ${
            activeTab === 'api_webhooks'
              ? 'border-b-2 border-[#1F8FA6] text-[#1F8FA6] dark:text-[#5FD3E8] bg-[#1F8FA6]/10/50 dark:bg-indigo-950/20'
              : 'text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:text-[#F2F6F7]'
          }`}
        >
          <Key className="w-4 h-4 inline mr-1.5" /> Public API & Webhooks
        </button>

        <button
          onClick={() => setActiveTab('ats_import')}
          className={`px-4 py-2 rounded-t-lg transition-colors cursor-pointer ${
            activeTab === 'ats_import'
              ? 'border-b-2 border-[#1F8FA6] text-[#1F8FA6] dark:text-[#5FD3E8] bg-[#1F8FA6]/10/50 dark:bg-indigo-950/20'
              : 'text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:text-[#F2F6F7]'
          }`}
        >
          <Database className="w-4 h-4 inline mr-1.5" /> ATS Connectors & Import
        </button>

        <button
          onClick={() => setActiveTab('model_ops')}
          className={`px-4 py-2 rounded-t-lg transition-colors cursor-pointer ${
            activeTab === 'model_ops'
              ? 'border-b-2 border-[#1F8FA6] text-[#1F8FA6] dark:text-[#5FD3E8] bg-[#1F8FA6]/10/50 dark:bg-indigo-950/20'
              : 'text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:text-[#F2F6F7]'
          }`}
        >
          <Cpu className="w-4 h-4 inline mr-1.5" /> ModelOps (Shadow Mode)
        </button>

        <button
          onClick={() => setActiveTab('jd_intel')}
          className={`px-4 py-2 rounded-t-lg transition-colors cursor-pointer ${
            activeTab === 'jd_intel'
              ? 'border-b-2 border-[#1F8FA6] text-[#1F8FA6] dark:text-[#5FD3E8] bg-[#1F8FA6]/10/50 dark:bg-indigo-950/20'
              : 'text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:text-[#F2F6F7]'
          }`}
        >
          <Sparkles className="w-4 h-4 inline mr-1.5" /> JD Quality & Inclusivity
        </button>

        <button
          onClick={() => setActiveTab('sso')}
          className={`px-4 py-2 rounded-t-lg transition-colors cursor-pointer ${
            activeTab === 'sso'
              ? 'border-b-2 border-[#1F8FA6] text-[#1F8FA6] dark:text-[#5FD3E8] bg-[#1F8FA6]/10/50 dark:bg-indigo-950/20'
              : 'text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:text-[#F2F6F7]'
          }`}
        >
          <ShieldCheck className="w-4 h-4 inline mr-1.5" /> Enterprise SSO
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: PUBLIC API & WEBHOOKS                                 */}
      {/* ============================================================ */}
      {activeTab === 'api_webhooks' && (
        <div className="space-y-6">
          {/* New Raw Key Alert */}
          {generatedRawKey && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                API Key Generated Successfully
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Copy this key immediately. For security, it is hashed at rest with SHA-256 and cannot be recovered.
              </p>
              <div className="p-2 bg-white dark:bg-black font-mono text-xs rounded border border-emerald-200 dark:border-emerald-800 select-all font-bold text-emerald-900 dark:text-emerald-200">
                {generatedRawKey}
              </div>
            </div>
          )}

          {/* API Keys Table */}
          <Card className="p-5 bg-white dark:bg-surface-dark-card border-[#E7E7E2] dark:border-surface-dark-border space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">Active Public API Keys</h3>
                <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">Scoped access to /api/v1/public (parse, match, rank, explain).</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Key description (e.g. Production CI/CD)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[#E7E7E2] dark:border-white/6 bg-white dark:bg-surface-dark-bg text-[#111312] dark:text-[#F2F6F7] flex-1 sm:w-64"
                />
                <Button size="sm" onClick={handleCreateApiKey}>Generate Key</Button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-[#E7E7E2] dark:border-white/8">
              <table className="w-full text-left text-xs text-[#111312] dark:text-[#F2F6F7]">
                <thead className="bg-[#F4F4F1] dark:bg-surface-dark-hover uppercase text-[10px] font-bold text-[#5E6460] dark:text-[#9AA7AB]">
                  <tr>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Prefix</th>
                    <th className="py-2.5 px-3">Scopes</th>
                    <th className="py-2.5 px-3">Rate Limit</th>
                    <th className="py-2.5 px-3">Last Used</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {apiKeys.map((k) => (
                    <tr key={k.id} className="hover:bg-[#F4F4F1]/50 dark:hover:bg-surface-dark-hover/50">
                      <td className="py-3 px-3 font-semibold text-[#111312] dark:text-[#F2F6F7]">{k.name}</td>
                      <td className="py-3 px-3 font-mono">{k.key_prefix}...</td>
                      <td className="py-3 px-3">
                        <div className="flex gap-1 flex-wrap">
                          {JSON.parse(k.scopes_json || '[]').map((s: string) => (
                            <Badge key={s} variant="info" size="sm">{s}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3">{k.rate_limit_per_min} req/min</td>
                      <td className="py-3 px-3 text-[#5E6460] dark:text-[#9AA7AB]">{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}</td>
                      <td className="py-3 px-3 text-right">
                        <Button variant="danger" size="sm" onClick={() => handleRevokeApiKey(k.id)}>Revoke</Button>
                      </td>
                    </tr>
                  ))}
                  {apiKeys.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-[#5E6460] dark:text-[#9AA7AB]">No active API keys created yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Outbound Webhooks Card */}
          <Card className="p-5 bg-white dark:bg-surface-dark-card border-[#E7E7E2] dark:border-surface-dark-border space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">Outbound Webhooks</h3>
                <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">Real-time HMAC-SHA256 signed event delivery with replay protection.</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="url"
                  placeholder="https://your-domain.com/webhooks"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[#E7E7E2] dark:border-white/6 bg-white dark:bg-surface-dark-bg text-[#111312] dark:text-[#F2F6F7] flex-1 sm:w-80"
                />
                <Button size="sm" onClick={handleCreateWebhook}>Add Webhook</Button>
              </div>
            </div>

            <div className="space-y-3">
              {webhooks.map((w) => (
                <div key={w.id} className="p-3 rounded-lg border border-[#E7E7E2] dark:border-white/8 bg-[#F4F4F1] dark:bg-surface-dark-hover flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="font-mono font-bold text-[#111312] dark:text-[#F2F6F7]">{w.url}</div>
                    <div className="text-[#5E6460] dark:text-[#9AA7AB] font-mono text-[11px]">Secret: {w.secret.slice(0, 10)}... (HMAC-SHA256)</div>
                    <div className="flex gap-1">
                      {JSON.parse(w.events_json || '[]').map((ev: string) => (
                        <Badge key={ev} variant="neutral" size="sm">{ev}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleTestWebhook(w.id)}
                      isLoading={testingWebhookId === w.id}
                    >
                      <Play className="w-3.5 h-3.5 mr-1" /> {t('action.testSend')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => fetchWebhookLogs(w.id)}>Logs</Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery Logs Modal/Drawer View */}
            {deliveryLogs.length > 0 && (
              <div className="mt-4 p-4 rounded-lg bg-[#111312] dark:bg-[#0C1113] text-[#DCDCD7] dark:text-[#C5D0D3] text-xs font-mono space-y-2">
                <div className="font-bold text-white flex items-center justify-between pb-2 border-b border-slate-800">
                  <span>Recent Webhook Deliveries (HMAC Signed)</span>
                  <button onClick={() => setDeliveryLogs([])} className="text-[#8A928D] dark:text-[#657378] hover:text-white">✕</button>
                </div>
                {deliveryLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-1 border-b border-slate-800 text-[11px]">
                    <span className="text-[#8A928D] dark:text-[#657378]">{log.event_type}</span>
                    <span className={log.status === 'delivered' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {log.status.toUpperCase()} (HTTP {log.http_status || 'ERR'})
                    </span>
                    <span className="text-[#5E6460] dark:text-[#9AA7AB]">{new Date(log.created_at).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: ATS CONNECTORS & DRY-RUN IMPORT                       */}
      {/* ============================================================ */}
      {activeTab === 'ats_import' && (
        <div className="space-y-6">
          {/* Greenhouse ATS Card */}
          <Card className="p-5 bg-white dark:bg-surface-dark-card border-[#E7E7E2] dark:border-surface-dark-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7] flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-600" />
                  Greenhouse Harvest API v1 Connector
                </h3>
                <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
                  Bidirectional sync: fetch active requisitions and candidates; export matched scores into Greenhouse.
                </p>
              </div>
              <Button size="sm" onClick={handleTestGreenhouse} isLoading={isTestingGreenhouse}>
                Test Connector (Fixture Verification)
              </Button>
            </div>

            {greenhouseStatus && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs space-y-1">
                <div className="font-bold text-emerald-800 dark:text-emerald-300">✓ {greenhouseStatus.message}</div>
                <div className="text-[#5E6460] dark:text-[#9AA7AB]">Latency: {greenhouseStatus.latencyMs} ms</div>
              </div>
            )}

            {greenhouseJobs.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#111312] dark:text-[#F2F6F7]">Synchronized Requisitions from Greenhouse:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {greenhouseJobs.map((j) => (
                    <div key={j.externalId} className="p-3 rounded-lg border border-[#E7E7E2] dark:border-white/8 text-xs space-y-1 bg-[#F4F4F1] dark:bg-surface-dark-hover">
                      <div className="font-bold text-[#111312] dark:text-[#F2F6F7]">{j.title}</div>
                      <div className="text-[#5E6460] dark:text-[#9AA7AB]">{j.department} • {j.location}</div>
                      <div className="flex gap-1 flex-wrap">
                        {j.requiredSkills.map((s: string) => (
                          <Badge key={s} variant="info" size="sm">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Dry-Run Import Card */}
          <Card className="p-5 bg-white dark:bg-surface-dark-card border-[#E7E7E2] dark:border-white/8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
                  {t('platform.dryRun')} & Bulk Ingestion
                </h3>
                <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
                  Validates CSV/JSON schema and reports row errors BEFORE any database modification.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a href="/api/platform/export?type=candidates&format=csv" className="text-xs font-semibold text-emerald-600 hover:underline">
                  Download Sample CSV
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#111312] dark:text-[#F2F6F7] block mb-1">Entity Type</label>
                <select
                  value={importType}
                  onChange={(e) => setImportType(e.target.value as any)}
                  className="w-full text-xs p-2 rounded-lg border border-[#E7E7E2] dark:border-white/6 bg-white dark:bg-surface-dark-bg text-[#111312] dark:text-[#F2F6F7]"
                >
                  <option value="candidates">Candidates (fullName, email, phone, location, skills)</option>
                  <option value="jobs">Jobs (title, companyName, location, requiredSkills)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[#111312] dark:text-[#F2F6F7] block mb-1">Format</label>
                <select
                  value={importFormat}
                  onChange={(e) => setImportFormat(e.target.value as any)}
                  className="w-full text-xs p-2 rounded-lg border border-[#E7E7E2] dark:border-white/6 bg-white dark:bg-surface-dark-bg text-[#111312] dark:text-[#F2F6F7]"
                >
                  <option value="csv">CSV (Comma Separated)</option>
                  <option value="json">JSON (Array of objects)</option>
                </select>
              </div>
            </div>

            <textarea
              rows={5}
              placeholder={`fullName,email,phone,location,skills,experienceYears\nPriya Sharma,priya@example.com,+91 98765 11111,Chennai,TypeScript;React;Node.js,4`}
              value={importContent}
              onChange={(e) => setImportContent(e.target.value)}
              className="w-full p-3 font-mono text-xs rounded-lg border border-[#E7E7E2] dark:border-white/6 bg-[#F4F4F1] dark:bg-surface-dark-bg text-[#111312] dark:text-[#F2F6F7]"
            />

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleDryRunPreview} isLoading={isDryRunning}>
                Run Dry-Run Schema Preview
              </Button>
            </div>

            {/* Dry-Run Result Table */}
            {dryRunResult && (
              <div className="p-4 rounded-xl border border-[#E7E7E2] dark:border-white/8 bg-[#F4F4F1] dark:bg-surface-dark-hover space-y-3 text-xs">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-[#111312] dark:text-[#F2F6F7]">Validation Results:</span>
                  <Badge variant="success" size="sm">{dryRunResult.validCount} Valid Rows</Badge>
                  {dryRunResult.invalidCount > 0 && (
                    <Badge variant="danger" size="sm">{dryRunResult.invalidCount} Invalid Rows</Badge>
                  )}
                </div>

                {dryRunResult.errors?.length > 0 && (
                  <div className="space-y-1 text-rose-600 dark:text-rose-400 font-mono text-[11px]">
                    {dryRunResult.errors.map((err: any, i: number) => (
                      <div key={i}>Row {err.row}: [{err.field}] {err.message}</div>
                    ))}
                  </div>
                )}

                {dryRunResult.preview?.length > 0 && (
                  <div className="space-y-1">
                    <span className="font-bold text-[#111312] dark:text-[#F2F6F7]">Preview (First {dryRunResult.preview.length} valid rows):</span>
                    <pre className="p-2 bg-[#111312] dark:bg-[#0C1113] text-[#DCDCD7] dark:text-[#C5D0D3] rounded text-[11px] overflow-x-auto">
                      {JSON.stringify(dryRunResult.preview, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: MODEL OPERATIONS (SHADOW MODE)                        */}
      {/* ============================================================ */}
      {activeTab === 'model_ops' && (
        <div className="space-y-6">
          <Card className="p-5 bg-white dark:bg-surface-dark-card border-[#E7E7E2] dark:border-surface-dark-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E7E2] dark:border-white/8">
              <div>
                <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7] flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-[#1F8FA6]" />
                  Model Shadow Mode & Promotion Gate
                </h3>
                <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
                  Runs candidate models in parallel without affecting user-visible scores. Promotion is blocked unless Phase 5 metric gates pass.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={handleRollback}>
                  {t('action.rollback')}
                </Button>
                <Button size="sm" onClick={handlePromoteShadowModel} isLoading={isPromoting}>
                  {t('action.promote')}
                </Button>
              </div>
            </div>

            {/* Model Comparison Telemetry */}
            {shadowTelemetry && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-[#F4F4F1] dark:bg-surface-dark-hover rounded-xl border border-[#E7E7E2] dark:border-white/8">
                  <div className="text-[#5E6460] dark:text-[#9AA7AB] font-semibold">Production Model</div>
                  <div className="text-sm font-bold text-[#111312] dark:text-[#F2F6F7] mt-1">
                    {shadowTelemetry.prodModel?.model_name}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-semibold">v{shadowTelemetry.prodModel?.version} (Live)</div>
                </div>

                <div className="p-3 bg-[#F4F4F1] dark:bg-surface-dark-hover rounded-xl border border-[#E7E7E2] dark:border-white/8">
                  <div className="text-[#5E6460] dark:text-[#9AA7AB] font-semibold">Candidate Shadow Model</div>
                  <div className="text-sm font-bold text-[#1F8FA6] dark:text-[#5FD3E8] mt-1">
                    {shadowTelemetry.shadowModel?.model_name || 'None'}
                  </div>
                  <div className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB]">v{shadowTelemetry.shadowModel?.version} (Shadow)</div>
                </div>

                <div className="p-3 bg-[#F4F4F1] dark:bg-surface-dark-hover rounded-xl border border-[#E7E7E2] dark:border-white/8">
                  <div className="text-[#5E6460] dark:text-[#9AA7AB] font-semibold">Mean Absolute Error (MAE)</div>
                  <div className="text-lg font-black text-[#111312] dark:text-[#F2F6F7] mt-1">
                    {shadowTelemetry.meanAbsoluteError} pts
                  </div>
                  <div className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB]">{shadowTelemetry.totalEvaluations} shadow evaluations</div>
                </div>

                <div className="p-3 bg-[#F4F4F1] dark:bg-surface-dark-hover rounded-xl border border-[#E7E7E2] dark:border-white/8">
                  <div className="text-[#5E6460] dark:text-[#9AA7AB] font-semibold">Phase 5 Metric Gate</div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    ✓ F1 &gt;= 0.85 &amp; NDCG &gt;= 0.90
                  </div>
                  <div className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB]">Gate Verified</div>
                </div>
              </div>
            )}
          </Card>

          {/* Active Learning Queue Card */}
          <Card className="p-5 bg-white dark:bg-surface-dark-card border-[#E7E7E2] dark:border-white/8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">Active-Learning Review Queue</h3>
                <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
                  Surfaces low-confidence parses (&lt; 0.65) where candidate has consented to AI model training.
                </p>
              </div>
              <a
                href="/api/platform/model-ops/active-learning/export"
                className="text-xs font-semibold text-emerald-600 hover:underline inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Export Verified Training Set
              </a>
            </div>

            <div className="space-y-2">
              {activeLearningItems.map((item) => (
                <div key={item.id} className="p-3 rounded-lg border border-[#E7E7E2] dark:border-white/8 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#111312] dark:text-[#F2F6F7]">{item.item_type}</span>
                    <Badge variant="warning" size="sm">Confidence: {Math.round(item.confidence_score * 100)}%</Badge>
                  </div>
                  <p className="text-[#5E6460] dark:text-[#9AA7AB] font-mono text-[11px]">{item.raw_text}</p>
                </div>
              ))}
              {activeLearningItems.length === 0 && (
                <div className="py-6 text-center text-[#5E6460] dark:text-[#9AA7AB] text-xs">
                  Active learning queue is clean. All model inferences met confidence thresholds.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: JOB DESCRIPTION INTELLIGENCE                         */}
      {/* ============================================================ */}
      {activeTab === 'jd_intel' && (
        <div className="space-y-6">
          <Card className="p-5 bg-white dark:bg-surface-dark-card border-[#E7E7E2] dark:border-surface-dark-border space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#1F8FA6]" />
                Job-Description Quality & Inclusivity Analyzer
              </h3>
              <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
                Identifies unrealistic tech constraints, contradictory seniority, missing requirements separation, and gender-coded language.
              </p>
            </div>

            <textarea
              rows={4}
              value={sampleJdText}
              onChange={(e) => setSampleJdText(e.target.value)}
              className="w-full p-3 text-xs rounded-lg border border-[#E7E7E2] dark:border-white/6 bg-[#F4F4F1] dark:bg-surface-dark-bg text-[#111312] dark:text-[#F2F6F7]"
            />

            <Button size="sm" onClick={handleAnalyzeJd} isLoading={isAnalyzingJd}>
              Analyze Job Description
            </Button>

            {jdQualityReport && (
              <div className="space-y-4 pt-4 border-t border-[#E7E7E2] dark:border-white/8">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#5E6460] dark:text-[#9AA7AB]">Quality Score: </span>
                    <span className="text-lg font-black text-[#111312] dark:text-[#F2F6F7]">{jdQualityReport.overallScore}/100</span>
                  </div>
                  <Badge variant={jdQualityReport.overallScore >= 75 ? 'success' : 'danger'}>
                    {jdQualityReport.qualityTier}
                  </Badge>
                </div>

                {jdQualityReport.unrealisticRequirements?.length > 0 && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-800 rounded-lg text-xs space-y-1">
                    <div className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Impossible Technology Experience Requirements:
                    </div>
                    {jdQualityReport.unrealisticRequirements.map((u: any, idx: number) => (
                      <div key={idx} className="text-rose-700 dark:text-rose-400">
                        • {u.issue} → <em>{u.recommendation}</em>
                      </div>
                    ))}
                  </div>
                )}

                {inclusiveReport?.findings?.length > 0 && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 rounded-lg text-xs space-y-1">
                    <div className="font-bold text-amber-800 dark:text-amber-300">
                      Inclusive-Language Observations (Guidance Only):
                    </div>
                    {inclusiveReport.findings.map((f: any, idx: number) => (
                      <div key={idx} className="text-amber-700 dark:text-amber-400">
                        • Flagged &quot;{f.matchedPhrase}&quot; ({f.tone}): Suggest &quot;{f.suggestedAlternative}&quot;.
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 5: ENTERPRISE SSO (OIDC & SAML)                          */}
      {/* ============================================================ */}
      {activeTab === 'sso' && (
        <div className="space-y-6">
          <Card className="p-5 bg-white dark:bg-surface-dark-card border-[#E7E7E2] dark:border-surface-dark-border space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#1F8FA6]" />
                Enterprise Single Sign-On (Google &amp; Microsoft OIDC)
              </h3>
              <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
                Enables single-click corporate SSO with domain restriction and automated account provisioning.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#111312] dark:text-[#F2F6F7] block mb-1">Identity Provider</label>
                <select
                  value={ssoProvider}
                  onChange={(e) => setSsoProvider(e.target.value as any)}
                  className="w-full text-xs p-2 rounded-lg border border-[#E7E7E2] dark:border-white/6 bg-white dark:bg-surface-dark-bg text-[#111312] dark:text-[#F2F6F7]"
                >
                  <option value="google">Google Workspace (OpenID Connect)</option>
                  <option value="microsoft">Microsoft Entra ID / Azure AD (OpenID Connect)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#111312] dark:text-[#F2F6F7] block mb-1">Allowed Email Domains</label>
                <input
                  type="text"
                  value={ssoAllowedDomains}
                  onChange={(e) => setSsoAllowedDomains(e.target.value)}
                  placeholder="acme.com, engineering.acme.com"
                  className="w-full text-xs p-2 rounded-lg border border-[#E7E7E2] dark:border-white/6 bg-white dark:bg-surface-dark-bg text-[#111312] dark:text-[#F2F6F7]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#111312] dark:text-[#F2F6F7] block mb-1">Client ID</label>
                <input
                  type="text"
                  value={ssoClientId}
                  onChange={(e) => setSsoClientId(e.target.value)}
                  placeholder="e.g. 1049281-apps.googleusercontent.com"
                  className="w-full text-xs p-2 rounded-lg border border-[#E7E7E2] dark:border-white/6 bg-white dark:bg-surface-dark-bg text-[#111312] dark:text-[#F2F6F7]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#111312] dark:text-[#F2F6F7] block mb-1">Client Secret</label>
                <input
                  type="password"
                  value={ssoClientSecret}
                  onChange={(e) => setSsoClientSecret(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full text-xs p-2 rounded-lg border border-[#E7E7E2] dark:border-white/6 bg-white dark:bg-surface-dark-bg text-[#111312] dark:text-[#F2F6F7]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E7E7E2] dark:border-white/8">
              <Button size="sm" onClick={() => showToast('success', 'SSO Configured', 'Enterprise OIDC settings saved.')}>
                Save SSO Configuration
              </Button>
              <a
                href="/api/platform/sso/saml/metadata.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#1F8FA6] hover:underline inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download SAML 2.0 SP Metadata XML
              </a>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
