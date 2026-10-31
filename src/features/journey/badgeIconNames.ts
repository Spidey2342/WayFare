import legacyEmojiMap from '@/data/legacy-emoji-map.json';

import { containsEmoji } from '@/utils/emojiScanner';

const legacyEmojiIconNames = legacyEmojiMap.iconNames as Record<string, string>;

export function normalizeBadgeIconName(name: string): string {
  const trimmed = name.trim();
  if (legacyEmojiIconNames[trimmed]) return legacyEmojiIconNames[trimmed];
  if (containsEmoji(trimmed)) return 'award';
  return trimmed;
}
