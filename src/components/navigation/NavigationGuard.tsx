import type { Href } from 'expo-router';
import { Redirect, usePathname } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/features/auth/AuthContext';
import {
  AUTH_RETURN_TO_KEY,
  introRedirectPath,
  resolveAuthGateRedirect,
} from '@/features/auth/routing';
import { storage } from '@/services/storage';
import { useAppStore } from '@/store';

const PUBLIC_PREFIXES = ['/auth', '/welcome', '/how-it-works', '/choose-mode', '/dev'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function NavigationGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready, session, profile, isGuest } = useAuth();
  const hydrated = useAppStore((state) => state.hydrated);
  const introSeen = useAppStore((state) => state.introSeen);

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

  const inAuth = pathname.startsWith('/auth');

  if (session && profile && !isGuest) {
    const needsProfile =
      !profile.display_name?.trim() || !profile.avatar_key || !profile.age_confirmed;
    if (needsProfile && !inAuth) {
      return <Redirect href="/auth/profile-setup" />;
    }
  }

  const introRoute = introRedirectPath(pathname, introSeen);
  if (introRoute && !inAuth && !isPublicPath(pathname)) {
    return <Redirect href={introRoute} />;
  }

  if (isGuest && !introSeen && !inAuth && !isPublicPath(pathname)) {
    return <Redirect href="/welcome" />;
  }

  return children;
}

export async function consumeAuthReturnTo(router: { replace: (href: Href) => void }) {
  const target = await storage.getItem(AUTH_RETURN_TO_KEY);
  await storage.removeItem(AUTH_RETURN_TO_KEY);
  if (target && target !== '/auth/welcome') {
    router.replace(target as Href);
    return;
  }
  router.replace('/home');
}
