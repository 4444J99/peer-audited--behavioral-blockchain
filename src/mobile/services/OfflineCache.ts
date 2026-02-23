import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Offline caching layer for low-connectivity scenarios.
 * Caches API responses locally and queues mutations for replay
 * when connectivity is restored.
 */

const CACHE_PREFIX = '@styx_cache:';
const QUEUE_KEY = '@styx_mutation_queue';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  ttlMs: number;
}

export interface QueuedMutation {
  id: string;
  path: string;
  method: string;
  body?: string;
  queuedAt: number;
}

export class OfflineCache {
  /**
   * Store an API response in local cache.
   */
  static async set<T>(key: string, data: T, ttlMs: number = CACHE_TTL_MS): Promise<void> {
    const entry: CacheEntry<T> = { data, cachedAt: Date.now(), ttlMs };
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
  }

  /**
   * Retrieve a cached API response. Returns null if expired or missing.
   */
  static async get<T>(key: string): Promise<{ data: T; stale: boolean } | null> {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);
    const age = Date.now() - entry.cachedAt;
    const expired = age > entry.ttlMs;

    if (expired) {
      // Return stale data (better than nothing offline) but flag it
      return { data: entry.data, stale: true };
    }

    return { data: entry.data, stale: false };
  }

  /**
   * Remove a specific cache entry.
   */
  static async invalidate(key: string): Promise<void> {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
  }

  /**
   * Clear all cached data (logout scenario).
   */
  static async clearAll(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
    await AsyncStorage.removeItem(QUEUE_KEY);
  }

  /**
   * Queue a mutation (POST/PATCH/DELETE) for replay when online.
   */
  static async queueMutation(
    path: string,
    method: string,
    body?: Record<string, unknown>,
  ): Promise<void> {
    const queue = await OfflineCache.getMutationQueue();
    const mutation: QueuedMutation = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      path,
      method,
      body: body ? JSON.stringify(body) : undefined,
      queuedAt: Date.now(),
    };
    queue.push(mutation);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }

  /**
   * Get all pending mutations.
   */
  static async getMutationQueue(): Promise<QueuedMutation[]> {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  /**
   * Remove a mutation from the queue after successful replay.
   */
  static async dequeueMutation(id: string): Promise<void> {
    const queue = await OfflineCache.getMutationQueue();
    const filtered = queue.filter((m) => m.id !== id);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  }

  /**
   * Replay all queued mutations using the provided fetch function.
   * Returns the count of successfully replayed mutations.
   */
  static async replayQueue(
    fetchFn: (path: string, options: RequestInit) => Promise<Response>,
  ): Promise<{ replayed: number; failed: number }> {
    const queue = await OfflineCache.getMutationQueue();
    let replayed = 0;
    let failed = 0;

    for (const mutation of queue) {
      try {
        const response = await fetchFn(mutation.path, {
          method: mutation.method,
          headers: { 'Content-Type': 'application/json' },
          body: mutation.body,
        });

        if (response.ok) {
          await OfflineCache.dequeueMutation(mutation.id);
          replayed++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    return { replayed, failed };
  }
}
