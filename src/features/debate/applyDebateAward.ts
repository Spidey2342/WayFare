import { localDateKey, nextStreak } from '@/features/journey/calendar';
import badgesData from '@/data/badges.json';
import type { GameProgress } from '@/features/journey/progress';

import type { PlayerScoreLine } from './types';

function ruleMetDebate(
  rule: string,
  progress: GameProgress,
  votedThisRound: boolean,
  wasMvp: boolean,
  wasJudge: boolean,
): boolean {
  const [kind, amountRaw] = rule.split(':');
  const amount = Number(amountRaw);
  if (kind === 'debateMvp') return progress.debateMvps >= amount || wasMvp;
  if (kind === 'debateJudge')
    return progress.debatesJudged >= amount || (wasJudge && progress.debatesJudged + 1 >= amount);
  if (kind === 'debateVotes')
    return (
      progress.debateVotesCast >= amount ||
      (votedThisRound && progress.debateVotesCast + 1 >= amount)
    );
  return false;
}

function withDebateBadges(
  progress: GameProgress,
  votedThisRound: boolean,
  wasMvp: boolean,
  wasJudge: boolean,
): GameProgress {
  const earned = new Set(progress.badgesEarned);
  for (const badge of badgesData) {
    if (
      badge.rule.startsWith('debate') &&
      ruleMetDebate(badge.rule, progress, votedThisRound, wasMvp, wasJudge)
    ) {
      earned.add(badge.id);
    }
  }
  return { ...progress, badgesEarned: [...earned] };
}

export function applyDebateAward(
  progress: GameProgress,
  args: {
    sessionId: string;
    xpGained: number;
    votedThisRound: boolean;
    wasMvp: boolean;
    wasJudge?: boolean;
    playerScore?: PlayerScoreLine;
  },
  now = new Date(),
): GameProgress {
  if (progress.lastAppliedDebateId === args.sessionId) return progress;
  const next: GameProgress = {
    ...progress,
    xp: progress.xp + args.xpGained,
    streakDays: nextStreak(progress.lastPlayedDate, progress.streakDays, now),
    lastPlayedDate: localDateKey(now),
    sessionsCompleted: progress.sessionsCompleted + 1,
    debateVotesCast: progress.debateVotesCast + (args.votedThisRound ? 1 : 0),
    debateMvps: progress.debateMvps + (args.wasMvp ? 1 : 0),
    debatesJudged: progress.debatesJudged + (args.wasJudge ? 1 : 0),
    lastAppliedDebateId: args.sessionId,
  };
  return withDebateBadges(next, args.votedThisRound, args.wasMvp, args.wasJudge ?? false);
}
