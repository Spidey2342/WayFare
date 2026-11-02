export const VERDICT_CHANGE_MS = 30_000;

export function verdictChangeWindow(
  decidedAtMs: number | null,
  nowMs: number,
): { open: boolean; remainingMs: number } {
  if (decidedAtMs === null) return { open: false, remainingMs: 0 };
  const elapsed = nowMs - decidedAtMs;
  const remainingMs = Math.max(0, VERDICT_CHANGE_MS - elapsed);
  return { open: remainingMs > 0, remainingMs };
}
