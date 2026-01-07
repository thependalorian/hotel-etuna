/**
 * AlertBanner Component
 * 
 * Location: components/common/AlertBanner.tsx
 * Purpose: Inline alert banner for displaying alerts, warnings, errors, or info messages
 * 
 * Features:
 * - Dismissible alert banner
 * - Variants: error, warning, info, success
 * - Icon and message display
 * - Auto-dismiss option
 * - Consistent styling
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';

interface AlertBannerProps {
  message: string;
  variant?: 'error' | 'warning' | 'info' | 'success';
  dismissible?: boolean;
  onDismiss?: () => void;
  autoDismiss?: number; // milliseconds
  style?: object;
}

export default function AlertBanner({
  message,
  variant = 'info',
  dismissible = true,
  onDismiss,
  autoDismiss,
  style,
}: AlertBannerProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto dismiss
    if (autoDismiss && onDismiss) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss?.();
    });
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'error':
        return {
          backgroundColor: Colors.error + '15',
          borderColor: Colors.error,
          icon: 'exclamation-circle' as const,
          iconColor: Colors.error,
        };
      case 'warning':
        return {
          backgroundColor: Colors.warning + '15',
          borderColor: Colors.warning,
          icon: 'exclamation-triangle' as const,
          iconColor: Colors.warning,
        };
      case 'success':
        return {
          backgroundColor: Colors.success + '15',
          borderColor: Colors.success,
          icon: 'check-circle' as const,
          iconColor: Colors.success,
        };
      case 'info':
      default:
        return {
          backgroundColor: Colors.info + '15',
          borderColor: Colors.info,
          icon: 'info-circle' as const,
          iconColor: Colors.info,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Animated.View
      style={[
        styles.container,
        variantStyles,
        { opacity: fadeAnim },
        style,
      ]}
    >
      <View style={styles.content}>
        <FontAwesome
          name={variantStyles.icon}
          size={20}
          color={variantStyles.iconColor}
          style={styles.icon}
        />
        <Text style={styles.message}>{message}</Text>
      </View>
      {dismissible && (
        <TouchableOpacity
          onPress={handleDismiss}
          style={styles.dismissButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <FontAwesome name="times" size={16} color={variantStyles.iconColor} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 20,
    marginVertical: 8,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  dismissButton: {
    marginLeft: 12,
    padding: 4,
  },
});
