import type { LocalDebateSession } from './types';

const sessions = new Map<string, LocalDebateSession>();

export function saveLocalDebate(session: LocalDebateSession): void {
  sessions.set(session.id, session);
}

export function loadLocalDebate(id: string): LocalDebateSession | undefined {
  return sessions.get(id);
}

export function updateLocalDebate(
  id: string,
  updater: (session: LocalDebateSession) => LocalDebateSession,
): LocalDebateSession | undefined {
  const current = sessions.get(id);
  if (!current) return undefined;
  const next = updater(current);
  sessions.set(id, next);
  return next;
}

/** Test helper */
export function clearLocalDebates(): void {
  sessions.clear();
}
