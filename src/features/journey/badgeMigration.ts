import badgesData from '@/data/badges.json';
import legacyEmojiMap from '@/data/legacy-emoji-map.json';

import { normalizeBadgeIconName } from './badgeIconNames';

const knownBadgeIds = new Set(badgesData.map((badge) => badge.id));
const legacyEmojiBadgeIds = legacyEmojiMap.badgeIds as Record<string, string>;

export function sanitizeBadgesEarned(raw: readonly string[]): string[] {
  const next = new Set<string>();
  for (const entry of raw) {
    if (knownBadgeIds.has(entry)) {
      next.add(entry);
      continue;
    }
    const mapped = legacyEmojiBadgeIds[entry.trim()];
    if (mapped) next.add(mapped);
  }
  return [...next];
}

export function migrateBadgeIconField(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  return normalizeBadgeIconName(value);
}
