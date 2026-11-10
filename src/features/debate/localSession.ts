import { assignSidesBalanced, applySideAssignment, validateManualSides } from './assignSides';
import { computeResults } from './computeResults';
import {
  debateEarlyEndAllowed,
  extendDebateOnce,
  isPhaseTimedOut,
  markReadyToVote,
  nextPhaseAfter,
  phaseDurationMs,
  transitionPhase,
} from './nextPhase';
import { scorePlayers } from './scorePlayers';
import { validateVote } from './tallyVotes';
import bundledTopics from '@/data/debate-topics.json';
import { mvpMustBeDebater, scoreDebate } from './engine/scoreDebate';
import type { VerdictSide } from './engine/types';
import type {
  DebateConfig,
  DebatePlayer,
  DebateResults,
  DebateSide,
  DebateTopic,
  LocalDebateSession,
} from './types';
import { DEFAULT_DEBATE_CONFIG as DEFAULT_CONFIG } from './types';

let topicCacheMemory: DebateTopic[] | null = null;

/** Sync read: memory/cache hydrated via `hydrateDebateTopics()`. */
export function bundledDebateTopics(): DebateTopic[] {
  return topicCacheMemory ?? (bundledTopics as DebateTopic[]);
}

export async function hydrateDebateTopics(): Promise<DebateTopic[]> {
  const { readCachedTopics } = await import('@/features/debate/topicCache');
  topicCacheMemory = await readCachedTopics();
  return topicCacheMemory;
}

export function topicById(id: string): DebateTopic | undefined {
  return bundledDebateTopics().find((topic) => topic.id === id);
}

export function createPassSession(
  id: string,
  topic: DebateTopic,
  players: Omit<DebatePlayer, 'side'>[],
  hostId: string,
  config: DebateConfig = DEFAULT_CONFIG,
): LocalDebateSession {
  if (players.length < 3 || players.length > 8) {
    throw new Error('Pass debate needs 3 to 8 players.');
  }
  const debaterIds = players.filter((player) => player.id !== hostId).map((player) => player.id);
  return {
    id,
    mode: 'pass',
    topic,
    phase: 'topic',
    status: 'active',
    players: players.map((player) => ({ ...player, side: null })),
    hostId,
    config,
    phaseEndsAt: null,
    debateExtended: false,
    readyToVote: [],
    votes: Object.fromEntries(players.map((player) => [player.id, null])),
    results: null,
    scores: {},
    pass: {
      debaterIds,
      pickerIndex: 0,
      handoffConfirmed: false,
      allSidesPicked: debaterIds.length === 0,
    },
  };
}

export function confirmPassTopic(session: LocalDebateSession): LocalDebateSession {
  if (session.mode !== 'pass' || session.phase !== 'topic') return session;
  return { ...session, phase: 'picking' };
}

export function shufflePassTopic(
  session: LocalDebateSession,
  topic: DebateTopic,
): LocalDebateSession {
  if (session.mode !== 'pass' || session.phase !== 'topic') return session;
  return { ...session, topic };
}

export function currentPassPicker(session: LocalDebateSession): DebatePlayer | undefined {
  const pass = session.pass;
  if (!pass || pass.allSidesPicked) return undefined;
  const pickerId = pass.debaterIds[pass.pickerIndex];
  return session.players.find((player) => player.id === pickerId);
}

export function confirmPassHandoff(session: LocalDebateSession): LocalDebateSession {
  const pass = session.pass;
  if (!pass || session.phase !== 'picking' || pass.allSidesPicked) return session;
  return { ...session, pass: { ...pass, handoffConfirmed: true } };
}

export function pickPassSide(
  session: LocalDebateSession,
  playerId: string,
  side: DebateSide,
): LocalDebateSession {
  const pass = session.pass;
  if (!pass || session.phase !== 'picking' || !pass.handoffConfirmed) return session;
  const expectedId = pass.debaterIds[pass.pickerIndex];
  if (playerId !== expectedId) return session;
  const players = session.players.map((player) =>
    player.id === playerId ? { ...player, side } : player,
  );
  const nextIndex = pass.pickerIndex + 1;
  const allSidesPicked = nextIndex >= pass.debaterIds.length;
  return {
    ...session,
    players,
    pass: {
      ...pass,
      pickerIndex: nextIndex,
      handoffConfirmed: false,
      allSidesPicked,
    },
  };
}

