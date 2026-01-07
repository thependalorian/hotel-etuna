/**
 * Animated Receipt View Wrapper
 * 
 * Location: components/transactions/AnimatedReceiptView.tsx
 * Purpose: Wrapper component for ReceiptView with fade-in animation
 * 
 * Uses react-native-reanimated for smooth animations
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import ReceiptView, { type ReceiptViewProps } from './ReceiptView';

interface AnimatedReceiptViewProps extends ReceiptViewProps {}

export default function AnimatedReceiptView(props: AnimatedReceiptViewProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
    translateY.value = withTiming(0, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <ReceiptView {...props} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
