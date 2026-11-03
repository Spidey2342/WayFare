import type { Href } from 'expo-router';
import { Redirect, usePathname } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/features/auth/AuthContext';
import {
  AUTH_RETURN_TO_KEY,
  introRedirectPath,
  resolveAuthGateRedirect,
  unsignedEntryPath,
} from '@/features/auth/routing';
import { isSupabaseConfigured } from '@/services/supabase';
import { storage } from '@/services/storage';
import { useAppStore } from '@/store';

const GUEST_INTRO_PREFIXES = ['/welcome', '/how-it-works', '/choose-mode'];

function isAuthPath(pathname: string): boolean {
  return pathname === '/auth' || pathname.startsWith('/auth/');
}

function isGuestIntroPath(pathname: string): boolean {
  return GUEST_INTRO_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isDevPath(pathname: string): boolean {
  return pathname === '/dev' || pathname.startsWith('/dev/');
}

export function NavigationGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready, session, profile, isGuest } = useAuth();
  const hydrated = useAppStore((state) => state.hydrated);
  const introSeen = useAppStore((state) => state.introSeen);
  const guestBrowseAccepted = useAppStore((state) => state.guestBrowseAccepted);

  useEffect(() => {
    if (!ready || !hydrated) return;
    const gate = resolveAuthGateRedirect({ pathname, hasSession: !!session });
    if (gate) {
      void storage.setItem(AUTH_RETURN_TO_KEY, pathname);
    }
  }, [ready, hydrated, pathname, session]);

  if (!ready || !hydrated) return null;

  const authRedirect = resolveAuthGateRedirect({ pathname, hasSession: !!session });
  if (authRedirect) {
    return <Redirect href={authRedirect} />;
  }

  const needsSignIn =
    isSupabaseConfigured && !session && !guestBrowseAccepted && !isAuthPath(pathname);

  if (needsSignIn) {
    if (isGuestIntroPath(pathname) || isDevPath(pathname)) {
      return <Redirect href={unsignedEntryPath()} />;
    }
    if (!pathname.startsWith('/auth')) {
      return <Redirect href={unsignedEntryPath()} />;
    }
  }

  const inAuth = isAuthPath(pathname);

  if (session && profile && !isGuest) {
    const needsProfile =
      !profile.display_name?.trim() || !profile.avatar_key || !profile.age_confirmed;
    if (needsProfile && !inAuth) {
      return <Redirect href="/auth/profile-setup" />;
    }
  }

  if (guestBrowseAccepted) {
    const introRoute = introRedirectPath(pathname, introSeen);
    if (introRoute && !inAuth && !isGuestIntroPath(pathname) && !isDevPath(pathname)) {
      return <Redirect href={introRoute} />;
    }
  }

  return children;
}

export async function consumeAuthReturnTo(router: { replace: (href: Href) => void }) {
  const target = await storage.getItem(AUTH_RETURN_TO_KEY);
  await storage.removeItem(AUTH_RETURN_TO_KEY);
  if (target && target !== unsignedEntryPath()) {
    router.replace(target as Href);
    return;
  }
  router.replace('/home');
}
