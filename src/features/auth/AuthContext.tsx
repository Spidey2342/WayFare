import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { rpcEnsureProfile } from '@/features/auth/ensureProfileApi';
import { activateUserSession, clearActiveUserSession } from '@/features/auth/userSession';
import { isSupabaseConfigured, requireSupabase, type ProfileRow } from '@/services/supabase';
import { useAppStore } from '@/store';

import { setSignedInPersistUser } from '@/store/signedInPersist';

interface AuthContextValue {
  ready: boolean;
  session: Session | null;
  user: User | null;
  profile: ProfileRow | null;
  isGuest: boolean;
  continueAsGuest: () => void;
  refreshProfile: () => Promise<void>;
  setProfileLocal: (patch: Partial<ProfileRow>) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function bootstrapSignedInUser(userId: string): Promise<ProfileRow | null> {
  await activateUserSession(userId);
  const ensured = await rpcEnsureProfile(userId);
  return ensured?.profile ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(!isSupabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [isGuest, setIsGuest] = useState(!isSupabaseConfigured);

  const refreshProfile = async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setProfile(null);
      return;
    }
    const row = await bootstrapSignedInUser(userId);
    setProfile(row);
  };

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const client = requireSupabase();
    let mounted = true;

    client.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setIsGuest(!data.session);
      setReady(true);
    });

    const { data: sub } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsGuest(!nextSession);
      if (!nextSession) setProfile(null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setSignedInPersistUser(session?.user?.id ?? null);
  }, [session?.user?.id]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || isGuest) return undefined;
    let cancelled = false;
    void bootstrapSignedInUser(userId).then((row) => {
      if (!cancelled) setProfile(row);
    });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, isGuest]);

  const setProfileLocal = (patch: Partial<ProfileRow>) => {
    setProfile((current) => (current ? { ...current, ...patch } : null));
  };

  const continueAsGuest = () => {
    setIsGuest(true);
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await requireSupabase().auth.signOut();
    }
    await clearActiveUserSession();
    useAppStore.getState().clearUserSessionState();
    setSession(null);
    setProfile(null);
    setIsGuest(true);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      session,
      user: session?.user ?? null,
      profile,
      isGuest,
      continueAsGuest,
      refreshProfile,
      setProfileLocal,
      signOut,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, session, profile, isGuest],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
