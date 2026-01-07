/**
 * Standalone QR Scanner Screen
 * 
 * Location: app/qr-scanner.tsx
 * Purpose: Standalone QR scanner for scanning payment QR codes (separate from send-money flow)
 * 
 * This is accessed directly from the home screen "Scan QR" button
 * After scanning, it navigates to the send-money flow
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import { parseQRPayment, type ParsedQRPayment } from '@/utils/qrParser';
import { parseBuffrNAMQR } from '@/utils/namqr';
import { useWallets } from '@/contexts/WalletsContext';
import { ScreenHeader } from '@/components/common';

export default function StandaloneQRScannerScreen() {
  const router = useRouter();
  const { wallets } = useWallets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Request camera permission on mount
    if (permission && !permission.granted && !permission.canAskAgain) {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera access in Settings to scan QR codes.',
        [
          { text: 'Cancel', onPress: () => router.back(), style: 'cancel' },
          { text: 'Settings', onPress: () => router.back() },
        ]
      );
    } else if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission, requestPermission, router]);

  const handleBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || isProcessing) return;

    setIsProcessing(true);
    setScanned(true);

    try {
      // Try parsing as NAMQR first (TLV format)
      let parsed: ParsedQRPayment | null = null;
      
      // Check if it's NAMQR format (starts with tag "00")
      if (data.trim().startsWith('00') || /^\d{2}\d{2}/.test(data.trim())) {
        const namqrResult = parseBuffrNAMQR(data);
        if (namqrResult.isValid) {
          parsed = {
            type: 'buffr_payment',
            phone: namqrResult.accountType === 'buffr' ? namqrResult.identifier : undefined,
            walletId: namqrResult.accountType === 'wallet' ? namqrResult.identifier : undefined,
            accountType: namqrResult.accountType,
            amount: namqrResult.amount,
            currency: namqrResult.currency,
            isValid: true,
          };
        }
      }
      
      // Fallback to legacy parser
      if (!parsed) {
        parsed = parseQRPayment(data);
      }

      if (!parsed || !parsed.isValid) {
        Alert.alert('Invalid QR Code', parsed?.error || 'Please scan a valid Buffr payment QR code.', [
          {
            text: 'Scan Again',
            onPress: () => {
              setScanned(false);
              setIsProcessing(false);
            },
          },
          {
            text: 'Cancel',
            onPress: () => router.back(),
            style: 'cancel',
          },
        ]);
        return;
      }

      // If wallet QR code, verify wallet exists
      if (parsed.accountType === 'wallet' && parsed.walletId) {
        const wallet = wallets.find((w) => w.id === parsed.walletId);
        if (!wallet) {
          Alert.alert(
            'Wallet Not Found',
            'The scanned wallet QR code is not valid or the wallet no longer exists.',
            [
              {
                text: 'Scan Again',
                onPress: () => {
                  setScanned(false);
                  setIsProcessing(false);
                },
              },
              {
                text: 'Cancel',
                onPress: () => router.back(),
                style: 'cancel',
              },
            ]
          );
          return;
        }
      }

      // Navigate to send-money flow with scanned data
      const params: Record<string, string> = {};

      if (parsed.phone) {
        params.contactPhone = parsed.phone;
      }

      if (parsed.userId) {
        params.contactId = parsed.userId;
      }

      // Use wallet name or phone number as contact name
      if (parsed.accountType === 'wallet' && parsed.walletName) {
        params.contactName = parsed.walletName;
      } else if (parsed.phone) {
        params.contactName = parsed.phone;
      }

      // Add wallet ID if it's a wallet payment
      if (parsed.accountType === 'wallet' && parsed.walletId) {
        params.walletId = parsed.walletId;
      }

      // Add amount if present in QR code (for dynamic QR codes)
      if (parsed.amount) {
        params.amount = parsed.amount;
      }

      // Navigate to receiver details to complete the payment
      router.push({
        pathname: '/send-money/receiver-details',
        params,
      });
    } catch (error) {
      console.error('Error processing QR code:', error);
      Alert.alert(
        'Error',
        'Failed to process QR code. Please try again.',
        [
          {
            text: 'Scan Again',
            onPress: () => {
              setScanned(false);
              setIsProcessing(false);
            },
          },
          {
            text: 'Cancel',
            onPress: () => router.back(),
            style: 'cancel',
          },
        ]
      );
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (!permission) {
    return (
      <View style={[defaultStyles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Checking camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={defaultStyles.container}>
        <ScreenHeader title="Scan QR Code" onBack={handleBack} showBackButton />
        <View style={styles.centerContent}>
          <FontAwesome name="camera" size={80} color={Colors.textSecondary} />
          <Text style={styles.permissionText}>Camera permission is required to scan QR codes</Text>
          <PillButton
            label="Grant Permission"
            variant="primary"
            onPress={requestPermission}
            style={styles.permissionButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Top bar with back button */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
            >
              <FontAwesome name="arrow-left" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.title}>Scan QR Code</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Scanning frame */}
          <View style={styles.scanningFrame}>
            <View style={[styles.frameCorner, styles.cornerTopLeft]} />
            <View style={[styles.frameCorner, styles.cornerTopRight]} />
            <View style={[styles.frameCorner, styles.cornerBottomLeft]} />
            <View style={[styles.frameCorner, styles.cornerBottomRight]} />
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            {isProcessing ? (
              <>
                <ActivityIndicator size="small" color={Colors.white} style={styles.processingIndicator} />
                <Text style={styles.instructionsText}>Processing QR code...</Text>
              </>
            ) : (
              <Text style={styles.instructionsText}>
                Position the QR code within the frame to scan
              </Text>
            )}
          </View>

          {/* Bottom buttons */}
          {scanned && !isProcessing && (
            <View style={styles.buttonContainer}>
              <PillButton
                label="Scan Again"
                variant="primary"
                onPress={() => {
                  setScanned(false);
                  setIsProcessing(false);
                }}
                style={styles.scanAgainButton}
              />
            </View>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 24,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  permissionText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 16,
  },
  permissionButton: {
    marginTop: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.white,
  },
  placeholder: {
    width: 40,
  },
  scanningFrame: {
    width: 250,
    height: 250,
    alignSelf: 'center',
    marginTop: '30%',
    position: 'relative',
  },
  frameCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.primary,
    borderWidth: 4,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  instructionsContainer: {
    paddingHorizontal: 40,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 12,
    marginTop: 'auto',
  },
  instructionsText: {
    fontSize: 16,
    color: Colors.white,
    textAlign: 'center',
    fontWeight: '500',
  },
  processingIndicator: {
    marginTop: 8,
  },
  buttonContainer: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  scanAgainButton: {
    width: '100%',
  },
});
