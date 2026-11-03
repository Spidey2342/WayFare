import { guestMergeOffer } from '@/features/auth/guestMergeOffer';
import { defaultProgress } from '@/features/journey/progress';

/** S-6: guest merge eligibility is detected once from local progress (UI + RPC elsewhere). */
describe('S-6 guest merge offer', () => {
  it('offers merge when guest has XP', () => {
    const progress = { ...defaultProgress(), xp: 12, badgesEarned: ['first-step'] };
    const offer = guestMergeOffer(progress);
    expect(offer).not.toBeNull();
    expect(offer?.xp).toBe(12);
  });

  it('skips merge offer when guest has no progress', () => {
    expect(guestMergeOffer(defaultProgress())).toBeNull();
  });
});
