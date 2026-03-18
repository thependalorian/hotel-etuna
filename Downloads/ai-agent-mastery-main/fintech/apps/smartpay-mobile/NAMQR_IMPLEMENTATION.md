# NAMQR & Receive Screens Implementation

## Overview

This implementation adds complete QR code functionality to Smartpay, including NAMQR v5.0 standard support, receive screens, and QR scanning capabilities.

## What Was Implemented

### 1. NAMQR Validator & Parser (`utils/namqr.ts`)

A complete utility for handling NAMQR (Namibian QR) v5.0 standard codes.

**Key Features:**
- Parse and validate NAMQR format (EMV-compliant)
- Support for all required tags (00, 53, 58, 65, 63)
- CRC-16 checksum validation
- SmartpayID extraction
- QR code type detection (NAMQR, agent, merchant, till, deeplink)
- NAMQR generation

**NAMQR Format (Bank of Namibia v5.0):**
```
Tag Structure: TTLLVV
- TT = 2-digit tag number
- LL = 2-digit length
- VV = variable-length value

Required Tags:
- Tag 00: Payload Format Indicator (e.g., "01")
- Tag 53: Currency (NAD - Namibian Dollar)
- Tag 58: Country Code (NA - Namibia)
- Tag 65: Token Vault ID (SmartpayID, e.g., "SP-12345678")
- Tag 63: CRC-16 checksum

Optional Tags:
- Tag 54: Transaction amount
- Tag 59: Merchant name
- Tag 52: Merchant category code

Example NAMQR:
000201 5303NAD 5802NA 6512SP-12345678 6304XXXX
```

**Usage:**
```typescript
import { parseNAMQR, generateNAMQR, isValidSmartpayId } from '@/utils/namqr';

// Parse a scanned QR code
const result = parseNAMQR(qrString);
if (result.isValid && result.data) {
  console.log('SmartpayID:', result.data.smartpayId);
  console.log('Amount:', result.data.amount);
}

// Generate a NAMQR code
const qrData = generateNAMQR('SP-12345678', 100.50);

// Validate SmartpayID format
if (isValidSmartpayId('SP-12345678')) {
  // Valid format
}

// Determine QR type
const qrType = getQRCodeType(qrData);
// Returns: 'namqr' | 'agent' | 'merchant' | 'till' | 'deeplink' | 'unknown'
```

### 2. QR Scanner Component (`components/shared/QRScanner.tsx`)

Full-screen camera component for scanning QR codes with Figma-validated design.

**Features:**
- Full-screen camera view with expo-camera
- Scan frame overlay (280×280px, 16px radius, 2px white border)
- White instructions text
- Cancel button (top-left)
- Flash toggle (bottom-center)
- Camera permission handling
- Success feedback with haptics
- Accessibility labels

**Props:**
```typescript
interface QRScannerProps {
  onScan: (data: string) => void;      // Callback when QR is scanned
  onCancel: () => void;                // Callback for cancel button
  instructions?: string;                // Instructions text (default: "Scan NAMQR code")
  showFlashToggle?: boolean;           // Show flash toggle (default: true)
}
```

**Usage:**
```tsx
<QRScanner
  onScan={(data) => handleQRScan(data)}
  onCancel={() => navigation.goBack()}
  instructions="Scan merchant QR code"
/>
```

### 3. Receive Money Screen (`app/(authenticated)/receive/index.tsx`)

Main screen for receiving payments by showing QR code.

**Features:**
- AppHeader with "Receive Money" title
- QRCode display (200×200px NAMQR) using react-native-qrcode-svg
- SmartpayID display with copy button (haptic feedback)
- Tap to enlarge QR hint
- Instructions card
- Share SmartpayID button (native share)
- Collapsible "How it works" section (3 steps)
- Security note
- Navigation to full-screen QR view

**Route:** `/(authenticated)/receive/index.tsx`

**Usage:**
```tsx
// Navigate to receive screen
router.push('/(authenticated)/receive');
```

### 4. Full-Screen QR Display (`app/(authenticated)/receive/qr.tsx`)

Large QR code display optimized for scanning.

**Features:**
- Full-screen QR code (320px or screen width - 64px)
- "Scan to Pay" title
- SmartpayID display with tap-to-copy
- Brightness boost hint
- Close button (top-left)
- Share button (top-right)
- Footer security note

**Route:** `/(authenticated)/receive/qr.tsx`

**Usage:**
```tsx
// Navigate to full-screen QR
router.push('/(authenticated)/receive/qr');
```

### 5. QR Scanner Screen (`app/(authenticated)/scan-qr/index.tsx`)

Full-screen scanner with NAMQR validation and smart routing.

