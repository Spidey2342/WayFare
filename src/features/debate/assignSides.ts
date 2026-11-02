import type { DebatePlayer, DebateSide } from './types';

export type SideAssignMode = 'random_balanced' | 'manual';

/** Fisher–Yates shuffle using injected rng in [0, 1). */
export function shuffleIds(ids: string[], rng: () => number): string[] {
  const copy = [...ids];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

/**
 * Assign For / Against as evenly as possible (difference at most 1).
 * Requires 2–8 players with unique ids.
 */
export function assignSidesBalanced(
  players: Pick<DebatePlayer, 'id'>[],
  rng: () => number,
): Record<string, DebateSide> {
  if (players.length < 2 || players.length > 8) {
    throw new Error('Debate needs between 2 and 8 players.');
  }
  const ids = shuffleIds(
    players.map((player) => player.id),
    rng,
  );
  const forCount = Math.ceil(ids.length / 2);
  const assignment: Record<string, DebateSide> = {};
  ids.forEach((id, index) => {
    assignment[id] = index < forCount ? 'for' : 'against';
  });
  return assignment;
}

export function applySideAssignment(
  players: DebatePlayer[],
  assignment: Record<string, DebateSide>,
): DebatePlayer[] {
  return players.map((player) => ({
    ...player,
    side: assignment[player.id] ?? player.side,
  }));
}

export function validateManualSides(players: DebatePlayer[]): void {
  if (players.length < 2 || players.length > 8) {
    throw new Error('Debate needs between 2 and 8 players.');
  }
  const assigned = players.filter((player) => player.side === 'for' || player.side === 'against');
  if (assigned.length !== players.length) {
    throw new Error('Every player needs a side before debate.');
  }
  const forCount = players.filter((player) => player.side === 'for').length;
  const againstCount = players.length - forCount;
  if (forCount === 0 || againstCount === 0) {
    throw new Error('Each side needs at least one player.');
  }
  if (Math.abs(forCount - againstCount) > 1) {
    throw new Error('Sides should differ by at most one player.');
  }
}
