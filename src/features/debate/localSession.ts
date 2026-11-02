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
import type {
  DebateConfig,
  DebatePlayer,
  DebateSide,
  DebateTopic,
  LocalDebateSession,
} from './types';
import { DEFAULT_DEBATE_CONFIG as DEFAULT_CONFIG } from './types';

export function bundledDebateTopics(): DebateTopic[] {
  return bundledTopics as DebateTopic[];
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
  if (players.length < 2 || players.length > 8) {
    throw new Error('Pass debate needs 2 to 8 players.');
  }
  return {
    id,
    mode: 'pass',
    topic,
    phase: 'lobby',
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
    pass: { votingPlayerIndex: 0, voteConfirmed: false },
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
  const duration = phaseDurationMs(next, 'debate');
  next = { ...next, phaseEndsAt: duration ? now + duration : null, readyToVote: [] };
  return next;
}

export function tapReadyToVote(session: LocalDebateSession, playerId: string): LocalDebateSession {
  const updated = markReadyToVote(session, playerId);
  if (debateEarlyEndAllowed(updated)) {
    return startVoting(updated);
  }
  return updated;
}

export function hostEndDebate(session: LocalDebateSession): LocalDebateSession {
  if (session.phase !== 'debate') return session;
  return startVoting(session);
}

export function extendDebate(session: LocalDebateSession, now = Date.now()): LocalDebateSession {
  return extendDebateOnce(session, now);
}

export function tickSession(session: LocalDebateSession, now = Date.now()): LocalDebateSession {
  if (!isPhaseTimedOut(session, now)) return session;
  if (session.phase === 'prep') return startDebate(session, now);
  if (session.phase === 'debate') return startVoting(session);
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
  const nextIndex = pass.votingPlayerIndex + 1;
  if (nextIndex >= session.players.length) {
    return finalizeLocalSession({ ...session, votes });
  }
  return {
    ...session,
    votes,
    pass: { votingPlayerIndex: nextIndex, voteConfirmed: false },
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
