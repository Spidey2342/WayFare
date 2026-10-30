import type { KeyValueStorage } from './safeStorage';

export const webDriver: KeyValueStorage = {
  async getItem(key) {
    if (typeof localStorage === 'undefined') {
      throw new Error('localStorage is unavailable');
    }
    return localStorage.getItem(key);
  },
  async setItem(key, value) {
    if (typeof localStorage === 'undefined') {
      throw new Error('localStorage is unavailable');
    }
    localStorage.setItem(key, value);
  },
  async removeItem(key) {
    if (typeof localStorage === 'undefined') {
      throw new Error('localStorage is unavailable');
    }
    localStorage.removeItem(key);
  },
};
