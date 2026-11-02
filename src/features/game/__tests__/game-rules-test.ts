import { gameRules } from '@/data/gameRules';
import { defaultPersisted, migratePersisted } from '@/store/persist';

describe('game rules copy', () => {
  it('uses verbatim debate and card titles', () => {
    expect(gameRules.debate.title).toBe('How Debate Works');
    expect(gameRules.debate.rows[0]?.title).toBe('A topic appears.');
    expect(gameRules['card-game'].title).toBe('How to Play');
    expect(gameRules['card-game'].rows[2]?.title).toBe('Skip once.');
  });
});

describe('seenRules persistence', () => {
  it('migrates introSeen from legacy tutorial flags', () => {
    const migrated = migratePersisted(
      { onboarded: true, localTutorialCompleted: true, progress: defaultPersisted().progress },
      6,
    );
    expect(migrated.introSeen).toBe(true);
  });

  it('keeps introSeen once set', () => {
    const base = defaultPersisted();
    const migrated = migratePersisted({ ...base, introSeen: true }, 7);
    expect(migrated.introSeen).toBe(true);
  });

  it('defaults seenRules to empty object', () => {
    expect(defaultPersisted().seenRules).toEqual({});
  });
});
