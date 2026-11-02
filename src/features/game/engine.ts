import { pickIndex, shuffle, type Rng } from './rng';
import {
  GameError,
  type CardOutcome,
  type CompleteInput,
  type DiceFace,
  type EngineCard,
  type EnginePlayer,
  type Session,
  type SessionConfig,
} from './types';

const DICE: DiceFace[] = ['truth', 'truth', 'dare', 'dare', 'wild', 'bless'];

export function roundsForMinutes(minutes: number): number {
  return Math.max(1, Math.round(minutes / 5));
}

export function createSession(config: SessionConfig, rng: Rng): Session {
  const minPlayers = config.mode === 'solo' ? 1 : 2;
  if (config.players.length < minPlayers) {
    throw new GameError(
      config.mode === 'solo' ? 'Add your name to start.' : 'Add at least two players.',
    );
  }
  if (config.cards.length === 0) throw new GameError('This deck has no cards.');
  const names = new Set<string>();
  for (const player of config.players) {
    const key = player.name.trim().toLowerCase();
    if (!key || names.has(key)) throw new GameError('Player names must be unique.');
    names.add(key);
  }
  if (config.mode === 'team' && config.teams.length < 2) {
    throw new GameError('Team mode needs at least two teams.');
  }

  const scores: Record<string, number> = {};
  const subjects =
    config.mode === 'team'
      ? config.teams.map((team) => team.id)
      : config.players.map((player) => player.id);
  for (const id of subjects) scores[id] = 0;

  return {
    id: config.id,
    mode: config.mode,
    players: config.players,
    teams: config.teams,
    cardsById: Object.fromEntries(config.cards.map((card) => [card.id, card])),
    roundsTotal: roundsForMinutes(config.roundLengthMinutes),
    currentRound: 1,
    turnIndex: 0,
    drawPile: shuffle(
      config.cards.map((card) => card.id),
      rng,
    ),
    discardPile: [],
    drawnThisRound: [],
    currentCardId: null,
    skipsUsed: {},
    scores,
    participation: Object.fromEntries(config.players.map((player) => [player.id, 0])),
    cardsPlayed: [],
    outcomes: [],
    status: 'active',
    actsOfService: 0,
    startedAt: config.now,
  };
}

export function currentPlayer(session: Session): EnginePlayer {
  const player = session.players[session.turnIndex % session.players.length];
  if (!player) throw new GameError('No players are in this session.');
  return player;
}

export function canSkip(session: Session, playerId: string): boolean {
  return (session.skipsUsed[playerId] ?? 0) < 1 && session.currentCardId !== null;
}

function refillDrawPile(session: Session, rng: Rng): string[] {
  const blocked = new Set(session.drawnThisRound);
  const available = session.discardPile.filter((id) => !blocked.has(id));
  const source =
    available.length > 0
      ? available
      : session.discardPile.filter((id) => id !== session.discardPile.at(-1));
  const pile = source.length > 0 ? source : [...session.discardPile];
  return shuffle(pile, rng);
}

export function drawPreferred(
  session: Session,
  types: readonly EngineCard['type'][],
  rng: Rng,
): Session {
  const matchIndex = session.drawPile.findIndex((id) => {
    const card = session.cardsById[id];
    return card ? types.includes(card.type) : false;
  });
  if (matchIndex <= 0) return drawCard(session, rng);
  const pile = [...session.drawPile];
  const [chosen] = pile.splice(matchIndex, 1);
  if (!chosen) return drawCard(session, rng);
  return drawCard({ ...session, drawPile: [chosen, ...pile] }, rng);
}

export function drawCard(session: Session, rng: Rng): Session {
  if (session.status !== 'active') throw new GameError('This session is finished.');
  if (session.currentCardId) throw new GameError('Finish the current card first.');
  let drawPile = session.drawPile;
  let discardPile = session.discardPile;
  if (drawPile.length === 0) {
    drawPile = refillDrawPile(session, rng);
    discardPile = session.discardPile.filter((id) => !drawPile.includes(id));
  }
  const [next, ...rest] = drawPile;
  if (!next) throw new GameError('No cards are left to draw.');
  return {
    ...session,
    drawPile: rest,
    discardPile,
    currentCardId: next,
    drawnThisRound: [...session.drawnThisRound, next],
  };
}

