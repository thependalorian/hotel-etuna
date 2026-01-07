/**
 * SearchBar Component
 * 
 * Location: components/SearchBar.tsx
 * Purpose: Reusable search bar with notification and profile icons
 * 
 * Displays search input with notification bell and profile avatar
 */

import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import ProfileAvatar from './ProfileAvatar';

interface SearchBarProps {
  placeholder?: string;
  onSearchChange?: (text: string) => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  profileImageUri?: string;
}

export default function SearchBar({
  placeholder = 'Search anything...',
  onSearchChange,
  onNotificationPress,
  onProfilePress,
  profileImageUri,
}: SearchBarProps) {
  return (
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
}

const styles = StyleSheet.create({
  searchContainer: {
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
    marginLeft: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
