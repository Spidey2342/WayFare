/** Zustand persist payload for Playwright. */
export function persistFixture(version = 10) {
  return {
    state: {
      themePreference: 'light',
      onboarded: true,
      introSeen: true,
      profile: { name: '', avatarColor: '' },
      hydrated: true,
      progress: {
        xp: 0,
        streakDays: 0,
        lastPlayedDate: null,
        cardsPlayed: 0,
        actsOfService: 0,
        sessionsCompleted: 0,
        completedWeeks: [],
        badgesEarned: [],
        wordCards: 0,
        questionCards: 0,
        dareCards: 0,
        challengeCards: 0,
        testimonyCards: 0,
        weeklyCompleted: false,
        weeklyWeekKey: '2026-W44',
        lastAppliedSessionId: null,
        completedLessons: [],
        booksRead: [],
        quizzesCompleted: 0,
        debateVotesCast: 0,
        debateMvps: 0,
        debatesJudged: 0,
        lastAppliedDebateId: null,
      },
    },
    version,
  };
}
