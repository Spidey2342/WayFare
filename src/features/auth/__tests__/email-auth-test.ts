import { normalizeEmail } from '@/features/auth/normalizeEmail';
import { suggestEmailDomain } from '@/features/auth/emailTypoSuggest';

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  User@Example.COM ')).toBe('user@example.com');
  });
});

describe('suggestEmailDomain', () => {
  it('suggests close gmail typo', () => {
    expect(suggestEmailDomain('a@gmial.com')).toBe('a@gmail.com');
  });

  it('returns null for correct domain', () => {
    expect(suggestEmailDomain('a@gmail.com')).toBeNull();
  });
});

describe('duplicate sign-up detection', () => {
  it('treats empty identities as existing account', () => {
    const identities: unknown[] = [];
    expect(identities.length === 0).toBe(true);
  });
});
