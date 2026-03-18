import { Stack } from 'expo-router';
import { AppProviders } from '@/contexts/AppProviders';
import { SupabaseAuthProvider, useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { UserInactivityProvider } from '@/contexts/UserInactivityContext';

function RootLayoutContent() {
  const { session } = useSupabaseAuth();
  
  return (
    <UserInactivityProvider isSignedIn={!!session}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(authenticated)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
      </Stack>
    </UserInactivityProvider>
  );
}

export default function RootLayout() {
  return (
    <SupabaseAuthProvider>
      <AppProviders>
        <RootLayoutContent />
      </AppProviders>
    </SupabaseAuthProvider>
  );
}