**Features:**
- Full-screen camera scanner
- NAMQR parsing and validation
- Automatic QR type detection
- Smart routing based on QR type:
  - **NAMQR (user)** → Send money screen with recipient pre-filled
  - **Agent QR** → Cash-out flow with agent details
  - **Till QR** → Cash-out flow with till details
  - **Merchant QR** → Merchant payment with amount pre-filled
  - **Deep link** → Extract SmartpayID and navigate to send
  - **Unknown** → Show error with retry option
- Error handling with user-friendly alerts
- Haptic feedback

**Route:** `/(authenticated)/scan-qr/index.tsx`

**Navigation Examples:**
```tsx
// After scanning valid NAMQR
router.replace({
  pathname: '/(authenticated)/send-money/amount',
  params: {
    recipientId: 'SP-12345678',
    prefilledAmount: '100.00',
  },
});

// After scanning agent QR
router.replace({
  pathname: '/(authenticated)/cash-out/confirm',
  params: {
    agentId: 'SP-87654321',
    merchantName: 'Agent Name',
  },
});
```

### 6. My QR Code Screen (`app/(authenticated)/qr-code/index.tsx`)

Personal QR code display (alternative entry point).

**Features:**
- User avatar and name display
- QR code display (200×200px)
- Three quick actions (Copy ID, Share, Enlarge)
- Info cards explaining QR usage
- Same functionality as receive screen but with different UI

**Route:** `/(authenticated)/qr-code/index.tsx`

**Usage:**
```tsx
// Navigate to My QR Code
router.push('/(authenticated)/qr-code');
```

## Dependencies Installed

```json
{
  "expo-camera": "latest",
  "react-native-qrcode-svg": "latest",
  "expo-clipboard": "latest"
}
```

**Installation command:**
```bash
npm install expo-camera react-native-qrcode-svg expo-clipboard --legacy-peer-deps
```

## User Context Updates

Added convenience properties to `UserContext`:

```typescript
interface UserContextValue {
  // ... existing properties
  user: (UserProfile & { 
    smartpayId?: string;  // Generated: "SP-XXXXXXXX"
    name?: string;        // Full name: "FirstName LastName"
  }) | null;
  smartpayId?: string;    // Also available at top level
}
```

**SmartpayID Format:**
- Pattern: `SP-XXXXXXXX` (8 digits)
- Generated from user ID: `SP-${userId.slice(-8).padStart(8, '0')}`
- Example: `SP-12345678`

## Navigation Flow

### Receive Money Flow
```
1. User opens Services Grid → taps "Receive"
   → /(authenticated)/receive/index.tsx

2. Shows QR code + SmartpayID
   
3. User can:
   a) Tap QR → /(authenticated)/receive/qr.tsx (full-screen)
   b) Copy SmartpayID
   c) Share SmartpayID via native share
   d) View "How it works"

4. Payer scans QR → gets SmartpayID → sends money
```

### Send Money via QR Flow
```
1. User taps "Scan QR" (from Send Money screen or Services Grid)
   → /(authenticated)/scan-qr/index.tsx

2. Camera opens with scan frame

3. User scans QR code

4. App validates NAMQR and routes:
   - Valid user QR → /(authenticated)/send-money/amount
     Params: { recipientId, prefilledAmount }
   
   - Agent/Till QR → /(authenticated)/cash-out/confirm
     Params: { agentId/tillId, merchantName }
   
   - Merchant QR → /(authenticated)/pay-merchant/confirm
     Params: { merchantId, merchantName, amount }
   
   - Invalid QR → Show error alert with retry

5. User completes transaction in destination screen
```

### My QR Code Flow
```
1. User opens Profile → taps "My QR Code"
   → /(authenticated)/qr-code/index.tsx

2. Shows user info + QR code

3. Actions available:
   - Copy ID
   - Share QR
   - Enlarge (goes to receive/qr.tsx)
```

## Design System Compliance

All components follow the Smartpay design system (`constants/designSystem.ts`):

**Colors:**
- Brand primary: `#005D6E` (Deep teal)
- Success: `#22C55E` (Green)
- Surface: `#F8FAFC` (Light gray)
- Text primary: `#020617` (Near black)

**Spacing:**
- Uses 8px grid: `DS.spacing.xs` (4px) to `DS.spacing.xl` (32px)
- Standard padding: `DS.spacing.md` (16px)

**Typography:**
- Screen title: 18px, semibold
- Body text: 16px, regular
- Caption: 14px, regular
- Small text: 12px, regular

**Components:**
- QR code minimum size: 200px (Figma NAMQRDisplay spec)
- Scan frame: 280×280px, 16px radius, 2px white border (Figma spec)
- Button height: 56px (Primary CTA)
- Border radius: 12px (cards), 16px (buttons), 999px (pills)

**Shadows:**
- Cards: `DS.shadows.md` (4px offset, 0.1 opacity)
- Elevated: `DS.shadows.lg` (10px offset)

## Accessibility

