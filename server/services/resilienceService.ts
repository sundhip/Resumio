/**
 * Resilience, Circuit Breaker & Chaos Engineering Engine
 * Resumio Phase 14: Cloud-Native SRE & Production Readiness
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold?: number;     // Failures before tripping (default: 5)
  successThreshold?: number;     // Consecutive successes to close from HALF_OPEN (default: 2)
  resetTimeoutMs?: number;       // Milliseconds before trying HALF_OPEN (default: 10000)
  timeoutMs?: number;            // Request execution timeout (default: 5000)
}

export interface CircuitBreakerStats {
  name: string;
  state: CircuitState;
  failures: number;
  successes: number;
  consecutiveSuccesses: number;
  lastFailureTime: number | null;
  lastStateChange: number;
  metrics: {
    totalCalls: number;
    totalSuccesses: number;
    totalFailures: number;
    totalRejections: number;
  };
}

export class CircuitBreakerError extends Error {
  public code: string;
  constructor(message: string, code: string = 'CIRCUIT_BREAKER_OPEN') {
    super(message);
    this.name = 'CircuitBreakerError';
    this.code = code;
  }
}

/**
 * Enterprise Circuit Breaker implementation protecting downstream resources
 * (Database queries, AI provider calls, 3rd party webhooks)
 */
export class CircuitBreaker {
  public readonly name: string;
  private state: CircuitState = 'CLOSED';
  private failureThreshold: number;
  private successThreshold: number;
  private resetTimeoutMs: number;
  private timeoutMs: number;

  private failures = 0;
  private consecutiveSuccesses = 0;
  private lastFailureTime: number | null = null;
  private lastStateChange = Date.now();

  private totalCalls = 0;
  private totalSuccesses = 0;
  private totalFailures = 0;
  private totalRejections = 0;

  constructor(name: string, options: CircuitBreakerOptions = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold ?? 5;
    this.successThreshold = options.successThreshold ?? 2;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 10000;
    this.timeoutMs = options.timeoutMs ?? 5000;
  }

  public getState(): CircuitState {
    if (this.state === 'OPEN') {
      const elapsed = Date.now() - (this.lastFailureTime || 0);
      if (elapsed >= this.resetTimeoutMs) {
        this.transitionTo('HALF_OPEN');
      }
    }
    return this.state;
  }

  private transitionTo(newState: CircuitState) {
    this.state = newState;
    this.lastStateChange = Date.now();
    if (newState === 'HALF_OPEN') {
      this.consecutiveSuccesses = 0;
    } else if (newState === 'CLOSED') {
      this.failures = 0;
      this.consecutiveSuccesses = 0;
    }
  }

  public async execute<T>(fn: () => Promise<T>, fallback?: () => Promise<T> | T): Promise<T> {
    this.totalCalls++;
    const currentState = this.getState();

    if (currentState === 'OPEN') {
      this.totalRejections++;
      if (fallback) {
        return fallback();
      }
      throw new CircuitBreakerError(`Circuit breaker '${this.name}' is OPEN. Fast-failing request.`);
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout of ${this.timeoutMs}ms exceeded in '${this.name}'`)), this.timeoutMs)
        ),
      ]);

      this.onSuccess();
      return result;
    } catch (err: any) {
      this.onFailure();
      if (fallback) {
        return fallback();
      }
      throw err;
    }
  }

  private onSuccess() {
    this.totalSuccesses++;
    if (this.state === 'HALF_OPEN') {
      this.consecutiveSuccesses++;
      if (this.consecutiveSuccesses >= this.successThreshold) {
        this.transitionTo('CLOSED');
      }
    } else if (this.state === 'CLOSED') {
      this.failures = 0;
    }
  }

  private onFailure() {
    this.totalFailures++;
    this.lastFailureTime = Date.now();
    this.failures++;

    if (this.state === 'HALF_OPEN' || this.failures >= this.failureThreshold) {
      this.transitionTo('OPEN');
    }
  }

  public trip() {
    this.lastFailureTime = Date.now();
    this.transitionTo('OPEN');
  }

  public reset() {
    this.transitionTo('CLOSED');
  }

  public getStats(): CircuitBreakerStats {
    return {
      name: this.name,
      state: this.getState(),
      failures: this.failures,
      successes: this.totalSuccesses,
      consecutiveSuccesses: this.consecutiveSuccesses,
      lastFailureTime: this.lastFailureTime,
      lastStateChange: this.lastStateChange,
      metrics: {
        totalCalls: this.totalCalls,
        totalSuccesses: this.totalSuccesses,
        totalFailures: this.totalFailures,
        totalRejections: this.totalRejections,
      },
    };
  }
}

/**
 * Chaos Engineering Fault-Injection Simulator
 * Allows site reliability engineers to inject controlled latencies, jitter, or errors
 * to test systemic elasticity and self-healing.
 */
export interface ChaosRule {
  target: 'database' | 'ai' | 'storage' | 'network' | 'all';
  type: 'latency' | 'error' | 'packet_loss';
  latencyMs?: number;
  probability?: number; // 0.0 - 1.0 (default 1.0)
  errorMessage?: string;
}

export class ResilienceManager {
  private static instance: ResilienceManager;
  private breakers = new Map<string, CircuitBreaker>();
  private activeChaosRules: ChaosRule[] = [];
  private isDraining = false; // Blue-Green traffic drain mode

  private constructor() {
    // Default core system breakers
    this.getBreaker('database', { failureThreshold: 3, resetTimeoutMs: 5000 });
    this.getBreaker('ai-provider', { failureThreshold: 3, resetTimeoutMs: 15000 });
    this.getBreaker('cloud-storage', { failureThreshold: 4, resetTimeoutMs: 8000 });
  }

  public static getInstance(): ResilienceManager {
    if (!ResilienceManager.instance) {
      ResilienceManager.instance = new ResilienceManager();
    }
    return ResilienceManager.instance;
  }

  public getBreaker(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, options));
    }
    return this.breakers.get(name)!;
  }

  public getAllBreakerStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    for (const [name, breaker] of this.breakers.entries()) {
      stats[name] = breaker.getStats();
    }
    return stats;
  }

  // --- Chaos Engineering Simulation Hooks ---
  public injectChaosRule(rule: ChaosRule) {
    this.activeChaosRules.push(rule);
  }

  public clearChaosRules() {
    this.activeChaosRules = [];
  }

  public getActiveChaosRules(): ChaosRule[] {
    return [...this.activeChaosRules];
  }

  public async evaluateChaos(target: 'database' | 'ai' | 'storage' | 'network'): Promise<void> {
    for (const rule of this.activeChaosRules) {
      if (rule.target === target || rule.target === 'all') {
        const prob = rule.probability ?? 1.0;
        if (Math.random() <= prob) {
          if (rule.type === 'latency' && rule.latencyMs) {
            await new Promise((resolve) => setTimeout(resolve, rule.latencyMs));
          } else if (rule.type === 'error') {
            throw new Error(rule.errorMessage || `[CHAOS FAULT INJECTED] Simulated failure on target: ${target}`);
          }
        }
      }
    }
  }

  // --- Blue-Green Deployment & Graceful Drain Controls ---
  public setDraining(draining: boolean) {
    this.isDraining = draining;
  }

  public getIsDraining(): boolean {
    return this.isDraining;
  }
}

export const resilience = ResilienceManager.getInstance();
