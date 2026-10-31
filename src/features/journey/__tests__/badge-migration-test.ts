import legacyEmojiMap from '@/data/legacy-emoji-map.json';

import { sanitizeBadgesEarned } from '../badgeMigration';

describe('badge migration', () => {
  test('maps legacy emoji badge keys to stable ids', () => {
    const legacyKeys = Object.keys(legacyEmojiMap.badgeIds);
    const sample = legacyKeys.slice(0, 2);
    const migrated = sanitizeBadgesEarned(['first-step', ...sample, 'not-a-badge']);
    expect(migrated).toContain('first-step');
    for (const key of sample) {
      expect(migrated).toContain(
        legacyEmojiMap.badgeIds[key as keyof typeof legacyEmojiMap.badgeIds],
      );
    }
    expect(migrated).not.toContain('not-a-badge');
  });
});
