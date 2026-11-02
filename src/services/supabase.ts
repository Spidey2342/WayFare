import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { storage } from '@/services/storage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

export const isSupabaseConfigured = url.length > 0 && anonKey.length > 0;

/** Dev-only: confirms client config without logging secrets. */
export function logSupabaseDevStatus() {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  if (!isSupabaseConfigured) {
    console.warn(
      '[Wayfare] Supabase not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env, then restart Metro.',
    );
    return;
  }
  try {
    const host = new URL(url).host;
    console.info(`[Wayfare] Supabase client configured (host: ${host}).`);
  } catch {
    console.info('[Wayfare] Supabase client configured.');
  }
}

export const googleAuthEnabled =
  process.env.EXPO_PUBLIC_GOOGLE_AUTH_ENABLED === 'true' && isSupabaseConfigured;

const authStorage = {
  getItem: (key: string) => storage.getItem(`supabase:${key}`),
  setItem: (key: string, value: string) => storage.setItem(`supabase:${key}`, value),
  removeItem: (key: string) => storage.removeItem(`supabase:${key}`),
};

function createSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  return createClient(url, anonKey, {
    auth: {
      storage: authStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  });
}

export const supabase = createSupabaseClient();

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and anon key to .env',
    );
  }
  return supabase;
}

export type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_key: string | null;
  bio: string | null;
  favorite_verse: string | null;
  age_confirmed: boolean;
  tutorial_completed: boolean;
  tutorial_step: number;
  goal: string | null;
  xp: number;
  created_at: string;
};

export type GroupRow = {
  id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  is_private: boolean;
  join_code: string;
  owner_id: string;
  created_at: string;
  archived_at?: string | null;
  name_normalized?: string;
  last_activity_at?: string;
};

export type GroupMemberRow = {
  group_id: string;
  user_id: string;
  role: 'leader' | 'member';
  joined_at: string;
};
