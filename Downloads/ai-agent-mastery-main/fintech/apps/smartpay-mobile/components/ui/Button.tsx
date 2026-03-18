/**
 * Button Component - Figma Primary CTA Spec
 * 
 * Location: mobile/components/ui/Button.tsx
 * Figma Node: Primary CTA (56px height)
 * 
 * Variants: primary, secondary, outline, ghost
 * States: default, pressed, disabled, loading
 * 
 * Features:
 * - Scale animation on press (0.98)
 * - Haptic feedback
 * - Loading state with spinner
 * - All values from designSystem.ts
 */

import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { designSystem as DS } from '@/constants/designSystem';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children?: React.ReactNode;
  title?: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Button({
  children,
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  isLoading = false,
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isActuallyLoading = isLoading || loading;
  const displayText = title || children;

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(scaleAnim, {
      toValue: DS.animations.buttonPress.scale,
      duration: DS.animations.buttonPress.duration,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (disabled || isActuallyLoading) return;
    
    const hapticMap: Record<ButtonVariant, Haptics.ImpactFeedbackStyle> = {
      primary: Haptics.ImpactFeedbackStyle.Medium,
      secondary: Haptics.ImpactFeedbackStyle.Light,
      outline: Haptics.ImpactFeedbackStyle.Light,
      ghost: Haptics.ImpactFeedbackStyle.Light,
    };
    
    Haptics.impactAsync(hapticMap[variant]);
    onPress();
  };

  const buttonStyles = [
    styles.base,
    styles[`variant_${variant}`],
    styles[`size_${size}`],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
    disabled && styles.textDisabled,
    textStyle,
  ];

  const iconColor = variant === 'primary' 
    ? DS.colors.background 
    : variant === 'secondary'
    ? DS.colors.text
    : DS.colors.primary;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={buttonStyles}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || isActuallyLoading}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || (typeof displayText === 'string' ? displayText : undefined)}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: disabled || isActuallyLoading }}
      >
        {isActuallyLoading ? (
          <ActivityIndicator
            color={variant === 'primary' ? DS.colors.background : DS.colors.primary}
          />
        ) : (
          <View style={styles.content}>
            {icon && (
              <Ionicons 
                name={icon} 
                size={20} 
                color={disabled ? DS.colors.textTertiary : iconColor} 
                style={displayText ? styles.iconWithText : undefined}
              />
            )}
            {displayText && <Text style={textStyles}>{displayText}</Text>}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DS.radius.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DS.spacing.sm,
  },
  iconWithText: {
    marginRight: DS.spacing.xs,
  },
  
  // ═══════════════════════════════════════════════════════════
  // VARIANTS
  // ═══════════════════════════════════════════════════════════
  variant_primary: {
    backgroundColor: DS.colors.primary,
    ...DS.shadows.md,
  },
  variant_secondary: {
    backgroundColor: DS.colors.surface,
    borderWidth: 1,
    borderColor: DS.colors.border,
    ...DS.shadows.sm,
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: DS.colors.primary,
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  },
  
  // ═══════════════════════════════════════════════════════════
  // SIZES - Figma Primary CTA = 56px (lg)
  // ═══════════════════════════════════════════════════════════
  size_sm: {
    height: DS.components.button.height.sm,
    paddingHorizontal: DS.spacing.md,
  },
  size_md: {
    height: DS.components.button.height.md,
    paddingHorizontal: DS.spacing.lg,
  },
  size_lg: {
    height: 56,
    paddingHorizontal: DS.spacing.lg,
  },
  
  // ═══════════════════════════════════════════════════════════
  // STATES
  // ═══════════════════════════════════════════════════════════
  disabled: {
    backgroundColor: DS.colors.border,
    opacity: 0.6,
  },
  
  // ═══════════════════════════════════════════════════════════
  // TEXT STYLES
  // ═══════════════════════════════════════════════════════════
  text: {
    fontWeight: DS.typography.fontWeight.semibold,
  },
  text_primary: {
    color: DS.colors.background,
  },
  text_secondary: {
    color: DS.colors.text,
  },
  text_outline: {
    color: DS.colors.primary,
  },
  text_ghost: {
    color: DS.colors.primary,
  },
  textDisabled: {
    color: DS.colors.textTertiary,
  },
  textSize_sm: {
    fontSize: DS.typography.fontSize.sm,
  },
  textSize_md: {
    fontSize: DS.typography.fontSize.base,
  },
  textSize_lg: {
    fontSize: DS.typography.fontSize.base,
  },
});
