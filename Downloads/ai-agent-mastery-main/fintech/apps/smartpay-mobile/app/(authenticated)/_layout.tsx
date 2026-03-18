/**
 * Authenticated layout – Stack with tabs and modals (lock, account).
 * Syncs backend profile to UserContext so test user (e.g. Pendapala Nekulilo) shows in UI.
 * Wraps with WalletsProvider, CopilotProvider, and GroupsProvider for app-wide state.
 * Location: fintech/smartpay/app/(authenticated)/_layout.tsx
 */
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useUser } from '@/contexts/UserContext';
import { WalletsProvider } from '@/contexts/WalletsContext';
import { CopilotProvider } from '@/contexts/copilot/CopilotContext';
import { GroupsProvider } from '@/contexts/GroupsContext';
import { CopilotConfirmationModal } from '@/components/copilot/CopilotConfirmationModal';
import { fetchProfile } from '@/services/profile';

export default function AuthenticatedLayout() {
  const { session } = useSupabaseAuth();
  const { setProfile } = useUser();

  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;
    fetchProfile()
      .then((data) => {
        if (cancelled || !data) return;
        const pol = data.proofOfLife;
        setProfile({
          id: data.userId || 'unknown',
          firstName: data.firstName ?? '',
          lastName: data.lastName ?? '',
          avatarUrl: data.avatarUrl ?? undefined,
          proofOfLifeDueDate: pol?.requiredBy != null ? String(pol.requiredBy) : undefined,
          lastProofOfLife: pol?.lastVerified != null ? String(pol.lastVerified) : undefined,
          status: data.kycTier,
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [session?.user?.id, setProfile]);

  return (
    <WalletsProvider>
      <CopilotProvider>
        <GroupsProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="profile" options={{ title: 'Me' }} />
            <Stack.Screen name="edit-profile" options={{ title: 'Edit profile' }} />
            <Stack.Screen name="kyc" options={{ title: 'Verify identity' }} />
            <Stack.Screen name="(modals)" />
          </Stack>
          
          {/* Global copilot confirmation modal */}
          <CopilotConfirmationModal />
        </GroupsProvider>
      </CopilotProvider>
    </WalletsProvider>
  );
}
