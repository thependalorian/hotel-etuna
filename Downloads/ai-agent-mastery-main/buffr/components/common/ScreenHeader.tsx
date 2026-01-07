/**
 * Screen Header Component
 * 
 * Location: components/common/ScreenHeader.tsx
 * Purpose: Reusable header component for consistent navigation across all screens
 * 
 * Features:
 * - Back button with optional custom styling
 * - Centered title
 * - Optional right action button
 * - Consistent padding and spacing
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showBackButton?: boolean;
  backButtonStyle?: 'default' | 'circular';
}

export default function ScreenHeader({
  title,
  onBack,
  rightAction,
  showBackButton = true,
  backButtonStyle = 'default',
}: ScreenHeaderProps) {
  const backButtonContent = showBackButton && onBack ? (
    <TouchableOpacity
      style={[
        styles.backButton,
        backButtonStyle === 'circular' && styles.backButtonCircular,
      ]}
      onPress={onBack}
      activeOpacity={0.7}
    >
      <FontAwesome name="arrow-left" size={20} color={Colors.text} />
    </TouchableOpacity>
  ) : (
    <View style={styles.placeholder} />
  );

  return (
    <View style={styles.header}>
      {backButtonContent}
      <Text style={styles.headerTitle}>{title}</Text>
      {rightAction || <View style={styles.placeholder} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonCircular: {
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
});
