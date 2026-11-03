/** Section 10 — server code → user-facing copy. */
export const DEBATE_ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: 'Please sign in to play with friends.',
  not_member: "You're not in this group.",
  not_judge: 'Only the leader can do that.',
  wrong_phase: 'That moved on. Refreshing...',
  side_required: 'Each side needs at least 1 player to start the debate.',
  session_full: 'This room is full.',
  already_in_session: "You're already in a debate. Rejoin it?",
  session_expired: 'This debate has ended.',
  rate_limited: 'Slow down for a moment.',
  offline: 'You are offline.',
};

export function debateErrorMessage(caught: unknown): string {
  const raw =
    caught instanceof Error
      ? caught.message
      : typeof caught === 'object' && caught !== null && 'message' in caught
        ? String((caught as { message: unknown }).message)
        : String(caught);
  const code = raw.split('\n')[0]?.trim() ?? raw;
  if (DEBATE_ERROR_MESSAGES[code]) return DEBATE_ERROR_MESSAGES[code];
  for (const key of Object.keys(DEBATE_ERROR_MESSAGES)) {
    if (code.includes(key)) return DEBATE_ERROR_MESSAGES[key]!;
  }
  return code || 'Something went wrong.';
}

export function isWrongPhaseError(caught: unknown): boolean {
  const msg = caught instanceof Error ? caught.message : String(caught);
  return msg.includes('wrong_phase');
}
