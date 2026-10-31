import {
  applyLessonComplete,
  applyQuizComplete,
  defaultProgress,
  toggleBookRead,
} from '../progress';

describe('learn progress', () => {
  const now = new Date(2026, 9, 31, 12);

  test('lesson completion is idempotent and awards scripture seeker once', () => {
    const base = defaultProgress(now);
    const first = applyLessonComplete(base, 'identity-lesson-1', now);
    expect(first.completedLessons).toEqual(['identity-lesson-1']);
    expect(first.xp).toBe(15);
    expect(first.badgesEarned).toContain('scripture-seeker');
    const again = applyLessonComplete(first, 'identity-lesson-1', now);
    expect(again).toBe(first);
  });

  test('book read toggles and tracks explorer badge threshold', () => {
    let progress = defaultProgress(now);
    progress = toggleBookRead(progress, 'genesis');
    expect(progress.booksRead).toEqual(['genesis']);
    progress = toggleBookRead(progress, 'genesis');
    expect(progress.booksRead).toEqual([]);
  });

  test('quiz completion increments counter and streak date', () => {
    const next = applyQuizComplete(defaultProgress(now), now);
    expect(next.quizzesCompleted).toBe(1);
    expect(next.lastPlayedDate).toBeTruthy();
    expect(next.xp).toBe(10);
  });
});
