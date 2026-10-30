import { palette } from '../palette';
import { typeScale } from '../typography';

describe('design tokens', () => {
  test('matches the style guide palette', () => {
    expect(palette.midnight).toBe('#1A1C2E');
    expect(palette.gold).toBe('#FFB800');
    expect(palette.coral).toBe('#FF6B6B');
    expect(palette.teal).toBe('#4ECDC4');
    expect(palette.blue).toBe('#4D98FF');
    expect(palette.purple).toBe('#A29BFE');
    expect(palette.offWhite).toBe('#F8F9FA');
    expect(palette.warmGray).toBe('#6C757D');
  });

  test('uses the published type scale', () => {
    expect(typeScale.display.fontSize).toBe(48);
    expect(typeScale.h1.fontSize).toBe(32);
    expect(typeScale.h2.fontSize).toBe(24);
    expect(typeScale.h3.fontSize).toBe(20);
    expect(typeScale.bodyL.fontSize).toBe(18);
    expect(typeScale.bodyM.fontSize).toBe(16);
    expect(typeScale.bodyS.fontSize).toBe(14);
    expect(typeScale.caption.fontSize).toBe(12);
  });
});
