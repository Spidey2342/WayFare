import type { DebatePlayerV2 } from './types';

export type StartBlockReason = 'empty_agree' | 'empty_disagree' | 'wrong_phase';

export function canStart(
  phase: string,
  players: DebatePlayerV2[],
): { ok: true } | { ok: false; reason: StartBlockReason } {
  if (phase !== 'picking') return { ok: false, reason: 'wrong_phase' };
  const debaters = players.filter((p) => p.role === 'debater');
  const agree = debaters.filter((p) => p.side === 'agree').length;
  const disagree = debaters.filter((p) => p.side === 'disagree').length;
  if (agree < 1) return { ok: false, reason: 'empty_agree' };
  if (disagree < 1) return { ok: false, reason: 'empty_disagree' };
  return { ok: true };
}

export function judgeExcludedFromDebaters(players: DebatePlayerV2[]): boolean {
  return players.every((p) => p.role !== 'judge' || p.side === null);
}
