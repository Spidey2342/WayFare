export type CreateGroupResult = {
  groupId: string;
  alreadyExisted: boolean;
  idempotent?: boolean;
};

export function parseCreateGroupResult(data: unknown): CreateGroupResult {
  if (typeof data === 'string') {
    return { groupId: data, alreadyExisted: false };
  }
  if (data && typeof data === 'object' && 'group_id' in data) {
    const row = data as { group_id: string; already_existed?: boolean; idempotent?: boolean };
    return {
      groupId: row.group_id,
      alreadyExisted: !!row.already_existed,
      idempotent: !!row.idempotent,
    };
  }
  throw new Error('Unexpected create group response.');
}

export function friendlyCreateGroupError(error: unknown): string {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: string }).message)
      : '';
  const lower = message.toLowerCase();
  if (lower.includes('group_limit_reached')) {
    return 'You can own up to 5 active groups. Archive or leave one before creating another.';
  }
  if (lower.includes('rate_limit_exceeded')) {
    return 'You created several groups recently. Wait a bit and try again.';
  }
  if (lower.includes('invalid_name')) {
    return 'Group name must be 3 to 40 characters and include at least one letter or number.';
  }
  if (lower.includes('invalid_description')) {
    return 'Description must be 200 characters or less.';
  }
  return message || 'Could not create group.';
}

export function friendlyJoinGroupError(error: unknown): string {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: string }).message)
      : '';
  const lower = message.toLowerCase();
  if (lower.includes('join_rate_limited') || lower.includes('invalid_code')) {
    return 'That code did not work. Check with your leader and try again.';
  }
  return message || 'Could not join this group.';
}
