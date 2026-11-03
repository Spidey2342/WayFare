import AsyncStorage from '@react-native-async-storage/async-storage';

import { outboxKey, readActiveUserId } from '@/features/auth/userSession';
import { rpcAwardPassDebate, rpcAwardSoloDebate } from '@/features/debate/api';
import { syncMyStats } from '@/features/debate/statsCache';
import { isSupabaseConfigured } from '@/services/supabase';
import { readOnline, subscribeOnline } from '@/services/network';

export type DebateOutboxItem = {
  clientId: string;
  kind: 'solo' | 'pass';
  xp: number;
  createdAt: number;
  attempts: number;
  lastError?: string;
};

export type DebateAwardResult = {
  xp: number;
  capped?: boolean;
  duplicate?: boolean;
  streak_days?: number;
  pending?: boolean;
};

async function outboxStorageKey(): Promise<string | null> {
  const userId = await readActiveUserId();
  return userId ? outboxKey(userId) : null;
}

async function readOutbox(): Promise<DebateOutboxItem[]> {
  const key = await outboxStorageKey();
  if (!key) return [];
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DebateOutboxItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeOutbox(items: DebateOutboxItem[]) {
  const key = await outboxStorageKey();
  if (!key) return;
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

export async function getPendingOutboxForClient(
  clientId: string,
): Promise<DebateOutboxItem | null> {
  const items = await readOutbox();
  return items.find((item) => item.clientId === clientId) ?? null;
}

export async function enqueueDebateAward(item: Omit<DebateOutboxItem, 'attempts' | 'createdAt'>) {
  const items = await readOutbox();
  if (items.some((row) => row.clientId === item.clientId)) return;
  items.push({
    ...item,
    createdAt: Date.now(),
    attempts: 0,
  });
  await writeOutbox(items);
  if (readOnline() && isSupabaseConfigured) {
    await flushDebateOutbox();
  }
}

function backoffMs(attempts: number): number {
  return Math.min(60_000, 1000 * 2 ** Math.min(attempts, 6));
}

async function deliverItem(item: DebateOutboxItem): Promise<DebateAwardResult> {
  if (item.kind === 'solo') {
    const data = await rpcAwardSoloDebate(item.clientId);
    return {
      xp: Number(data.xp ?? 0),
      capped: Boolean(data.capped),
      duplicate: Boolean(data.duplicate),
      streak_days: Number(data.streak_days ?? 0),
    };
  }
  const data = await rpcAwardPassDebate(item.clientId, item.xp);
  return {
    xp: Number(data.xp ?? 0),
    duplicate: Boolean(data.duplicate),
    streak_days: Number(data.streak_days ?? 0),
  };
}

export async function flushDebateOutbox(): Promise<void> {
  if (!isSupabaseConfigured || !readOnline()) return;
  if (!(await readActiveUserId())) return;
  let items = await readOutbox();
  if (items.length === 0) return;

  const remaining: DebateOutboxItem[] = [];
  for (const item of items) {
    const wait = backoffMs(item.attempts);
    if (item.attempts > 0 && Date.now() - item.createdAt < wait) {
      remaining.push(item);
      continue;
    }
    try {
      await deliverItem(item);
      await syncMyStats();
    } catch (caught) {
      remaining.push({
        ...item,
        attempts: item.attempts + 1,
        lastError: caught instanceof Error ? caught.message : String(caught),
      });
    }
  }
  await writeOutbox(remaining);
}

let subscribed = false;

export function ensureOutboxFlushOnReconnect() {
  if (subscribed) return;
  subscribed = true;
  subscribeOnline((online) => {
    if (online) void flushDebateOutbox();
  });
}

export async function awardSoloDebatesSignedIn(clientId: string): Promise<DebateAwardResult> {
  if (!isSupabaseConfigured || !readOnline()) {
    await enqueueDebateAward({ clientId, kind: 'solo', xp: 1 });
    return { xp: 1, pending: true };
  }
  try {
    const result = await deliverItem({
      clientId,
      kind: 'solo',
      xp: 1,
      createdAt: Date.now(),
      attempts: 0,
    });
    await syncMyStats();
    return result;
  } catch {
    await enqueueDebateAward({ clientId, kind: 'solo', xp: 1 });
    return { xp: 1, pending: true };
  }
}

export async function awardPassDebateSignedIn(
  clientId: string,
  xp: number,
): Promise<DebateAwardResult> {
  if (!isSupabaseConfigured || !readOnline()) {
    await enqueueDebateAward({ clientId, kind: 'pass', xp });
    return { xp, pending: true };
  }
  try {
    const result = await deliverItem({
      clientId,
      kind: 'pass',
      xp,
      createdAt: Date.now(),
      attempts: 0,
    });
    await syncMyStats();
    return result;
  } catch {
    await enqueueDebateAward({ clientId, kind: 'pass', xp });
    return { xp, pending: true };
  }
}
