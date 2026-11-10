export const PASS_SELF_ID = 'pass-self';

export const PASS_ADDED_AVATAR_BG = [
  '#FFB800',
  '#FF6B6B',
  '#4ECDC4',
  '#A29BFE',
  '#4D98FF',
] as const;

export const PASS_AVATAR_INITIAL_COLOR = '#1A1C2E';

export const PASS_PLAYER_NAME_MAX = 20;
export const PASS_PLAYER_MIN_COUNT = 3;
export const PASS_PLAYER_MAX_COUNT = 8;

export function normalizePassPlayerName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

export function validatePassPlayerName(
  raw: string,
  existingNames: readonly string[],
  selfName: string,
): string | null {
  const name = normalizePassPlayerName(raw);
  if (!name) return 'Enter a name.';
  if (name.length > PASS_PLAYER_NAME_MAX) return 'Names can be up to 20 characters.';
  const lower = name.toLowerCase();
  const taken = new Set([
    selfName.toLowerCase(),
    ...existingNames.map((item) => item.toLowerCase()),
  ]);
  if (taken.has(lower)) return 'That name is already in the list.';
  return null;
}

export function passAddedAvatarColor(index: number): string {
  return PASS_ADDED_AVATAR_BG[index % PASS_ADDED_AVATAR_BG.length]!;
}
