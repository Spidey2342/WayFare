import {
  introRedirectPath,
  requiresAccountForPlayMode,
  requiresAuth,
  resolveAuthGateRedirect,
} from '@/features/auth/routing';

describe('auth routing', () => {
  it('requires auth for groups routes', () => {
    expect(requiresAuth('/groups')).toBe(true);
    expect(requiresAuth('/groups/join')).toBe(true);
    expect(requiresAuth('/home')).toBe(false);
    expect(requiresAuth('/debate/solo')).toBe(false);
    expect(requiresAuth('/debate/pass/setup')).toBe(false);
    expect(requiresAuth('/debate/abc-123')).toBe(true);
  });

  it('redirects guests away from protected routes', () => {
    expect(resolveAuthGateRedirect({ pathname: '/groups', hasSession: false })).toBe(
      '/auth/sign-in',
    );
    expect(resolveAuthGateRedirect({ pathname: '/groups', hasSession: true })).toBeNull();
    expect(resolveAuthGateRedirect({ pathname: '/home', hasSession: false })).toBeNull();
  });

  it('requires account for online play only', () => {
    expect(requiresAccountForPlayMode('online')).toBe(true);
    expect(requiresAccountForPlayMode('solo')).toBe(false);
    expect(requiresAccountForPlayMode('pass')).toBe(false);
  });
});

describe('app intro', () => {
  it('redirects to welcome until intro is seen', () => {
    expect(introRedirectPath('/home', false)).toBe('/welcome');
    expect(introRedirectPath('/welcome', false)).toBeNull();
    expect(introRedirectPath('/how-it-works', false)).toBeNull();
    expect(introRedirectPath('/choose-mode', false)).toBeNull();
    expect(introRedirectPath('/home', true)).toBeNull();
    expect(introRedirectPath('/auth/sign-in', false)).toBeNull();
  });
});
