import type { GroupRow } from '@/services/supabase';

export type LobbyMemberRow = {
  userId: string;
  displayName: string;
  avatarKey: string | null;
  role: 'leader' | 'member';
  ready: boolean;
  online: boolean;
};

export type LobbyRpcMember = {
  user_id: string;
  role: 'leader' | 'member';
  joined_at: string;
  display_name: string;
  avatar_key: string | null;
};

export type LobbyRpcResponse = {
  group: GroupRow;
  members: LobbyRpcMember[];
};

export const MIN_PLAYERS_TO_START = 2;

export function baseMembersFromRpc(data: LobbyRpcResponse): LobbyMemberRow[] {
  return (data.members ?? []).map((row) => ({
    userId: row.user_id,
    displayName: row.display_name,
    avatarKey: row.avatar_key,
    role: row.role,
    ready: false,
    online: false,
  }));
}

export function membersWithPresence(
  base: LobbyMemberRow[],
  presenceReady: Record<string, boolean>,
  presenceOnline: Record<string, boolean>,
): LobbyMemberRow[] {
  return base.map((member) => ({
    ...member,
    ready: presenceReady[member.userId] ?? false,
    online: presenceOnline[member.userId] ?? false,
  }));
}

export function readyCount(members: LobbyMemberRow[]): number {
  return members.filter((member) => member.ready).length;
}

export function waitingForMorePlayers(members: LobbyMemberRow[]): number {
  if (members.length < MIN_PLAYERS_TO_START) {
    return MIN_PLAYERS_TO_START - members.length;
  }
  return Math.max(0, MIN_PLAYERS_TO_START - readyCount(members));
}

export function canLeaderStartGame(members: LobbyMemberRow[]): boolean {
  if (members.length < MIN_PLAYERS_TO_START) return false;
  return readyCount(members) >= MIN_PLAYERS_TO_START;
}

export type CopyCodeResult =
  | { ok: true; message: 'Code copied' }
  | { ok: false; message: string; reason: 'empty' | 'clipboard' };

export function copyCodeResult(
  code: string | null | undefined,
  clipboardOk: boolean,
): CopyCodeResult {
  const trimmed = (code ?? '').trim();
  if (!trimmed) {
    return {
      ok: false,
      reason: 'empty',
      message: 'No join code yet. Tap Retry or ask your leader to refresh the code.',
    };
  }
  if (!clipboardOk) {
    return {
      ok: false,
      reason: 'clipboard',
      message: "Couldn't copy. Select the code and copy it manually.",
    };
  }
  return { ok: true, message: 'Code copied' };
}

export function friendlyLobbyError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('not_a_member')) {
      return 'You are not in this group. Join with a code or go back to Groups.';
    }
    if (error.message.includes('not_authenticated')) {
      return 'Sign in to view this lobby.';
    }
    if (error.message.includes('0003')) {
      return error.message;
    }
    return error.message;
  }
  return 'Could not load the lobby. Check your connection and try again.';
}
