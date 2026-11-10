import {
  PASS_PLAYER_NAME_MAX,
  normalizePassPlayerName,
  passAddedAvatarColor,
  validatePassPlayerName,
} from '../passSetupPlayers';

describe('passSetupPlayers', () => {
  it('normalizes whitespace', () => {
    expect(normalizePassPlayerName('  Ama   K  ')).toBe('Ama K');
  });

  it('rejects empty, duplicate, and long names', () => {
    expect(validatePassPlayerName('', ['Sam'], 'Alex')).toBe('Enter a name.');
    expect(validatePassPlayerName('   ', ['Sam'], 'Alex')).toBe('Enter a name.');
    expect(validatePassPlayerName('sam', ['Sam'], 'Alex')).toBe(
      'That name is already in the list.',
    );
    expect(validatePassPlayerName('ALEX', [], 'Alex')).toBe('That name is already in the list.');
    const long = 'a'.repeat(PASS_PLAYER_NAME_MAX + 1);
    expect(validatePassPlayerName(long, [], 'Alex')).toBe('Names can be up to 20 characters.');
  });

  it('accepts valid unique names', () => {
    expect(validatePassPlayerName('Ama', ['Sam'], 'Alex')).toBeNull();
  });

  it('cycles avatar colors in order', () => {
    expect(passAddedAvatarColor(0)).toBe('#FFB800');
    expect(passAddedAvatarColor(4)).toBe('#4D98FF');
    expect(passAddedAvatarColor(5)).toBe('#FFB800');
  });
});
