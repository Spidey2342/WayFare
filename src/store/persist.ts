import type { ThemePreference } from '@/theme';

export interface Profile {
  name: string;
  avatarColor: string;
}

export interface PersistedApp {
  themePreference: ThemePreference;
  onboarded: boolean;
  preferredMode: 'pass' | 'team' | null;
  profile: Profile;
  installPromptDismissed: boolean;
  guidelinesSeen: boolean;
  foundingMember: boolean;
  notifyInterest: boolean;
}

export const STORE_VERSION = 1;

export function defaultPersisted(): PersistedApp {
  return {
    themePreference: 'system',
    onboarded: false,
    preferredMode: null,
    profile: {
      name: 'Kofi',
      avatarColor: '#FFB800',
    },
    installPromptDismissed: false,
    guidelinesSeen: false,
    foundingMember: false,
    notifyInterest: false,
  };
}

function isPreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

function readProfile(value: unknown, fallback: Profile): Profile {
  if (!value || typeof value !== 'object') return fallback;
  const record = value as Record<string, unknown>;
  return {
    name:
      typeof record.name === 'string' && record.name.trim().length > 0
        ? record.name
        : fallback.name,
    avatarColor: typeof record.avatarColor === 'string' ? record.avatarColor : fallback.avatarColor,
  };
}

export function migratePersisted(persisted: unknown, fromVersion: number): PersistedApp {
  const base = defaultPersisted();
  if (!persisted || typeof persisted !== 'object') return base;

  const record = persisted as Record<string, unknown>;
  if (fromVersion > STORE_VERSION) return base;

  return {
    ...base,
    themePreference: isPreference(record.themePreference)
      ? record.themePreference
      : base.themePreference,
    onboarded: record.onboarded === true,
    preferredMode:
      record.preferredMode === 'pass' || record.preferredMode === 'team'
        ? record.preferredMode
        : null,
    profile: readProfile(record.profile, base.profile),
    installPromptDismissed: record.installPromptDismissed === true,
    guidelinesSeen: record.guidelinesSeen === true,
    foundingMember: record.foundingMember === true,
    notifyInterest: record.notifyInterest === true,
  };
}
