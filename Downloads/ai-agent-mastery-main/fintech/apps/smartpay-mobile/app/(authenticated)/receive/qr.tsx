/**
 * Full-Screen QR Display – Large QR code optimized for scanning
 * 
 * - Full-screen QR code (larger, optimized for scanning)
 * - SmartpayID text below
 * - Brightness boost hint
 * - Back/close button
 * - Share button in header
 * 
 * Location: mobile/app/(authenticated)/receive/qr.tsx
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import { designSystem as DS } from '@/constants/designSystem';
import { useUser } from '@/contexts/UserContext';
import { generateNAMQR } from '@/utils/namqr';

const { width } = Dimensions.get('window');
const QR_SIZE = Math.min(width - 64, 320);

export default function FullScreenQRScreen() {
  const { user } = useUser();
  const [qrData, setQrData] = useState<string>('');
  const [copiedId, setCopiedId] = useState(false);

  // Mock SmartpayID - replace with actual user data
  const smartpayId = user?.smartpayId || 'SP-12345678';

  useEffect(() => {
    // Generate NAMQR code
    const namqr = generateNAMQR(smartpayId);
    setQrData(namqr);
  }, [smartpayId]);

  const handleCopyId = async () => {
    try {
      await Clipboard.setStringAsync(smartpayId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy SmartpayID');
    }
  };

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: `Send me money on Smartpay! My SmartpayID: ${smartpayId}`,
        title: 'My Smartpay ID',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={28} color={DS.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleShare}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Share QR code"
          accessibilityRole="button"
        >
          <Ionicons name="share-social-outline" size={24} color={DS.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Scan to Pay</Text>
        
        {/* QR Code */}
        <View style={styles.qrContainer}>
          {qrData ? (
            <QRCode
              value={qrData}
              size={QR_SIZE}
              backgroundColor={DS.colors.background}
              color={DS.colors.text}
            />
          ) : (
            <View style={[styles.qrPlaceholder, { width: QR_SIZE, height: QR_SIZE }]}>
              <Ionicons name="qr-code" size={QR_SIZE / 2} color={DS.colors.textTertiary} />
            </View>
          )}
        </View>

        {/* SmartpayID */}
        <View style={styles.idSection}>
          <Text style={styles.idLabel}>SmartpayID</Text>
          <TouchableOpacity
            style={styles.idRow}
            onPress={handleCopyId}
            activeOpacity={0.7}
            accessibilityLabel={`Copy ${smartpayId}`}
            accessibilityRole="button"
          >
            <Text style={styles.idValue}>{smartpayId}</Text>
            <Ionicons
              name={copiedId ? 'checkmark-circle' : 'copy-outline'}
              size={22}
              color={copiedId ? DS.colors.success : DS.colors.brand.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Brightness hint */}
        <View style={styles.hint}>
          <Ionicons name="sunny-outline" size={18} color={DS.colors.textSecondary} />
          <Text style={styles.hintText}>Increase screen brightness for easier scanning</Text>
        </View>
      </View>

      {/* Footer note */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          This QR code can only be used to send you money
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DS.spacing.md,
    paddingVertical: DS.spacing.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: DS.spacing.lg,
  },
  title: {
    fontSize: DS.typography.fontSize['3xl'],
    fontWeight: DS.typography.fontWeight.bold,
    color: DS.colors.text,
    marginBottom: DS.spacing.xl,
  },
  qrContainer: {
    backgroundColor: DS.colors.background,
    padding: DS.spacing.lg,
    borderRadius: DS.radius.xl,
    ...DS.shadows.lg,
  },
  qrPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DS.colors.surface,
  },
  idSection: {
    alignItems: 'center',
    marginTop: DS.spacing.xl,
  },
  idLabel: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
    marginBottom: DS.spacing.xs,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
    paddingHorizontal: DS.spacing.md,
    paddingVertical: DS.spacing.sm,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.pill,
  },
  idValue: {
    fontSize: DS.typography.fontSize.xl,
    fontWeight: DS.typography.fontWeight.bold,
    color: DS.colors.text,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
    marginTop: DS.spacing.xl,
    paddingHorizontal: DS.spacing.md,
    paddingVertical: DS.spacing.sm,
    backgroundColor: DS.colors.feedback.amber100,
    borderRadius: DS.radius.md,
  },
  hintText: {
    flex: 1,
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.text,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: DS.spacing.xl,
    paddingVertical: DS.spacing.lg,
  },
  footerText: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
    textAlign: 'center',
  },
});
