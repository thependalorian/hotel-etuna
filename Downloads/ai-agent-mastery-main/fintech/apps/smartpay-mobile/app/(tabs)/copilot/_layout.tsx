/**
 * Copilot tab layout – sets header title to "Copilot".
 * Location: fintech/smartpay/app/(tabs)/copilot/_layout.tsx
 */
import { Stack } from 'expo-router';

export default function CopilotTabLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitle: 'Copilot',
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
