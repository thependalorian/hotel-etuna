import React, { useState } from 'react';
import { SymbolView } from 'expo-symbols';
import { Link, Tabs, useRouter } from 'expo-router';
import { Pressable, Image } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useUser } from '@/contexts/UserContext';
import { AppHeader } from '@/components/layout/AppHeader';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
function getAvatarSource(avatarUrl: string | undefined) {
  if (!avatarUrl) return null;
  if (avatarUrl === '/avatars/pendo-avatar.png') return require('@/assets/images/pendo-avatar.png');
  return { uri: avatarUrl.startsWith('http') ? avatarUrl : `${API_BASE}${avatarUrl}` };
}

function HomeHeader() {
  const router = useRouter();
  const { profile } = useUser();
  const [searchValue, setSearchValue] = useState('');
  const initials = profile?.firstName && profile?.lastName
    ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
    : profile?.firstName?.[0]?.toUpperCase() ?? 'U';

  return (
    <AppHeader
      showSearch
      searchPlaceholder="Search..."
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      onNotificationPress={() => {}}
      onAvatarPress={() => router.push('/(authenticated)/profile')}
      avatarUri={profile?.avatarUrl}
      avatarInitials={initials}
    />
  );
}

export default function AuthenticatedTabLayout() {
  const colorScheme = useColorScheme();
  const tint = colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint;
  const textColor = colorScheme === 'dark' ? Colors.dark.text : Colors.light.text;
  const { profile } = useUser();
  const avatarSource = getAvatarSource(profile?.avatarUrl);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tint,
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="copilot"
        options={{
          title: 'Copilot',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'bubble.left.and.bubble.right', android: 'chat', web: 'chat' }} tintColor={color} size={28} />
          ),
          headerRight: () => (
            <Link href="/(authenticated)/profile" asChild>
              <Pressable style={{ marginRight: 16 }} accessibilityLabel="Profile">
                {({ pressed }) =>
                  avatarSource ? (
                    <Image source={avatarSource} style={{ width: 32, height: 32, borderRadius: 16, opacity: pressed ? 0.5 : 1 }} resizeMode="cover" />
                  ) : (
                    <SymbolView name={{ ios: 'person.circle', android: 'person', web: 'person' }} size={26} tintColor={textColor} style={{ opacity: pressed ? 0.5 : 1 }} />
                  )
                }
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          header: () => <HomeHeader />,
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'house.fill', android: 'home', web: 'home' }} tintColor={color} size={28} />
          ),
        }}
      />
      <Tabs.Screen
        name="transfers"
        options={{
          title: 'Transfers',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'arrow.left.arrow.right', android: 'swap_horiz', web: 'swap_horiz' }} tintColor={color} size={28} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'list.bullet', android: 'list', web: 'list' }} tintColor={color} size={28} />
          ),
        }}
      />
      <Tabs.Screen name="invest" options={{ href: null }} />
    </Tabs>
  );
}
