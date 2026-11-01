const AUTH_REQUIRED_PREFIXES = ['/groups'] as const;

export type PlayMode = 'solo' | 'pass' | 'online';

export function requiresAuth(pathname: string): boolean {
  const path = pathname.split('?')[0] ?? pathname;
  return AUTH_REQUIRED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function requiresAccountForPlayMode(mode: PlayMode): boolean {
  return mode === 'online';
}

export function resolveAuthGateRedirect(args: {
  pathname: string;
  hasSession: boolean;
}): '/auth/welcome' | null {
  if (args.hasSession) return null;
  if (requiresAuth(args.pathname)) return '/auth/welcome';
  return null;
}

export type TutorialStep = 0 | 1 | 2 | 3;

export function tutorialRouteForStep(step: number, completed: boolean): string | null {
  if (completed) return null;
  if (step <= 0) return '/onboarding/goal';
  if (step === 1) return '/onboarding/how-wayfare';
  if (step === 2) return '/onboarding/practice';
  return null;
}

export function nextTutorialStep(current: number): number {
  return Math.min(current + 1, 3);
}

export const AUTH_RETURN_TO_KEY = 'wayfare.auth.returnTo';
