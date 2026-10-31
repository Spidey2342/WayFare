export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1));
    const current = copy[index] as T;
    const other = copy[swap] as T;
    copy[index] = other;
    copy[swap] = current;
  }
  return copy;
}

export function pickIndex(length: number, rng: Rng): number {
  if (length <= 0) return 0;
  return Math.min(length - 1, Math.floor(rng() * length));
}
