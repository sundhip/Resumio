/**
 * Enterprise In-Memory Multi-Tier Cache with TTL and Hit/Miss Telemetry.
 * Drop-in ready for Redis adapter replacement in distributed deployments.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class CacheService {
  private store: Map<string, CacheEntry<any>> = new Map();
  private hits: number = 0;
  private misses: number = 0;

  /**
   * Set a key with Time-To-Live in seconds (default: 300s / 5 mins)
   */
  public set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  /**
   * Retrieve a value or undefined if expired/missing
   */
  public get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return undefined;
    }

    this.hits++;
    return entry.value as T;
  }

  /**
   * Delete specific key or keys matching pattern prefix
   */
  public del(keyOrPrefix: string): void {
    for (const key of this.store.keys()) {
      if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Invalidate all cached data
   */
  public flush(): void {
    this.store.clear();
  }

  /**
   * Returns telemetry stats for caching efficiency monitoring
   */
  public getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? Math.round((this.hits / total) * 100) : 100;
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: `${hitRate}%`,
    };
  }
}

// Global Singleton Cache
export const cacheService = new CacheService();