All components include:
- `accessibilityLabel` on all interactive elements
- `accessibilityRole` (button, image, etc.)
- `hitSlop` for small touch targets (44px minimum)
- Screen reader compatible text
- High contrast colors (WCAG AA compliant)
- Haptic feedback for actions

## Error Handling

**QR Scanner:**
- Camera permission denied → Show permission request screen
- Invalid QR format → Alert with "Try Again" option
- Unknown QR type → Alert with fallback to SmartpayID extraction
- Scan processing error → Alert with retry option

**NAMQR Validation:**
- Missing required tags → Returns error with tag names
- Invalid currency (not NAD) → Returns error
- Invalid country (not NA) → Returns error
- Invalid checksum → Returns error
- Invalid SmartpayID format → Returns error

**Network/API (Future):**
- Add error handling when connecting to backend NAMQR generation API
- Handle token vault validation failures

## Testing Checklist

- [ ] Scan valid NAMQR → navigates to send money
- [ ] Scan agent QR → navigates to cash-out
- [ ] Scan merchant QR → navigates to merchant payment
- [ ] Scan invalid QR → shows error alert
- [ ] Copy SmartpayID → clipboard + haptic feedback
- [ ] Share QR code → opens native share sheet
- [ ] Tap to enlarge QR → navigates to full-screen
- [ ] Flash toggle → turns camera flash on/off
- [ ] Camera permission denied → shows permission screen
- [ ] Cancel scanner → returns to previous screen
- [ ] "How it works" section → expands/collapses
- [ ] All accessibility labels present
- [ ] Haptic feedback on all interactions

## Future Enhancements

1. **Backend Integration:**
   - Connect to `POST /api/v1/mobile/namqr/generate` for QR generation
   - Add authentication token to NAMQR requests
   - Implement real-time QR code validation with backend

2. **QR Code Customization:**
   - Add logo/branding to QR code center
   - Custom colors for QR codes
   - Different QR sizes (small, medium, large)

3. **Advanced Features:**
   - Save QR code as image
   - Print QR code
   - QR code expiration (time-limited codes)
   - Amount-specific QR codes
   - QR code usage analytics

4. **Performance:**
   - Cache generated QR codes
   - Optimize QR scanning performance
   - Add scan history

5. **Security:**
   - Rate limiting on QR generation
   - QR code verification with backend
   - Fraud detection on suspicious QR scans

## File Structure

```
mobile/
├── app/(authenticated)/
│   ├── receive/
│   │   ├── index.tsx         # Main receive screen
│   │   └── qr.tsx            # Full-screen QR display
│   ├── scan-qr/
│   │   └── index.tsx         # QR scanner with validation
│   └── qr-code/
│       └── index.tsx         # My QR code screen
├── components/shared/
│   └── QRScanner.tsx         # Reusable QR scanner component
├── contexts/
│   └── UserContext.tsx       # Updated with smartpayId
└── utils/
    ├── namqr.ts              # NAMQR validator & parser
    └── index.ts              # Updated exports
```

## Code Examples

### Generate NAMQR for User
```typescript
import { generateNAMQR } from '@/utils/namqr';
import { useUser } from '@/contexts/UserContext';

function ReceiveScreen() {
  const { user } = useUser();
  const qrData = generateNAMQR(user?.smartpayId || 'SP-12345678');
  
  return (
    <QRCode value={qrData} size={200} />
  );
}
```

### Scan and Validate QR Code
```typescript
import { parseNAMQR, getQRCodeType } from '@/utils/namqr';

function handleScan(qrData: string) {
  const qrType = getQRCodeType(qrData);
  
  if (qrType === 'namqr') {
    const result = parseNAMQR(qrData);
    
    if (result.isValid && result.data) {
      // Navigate to send money
      router.push({
        pathname: '/send-money/amount',
        params: { recipientId: result.data.smartpayId },
      });
    } else {
      Alert.alert('Invalid QR', result.error);
    }
  }
}
```

### Copy SmartpayID with Haptic Feedback
```typescript
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

async function handleCopyId(smartpayId: string) {
  await Clipboard.setStringAsync(smartpayId);
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  // Show "Copied!" feedback
}
```

## References

- **Figma:** VeGAwsChUvwTBZxAU6H8VQ (Buffr App Design)
- **Design Skill:** `.cursor/skills-cursor/smartpay-design/SKILL.md`
- **PRD:** `fintech/smartpay/PRD_AGENTIC_COPILOT_CONSOLIDATED.md`
- **NAMQR Standard:** Bank of Namibia v5.0 (EMV-compliant)
- **Design System:** `mobile/constants/designSystem.ts`

## Support

For questions or issues:
1. Check this documentation first
2. Review the design skill (`smartpay-design/SKILL.md`)
3. Inspect component implementations in `components/shared/`
4. Test with the provided code examples
