import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { designSystem } from '@/constants/designSystem';
import { useNotificationsContext } from '@/contexts/NotificationsContext';

export interface NotificationPermissionPromptProps {
  visible: boolean;
  onClose: () => void;
  onPermissionGranted?: () => void;
}

export function NotificationPermissionPrompt({
  visible,
  onClose,
  onPermissionGranted,
}: NotificationPermissionPromptProps) {
  const { requestPermission } = useNotificationsContext();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleEnablePress = async () => {
    setIsRequesting(true);
    const granted = await requestPermission();
    setIsRequesting(false);

    if (granted) {
      onPermissionGranted?.();
      onClose();
    } else {
      handleOpenSettings();
    }
  };

  const handleOpenSettings = () => {
    onClose();
    Linking.openSettings();
  };

  const benefits = [
    {
      icon: 'flash' as const,
      title: 'Instant Updates',
      description: 'Get notified immediately when payments are received',
    },
    {
      icon: 'shield-checkmark' as const,
      title: 'Security Alerts',
      description: 'Important updates about your account security',
    },
    {
      icon: 'time' as const,
      title: 'Reminders',
      description: 'Never miss proof-of-life or payment deadlines',
    },
    {
      icon: 'people' as const,
      title: 'Stay Connected',
      description: 'Group invitations and social updates',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={90} tint="dark" style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Ionicons 
                  name="notifications" 
                  size={32} 
                  color={designSystem.colors.brand} 
                />
              </View>
              
              <Text style={styles.title}>Enable Notifications</Text>
              <Text style={styles.subtitle}>
                Stay updated with important alerts and account activity
              </Text>
            </View>

            <View style={styles.benefits}>
              {benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <View style={styles.benefitIconContainer}>
                    <Ionicons
                      name={benefit.icon}
                      size={20}
                      color={designSystem.colors.brand}
                    />
                  </View>
                  <View style={styles.benefitContent}>
                    <Text style={styles.benefitTitle}>{benefit.title}</Text>
                    <Text style={styles.benefitDescription}>{benefit.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleEnablePress}
                disabled={isRequesting}
              >
                <Text style={styles.primaryButtonText}>
                  {isRequesting ? 'Requesting...' : 'Enable Notifications'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
                <Text style={styles.secondaryButtonText}>Not Now</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.disclaimer}>
              You can change this anytime in Settings
            </Text>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designSystem.spacing[4],
  },
  container: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.radius.xl,
    padding: designSystem.spacing[6],
    gap: designSystem.spacing[6],
    ...Platform.select({
      ios: designSystem.shadows.lg,
      android: { elevation: 8 },
    }),
  },
  header: {
    alignItems: 'center',
    gap: designSystem.spacing[3],
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: designSystem.colors.brand.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: designSystem.typography.fontSize['2xl'],
    fontWeight: designSystem.typography.fontWeight.bold,
    color: designSystem.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: designSystem.typography.fontSize.base,
    color: designSystem.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  benefits: {
    gap: designSystem.spacing[4],
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: designSystem.spacing[3],
  },
  benefitIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: designSystem.colors.brand.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitContent: {
    flex: 1,
    gap: designSystem.spacing[1],
  },
  benefitTitle: {
    fontSize: designSystem.typography.fontSize.base,
    fontWeight: designSystem.typography.fontWeight.semibold,
    color: designSystem.colors.text,
  },
  benefitDescription: {
    fontSize: designSystem.typography.fontSize.sm,
    color: designSystem.colors.textSecondary,
    lineHeight: 18,
  },
  actions: {
    gap: designSystem.spacing[3],
  },
  primaryButton: {
    backgroundColor: designSystem.colors.brand,
    borderRadius: designSystem.radius.lg,
    paddingVertical: designSystem.spacing[4],
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: designSystem.typography.fontSize.base,
    fontWeight: designSystem.typography.fontWeight.semibold,
    color: designSystem.colors.surface,
  },
  secondaryButton: {
    paddingVertical: designSystem.spacing[3],
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: designSystem.typography.fontSize.base,
    fontWeight: designSystem.typography.fontWeight.medium,
    color: designSystem.colors.textSecondary,
  },
  disclaimer: {
    fontSize: designSystem.typography.fontSize.xs,
    color: designSystem.colors.textTertiary,
    textAlign: 'center',
  },
});
