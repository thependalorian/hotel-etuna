/**
 * BottomSheet Component - Figma Modal Pattern
 * 
 * Location: mobile/components/ui/BottomSheet.tsx
 * Figma Specs: 24px top radius, spring animation
 * 
 * Features:
 * - Backdrop with opacity 0.25
 * - Handle (36×5px)
 * - Spring slide-up animation (250ms)
 * - Drag-to-dismiss gesture support
 * - Haptic feedback on open/close
 * - Configurable max height
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  PanResponder,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { designSystem as DS } from '@/constants/designSystem';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  maxHeight?: string;
  style?: ViewStyle;
  children: React.ReactNode;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  maxHeight = '60%',
  style,
  children,
}: BottomSheetProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const gestureState = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          Animated.event([null, { dy: translateY }], {
            useNativeDriver: false,
          })(_, gestureState);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            ...DS.animations.springBounce,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        ...DS.animations.springBounce,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: DS.animations.normal,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel="Close bottom sheet"
        />
        <Animated.View
          style={[
            styles.sheet,
            { maxHeight: maxHeight as any, transform: [{ translateY }] },
            style,
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handle} />
          {title && <Text style={styles.title}>{title}</Text>}
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  sheet: {
    backgroundColor: DS.colors.background,
    borderTopLeftRadius: DS.radius.lg,
    borderTopRightRadius: DS.radius.lg,
    paddingTop: DS.spacing.sm,
    paddingHorizontal: DS.spacing.md,
    paddingBottom: DS.spacing.xl,
  },
  handle: {
    width: DS.components.bottomSheet.handleWidth,
    height: DS.components.bottomSheet.handleHeight,
    backgroundColor: DS.colors.border,
    borderRadius: DS.radius.sm,
    alignSelf: 'center',
    marginBottom: DS.spacing.md,
  },
  title: {
    fontSize: DS.typography.fontSize.lg,
    fontWeight: DS.typography.fontWeight.bold,
    color: DS.colors.text,
    textAlign: 'center',
    marginBottom: DS.spacing.md,
  },
  content: {
    flexShrink: 1,
  },
});
