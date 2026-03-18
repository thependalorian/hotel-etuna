/**
 * SupabaseAuthContext – Smartpay.
 * Provides session, user, signIn, signUp, signOut using Buffr Connect Supabase.
 * Syncs access_token to secure storage so backend API calls work.
 * Location: fintech/smartpay/contexts/SupabaseAuthContext.tsx
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getSecureItem, setSecureItem, removeSecureItem, getAccessTokenKey } from '@/services/secureStorage';

interface SupabaseAuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export const SupabaseAuthContext = createContext<SupabaseAuthContextValue | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      syncTokenToSecureStorage(s?.access_token ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      syncTokenToSecureStorage(s?.access_token ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function syncTokenToSecureStorage(accessToken: string | null) {
    const key = getAccessTokenKey();
    if (accessToken) {
      await setSecureItem(key, accessToken);
    } else {
      await removeSecureItem(key);
    }
  }

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ?? null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await removeSecureItem(getAccessTokenKey());
  };

  const value: SupabaseAuthContextValue = {
    session,
    user,
    isLoading,
    signInWithPassword,
    signUp,
    signOut,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuth(): SupabaseAuthContextValue {
  const ctx = useContext(SupabaseAuthContext);
  if (!ctx) throw new Error('useSupabaseAuth must be used within SupabaseAuthProvider');
  return ctx;
}
