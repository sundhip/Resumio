import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  BookOpen,
  Search,
  Plus,
  GitMerge,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  Database,
  ArrowRight,
  Shield,
  Edit2,
  Trash2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface Skill {
  id: string;
  canonical_name: string;
  category: string;
  description?: string;
  aliases: string[];
  role_family?: string;
  status: string;
  is_deprecated: number;
  version: string;
}

interface ReviewQueueItem {
  id: string;
  extracted_phrase: string;
  suggested_skill_id?: string;
  suggested_name?: string;
  similarity_score?: number;
  source_document_id?: string;
  status: string;
  created_at: string;
}

interface AuditLog {
  id: string;
  skill_id: string;
  action: string;
  details_json: string;
  actor_id?: string;
  created_at: string;
}

interface TaxonomyStats {
  totalSkills: number;
  categories: Record<string, number>;
  totalRelationships: number;
  pendingQueueCount: number;
}

export const SkillOntologyPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'explorer' | 'queue' | 'audit'>('explorer');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [totalSkills, setTotalSkills] = useState(0);
  const [stats, setStats] = useState<TaxonomyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [page, setPage] = useState(0);
  const pageSize = 25;

  // Review Queue state
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);

  // Form states
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('tool');
  const [formRoleFamily, setFormRoleFamily] = useState('General');
  const [formDescription, setFormDescription] = useState('');
  const [formAliases, setFormAliases] = useState('');
  const [formDeprecated, setFormDeprecated] = useState(false);

  // Merge state
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [mergeSourceId, setMergeSourceId] = useState('');
  const [mergeError, setMergeError] = useState<string | null>(null);

  const categories = [
    'all',
    'language',
    'framework',
    'library',
    'database',
    'cloud',
    'tool',
    'methodology',
    'domain',
    'soft_skill',
    'certification',
  ];

  const fetchStats = async () => {
    try {
      const res = await api.getTaxonomyStats();
      if (res.success) {
        setStats(res.stats);
      }
    } catch (e) {
      console.error('Failed to load taxonomy stats:', e);
    }
  };

  const fetchSkills = async () => {
    setIsLoading(true);
    try {
      const res = await api.getSkills({
        search: searchTerm,
        category: selectedCategory,
        limit: pageSize,
        offset: page * pageSize,
      });
      if (res.success) {
        setSkills(res.skills);
        setTotalSkills(res.total);
      }
    } catch (e) {
      console.error('Failed to load skills:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQueue = async () => {
    try {
      const res = await api.getSkillReviewQueue('pending');
      if (res.success) {
        setReviewQueue(res.items);
      }
    } catch (e) {
      console.error('Failed to load review queue:', e);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await api.getSkillAuditLogs();
      if (res.success) {
        setAuditLogs(res.logs);
      }
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'explorer') {
      fetchSkills();
    } else if (activeTab === 'queue') {
      fetchQueue();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab, searchTerm, selectedCategory, page]);

  // Form Handlers
  const handleOpenAdd = () => {
    setFormName('');
    setFormCategory('tool');
    setFormRoleFamily('Software Engineering');
    setFormDescription('');
    setFormAliases('');
    setFormDeprecated(false);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setFormName(skill.canonical_name);
    setFormCategory(skill.category);
    setFormRoleFamily(skill.role_family || 'General');
    setFormDescription(skill.description || '');
    setFormAliases(skill.aliases.join(', '));
    setFormDeprecated(Boolean(skill.is_deprecated));
    setIsEditModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    try {
      const aliasesList = formAliases
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await api.createSkill({
        canonical_name: formName.trim(),
        category: formCategory,
        description: formDescription,
        aliases: aliasesList,
        role_family: formRoleFamily,
      });

      if (res.success) {
        setIsAddModalOpen(false);
        fetchSkills();
        fetchStats();
      }
    } catch (e) {
      console.error('Failed to create skill:', e);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSkill || !formName.trim()) return;

    try {
      const aliasesList = formAliases
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await api.updateSkill(editingSkill.id, {
        canonical_name: formName.trim(),
        category: formCategory,
        description: formDescription,
        aliases: aliasesList,
        role_family: formRoleFamily,
        is_deprecated: formDeprecated,
      });

      if (res.success) {
        setIsEditModalOpen(false);
        setEditingSkill(null);
        fetchSkills();
      }
    } catch (e) {
      console.error('Failed to update skill:', e);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete skill "${name}"?`)) return;
    try {
      const res = await api.deleteSkill(id);
      if (res.success) {
        fetchSkills();
        fetchStats();
      }
    } catch (e) {
      console.error('Failed to delete skill:', e);
    }
  };

  const handleMergeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMergeError(null);
    if (!mergeTargetId || !mergeSourceId) {
      setMergeError('Please select both target and source skills.');
      return;
    }
    if (mergeTargetId === mergeSourceId) {
      setMergeError('Target and source cannot be the same skill.');
      return;
    }

    try {
      const res = await api.mergeSkills(mergeTargetId, mergeSourceId);
      if (res.success) {
        setIsMergeModalOpen(false);
        setMergeTargetId('');
        setMergeSourceId('');
        fetchSkills();
        fetchStats();
      }
    } catch (e: any) {
      setMergeError(e.message || 'Failed to merge skills.');
    }
  };

  const handleQueueDecision = async (
    id: string,
    decision: 'approved' | 'rejected',
    mappedSkillId?: string
  ) => {
    try {
      const res = await api.decideSkillReviewItem(id, decision, mappedSkillId);
      if (res.success) {
        fetchQueue();
        fetchStats();
      }
    } catch (e) {
      console.error('Failed to decide review item:', e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Attribution Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-light-primary dark:border-border-dark-primary pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Skill Ontology & Knowledge Base
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Standardized technical taxonomy seeded from{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">ESCO v1.1</span> &{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">O*NET 28.0</span> under CC BY 4.0.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMergeModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-border-light-primary dark:border-border-dark-primary bg-surface-light-card dark:bg-surface-dark-card text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <GitMerge className="w-4 h-4 text-indigo-500" />
            Merge Duplicates
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add New Skill
          </button>
        </div>
      </div>

      {/* Stats Summary Bento Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-surface-light-card dark:bg-surface-dark-card border border-border-light-primary dark:border-border-dark-primary shadow-sm">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Canonical Skills</p>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
            {stats ? stats.totalSkills.toLocaleString() : '...'}
          </p>
          <p className="text-[11px] text-teal-600 dark:text-teal-400 mt-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Versioned & Seeded
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-light-card dark:bg-surface-dark-card border border-border-light-primary dark:border-border-dark-primary shadow-sm">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Taxonomy Categories</p>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
            {stats ? Object.keys(stats.categories).length : '11'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Languages, Clouds, Tools, DBs</p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-light-card dark:bg-surface-dark-card border border-border-light-primary dark:border-border-dark-primary shadow-sm">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Implied Relationships</p>
          <p className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
            {stats ? stats.totalRelationships : '...'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Weighted Directed Edges</p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-light-card dark:bg-surface-dark-card border border-border-light-primary dark:border-border-dark-primary shadow-sm">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Review Queue</p>
          <p className="text-2xl font-bold font-mono text-amber-500 mt-1">
            {stats ? stats.pendingQueueCount : '0'}
          </p>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Candidate Discovered
          </p>
        </div>
      </div>

      {/* Tabs Stepper */}
      <div className="flex border-b border-border-light-primary dark:border-border-dark-primary gap-4">
        <button
          onClick={() => setActiveTab('explorer')}
          className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'explorer'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Database className="w-4 h-4" />
          Taxonomy Explorer ({totalSkills})
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'queue'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Extraction Review Queue ({stats?.pendingQueueCount || 0})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Clock className="w-4 h-4" />
          Change History & Audit Logs
        </button>
      </div>

      {/* Tab 1: Taxonomy Explorer */}
      {activeTab === 'explorer' && (
        <div className="space-y-4">
          {/* Search & Category Pills */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search canonical skills, acronyms or aliases (e.g. k8s, postgres, ts)..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border-light-primary dark:border-border-dark-primary bg-surface-light-card dark:bg-surface-dark-card focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setPage(0);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                  selectedCategory === cat
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-surface-light-card dark:bg-surface-dark-card border border-border-light-primary dark:border-border-dark-primary text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Skills Table */}
          <div className="bg-surface-light-card dark:bg-surface-dark-card rounded-2xl border border-border-light-primary dark:border-border-dark-primary shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border-light-primary dark:border-border-dark-primary bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 font-medium">
                    <th className="py-3 px-4">Canonical Skill</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Role Family</th>
                    <th className="py-3 px-4">Aliases & Spellings</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light-primary dark:divide-border-dark-primary">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-teal-500 mb-2" />
                        Loading skill ontology...
                      </td>
                    </tr>
                  ) : skills.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        No skills found matching your query.
                      </td>
                    </tr>
                  ) : (
                    skills.map((skill) => (
                      <tr
                        key={skill.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-2">
                            <span>{skill.canonical_name}</span>
                            {skill.is_deprecated ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                                Deprecated
                              </span>
                            ) : null}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{skill.id}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                            {skill.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {skill.role_family || 'General'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {skill.aliases && skill.aliases.length > 0 ? (
                              skill.aliases.slice(0, 5).map((alias, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300"
                                >
                                  {alias}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
                            )}
                            {skill.aliases && skill.aliases.length > 5 ? (
                              <span className="text-[10px] text-slate-400">
                                +{skill.aliases.length - 5} more
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(skill)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                              title="Edit Skill"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(skill.id, skill.canonical_name)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 transition-colors"
                              title="Delete Skill"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="p-3 border-t border-border-light-primary dark:border-border-dark-primary flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing {Math.min(totalSkills, page * pageSize + 1)} -{' '}
                {Math.min(totalSkills, (page + 1) * pageSize)} of {totalSkills} skills
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="px-2.5 py-1 rounded-lg border border-border-light-primary dark:border-border-dark-primary disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={(page + 1) * pageSize >= totalSkills}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-2.5 py-1 rounded-lg border border-border-light-primary dark:border-border-dark-primary disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Extraction Review Queue */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-3">
            <Sparkles className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
            <div>
              <p className="font-semibold">Human-in-the-Loop Safe Taxonomy Expansion</p>
              <p className="mt-0.5 text-amber-700 dark:text-amber-300">
                These novel candidate skills were discovered during resume parsing and fell below confident similarity thresholds. Approve to expand the ontology or map them as synonyms to existing skills.
              </p>
            </div>
          </div>

          <div className="bg-surface-light-card dark:bg-surface-dark-card rounded-2xl border border-border-light-primary dark:border-border-dark-primary shadow-sm overflow-hidden">
            {reviewQueue.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                <CheckCircle className="w-8 h-8 text-teal-500 mx-auto mb-2 opacity-60" />
                Review queue is clear! All discovered skills have been classified.
              </div>
            ) : (
              <div className="divide-y divide-border-light-primary dark:divide-border-dark-primary">
                {reviewQueue.map((item) => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                          "{item.extracted_phrase}"
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Discovered Phrase
                        </span>
                      </div>
                      {item.suggested_name ? (
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                          Suggested match: <span className="font-medium text-slate-700 dark:text-slate-300">{item.suggested_name}</span>
                          {item.similarity_score ? (
                            <span className="text-[10px] font-mono text-teal-600">
                              ({(item.similarity_score * 100).toFixed(0)}% match)
                            </span>
                          ) : null}
                        </p>
                      ) : null}
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Queued on {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQueueDecision(item.id, 'approved')}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition-colors"
                      >
                        Approve as New Skill
                      </button>
                      {item.suggested_skill_id ? (
                        <button
                          onClick={() => handleQueueDecision(item.id, 'approved', item.suggested_skill_id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-border-light-primary dark:border-border-dark-primary bg-surface-light-card dark:bg-surface-dark-card hover:bg-slate-100 text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          Map as Alias to {item.suggested_name}
                        </button>
                      ) : null}
                      <button
                        onClick={() => handleQueueDecision(item.id, 'rejected')}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                        title="Reject Phrase"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Change History & Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-surface-light-card dark:bg-surface-dark-card rounded-2xl border border-border-light-primary dark:border-border-dark-primary shadow-sm overflow-hidden p-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-500" />
            Audit Ledger (SOC 2 & Reproducibility)
          </h3>
          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No recent audit log entries.</p>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl border border-border-light-primary dark:border-border-dark-primary bg-slate-50/50 dark:bg-slate-900/30 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                      Action: {log.action.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-1 font-mono text-[11px]">
                    Target: {log.skill_id} | Actor: {log.actor_id || 'system'}
                  </p>
                  <pre className="mt-1.5 p-2 rounded bg-slate-100 dark:bg-slate-900 text-[10px] font-mono text-slate-700 dark:text-slate-300 overflow-x-auto">
                    {log.details_json}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Skill Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-surface-light-card dark:bg-surface-dark-card rounded-2xl border border-border-light-primary dark:border-border-dark-primary shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
              {isEditModalOpen ? 'Edit Canonical Skill' : 'Add New Skill to Taxonomy'}
            </h3>

            <form onSubmit={isEditModalOpen ? handleEditSubmit : handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Canonical Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Kubernetes, React, PostgreSQL"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border-light-primary dark:border-border-dark-primary bg-surface-light-bg dark:bg-surface-dark-bg focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light-primary dark:border-border-dark-primary bg-surface-light-bg dark:bg-surface-dark-bg focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100 capitalize"
                  >
                    {categories.filter((c) => c !== 'all').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Role Family
                  </label>
                  <input
                    type="text"
                    value={formRoleFamily}
                    onChange={(e) => setFormRoleFamily(e.target.value)}
                    placeholder="e.g. Backend Engineering"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light-primary dark:border-border-dark-primary bg-surface-light-bg dark:bg-surface-dark-bg focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Aliases & Synonyms (comma-separated)
                </label>
                <input
                  type="text"
                  value={formAliases}
                  onChange={(e) => setFormAliases(e.target.value)}
                  placeholder="e.g. k8s, kube, kubernetes cluster"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border-light-primary dark:border-border-dark-primary bg-surface-light-bg dark:bg-surface-dark-bg focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  All variations will automatically resolve to this canonical skill name.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description / Documentation Link
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief description or ESCO/O*NET mapping details..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border-light-primary dark:border-border-dark-primary bg-surface-light-bg dark:bg-surface-dark-bg focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              {isEditModalOpen ? (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="dep-check"
                    checked={formDeprecated}
                    onChange={(e) => setFormDeprecated(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <label htmlFor="dep-check" className="text-xs text-slate-700 dark:text-slate-300">
                    Mark as deprecated technology
                  </label>
                </div>
              ) : null}

              <div className="flex justify-end gap-2 pt-3 border-t border-border-light-primary dark:border-border-dark-primary">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-2 text-xs rounded-xl border border-border-light-primary dark:border-border-dark-primary hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-500 text-white shadow-sm"
                >
                  {isEditModalOpen ? 'Save Changes' : 'Create Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Merge Skills Modal */}
      {isMergeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-surface-light-card dark:bg-surface-dark-card rounded-2xl border border-border-light-primary dark:border-border-dark-primary shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <GitMerge className="w-5 h-5 text-indigo-500" />
              Merge Duplicate Skills
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Merges all aliases and relationships from the source duplicate into the target canonical skill, then deletes the duplicate.
            </p>

            {mergeError ? (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-600 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {mergeError}
              </div>
            ) : null}

            <form onSubmit={handleMergeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  1. Canonical Target Skill ID (Kept) *
                </label>
                <input
                  type="text"
                  required
                  value={mergeTargetId}
                  onChange={(e) => setMergeTargetId(e.target.value)}
                  placeholder="e.g. skill_postgresql"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border-light-primary dark:border-border-dark-primary bg-surface-light-bg dark:bg-surface-dark-bg focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  2. Source Duplicate Skill ID (Merged & Deleted) *
                </label>
                <input
                  type="text"
                  required
                  value={mergeSourceId}
                  onChange={(e) => setMergeSourceId(e.target.value)}
                  placeholder="e.g. skill_postgres"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border-light-primary dark:border-border-dark-primary bg-surface-light-bg dark:bg-surface-dark-bg focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border-light-primary dark:border-border-dark-primary">
                <button
                  type="button"
                  onClick={() => setIsMergeModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl border border-border-light-primary dark:border-border-dark-primary hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm flex items-center gap-1.5"
                >
                  <GitMerge className="w-3.5 h-3.5" />
                  Execute Merge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
