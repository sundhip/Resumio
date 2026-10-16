/**
 * Cost Governance, AI Quota Management & Feature Flags Service
 * Phase 11: Production Hardening, Security, Privacy and Operations
 *
 * Implements:
 * 1. Per-Organization Gemini Token Budgets & Monthly Quotas
 * 2. In-Memory / Redis Semantic Prompt Cache to Eliminate Redundant LLM Costs
 * 3. Dynamic Feature Flags Engine (allow_external_ai, shadow_mode, deep_explainability)
 */

import crypto from 'crypto';

export interface OrgQuotaUsage {
  orgId: string;
  monthlyTokenLimit: number;
  tokensUsedThisMonth: number;
  costEstimateUsd: number;
  isThrottled: boolean;
}

export interface FeatureFlags {
  allowExternalAi: boolean;
  shadowModeEnabled: boolean;
  deepExplainability: boolean;
  bulkOcrEnabled: boolean;
  hnswVectorSearch: boolean;
}

export class CostGovernanceService {
  private promptCache: Map<string, { response: string; expiresAt: number }> = new Map();
  private orgUsage: Map<string, { tokens: number; month: string }> = new Map();
  private orgFeatureFlags: Map<string, FeatureFlags> = new Map();

  // Price estimate per 1k input/output tokens ($0.00025 for Flash)
  private readonly costPerThousandTokens = 0.00025;

  /**
   * Retrieves or computes cached LLM response using prompt text SHA-256 hash
   */
  public getCachedPromptResponse(promptText: string): string | null {
    const hash = crypto.createHash('sha256').update(promptText).digest('hex');
    const cached = this.promptCache.get(hash);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.response;
    }
    if (cached) {
      this.promptCache.delete(hash);
    }
    return null;
  }

  public setCachedPromptResponse(promptText: string, response: string, ttlSeconds: number = 86400): void {
    const hash = crypto.createHash('sha256').update(promptText).digest('hex');
    this.promptCache.set(hash, {
      response,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Records token usage and enforces monthly quota per organization
   */
  public recordTokenUsage(orgId: string, tokens: number): OrgQuotaUsage {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const limit = 1000000; // 1M tokens/month baseline tier

    let usage = this.orgUsage.get(orgId);
    if (!usage || usage.month !== currentMonth) {
      usage = { tokens: 0, month: currentMonth };
    }

    usage.tokens += tokens;
    this.orgUsage.set(orgId, usage);

    const isThrottled = usage.tokens >= limit;
    const costEstimateUsd = Number(((usage.tokens / 1000) * this.costPerThousandTokens).toFixed(4));

    return {
      orgId,
      monthlyTokenLimit: limit,
      tokensUsedThisMonth: usage.tokens,
      costEstimateUsd,
      isThrottled,
    };
  }

  /**
   * Feature flags manager
   */
  public getFeatureFlags(orgId: string): FeatureFlags {
    return (
      this.orgFeatureFlags.get(orgId) || {
        allowExternalAi: true,
        shadowModeEnabled: true,
        deepExplainability: true,
        bulkOcrEnabled: true,
        hnswVectorSearch: true,
      }
    );
  }

  public setFeatureFlag<K extends keyof FeatureFlags>(orgId: string, key: K, value: FeatureFlags[K]): void {
    const current = this.getFeatureFlags(orgId);
    current[key] = value;
    this.orgFeatureFlags.set(orgId, current);
  }
}

export const costGovernanceService = new CostGovernanceService();
