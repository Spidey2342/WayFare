export const AUTH_RETURN_TO_KEY = 'wayfare.auth.returnTo';

export type PlayMode = 'solo' | 'pass' | 'online';

const INTRO_PATHS = ['/welcome', '/how-it-works', '/choose-mode'] as const;

const SIGNED_OUT_AUTH_PATHS = [
  '/auth/welcome',
  '/auth/sign-up',
  '/auth/sign-in',
  '/auth/reset-password',
  '/auth/under-13',
] as const;

export function welcomePath(): '/auth/welcome' {
  return '/auth/welcome';
}

export function isIntroPath(pathname: string): boolean {
  const path = pathname.split('?')[0] ?? pathname;
  return INTRO_PATHS.some((intro) => path === intro || path.startsWith(`${intro}/`));
}

export function isSignedOutAllowedPath(pathname: string): boolean {
  const path = pathname.split('?')[0] ?? pathname;
  if (SIGNED_OUT_AUTH_PATHS.some((entry) => path === entry || path.startsWith(`${entry}/`))) {
    return true;
  }
  if (isIntroPath(path)) return true;
  if (path === '/auth' || path.startsWith('/auth/')) {
    return SIGNED_OUT_AUTH_PATHS.some((entry) => path === entry || path.startsWith(`${entry}/`));
  }
  if (typeof __DEV__ !== 'undefined' && __DEV__ && (path === '/dev' || path.startsWith('/dev/'))) {
    return true;
  }
  return false;
}

export function requiresAccountForPlayMode(_mode: PlayMode): boolean {
  return true;
}

export function introRedirectPath(pathname: string, introSeen: boolean): '/welcome' | null {
  if (introSeen) return null;
  const path = pathname.split('?')[0] ?? pathname;
  if (INTRO_PATHS.some((intro) => path === intro || path.startsWith(`${intro}/`))) return null;
  if (path.startsWith('/auth')) return null;
  return '/welcome';
}
