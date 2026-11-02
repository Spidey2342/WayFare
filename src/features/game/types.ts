export type CardType = 'word' | 'question' | 'dare' | 'challenge' | 'testimony';
export type GameMode = 'pass' | 'team' | 'solo' | 'journey' | 'outing';
export type DiceFace = 'truth' | 'dare' | 'wild' | 'bless';

export interface EngineCard {
  id: string;
  deckId: string;
  type: CardType;
  prompt: string;
  title?: string;
  reference?: string;
  body?: string;
  instruction?: string;
  timerSeconds?: number;
  difficulty?: 'light' | 'medium' | 'deep';
  points: number;
}

export interface EnginePlayer {
  id: string;
  name: string;
  teamId?: string;
}

export interface EngineTeam {
  id: string;
  name: string;
  playerIds: string[];
}

export interface SessionConfig {
  id: string;
  mode: GameMode;
  players: EnginePlayer[];
  teams: EngineTeam[];
  cards: EngineCard[];
  roundLengthMinutes: number;
  now: string;
}

export interface CardOutcome {
  cardId: string;
  playerId: string;
  kind: 'completed' | 'skipped';
  points: Record<string, number>;
}

export interface Session {
  id: string;
  mode: GameMode;
  players: EnginePlayer[];
  teams: EngineTeam[];
  cardsById: Record<string, EngineCard>;
  roundsTotal: number;
  currentRound: number;
  turnIndex: number;
  drawPile: string[];
  discardPile: string[];
  drawnThisRound: string[];
  currentCardId: string | null;
  skipsUsed: Record<string, number>;
  scores: Record<string, number>;
  participation: Record<string, number>;
  cardsPlayed: string[];
  outcomes: CardOutcome[];
  status: 'active' | 'complete';
  actsOfService: number;
  startedAt: string;
}

export type CompleteInput =
  | { kind: 'standard' }
  | { kind: 'word'; accepted: boolean }
  | { kind: 'challenge'; winnerTeamId: string }
  | { kind: 'bless' };

export class GameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GameError';
  }
}
