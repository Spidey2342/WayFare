import {
  friendlyCreateGroupError,
  friendlyJoinGroupError,
  parseCreateGroupResult,
} from '@/features/groups/groupErrors';

describe('create group errors', () => {
  it('maps limit and rate errors', () => {
    expect(friendlyCreateGroupError({ message: 'group_limit_reached' })).toMatch(/5 active groups/);
    expect(friendlyCreateGroupError({ message: 'rate_limit_exceeded' })).toMatch(/Wait a bit/);
  });

  it('parses legacy uuid string', () => {
    expect(parseCreateGroupResult('uuid-here').groupId).toBe('uuid-here');
  });
});

describe('join group errors', () => {
  it('uses generic message for bad codes', () => {
    expect(friendlyJoinGroupError({ message: 'invalid_code' })).toMatch(/did not work/);
  });
});
