/**
 * Glass Header Component
 * 
 * Location: components/GlassHeader.tsx
 * Purpose: Header with glass effect (blurred background) containing search bar, notifications, and profile
 * 
 * Features:
 * - Translucent blurred background
 * - Search bar with placeholder
 * - Notification bell icon
 * - Profile avatar
 */

import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
// @ts-ignore - expo-blur types may not be available
import { BlurView } from 'expo-blur';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import ProfileAvatar from './ProfileAvatar';

interface GlassHeaderProps {
  placeholder?: string;
  onSearchChange?: (text: string) => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  profileImageUri?: string;
}

export default function GlassHeader({
  placeholder = 'Search anything...',
  onSearchChange,
  onNotificationPress,
  onProfilePress,
  profileImageUri,
}: GlassHeaderProps) {
  const content = (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <FontAwesome 
          name="search" 
          size={18} 
          color={Colors.textSecondary} 
          style={styles.searchIcon} 
        />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={Colors.textSecondary}
          style={styles.searchInput}
          onChangeText={onSearchChange}
        />
      </View>
      <View style={styles.headerIcons}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={onNotificationPress}
          activeOpacity={0.7}
        >
          <FontAwesome name="bell" size={20} color={Colors.text} />
        </TouchableOpacity>
        <ProfileAvatar 
          size={36}
          imageUri={profileImageUri}
          onPress={onProfilePress}
        />
      </View>
    </View>
  );

  // Use BlurView on iOS, fallback to semi-transparent background on Android
  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={80} tint="light" style={styles.blurContainer}>
        {content}
      </BlurView>
    );
  }

  return (
    <View style={[styles.blurContainer, styles.androidBlur]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  androidBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  searchIcon: {
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
