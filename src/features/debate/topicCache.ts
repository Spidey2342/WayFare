import AsyncStorage from '@react-native-async-storage/async-storage';

import bundledTopics from '@/data/debate-topics.json';
import { isSupabaseConfigured, requireSupabase } from '@/services/supabase';
import type { DebateTopic } from '@/features/debate/types';

const CACHE_KEY = 'wayfare:debate-topics:v1';
const SYNC_KEY = 'wayfare:debate-topics:synced-at';

export async function readCachedTopics(): Promise<DebateTopic[]> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw) as DebateTopic[];
  } catch {
    /* use fallback */
  }
  return bundledTopics as DebateTopic[];
}

export async function syncTopicsSince(): Promise<DebateTopic[]> {
  const base = await readCachedTopics();
  if (!isSupabaseConfigured) return base;
  const since = (await AsyncStorage.getItem(SYNC_KEY)) ?? '1970-01-01T00:00:00.000Z';
  const { data, error } = await requireSupabase().rpc('get_topics_since', { p_since: since });
  if (error || !data || !Array.isArray(data) || data.length === 0) return base;
  const byId = new Map(base.map((topic) => [topic.id, topic]));
  for (const row of data as Record<string, unknown>[]) {
    byId.set(String(row.id), {
      id: String(row.id),
      text: String(row.text),
      category: String(row.category ?? 'General'),
      difficulty: (row.difficulty as DebateTopic['difficulty']) ?? 'medium',
    });
  }
  const merged = [...byId.values()];
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(merged));
  await AsyncStorage.setItem(SYNC_KEY, new Date().toISOString());
  return merged;
}
