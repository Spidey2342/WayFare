import { parseCreateGroupResult } from '@/features/groups/groupErrors';
import {
  collapseWhitespace,
  isPunctuationOnly,
  normalizeGroupName,
} from '@/features/groups/normalize';

describe('normalizeGroupName', () => {
  it('lowercases and collapses whitespace', () => {
    expect(normalizeGroupName('  Qavah   Youth ')).toBe('qavah youth');
  });

  it('detects punctuation-only names', () => {
    expect(isPunctuationOnly('!!!')).toBe(true);
    expect(isPunctuationOnly('Qavah')).toBe(false);
  });

  it('collapses whitespace for submit', () => {
    expect(collapseWhitespace('  hello   world  ')).toBe('hello world');
  });
});

describe('parseCreateGroupResult', () => {
  it('parses jsonb shape', () => {
    expect(parseCreateGroupResult({ group_id: 'abc', already_existed: true }).alreadyExisted).toBe(
      true,
    );
  });
});
