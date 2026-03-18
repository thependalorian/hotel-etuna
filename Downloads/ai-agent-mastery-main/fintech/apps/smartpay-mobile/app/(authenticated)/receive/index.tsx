/**
 * Receive Screen – Main receive money screen with QR code
 * 
 * Figma NAMQRDisplay: Show NAMQR code for receiving payments
 * - AppHeader with "Receive Money"
 * - QRCodeCard component (200×200px NAMQR)
 * - SmartpayID display with copy button
 * - Instructions
 * - Share SmartpayID button
 * - How it works section (collapsible)
 * - Recent received transactions (optional)
 * 
 * Location: mobile/app/(authenticated)/receive/index.tsx
 * 
 * Flow: User shows QR code → Payer scans → Payer enters amount → Transfer complete
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
  Linking,
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

export default function ReceiveScreen() {
  const { user } = useUser();
  const [showHowItWorks, setShowHowItWorks] = useState(false);
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

  const handleShareId = async () => {
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
        <Text style={styles.headerTitle}>Receive Money</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* QR Code Card */}
        <View style={styles.qrCard}>
          <TouchableOpacity
            style={styles.qrContainer}
            onPress={handleViewFullScreen}
            activeOpacity={0.9}
            accessibilityLabel="View full screen QR code"
            accessibilityRole="button"
          >
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
            
            {/* Tap to enlarge hint */}
            <View style={styles.tapHint}>
              <Ionicons name="expand-outline" size={16} color={DS.colors.textSecondary} />
              <Text style={styles.tapHintText}>Tap to enlarge</Text>
            </View>
          </TouchableOpacity>

          {/* SmartpayID display */}
          <View style={styles.idSection}>
            <Text style={styles.idLabel}>Your SmartpayID</Text>
            <View style={styles.idRow}>
              <Text style={styles.idValue}>{smartpayId}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyId}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel={`Copy ${smartpayId}`}
                accessibilityRole="button"
              >
                <Ionicons
                  name={copiedId ? 'checkmark-circle' : 'copy-outline'}
                  size={20}
                  color={copiedId ? DS.colors.success : DS.colors.brand.primary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <View style={styles.instructionItem}>
            <View style={styles.iconCircle}>
              <Ionicons name="qr-code" size={24} color={DS.colors.brand.primary} />
            </View>
            <Text style={styles.instructionText}>
              Show this QR code to receive payments from anyone with Smartpay
            </Text>
          </View>
        </View>

        {/* Share Button */}
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShareId}
          accessibilityLabel="Share SmartpayID"
          accessibilityRole="button"
        >
          <Ionicons name="share-social-outline" size={20} color={DS.colors.text} />
          <Text style={styles.shareButtonText}>Share SmartpayID</Text>
        </TouchableOpacity>

        {/* How It Works Section */}
        <TouchableOpacity
          style={styles.howItWorksHeader}
          onPress={() => setShowHowItWorks(!showHowItWorks)}
          activeOpacity={0.7}
          accessibilityLabel="How it works"
          accessibilityRole="button"
        >
          <Text style={styles.howItWorksTitle}>How it works</Text>
          <Ionicons
            name={showHowItWorks ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={DS.colors.text}
          />
        </TouchableOpacity>

        {showHowItWorks && (
          <View style={styles.howItWorksContent}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Share your QR code</Text>
                <Text style={styles.stepDescription}>
                  Show this QR code or share your SmartpayID with the person sending you money
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>They scan and pay</Text>
                <Text style={styles.stepDescription}>
                  The sender scans your QR code, enters the amount, and confirms the payment
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Money arrives instantly</Text>
                <Text style={styles.stepDescription}>
                  You'll receive a notification and the money will be in your wallet immediately
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={20} color={DS.colors.success} />
          <Text style={styles.securityText}>
            Your QR code is safe to share. It can only be used to send you money.
          </Text>
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
  qrCard: {
    backgroundColor: DS.colors.background,
    borderRadius: DS.radius.lg,
    padding: DS.spacing.lg,
    alignItems: 'center',
    ...DS.shadows.md,
  },
  qrContainer: {
    backgroundColor: DS.colors.surface,
    padding: DS.spacing.md,
    borderRadius: DS.radius.md,
    alignItems: 'center',
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
    marginTop: DS.spacing.sm,
  },
  tapHintText: {
    fontSize: DS.typography.fontSize.xs,
    color: DS.colors.textSecondary,
  },
  idSection: {
    width: '100%',
    marginTop: DS.spacing.lg,
    alignItems: 'center',
  },
  idLabel: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
    marginBottom: 4,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
  },
  idValue: {
    fontSize: DS.typography.fontSize.lg,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
  },
  copyButton: {
    padding: DS.spacing.xs,
  },
  instructionsCard: {
    backgroundColor: DS.colors.brand['50'],
    borderRadius: DS.radius.md,
    padding: DS.spacing.md,
    marginTop: DS.spacing.lg,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DS.spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    flex: 1,
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.text,
    lineHeight: 22,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DS.spacing.sm,
    height: 56,
    borderRadius: DS.components.button.borderRadius,
    backgroundColor: DS.colors.surface,
    borderWidth: 1,
    borderColor: DS.colors.border,
    marginTop: DS.spacing.lg,
  },
  shareButtonText: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
  },
  howItWorksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: DS.spacing.md,
    marginTop: DS.spacing.lg,
  },
  howItWorksTitle: {
    fontSize: DS.typography.fontSize.lg,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
  },
  howItWorksContent: {
    gap: DS.spacing.lg,
    marginTop: DS.spacing.sm,
  },
  stepItem: {
    flexDirection: 'row',
    gap: DS.spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.bold,
    color: DS.colors.background,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
    lineHeight: 20,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
    backgroundColor: DS.colors.feedback.green100,
    borderRadius: DS.radius.md,
    padding: DS.spacing.md,
    marginTop: DS.spacing.xl,
    marginBottom: DS.spacing.xl,
  },
  securityText: {
    flex: 1,
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.text,
    lineHeight: 18,
  },
});
