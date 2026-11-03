import { requireSupabase, type ProfileRow } from '@/services/supabase';

export type ProfileSetupPatch = Pick<
  ProfileRow,
  'display_name' | 'avatar_key' | 'favorite_verse' | 'age_confirmed'
>;

export async function saveProfilePatch(
  userId: string,
  patch: Partial<ProfileSetupPatch>,
  setProfileLocal: (next: Partial<ProfileRow>) => void,
): Promise<void> {
  const { error } = await requireSupabase().from('profiles').update(patch).eq('id', userId);
  if (error) throw error;
  setProfileLocal(patch);
}
