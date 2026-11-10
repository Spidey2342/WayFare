import type { Href } from 'expo-router';
import { Redirect, usePathname } from 'expo-router';
import { useEffect } from 'react';

import { AuthSessionSplash } from '@/components/auth/AuthSessionSplash';
import { useAuth } from '@/features/auth/AuthContext';
import {
  AUTH_RETURN_TO_KEY,
  introRedirectPath,
  isSignedOutAllowedPath,
  welcomePath,
} from '@/features/auth/routing';
import { isSupabaseConfigured } from '@/services/supabase';
import { storage } from '@/services/storage';
import { useAppStore } from '@/store';

function needsProfileSetup(
  profile: {
    display_name: string | null;
    avatar_key: string | null;
    age_confirmed: boolean;
  } | null,
): boolean {
  if (!profile) return true;
  return !profile.display_name?.trim() || !profile.avatar_key || !profile.age_confirmed;
}

export function NavigationGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready, sessionChecking, session, profile } = useAuth();
  const hydrated = useAppStore((state) => state.hydrated);
  const introSeen = useAppStore((state) => state.introSeen);

  useEffect(() => {
    if (!ready || !hydrated || !isSupabaseConfigured) return;
    if (session) return;
    if (isSignedOutAllowedPath(pathname)) return;
    void storage.setItem(AUTH_RETURN_TO_KEY, pathname);
  }, [ready, hydrated, pathname, session]);

  if (!hydrated || !ready || sessionChecking) {
    return <AuthSessionSplash />;
  }

  if (isSupabaseConfigured && !session) {
    if (!isSignedOutAllowedPath(pathname)) {
      return <Redirect href={welcomePath()} />;
    }
    return children;
  }

  if (session && needsProfileSetup(profile)) {
    const onSetup = pathname.startsWith('/auth/profile-setup');
    if (!onSetup) {
      return <Redirect href="/auth/profile-setup" />;
    }
  }

  if (session && profile && !needsProfileSetup(profile)) {
    const introRoute = introRedirectPath(pathname, introSeen);
    if (introRoute && !pathname.startsWith('/auth')) {
      return <Redirect href={introRoute} />;
    }
  }

  return children;
}

export async function consumeAuthReturnTo(router: { replace: (href: Href) => void }) {
  const target = await storage.getItem(AUTH_RETURN_TO_KEY);
  await storage.removeItem(AUTH_RETURN_TO_KEY);
  if (target && target !== welcomePath() && !target.startsWith('/auth/welcome')) {
    router.replace(target as Href);
    return;
  }
  router.replace('/home');
}
