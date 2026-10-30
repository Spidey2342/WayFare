import { defaultPersisted, migratePersisted } from '../persist';

describe('migratePersisted', () => {
  test('returns defaults for empty or corrupt payloads', () => {
    expect(migratePersisted(null, 0)).toEqual(defaultPersisted());
    expect(migratePersisted('nope', 1)).toEqual(defaultPersisted());
    expect(migratePersisted([], 1)).toEqual(defaultPersisted());
  });

  test('keeps valid fields and drops invalid ones', () => {
    const migrated = migratePersisted(
      {
        themePreference: 'dark',
        onboarded: true,
        preferredMode: 'team',
        profile: { name: 'Ama', avatarColor: '#4ECDC4' },
        installPromptDismissed: true,
        guidelinesSeen: false,
        foundingMember: true,
        notifyInterest: false,
        extra: 'ignored',
      },
      1,
    );

    expect(migrated.themePreference).toBe('dark');
    expect(migrated.onboarded).toBe(true);
    expect(migrated.preferredMode).toBe('team');
    expect(migrated.profile).toEqual({ name: 'Ama', avatarColor: '#4ECDC4' });
    expect(migrated.foundingMember).toBe(true);
    expect(migrated.installPromptDismissed).toBe(true);
  });

  test('rejects a future schema version instead of trusting it', () => {
    const migrated = migratePersisted({ onboarded: true, themePreference: 'dark' }, 99);
    expect(migrated).toEqual(defaultPersisted());
  });

  test('falls back when a preference or mode is unknown', () => {
    const migrated = migratePersisted(
      { themePreference: 'sepia', preferredMode: 'arena', profile: { name: '   ' } },
      0,
    );
    expect(migrated.themePreference).toBe('system');
    expect(migrated.preferredMode).toBeNull();
    expect(migrated.profile.name).toBe('Kofi');
  });
});
