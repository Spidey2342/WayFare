import { parseCreateGroupResult, type CreateGroupResult } from '@/features/groups/groupErrors';
import type { LobbyRpcResponse } from '@/features/groups/lobbyModel';
import { requireSupabase, type GroupMemberRow, type GroupRow } from '@/services/supabase';

export async function rpcCreateGroup(
  name: string,
  description: string,
  isPrivate: boolean,
  requestId: string,
): Promise<CreateGroupResult> {
  const { data, error } = await requireSupabase().rpc('create_group', {
    name,
    description,
    is_private: isPrivate,
    request_id: requestId,
  });
  if (error) throw error;
  return parseCreateGroupResult(data);
}

export async function rpcRestoreGroup(groupId: string) {
  const { error } = await requireSupabase().rpc('restore_group', { p_group_id: groupId });
  if (error) throw error;
}

export async function rpcJoinGroup(code: string) {
  const { data, error } = await requireSupabase().rpc('join_group_by_code', { code });
  if (error) throw error;
  return data as string;
}

export async function rpcLeaveGroup(groupId: string) {
  const { error } = await requireSupabase().rpc('leave_group', { group_id: groupId });
  if (error) throw error;
}

export async function rpcRotateCode(groupId: string) {
  const { data, error } = await requireSupabase().rpc('rotate_group_code', { group_id: groupId });
  if (error) throw error;
  return data as string;
}

export async function rpcRemoveMember(groupId: string, userId: string) {
  const { error } = await requireSupabase().rpc('remove_member', {
    group_id: groupId,
    target_user_id: userId,
  });
  if (error) throw error;
}

export async function fetchMyGroups(): Promise<GroupRow[]> {
  const client = requireSupabase();
  const { data: memberships, error: memberError } = await client
    .from('group_members')
    .select('group_id');
  if (memberError) throw memberError;
  const ids = (memberships ?? []).map((row) => row.group_id as string);
  if (ids.length === 0) return [];
  const { data, error } = await client
    .from('groups')
    .select('*')
    .in('id', ids)
    .is('archived_at', null);
  if (error) throw error;
  return (data ?? []) as GroupRow[];
}

export async function rpcGetGroupLobby(groupId: string): Promise<LobbyRpcResponse> {
  const { data, error } = await requireSupabase().rpc('get_group_lobby', {
    p_group_id: groupId,
  });
  if (error) throw error;
  if (!data || typeof data !== 'object') {
    throw new Error('Lobby data was empty. Run migration 0003_fix_group_access.sql in Supabase.');
  }
  return data as LobbyRpcResponse;
}

export async function fetchGroup(groupId: string): Promise<GroupRow | null> {
  const { data, error } = await requireSupabase()
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .maybeSingle();
  if (error) throw error;
  return data as GroupRow | null;
}

export async function fetchGroupMembers(groupId: string): Promise<GroupMemberRow[]> {
  const { data, error } = await requireSupabase()
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as GroupMemberRow[];
}

export async function fetchMemberProfiles(userIds: string[]) {
  if (userIds.length === 0) return [];
  const { data, error } = await requireSupabase()
    .from('profiles')
    .select('id, display_name, avatar_key')
    .in('id', userIds);
  if (error) throw error;
  return data ?? [];
}
