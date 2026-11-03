import {
  baseMembersFromRpc,
  canLeaderStartGame,
  copyCodeResult,
  membersWithPresence,
  readyCount,
  waitingForMorePlayers,
  type LobbyRpcResponse,
} from '@/features/groups/lobbyModel';

const sample: LobbyRpcResponse = {
  group: {
    id: 'g1',
    name: 'Sample Group',
    description: null,
    photo_url: null,
    is_private: true,
    join_code: 'WYF7X2',
    owner_id: 'u1',
    created_at: '2026-01-01T00:00:00Z',
  },
  members: [
    {
      user_id: 'u1',
      role: 'leader',
      joined_at: '2026-01-01T00:00:00Z',
      display_name: 'Leader',
      avatar_key: 'sunrise',
    },
  ],
};

describe('lobby member mapping', () => {
  it('maps empty member list', () => {
    expect(baseMembersFromRpc({ ...sample, members: [] })).toEqual([]);
  });

  it('maps single leader', () => {
    const rows = baseMembersFromRpc(sample);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.role).toBe('leader');
    expect(rows[0]?.displayName).toBe('Leader');
  });

  it('merges presence ready state', () => {
    const base = baseMembersFromRpc({
      ...sample,
      members: [
        ...sample.members,
        {
          user_id: 'u2',
          role: 'member',
          joined_at: '2026-01-02T00:00:00Z',
          display_name: 'Ama',
          avatar_key: 'teal',
        },
      ],
    });
    const merged = membersWithPresence(base, { u1: true, u2: false }, { u1: true, u2: true });
    expect(readyCount(merged)).toBe(1);
    expect(waitingForMorePlayers(merged)).toBe(1);
    expect(canLeaderStartGame(merged)).toBe(false);
  });

  it('allows start when two players ready', () => {
    const base = baseMembersFromRpc({
      ...sample,
      members: [
        sample.members[0]!,
        {
          user_id: 'u2',
          role: 'member',
          joined_at: '2026-01-02T00:00:00Z',
          display_name: 'Ama',
          avatar_key: 'teal',
        },
      ],
    });
    const merged = membersWithPresence(base, { u1: true, u2: true }, { u1: true, u2: true });
    expect(canLeaderStartGame(merged)).toBe(true);
    expect(waitingForMorePlayers(merged)).toBe(0);
  });
});

describe('copy join code', () => {
  it('rejects empty code', () => {
    const result = copyCodeResult('', false);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('empty');
  });

  it('reports clipboard failure', () => {
    const result = copyCodeResult('ABC123', false);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('clipboard');
  });

  it('succeeds when clipboard works', () => {
    const result = copyCodeResult('ABC123', true);
    expect(result).toEqual({ ok: true, message: 'Code copied' });
  });
});
