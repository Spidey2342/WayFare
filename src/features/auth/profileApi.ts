import { isSupabaseConfigured, requireSupabase, type ProfileRow } from '@/services/supabase';

export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await requireSupabase()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as ProfileRow | null;
}

export async function upsertProfileFields(userId: string, patch: Partial<ProfileRow>) {
  if (!isSupabaseConfigured) return;
  const { error } = await requireSupabase().from('profiles').update(patch).eq('id', userId);
  if (error) throw error;
}
