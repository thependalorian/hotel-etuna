/**
 * Onboarding layout – no header, full-screen slides.
 * Location: fintech/smartpay/app/(onboarding)/_layout.tsx
 */
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
