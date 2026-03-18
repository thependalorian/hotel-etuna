/**
 * Send Money Stack Layout
 * 
 * Location: app/send-money/_layout.tsx
 * 
 * Navigation Flow:
 * 1. index → redirects to select-recipient
 * 2. select-recipient → amount
 * 3. amount → confirm
 * 4. confirm → [TwoFAModal] → success
 * 5. success → /(tabs)/home
 * 
 * Alternate Paths:
 * - select-recipient → scan-qr → amount
 * - Any screen → back navigation
 */

import { Stack } from 'expo-router';

export default function SendMoneyLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 300,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="select-recipient" />
      <Stack.Screen name="amount" />
      <Stack.Screen name="confirm" />
      <Stack.Screen name="success" options={{ gestureEnabled: false }} />
      <Stack.Screen
        name="scan-qr"
        options={{
          presentation: 'fullScreenModal',
          animation: 'fade',
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}
