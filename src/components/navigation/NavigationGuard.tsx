import { Redirect, usePathname, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/features/auth/AuthContext';
import {
  AUTH_RETURN_TO_KEY,
  resolveAuthGateRedirect,
  tutorialRouteForStep,
} from '@/features/auth/routing';
import { storage } from '@/services/storage';
import { useAppStore } from '@/store';

const PUBLIC_PREFIXES = [
  '/auth',
  '/welcome',
  '/how-it-works',
  '/choose-mode',
  '/onboarding',
  '/dev',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function NavigationGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const segments = useSegments();
  const { ready, session, profile, isGuest } = useAuth();
  const hydrated = useAppStore((state) => state.hydrated);
  const localTutorialCompleted = useAppStore((state) => state.localTutorialCompleted);
  const localTutorialStep = useAppStore((state) => state.localTutorialStep);

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

  const inAuth = segments[0] === 'auth';
  const inOnboardingTutorial =
    pathname.startsWith('/onboarding/goal') ||
    pathname.startsWith('/onboarding/how-wayfare') ||
    pathname.startsWith('/onboarding/practice');

  if (session && profile && !isGuest) {
    const needsProfile =
      !profile.display_name?.trim() || !profile.avatar_key || !profile.age_confirmed;
    if (needsProfile && !inAuth) {
      return <Redirect href="/auth/profile-setup" />;
    }

    const tutorialDone = profile.tutorial_completed || localTutorialCompleted;
    const step = profile.tutorial_completed ? 3 : profile.tutorial_step;
    const tutorialRoute = tutorialRouteForStep(step, tutorialDone);
    if (tutorialRoute && !inOnboardingTutorial && !inAuth && !isPublicPath(pathname)) {
      return <Redirect href={tutorialRoute} />;
    }
  }

  if (
    isGuest &&
    !localTutorialCompleted &&
    !inOnboardingTutorial &&
    !inAuth &&
    !isPublicPath(pathname)
  ) {
    const guestTutorial = tutorialRouteForStep(localTutorialStep, false);
    if (guestTutorial) {
      return <Redirect href={guestTutorial} />;
    }
  }

  return children;
}

export async function consumeAuthReturnTo(router: { replace: (href: string) => void }) {
  const target = await storage.getItem(AUTH_RETURN_TO_KEY);
  await storage.removeItem(AUTH_RETURN_TO_KEY);
  if (target && target !== '/auth/welcome') {
    router.replace(target);
    return;
  }
  router.replace('/home');
}
