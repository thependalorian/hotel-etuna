import { Stack } from 'expo-router';

export default function CopilotTabLayout() {
  return <Stack screenOptions={{ headerTitle: 'Copilot', headerShadowVisible: false }}><Stack.Screen name="index" /></Stack>;
}
