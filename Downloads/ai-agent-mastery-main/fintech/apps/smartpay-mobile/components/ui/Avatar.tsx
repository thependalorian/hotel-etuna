/**
 * Avatar Component - Multiple Sizes
 * 
 * Location: mobile/components/ui/Avatar.tsx
 * Figma Specs: Header (36px), Lists (40px), Success (96px)
 * 
 * Sizes: sm(32), md(40), lg(56), xl(72), xxl(96)
 * 
 * Features:
 * - Image support with URI
 * - Fallback to initials if no image
 * - Circular shape
 * - Optional press handler
 * - Touch target expansion for small sizes
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { designSystem as DS } from '@/constants/designSystem';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

interface AvatarProps {
  size?: AvatarSize;
  uri?: string | null;
  initials?: string;
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function Avatar({
  size = 'md',
  uri,
  initials,
  onPress,
  style,
  accessibilityLabel,
}: AvatarProps) {
  const sizeValue = DS.components.avatar[size];
  const fontSize = Math.floor(sizeValue * 0.4);
  const needsHitSlop = sizeValue < 44;
  const hitSlopValue = needsHitSlop ? Math.ceil((44 - sizeValue) / 2) : 0;

  const avatarStyle = [
    styles.container,
    {
      width: sizeValue,
      height: sizeValue,
      borderRadius: sizeValue / 2,
    },
    style,
  ];

  const content = (
    <View style={avatarStyle}>
      {uri ? (
        <Image
          source={{ uri }}
          style={styles.image}
          accessibilityIgnoresInvertColors
        />
      ) : initials ? (
        <View style={styles.initialsContainer}>
          <Text style={[styles.initials, { fontSize }]}>
            {initials.substring(0, 2).toUpperCase()}
          </Text>
        </View>
      ) : (
        <View style={styles.initialsContainer}>
          <Text style={[styles.initials, { fontSize }]}>?</Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        hitSlop={{
          top: hitSlopValue,
          bottom: hitSlopValue,
          left: hitSlopValue,
          right: hitSlopValue,
        }}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || 'Avatar'}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: DS.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initialsContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DS.colors.primary,
  },
  initials: {
    color: DS.colors.background,
    fontWeight: DS.typography.fontWeight.semibold,
  },
});
