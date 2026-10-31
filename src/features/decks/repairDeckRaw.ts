/**
 * Reference deck JSON shipped with shifted metadata fields (icon name in `difficulty`,
 * difficulty in `estMinutes`, minutes in `locked`, gradient colors in `icon`).
 * Card arrays are untouched. See docs/DECISIONS.md.
 */

const LOCKED_BY_ID: Record<string, boolean> = {
  identity: false,
  courage: false,
  serving: true,
  'the-journey': true,
  'church-culture': false,
  'wisdom-tales': false,
  'outing-mixed': true,
};

const DIFFICULTY_VALUES = new Set(['beginner', 'intermediate', 'advanced']);

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value);
}

export function repairDeckRaw(raw: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...raw };
  const id = typeof next.id === 'string' ? next.id : '';

  if (Array.isArray(next.icon) && next.icon.every(isHexColor)) {
    if (!next.coverGradient) next.coverGradient = next.icon;
  }

  const iconCandidate = next.difficulty;
  const difficultyCandidate = next.estMinutes;
  const minutesCandidate = next.locked;

  if (typeof iconCandidate === 'string' && !DIFFICULTY_VALUES.has(iconCandidate)) {
    next.icon = iconCandidate;
  }
  if (typeof difficultyCandidate === 'string' && DIFFICULTY_VALUES.has(difficultyCandidate)) {
    next.difficulty = difficultyCandidate;
  }
  if (typeof minutesCandidate === 'number' && minutesCandidate > 0 && minutesCandidate < 120) {
    next.estMinutes = minutesCandidate;
  }

  if (typeof next.coverGradient === 'string') {
    next.badge = next.coverGradient;
    delete next.coverGradient;
  }

  if (next.badge === true) {
    next.badge = 'Pro Deck';
  }

  if (typeof next.icon !== 'string' || next.icon.length === 0) {
    next.icon = 'compass';
  }

  next.locked = LOCKED_BY_ID[id] ?? false;
  next.isPro = id === 'outing-mixed';

  if (typeof next.estMinutes !== 'number') {
    next.estMinutes = 25;
  }
  if (typeof next.difficulty !== 'string' || !DIFFICULTY_VALUES.has(next.difficulty)) {
    next.difficulty = 'beginner';
  }

  return next;
}