export function skipCard(session: Session, rng: Rng): Session {
  const player = currentPlayer(session);
  const cardId = session.currentCardId;
  if (!cardId) throw new GameError('Draw a card before skipping.');
  if (!canSkip(session, player.id)) throw new GameError('This player already skipped this round.');
  const insertAt =
    session.drawPile.length === 0
      ? 0
      : 1 + pickIndex(Math.max(session.drawPile.length - 1, 1), rng);
  const drawPile = [...session.drawPile];
  const bounded = Math.min(drawPile.length, Math.max(1, insertAt));
  drawPile.splice(drawPile.length === 0 ? 0 : bounded, 0, cardId);
  return {
    ...session,
    currentCardId: null,
    drawPile,
    skipsUsed: { ...session.skipsUsed, [player.id]: 1 },
    outcomes: [...session.outcomes, { cardId, playerId: player.id, kind: 'skipped', points: {} }],
  };
}

function award(
  session: Session,
  card: EngineCard,
  input: CompleteInput,
  player: EnginePlayer,
): Record<string, number> {
  const points: Record<string, number> = {};
  const add = (id: string, amount: number) => {
    points[id] = (points[id] ?? 0) + amount;
  };
  if (session.mode === 'pass' || session.mode === 'journey') {
    if (input.kind === 'bless') return points;
    return points;
  }
  const teamId = player.teamId;
  if (card.type === 'question' && teamId) add(teamId, 1);
  if (card.type === 'dare' && teamId) add(teamId, 2);
  if (card.type === 'word' && input.kind === 'word' && input.accepted && teamId) add(teamId, 2);
  if (card.type === 'challenge' && input.kind === 'challenge') add(input.winnerTeamId, 3);
  if (card.type === 'testimony') {
    for (const team of session.teams) add(team.id, 1);
  }
  return points;
}

function applyPoints(
  scores: Record<string, number>,
  points: Record<string, number>,
): Record<string, number> {
  const next = { ...scores };
  for (const [id, amount] of Object.entries(points)) next[id] = (next[id] ?? 0) + amount;
  return next;
}

function advance(session: Session): Session {
  const nextTurn = session.turnIndex + 1;
  const roundFinished = nextTurn % session.players.length === 0;
  const nextRound = roundFinished ? session.currentRound + 1 : session.currentRound;
  const complete = nextRound > session.roundsTotal;
  return {
    ...session,
    turnIndex: complete ? session.turnIndex : nextTurn % session.players.length,
    currentRound: complete ? session.roundsTotal : nextRound,
    drawnThisRound: roundFinished ? [] : session.drawnThisRound,
    skipsUsed: roundFinished ? {} : session.skipsUsed,
    status: complete ? 'complete' : 'active',
  };
}

export function completeCard(session: Session, input: CompleteInput): Session {
  const player = currentPlayer(session);
  const cardId = session.currentCardId;
  if (!cardId) throw new GameError('Draw a card before finishing.');
  const card = session.cardsById[cardId];
  if (!card) throw new GameError('That card is missing from the deck.');
  const points = award(session, card, input, player);
  const outcome: CardOutcome = { cardId, playerId: player.id, kind: 'completed', points };
  const next: Session = {
    ...session,
    currentCardId: null,
    discardPile: [...session.discardPile, cardId],
    cardsPlayed: [...session.cardsPlayed, cardId],
    outcomes: [...session.outcomes, outcome],
    scores: applyPoints(session.scores, points),
    participation: {
      ...session.participation,
      [player.id]: (session.participation[player.id] ?? 0) + 1,
    },
    actsOfService: session.actsOfService + (input.kind === 'bless' ? 1 : 0),
  };
  return advance(next);
}

export function recordBless(session: Session): Session {
  if (session.status !== 'active') throw new GameError('This session is finished.');
  if (session.currentCardId) throw new GameError('Finish the current card first.');
  const player = currentPlayer(session);
  const next: Session = {
    ...session,
    outcomes: [
      ...session.outcomes,
      { cardId: 'bless', playerId: player.id, kind: 'completed', points: {} },
    ],
    participation: {
      ...session.participation,
      [player.id]: (session.participation[player.id] ?? 0) + 1,
    },
    actsOfService: session.actsOfService + 1,
  };
  return advance(next);
}

export function rollDice(rng: Rng): DiceFace {
  return DICE[pickIndex(DICE.length, rng)] as DiceFace;
}

export function unityPercent(session: Session): number {
  const played = session.outcomes.filter((outcome) => outcome.kind === 'completed').length;
  if (played === 0) return 100;
  const skips = session.outcomes.filter((outcome) => outcome.kind === 'skipped').length;
  return Math.round((played / (played + skips)) * 100);
}

export function currentCard(session: Session): EngineCard | null {
  if (!session.currentCardId) return null;
  return session.cardsById[session.currentCardId] ?? null;
}