export function passCanStartDebate(session: LocalDebateSession): boolean {
  if (session.mode !== 'pass' || session.phase !== 'picking' || !session.pass?.allSidesPicked) {
    return false;
  }
  const debaters = session.players.filter((player) => player.id !== session.hostId);
  try {
    validateManualSides(debaters);
    return true;
  } catch {
    return false;
  }
}

/** After everyone picked in private, host starts the in-person debate (no prep / random sides). */
export function beginPassDebateFromReady(
  session: LocalDebateSession,
  now = Date.now(),
): LocalDebateSession {
  if (!passCanStartDebate(session)) return session;
  return startDebate(session, now);
}

function passPlayersAsV2(session: LocalDebateSession) {
  return session.players.map((player) => ({
    id: player.id,
    displayName: player.displayName,
    side: player.side,
    role: (player.id === session.hostId ? 'judge' : 'debater') as 'judge' | 'debater',
  }));
}

export function publishPassVerdict(
  session: LocalDebateSession,
  winningSide: VerdictSide,
  mvpUserId: string | null,
): LocalDebateSession {
  if (session.mode !== 'pass' || session.phase !== 'verdict') return session;
  const roster = passPlayersAsV2(session);
  if (!mvpMustBeDebater(roster, mvpUserId)) {
    throw new Error('MVP must be a debater.');
  }
  const raw = scoreDebate(roster, winningSide, mvpUserId);
  const scores = Object.fromEntries(
    Object.entries(raw).map(([id, line]) => [
      id,
      {
        playerId: id,
        participation: line.participation,
        sideWin: line.sideBonus,
        mvp: line.mvp,
        total: line.total,
      },
    ]),
  );
  const debaters = session.players.filter((player) => player.id !== session.hostId);
  const results: DebateResults = {
    winningSides: winningSide === 'draw' ? [] : [winningSide],
    sideTie: winningSide === 'draw',
    sideTotals: {
      agree: debaters.filter((player) => player.side === 'agree').length,
      disagree: debaters.filter((player) => player.side === 'disagree').length,
    },
    playerTotals: {},
    mvpIds: mvpUserId ? [mvpUserId] : [],
    mvpTie: false,
  };
  return {
    ...session,
    results,
    scores,
    phase: 'results',
    phaseEndsAt: null,
    status: 'finished',
  };
}

export function assignPassSidesRandom(
  session: LocalDebateSession,
  rng: () => number,
): LocalDebateSession {
  const assignment = assignSidesBalanced(session.players, rng);
  return {
    ...session,
    players: applySideAssignment(session.players, assignment),
    phase: 'side_reveal',
  };
}

export function assignPassSidesManual(session: LocalDebateSession): LocalDebateSession {
  validateManualSides(session.players);
  return { ...session, phase: 'side_reveal' };
}

export function startPrep(session: LocalDebateSession, now = Date.now()): LocalDebateSession {
  let next = transitionPhase(session, 'prep', now);
  const duration = phaseDurationMs(next, 'prep');
  next = { ...next, phaseEndsAt: duration ? now + duration : null };
  return next;
}

export function skipPrep(session: LocalDebateSession, now = Date.now()): LocalDebateSession {
  if (session.phase !== 'prep') return session;
  return startDebate(session, now);
}

export function startDebate(session: LocalDebateSession, now = Date.now()): LocalDebateSession {
  let next = transitionPhase(session, 'debate', now);
  if (session.mode === 'pass') {
    return {
      ...next,
      phaseEndsAt: null,
      readyToVote: [],
      localClock: {
        debateStartedAt: now,
        pausedAt: null,
        totalPausedMs: 0,
        softTimerMinutes: null,
        nudgeShown: false,
      },
    };
  }
  const duration = phaseDurationMs(next, 'debate');
  next = { ...next, phaseEndsAt: duration ? now + duration : null, readyToVote: [] };
  return next;
}

