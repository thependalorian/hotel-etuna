/**
 * Auth group – redirects to app. Sign-in/sign-up removed; go straight to app.
 * Location: fintech/smartpay/app/(auth)/_layout.tsx
 */
import { Redirect, Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
