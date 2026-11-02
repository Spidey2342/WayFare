export type DebateSideV2 = 'agree' | 'disagree';

export type DebatePhaseV2 = 'lobby' | 'topic' | 'picking' | 'debating' | 'verdict' | 'results';

export type PlayerRoleV2 = 'judge' | 'debater' | 'spectator';

export type DebatePlayerV2 = {
  id: string;
  displayName: string;
  side: DebateSideV2 | null;
  role: PlayerRoleV2;
};

export type VerdictSide = DebateSideV2 | 'draw';
