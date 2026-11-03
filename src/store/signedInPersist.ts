import type { GameProgress } from '@/features/journey/progress';

/** Set from AuthProvider — controls what we write to zustand persist. */
let signedInUserId: string | null = null;

export function setSignedInPersistUser(userId: string | null) {
  signedInUserId = userId;
}

export function isSignedInPersist(): boolean {
  return signedInUserId !== null;
}

/** Section 14: do not persist server-owned fields for signed-in users. */
export function stripServerOwnedForPersist(progress: GameProgress): GameProgress {
  if (!signedInUserId) return progress;
  return {
    ...progress,
    xp: 0,
    streakDays: 0,
    badgesEarned: [],
    debateMvps: 0,
    debatesJudged: 0,
    debateVotesCast: 0,
  };
}
