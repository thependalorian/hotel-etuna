/**
 * QRCodeCard – QR code display with SmartpayID and copy button
 * Figma NAMQRDisplay: 200×200px QR, 12px radius, 16px padding
 * SmartpayID: 18px weight 600, Copy button: 20px icon
 * Location: mobile/components/shared/QRCodeCard.tsx
 * 
 * USAGE:
 * ```tsx
 * <QRCodeCard
 *   qrData="namqr://smartpay/SP12345678"
 *   smartpayId="SP-12345678"
 *   onCopy={() => copyToClipboard()}
 * />
 * ```
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Svg, Rect, Path } from 'react-native-svg';
import { designSystem as DS } from '@/constants/designSystem';

export interface QRCodeCardProps {
  qrData: string;
  smartpayId: string;
  onCopy?: () => void;
}

export function QRCodeCard({
  qrData,
  smartpayId,
  onCopy,
}: QRCodeCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onCopy?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.qrContainer}>
        <View style={styles.qrPlaceholder}>
          <Ionicons name="qr-code" size={120} color={DS.colors.text} />
          <Text style={styles.qrDataText} numberOfLines={2}>
            {qrData}
          </Text>
        </View>
      </View>

      <View style={styles.idContainer}>
        <View style={styles.idRow}>
          <View style={styles.idTextContainer}>
            <Text style={styles.idLabel}>Your SmartpayID</Text>
            <Text style={styles.idValue}>{smartpayId}</Text>
          </View>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopy}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel={`Copy ${smartpayId}`}
            accessibilityRole="button"
          >
            <Ionicons
              name={copied ? 'checkmark-circle' : 'copy-outline'}
              size={20}
              color={copied ? DS.colors.success : DS.colors.brand.primary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: DS.colors.background,
    borderRadius: DS.components.qrCode.borderRadius,
    padding: DS.components.qrCode.padding,
    alignItems: 'center',
    ...DS.shadows.md,
  },
  qrContainer: {
    backgroundColor: DS.colors.background,
    padding: DS.spacing.md,
    borderRadius: DS.radius.md,
    marginBottom: DS.spacing.md,
  },
  qrPlaceholder: {
    width: DS.components.qrCode.minSize,
    height: DS.components.qrCode.minSize,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.sm,
  },
  qrDataText: {
    fontSize: DS.typography.fontSize.xs,
    color: DS.colors.textTertiary,
    marginTop: DS.spacing.xs,
    textAlign: 'center',
    paddingHorizontal: DS.spacing.sm,
  },
  idContainer: {
    width: '100%',
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  idTextContainer: {
    flex: 1,
  },
  idLabel: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
    marginBottom: 4,
  },
  idValue: {
    fontSize: DS.typography.fontSize.lg,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
  },
  copyButton: {
    padding: DS.spacing.sm,
    marginLeft: DS.spacing.sm,
  },
});
