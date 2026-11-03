import { isSupabaseConfigured, requireSupabase, type ProfileRow } from '@/services/supabase';

import type { CachedBadge, CachedUserStats } from '@/features/debate/statsCache';
import { writeCachedStatsForUser } from '@/features/debate/statsCache';

export type EnsureProfileResult = {
  profile: ProfileRow;
  stats: CachedUserStats | null;
  badges: CachedBadge[];
};

function mapStats(row: Record<string, unknown> | null): CachedUserStats | null {
  if (!row) return null;
  return {
    xp: Number(row.xp ?? 0),
    streak_days: Number(row.streak_days ?? 0),
    last_active_date: row.last_active_date ? String(row.last_active_date) : null,
    solo_debates_today: Number(row.solo_debates_today ?? 0),
    solo_day: row.solo_day ? String(row.solo_day) : null,
    debates_judged: Number(row.debates_judged ?? 0),
    debate_mvps: Number(row.debate_mvps ?? 0),
  };
}

export async function rpcEnsureProfile(userId: string): Promise<EnsureProfileResult | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await requireSupabase().rpc('ensure_profile');
  if (error) throw error;
  if (!data || typeof data !== 'object') return null;
  const record = data as {
    profile?: ProfileRow;
    stats?: Record<string, unknown>;
    badges?: CachedBadge[];
  };
  if (!record.profile?.id) return null;
  const stats = mapStats(record.stats ?? null);
  const badges = Array.isArray(record.badges) ? record.badges : [];
  await writeCachedStatsForUser(userId, stats, badges);
  return { profile: record.profile, stats, badges };
}
