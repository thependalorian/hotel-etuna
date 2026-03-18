/**
 * UserInactivityProvider – Smartpay.
 * Locks app when returning from background after threshold (e.g. 3s) when signed in.
 * PRD §4.7.2. Uses AppState + inactivityStorage (MMKV or SecureStore in Expo Go).
 * Auth: Supabase only; pass isSignedIn from session (e.g. !!session).
 * Location: fintech/smartpay/contexts/UserInactivityContext.tsx
 */
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getInactivityTime, setInactivityTime } from '@/services/inactivityStorage';

const THRESHOLD_MS = 3000;

interface UserInactivityProviderProps {
  children: React.ReactNode;
  /** Signed-in state from Supabase session (e.g. !!session). */
  isSignedIn?: boolean;
}

export function UserInactivityProvider({ children, isSignedIn = false }: UserInactivityProviderProps) {
  const appState = useRef(AppState.currentState);
  const router = useRouter();

  useEffect(() => {
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [isSignedIn]);

  async function handleAppStateChange(nextAppState: AppStateStatus) {
    if (nextAppState === 'background') {
      await setInactivityTime(Date.now());
    } else if (nextAppState === 'active' && appState.current.match(/inactive|background/)) {
      const start = await getInactivityTime() ?? 0;
      const elapsed = Date.now() - start;
      if (elapsed > THRESHOLD_MS && isSignedIn) {
        router.replace('/(authenticated)/(modals)/lock');
      }
    }
    appState.current = nextAppState;
  }

  return <>{children}</>;
}
