import { soloDisplayXp, soloXpWouldCount } from '@/features/debate/engine/soloDailyCap';

describe('U7 solo XP cap', () => {
  it('allows XP for debates 1 through 5', () => {
    for (let day = 0; day < 5; day += 1) {
      expect(soloXpWouldCount(day)).toBe(true);
    }
  });

  it('blocks counting XP from the 6th solo debate the same day', () => {
    expect(soloXpWouldCount(5)).toBe(false);
    expect(soloDisplayXp(5, 0)).toBe(0);
  });
});
