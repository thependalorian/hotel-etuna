# Camera & QR Scanner Configuration

## Summary

Production-ready camera and QR scanning functionality has been configured for the Smartpay mobile app with full NAMQR validation support.

## Changes Made

### 1. Camera Permissions Configuration (`app.json`)

#### iOS Permissions
Added camera permission to `infoPlist`:
```json
"NSCameraUsageDescription": "SmartPay needs camera access to scan QR codes for payments and transactions."
```

#### Android Permissions
Added CAMERA permission:
```json
"permissions": [
  "ACCESS_COARSE_LOCATION",
  "ACCESS_FINE_LOCATION",
  "CAMERA"
]
```

#### Expo Camera Plugin
Added expo-camera plugin configuration:
```json
[
  "expo-camera",
  {
    "cameraPermission": "SmartPay needs camera access to scan QR codes for payments and transactions."
  }
]
```

### 2. Created useQRScanner Hook (`hooks/useQRScanner.ts`)

A production-ready React hook that encapsulates all QR scanning logic with the following features:

#### Features
- **Camera Permission Management**: Automatic permission requests with status tracking
- **Barcode Scanning**: Configurable debouncing to prevent duplicate scans (default: 2000ms)
- **NAMQR Validation**: Integrated Bank of Namibia v5.0 NAMQR format validation
- **Flash Control**: Toggle camera flash on/off
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Haptic Feedback**: Optional haptic feedback on scan success/failure
- **Auto-reset**: Optional automatic scanner reset after successful scan
- **TypeScript**: Full TypeScript support with detailed types

#### Hook API

```typescript
const {
  permission,           // Camera permission status
  requestPermission,    // Function to request permission
  flashMode,           // Current flash mode ('off' | 'torch')
  toggleFlash,         // Toggle flash function
  scanned,             // Whether a code has been scanned
  resetScanner,        // Reset scanner to scan again
  handleBarCodeScanned, // Handler for CameraView barcode events
  isProcessing,        // Whether currently processing a scan
  lastScannedData,     // Last scanned raw data
  lastValidationResult, // Last NAMQR validation result
} = useQRScanner({
  validateNAMQR: true,  // Enable NAMQR validation
  debounceMs: 2000,     // Debounce time
  enableHaptics: true,  // Enable haptic feedback
  autoReset: false,     // Auto-reset after scan
  autoResetDelay: 3000, // Auto-reset delay
  onValidScan: (rawData, parsedData) => {
    // Handle valid scan
  },
  onInvalidScan: (error, rawData) => {
    // Handle invalid scan
  },
});
```

#### Basic Usage Example

```tsx
import { useQRScanner } from '@/hooks';
import { CameraView } from 'expo-camera';

function QRScannerScreen() {
  const {
    permission,
    requestPermission,
    flashMode,
    toggleFlash,
    scanned,
    handleBarCodeScanned,
  } = useQRScanner({
    validateNAMQR: true,
    onValidScan: (rawData, parsedData) => {
      router.push({
        pathname: '/send-money/amount',
        params: {
          recipientId: parsedData?.data?.smartpayId,
        },
      });
    },
    onInvalidScan: (error) => {
      Alert.alert('Invalid QR', error);
    },
  });

  if (!permission?.granted) {
    return (
      <View>
        <Text>Camera permission required</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  return (
    <CameraView
      style={{ flex: 1 }}
      facing="back"
      flash={flashMode}
      onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      barcodeScannerSettings={{
        barcodeTypes: ['qr'],
      }}
    >
      <Button onPress={toggleFlash} title="Toggle Flash" />
    </CameraView>
  );
}
```

### 3. Existing Components (Verified Working)

#### QRScanner Component (`components/shared/QRScanner.tsx`)
Already production-ready with:
- Full-screen camera view using expo-camera
- Scan frame overlay (280×280px, Figma-compliant)
- Permission handling with user-friendly screens
- Flash toggle
- Cancel button
- Success feedback with haptics
- Accessibility labels

#### Scan QR Screen (`app/(authenticated)/scan-qr/index.tsx`)
Already implemented with:
- NAMQR parsing and validation
- QR type detection (NAMQR, agent, merchant, till, deeplink)
- Smart routing based on QR type
- Error handling with retry options
- Haptic feedback

## Permission States

The camera permission system handles three states:

### 1. Loading State
Displayed while permission status is being determined.

### 2. Permission Denied
Shows a permission request screen with:
- Camera icon
- "Camera Permission Required" title
- Explanation text
- "Grant Permission" button
- Cancel button

### 3. Permission Granted
Shows full camera view with scanning capabilities.

## NAMQR Validation

The scanner integrates with the NAMQR validator (`utils/namqr.ts`) to:

### Validate Required Tags
- Tag 00: Payload Format Indicator
- Tag 53: Currency (must be NAD)
- Tag 58: Country (must be NA)
- Tag 65: Token Vault ID (SmartpayID: SP-XXXXXXXX)
- Tag 63: CRC-16 checksum

