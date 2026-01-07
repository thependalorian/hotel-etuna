/**
 * QRCodeScanner Component
 * 
 * Location: components/qr/QRCodeScanner.tsx
 * Purpose: Scan QR codes for payments and other actions
 * 
 * Uses camera to scan QR codes
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
// Note: Install expo-camera for QR code scanning
// npx expo install expo-camera
// import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface QRCodeScannerProps {
  onQRCodeScanned?: (data: string) => void;
  onClose?: () => void;
}

export default function QRCodeScanner({ onQRCodeScanned, onClose }: QRCodeScannerProps) {
  // TODO: Install expo-camera and uncomment camera functionality
  // const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // useEffect(() => {
  //   if (!permission) {
  //     requestPermission();
  //   }
  // }, [permission]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    onQRCodeScanned?.(data);
  };

  // Placeholder implementation - replace with actual camera when expo-camera is installed
  return (
    <View style={styles.container}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <FontAwesome name="times" size={24} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.scanArea}>
          <View style={styles.scanFrame} />
          <Text style={styles.scanHint}>
            Install expo-camera to enable QR code scanning
          </Text>
          <Text style={styles.installHint}>
            Run: npx expo install expo-camera
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  // camera: {
  //   flex: 1,
  // },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  scanHint: {
    color: Colors.white,
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  installHint: {
    color: Colors.white,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
    opacity: 0.7,
  },
  message: {
    color: Colors.white,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
    alignSelf: 'center',
  },
  permissionButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
