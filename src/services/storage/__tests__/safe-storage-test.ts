import { createMemoryStorage, createSafeStorage } from '../safeStorage';

describe('createSafeStorage', () => {
  test('reads and writes through the driver', async () => {
    const driver = createMemoryStorage();
    const storage = createSafeStorage(driver);

    await storage.setItem('verse', 'psalm-119');
    await expect(storage.getItem('verse')).resolves.toBe('psalm-119');
    await expect(driver.getItem('verse')).resolves.toBe('psalm-119');
    expect(storage.isUsingMemory()).toBe(false);
  });

  test('falls back to memory when the driver throws', async () => {
    const driver = {
      async getItem() {
        throw new Error('blocked');
      },
      async setItem() {
        throw new Error('quota');
      },
      async removeItem() {
        throw new Error('blocked');
      },
    };
    const storage = createSafeStorage(driver);

    await storage.setItem('name', 'Kofi');
    expect(storage.isUsingMemory()).toBe(true);
    await expect(storage.getItem('name')).resolves.toBe('Kofi');
    await storage.removeItem('name');
    await expect(storage.getItem('name')).resolves.toBeNull();
  });

  test('switches to memory after a failed read and keeps later writes', async () => {
    let failReads = true;
    const memory = new Map<string, string>();
    const driver = {
      async getItem(key: string) {
        if (failReads) throw new Error('denied');
        return memory.get(key) ?? null;
      },
      async setItem(key: string, value: string) {
        memory.set(key, value);
      },
      async removeItem(key: string) {
        memory.delete(key);
      },
    };
    const storage = createSafeStorage(driver);
    await expect(storage.getItem('missing')).resolves.toBeNull();
    expect(storage.isUsingMemory()).toBe(true);
    await storage.setItem('streak', '3');
    await expect(storage.getItem('streak')).resolves.toBe('3');
    expect(memory.has('streak')).toBe(false);
  });
});
