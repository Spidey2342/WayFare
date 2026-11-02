import { createPassSession, topicById } from '../localSession';
import { extendDebateOnce, phaseDurationMs, transitionPhase } from '../nextPhase';

describe('nextPhase helpers', () => {
  const topic = topicById('topic-01')!;

  it('computes phase durations with extension', () => {
    let session = createPassSession(
      'x',
      topic,
      [
        { id: 'a', displayName: 'A' },
        { id: 'b', displayName: 'B' },
      ],
      'a',
    );
    session = { ...session, phase: 'debate', debateExtended: true };
    expect(phaseDurationMs(session, 'debate')).toBe(150_000);
  });

  it('extends debate timer once', () => {
    const now = Date.now();
    let session = createPassSession(
      'x',
      topic,
      [
        { id: 'a', displayName: 'A' },
        { id: 'b', displayName: 'B' },
      ],
      'a',
    );
    session = {
      ...session,
      phase: 'debate',
      phaseEndsAt: now + 10_000,
      debateExtended: false,
    };
    const extended = extendDebateOnce(session, now);
    expect(extended.debateExtended).toBe(true);
    expect(extended.phaseEndsAt).toBe(now + 40_000);
  });

  it('transitions phases with end timestamps', () => {
    const now = Date.now();
    let session = createPassSession(
      'x',
      topic,
      [
        { id: 'a', displayName: 'A' },
        { id: 'b', displayName: 'B' },
      ],
      'a',
    );
    session = transitionPhase(session, 'prep', now);
    expect(session.phase).toBe('prep');
    expect(session.phaseEndsAt).toBeGreaterThan(now);
  });
});
