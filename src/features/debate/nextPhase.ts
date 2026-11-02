import type { DebatePhase, DebateSessionStatus, LocalDebateSession } from './types';

const ORDER: DebatePhase[] = [
  'lobby',
  'side_reveal',
  'prep',
  'debate',
  'voting',
  'results',
  'ended',
];

export function nextPhaseAfter(current: DebatePhase): DebatePhase | null {
  const index = ORDER.indexOf(current);
  if (index < 0 || index >= ORDER.length - 1) return null;
  return ORDER[index + 1] ?? null;
}

export function phaseDurationMs(session: LocalDebateSession, phase: DebatePhase): number | null {
  const { config } = session;
  if (phase === 'prep') return config.prepSeconds * 1000;
  if (phase === 'debate') {
    const base = config.debateSeconds * 1000;
    return session.debateExtended ? base + config.debateExtensionSeconds * 1000 : base;
  }
  if (phase === 'voting') return config.votingSeconds * 1000;
  return null;
}

export function canHostSkipPrep(session: LocalDebateSession): boolean {
  return session.phase === 'prep';
}

export function debateEarlyEndAllowed(session: LocalDebateSession): boolean {
  if (session.phase !== 'debate') return false;
  if (session.readyToVote.length >= session.players.length) return true;
  if (session.phaseEndsAt !== null && Date.now() >= session.phaseEndsAt) return true;
  return false;
}

export function shouldCancelSession(activePlayers: number): boolean {
  return activePlayers < 2;
}

export function transitionPhase(
  session: LocalDebateSession,
  next: DebatePhase,
  now = Date.now(),
): LocalDebateSession {
  const duration = phaseDurationMs({ ...session, phase: next }, next);
  return {
    ...session,
    phase: next,
    phaseEndsAt: duration === null ? null : now + duration,
    readyToVote: next === 'debate' ? [] : session.readyToVote,
    status: next === 'ended' ? 'finished' : session.status,
  };
}

export function markReadyToVote(session: LocalDebateSession, playerId: string): LocalDebateSession {
  if (session.phase !== 'debate') return session;
  if (session.readyToVote.includes(playerId)) return session;
  return { ...session, readyToVote: [...session.readyToVote, playerId] };
}

export function extendDebateOnce(
  session: LocalDebateSession,
  now = Date.now(),
): LocalDebateSession {
  if (session.phase !== 'debate' || session.debateExtended) return session;
  const extra = session.config.debateExtensionSeconds * 1000;
  return {
    ...session,
    debateExtended: true,
    phaseEndsAt: (session.phaseEndsAt ?? now) + extra,
  };
}

export function isPhaseTimedOut(session: LocalDebateSession, now = Date.now()): boolean {
  if (session.phaseEndsAt === null) return false;
  return now >= session.phaseEndsAt;
}

export function activePhaseOrResults(session: LocalDebateSession): DebateSessionStatus {
  return session.status;
}
