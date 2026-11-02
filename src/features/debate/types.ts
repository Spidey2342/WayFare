export type DebateSide = 'for' | 'against';

export type DebatePhase =
  'lobby' | 'side_reveal' | 'prep' | 'debate' | 'voting' | 'results' | 'ended';

export type DebateSessionStatus = 'active' | 'finished' | 'cancelled';

export interface DebateTopic {
  id: string;
  text: string;
  category: string;
  difficulty: 'light' | 'medium' | 'deep';
}

export interface DebatePlayer {
  id: string;
  displayName: string;
  avatarKey?: string;
  side: DebateSide | null;
}

export interface DebateConfig {
  prepSeconds: number;
  debateSeconds: number;
  votingSeconds: number;
  debateExtensionSeconds: number;
}

export const DEFAULT_DEBATE_CONFIG: DebateConfig = {
  prepSeconds: 30,
  debateSeconds: 120,
  votingSeconds: 30,
  debateExtensionSeconds: 30,
};

export const DEBATE_KINDNESS_REMINDER = 'Be sharp, be kind. Argue the idea, not the person.';

export interface DebateVoteMap {
  [voterId: string]: string | null;
}

export interface SideTotals {
  for: number;
  against: number;
}

export interface DebateResults {
  winningSides: DebateSide[];
  sideTie: boolean;
  sideTotals: SideTotals;
  playerTotals: Record<string, number>;
  mvpIds: string[];
  mvpTie: boolean;
}

export interface PlayerScoreLine {
  playerId: string;
  participation: number;
  sideWin: number;
  mvp: number;
  total: number;
}

export interface LocalDebateSession {
  id: string;
  mode: 'solo' | 'pass';
  topic: DebateTopic;
  phase: DebatePhase;
  status: DebateSessionStatus;
  players: DebatePlayer[];
  hostId: string;
  config: DebateConfig;
  phaseEndsAt: number | null;
  debateExtended: boolean;
  readyToVote: string[];
  votes: DebateVoteMap;
  results: DebateResults | null;
  scores: Record<string, PlayerScoreLine>;
  solo?: {
    chosenSide: DebateSide | 'random';
    prepNotes: string;
    reflection: string;
    rating: number | null;
    soloPhase: 'pick' | 'prep' | 'for' | 'against' | 'reflect' | 'done';
  };
  pass?: {
    votingPlayerIndex: number;
    voteConfirmed: boolean;
  };
}
