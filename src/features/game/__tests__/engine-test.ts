import {
  canSkip,
  completeCard,
  createSession,
  currentCard,
  currentPlayer,
  drawCard,
  drawPreferred,
  recordBless,
  rollDice,
  skipCard,
  unityPercent,
} from '../engine';
import { mulberry32, pickIndex } from '../rng';
import type { EngineCard, SessionConfig } from '../types';

const cards: EngineCard[] = [
  { id: 'q1', deckId: 'identity', type: 'question', prompt: 'Q1', points: 1 },
  { id: 'd1', deckId: 'identity', type: 'dare', prompt: 'D1', points: 2 },
  { id: 'c1', deckId: 'identity', type: 'challenge', prompt: 'C1', points: 3 },
  { id: 'w1', deckId: 'identity', type: 'word', prompt: 'W1', points: 2 },
  { id: 't1', deckId: 'identity', type: 'testimony', prompt: 'T1', points: 1 },
  { id: 'q2', deckId: 'identity', type: 'question', prompt: 'Q2', points: 1 },
];

function config(overrides: Partial<SessionConfig> = {}): SessionConfig {
  return {
    id: 'session-1',
    mode: 'team',
    players: [
      { id: 'p1', name: 'Player 1', teamId: 'a' },
      { id: 'p2', name: 'Ama', teamId: 'b' },
    ],
    teams: [
      { id: 'a', name: 'Team A', playerIds: ['p1'] },
      { id: 'b', name: 'Ama team', playerIds: ['p2'] },
    ],
    cards,
    roundLengthMinutes: 10,
    now: '2026-10-30T12:00:00.000Z',
    ...overrides,
  };
}

