import { balanceSummary } from '@/features/debate/engine/balanceSummary';
import { canStart, judgeExcludedFromDebaters } from '@/features/debate/engine/canStart';
import { nextPhase } from '@/features/debate/engine/nextPhase';
import { pickTopic } from '@/features/debate/engine/pickTopic';
import { formatElapsedChip, softTimerState } from '@/features/debate/engine/softTimerState';
import { mvpMustBeDebater, scoreDebate } from '@/features/debate/engine/scoreDebate';
import type { DebatePlayerV2 } from '@/features/debate/engine/types';
import { verdictChangeWindow } from '@/features/debate/engine/verdictChangeWindow';

function player(
  id: string,
  side: 'agree' | 'disagree' | null,
  role: DebatePlayerV2['role'] = 'debater',
): DebatePlayerV2 {
  return { id, displayName: id, side, role };
}

describe('canStart', () => {
  it('requires one debater per side for up to 20 players', () => {
    const twelve: DebatePlayerV2[] = [
      player('j', null, 'judge'),
      ...Array.from({ length: 6 }, (_, i) => player(`a${i}`, 'agree')),
      ...Array.from({ length: 6 }, (_, i) => player(`d${i}`, 'disagree')),
    ];
    expect(canStart('picking', twelve).ok).toBe(true);
  });

  it('blocks 11 v 0', () => {
    const uneven = [
      player('j', null, 'judge'),
      ...Array.from({ length: 11 }, (_, i) => player(`a${i}`, 'agree')),
    ];
    expect(canStart('picking', uneven)).toEqual({ ok: false, reason: 'empty_disagree' });
  });

  it('blocks 11 v 1 split when disagree missing on wrong phase', () => {
    const split = [player('j', null, 'judge'), player('a', 'agree'), player('d', 'disagree')];
    expect(canStart('debating', split)).toEqual({ ok: false, reason: 'wrong_phase' });
  });

  it('judge has no side', () => {
    expect(
      judgeExcludedFromDebaters([
        player('j', null, 'judge'),
        player('a', 'agree'),
        player('d', 'disagree'),
      ]),
    ).toBe(true);
  });
});

describe('scoreDebate', () => {
  const roster = [
    player('j', null, 'judge'),
    player('a1', 'agree'),
    player('a2', 'agree'),
    player('d1', 'disagree'),
  ];

  it('awards win side +3 stack with participation and mvp', () => {
    const scores = scoreDebate(roster, 'agree', 'a1');
    expect(scores.a1!.total).toBe(1 + 3 + 2);
    expect(scores.d1!.total).toBe(1);
    expect(scores.j!.total).toBe(1);
  });

  it('draw gives +2 side bonus per debater', () => {
    const scores = scoreDebate(roster, 'draw', null);
    expect(scores.a1!.total).toBe(1 + 2);
    expect(scores.d1!.total).toBe(1 + 2);
  });

  it('mvp must be debater', () => {
    expect(mvpMustBeDebater(roster, 'j')).toBe(false);
    expect(mvpMustBeDebater(roster, 'a1')).toBe(true);
  });
});

describe('pickTopic', () => {
  const pool = [
    { id: 't1', text: 'A', category: 'c', difficulty: 'light' as const },
    { id: 't2', text: 'B', category: 'c', difficulty: 'light' as const },
  ];

  it('avoids repeats until pool exhausted', () => {
    const first = pickTopic(pool, []);
    expect(first.resetHistory).toBe(false);
    const second = pickTopic(pool, [first.topic!.id]);
    expect(second.topic?.id).toBe(first.topic?.id === 't1' ? 't2' : 't1');
  });
});

describe('softTimerState', () => {
  it('nudges after limit without blocking', () => {
    const start = 0;
    const state = softTimerState(3, start, 3 * 60 * 1000 + 1);
    expect(state.kind).toBe('nudge');
    expect(formatElapsedChip(760_000)).toBe('12:40');
  });
});

describe('verdictChangeWindow', () => {
  it('closes after 30 seconds', () => {
    const open = verdictChangeWindow(1000, 1000 + 10_000);
    expect(open.open).toBe(true);
    const closed = verdictChangeWindow(1000, 1000 + 31_000);
    expect(closed.open).toBe(false);
  });
});

describe('nextPhase', () => {
  it('walks v2 phases', () => {
    expect(nextPhase('lobby')).toBe('topic');
    expect(nextPhase('verdict')).toBe('results');
  });
});

describe('balanceSummary', () => {
  it('summarizes 6 v 6', () => {
    const players = [
      player('j', null, 'judge'),
      ...Array.from({ length: 6 }, (_, i) => player(`a${i}`, 'agree')),
      ...Array.from({ length: 6 }, (_, i) => player(`d${i}`, 'disagree')),
    ];
    const summary = balanceSummary(players);
    expect(summary.agree).toHaveLength(6);
    expect(summary.disagree).toHaveLength(6);
  });
});
