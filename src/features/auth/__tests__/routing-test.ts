import {
  requiresAccountForPlayMode,
  requiresAuth,
  resolveAuthGateRedirect,
  tutorialRouteForStep,
} from '@/features/auth/routing';

describe('auth routing', () => {
  it('requires auth for groups routes', () => {
    expect(requiresAuth('/groups')).toBe(true);
    expect(requiresAuth('/groups/join')).toBe(true);
    expect(requiresAuth('/home')).toBe(false);
  });

  it('redirects guests away from protected routes', () => {
    expect(resolveAuthGateRedirect({ pathname: '/groups', hasSession: false })).toBe(
      '/auth/welcome',
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

describe('tutorial resume', () => {
  it('maps tutorial steps to routes', () => {
    expect(tutorialRouteForStep(0, false)).toBe('/onboarding/goal');
    expect(tutorialRouteForStep(1, false)).toBe('/onboarding/how-wayfare');
    expect(tutorialRouteForStep(2, false)).toBe('/onboarding/practice');
    expect(tutorialRouteForStep(3, false)).toBeNull();
    expect(tutorialRouteForStep(0, true)).toBeNull();
  });
});
