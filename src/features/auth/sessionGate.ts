import type { AuthError, Session, SupabaseClient } from '@supabase/supabase-js';

export type SessionGateResult =
  | { status: 'none' }
  | { status: 'valid'; session: Session }
  | { status: 'offline'; session: Session }
  | { status: 'invalid' };

function isAuthSessionError(error: AuthError): boolean {
  if (error.status === 401 || error.status === 403) return true;
  const message = error.message.toLowerCase();
  return (
    message.includes('invalid') ||
    message.includes('expired') ||
    message.includes('refresh') ||
    message.includes('jwt') ||
    message.includes('user not found') ||
    message.includes('session')
  );
}

function isNetworkFailure(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (!error || typeof error !== 'object') return false;
  const message = 'message' in error ? String((error as { message: unknown }).message) : '';
  const lower = message.toLowerCase();
  return (
    lower.includes('network') ||
    lower.includes('fetch') ||
    lower.includes('failed') ||
    lower.includes('timeout') ||
    lower.includes('offline')
  );
}

/** Server-confirmed session check. Offline keeps the saved session until it expires locally. */
export async function evaluateSessionGate(client: SupabaseClient): Promise<SessionGateResult> {
  const {
    data: { session },
  } = await client.auth.getSession();
  if (!session) return { status: 'none' };

  const { data, error } = await client.auth.getUser();
  if (!error && data.user) {
    return { status: 'valid', session };
  }

  if (error && isAuthSessionError(error)) {
    return { status: 'invalid' };
  }

  if (error && isNetworkFailure(error)) {
    return { status: 'offline', session };
  }

  if (error) {
    return { status: 'invalid' };
  }

  return { status: 'invalid' };
}
