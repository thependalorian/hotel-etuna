/**
 * QR Code Download Utility
 * 
 * Location: utils/qrDownload.ts
 * Purpose: Download and share QR codes as images or text files
 * 
 * Uses expo-file-system and expo-sharing for file operations
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';

/**
 * Download QR code as text file (temporary solution until react-native-qrcode-svg is installed)
 * When react-native-qrcode-svg is available, this can be enhanced to save as PNG/JPEG image
 */
export async function downloadQRCodeAsText(
  qrData: string,
  fileName?: string
): Promise<string | null> {
  try {
    if (!qrData) {
      throw new Error('QR code data is required');
    }

    const timestamp = Date.now();
    const defaultFileName = fileName || `Buffr_QR_Code_${timestamp}.txt`;
    const fileUri = `${FileSystem.documentDirectory}${defaultFileName}`;

    // Save QR data as text file
    await FileSystem.writeAsStringAsync(fileUri, qrData, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return fileUri;
  } catch (error) {
    console.error('Error saving QR code:', error);
    throw error;
  }
}

/**
 * Share QR code file
 */
export async function shareQRCodeFile(fileUri: string): Promise<void> {
  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/plain',
        dialogTitle: 'Share Buffr QR Code',
      });
    } else {
      Alert.alert('Error', 'Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Error sharing QR code file:', error);
    throw error;
  }
}

/**
 * Download and share QR code in one operation
 */
export async function downloadAndShareQRCode(
  qrData: string,
  fileName?: string
): Promise<void> {
  try {
    const fileUri = await downloadQRCodeAsText(qrData, fileName);
    if (fileUri) {
      await shareQRCodeFile(fileUri);
    }
  } catch (error) {
    console.error('Error in download and share:', error);
    throw error;
  }
}

/**
 * Save QR code image to device storage
 * Requires base64 image data from QRCode component
 */
export async function saveQRCodeImage(
  base64ImageData: string,
  format: 'png' | 'jpeg' = 'png'
): Promise<string | null> {
  try {
    if (!base64ImageData) {
      throw new Error('QR code image data is required');
    }

    const extension = format === 'png' ? 'png' : 'jpg';
    const fileName = `Buffr_QR_Code_${Date.now()}.${extension}`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    // Remove data URL prefix if present (data:image/png;base64,)
    const base64Data = base64ImageData.includes(',')
      ? base64ImageData.split(',')[1]
      : base64ImageData;

    // Save base64 image data as file
    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return fileUri;
  } catch (error) {
    console.error('Error saving QR code image:', error);
    return null;
  }
}

/**
 * Share QR code image file
 */
export async function shareQRCodeImage(fileUri: string, format: 'png' | 'jpeg' = 'png'): Promise<void> {
  try {
    if (await Sharing.isAvailableAsync()) {
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: 'Share Buffr QR Code',
      });
    } else {
      Alert.alert('Error', 'Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Error sharing QR code image:', error);
    throw error;
  }
}

/**
 * Download and share QR code image in one operation
 */
export async function downloadAndShareQRCodeImage(
  base64ImageData: string,
  format: 'png' | 'jpeg' = 'png'
): Promise<void> {
  try {
    const fileUri = await saveQRCodeImage(base64ImageData, format);
    if (fileUri) {
      await shareQRCodeImage(fileUri, format);
    } else {
      throw new Error('Failed to save QR code image');
    }
  } catch (error) {
    console.error('Error in download and share QR code image:', error);
    throw error;
  }
}
