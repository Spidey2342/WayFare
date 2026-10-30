export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export function createMemoryStorage(seed?: Map<string, string>): KeyValueStorage {
  const memory = seed ?? new Map<string, string>();
  return {
    async getItem(key) {
      return memory.get(key) ?? null;
    },
    async setItem(key, value) {
      memory.set(key, value);
    },
    async removeItem(key) {
      memory.delete(key);
    },
  };
}

/**
 * Wraps a driver so a thrown read/write (private mode, quota, blocked storage)
 * falls back to an in-memory map for the rest of the session.
 */
export function createSafeStorage(driver: KeyValueStorage): KeyValueStorage & {
  isUsingMemory(): boolean;
} {
  const memory = createMemoryStorage();
  let usingMemory = false;

  const rememberFailure = async (key: string, value?: string) => {
    usingMemory = true;
    if (value !== undefined) {
      await memory.setItem(key, value);
    }
  };

  return {
    isUsingMemory: () => usingMemory,
    async getItem(key) {
      if (usingMemory) return memory.getItem(key);
      try {
        return await driver.getItem(key);
      } catch {
        await rememberFailure(key);
        return memory.getItem(key);
      }
    },
    async setItem(key, value) {
      if (usingMemory) return memory.setItem(key, value);
      try {
        await driver.setItem(key, value);
      } catch {
        await rememberFailure(key, value);
      }
    },
    async removeItem(key) {
      if (usingMemory) return memory.removeItem(key);
      try {
        await driver.removeItem(key);
      } catch {
        usingMemory = true;
        await memory.removeItem(key);
      }
    },
  };
}
