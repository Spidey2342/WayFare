export const EMOJI_REGEX =
  /\p{Extended_Pictographic}|\p{Emoji_Presentation}|\uFE0F|\u200D|[0-9#*]\uFE0F?\u20E3/gu;

export function containsEmoji(value: string): boolean {
  EMOJI_REGEX.lastIndex = 0;
  return EMOJI_REGEX.test(value);
}
