export const AVATAR_PRESETS = [
  { key: 'sunrise', color: '#FFB800' },
  { key: 'teal', color: '#4ECDC4' },
  { key: 'blue', color: '#4D98FF' },
  { key: 'coral', color: '#FF6B6B' },
  { key: 'purple', color: '#9B59B6' },
  { key: 'forest', color: '#2ECC71' },
  { key: 'sand', color: '#E8C4A0' },
  { key: 'midnight', color: '#1E1B4B' },
] as const;

export function avatarColorForKey(key: string): string {
  const preset = AVATAR_PRESETS.find((item) => item.key === key);
  if (preset) return preset.color;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1)
    hash = (hash + key.charCodeAt(i) * 17) % AVATAR_PRESETS.length;
  return AVATAR_PRESETS[hash]?.color ?? AVATAR_PRESETS[0].color;
}
