/**
 * Scan QR Screen - Send Money Alternate Flow
 * 
 * Figma Node: 81:465 (NAMQRScanner)
 * Location: app/send-money/scan-qr.tsx
 * 
 * Components:
 * - Full-screen camera view
 * - Scan frame (280×280px, 16px radius, 2px white border)
 * - Instruction text: "Scan the NAMQR code"
 * - Cancel button (top-left, white)
 * 
 * States:
 * - scanning (default, white frame)
 * - valid (green frame, success)
 * - error (red frame, error message)
 * 
 * Navigation:
 * - onScan → Parse NAMQR → /send-money/amount?recipient=[decoded]
 * - onCancel → Back to select-recipient
 * 
 * Error Handling:
 * - Invalid QR → Red frame, "Invalid QR code", retry
 * - Network error → Toast, retry
 * 
 * ASCII Diagram (Figma):
 * ┌─────────────────────────────────────────┐
 * │ [✕ Cancel]                              │
 * │                                         │
 * │          ┌───────────────┐              │ ← Full-screen camera
 * │          │               │              │   Scan frame: 280×280
 * │          │  [QR FRAME]   │              │   White border 2px
 * │          │               │              │
 * │          └───────────────┘              │
 * │                                         │
 * │ Scan the NAMQR code                     │ ← White text, 16px
 * │                                         │
 * └─────────────────────────────────────────┘
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { designSystem as DS } from '@/constants/designSystem';

const FRAME_SIZE = 280;

export default function ScanQRScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanState, setScanState] = useState<'scanning' | 'valid' | 'error'>('scanning');

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;

    setScanned(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const parsedData = parseNAMQR(data);
      
      if (parsedData && parsedData.smartpayId) {
        setScanState('valid');
        
        setTimeout(() => {
          router.replace({
            pathname: '/send-money/amount',
            params: {
              recipientId: parsedData.smartpayId,
              recipientName: parsedData.name || 'Unknown',
              recipientPhone: parsedData.phone || '',
              recipientSmartpayId: parsedData.smartpayId,
            },
          });
        }, 500);
      } else {
        setScanState('error');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        setTimeout(() => {
          Alert.alert(
            'Invalid QR Code',
            'This is not a valid Smartpay QR code. Please try again.',
            [
              {
                text: 'Retry',
                onPress: () => {
                  setScanned(false);
                  setScanState('scanning');
                },
              },
              {
                text: 'Cancel',
                onPress: () => router.back(),
                style: 'cancel',
              },
            ]
          );
        }, 500);
      }
    } catch (error) {
      setScanState('error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      setTimeout(() => {
        Alert.alert(
          'Scan Error',
          'Could not read QR code. Please try again.',
          [
            {
              text: 'Retry',
              onPress: () => {
                setScanned(false);
                setScanState('scanning');
              },
            },
            {
              text: 'Cancel',
              onPress: () => router.back(),
              style: 'cancel',
            },
          ]
        );
      }, 500);
    }
  };

  const parseNAMQR = (data: string): { smartpayId: string; name?: string; phone?: string } | null => {
    try {
      if (data.startsWith('SP-') || data.startsWith('SP')) {
        return {
          smartpayId: data,
          name: undefined,
          phone: undefined,
        };
      }

      const parsed = JSON.parse(data);
      if (parsed.smartpayId || parsed.id) {
        return {
          smartpayId: parsed.smartpayId || parsed.id,
          name: parsed.name,
          phone: parsed.phone,
        };
      }

      return null;
    } catch {
      if (data.includes('smartpay') || data.includes('SP-')) {
        const match = data.match(/SP-?\d{8}/);
        if (match) {
          return { smartpayId: match[0] };
        }
      }
      return null;
    }
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permissionScreen}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionScreen}>
        <Ionicons name="camera-off-outline" size={64} color={DS.colors.textTertiary} />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          Please enable camera access in Settings to scan QR codes.
        </Text>
        <TouchableOpacity style={styles.goBackButton} onPress={() => router.back()}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const frameColor =
    scanState === 'valid'
      ? DS.colors.success
      : scanState === 'error'
      ? DS.colors.error
      : '#FFFFFF';

  return (
    <View style={styles.screen}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        {/* Overlay with scan frame */}
        <View style={styles.overlay}>
          {/* Top dark area */}
          <View style={styles.overlayTop} />

          {/* Middle row with frame */}
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            
            {/* Scan Frame - 280×280px */}
            <View style={[styles.scanFrame, { borderColor: frameColor }]}>
              {scanState === 'valid' && (
                <View style={styles.scanStateIcon}>
                  <Ionicons name="checkmark-circle" size={64} color={DS.colors.success} />
                </View>
              )}
              {scanState === 'error' && (
                <View style={styles.scanStateIcon}>
                  <Ionicons name="close-circle" size={64} color={DS.colors.error} />
                </View>
              )}
            </View>
            
            <View style={styles.overlaySide} />
          </View>

          {/* Bottom dark area with instruction */}
          <View style={styles.overlayBottom}>
            <Text style={styles.instructionText}>
              {scanState === 'scanning' && 'Scan the NAMQR code'}
              {scanState === 'valid' && 'Valid QR code detected!'}
              {scanState === 'error' && 'Invalid QR code'}
            </Text>
          </View>
        </View>

        {/* Cancel Button - Top-left */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          accessibilityLabel="Cancel scanning"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: FRAME_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scanFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderWidth: 2,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanStateIcon: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 40,
    padding: 8,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: DS.spacing.xl,
  },
  instructionText: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.medium,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  cancelButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionScreen: {
    flex: 1,
    backgroundColor: DS.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: DS.spacing.xl,
  },
  permissionTitle: {
    fontSize: DS.typography.fontSize['2xl'],
    fontWeight: DS.typography.fontWeight.bold,
    color: DS.colors.text,
    marginTop: DS.spacing.lg,
    marginBottom: DS.spacing.sm,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.textSecondary,
    textAlign: 'center',
    marginBottom: DS.spacing.xl,
  },
  goBackButton: {
    paddingHorizontal: DS.spacing.lg,
    paddingVertical: DS.spacing.md,
    backgroundColor: DS.colors.primary,
    borderRadius: DS.radius.md,
  },
  goBackText: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
});
