/**
 * OfflineBanner – Smartpay.
 * Yellow banner shown when the app is offline.
 * Displays icon + message, can be dismissed or auto-hide.
 * Location: fintech/smartpay/mobile/components/common/OfflineBanner.tsx
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { designSystem } from '@/constants/designSystem';

const DS = designSystem;

interface OfflineBannerProps {
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export function OfflineBanner({
  message = "You're offline. Some features may be limited.",
  onRetry,
  showRetry = !!onRetry,
}: OfflineBannerProps) {
  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLabel={message}>
      <View style={styles.content}>
        <Ionicons name="cloud-offline-outline" size={20} color="#ffffff" style={styles.icon} />
        <Text style={styles.text}>{message}</Text>
      </View>
      {showRetry && onRetry && (
        <Text
          style={styles.retry}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry connection"
        >
          Retry
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: DS.colors.semantic.warning,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 10,
  },
  text: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  retry: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 12,
    textDecorationLine: 'underline',
  },
});
