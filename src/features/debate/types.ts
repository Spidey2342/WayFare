export type DebateSide = 'agree' | 'disagree';

export type DebatePhase =
  | 'lobby'
  | 'topic'
  | 'picking'
  | 'debating'
  | 'verdict'
  | 'results'
  | 'ended'
  /** @deprecated Legacy local/pass flows only */
  | 'side_reveal'
  | 'prep'
  | 'debate'
  | 'voting';

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
  agree: number;
  disagree: number;
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
    soloPhase: 'pick' | 'prep' | 'agree' | 'disagree' | 'reflect' | 'done';
  };
  /** Same-phone D5 elapsed clock (local). */
  localClock?: {
    debateStartedAt: number;
    pausedAt: number | null;
    totalPausedMs: number;
    softTimerMinutes: number | null;
    nudgeShown?: boolean;
  };
  pass?: {
    /** Players who must pick Agree/Disagree (everyone except the judge / host). */
    debaterIds: string[];
    /** Index into `debaterIds` for the current pass-the-phone turn. */
    pickerIndex: number;
    /** Current holder tapped "I'm {name}" before the private side pick. */
    handoffConfirmed: boolean;
    /** All debaters have chosen; show Ready? before START DEBATE. */
    allSidesPicked: boolean;
    /** @deprecated Legacy peer-vote flow */
    votingPlayerIndex?: number;
    voteConfirmed?: boolean;
  };
}
