import AsyncStorage from '@react-native-async-storage/async-storage';

import { storage } from '@/services/storage';

const ACTIVE_USER_KEY = 'wayfare:active-user-id';

export function statsCacheKey(userId: string) {
  return `wayfare:user-stats-cache:v2:${userId}`;
}

export function badgesCacheKey(userId: string) {
  return `wayfare:user-badges-cache:v2:${userId}`;
}

export function statsSyncKey(userId: string) {
  return `wayfare:user-stats-synced-at:v2:${userId}`;
}

export function outboxKey(userId: string) {
  return `wayfare:debate-outbox:v2:${userId}`;
}

/** Legacy keys (pre user-scoping) — removed on sign-in switch and sign-out. */
const LEGACY_KEYS = [
  'wayfare:user-stats-cache:v1',
  'wayfare:user-badges-cache:v1',
  'wayfare:user-stats-synced-at',
  'wayfare:debate-outbox:v1',
];

export async function readActiveUserId(): Promise<string | null> {
  return storage.getItem(ACTIVE_USER_KEY);
}

export async function clearUserScopedCaches(userId: string) {
  await AsyncStorage.multiRemove([
    statsCacheKey(userId),
    badgesCacheKey(userId),
    statsSyncKey(userId),
    outboxKey(userId),
  ]);
}

export async function clearLegacyUserCaches() {
  await AsyncStorage.multiRemove(LEGACY_KEYS);
}

export async function activateUserSession(userId: string) {
  const previous = await readActiveUserId();
  if (previous && previous !== userId) {
    await clearUserScopedCaches(previous);
  }
  await clearLegacyUserCaches();
  await storage.setItem(ACTIVE_USER_KEY, userId);
}

export async function clearActiveUserSession() {
  const previous = await readActiveUserId();
  if (previous) await clearUserScopedCaches(previous);
  await clearLegacyUserCaches();
  await storage.removeItem(ACTIVE_USER_KEY);
}
