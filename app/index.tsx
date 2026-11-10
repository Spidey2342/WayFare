import { Redirect } from 'expo-router';

import { useAuth } from '@/features/auth/AuthContext';
import { welcomePath } from '@/features/auth/routing';
import { useAppStore } from '@/store';

export default function Index() {
  const hydrated = useAppStore((state) => state.hydrated);
  const { ready, sessionChecking, session } = useAuth();

  if (!hydrated || !ready || sessionChecking) {
    return null;
  }

  if (session) {
    return <Redirect href="/home" />;
  }

  return <Redirect href={welcomePath()} />;
}
