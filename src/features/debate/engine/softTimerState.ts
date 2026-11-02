export type SoftTimerMinutes = 3 | 5 | 10 | null;

export type SoftTimerState =
  | { kind: 'none' }
  | { kind: 'running'; minutes: 3 | 5 | 10; elapsedMs: number; nudge: boolean }
  | { kind: 'nudge'; minutes: 3 | 5 | 10; elapsedMs: number };

export function softTimerState(
  minutes: SoftTimerMinutes,
  debateStartedAtMs: number | null,
  nowMs: number,
): SoftTimerState {
  if (minutes === null || debateStartedAtMs === null) return { kind: 'none' };
  const elapsedMs = Math.max(0, nowMs - debateStartedAtMs);
  const limitMs = minutes * 60 * 1000;
  if (elapsedMs >= limitMs) {
    return { kind: 'nudge', minutes, elapsedMs };
  }
  return { kind: 'running', minutes, elapsedMs, nudge: false };
}

export function formatElapsedChip(elapsedMs: number): string {
  const totalSec = Math.floor(elapsedMs / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}
