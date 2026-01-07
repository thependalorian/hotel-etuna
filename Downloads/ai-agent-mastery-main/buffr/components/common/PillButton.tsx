/**
 * PillButton Component
 * 
 * Location: components/common/PillButton.tsx
 * Purpose: Reusable pill-shaped button with icon and text support
 * 
 * Features:
 * - Pill-shaped styling (borderRadius: 25, height: 50)
 * - Multiple variants: primary, dark, outline
 * - Icon and text support
 * - Disabled state support
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';

interface PillButtonProps {
  label: string;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  variant?: 'primary' | 'dark' | 'outline';
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function PillButton({
  label,
  icon,
  variant = 'primary',
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
}: PillButtonProps) {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 50,
      borderRadius: 25, // Pill-shaped
      paddingVertical: 14,
      paddingHorizontal: 18,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: Colors.primary,
        };
      case 'dark':
        return {
          ...baseStyle,
          backgroundColor: Colors.text, // Dark grey/black
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: Colors.white,
          borderWidth: 1,
          borderColor: Colors.border,
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: 16,
      fontWeight: '600',
    };

    switch (variant) {
      case 'primary':
      case 'dark':
        return {
          ...baseStyle,
          color: Colors.white,
        };
      case 'outline':
        return {
          ...baseStyle,
          color: Colors.text, // Dark text for white button
        };
      default:
        return baseStyle;
    }
  };

  const getIconColor = (): string => {
    if (disabled) return Colors.textSecondary;
    if (variant === 'outline') return Colors.text;
    return Colors.white;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getIconColor()} />
      ) : (
        icon && (
          <FontAwesome
            name={icon}
            size={18}
            color={getIconColor()}
          />
        )
      )}
      <Text style={[getTextStyle(), disabled && styles.disabledText, textStyle]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: Colors.textSecondary,
  },
});
