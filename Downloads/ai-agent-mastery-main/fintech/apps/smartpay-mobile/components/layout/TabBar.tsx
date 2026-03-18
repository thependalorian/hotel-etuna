/**
 * TabBar - Smartpay Copilot
 * 
 * Figma Specs: 72px height (Buffr spec)
 * 3 tabs only: Home, Activity, Copilot
 * 
 * Styling:
 * - Icon: 24px
 * - Label: 11px, weight 600
 * - Active indicator: 3px height
 * - Active color: primary text
 * - Inactive color: tertiary text
 * 
 * Props:
 * - state: Navigation state from React Navigation
 * - navigation: Navigation object
 * 
 * Location: components/layout/TabBar.tsx
 */
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { designSystem as DS } from '@/constants/designSystem';

type TabBarIconName = 
  | 'home-outline' 
  | 'home' 
  | 'bar-chart-outline' 
  | 'bar-chart' 
  | 'chatbubble-ellipses-outline' 
  | 'chatbubble-ellipses';

interface TabConfig {
  label: string;
  iconOutline: TabBarIconName;
  iconFilled: TabBarIconName;
}

const TAB_CONFIG: Record<string, TabConfig> = {
  'home': {
    label: 'Home',
    iconOutline: 'home-outline',
    iconFilled: 'home',
  },
  'activity': {
    label: 'Activity',
    iconOutline: 'bar-chart-outline',
    iconFilled: 'bar-chart',
  },
  'copilot': {
    label: 'Copilot',
    iconOutline: 'chatbubble-ellipses-outline',
    iconFilled: 'chatbubble-ellipses',
  },
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const config = TAB_CONFIG[route.name];
        
        if (!config) return null;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={`${config.label} tab`}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tab}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              {isFocused && <View style={styles.activeIndicator} />}
              
              <Ionicons
                name={isFocused ? config.iconFilled : config.iconOutline}
                size={DS.components.tabBar.iconSize}
                color={isFocused ? DS.colors.text : DS.colors.textTertiary}
              />
              
              <Text
                style={[
                  styles.label,
                  { color: isFocused ? DS.colors.text : DS.colors.textTertiary },
                ]}
              >
                {config.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: DS.components.tabBar.height,
    backgroundColor: DS.colors.background,
    borderTopWidth: 1,
    borderTopColor: DS.colors.borderLight,
    ...Platform.select({
      ios: {
        ...DS.shadows.sm,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: DS.spacing[1],
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: -DS.spacing[6],
    width: 40,
    height: DS.components.tabBar.activeIndicatorHeight,
    backgroundColor: DS.colors.text,
    borderRadius: DS.radius.pill,
  },
  label: {
    fontSize: DS.components.tabBar.labelSize,
    fontWeight: DS.typography.fontWeight.semibold,
    letterSpacing: 0.3,
  },
});
