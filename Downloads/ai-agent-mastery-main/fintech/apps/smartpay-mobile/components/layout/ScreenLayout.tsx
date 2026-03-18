/**
 * ScreenLayout - Smartpay Copilot
 * 
 * Standard screen wrapper with SafeAreaView, optional header, and status bar config
 * 
 * Props:
 * - children: Screen content
 * - showHeader: Include AppHeader
 * - headerProps: Props to pass to AppHeader
 * - backgroundColor: Screen background color
 * 
 * Location: components/layout/ScreenLayout.tsx
 */
import React, { ReactNode } from 'react';
import { View, StyleSheet, StatusBar, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader, AppHeaderProps } from './AppHeader';
import { designSystem as DS } from '@/constants/designSystem';

export interface ScreenLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  headerProps?: AppHeaderProps;
  backgroundColor?: string;
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>;
}

export function ScreenLayout({
  children,
  showHeader = false,
  headerProps,
  backgroundColor = DS.colors.background,
  edges = ['top', 'bottom'],
}: ScreenLayoutProps) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={edges}>
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
      
      {showHeader && headerProps && <AppHeader {...headerProps} />}
      
      <View style={styles.content}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
