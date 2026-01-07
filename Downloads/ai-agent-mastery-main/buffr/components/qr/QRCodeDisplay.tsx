/**
 * QRCodeDisplay Component
 * 
 * Location: components/qr/QRCodeDisplay.tsx
 * Purpose: Display user's QR code for receiving payments using NAMQR format
 * 
 * Based on Your QR Code.svg design
 * Uses NAMQR Code Standards Version 5.0 for QR code generation
 */

import React, { useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';
import { useUser } from '@/contexts/UserContext';
import { useWallets } from '@/contexts/WalletsContext';
import { generateBuffrAccountNAMQR, generateBuffrWalletNAMQR } from '@/utils/namqr';
import PillButton from '@/components/common/PillButton';

interface QRCodeDisplayProps {
  accountType?: 'buffr' | 'wallet'; // Account type for QR code
  walletId?: string; // Wallet ID if accountType is 'wallet'
  amount?: string; // Optional amount for dynamic QR
  userName?: string;
  onShare?: () => void;
  minimal?: boolean; // If true, only render QR code without extra UI
}

export interface QRCodeDisplayRef {
  getQRData: () => string;
  getQRImageData: () => Promise<string | null>; // Returns base64 image data
}

const QRCodeDisplay = forwardRef<QRCodeDisplayRef, QRCodeDisplayProps>(({
  accountType = 'buffr',
  walletId,
  amount,
  userName,
  onShare,
  minimal = false,
}, ref) => {
  const { user } = useUser();
  const { wallets } = useWallets();
  const qrCodeRef = useRef<any>(null);

  // Generate NAMQR code data
  const qrData = useMemo(() => {
    if (!user) return '';

    // Generate token vault ID (in production, this would come from Token Vault API)
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 11);
    const tokenVaultId = `${timestamp}${random}`.substring(0, 20);

    if (accountType === 'wallet' && walletId) {
      const wallet = wallets.find((w) => w.id === walletId);
      if (wallet) {
        return generateBuffrWalletNAMQR(
          walletId,
          wallet.name,
          user.city || 'Windhoek',
          tokenVaultId,
          amount,
          !amount // Static if no amount, dynamic if amount provided
        );
      }
    }

    // Generate for main Buffr account
    return generateBuffrAccountNAMQR(
      user.phoneNumber,
      user.fullName || user.firstName || 'Buffr User',
      user.city || 'Windhoek',
      tokenVaultId,
      amount,
      !amount // Static if no amount, dynamic if amount provided
    );
  }, [user, accountType, walletId, wallets, amount]);

  // Expose QR data via ref for download functionality
  useImperativeHandle(ref, () => ({
    getQRData: () => qrData,
    getQRImageData: async () => {
      if (qrCodeRef.current && qrData) {
        try {
          // Get base64 image data from QRCode component using toDataURL method
          // react-native-qrcode-svg provides toDataURL callback
          const dataUrl = await new Promise<string>((resolve, reject) => {
            try {
              qrCodeRef.current.toDataURL((data: string) => {
                if (data) {
                  resolve(data);
                } else {
                  reject(new Error('Failed to generate QR code image'));
                }
              });
            } catch (error) {
              reject(error);
            }
          });
          return dataUrl;
        } catch (error) {
          console.error('Error getting QR image data:', error);
          return null;
        }
      }
      return null;
    },
  }));

  const handleShare = async () => {
    try {
      const accountName = accountType === 'wallet' 
        ? wallets.find((w) => w.id === walletId)?.name || 'Wallet'
        : userName || user?.fullName || 'Buffr Account';
      
      await Share.share({
        message: `Scan my Buffr QR code to send me money!\n${accountName}`,
        title: 'My Buffr QR Code',
      });
      onShare?.();
    } catch (error) {
      console.error('Error sharing QR code:', error);
    }
  };

  // Minimal mode: just render the QR code
  if (minimal) {
    return (
      <View style={styles.minimalContainer}>
        {qrData ? (
          <QRCode
            getRef={(ref) => {
              qrCodeRef.current = ref;
            }}
            value={qrData}
            size={250}
            color={Colors.text}
            backgroundColor={Colors.white}
            errorCorrectionLevel="M" // Medium error correction (15%) per NAMQR recommendations
          />
        ) : (
          <View style={styles.qrPlaceholder}>
            <FontAwesome name="qrcode" size={120} color={Colors.textSecondary} />
            <Text style={styles.qrPlaceholderText}>
              Generating QR Code...
            </Text>
          </View>
        )}
      </View>
    );
  }

  // Full mode: render with all UI elements
  return (
    <View style={defaultStyles.containerCentered}>
      <Text style={defaultStyles.headerMedium}>Your QR Code</Text>
      {userName && (
        <Text style={defaultStyles.descriptionText}>
          {userName}'s payment QR code
        </Text>
      )}

      <View style={styles.qrContainer}>
        {qrData ? (
          <View style={styles.qrCodeWrapper}>
            <QRCode
              getRef={(ref) => {
                qrCodeRef.current = ref;
              }}
              value={qrData}
              size={250}
              color={Colors.text}
              backgroundColor={Colors.white}
              errorCorrectionLevel="M" // Medium error correction (15%) per NAMQR recommendations
            />
            <Text style={styles.qrFormatText}>
              Format: NAMQR v5.0 (TLV)
            </Text>
          </View>
        ) : (
          <View style={styles.qrPlaceholder}>
            <FontAwesome name="qrcode" size={120} color={Colors.textSecondary} />
            <Text style={styles.qrPlaceholderText}>
              Generating QR Code...
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.qrHint}>
        Ask others to scan this code to send you money
      </Text>

      <PillButton
        label="Share QR Code"
        icon="share"
        variant="primary"
        onPress={handleShare}
        style={styles.shareButton}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  minimalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrContainer: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 20,
    marginVertical: 32,
    shadowColor: Colors.dark,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCodeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  qrPlaceholder: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  qrPlaceholderText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  qrDataText: {
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: 'center',
    fontFamily: 'monospace',
    marginTop: 8,
  },
  qrFormatText: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  qrHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  shareButton: {
    flexDirection: 'row',
    gap: 8,
    minWidth: 200,
  },
});

QRCodeDisplay.displayName = 'QRCodeDisplay';

export default QRCodeDisplay;
