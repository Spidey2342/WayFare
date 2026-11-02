import type { DebatePhaseV2 } from './types';

const ORDER: DebatePhaseV2[] = ['lobby', 'topic', 'picking', 'debating', 'verdict', 'results'];

export function nextPhase(current: DebatePhaseV2): DebatePhaseV2 | null {
  const index = ORDER.indexOf(current);
  if (index < 0 || index >= ORDER.length - 1) return null;
  return ORDER[index + 1] ?? null;
}
