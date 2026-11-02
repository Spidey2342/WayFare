/** Mirrors `public.normalize_group_name` in Postgres. */
export function normalizeGroupName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function collapseWhitespace(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

export function isPunctuationOnly(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return false;
  return /^[\p{P}\s]+$/u.test(trimmed) && !/[a-zA-Z0-9]/.test(trimmed);
}

export const GROUP_NAME_MIN = 3;
export const GROUP_NAME_MAX = 40;
export const GROUP_DESC_MAX = 200;
