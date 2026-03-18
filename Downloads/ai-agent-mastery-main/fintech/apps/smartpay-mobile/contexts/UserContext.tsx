/**
 * UserContext – Smartpay.
 * Provides current user profile for Copilot and app. Replace with real auth when backend is connected.
 * Location: fintech/smartpay/contexts/UserContext.tsx
 */
import React, { createContext, useContext, useState, useMemo } from 'react';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  photoUri?: string;
  phone?: string;
  proofOfLifeDueDate?: string;
  lastProofOfLife?: string;
  status?: string;
  inviteCode?: string;
  inviteLink?: string;
}

interface UserContextValue {
  profile: UserProfile | null;
  user: (UserProfile & { smartpayId?: string; name?: string }) | null;
  setProfile: (p: UserProfile | null) => void;
  /** Set backend smartpay id after OTP verify (updates profile.id so derived smartpayId is correct). */
  setSmartpayId: (smartpayId: string) => void;
  /** Clear profile from context (call after sign out so UI state is reset). */
  clearUser: () => void;
  isAuthenticated: boolean;
  cardNumberMasked: string | null;
  proofOfLifeDueDate: string | null;
  walletStatus: 'active' | 'frozen' | 'suspended' | null;
  smartpayId?: string;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(() => ({
    id: 'dev-user-1',
    firstName: 'User',
    lastName: '',
    inviteCode: 'SMART2024',
    inviteLink: 'https://smartpay.na/invite/SMART2024',
  }));

  const clearUser = useMemo(() => () => setProfile(null), []);

  const setSmartpayId = useMemo(
    () => (smartpayId: string) => {
      setProfile((prev) =>
        prev
          ? { ...prev, id: smartpayId }
          : { id: smartpayId, firstName: '', lastName: '' }
      );
    },
    []
  );

  const smartpayId = profile ? `SP-${profile.id.slice(-8).padStart(8, '0')}` : undefined;
  const userName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : undefined;

  const value = useMemo(
    () => ({
      profile,
      user: profile ? {
        ...profile,
        smartpayId,
        name: userName,
      } : null,
      setProfile,
      setSmartpayId,
      clearUser,
      isAuthenticated: !!profile?.id,
      cardNumberMasked: profile ? '**** **** **** 1234' : null,
      proofOfLifeDueDate: profile?.proofOfLifeDueDate ?? null,
      walletStatus: profile ? (profile.status === 'frozen' ? 'frozen' : 'active') : null,
      smartpayId,
    }),
    [profile, smartpayId, userName, clearUser, setSmartpayId]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
