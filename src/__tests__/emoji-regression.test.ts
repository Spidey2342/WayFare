import { containsEmoji } from '@/utils/emojiScanner';

describe('emoji regression guard', () => {
  test('detects pictographic characters', () => {
    const wave = String.fromCodePoint(0x1f44b);
    expect(containsEmoji(`Hello ${wave}`)).toBe(true);
    expect(containsEmoji('Hello world')).toBe(false);
  });
});
