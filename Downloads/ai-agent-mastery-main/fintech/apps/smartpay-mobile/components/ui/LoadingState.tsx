/**
 * LoadingState Component - Skeleton Shimmer
 * 
 * Location: mobile/components/ui/LoadingState.tsx
 * 
 * Variants: spinner, card, list, text
 * 
 * Features:
 * - Shimmer animation (2000ms loop)
 * - Multiple skeleton types
 * - Reusable skeleton blocks
 */

import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Animated, ViewStyle } from 'react-native';
import { designSystem as DS } from '@/constants/designSystem';

export type LoadingVariant = 'spinner' | 'card' | 'list' | 'text';

interface LoadingStateProps {
  variant?: LoadingVariant;
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
  count?: number;
}

export function LoadingState({
  variant = 'spinner',
  size = 'large',
  color = DS.colors.primary,
  style,
  count = 3,
}: LoadingStateProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (variant !== 'spinner') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [variant]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  if (variant === 'spinner') {
    return (
      <View style={[styles.spinnerContainer, style]}>
        <ActivityIndicator size={size} color={color} />
      </View>
    );
  }

  if (variant === 'card') {
    return (
      <View style={[styles.container, style]}>
        {Array.from({ length: count }).map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.skeletonCard,
              { opacity: shimmerOpacity },
            ]}
          >
            <View style={styles.skeletonCircle} />
            <View style={styles.skeletonTextContainer}>
              <View style={styles.skeletonTextLarge} />
              <View style={styles.skeletonTextSmall} />
            </View>
          </Animated.View>
        ))}
      </View>
    );
  }

  if (variant === 'list') {
    return (
      <View style={[styles.container, style]}>
        {Array.from({ length: count }).map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.skeletonListItem,
              { opacity: shimmerOpacity },
            ]}
          >
            <View style={styles.skeletonCircleSmall} />
            <View style={styles.skeletonListTextContainer}>
              <View style={styles.skeletonTextMedium} />
              <View style={styles.skeletonTextSmall} />
            </View>
          </Animated.View>
        ))}
      </View>
    );
  }

  if (variant === 'text') {
    return (
      <View style={[styles.container, style]}>
        {Array.from({ length: count }).map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.skeletonText,
              { opacity: shimmerOpacity },
              index === count - 1 && { width: '60%' },
            ]}
          />
        ))}
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  spinnerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: DS.spacing.xl,
  },
  container: {
    padding: DS.spacing.md,
  },
  
  // ═══════════════════════════════════════════════════════════
  // CARD SKELETON
  // ═══════════════════════════════════════════════════════════
  skeletonCard: {
    flexDirection: 'row',
    padding: DS.spacing.md,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.md,
    marginBottom: DS.spacing.md,
    alignItems: 'center',
  },
  skeletonCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: DS.colors.surfaceVariant,
  },
  skeletonTextContainer: {
    flex: 1,
    marginLeft: DS.spacing.md,
    gap: DS.spacing.sm,
  },
  skeletonTextLarge: {
    height: 20,
    width: '70%',
    backgroundColor: DS.colors.surfaceVariant,
    borderRadius: DS.radius.sm,
  },
  skeletonTextSmall: {
    height: 16,
    width: '50%',
    backgroundColor: DS.colors.surfaceVariant,
    borderRadius: DS.radius.sm,
  },
  
  // ═══════════════════════════════════════════════════════════
  // LIST SKELETON
  // ═══════════════════════════════════════════════════════════
  skeletonListItem: {
    flexDirection: 'row',
    paddingVertical: DS.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DS.colors.borderLight,
    alignItems: 'center',
  },
  skeletonCircleSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DS.colors.surfaceVariant,
  },
  skeletonListTextContainer: {
    flex: 1,
    marginLeft: DS.spacing.md,
    gap: DS.spacing.xs,
  },
  skeletonTextMedium: {
    height: 18,
    width: '60%',
    backgroundColor: DS.colors.surfaceVariant,
    borderRadius: DS.radius.sm,
  },
  
  // ═══════════════════════════════════════════════════════════
  // TEXT SKELETON
  // ═══════════════════════════════════════════════════════════
  skeletonText: {
    height: 16,
    width: '100%',
    backgroundColor: DS.colors.surfaceVariant,
    borderRadius: DS.radius.sm,
    marginBottom: DS.spacing.sm,
  },
});
