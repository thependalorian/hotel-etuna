# Receive & QR Screens - Quick Start Guide

## ✅ What Was Implemented

### 🎯 Screens Created

1. **`app/(authenticated)/receive/index.tsx`** - Main receive screen
   - Shows QR code (200×200px)
   - SmartpayID with copy button
   - Instructions and "How it works"
   - Share button

2. **`app/(authenticated)/receive/qr.tsx`** - Full-screen QR
   - Large QR code (320px)
   - Optimized for scanning
   - Copy and share options

3. **`app/(authenticated)/scan-qr/index.tsx`** - QR Scanner
   - Full-screen camera
   - NAMQR validation
   - Auto-routes to correct screen

4. **`app/(authenticated)/qr-code/index.tsx`** - My QR Code
   - Personal QR display
   - User info card
   - Quick actions

### 🧩 Components Created

1. **`components/shared/QRScanner.tsx`** - Reusable scanner
   - Camera with overlay
   - 280×280px scan frame (Figma spec)
   - Flash toggle
   - Permission handling

### 🛠️ Utilities Created

1. **`utils/namqr.ts`** - NAMQR validator & parser
   - Parse NAMQR v5.0 format
   - Validate checksums (CRC-16)
   - Generate NAMQR codes
   - Extract SmartpayID
   - Detect QR types

## 📱 User Flows

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

## 🎨 Design System Used

All components follow `constants/designSystem.ts`:

- **Colors:** Brand teal (`#005D6E`), Success green (`#22C55E`)
- **Spacing:** 8px grid system
- **Typography:** 16px body, 18px subheading, 24px title
- **QR Size:** 200px minimum (Figma NAMQRDisplay spec)
- **Scan Frame:** 280×280px, 16px radius, 2px white border (Figma spec)
- **Shadows:** `DS.shadows.md` for cards

## 🔧 NAMQR Format (Bank of Namibia v5.0)

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

## 💻 Code Examples

### 1. Navigate to Receive Screen
```typescript
import { router } from 'expo-router';

router.push('/(authenticated)/receive');
```

### 2. Parse Scanned QR Code
```typescript
import { parseNAMQR } from '@/utils/namqr';

const result = parseNAMQR(qrString);
if (result.isValid && result.data) {
  console.log('SmartpayID:', result.data.smartpayId);
  console.log('Amount:', result.data.amount);
}
```

### 3. Generate NAMQR Code
```typescript
import { generateNAMQR } from '@/utils/namqr';
import QRCode from 'react-native-qrcode-svg';

const qrData = generateNAMQR('SP-12345678', 100.50);

<QRCode value={qrData} size={200} />
```

### 4. Use QR Scanner Component
```tsx
import { QRScanner } from '@/components/shared';

<QRScanner
  onScan={(data) => handleScan(data)}
  onCancel={() => router.back()}
  instructions="Scan merchant QR code"
/>
```

### 5. Access User's SmartpayID
```typescript
import { useUser } from '@/contexts/UserContext';

const { user } = useUser();
console.log('SmartpayID:', user?.smartpayId); // "SP-12345678"
console.log('Name:', user?.name);             // "John Doe"
```

## 📦 Dependencies Installed

```bash
npm install expo-camera react-native-qrcode-svg expo-clipboard --legacy-peer-deps
```

## 🧪 Testing Checklist

Quick tests to verify implementation:

- [ ] Navigate to receive screen → Shows QR code
- [ ] Copy SmartpayID → Shows "Copied!" feedback
- [ ] Share button → Opens native share sheet
- [ ] Tap QR → Goes to full-screen view
- [ ] Scan QR button → Opens camera
- [ ] Flash toggle → Turns flash on/off
- [ ] Scan valid QR → Routes to correct screen
- [ ] Scan invalid QR → Shows error alert
- [ ] Cancel scanner → Returns to previous screen

## 📂 File Structure

```
mobile/
├── app/(authenticated)/
│   ├── receive/
│   │   ├── index.tsx     ← Main receive screen
│   │   └── qr.tsx        ← Full-screen QR
│   ├── scan-qr/
│   │   └── index.tsx     ← QR scanner
│   └── qr-code/
│       └── index.tsx     ← My QR code
├── components/shared/
│   ├── QRScanner.tsx     ← Scanner component
│   └── index.ts          ← Exports (updated)
├── contexts/
│   └── UserContext.tsx   ← Added smartpayId
└── utils/
    ├── namqr.ts          ← NAMQR utilities (NEW)
    └── index.ts          ← Exports (updated)
```

## 🎯 Key Features

✅ **NAMQR v5.0 Compliance**
- Full EMV-compliant parser
- CRC-16 checksum validation
- Tag-based structure

✅ **Smart QR Routing**
- Detects QR type automatically
- Routes to correct screen
- Handles edge cases

✅ **Figma Design Match**
- 200px QR code (NAMQRDisplay spec)
- 280×280px scan frame
- Exact spacing & colors

✅ **Accessibility**
- All buttons have labels
- 44px minimum touch targets
- High contrast colors

✅ **User Experience**
- Haptic feedback on all actions
- Copy-to-clipboard with confirmation
- Native share integration
- Permission handling

## 🚀 Next Steps

1. **Test the screens:**
   - Run the app and navigate to each screen
   - Test QR scanning with valid/invalid codes
   - Verify haptic feedback works

2. **Backend Integration:**
   - Connect to NAMQR generation API
   - Add real SmartpayID from backend
   - Implement QR validation with server

3. **Enhancements:**
   - Add QR code customization (logo, colors)
   - Save QR as image
   - QR code expiration
   - Scan history

## 📚 Full Documentation

See `NAMQR_IMPLEMENTATION.md` for:
- Complete API reference
- Detailed component props
- Navigation flows
- Error handling
- Future enhancements

## ❓ Troubleshooting

**Camera not working?**
- Check `app.json` has camera permissions
- Request permissions on first use
- Test on physical device (simulators limited)

**QR not scanning?**
- Ensure good lighting
- QR code must be NAMQR format
- Check console for validation errors

**Copy not working?**
- Verify expo-clipboard installed
- Check clipboard permissions

**Navigation errors?**
- Ensure target screens exist
- Check route params match expected format
