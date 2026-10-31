import { localDateKey, nextStreak, previousLocalDate } from '../calendar';
import {
  applySession,
  badges,
  completeWeekly,
  defaultProgress,
  levelForXp,
  levels,
  type SessionAward,
} from '../progress';

const award = (overrides: Partial<SessionAward> = {}): SessionAward => ({
  id: 's1',
  mode: 'pass',
  cardsPlayed: 2,
  cardTypes: ['word', 'question'],
  unity: 100,
  actsOfService: 0,
  ...overrides,
});

describe('progress', () => {
  test('ships six levels and twenty-four badges', () => {
    expect(levels).toHaveLength(6);
    expect(badges).toHaveLength(24);
    expect(new Set(badges.map((badge) => badge.id)).size).toBe(24);
  });

  test('starts a streak, keeps it the same day, and advances on the next local day', () => {
    const monday = new Date(2026, 2, 9, 23, 30);
    const first = applySession(defaultProgress(monday), award(), monday);
    expect(first.streakDays).toBe(1);
    expect(first.lastPlayedDate).toBe(localDateKey(monday));
    expect(first.xp).toBe(14);
    expect(levelForXp(first.xp).title).toBe('Seeker');

    const again = applySession(first, award({ id: 's2', cardsPlayed: 0, cardTypes: [] }), monday);
    expect(again.streakDays).toBe(1);

    const tuesday = new Date(2026, 2, 10, 0, 30);
    const next = applySession(again, award({ id: 's3' }), tuesday);
    expect(next.streakDays).toBe(2);
    expect(previousLocalDate(tuesday)).toBe(localDateKey(monday));
  });

  test('resets a streak after a missed local day, including across a daylight-saving change', () => {
    const before = new Date(2026, 2, 7, 12);
    const afterSpringForward = new Date(2026, 2, 9, 12);
    expect(nextStreak(localDateKey(before), 4, afterSpringForward)).toBe(1);
    const yesterday = new Date(2026, 2, 8, 12);
    expect(nextStreak(localDateKey(yesterday), 4, afterSpringForward)).toBe(5);
  });

  test('awards badges once and ignores a repeated session id', () => {
    const now = new Date(2026, 9, 30, 12);
    const first = applySession(
      defaultProgress(now),
      award({ cardsPlayed: 3, cardTypes: ['word', 'dare', 'dare'], unity: 100 }),
      now,
    );
    expect(first.badgesEarned).toEqual(
      expect.arrayContaining([
        'first-step',
        'hot-start',
        'team-player',
        'peacemaker',
        'circle-keeper',
      ]),
    );
    const repeated = applySession(first, award({ cardsPlayed: 3 }), now);
    expect(repeated).toBe(first);
    const encouraged = completeWeekly(first, now);
    expect(encouraged.badgesEarned).toContain('encourager');
    expect(encouraged.weeklyCompleted).toBe(true);
  });

  test('reaches disciple and records a journey week', () => {
    const now = new Date(2026, 5, 1, 12);
    const grown = applySession(
      { ...defaultProgress(now), xp: 170, sessionsCompleted: 4 },
      award({
        id: 'journey',
        mode: 'journey',
        cardsPlayed: 4,
        cardTypes: ['challenge', 'testimony', 'word', 'word'],
      }),
      now,
    );
    expect(levelForXp(grown.xp).displayTitle).toBe('Faith Disciple');
    expect(grown.completedWeeks).toEqual(['w1']);
    expect(grown.badgesEarned).toEqual(
      expect.arrayContaining([
        'kingdom-builder',
        'clash-ready',
        'testimony-bearer',
        'disciple-mark',
      ]),
    );
  });
});
