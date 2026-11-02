export const AUTH_RETURN_TO_KEY = 'wayfare.auth.returnTo';

const AUTH_REQUIRED_PREFIXES = ['/groups'] as const;

export type PlayMode = 'solo' | 'pass' | 'online';

const INTRO_PATHS = ['/welcome', '/how-it-works', '/choose-mode'] as const;

export function requiresAuth(pathname: string): boolean {
  const path = pathname.split('?')[0] ?? pathname;
  if (path === '/debate/solo') return false;
  if (path.startsWith('/debate/pass')) return false;
  if (path === '/debate' || path === '/debate/') return false;
  if (path.startsWith('/debate/')) return true;
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

export function introRedirectPath(pathname: string, introSeen: boolean): '/welcome' | null {
  if (introSeen) return null;
  const path = pathname.split('?')[0] ?? pathname;
  if (INTRO_PATHS.some((intro) => path === intro || path.startsWith(`${intro}/`))) return null;
  if (path.startsWith('/auth')) return null;
  return '/welcome';
}
