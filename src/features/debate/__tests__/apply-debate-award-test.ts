import { applyDebateAward } from '../applyDebateAward';
import { defaultProgress } from '@/features/journey/progress';

describe('applyDebateAward', () => {
  it('awards xp once and tracks debate stats', () => {
    const first = applyDebateAward(defaultProgress(), {
      sessionId: 'd1',
      xpGained: 5,
      votedThisRound: true,
      wasMvp: true,
    });
    expect(first.xp).toBe(5);
    expect(first.debateVotesCast).toBe(1);
    expect(first.debateMvps).toBe(1);
    expect(first.badgesEarned).toContain('silver-tongue');
    const again = applyDebateAward(first, {
      sessionId: 'd1',
      xpGained: 5,
      votedThisRound: true,
      wasMvp: true,
    });
    expect(again.xp).toBe(5);
  });
});
