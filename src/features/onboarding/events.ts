import { isSupabaseConfigured, requireSupabase } from '@/services/supabase';

export async function trackOnboardingEvent(userId: string, step: string, action: string) {
  if (!isSupabaseConfigured) return;
  const { error } = await requireSupabase().from('onboarding_events').insert({
    user_id: userId,
    step,
    action,
  });
  if (error) {
    console.warn('onboarding event failed', error.message);
  }
}
