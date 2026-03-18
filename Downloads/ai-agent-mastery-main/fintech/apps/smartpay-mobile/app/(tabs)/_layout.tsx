/**
 * Tab Layout - Smartpay Copilot
 * 
 * Design Specs (from SKILL.md):
 * - Only 3 tabs: Home | Activity | Copilot
 * - TabBar height: 72px
 * - Icon size: 24px
 * - Label size: 11px (font weight 600)
 * - Active color: primary (#020617)
 * - Inactive color: tertiary (#94A3B8)
 * 
 * Location: app/(tabs)/_layout.tsx
 */
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { designSystem as DS } from '@/constants/designSystem';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: DS.colors.primary,
        tabBarInactiveTintColor: DS.colors.textTertiary,
        tabBarStyle: {
          height: DS.components.tabBar.height,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: DS.colors.borderLight,
          backgroundColor: DS.colors.background,
        },
        tabBarLabelStyle: {
          fontSize: DS.components.tabBar.labelSize,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}
    >
      {/* Hidden index route */}
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />

      {/* Tab 1: Home */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Ionicons 
              name="home" 
              size={DS.components.tabBar.iconSize} 
              color={color} 
            />
          ),
        }}
      />

      {/* Tab 2: Activity */}
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color }) => (
            <Ionicons 
              name="bar-chart" 
              size={DS.components.tabBar.iconSize} 
              color={color} 
            />
          ),
        }}
      />

      {/* Tab 3: Copilot */}
      <Tabs.Screen
        name="copilot"
        options={{
          title: 'Copilot',
          tabBarIcon: ({ color }) => (
            <Ionicons 
              name="chatbubbles" 
              size={DS.components.tabBar.iconSize} 
              color={color} 
            />
          ),
        }}
      />

      {/* Hidden tabs - accessed via navigation, not tab bar */}
      <Tabs.Screen
        name="transactions"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="wallets"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
