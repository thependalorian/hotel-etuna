/**
 * QR Scanner Screen
 * 
 * Location: app/send-money/qr-scanner.tsx
 * Purpose: Scan QR codes for Buffr payment accounts (main account and wallets)
 * 
 * Based on QR scanner design for payment flows
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
import { PillButton } from '@/components/common';

export default function QRScannerScreen() {
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

      // Navigate to receiver details with scanned data
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

  const handleScanAgain = () => {
    setScanned(false);
    setIsProcessing(false);
  };

  if (!permission) {
    // Permission is still loading
    return (
      <View style={[defaultStyles.containerFull, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    // Permission denied
    return (
      <View style={[defaultStyles.containerFull, styles.permissionContainer]}>
        <FontAwesome name="camera" size={64} color={Colors.textSecondary} />
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>
          Buffr needs access to your camera to scan QR codes for payments.
        </Text>
          <PillButton
            label="Grant Permission"
            variant="primary"
            onPress={requestPermission}
            style={styles.permissionButton}
          />
        <TouchableOpacity
          style={[defaultStyles.buttonOutline, styles.cancelButton]}
          onPress={() => router.back()}
        >
          <Text style={defaultStyles.buttonOutlineText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={defaultStyles.containerFull}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome name="arrow-left" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan QR Code</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Scanning Frame */}
          <View style={styles.scanningFrame}>
            {/* Top Left Corner */}
            <View style={[styles.frameCorner, styles.cornerTopLeft]} />
            {/* Top Right Corner */}
            <View style={[styles.frameCorner, styles.cornerTopRight]} />
            {/* Bottom Left Corner */}
            <View style={[styles.frameCorner, styles.cornerBottomLeft]} />
            {/* Bottom Right Corner */}
            <View style={[styles.frameCorner, styles.cornerBottomRight]} />
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              {scanned
                ? 'Processing...'
                : 'Position the QR code within the frame to scan'}
            </Text>
            {scanned && (
              <ActivityIndicator
                size="small"
                color={Colors.white}
                style={styles.processingIndicator}
              />
            )}
          </View>

          {/* Scan Again Button */}
          {scanned && !isProcessing && (
            <View style={styles.buttonContainer}>
              <PillButton
                label="Scan Again"
                variant="primary"
                onPress={handleScanAgain}
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  permissionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionButton: {
    marginTop: 8,
    width: '100%',
  },
  cancelButton: {
    marginTop: 12,
    width: '100%',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
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
