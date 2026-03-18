/**
 * useQRScanner Hook – Production-ready QR scanning with expo-camera
 * 
 * Features:
 * - Camera permission management
 * - Barcode scanning with debouncing
 * - NAMQR validation integration
 * - Flash control
 * - Error handling
 * - TypeScript support
 * 
 * Usage:
 * ```tsx
 * const {
 *   permission,
 *   flashMode,
 *   scanned,
 *   requestPermission,
 *   handleBarCodeScanned,
 *   toggleFlash,
 *   resetScanner,
 * } = useQRScanner({
 *   onValidScan: (data, parsedData) => {
 *     console.log('Valid NAMQR:', parsedData);
 *   },
 *   onInvalidScan: (error) => {
 *     console.error('Invalid QR:', error);
 *   },
 *   validateNAMQR: true,
 * });
 * ```
 */

import { useState, useCallback, useRef } from 'react';
import { useCameraPermissions, FlashMode } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { parseNAMQR, extractSmartpayId, getQRCodeType, NAMQRValidationResult } from '@/utils/namqr';

export interface UseQRScannerConfig {
  /**
   * Callback when a valid QR code is scanned
   * @param rawData The raw QR code string
   * @param parsedData The parsed NAMQR data (if validation enabled)
   */
  onValidScan: (rawData: string, parsedData?: NAMQRValidationResult) => void;

  /**
   * Callback when an invalid QR code is scanned
   * @param error Error message
   * @param rawData The raw QR code string
   */
  onInvalidScan?: (error: string, rawData: string) => void;

  /**
   * Whether to validate NAMQR format (default: true)
   */
  validateNAMQR?: boolean;

  /**
   * Debounce time in ms to prevent duplicate scans (default: 2000)
   */
  debounceMs?: number;

  /**
   * Whether to provide haptic feedback on scan (default: true)
   */
  enableHaptics?: boolean;

  /**
   * Whether to automatically reset scanner after successful scan (default: false)
   */
  autoReset?: boolean;

  /**
   * Auto reset delay in ms (default: 3000)
   */
  autoResetDelay?: number;
}

export interface UseQRScannerReturn {
  /**
   * Camera permission status
   */
  permission: ReturnType<typeof useCameraPermissions>[0];

  /**
   * Request camera permission
   */
  requestPermission: () => Promise<void>;

  /**
   * Current flash mode
   */
  flashMode: FlashMode;

  /**
   * Toggle flash on/off
   */
  toggleFlash: () => void;

  /**
   * Whether a QR code has been scanned
   */
  scanned: boolean;

  /**
   * Reset the scanner to allow scanning again
   */
  resetScanner: () => void;

  /**
   * Handle barcode scan event from CameraView
   */
  handleBarCodeScanned: (scanResult: { type: string; data: string }) => void;

  /**
   * Whether the scanner is currently processing a scan
   */
  isProcessing: boolean;

  /**
   * Last scanned data
   */
  lastScannedData: string | null;

  /**
   * Last validation result (if NAMQR validation enabled)
   */
  lastValidationResult: NAMQRValidationResult | null;
}

export function useQRScanner(config: UseQRScannerConfig): UseQRScannerReturn {
  const {
    onValidScan,
    onInvalidScan,
    validateNAMQR = true,
    debounceMs = 2000,
    enableHaptics = true,
    autoReset = false,
    autoResetDelay = 3000,
  } = config;

  const [permission, requestPermissionInternal] = useCameraPermissions();
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScannedData, setLastScannedData] = useState<string | null>(null);
  const [lastValidationResult, setLastValidationResult] = useState<NAMQRValidationResult | null>(null);

  const lastScanTimeRef = useRef<number>(0);
  const autoResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Request camera permission with error handling
   */
  const requestPermission = useCallback(async () => {
    try {
      await requestPermissionInternal();
    } catch (error) {
      console.error('Failed to request camera permission:', error);
    }
  }, [requestPermissionInternal]);

  /**
   * Toggle flash mode
   */
  const toggleFlash = useCallback(() => {
    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setFlashMode(prev => prev === 'off' ? 'torch' : 'off');
  }, [enableHaptics]);

  /**
   * Reset scanner state
   */
  const resetScanner = useCallback(() => {
    setScanned(false);
    setIsProcessing(false);
    setLastScannedData(null);
    setLastValidationResult(null);
    
    if (autoResetTimeoutRef.current) {
      clearTimeout(autoResetTimeoutRef.current);
      autoResetTimeoutRef.current = null;
    }
  }, []);

  /**
   * Handle barcode scan with validation and debouncing
   */
  const handleBarCodeScanned = useCallback(
    ({ data }: { type: string; data: string }) => {
      const now = Date.now();
      
      if (scanned || isProcessing) {
        return;
      }

      if (now - lastScanTimeRef.current < debounceMs) {
        return;
      }

      lastScanTimeRef.current = now;
      setScanned(true);
      setIsProcessing(true);
      setLastScannedData(data);

      if (enableHaptics) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      try {
        if (validateNAMQR) {
          const validationResult = parseNAMQR(data);
          setLastValidationResult(validationResult);

          if (validationResult.isValid && validationResult.data) {
            onValidScan(data, validationResult);
          } else {
            const error = validationResult.error || 'Invalid QR code format';
            
            if (enableHaptics) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }

            if (onInvalidScan) {
              onInvalidScan(error, data);
            }

            setTimeout(() => {
              setScanned(false);
              setIsProcessing(false);
            }, 1500);
            return;
          }
        } else {
          onValidScan(data);
        }

        if (autoReset) {
          autoResetTimeoutRef.current = setTimeout(() => {
            resetScanner();
          }, autoResetDelay);
        }
      } catch (error) {
        console.error('QR scan processing error:', error);
        
        if (enableHaptics) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

        const errorMessage = error instanceof Error ? error.message : 'Failed to process QR code';
        
        if (onInvalidScan) {
          onInvalidScan(errorMessage, data);
        }

        setTimeout(() => {
          setScanned(false);
          setIsProcessing(false);
        }, 1500);
      }
    },
    [
      scanned,
      isProcessing,
      debounceMs,
      enableHaptics,
      validateNAMQR,
      onValidScan,
      onInvalidScan,
      autoReset,
      autoResetDelay,
      resetScanner,
    ]
  );

  return {
    permission,
    requestPermission,
    flashMode,
    toggleFlash,
    scanned,
    resetScanner,
    handleBarCodeScanned,
    isProcessing,
    lastScannedData,
    lastValidationResult,
  };
}

/**
 * Utility exports for QR code validation
 */
export { parseNAMQR, extractSmartpayId, getQRCodeType };
export type { NAMQRValidationResult };
