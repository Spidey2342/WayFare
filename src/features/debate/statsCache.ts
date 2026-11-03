import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  badgesCacheKey,
  readActiveUserId,
  statsCacheKey,
  statsSyncKey,
} from '@/features/auth/userSession';
import { isSupabaseConfigured, requireSupabase } from '@/services/supabase';

export type CachedUserStats = {
  xp: number;
  streak_days: number;
  last_active_date: string | null;
  solo_debates_today: number;
  solo_day: string | null;
  debates_judged: number;
  debate_mvps: number;
};

export type CachedBadge = { badge_id: string; earned_at: string };

export async function readCachedStats(userId?: string | null): Promise<{
  stats: CachedUserStats | null;
  badges: CachedBadge[];
}> {
  const uid = userId ?? (await readActiveUserId());
  if (!uid) return { stats: null, badges: [] };
  try {
    const statsRaw = await AsyncStorage.getItem(statsCacheKey(uid));
    const badgesRaw = await AsyncStorage.getItem(badgesCacheKey(uid));
    return {
      stats: statsRaw ? (JSON.parse(statsRaw) as CachedUserStats) : null,
      badges: badgesRaw ? (JSON.parse(badgesRaw) as CachedBadge[]) : [],
    };
  } catch {
    return { stats: null, badges: [] };
  }
}

export async function writeCachedStatsForUser(
  userId: string,
  stats: CachedUserStats | null,
  badges: CachedBadge[],
) {
  if (stats) await AsyncStorage.setItem(statsCacheKey(userId), JSON.stringify(stats));
  await AsyncStorage.setItem(badgesCacheKey(userId), JSON.stringify(badges));
  await AsyncStorage.setItem(statsSyncKey(userId), new Date().toISOString());
}

export async function syncMyStats(userId?: string | null): Promise<{
  stats: CachedUserStats | null;
  badges: CachedBadge[];
}> {
  const uid = userId ?? (await readActiveUserId());
  if (!uid || !isSupabaseConfigured) return readCachedStats(uid);
  const { data, error } = await requireSupabase().rpc('get_my_stats');
  if (error || !data || typeof data !== 'object') return readCachedStats(uid);
  const record = data as { stats?: Record<string, unknown>; badges?: CachedBadge[] };
  const statsRow = record.stats;
  const stats: CachedUserStats | null = statsRow
    ? {
        xp: Number(statsRow.xp ?? 0),
        streak_days: Number(statsRow.streak_days ?? 0),
        last_active_date: statsRow.last_active_date ? String(statsRow.last_active_date) : null,
        solo_debates_today: Number(statsRow.solo_debates_today ?? 0),
        solo_day: statsRow.solo_day ? String(statsRow.solo_day) : null,
        debates_judged: Number(statsRow.debates_judged ?? 0),
        debate_mvps: Number(statsRow.debate_mvps ?? 0),
      }
    : null;
  const badges = Array.isArray(record.badges) ? record.badges : [];
  await writeCachedStatsForUser(uid, stats, badges);
  return { stats, badges };
}
