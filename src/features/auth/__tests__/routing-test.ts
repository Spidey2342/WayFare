import {
  introRedirectPath,
  isSignedOutAllowedPath,
  requiresAccountForPlayMode,
  welcomePath,
} from '@/features/auth/routing';

describe('auth routing (accounts only)', () => {
  it('allows only welcome, auth, and intro paths when signed out', () => {
    expect(isSignedOutAllowedPath('/auth/welcome')).toBe(true);
    expect(isSignedOutAllowedPath('/auth/sign-in')).toBe(true);
    expect(isSignedOutAllowedPath('/auth/sign-up')).toBe(true);
    expect(isSignedOutAllowedPath('/auth/reset-password')).toBe(true);
    expect(isSignedOutAllowedPath('/welcome')).toBe(true);
    expect(isSignedOutAllowedPath('/how-it-works')).toBe(true);
    expect(isSignedOutAllowedPath('/home')).toBe(false);
    expect(isSignedOutAllowedPath('/debate/solo')).toBe(false);
    expect(isSignedOutAllowedPath('/profile')).toBe(false);
  });

  it('uses auth welcome as the unsigned entry path', () => {
    expect(welcomePath()).toBe('/auth/welcome');
  });

  it('requires account for every play mode', () => {
    expect(requiresAccountForPlayMode('online')).toBe(true);
    expect(requiresAccountForPlayMode('solo')).toBe(true);
    expect(requiresAccountForPlayMode('pass')).toBe(true);
  });
});

describe('app intro (signed in)', () => {
  it('redirects to welcome until intro is seen', () => {
    expect(introRedirectPath('/home', false)).toBe('/welcome');
    expect(introRedirectPath('/welcome', false)).toBeNull();
    expect(introRedirectPath('/home', true)).toBeNull();
    expect(introRedirectPath('/auth/sign-in', false)).toBeNull();
  });
});