### Extract Information
- SmartpayID (e.g., SP-12345678)
- Optional transaction amount
- Optional merchant name
- Optional merchant category

### Detect QR Types
- **NAMQR**: Standard user-to-user payment
- **Agent**: Cash-out at agent location
- **Till**: Cash-out at till/POS
- **Merchant**: Merchant payment
- **Deeplink**: Smartpay deep link URL
- **Unknown**: Unrecognized format

## Testing

All camera and QR functionality is covered by tests:

### Run Tests
```bash
npm test -- camera-qr-setup.test.ts
```

### Test Coverage
- ✅ NAMQR validation (4 tests)
- ✅ SmartpayID validation (2 tests)
- ✅ SmartpayID extraction (4 tests)
- ✅ QR type detection (3 tests)
- ✅ NAMQR generation (3 tests)
- ✅ Camera permissions (2 tests)
- ✅ Package dependencies (2 tests)

**Total: 20/20 tests passing**

## Build Requirements

### iOS
After updating `app.json`, rebuild the native iOS app:
```bash
npx expo prebuild --platform ios --clean
npx expo run:ios
```

### Android
After updating `app.json`, rebuild the native Android app:
```bash
npx expo prebuild --platform android --clean
npx expo run:android
```

### Development Build
For testing with Expo Go (limited camera support):
```bash
npm start
```

**Note:** Full camera functionality requires a development build or production build, as Expo Go has limited camera capabilities.

## Security Considerations

### Permission Handling
- Camera permission is requested only when needed
- Users can deny permission and are shown clear explanation
- App gracefully handles permission denial with fallback UI

### NAMQR Security
- CRC-16 checksum validation prevents tampering
- SmartpayID format validation (SP-XXXXXXXX)
- Currency and country validation (NAD, NA only)
- Invalid QR codes are rejected with clear error messages

### Data Privacy
- No QR scan data is stored without user consent
- Camera feed is not recorded or transmitted
- QR codes contain only public payment identifiers

## Usage in App

### Scan QR Code
```tsx
// Navigate to scanner
router.push('/(authenticated)/scan-qr');

// Or use QRScanner component directly
import { QRScanner } from '@/components/shared/QRScanner';

<QRScanner
  onScan={(data) => handleQRScan(data)}
  onCancel={() => router.back()}
  instructions="Scan merchant QR code"
  showFlashToggle={true}
/>
```

### Show Receive QR Code
```tsx
// Navigate to receive screen
router.push('/(authenticated)/receive');

// Or navigate to full-screen QR
router.push('/(authenticated)/receive/qr');
```

### Use the Hook
```tsx
import { useQRScanner } from '@/hooks';

const scanner = useQRScanner({
  validateNAMQR: true,
  onValidScan: (rawData, parsedData) => {
    console.log('SmartpayID:', parsedData?.data?.smartpayId);
  },
});
```

## Troubleshooting

### Camera Not Working
1. Check if camera permission is granted in device settings
2. Verify app.json has camera permissions configured
3. Rebuild the native app (`npx expo prebuild --clean`)
4. Check if running on physical device (simulator may have issues)

### QR Scanning Not Working
1. Ensure QR code is in NAMQR format
2. Check scanner is receiving barcode events
3. Verify barcode type is set to 'qr'
4. Ensure lighting is adequate for scanning

### Permission Issues
1. Check device settings for camera permission
2. Verify infoPlist has NSCameraUsageDescription
3. Check Android permissions array includes CAMERA
4. Try uninstalling and reinstalling the app

### Build Errors
1. Run `npm install` to ensure all dependencies are installed
2. Clear cache: `npx expo start --clear`
3. Clean rebuild: `npx expo prebuild --clean`
4. Check expo-camera version compatibility

## Dependencies

### Required Packages
- `expo-camera` (^55.0.9): Camera access and barcode scanning
- `react-native-qrcode-svg` (^6.3.21): QR code generation
- `expo-clipboard` (^55.0.8): Copy to clipboard
- `expo-haptics` (^13.0.1): Haptic feedback

All dependencies are already installed and configured.

## References

- [Expo Camera Documentation](https://docs.expo.dev/versions/latest/sdk/camera/)
- [NAMQR Standard v5.0](https://www.bon.com.na) - Bank of Namibia
- [EMV QR Code Specification](https://www.emvco.com/emv-technologies/qrcodes/)
- [Smartpay Design System](./constants/designSystem.ts)
- [NAMQR Implementation Guide](./NAMQR_IMPLEMENTATION.md)

## Next Steps

1. **Test on Physical Device**: Camera requires physical device for full testing
2. **Backend Integration**: Connect NAMQR generation to backend API
3. **Enhanced Features**: Consider adding scan history, QR code customization
4. **Analytics**: Track QR scan success rates and failure reasons
5. **Performance**: Monitor and optimize scanning performance