export function passPauseDebate(session: LocalDebateSession, now = Date.now()): LocalDebateSession {
  if (session.mode !== 'pass' || session.phase !== 'debate' || !session.localClock) return session;
  if (session.localClock.pausedAt) return session;
  return {
    ...session,
    localClock: { ...session.localClock, pausedAt: now },
  };
}

export function passResumeDebate(
  session: LocalDebateSession,
  now = Date.now(),
): LocalDebateSession {
  const clock = session.localClock;
  if (session.mode !== 'pass' || session.phase !== 'debate' || !clock?.pausedAt) return session;
  const pausedMs = Math.max(0, now - clock.pausedAt);
  return {
    ...session,
    localClock: {
      ...clock,
      pausedAt: null,
      totalPausedMs: clock.totalPausedMs + pausedMs,
    },
  };
}

export function passSetSoftTimer(
  session: LocalDebateSession,
  minutes: number | null,
): LocalDebateSession {
  if (session.mode !== 'pass' || !session.localClock) return session;
  const m = minutes === null ? null : minutes;
  if (m !== null && m !== 3 && m !== 5 && m !== 10) return session;
  return {
    ...session,
    localClock: { ...session.localClock, softTimerMinutes: m, nudgeShown: false },
  };
}

export function passTransferJudge(
  session: LocalDebateSession,
  newJudgeId: string,
): LocalDebateSession {
  if (session.mode !== 'pass' || newJudgeId === session.hostId) return session;
  const oldJudgeId = session.hostId;
  const players = session.players.map((player) => {
    if (player.id === newJudgeId || player.id === oldJudgeId) {
      return { ...player, side: null };
    }
    return player;
  });
  const debaterIds = players
    .filter((player) => player.id !== newJudgeId)
    .map((player) => player.id);
  return {
    ...session,
    hostId: newJudgeId,
    players,
    pass: session.pass
      ? {
          ...session.pass,
          debaterIds,
        }
      : session.pass,
  };
}

export function passElapsedMs(session: LocalDebateSession, now = Date.now()): number {
  const clock = session.localClock;
  if (!clock) return 0;
  const pauseLive = clock.pausedAt ? Math.max(0, now - clock.pausedAt) : 0;
  return Math.max(0, now - clock.debateStartedAt - clock.totalPausedMs - pauseLive);
}

export function tapReadyToVote(session: LocalDebateSession, playerId: string): LocalDebateSession {
  const updated = markReadyToVote(session, playerId);
  if (debateEarlyEndAllowed(updated)) {
    return startVoting(updated);
  }
  return updated;
}

export function hostEndDebate(session: LocalDebateSession, now = Date.now()): LocalDebateSession {
  if (session.phase !== 'debate') return session;
  if (session.mode === 'pass') {
    return transitionPhase(session, 'verdict', now);
  }
  return startVoting(session);
}

export function extendDebate(session: LocalDebateSession, now = Date.now()): LocalDebateSession {
  return extendDebateOnce(session, now);
}

export function tickSession(session: LocalDebateSession, now = Date.now()): LocalDebateSession {
  if (!isPhaseTimedOut(session, now)) return session;
  if (session.phase === 'prep') return startDebate(session, now);
  if (session.phase === 'debate') {
    if (session.mode === 'pass') return session;
    return startVoting(session);
  }
  if (session.phase === 'voting') return finalizeLocalSession(session);
  return session;
}

export function startVoting(session: LocalDebateSession, now = Date.now()): LocalDebateSession {
  let next = transitionPhase(session, 'voting', now);
  const duration = phaseDurationMs(next, 'voting');
  next = {
    ...next,
    phaseEndsAt: duration ? now + duration : null,
    pass: session.pass
      ? { ...session.pass, votingPlayerIndex: 0, voteConfirmed: false }
      : session.pass,
  };
  return next;
}

