/**
 * In-memory mock of @react-native-async-storage/async-storage.
 * Backs all operations with a simple Map so tests stay synchronous-feeling.
 */
const store = new Map<string, string>();

const AsyncStorage = {
  getItem: jest.fn(async (key: string) => store.get(key) ?? null),
  setItem: jest.fn(async (key: string, value: string) => {
    store.set(key, value);
  }),
  removeItem: jest.fn(async (key: string) => {
    store.delete(key);
  }),
  clear: jest.fn(async () => {
    store.clear();
  }),
  /** Expose the backing store for test assertions */
  _store: store,
};

export default AsyncStorage;
