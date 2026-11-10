import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { rpcEnsureProfile } from '@/features/auth/ensureProfileApi';
import { evaluateSessionGate } from '@/features/auth/sessionGate';
import { useSessionGateTick } from '@/features/auth/useSessionGateTick';
import { activateUserSession, clearAllUserLocalData } from '@/features/auth/userSession';
import { isSupabaseConfigured, requireSupabase, type ProfileRow } from '@/services/supabase';
import { useAppStore } from '@/store';

import { setSignedInPersistUser } from '@/store/signedInPersist';

interface AuthContextValue {
  ready: boolean;
  sessionChecking: boolean;
  session: Session | null;
  user: User | null;
  profile: ProfileRow | null;
  refreshProfile: () => Promise<void>;
  setProfileLocal: (patch: Partial<ProfileRow>) => void;
  signOut: () => Promise<void>;
  runSessionGate: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function bootstrapSignedInUser(userId: string): Promise<ProfileRow | null> {
  await activateUserSession(userId);
  const ensured = await rpcEnsureProfile(userId);
  return ensured?.profile ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(!isSupabaseConfigured);
  const [sessionChecking, setSessionChecking] = useState(isSupabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const initialGateDoneRef = useRef(false);

  const signOutLocal = useCallback(async () => {
    await clearAllUserLocalData();
    useAppStore.getState().clearUserSessionState();
    setSignedInPersistUser(null);
    setSession(null);
    setProfile(null);
  }, []);

  const runSessionGate = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setReady(true);
      setSessionChecking(false);
      return;
    }

    const isInitial = !initialGateDoneRef.current;
    if (isInitial) setSessionChecking(true);
    try {
      const client = requireSupabase();
      const gate = await evaluateSessionGate(client);

      if (gate.status === 'none' || gate.status === 'invalid') {
        if (gate.status === 'invalid') {
          await client.auth.signOut().catch(() => undefined);
        }
        await signOutLocal();
        return;
      }

      setSession(gate.session);
      setSignedInPersistUser(gate.session.user.id);
      await activateUserSession(gate.session.user.id);

      if (gate.status === 'valid' || gate.status === 'offline') {
        try {
          const row = await bootstrapSignedInUser(gate.session.user.id);
          setProfile(row);
        } catch {
          if (gate.status === 'offline') {
            setProfile((current) => current);
          }
        }
      }
    } finally {
      setReady(true);
      if (isInitial) {
        initialGateDoneRef.current = true;
        setSessionChecking(false);
      }
    }
  }, [signOutLocal]);

  useSessionGateTick(() => {
    void runSessionGate();
  });

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    const client = requireSupabase();
    const { data: sub } = client.auth.onAuthStateChange(() => {
      void runSessionGate();
    });
    return () => sub.subscription.unsubscribe();
  }, [runSessionGate]);

  const refreshProfile = async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setProfile(null);
      return;
    }
    const row = await bootstrapSignedInUser(userId);
    setProfile(row);
  };

  const setProfileLocal = (patch: Partial<ProfileRow>) => {
    setProfile((current) => (current ? { ...current, ...patch } : null));
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await requireSupabase()
        .auth.signOut()
        .catch(() => undefined);
    }
    await signOutLocal();
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      sessionChecking,
      session,
      user: session?.user ?? null,
      profile,
      refreshProfile,
      setProfileLocal,
      signOut,
      runSessionGate,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, sessionChecking, session, profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
