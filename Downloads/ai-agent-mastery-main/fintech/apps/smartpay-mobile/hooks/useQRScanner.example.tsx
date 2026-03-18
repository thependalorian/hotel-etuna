/**
 * useQRScanner Hook - Usage Examples
 * 
 * This file demonstrates various ways to use the useQRScanner hook
 * for different QR scanning scenarios in the Smartpay app.
 */

import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { CameraView } from 'expo-camera';
import { router } from 'expo-router';
import { useQRScanner } from './useQRScanner';
import { designSystem as DS } from '@/constants/designSystem';

/**
 * Example 1: Basic QR Scanner with NAMQR Validation
 * Perfect for payment flows where you need validated NAMQR codes
 */
export function BasicQRScannerExample() {
  const {
    permission,
    requestPermission,
    flashMode,
    toggleFlash,
    scanned,
    handleBarCodeScanned,
    resetScanner,
  } = useQRScanner({
    validateNAMQR: true,
    onValidScan: (rawData, parsedData) => {
      console.log('Valid NAMQR scanned!');
      console.log('SmartpayID:', parsedData?.data?.smartpayId);
      console.log('Amount:', parsedData?.data?.amount);
      
      router.push({
        pathname: '/(authenticated)/send-money/amount',
        params: {
          recipientId: parsedData?.data?.smartpayId || '',
        },
      });
    },
    onInvalidScan: (error, rawData) => {
      Alert.alert('Invalid QR Code', error, [
        { text: 'Try Again', onPress: resetScanner },
        { text: 'Cancel', style: 'cancel' },
      ]);
    },
  });

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text>Camera permission required</Text>
        <Text onPress={requestPermission}>Grant Permission</Text>
      </View>
    );
  }

  return (
    <CameraView
      style={styles.camera}
      facing="back"
      flash={flashMode}
      onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      barcodeScannerSettings={{
        barcodeTypes: ['qr'],
      }}
    >
      <Text onPress={toggleFlash}>Toggle Flash</Text>
    </CameraView>
  );
}

/**
 * Example 2: Non-validating Scanner
 * For scanning any QR code without NAMQR validation
 */
export function GenericQRScannerExample() {
  const {
    permission,
    requestPermission,
    handleBarCodeScanned,
    scanned,
  } = useQRScanner({
    validateNAMQR: false,
    onValidScan: (rawData) => {
      console.log('QR scanned:', rawData);
      Alert.alert('Scanned', rawData);
    },
  });

  if (!permission?.granted) {
    return <Text onPress={requestPermission}>Request Camera</Text>;
  }

  return (
    <CameraView
      style={styles.camera}
      onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      barcodeScannerSettings={{
        barcodeTypes: ['qr'],
      }}
    />
  );
}

/**
 * Example 3: Auto-reset Scanner
 * Automatically resets after scanning, useful for continuous scanning
 */
export function AutoResetQRScannerExample() {
  const {
    permission,
    requestPermission,
    handleBarCodeScanned,
    scanned,
    lastScannedData,
  } = useQRScanner({
    validateNAMQR: true,
    autoReset: true,
    autoResetDelay: 3000,
    onValidScan: (rawData, parsedData) => {
      console.log('Scanned:', parsedData?.data?.smartpayId);
    },
  });

  if (!permission?.granted) {
    return <Text onPress={requestPermission}>Request Camera</Text>;
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
      {lastScannedData && (
        <View style={styles.feedback}>
          <Text style={styles.feedbackText}>Scanned: {lastScannedData}</Text>
        </View>
      )}
    </View>
  );
}

/**
 * Example 4: Custom Debounce and Haptics
 * Fine-tune scanning behavior with custom configuration
 */
export function CustomConfigQRScannerExample() {
  const {
    permission,
    requestPermission,
    handleBarCodeScanned,
    scanned,
    isProcessing,
  } = useQRScanner({
    validateNAMQR: true,
    debounceMs: 3000,
    enableHaptics: true,
    onValidScan: (rawData, parsedData) => {
      console.log('Valid scan with custom config');
    },
    onInvalidScan: (error) => {
      console.error('Invalid scan:', error);
    },
  });

  if (!permission?.granted) {
    return <Text onPress={requestPermission}>Request Camera</Text>;
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
      {isProcessing && (
        <View style={styles.processing}>
          <Text style={styles.processingText}>Processing...</Text>
        </View>
      )}
    </View>
  );
}

/**
 * Example 5: Type-specific Routing
 * Route to different screens based on QR code type
 */
export function TypeAwareQRScannerExample() {
  const {
    permission,
    requestPermission,
    handleBarCodeScanned,
    scanned,
    lastValidationResult,
  } = useQRScanner({
    validateNAMQR: true,
    onValidScan: (rawData, parsedData) => {
      const qrType = parsedData?.data?.merchantCategory?.includes('AGENT') 
        ? 'agent' 
        : parsedData?.data?.merchantCategory?.includes('TILL')
        ? 'till'
        : parsedData?.data?.merchantCategory
        ? 'merchant'
        : 'namqr';

      switch (qrType) {
        case 'agent':
          router.push({
            pathname: '/(authenticated)/cash-out/confirm',
            params: { agentId: parsedData?.data?.smartpayId },
          });
          break;
        
        case 'till':
          router.push({
            pathname: '/(authenticated)/cash-out/confirm',
            params: { tillId: parsedData?.data?.smartpayId },
          });
          break;
        
        case 'merchant':
          router.push({
            pathname: '/(authenticated)/pay-merchant/confirm',
            params: {
              merchantId: parsedData?.data?.smartpayId,
              amount: parsedData?.data?.amount?.toString() || '',
            },
          });
          break;
        
        default:
          router.push({
            pathname: '/(authenticated)/send-money/amount',
            params: { recipientId: parsedData?.data?.smartpayId },
          });
      }
    },
    onInvalidScan: (error) => {
      Alert.alert('Invalid QR Code', error);
    },
  });

  if (!permission?.granted) {
    return <Text onPress={requestPermission}>Request Camera</Text>;
  }

  return (
    <CameraView
      style={styles.camera}
      onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      barcodeScannerSettings={{
        barcodeTypes: ['qr'],
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  feedback: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    padding: DS.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: DS.radius.lg,
  },
  feedbackText: {
    color: '#fff',
    fontSize: DS.typography.fontSize.sm,
    textAlign: 'center',
  },
  processing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  processingText: {
    color: '#fff',
    fontSize: DS.typography.fontSize.lg,
    fontWeight: DS.typography.fontWeight.semibold,
  },
});
