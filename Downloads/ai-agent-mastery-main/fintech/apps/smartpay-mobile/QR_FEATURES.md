# SmartPay QR Features

Complete guide for camera setup, QR code scanning, and NAMQR receive flow implementation.

---

## Table of Contents

- [Overview](#overview)
- [Camera Setup](#camera-setup)
- [QR Code Scanning](#qr-code-scanning)
- [NAMQR Receive Flow](#namqr-receive-flow)
- [Testing](#testing)

---

## Overview

SmartPay implements production-ready camera and QR scanning with full NAMQR validation support compliant with Bank of Namibia v5.0 standards.

### Features

- ✅ Camera permissions (iOS + Android)
- ✅ QR code scanning with expo-camera
- ✅ NAMQR v5.0 format validation
- ✅ CRC-16 checksum verification
- ✅ SmartpayID extraction (SP-XXXXXXXX)
- ✅ Deep linking for all QR types
- ✅ QR code generation
- ✅ Flash control
- ✅ Haptic feedback

### NAMQR Format (Bank of Namibia v5.0)

```
Structure: TTLLVV (Tag-Length-Value)

Required Tags:
- 00: Payload version ("01")
- 53: Currency ("NAD")
- 58: Country ("NA")
- 65: SmartpayID ("SP-XXXXXXXX")
- 63: CRC-16 checksum

Example:
000201 5303NAD 5802NA 6512SP-12345678 6304XXXX
```

### QR Types

SmartPay detects and routes different QR code types:

| Type | Description | Route |
|------|-------------|-------|
| NAMQR | User-to-user payment | `/send-money/amount` |
| Agent | Cash-out at agent location | `/cash-out/agent` |
| Till | Cash-out at till/POS | `/cash-out/till` |
| Merchant | Merchant payment | `/pay-merchant` |
| Deeplink | SmartPay deep link | Dynamic routing |
| Unknown | Unrecognized format | Error alert |

---

## Camera Setup

### 1. Camera Permissions

Camera permissions are configured in `app.json`:

**iOS:**
```json
{
  "ios": {
    "infoPlist": {
      "NSCameraUsageDescription": "SmartPay needs camera access to scan QR codes for payments and transactions."
    }
  }
}
```

**Android:**
```json
{
  "android": {
    "permissions": [
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "CAMERA"
    ]
  }
}
```

**Expo Camera Plugin:**
```json
{
  "plugins": [
    [
      "expo-camera",
      {
        "cameraPermission": "SmartPay needs camera access to scan QR codes for payments and transactions."
      }
    ]
  ]
}
```

### 2. Permission States

The camera permission system handles three states:

**Loading State:**
Displayed while permission status is being determined.

**Permission Denied:**
Shows permission request screen with:
- Camera icon
- "Camera Permission Required" title
- Explanation text
- "Grant Permission" button
- Cancel button

**Permission Granted:**
Shows full camera view with scanning capabilities.

### 3. Build Requirements

After updating `app.json`, rebuild the native app:

**iOS:**
```bash
npx expo prebuild --platform ios --clean
npx expo run:ios
```

**Android:**
```bash
npx expo prebuild --platform android --clean
npx expo run:android
```

**Note:** Full camera functionality requires a development build or production build. Expo Go has limited camera capabilities.

---

## QR Code Scanning

### useQRScanner Hook

A production-ready React hook that encapsulates all QR scanning logic.

**Features:**
- Camera permission management
- Barcode scanning with configurable debouncing (default: 2000ms)
- NAMQR validation (Bank of Namibia v5.0)
- Flash control
- Error handling
- Haptic feedback
- Auto-reset

**Usage:**

```typescript
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

**Hook API:**

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
  onValidScan: (rawData, parsedData) => {},
  onInvalidScan: (error, rawData) => {},
});
```

### QRScanner Component

Reusable scanner component with overlay:

**Features:**
- Full-screen camera view
- 280×280px scan frame (Figma-compliant)
- Flash toggle
- Cancel button
- Success feedback with haptics
- Accessibility labels

**Usage:**

```typescript
import { QRScanner } from '@/components/shared';

<QRScanner
  onScan={(data) => handleScan(data)}
  onCancel={() => router.back()}
  instructions="Scan merchant QR code"
  showFlashToggle={true}
/>
```

### NAMQR Validation

The scanner integrates with the NAMQR validator to:

**Validate Required Tags:**
- Tag 00: Payload Format Indicator
- Tag 53: Currency (must be NAD)
- Tag 58: Country (must be NA)
- Tag 65: Token Vault ID (SmartpayID: SP-XXXXXXXX)
- Tag 63: CRC-16 checksum

**Extract Information:**
- SmartpayID (e.g., SP-12345678)
- Optional transaction amount
- Optional merchant name
- Optional merchant category

**Detect QR Types:**
- NAMQR (standard user-to-user)
- Agent (cash-out location)
- Till (POS cash-out)
- Merchant (payment)
- Deeplink (SmartPay URL)
- Unknown (unrecognized)

---

## NAMQR Receive Flow

### Screens

#### 1. Receive Money (`/receive`)

Main receive screen with QR code.

**Features:**
- QR code (200×200px)
- SmartpayID with copy button
- Instructions and "How it works"
- Share button

**Usage:**
```typescript
router.push('/(authenticated)/receive');
```

#### 2. Full-Screen QR (`/receive/qr`)

Large QR code optimized for scanning.

**Features:**
- Large QR code (320px)
- Copy and share options

#### 3. QR Scanner (`/scan-qr`)

Full-screen camera scanner.

**Features:**
- NAMQR validation
- Auto-routes to correct screen
- Flash toggle

**Usage:**
```typescript
router.push('/(authenticated)/scan-qr');
```

#### 4. My QR Code (`/qr-code`)

Personal QR display.

**Features:**
- User info card
- Quick actions

### NAMQR Utilities

**Parse NAMQR:**

```typescript
import { parseNAMQR } from '@/utils/namqr';

const result = parseNAMQR(qrString);
if (result.isValid && result.data) {
  console.log('SmartpayID:', result.data.smartpayId);
  console.log('Amount:', result.data.amount);
}
```

**Generate NAMQR:**

```typescript
import { generateNAMQR } from '@/utils/namqr';
import QRCode from 'react-native-qrcode-svg';

const qrData = generateNAMQR('SP-12345678', 100.50);

<QRCode value={qrData} size={200} />
```

**Validate SmartpayID:**

```typescript
import { validateSmartpayId } from '@/utils/namqr';

const isValid = validateSmartpayId('SP-12345678');
console.log('Valid:', isValid); // true
```

**Extract SmartpayID:**

```typescript
import { extractSmartpayId } from '@/utils/namqr';

const id = extractSmartpayId(namqrString);
console.log('SmartpayID:', id); // "SP-12345678"
```

---

## Testing

### Test Coverage

All camera and QR functionality is covered by tests:

```bash
npm test -- camera-qr-setup.test.ts
```

**Test Results:**
- ✅ NAMQR validation (4 tests)
- ✅ SmartpayID validation (2 tests)
- ✅ SmartpayID extraction (4 tests)
- ✅ QR type detection (3 tests)
- ✅ NAMQR generation (3 tests)
- ✅ Camera permissions (2 tests)
- ✅ Package dependencies (2 tests)

**Total: 20/20 tests passing**

### Testing Checklist

**Permission Flow:**
- [ ] Permission prompt appears on first run
- [ ] Deny permission → Shows "Enable in Settings"
- [ ] Grant permission → Camera view appears
- [ ] Settings link opens system settings

**QR Scanning:**
- [ ] Valid NAMQR → Routes to send money
- [ ] Invalid QR → Shows error alert
- [ ] Flash toggle works
- [ ] Scanner resets after successful scan

**Receive Flow:**
- [ ] QR code displays correctly
- [ ] Copy SmartpayID works
- [ ] Share button opens native sheet
- [ ] Tap QR → Goes to full-screen view

**NAMQR Validation:**
- [ ] Valid NAMQR passes validation
- [ ] Invalid format rejected
- [ ] Wrong currency rejected (non-NAD)
- [ ] Wrong country rejected (non-NA)
- [ ] Bad checksum rejected

---

## Troubleshooting

### Camera Not Working

**Check:**
1. Camera permission granted in device settings
2. `app.json` has camera permissions configured
3. Rebuild native app (`npx expo prebuild --clean`)
4. Test on physical device (simulators limited)

**Solutions:**
```bash
# iOS
npx expo prebuild --platform ios --clean
npx expo run:ios

# Android
npx expo prebuild --platform android --clean
npx expo run:android
```

### QR Scanning Not Working

**Check:**
1. QR code is in NAMQR format
2. Scanner receiving barcode events
3. Barcode type set to 'qr'
4. Adequate lighting for scanning

**Debug:**
```typescript
onBarcodeScanned={(result) => {
  console.log('Scanned:', result.type, result.data);
  handleBarCodeScanned(result);
}}
```

### Permission Issues

**Check:**
1. Device settings for camera permission
2. `infoPlist` has `NSCameraUsageDescription` (iOS)
3. Android permissions array includes `CAMERA`
4. Try uninstalling and reinstalling app

**Reset permissions:**
```bash
# iOS Simulator
xcrun simctl privacy booted reset camera

# Uninstall and reinstall
npm run ios
# or
npm run android
```

### Build Errors

**Solutions:**
1. Run `npm install` to ensure dependencies installed
2. Clear cache: `npx expo start --clear`
3. Clean rebuild: `npx expo prebuild --clean`
4. Check expo-camera version compatibility

---

## Security

### Permission Handling
- Camera permission requested only when needed
- Clear explanation shown to users
- Graceful fallback UI for denied permission

### NAMQR Security
- CRC-16 checksum validation prevents tampering
- SmartpayID format validation (SP-XXXXXXXX)
- Currency and country validation (NAD, NA only)
- Invalid QR codes rejected with clear error messages

### Data Privacy
- No QR scan data stored without user consent
- Camera feed not recorded or transmitted
- QR codes contain only public payment identifiers

---

## Dependencies

Required packages (already installed):

- `expo-camera` (^55.0.9) - Camera access and barcode scanning
- `react-native-qrcode-svg` (^6.3.21) - QR code generation
- `expo-clipboard` (^55.0.8) - Copy to clipboard
- `expo-haptics` (^13.0.1) - Haptic feedback

---

## Files Reference

**Created:**
- `hooks/useQRScanner.ts` - QR scanning hook
- `components/shared/QRScanner.tsx` - Scanner component
- `utils/namqr.ts` - NAMQR validator & parser
- `app/(authenticated)/receive/index.tsx` - Receive screen
- `app/(authenticated)/receive/qr.tsx` - Full-screen QR
- `app/(authenticated)/scan-qr/index.tsx` - Scanner screen
- `app/(authenticated)/qr-code/index.tsx` - My QR code

**Modified:**
- `app.json` - Added camera permissions
- `contexts/UserContext.tsx` - Added smartpayId

---

## User Flows

### Receive Money Flow

```
Services Grid → "Receive" → Show QR code
                          ↓
              User shares/shows QR
                          ↓
              Payer scans & sends money
```

### Send via QR Flow

```
Send Money → "Scan QR" → Camera opens
                       ↓
              Scan NAMQR code
                       ↓
              Validate & route to:
              • Send money (user QR)
              • Cash-out (agent/till QR)
              • Pay merchant (merchant QR)
```

### My QR Code Flow

```
Profile → "My QR Code" → Show personal QR
                       ↓
              Copy / Share / Enlarge
```

---

## Design System

All components follow `constants/designSystem.ts`:

- **Colors:** Brand teal (`#005D6E`), Success green (`#22C55E`)
- **Spacing:** 8px grid system
- **Typography:** 16px body, 18px subheading, 24px title
- **QR Size:** 200px minimum (Figma NAMQRDisplay spec)
- **Scan Frame:** 280×280px, 16px radius, 2px white border
- **Shadows:** `DS.shadows.md` for cards

---

## Navigation Routes

```typescript
// Receive money (show QR)
router.push('/(authenticated)/receive');

// Full-screen QR
router.push('/(authenticated)/receive/qr');

// Scan QR code
router.push('/(authenticated)/scan-qr');

// My QR code
router.push('/(authenticated)/qr-code');
```

---

## Resources

- [Expo Camera Documentation](https://docs.expo.dev/versions/latest/sdk/camera/)
- [NAMQR Standard v5.0](https://www.bon.com.na) - Bank of Namibia
- [EMV QR Code Specification](https://www.emvco.com/emv-technologies/qrcodes/)
- [NAMQR Implementation Guide](./NAMQR_IMPLEMENTATION.md)

---

**Last Updated:** March 17, 2026  
**Status:** Production Ready ✅
