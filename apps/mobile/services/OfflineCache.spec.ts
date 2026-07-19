import { OfflineCache, QueuedMutation } from './OfflineCache';

// Mock AsyncStorage
const store: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
    getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
    multiRemove: jest.fn((keys: string[]) => {
      keys.forEach((k) => delete store[k]);
      return Promise.resolve();
    }),
  },
}));

describe('OfflineCache', () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
  });

  describe('set / get', () => {
    it('should store and retrieve cached data', async () => {
      await OfflineCache.set('contracts', { items: [1, 2, 3] });
      const result = await OfflineCache.get<{ items: number[] }>('contracts');
      expect(result).not.toBeNull();
      expect(result!.data).toEqual({ items: [1, 2, 3] });
      expect(result!.stale).toBe(false);
    });

    it('should return null for missing keys', async () => {
      const result = await OfflineCache.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should flag expired entries as stale', async () => {
      // Store with 0ms TTL (immediately expired)
      await OfflineCache.set('expired', { value: 42 }, 0);
      // Tiny delay to ensure expiration
      await new Promise((r) => setTimeout(r, 5));
      const result = await OfflineCache.get<{ value: number }>('expired');
      expect(result).not.toBeNull();
      expect(result!.stale).toBe(true);
      expect(result!.data.value).toBe(42);
    });
  });

  describe('invalidate', () => {
    it('should remove a specific cache entry', async () => {
      await OfflineCache.set('to-remove', { x: 1 });
      await OfflineCache.invalidate('to-remove');
      const result = await OfflineCache.get('to-remove');
      expect(result).toBeNull();
    });
  });

  describe('clearAll', () => {
    it('should remove all cache entries and mutation queue', async () => {
      await OfflineCache.set('a', { val: 1 });
      await OfflineCache.set('b', { val: 2 });
      await OfflineCache.queueMutation('/test', 'POST', { x: 1 });

      await OfflineCache.clearAll();

      expect(await OfflineCache.get('a')).toBeNull();
      expect(await OfflineCache.get('b')).toBeNull();
      expect(await OfflineCache.getMutationQueue()).toEqual([]);
    });
  });

  describe('mutation queue', () => {
    it('should queue and retrieve mutations', async () => {
      await OfflineCache.queueMutation('/contracts', 'POST', { amount: 100 });
      await OfflineCache.queueMutation('/contracts/abc/proof', 'POST', { notes: 'done' });

      const queue = await OfflineCache.getMutationQueue();
      expect(queue).toHaveLength(2);
      expect(queue[0].path).toBe('/contracts');
      expect(queue[1].path).toBe('/contracts/abc/proof');
    });

    it('should dequeue a specific mutation by id', async () => {
      await OfflineCache.queueMutation('/a', 'POST');
      await OfflineCache.queueMutation('/b', 'POST');

      const queue = await OfflineCache.getMutationQueue();
      await OfflineCache.dequeueMutation(queue[0].id);

      const remaining = await OfflineCache.getMutationQueue();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].path).toBe('/b');
    });
  });

  describe('replayQueue', () => {
    it('should replay successful mutations and dequeue them', async () => {
      await OfflineCache.queueMutation('/a', 'POST', { x: 1 });
      await OfflineCache.queueMutation('/b', 'POST', { y: 2 });

      const mockFetch = jest.fn().mockResolvedValue({ ok: true });

      const result = await OfflineCache.replayQueue(mockFetch);
      expect(result).toEqual({ replayed: 2, failed: 0 });
      expect(mockFetch).toHaveBeenCalledTimes(2);

      const remaining = await OfflineCache.getMutationQueue();
      expect(remaining).toEqual([]);
    });

    it('should count failed replays without removing them', async () => {
      await OfflineCache.queueMutation('/fail', 'POST');

      const mockFetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

      const result = await OfflineCache.replayQueue(mockFetch);
      expect(result).toEqual({ replayed: 0, failed: 1 });

      const remaining = await OfflineCache.getMutationQueue();
      expect(remaining).toHaveLength(1);
    });

    it('should handle network errors gracefully', async () => {
      await OfflineCache.queueMutation('/error', 'POST');

      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await OfflineCache.replayQueue(mockFetch);
      expect(result).toEqual({ replayed: 0, failed: 1 });
    });
  });
});
