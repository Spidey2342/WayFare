import type { GameProgress } from '@/features/journey/progress';

export type GuestMergeOffer = {
  xp: number;
  badgeCount: number;
};

/** Local guest progress eligible for merge_guest_progress (spec A3). */
export function guestMergeOffer(progress: GameProgress): GuestMergeOffer | null {
  const badgeCount = progress.badgesEarned?.length ?? 0;
  const xp = progress.xp ?? 0;
  if (xp <= 0 && badgeCount <= 0) return null;
  return { xp, badgeCount };
}
