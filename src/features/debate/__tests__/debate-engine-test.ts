import { assignSidesBalanced, validateManualSides } from '../assignSides';
import { computeResults } from '../computeResults';
import {
  beginPassDebateFromReady,
  confirmPassHandoff,
  confirmPassTopic,
  createPassSession,
  finalizeLocalSession,
  hostEndDebate,
  pickPassSide,
  publishPassVerdict,
  startDebate,
  startPrep,
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
      const forCount = Object.values(sides).filter((side) => side === 'agree').length;
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
    { id: 'a', displayName: 'A', side: 'agree' },
    { id: 'b', displayName: 'B', side: 'agree' },
    { id: 'c', displayName: 'C', side: 'disagree' },
  ];

  it('blocks self votes', () => {
    expect(() => validateVote('a', 'a', ['a', 'b'])).toThrow();
  });

  it('computes side winner and mvp ties', () => {
    const votes = { a: 'b', b: 'c', c: 'b' };
    const results = computeResults(players, votes);
    expect(results.sideTotals.agree).toBeGreaterThan(results.sideTotals.disagree);
    expect(results.winningSides).toEqual(['agree']);
    expect(results.mvpIds).toContain('b');
  });

  it('handles side tie', () => {
    const duo: DebatePlayer[] = [
      { id: 'a', displayName: 'A', side: 'agree' },
      { id: 'b', displayName: 'B', side: 'disagree' },
    ];
    const tiedVotes = { a: 'b', b: 'a' };
    const results = computeResults(duo, tiedVotes);
    expect(results.sideTie).toBe(true);
    expect(results.winningSides.sort()).toEqual(['agree', 'disagree']);
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

  it('passes the phone so each debater picks a side', () => {
    let session = createPassSession(
      's1',
      topic,
      [
        { id: 'p1', displayName: 'Judge' },
        { id: 'p2', displayName: 'Ama' },
        { id: 'p3', displayName: 'Sam' },
      ],
      'p1',
    );
    session = confirmPassTopic({ ...session, phase: 'picking' });
    session = confirmPassHandoff(session);
    session = pickPassSide(session, 'p2', 'agree');
    session = confirmPassHandoff(session);
    session = pickPassSide(session, 'p3', 'disagree');
    expect(session.pass?.allSidesPicked).toBe(true);
    session = beginPassDebateFromReady(session, 0);
    expect(session.phase).toBe('debate');
  });

  it('allows judge to end debate into verdict (not peer voting)', () => {
    let session = createPassSession(
      's2',
      topic,
      [
        { id: 'p1', displayName: 'Judge' },
        { id: 'p2', displayName: 'A' },
        { id: 'p3', displayName: 'B' },
      ],
      'p1',
    );
    session = {
      ...session,
      phase: 'debate',
      players: [
        { id: 'p1', displayName: 'Judge', side: null },
        { id: 'p2', displayName: 'A', side: 'agree' },
        { id: 'p3', displayName: 'B', side: 'disagree' },
      ],
    };
    session = hostEndDebate(session, 0);
    expect(session.phase).toBe('verdict');
  });

  it('publishes judge verdict to results', () => {
    let session = createPassSession(
      's3',
      topic,
      [
        { id: 'p1', displayName: 'Judge' },
        { id: 'p2', displayName: 'A' },
        { id: 'p3', displayName: 'B' },
      ],
      'p1',
    );
    session = {
      ...session,
      phase: 'verdict',
      players: [
        { id: 'p1', displayName: 'Judge', side: null },
        { id: 'p2', displayName: 'A', side: 'agree' },
        { id: 'p3', displayName: 'B', side: 'disagree' },
      ],
    };
    session = publishPassVerdict(session, 'agree', 'p2');
    expect(session.phase).toBe('results');
    expect(session.results?.winningSides).toEqual(['agree']);
    expect(session.scores.p2?.total).toBeGreaterThan(0);
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
        { id: 'a', displayName: 'A', side: 'agree' },
        { id: 'b', displayName: 'B', side: 'agree' },
        { id: 'c', displayName: 'C', side: 'agree' },
      ]),
    ).toThrow();
  });
});

describe('all votes submitted', () => {
  it('tracks pending votes', () => {
    const players: DebatePlayer[] = [
      { id: 'a', displayName: 'A', side: 'agree' },
      { id: 'b', displayName: 'B', side: 'disagree' },
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
        { id: 'p1', displayName: 'A', side: 'agree' },
        { id: 'p2', displayName: 'B', side: 'disagree' },
      ],
    });
    expect(session.scores.p1?.total).toBeGreaterThan(0);
  });
});
