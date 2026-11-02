import { assignSidesBalanced, validateManualSides } from '../assignSides';
import { computeResults } from '../computeResults';
import {
  createPassSession,
  finalizeLocalSession,
  hostEndDebate,
  skipPrep,
  startDebate,
  startPrep,
  startVoting,
  submitPassVote,
  tapReadyToVote,
  topicById,
} from '../localSession';
import { debateEarlyEndAllowed } from '../nextPhase';
import { scorePlayers } from '../scorePlayers';
import { allVotesSubmitted, playerVoteTotals, validateVote } from '../tallyVotes';
import type { DebatePlayer } from '../types';

const rng = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

describe('assignSidesBalanced', () => {
  it('balances 2 to 8 players within one', () => {
    for (let count = 2; count <= 8; count += 1) {
      const players = Array.from({ length: count }, (_, index) => ({ id: `p${index}` }));
      const sides = assignSidesBalanced(players, rng(count));
      const forCount = Object.values(sides).filter((side) => side === 'for').length;
      expect(Math.abs(forCount - (count - forCount))).toBeLessThanOrEqual(1);
      expect(forCount).toBeGreaterThan(0);
    }
  });

  it('rejects invalid counts', () => {
    expect(() => assignSidesBalanced([{ id: 'a' }], rng(1))).toThrow();
    expect(() =>
      assignSidesBalanced(
        Array.from({ length: 9 }, (_, i) => ({ id: `p${i}` })),
        rng(1),
      ),
    ).toThrow();
  });
});

describe('votes and results', () => {
  const players: DebatePlayer[] = [
    { id: 'a', displayName: 'A', side: 'for' },
    { id: 'b', displayName: 'B', side: 'for' },
    { id: 'c', displayName: 'C', side: 'against' },
  ];

  it('blocks self votes', () => {
    expect(() => validateVote('a', 'a', ['a', 'b'])).toThrow();
  });

  it('computes side winner and mvp ties', () => {
    const votes = { a: 'b', b: 'c', c: 'b' };
    const results = computeResults(players, votes);
    expect(results.sideTotals.for).toBeGreaterThan(results.sideTotals.against);
    expect(results.winningSides).toEqual(['for']);
    expect(results.mvpIds).toContain('b');
  });

  it('handles side tie', () => {
    const duo: DebatePlayer[] = [
      { id: 'a', displayName: 'A', side: 'for' },
      { id: 'b', displayName: 'B', side: 'against' },
    ];
    const tiedVotes = { a: 'b', b: 'a' };
    const results = computeResults(duo, tiedVotes);
    expect(results.sideTie).toBe(true);
    expect(results.winningSides.sort()).toEqual(['against', 'for']);
  });

  it('scores participation, side win, and mvp', () => {
    const votes = { a: 'b', b: 'c', c: 'b' };
    const results = computeResults(players, votes);
    const scores = scorePlayers(players, results);
    expect(scores.b?.total).toBeGreaterThanOrEqual(4);
    expect(scores.a?.participation).toBe(1);
  });
});

describe('phase transitions and early end', () => {
  const topic = topicById('topic-01')!;

  it('ends debate when all ready', () => {
    let session = createPassSession(
      's1',
      topic,
      [
        { id: 'p1', displayName: 'A' },
        { id: 'p2', displayName: 'B' },
      ],
      'p1',
    );
    const now = Date.now();
    session = startPrep(session, now);
    session = skipPrep(session, now);
    session = startDebate(session, now);
    session = tapReadyToVote(session, 'p1');
    expect(session.phase).toBe('debate');
    session = tapReadyToVote(session, 'p2');
    expect(session.phase).toBe('voting');
  });

  it('allows host end debate', () => {
    let session = createPassSession(
      's2',
      topic,
      [
        { id: 'p1', displayName: 'A' },
        { id: 'p2', displayName: 'B' },
      ],
      'p1',
    );
    session = startDebate(startPrep(session, 0), 0);
    session = hostEndDebate(session);
    expect(session.phase).toBe('voting');
  });

  it('runs pass voting to results', () => {
    let session = createPassSession(
      's3',
      topic,
      [
        { id: 'p1', displayName: 'A' },
        { id: 'p2', displayName: 'B' },
      ],
      'p1',
    );
    session = startVoting(
      {
        ...session,
        players: [
          { id: 'p1', displayName: 'A', side: 'for' },
          { id: 'p2', displayName: 'B', side: 'against' },
        ],
      },
      0,
    );
    session = submitPassVote(session, 'p1', 'p2');
    session = submitPassVote(session, 'p2', 'p1');
    expect(session.phase).toBe('results');
    expect(session.results).toBeTruthy();
  });

  it('detects timed early end', () => {
    let session = createPassSession(
      's4',
      topic,
      [
        { id: 'p1', displayName: 'A' },
        { id: 'p2', displayName: 'B' },
      ],
      'p1',
    );
    session = startDebate(startPrep(session, 0), 0);
    session = { ...session, phaseEndsAt: Date.now() - 1 };
    expect(debateEarlyEndAllowed(session)).toBe(true);
  });
});

describe('manual sides validation', () => {
  it('requires balanced sides', () => {
    expect(() =>
      validateManualSides([
        { id: 'a', displayName: 'A', side: 'for' },
        { id: 'b', displayName: 'B', side: 'for' },
        { id: 'c', displayName: 'C', side: 'for' },
      ]),
    ).toThrow();
  });
});

describe('all votes submitted', () => {
  it('tracks pending votes', () => {
    const players: DebatePlayer[] = [
      { id: 'a', displayName: 'A', side: 'for' },
      { id: 'b', displayName: 'B', side: 'against' },
    ];
    expect(allVotesSubmitted(players, { a: 'b', b: null })).toBe(false);
    expect(allVotesSubmitted(players, { a: 'b', b: 'a' })).toBe(true);
    expect(playerVoteTotals(players, { a: 'b', b: 'a' }).a).toBe(1);
  });
});

describe('finalize local session', () => {
  it('writes scores', () => {
    const topic = topicById('topic-01')!;
    let session = createPassSession(
      's5',
      topic,
      [
        { id: 'p1', displayName: 'A' },
        { id: 'p2', displayName: 'B' },
      ],
      'p1',
    );
    session = finalizeLocalSession({
      ...session,
      phase: 'voting',
      votes: { p1: 'p2', p2: 'p1' },
      players: [
        { id: 'p1', displayName: 'A', side: 'for' },
        { id: 'p2', displayName: 'B', side: 'against' },
      ],
    });
    expect(session.scores.p1?.total).toBeGreaterThan(0);
  });
});
