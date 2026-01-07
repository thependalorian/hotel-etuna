/**
 * ProfileAvatar Component
 * 
 * Location: components/ProfileAvatar.tsx
 * Purpose: Reusable user profile picture/avatar component
 * 
 * Displays user profile picture or placeholder with user icon
 */

import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';

interface ProfileAvatarProps {
  size?: number;
  imageUri?: string;
  onPress?: () => void;
}

export default function ProfileAvatar({ 
  size = 36, 
  imageUri, 
  onPress 
}: ProfileAvatarProps) {
  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <TouchableOpacity 
      style={[styles.avatarButton, avatarStyle]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {imageUri ? (
        <Image 
          source={{ uri: imageUri }} 
          style={[styles.avatarImage, avatarStyle]}
        />
      ) : (
        <View style={[styles.avatar, avatarStyle]}>
          <FontAwesome name="user" size={size * 0.5} color={Colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  avatarButton: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  avatar: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
});
