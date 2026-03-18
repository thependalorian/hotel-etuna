/**
 * Tabs index – redirect only (not a visible tab).
 * When the app or a link navigates to "/(tabs)", this route redirects to "/(tabs)/home".
 * Do not remove: without it, "/(tabs)" would show a blank or missing screen.
 * The visible tab bar is defined in (tabs)/_layout.tsx.
 */
import { Redirect } from 'expo-router';

export default function TabsIndex() {
  return <Redirect href="/(tabs)/home" />;
}
