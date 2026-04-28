'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';

type AuthGateContextValue = {
  isAuthenticated: boolean;
};

const AuthGateContext = createContext<AuthGateContextValue>({ isAuthenticated: false });

/**
 * AuthGateProvider
 *
 * Purpose: Exposes public auth gate state for price/action visibility checks.
 * Location: /components/providers/AuthGateProvider.tsx
 */
export function AuthGateProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  return (
    <AuthGateContext.Provider value={{ isAuthenticated }}>
      {children}
    </AuthGateContext.Provider>
  );
}

export function useAuthGate() {
  return useContext(AuthGateContext);
}