describe('game engine', () => {
  test('shuffles the same way for a seed and refuses duplicate names', () => {
    const first = createSession(config(), mulberry32(7));
    const second = createSession(config(), mulberry32(7));
    expect(first.drawPile).toEqual(second.drawPile);
    expect(first.roundsTotal).toBe(2);
    expect(() =>
      createSession(
        config({ players: [first.players[0]!, { id: 'p3', name: 'Player 1' }] }),
        mulberry32(1),
      ),
    ).toThrow('unique');
  });

  test('does not repeat a drawn card until the pile is rebuilt', () => {
    let session = createSession(config({ roundLengthMinutes: 30 }), mulberry32(3));
    const seen = new Set<string>();
    for (let turn = 0; turn < cards.length; turn += 1) {
      session = drawCard(session, mulberry32(turn + 1));
      const id = session.currentCardId;
      expect(id).toBeTruthy();
      expect(seen.has(id!)).toBe(false);
      seen.add(id!);
      session = completeCard(session, { kind: 'standard' });
    }
    expect(seen.size).toBe(cards.length);
  });

  test('allows one skip per player per round and puts the card back later', () => {
    let session = drawCard(createSession(config(), mulberry32(4)), mulberry32(1));
    const skipped = session.currentCardId;
    session = skipCard(session, mulberry32(2));
    expect(session.currentCardId).toBeNull();
    expect(session.drawPile.includes(skipped!)).toBe(true);
    expect(session.drawPile[0]).not.toBe(skipped);
    session = drawCard(session, mulberry32(3));
    expect(() => skipCard(session, mulberry32(4))).toThrow('already skipped');
  });

  test('scores team cards and keeps pass mode friendly', () => {
    let session = drawCard(createSession(config(), mulberry32(9)), mulberry32(1));
    const card = session.cardsById[session.currentCardId!]!;
    if (card.type === 'word') session = completeCard(session, { kind: 'word', accepted: true });
    else if (card.type === 'challenge')
      session = completeCard(session, { kind: 'challenge', winnerTeamId: 'a' });
    else session = completeCard(session, { kind: 'standard' });
    const total = Object.values(session.scores).reduce((sum, value) => sum + value, 0);
    expect(total).toBeGreaterThan(0);

    let pass = createSession(config({ mode: 'pass', teams: [] }), mulberry32(2));
    pass = completeCard(drawCard(pass, mulberry32(1)), { kind: 'standard' });
    expect(Object.values(pass.scores).every((value) => value === 0)).toBe(true);
    expect(pass.participation.p1).toBe(1);
  });

  test('testimony points every team and bless counts as service', () => {
    const seeded = createSession(
      config({ cards: cards.filter((card) => card.type === 'testimony' || card.id === 'q1') }),
      mulberry32(1),
    );
    let session = seeded;
    while (session.cardsById[session.currentCardId ?? '']?.type !== 'testimony') {
      if (!session.currentCardId) session = drawCard(session, mulberry32(5));
      else session = completeCard(session, { kind: 'standard' });
      if (session.status === 'complete') break;
    }
    if (session.currentCardId && session.cardsById[session.currentCardId]?.type === 'testimony') {
      session = completeCard(session, { kind: 'standard' });
      expect(session.scores.a).toBeGreaterThan(0);
      expect(session.scores.b).toBeGreaterThan(0);
    }
    const blessBase = createSession(config(), mulberry32(6));
    const blessed = completeCard(drawCard(blessBase, mulberry32(1)), { kind: 'bless' });
    expect(blessed.actsOfService).toBe(1);
  });

  test('allows solo mode with one player', () => {
    const solo = createSession(
      config({
        mode: 'solo',
        players: [{ id: 'p1', name: 'Player 1' }],
        teams: [],
      }),
      mulberry32(1),
    );
    expect(solo.players).toHaveLength(1);
    expect(solo.mode).toBe('solo');
  });

  test('rejects an empty deck, a short roster, and a lone team', () => {
    expect(() => createSession(config({ cards: [] }), mulberry32(1))).toThrow('no cards');
    expect(() => createSession(config({ players: [config().players[0]!] }), mulberry32(1))).toThrow(
      'two players',
    );
    expect(() =>
      createSession(
        config({
          players: [
            { id: 'p1', name: ' ', teamId: 'a' },
            { id: 'p2', name: 'Ama', teamId: 'b' },
          ],
        }),
        mulberry32(1),
      ),
    ).toThrow('unique');
    expect(() => createSession(config({ teams: [config().teams[0]!] }), mulberry32(1))).toThrow(
      'two teams',
    );
  });

  test('refills from the discard pile and blocks a second draw', () => {
    const session = createSession(config({ roundLengthMinutes: 25 }), mulberry32(12));
    const drawn = drawCard(session, mulberry32(1));
    expect(() => drawCard(drawn, mulberry32(2))).toThrow('Finish the current card');
    expect(currentCard(session)).toBeNull();
    expect(currentCard(drawn)?.id).toBe(drawn.currentCardId);
    const emptied = {
      ...session,
      drawPile: [],
      discardPile: ['q1', 'd1'],
      drawnThisRound: ['q1'],
      currentCardId: null,
    };
    const refilled = drawCard(emptied, mulberry32(3));
    expect(refilled.currentCardId).toBe('d1');
    expect(() => skipCard({ ...session, currentCardId: null }, mulberry32(1))).toThrow(
      'Draw a card',
    );
    expect(canSkip(session, 'p1')).toBe(false);
    expect(() =>
      drawCard({ ...session, drawPile: [], discardPile: [], currentCardId: null }, mulberry32(1)),
    ).toThrow('left to draw');
    const onlyBlocked = drawCard(
      {
        ...session,
        drawPile: [],
        discardPile: ['q1'],
        drawnThisRound: ['q1'],
        currentCardId: null,
      },
      mulberry32(4),
    );
    expect(onlyBlocked.currentCardId).toBe('q1');
    const parked = skipCard({ ...session, currentCardId: 'd1', drawPile: [] }, mulberry32(5));
    expect(parked.drawPile).toEqual(['d1']);
    expect(() => currentPlayer({ ...session, players: [] })).toThrow('No players');
    expect(() =>
      completeCard({ ...session, currentCardId: 'missing' }, { kind: 'standard' }),
    ).toThrow('missing');
    expect(currentCard({ ...session, currentCardId: 'missing' })).toBeNull();
    expect(unityPercent(session)).toBe(100);
    expect(pickIndex(0, () => 0.9)).toBe(0);
  });

  test('scores a rejected word as zero and a challenge for the winner', () => {
    const base = createSession(config(), mulberry32(15));
    expect(completeCard({ ...base, currentCardId: 'q1' }, { kind: 'standard' }).scores.a).toBe(1);
    expect(completeCard({ ...base, currentCardId: 'd1' }, { kind: 'standard' }).scores.a).toBe(2);
    expect(
      completeCard({ ...base, currentCardId: 'w1' }, { kind: 'word', accepted: true }).scores.a,
    ).toBe(2);
    expect(completeCard({ ...base, currentCardId: 't1' }, { kind: 'standard' }).scores.b).toBe(1);
    const word = completeCard({ ...base, currentCardId: 'w1' }, { kind: 'word', accepted: false });
    expect(word.scores.a).toBe(0);
    const clash = completeCard(
      { ...base, currentCardId: 'c1' },
      { kind: 'challenge', winnerTeamId: 'b' },
    );
    expect(clash.scores.b).toBe(3);
    const skipped = skipCard(drawCard(base, mulberry32(1)), mulberry32(2));
    const finished = completeCard(drawCard(skipped, mulberry32(3)), { kind: 'standard' });
    expect(unityPercent(finished)).toBe(50);
  });

  test('maps dice faces and reports unity', () => {
    const faces = new Set(
      Array.from({ length: 40 }, (_, index) => rollDice(mulberry32(index + 11))),
    );
    expect(faces.has('truth')).toBe(true);
    expect(faces.has('dare')).toBe(true);
    expect(faces.has('wild')).toBe(true);
    expect(faces.has('bless')).toBe(true);
    let session = createSession(config({ roundLengthMinutes: 5 }), mulberry32(8));
    session = completeCard(drawCard(session, mulberry32(1)), { kind: 'standard' });
    session = completeCard(drawCard(session, mulberry32(2)), { kind: 'standard' });
    expect(unityPercent(session)).toBe(100);
    expect(session.status).toBe('complete');
  });

  test('prefers a matching card and records a blessing', () => {
    const session = createSession(config(), mulberry32(21));
    const preferred = drawPreferred(
      { ...session, drawPile: ['q1', 'd1'] },
      ['dare'],
      mulberry32(1),
    );
    expect(preferred.currentCardId).toBe('d1');
    const already = drawPreferred({ ...session, drawPile: ['d1', 'q1'] }, ['dare'], mulberry32(1));
    expect(already.currentCardId).toBe('d1');
    const blessed = recordBless(session);
    expect(blessed.actsOfService).toBe(1);
    expect(blessed.turnIndex).toBe(1);
    expect(() => recordBless({ ...session, currentCardId: 'q1' })).toThrow(
      'Finish the current card',
    );
  });
});
