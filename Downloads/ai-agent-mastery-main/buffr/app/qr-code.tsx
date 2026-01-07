/**
 * QR Code Display Screen
 * 
 * Location: app/qr-code.tsx
 * Purpose: Display user's QR code for receiving payments (NAMQR format)
 * 
 * Based on: Your QR Code.svg design
 * Uses: NAMQR Code Standards Version 5.0
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import { downloadAndShareQRCode, saveQRCodeImage, downloadAndShareQRCodeImage } from '@/utils/qrDownload';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useUser } from '@/contexts/UserContext';
import { ScreenHeader, PillButton, EmptyState } from '@/components/common';
import QRCodeDisplay, { type QRCodeDisplayRef } from '@/components/qr/QRCodeDisplay';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';

export default function QRCodeScreen() {
  const router = useRouter();
  const { user } = useUser();
  const qrCodeRef = useRef<QRCodeDisplayRef>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleBack = () => {
    router.back();
  };

  // Generate Buffr ID (UPI alias) from user data
  const getBuffrId = () => {
    if (!user) return 'user@bfr';
    const email = user.email || user.phoneNumber || 'user';
    const username = email.split('@')[0] || email.replace(/[^a-zA-Z0-9]/g, '.');
    return `${username}@bfr`;
  };

  const handleCopyUPI = async () => {
    const upiId = getBuffrId();
    try {
      await Share.share({
        message: upiId,
        title: 'Buffr UPI ID',
      });
    } catch (error) {
      console.error('Error sharing UPI ID:', error);
      Alert.alert('UPI ID', upiId, [
        { text: 'OK' },
      ]);
    }
  };

  const handleDownloadQR = async () => {
    if (!qrCodeRef.current) {
      Alert.alert('Error', 'QR code is not ready');
      return;
    }

    setIsDownloading(true);
    try {
      // Get base64 image data from QRCode component
      const base64ImageData = await qrCodeRef.current.getQRImageData();
      
      if (!base64ImageData) {
        Alert.alert('Error', 'Failed to generate QR code image');
        return;
      }

      // Save QR code as PNG image
      const fileUri = await saveQRCodeImage(base64ImageData, 'png');
      
      if (fileUri) {
        Alert.alert(
          'Success',
          'QR code saved successfully!',
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert('Error', 'Failed to save QR code');
      }
    } catch (error) {
      console.error('Error downloading QR code:', error);
      Alert.alert('Error', 'Failed to download QR code. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareQR = async () => {
    if (!qrCodeRef.current) {
      Alert.alert('Error', 'QR code is not ready');
      return;
    }

    try {
      // Get base64 image data from QRCode component
      const base64ImageData = await qrCodeRef.current.getQRImageData();
      
      if (!base64ImageData) {
        // Fallback to text sharing if image generation fails
        const qrCodeData = qrCodeRef.current.getQRData();
        if (qrCodeData) {
          await downloadAndShareQRCode(qrCodeData, `Buffr_QR_Code_${Date.now()}.txt`);
        } else {
          Alert.alert('Error', 'QR code data is not available');
        }
        return;
      }

      // Share QR code as image
      await downloadAndShareQRCodeImage(base64ImageData, 'png');
    } catch (error) {
      console.error('Error sharing QR code:', error);
      Alert.alert('Error', 'Failed to share QR code. Please try again.');
    }
  };

  if (!user) {
    return (
      <View style={defaultStyles.container}>
        <ScreenHeader title="Your QR Code" onBack={handleBack} showBackButton />
        <EmptyState
          icon="qrcode"
          title="User information not available"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Your QR Code" onBack={handleBack} showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* White Card with QR Code */}
        <View style={styles.qrCard}>
          {/* User Profile Picture and Name */}
          <View style={styles.userHeader}>
            <View style={styles.avatarContainer}>
              <FontAwesome name="user-circle" size={50} color={Colors.primary} />
            </View>
            <Text style={styles.userName}>
              {user.fullName || user.firstName || 'Buffr User'}
            </Text>
          </View>

          {/* QR Code Display */}
          <View style={styles.qrCodeContainer}>
            <QRCodeDisplay
              ref={qrCodeRef}
              accountType="buffr"
              userName={user.fullName || user.firstName || 'Buffr User'}
              minimal={true}
            />
          </View>

          {/* UPI Alias with Copy Icon */}
          <View style={styles.upiContainer}>
            <View style={styles.upiTag}>
              <Text style={styles.upiLabel}>UPI: </Text>
              <Text style={styles.upiId}>{getBuffrId()}</Text>
            </View>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyUPI}
              activeOpacity={0.7}
            >
              <FontAwesome name="copy" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Instruction Text */}
          <Text style={styles.instructionText}>
            Scan to pay with any UPI app
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <PillButton
            label="Share QR"
            icon="share"
            variant="dark"
            onPress={handleShareQR}
            style={styles.actionButton}
          />
          <PillButton
            label={isDownloading ? 'Downloading...' : 'Download QR'}
            icon="download"
            variant="outline"
            onPress={handleDownloadQR}
            disabled={isDownloading}
            loading={isDownloading}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8', // Light blue-gray background (gradient effect can be added with LinearGradient if needed)
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  qrCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginTop: 20,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  avatarContainer: {
    marginRight: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  qrCodeContainer: {
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 12,
    width: '100%',
  },
  upiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  upiLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.white,
  },
  upiId: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  copyButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primaryMuted,
    borderRadius: 18, // Pill-shaped (circular)
  },
  instructionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 24,
    width: '100%',
    maxWidth: 400,
  },
  actionButton: {
    flex: 1,
  },
});