export function submitPassVote(
  session: LocalDebateSession,
  voterId: string,
  votedFor: string,
): LocalDebateSession {
  if (session.phase !== 'voting') return session;
  validateVote(
    voterId,
    votedFor,
    session.players.map((player) => player.id),
  );
  const votes = { ...session.votes, [voterId]: votedFor };
  const pass = session.pass;
  if (!pass) return { ...session, votes };
  const nextIndex = (pass.votingPlayerIndex ?? 0) + 1;
  if (nextIndex >= session.players.length) {
    return finalizeLocalSession({ ...session, votes });
  }
  return {
    ...session,
    votes,
    pass: { ...pass, votingPlayerIndex: nextIndex, voteConfirmed: false },
  };
}

export function finalizeLocalSession(session: LocalDebateSession): LocalDebateSession {
  const results = computeResults(session.players, session.votes);
  const scores = scorePlayers(session.players, results);
  return {
    ...session,
    results,
    scores,
    phase: 'results',
    phaseEndsAt: null,
    status: 'finished',
  };
}

export function advanceFromSideReveal(
  session: LocalDebateSession,
  now = Date.now(),
): LocalDebateSession {
  if (session.phase !== 'side_reveal') return session;
  return startPrep(session, now);
}

export function lobbyAllReady(session: LocalDebateSession, readyIds: string[]): LocalDebateSession {
  if (session.phase !== 'lobby') return session;
  const allReady =
    session.players.length >= 2 && session.players.every((player) => readyIds.includes(player.id));
  if (!allReady) return session;
  return assignPassSidesRandom(session, () => Math.random());
}

export function createSoloSession(
  id: string,
  topic: DebateTopic,
  chosenSide: DebateSide | 'random',
  config: DebateConfig = DEFAULT_CONFIG,
): LocalDebateSession {
  const side: DebateSide =
    chosenSide === 'random' ? (Math.random() < 0.5 ? 'agree' : 'disagree') : chosenSide;
  const soloPlayer: DebatePlayer = {
    id: 'solo',
    displayName: 'You',
    side,
  };
  return {
    id,
    mode: 'solo',
    topic,
    phase: 'prep',
    status: 'active',
    players: [soloPlayer],
    hostId: 'solo',
    config: { ...config, debateSeconds: 60 },
    phaseEndsAt: null,
    debateExtended: false,
    readyToVote: [],
    votes: { solo: null },
    results: null,
    scores: {},
    solo: {
      chosenSide,
      prepNotes: '',
      reflection: '',
      rating: null,
      soloPhase: 'prep',
    },
  };
}

export function soloStartPrepTimer(
  session: LocalDebateSession,
  now = Date.now(),
): LocalDebateSession {
  const duration = session.config.prepSeconds * 1000;
  return {
    ...session,
    phaseEndsAt: now + duration,
    solo: session.solo ? { ...session.solo, soloPhase: 'prep' } : session.solo,
  };
}

export function soloAdvance(session: LocalDebateSession, now = Date.now()): LocalDebateSession {
  if (!session.solo) return session;
  const { soloPhase } = session.solo;
  if (soloPhase === 'prep') {
    return {
      ...session,
      solo: { ...session.solo, soloPhase: 'agree' },
      phase: 'debate',
      phaseEndsAt: now + 60_000,
    };
  }
  if (soloPhase === 'agree') {
    return {
      ...session,
      solo: { ...session.solo, soloPhase: 'disagree' },
      players: session.players.map((player) => ({
        ...player,
        side: player.side === 'agree' ? 'disagree' : 'agree',
      })),
      phaseEndsAt: now + 60_000,
    };
  }
  if (soloPhase === 'disagree') {
    return {
      ...session,
      solo: { ...session.solo, soloPhase: 'reflect' },
      phase: 'results',
      phaseEndsAt: null,
    };
  }
  return session;
}

export function soloComplete(session: LocalDebateSession): LocalDebateSession {
  const participation = scorePlayers(
    session.players,
    computeResults(session.players, session.votes),
  );
  return {
    ...session,
    scores: participation,
    status: 'finished',
    phase: 'ended',
    solo: session.solo ? { ...session.solo, soloPhase: 'done' } : session.solo,
  };
}

export { nextPhaseAfter };
