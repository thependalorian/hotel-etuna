/**
 * HapticButton – Button component with built-in haptic feedback.
 * Provides different haptic styles based on button variant.
 * PRD §6.6. Location: fintech/smartpay/components/ui/HapticButton.tsx
 */
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { useHaptics, HapticFeedbackType } from '@/hooks/useHaptics';
import { designSystem } from '@/constants/designSystem';

export type HapticButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type HapticButtonSize = 'sm' | 'md' | 'lg';

interface HapticButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  title: string;
  onPress: () => void;
  variant?: HapticButtonVariant;
  size?: HapticButtonSize;
  hapticType?: HapticFeedbackType;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function HapticButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  hapticType,
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  ...props
}: HapticButtonProps) {
  const haptics = useHaptics();

  const handlePress = () => {
    if (disabled || isLoading) return;

    const feedbackType = hapticType || getDefaultHapticForVariant(variant);
    haptics.trigger(feedbackType);
    onPress();
  };

  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`text_${size}`],
    disabled && styles.textDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handlePress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? '#fff' : designSystem.colors.brand.primary}
        />
      ) : (
        <>
          {icon}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

function getDefaultHapticForVariant(variant: HapticButtonVariant): HapticFeedbackType {
  switch (variant) {
    case 'primary':
      return 'medium';
    case 'secondary':
      return 'light';
    case 'outline':
      return 'light';
    case 'ghost':
      return 'light';
    case 'danger':
      return 'warning';
    default:
      return 'light';
  }
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: designSystem.radius.md,
    gap: designSystem.spacing.sm,
    ...designSystem.shadows.sm,
  },
  primary: {
    backgroundColor: designSystem.colors.brand.primary,
  },
  secondary: {
    backgroundColor: designSystem.colors.neutral.muted,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: designSystem.colors.brand.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: designSystem.colors.semantic.error,
  },
  disabled: {
    opacity: 0.5,
  },
  size_sm: {
    paddingVertical: designSystem.spacing.sm,
    paddingHorizontal: designSystem.spacing.md,
    minHeight: 36,
  },
  size_md: {
    paddingVertical: designSystem.spacing.md,
    paddingHorizontal: designSystem.spacing.lg,
    minHeight: 48,
  },
  size_lg: {
    paddingVertical: designSystem.spacing.lg,
    paddingHorizontal: designSystem.spacing.xl,
    minHeight: 56,
  },
  text: {
    ...designSystem.typography.textStyles.button,
  },
  text_primary: {
    color: '#ffffff',
  },
  text_secondary: {
    color: designSystem.colors.neutral.text,
  },
  text_outline: {
    color: designSystem.colors.brand.primary,
  },
  text_ghost: {
    color: designSystem.colors.brand.primary,
  },
  text_danger: {
    color: '#ffffff',
  },
  textDisabled: {
    opacity: 0.7,
  },
  text_sm: {
    fontSize: 14,
  },
  text_md: {
    fontSize: 16,
  },
  text_lg: {
    fontSize: 18,
  },
});
