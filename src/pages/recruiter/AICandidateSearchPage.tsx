import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import type { NaturalLanguageSearchResponse } from '../../types';
import {
  Search,
  Sparkles,
  Layers,
  MapPin,
  GraduationCap,
  Clock,
  ArrowRight,
  AlertTriangle,
  Filter,
} from 'lucide-react';

interface AICandidateSearchPageProps {
  onNavigate?: (path: string, params?: Record<string, any>) => void;
}

const SAMPLE_QUERIES = [
  'Find Python and Django developers with 3+ years backend experience',
  'Frontend engineers with React and TypeScript in Bengaluru',
  'Cloud DevOps engineers with Docker and AWS experience',
  'Full stack developers with Node.js and PostgreSQL',
];

export const AICandidateSearchPage: React.FC<AICandidateSearchPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<NaturalLanguageSearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (queryText?: string) => {
    const textToSearch = (queryText !== undefined ? queryText : query).trim();
    if (!textToSearch) {
      showToast('error', 'Search Query Required', 'Please enter a search prompt.');
      return;
    }

    if (queryText !== undefined) {
      setQuery(queryText);
    }

    setIsSearching(true);
    try {
      const res = await api.searchCandidates(textToSearch);
      if (res.success && res.data) {
        setSearchResult(res.data);
        if (res.data.isRejected) {
          showToast('error', 'Query Rejected', res.data.rejectionReason || 'Search blocked by bias guardrails.');
        }
      }
    } catch (err: any) {
      showToast('error', 'Search Failed', err.message || 'Error executing search.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              AI Natural-Language Candidate Search
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              Query Interpretation Engine
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Describe your target candidate profile in natural language. Resumio translates your query into structured database filters.
          </p>
        </div>

        {onNavigate && (
          <Button
            variant="outline"
            size="md"
            onClick={() => onNavigate('applicants')}
            leftIcon={<Layers className="w-4 h-4" />}
          >
            Applicant Pipeline
          </Button>
        )}
      </div>

      {/* Main Search Input Card */}
      <Card padding="md" className="space-y-4 border-brand-200/80 dark:border-brand-900/50 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="space-y-3"
        >
          <div className="relative flex items-center">
            <Search className="w-5 h-5 absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe what you're looking for, e.g. 'Find Python and Django engineers with 3+ years experience'..."
              className="w-full h-12 pl-11 pr-28 text-sm rounded-control bg-slate-50/80 dark:bg-surface-dark-input text-slate-900 dark:text-white border border-slate-200 dark:border-surface-dark-border focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all placeholder:text-slate-400"
            />
            <div className="absolute right-2 flex items-center">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSearching}
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Search
              </Button>
            </div>
          </div>

          {/* Quick Example Prompt Chips */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Try searching:
            </span>
            {SAMPLE_QUERIES.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSearch(q)}
                className="px-2.5 py-1 text-xs rounded-control bg-slate-100 dark:bg-surface-dark-card hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/40 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-surface-dark-border transition-colors text-left truncate max-w-xs sm:max-w-none"
              >
                {q}
              </button>
            ))}
          </div>
        </form>
      </Card>

      {/* Safety Rejection Alert */}
      {searchResult?.isRejected && (
        <div className="p-4 rounded-card bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-rose-800 dark:text-rose-200 uppercase tracking-wider">
              Search Guardrail Triggered
            </h4>
            <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
              {searchResult.rejectionReason}
            </p>
          </div>
        </div>
      )}

      {/* Interpreted Search Filters Breakdown */}
      {searchResult && !searchResult.isRejected && (
        <Card padding="sm" className="space-y-2.5 bg-slate-50/60 dark:bg-surface-dark-bg/60 border-slate-200/80 dark:border-surface-dark-border">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Query Interpretation
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Found {searchResult.totalResults} matching candidate(s)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded bg-white dark:bg-surface-dark-card border border-slate-100 dark:border-surface-dark-border">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Extracted Skills</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                {searchResult.interpreted.skills.length > 0 ? searchResult.interpreted.skills.join(', ') : 'Any'}
              </p>
            </div>

            <div className="p-2 rounded bg-white dark:bg-surface-dark-card border border-slate-100 dark:border-surface-dark-border">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Min Experience</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {searchResult.interpreted.minExperience !== null ? `${searchResult.interpreted.minExperience}+ years` : 'Any level'}
              </p>
            </div>

            <div className="p-2 rounded bg-white dark:bg-surface-dark-card border border-slate-100 dark:border-surface-dark-border">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Role Focus</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                {searchResult.interpreted.jobTitles.length > 0 ? searchResult.interpreted.jobTitles.join(', ') : 'All engineering'}
              </p>
            </div>

            <div className="p-2 rounded bg-white dark:bg-surface-dark-card border border-slate-100 dark:border-surface-dark-border">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Location Filter</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                {searchResult.interpreted.locations.length > 0 ? searchResult.interpreted.locations.join(', ') : 'Any location / Remote'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Candidate Results Grid */}
      {isSearching ? (
        <div className="space-y-4 py-8 animate-pulse">
          <div className="h-28 rounded-card bg-slate-100 dark:bg-surface-dark-card" />
          <div className="h-28 rounded-card bg-slate-100 dark:bg-surface-dark-card" />
        </div>
      ) : searchResult && !searchResult.isRejected ? (
        searchResult.candidates.length === 0 ? (
          <EmptyState
            icon={<Search className="w-10 h-10 text-slate-300 dark:text-slate-600" />}
            title="No candidates matched your search"
            description="Try broadening your search query or mentioning different skills and experience criteria."
          />
        ) : (
          <div className="space-y-4">
            {searchResult.candidates.map((cand, idx) => (
              <Card
                key={cand.candidateProfileId}
                padding="md"
                className="space-y-3 hover:border-slate-300 dark:hover:border-surface-dark-border transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={
                        cand.photoUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                      }
                      alt={cand.fullName}
                      className="w-11 h-11 rounded-full object-cover ring-1 ring-slate-200 dark:ring-surface-dark-border shrink-0 mt-0.5"
                    />

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                          #{idx + 1}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          {cand.fullName}
                        </h3>
                        {cand.matchScore !== null && (
                          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            {cand.matchScore}% Match
                          </span>
                        )}
                        {cand.latestApplicationStatus && (
                          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 dark:bg-surface-dark-card text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-surface-dark-border">
                            {cand.latestApplicationStatus}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {cand.headline}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {cand.location}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          ~{cand.experienceYears} yrs experience
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                          {cand.highestEducation}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {onNavigate && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onNavigate('applicants')}
                        className="text-xs"
                      >
                        Inspect in Pipeline <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Skills tags */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100 dark:border-surface-dark-border">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                    Skills:
                  </span>
                  {cand.skills.map((s) => {
                    const isMatched = cand.matchedQuerySkills.includes(s);
                    return (
                      <span
                        key={s}
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                          isMatched
                            ? 'bg-brand-600 text-white shadow-xs font-bold'
                            : 'bg-slate-100 dark:bg-surface-dark-card text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-surface-dark-border'
                        }`}
                      >
                        {isMatched ? `✓ ${s}` : s}
                      </span>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        /* Initial Empty State */
        <EmptyState
          icon={<Search className="w-10 h-10 text-slate-300 dark:text-slate-600" />}
          title="Search verified candidates with AI"
          description="Type queries matching specific technologies, years of experience, and role requirements above."
        />
      )}
    </div>
  );
};
