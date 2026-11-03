import { Redirect } from 'expo-router';

import { useAuth } from '@/features/auth/AuthContext';
import { unsignedEntryPath } from '@/features/auth/routing';
import { isSupabaseConfigured } from '@/services/supabase';
import { useAppStore } from '@/store';

export default function Index() {
  const hydrated = useAppStore((state) => state.hydrated);
  const introSeen = useAppStore((state) => state.introSeen);
  const guestBrowseAccepted = useAppStore((state) => state.guestBrowseAccepted);
  const { ready, session } = useAuth();

  if (!hydrated || !ready) return null;

  if (session) {
    return <Redirect href="/home" />;
  }

  if (!isSupabaseConfigured || guestBrowseAccepted) {
    return <Redirect href={introSeen ? '/home' : '/welcome'} />;
  }

  return <Redirect href={unsignedEntryPath()} />;
}
