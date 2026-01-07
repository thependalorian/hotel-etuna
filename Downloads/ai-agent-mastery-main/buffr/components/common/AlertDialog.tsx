/**
 * AlertDialog Component
 * 
 * Location: components/common/AlertDialog.tsx
 * Purpose: Styled alert dialog/modal for confirmations and alerts
 * 
 * Features:
 * - Custom styled alert dialog (alternative to React Native Alert)
 * - Title, message, and action buttons
 * - Variants: error, warning, info, success
 * - Pill-shaped buttons
 * - Consistent styling with app design
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import PillButton from './PillButton';

interface AlertButton {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'dark' | 'outline';
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  variant?: 'error' | 'warning' | 'info' | 'success';
  buttons: AlertButton[];
  onDismiss?: () => void;
}

export default function AlertDialog({
  visible,
  title,
  message,
  variant = 'info',
  buttons,
  onDismiss,
}: AlertDialogProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'error':
        return {
          icon: 'exclamation-circle' as const,
          iconColor: Colors.error,
          iconBackground: Colors.error + '20',
        };
      case 'warning':
        return {
          icon: 'exclamation-triangle' as const,
          iconColor: Colors.warning,
          iconBackground: Colors.warning + '20',
        };
      case 'success':
        return {
          icon: 'check-circle' as const,
          iconColor: Colors.success,
          iconBackground: Colors.success + '20',
        };
      case 'info':
      default:
        return {
          icon: 'info-circle' as const,
          iconColor: Colors.info,
          iconBackground: Colors.info + '20',
        };
    }
  };

  const variantStyles = getVariantStyles();

  const getButtonVariant = (button: AlertButton): 'primary' | 'dark' | 'outline' => {
    if (button.variant) return button.variant;
    if (button.style === 'destructive') return 'primary';
    if (button.style === 'cancel') return 'outline';
    return 'primary';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.dialog}>
              {/* Icon */}
              <View style={[styles.iconContainer, { backgroundColor: variantStyles.iconBackground }]}>
                <FontAwesome
                  name={variantStyles.icon}
                  size={40}
                  color={variantStyles.iconColor}
                />
              </View>

              {/* Title */}
              <Text style={styles.title}>{title}</Text>

              {/* Message */}
              {message && (
                <Text style={styles.message}>{message}</Text>
              )}

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                {buttons.map((button, index) => (
                  <PillButton
                    key={index}
                    label={button.label}
                    variant={getButtonVariant(button)}
                    onPress={button.onPress}
                    style={[
                      styles.button,
                      buttons.length > 1 && styles.buttonMultiple,
                    ]}
                  />
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: Colors.dark,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
  },
  buttonMultiple: {
    minWidth: 100,
  },
});
