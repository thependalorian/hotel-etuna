import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="lock" options={{ animation: 'none', presentation: 'fullScreenModal' }} />
      <Stack.Screen name="account" options={{ presentation: 'transparentModal', animation: 'fade' }} />
    </Stack>
  );
}
