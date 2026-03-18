/**
 * QR Scanner Screen – Full-screen camera scanner with NAMQR validation
 * Figma Node: 81:465
 * 
 * - Full-screen camera view
 * - Scan frame overlay (280×280px, 16px radius, 2px white border)
 * - Instructions: "Scan NAMQR code" (white text)
 * - Cancel button
 * - Flash toggle
 * - Camera permission handling
 * 
 * NAMQR VALIDATION:
 * - Parse SmartpayID from QR payload
 * - Validate NAMQR format (tags 00, 53, 58, 65, 63)
 * - Extract amount if present
 * 
 * NAVIGATION:
 * - Send money (if SmartpayID detected)
 * - Cash-out (if agent/till QR)
 * - Pay merchant (if merchant QR)
 * - Error (if invalid QR)
 * 
 * Location: mobile/app/(authenticated)/scan-qr/index.tsx
 */

import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { designSystem as DS } from '@/constants/designSystem';
import { QRScanner } from '@/components/shared/QRScanner';
import { parseNAMQR, getQRCodeType, extractSmartpayId } from '@/utils/namqr';

export default function ScanQRScreen() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleScan = async (qrData: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      console.log('Scanned QR data:', qrData);

      // Determine QR code type
      const qrType = getQRCodeType(qrData);
      console.log('QR type:', qrType);

      switch (qrType) {
        case 'namqr': {
          // Parse NAMQR to get SmartpayID
          const result = parseNAMQR(qrData);
          
          if (!result.isValid || !result.data) {
            showError('Invalid QR code', result.error || 'Could not parse QR code');
            setIsProcessing(false);
            return;
          }

          // Navigate to send money with recipient details
          router.replace({
            pathname: '/(authenticated)/send-money/amount' as any,
            params: {
              recipientId: result.data.smartpayId,
              prefilledAmount: result.data.amount?.toString() || '',
            },
          });
          break;
        }

        case 'agent': {
          // Navigate to cash-out flow with agent details
          const result = parseNAMQR(qrData);
          if (result.isValid && result.data) {
            router.replace({
              pathname: '/(authenticated)/cash-out/confirm' as any,
              params: {
                agentId: result.data.smartpayId,
                merchantName: result.data.merchantName || 'Agent',
              },
            });
          } else {
            showError('Invalid agent QR', 'This QR code could not be verified');
            setIsProcessing(false);
          }
          break;
        }

        case 'till': {
          // Navigate to cash-out flow with till details
          const result = parseNAMQR(qrData);
          if (result.isValid && result.data) {
            router.replace({
              pathname: '/(authenticated)/cash-out/confirm' as any,
              params: {
                tillId: result.data.smartpayId,
                merchantName: result.data.merchantName || 'Till',
              },
            });
          } else {
            showError('Invalid till QR', 'This QR code could not be verified');
            setIsProcessing(false);
          }
          break;
        }

        case 'merchant': {
          // Navigate to merchant payment flow
          const result = parseNAMQR(qrData);
          if (result.isValid && result.data) {
            router.replace({
              pathname: '/(authenticated)/pay-merchant/confirm' as any,
              params: {
                merchantId: result.data.smartpayId,
                merchantName: result.data.merchantName || 'Merchant',
                amount: result.data.amount?.toString() || '',
              },
            });
          } else {
            showError('Invalid merchant QR', 'This QR code could not be verified');
            setIsProcessing(false);
          }
          break;
        }

        case 'deeplink': {
          // Try to extract SmartpayID from deep link
          const smartpayId = extractSmartpayId(qrData);
          if (smartpayId) {
            router.replace({
              pathname: '/(authenticated)/send-money/amount' as any,
              params: {
                recipientId: smartpayId,
              },
            });
          } else {
            showError('Invalid deep link', 'Could not extract payment information');
            setIsProcessing(false);
          }
          break;
        }

        case 'unknown':
        default: {
          // Try to extract SmartpayID as fallback
          const smartpayId = extractSmartpayId(qrData);
          if (smartpayId) {
            router.replace({
              pathname: '/(authenticated)/send-money/amount' as any,
              params: {
                recipientId: smartpayId,
              },
            });
          } else {
            showError(
              'Unrecognized QR code',
              'This QR code is not a valid Smartpay payment code'
            );
            setIsProcessing(false);
          }
          break;
        }
      }
    } catch (error) {
      console.error('QR scan error:', error);
      showError('Scan error', 'Failed to process QR code');
      setIsProcessing(false);
    }
  };

  const showError = (title: string, message: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert(title, message, [
      {
        text: 'Try Again',
        onPress: () => {
          setIsProcessing(false);
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => router.back(),
      },
    ]);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <QRScanner
        onScan={handleScan}
        onCancel={handleCancel}
        instructions="Scan NAMQR code"
        showFlashToggle={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.colors.primary,
  },
});
