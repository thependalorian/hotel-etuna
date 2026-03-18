/**
 * My QR Code Screen – Show own QR code
 * 
 * Same as receive/index but accessed from different entry point
 * Can be used for various purposes (receive, agent identification, etc.)
 * 
 * Location: mobile/app/(authenticated)/qr-code/index.tsx
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
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

export default function MyQRCodeScreen() {
  const { user } = useUser();
  const [qrData, setQrData] = useState<string>('');
  const [copiedId, setCopiedId] = useState(false);

  // Mock SmartpayID - replace with actual user data
  const smartpayId = user?.smartpayId || 'SP-12345678';
  const userName = user?.name || 'User';

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

  const handleShareId = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: `Connect with me on Smartpay! My SmartpayID: ${smartpayId}`,
        title: 'My Smartpay QR Code',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleViewFullScreen = () => {
    router.push('/receive/qr');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={DS.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My QR Code</Text>
        <TouchableOpacity
          onPress={handleShareId}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Share QR code"
          accessibilityRole="button"
        >
          <Ionicons name="share-social-outline" size={22} color={DS.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={DS.colors.brand.primary} />
          </View>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.smartpayId}>{smartpayId}</Text>
        </View>

        {/* QR Code Card */}
        <TouchableOpacity
          style={styles.qrCard}
          onPress={handleViewFullScreen}
          activeOpacity={0.9}
          accessibilityLabel="View full screen QR code"
          accessibilityRole="button"
        >
          <View style={styles.qrContainer}>
            {qrData ? (
              <QRCode
                value={qrData}
                size={DS.components.qrCode.minSize}
                backgroundColor={DS.colors.background}
                color={DS.colors.text}
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Ionicons name="qr-code" size={120} color={DS.colors.textTertiary} />
              </View>
            )}
          </View>
          
          <View style={styles.tapHint}>
            <Ionicons name="expand-outline" size={16} color={DS.colors.textSecondary} />
            <Text style={styles.tapHintText}>Tap to enlarge</Text>
          </View>
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCopyId}
            accessibilityLabel="Copy SmartpayID"
            accessibilityRole="button"
          >
            <View style={styles.actionIconContainer}>
              <Ionicons
                name={copiedId ? 'checkmark-circle' : 'copy-outline'}
                size={24}
                color={copiedId ? DS.colors.success : DS.colors.brand.primary}
              />
            </View>
            <Text style={styles.actionLabel}>
              {copiedId ? 'Copied!' : 'Copy ID'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShareId}
            accessibilityLabel="Share QR code"
            accessibilityRole="button"
          >
            <View style={styles.actionIconContainer}>
              <Ionicons
                name="share-social-outline"
                size={24}
                color={DS.colors.brand.primary}
              />
            </View>
            <Text style={styles.actionLabel}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleViewFullScreen}
            accessibilityLabel="Full screen QR"
            accessibilityRole="button"
          >
            <View style={styles.actionIconContainer}>
              <Ionicons
                name="expand-outline"
                size={24}
                color={DS.colors.brand.primary}
              />
            </View>
            <Text style={styles.actionLabel}>Enlarge</Text>
          </TouchableOpacity>
        </View>

        {/* Info Cards */}
        <View style={styles.infoCards}>
          <View style={styles.infoCard}>
            <View style={styles.infoIconCircle}>
              <Ionicons name="qr-code" size={24} color={DS.colors.brand.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Receive Payments</Text>
              <Text style={styles.infoDescription}>
                Share this QR code to receive money from other Smartpay users
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIconCircle}>
              <Ionicons name="shield-checkmark" size={24} color={DS.colors.success} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Safe to Share</Text>
              <Text style={styles.infoDescription}>
                Your QR code can only be used to send you money, never to withdraw
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIconCircle}>
              <Ionicons name="id-card-outline" size={24} color={DS.colors.info} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Unique Identifier</Text>
              <Text style={styles.infoDescription}>
                Your SmartpayID is unique and never expires
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: DS.colors.border,
  },
  headerTitle: {
    fontSize: DS.typography.fontSize.lg,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: DS.spacing.md,
  },
  userInfo: {
    alignItems: 'center',
    paddingVertical: DS.spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.brand['50'],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DS.spacing.md,
  },
  userName: {
    fontSize: DS.typography.fontSize.xl,
    fontWeight: DS.typography.fontWeight.bold,
    color: DS.colors.text,
    marginBottom: 4,
  },
  smartpayId: {
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.textSecondary,
  },
  qrCard: {
    backgroundColor: DS.colors.background,
    borderRadius: DS.radius.lg,
    padding: DS.spacing.lg,
    alignItems: 'center',
    ...DS.shadows.md,
    marginTop: DS.spacing.md,
  },
  qrContainer: {
    backgroundColor: DS.colors.surface,
    padding: DS.spacing.md,
    borderRadius: DS.radius.md,
  },
  qrPlaceholder: {
    width: DS.components.qrCode.minSize,
    height: DS.components.qrCode.minSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: DS.spacing.md,
  },
  tapHintText: {
    fontSize: DS.typography.fontSize.xs,
    color: DS.colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: DS.spacing.xl,
  },
  actionButton: {
    alignItems: 'center',
    gap: DS.spacing.sm,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DS.colors.border,
  },
  actionLabel: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.text,
    fontWeight: DS.typography.fontWeight.medium,
  },
  infoCards: {
    gap: DS.spacing.md,
    marginTop: DS.spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    gap: DS.spacing.md,
    padding: DS.spacing.md,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: DS.colors.border,
  },
  infoIconCircle: {
    width: 48,
    height: 48,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
    lineHeight: 18,
  },
});
