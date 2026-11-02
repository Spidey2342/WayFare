import {
  advanceDebateRound,
  allVotesIn,
  castDebateVote,
  createDebateSession,
  currentDebateRound,
  tallyVotes,
} from '../debateEngine';

describe('debate engine', () => {
  const statements = [
    { cardId: 'q1', prompt: 'Sunday rest matters.' },
    { cardId: 'q2', prompt: 'Worship can be loud.' },
  ];

  test('creates rounds and records votes', () => {
    const session = createDebateSession('d1', statements, ['p1', 'p2']);
    const round = currentDebateRound(session);
    expect(round?.prompt).toBe('Sunday rest matters.');
    const voted = castDebateVote(session, 'p1', 'agree');
    expect(voted.rounds[0]?.votes.p1).toBe('agree');
    expect(allVotesIn(voted.rounds[0]!)).toBe(false);
  });

  test('tallies votes and advances rounds', () => {
    let session = createDebateSession('d1', statements, ['p1', 'p2']);
    session = castDebateVote(session, 'p1', 'agree');
    session = castDebateVote(session, 'p2', 'disagree');
    const round = session.rounds[0]!;
    expect(tallyVotes(round)).toEqual({ agree: 1, disagree: 1, pending: 0 });
    expect(allVotesIn(round)).toBe(true);
    session = advanceDebateRound(session);
    expect(session.roundIndex).toBe(1);
    session = advanceDebateVoteChain(session);
    expect(session.status).toBe('complete');
  });
});

function advanceDebateVoteChain(session: ReturnType<typeof createDebateSession>) {
  let next = castDebateVote(session, 'p1', 'disagree');
  next = castDebateVote(next, 'p2', 'agree');
  return advanceDebateRound(next);
}
