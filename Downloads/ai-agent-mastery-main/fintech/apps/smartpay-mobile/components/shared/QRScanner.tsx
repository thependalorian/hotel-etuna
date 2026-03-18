/**
 * QRScanner – Full-screen camera QR code scanner
 * Figma NAMQRScanner (Node 81:465): 
 * - Full-screen camera
 * - Scan frame: 280×280px, 16px radius, 2px white border
 * - Instructions: white text below frame
 * - Cancel button, flash toggle
 * 
 * Location: mobile/components/shared/QRScanner.tsx
 * 
 * USAGE:
 * ```tsx
 * <QRScanner
 *   onScan={(data) => handleQRScan(data)}
 *   onCancel={() => navigation.goBack()}
 *   instructions="Scan NAMQR code"
 * />
 * ```
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions, FlashMode } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { designSystem as DS } from '@/constants/designSystem';

export interface QRScannerProps {
  onScan: (data: string) => void;
  onCancel: () => void;
  instructions?: string;
  showFlashToggle?: boolean;
}

export function QRScanner({
  onScan,
  onCancel,
  instructions = 'Scan NAMQR code',
  showFlashToggle = true,
}: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashMode, setFlashMode] = useState<FlashMode>('off');

  useEffect(() => {
    if (!permission?.granted && permission?.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
    if (scanned) return;

    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Small delay to show scan feedback
    setTimeout(() => {
      onScan(data);
    }, 300);
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  const toggleFlash = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlashMode(prev => prev === 'off' ? 'torch' : 'off');
  };

  // Handle permission states
  if (!permission) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={DS.colors.textSecondary} />
          <Text style={styles.permissionText}>Loading camera...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={DS.colors.textSecondary} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            Smartpay needs camera access to scan QR codes
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButtonAlt}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonTextAlt}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        flash={flashMode}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        {/* Overlay with scan frame */}
        <View style={styles.overlay}>
          {/* Top section */}
          <View style={styles.overlaySection} />
          
          {/* Middle section with scan frame */}
          <View style={styles.middleRow}>
            <View style={styles.overlaySide} />
            
            {/* Scan frame */}
            <View style={[styles.scanFrame, scanned && styles.scanFrameSuccess]}>
              {/* Corner decorations */}
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
            
            <View style={styles.overlaySide} />
          </View>
          
          {/* Bottom section with instructions */}
          <View style={[styles.overlaySection, styles.instructionsSection]}>
            <Text style={styles.instructions}>{instructions}</Text>
            
            {scanned && (
              <View style={styles.scanningIndicator}>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.scanningText}>Scanned!</Text>
              </View>
            )}
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {/* Cancel button (top-left) */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Cancel"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>

          {/* Flash toggle (bottom-center) */}
          {showFlashToggle && (
            <TouchableOpacity
              style={styles.flashButton}
              onPress={toggleFlash}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel={flashMode === 'off' ? 'Turn flash on' : 'Turn flash off'}
              accessibilityRole="button"
            >
              <Ionicons
                name={flashMode === 'off' ? 'flash-outline' : 'flash'}
                size={28}
                color="#fff"
              />
            </TouchableOpacity>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const SCAN_FRAME_SIZE = 280;
const CORNER_LENGTH = 30;
const CORNER_WIDTH = 4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.colors.primary,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlaySection: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  middleRow: {
    flexDirection: 'row',
    height: SCAN_FRAME_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scanFrame: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
    position: 'relative',
  },
  scanFrameSuccess: {
    borderColor: DS.colors.success,
  },
  corner: {
    position: 'absolute',
    backgroundColor: '#fff',
  },
  cornerTopLeft: {
    top: -2,
    left: -2,
    width: CORNER_LENGTH,
    height: CORNER_WIDTH,
    borderTopLeftRadius: 16,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    width: CORNER_LENGTH,
    height: CORNER_WIDTH,
    borderTopRightRadius: 16,
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    width: CORNER_LENGTH,
    height: CORNER_WIDTH,
    borderBottomLeftRadius: 16,
  },
  cornerBottomRight: {
    bottom: -2,
    right: -2,
    width: CORNER_LENGTH,
    height: CORNER_WIDTH,
    borderBottomRightRadius: 16,
  },
  instructionsSection: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  instructions: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.medium,
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: DS.spacing.xl,
    marginTop: DS.spacing.lg,
  },
  scanningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
    marginTop: DS.spacing.md,
    paddingHorizontal: DS.spacing.lg,
    paddingVertical: DS.spacing.sm,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: DS.radius.pill,
  },
  scanningText: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: '#fff',
  },
  controls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  cancelButton: {
    position: 'absolute',
    top: 50,
    left: DS.spacing.md,
    width: 48,
    height: 48,
    borderRadius: DS.radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashButton: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: DS.radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Permission states
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DS.spacing.xl,
    backgroundColor: DS.colors.background,
  },
  permissionTitle: {
    fontSize: DS.typography.fontSize['2xl'],
    fontWeight: DS.typography.fontWeight.bold,
    color: DS.colors.text,
    textAlign: 'center',
    marginTop: DS.spacing.lg,
    marginBottom: DS.spacing.sm,
  },
  permissionText: {
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.textSecondary,
    textAlign: 'center',
    marginBottom: DS.spacing.xl,
  },
  permissionButton: {
    height: 56,
    paddingHorizontal: DS.components.button.paddingX,
    borderRadius: DS.components.button.borderRadius,
    backgroundColor: DS.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 200,
    ...DS.shadows.md,
  },
  permissionButtonText: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.background,
  },
  cancelButtonAlt: {
    marginTop: DS.spacing.md,
    paddingVertical: DS.spacing.md,
    paddingHorizontal: DS.spacing.xl,
  },
  cancelButtonTextAlt: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.medium,
    color: DS.colors.textSecondary,
  },
});
