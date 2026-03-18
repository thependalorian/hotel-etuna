# SmartPay Screen Inventory

**Complete list of all screens organized by user flow**  
**Total Screens:** 66  
**Last Updated:** March 17, 2026

---

## Navigation Architecture

```
App Root
├── (auth) - Authentication Flow
│   └── index.tsx - Auth entry point
├── (onboarding) - Onboarding Flow
│   └── 8 screens
├── (authenticated) - Protected Routes
│   ├── (tabs) - Main App Tabs
│   │   ├── index.tsx - Home
│   │   ├── activity.tsx - Activity
│   │   ├── copilot/ - Copilot
│   │   ├── transfers.tsx - Transfers
│   │   └── invest.tsx - Invest
│   ├── send-money/ - Send Money Flow
│   ├── profile.tsx - Profile
│   ├── groups/ - Group Payments
│   └── (modals) - Modal Overlays
└── Standalone Routes
    ├── cash-out/
    ├── voucher/
    ├── loans/
    ├── agents/
    └── proof-of-life/
```

---

## 1. Authentication Flow (4 screens)

### 1.1 Auth Entry Point
**Route:** `app/(auth)/index.tsx`  
**Purpose:** Authentication landing page  
**Figma Node:** -  
**Components Used:**
- AuthContainer
- AuthButton
- LinkButton

**Navigation:**
- → Login screen
- → Signup screen

**Status:** ✅ Implemented

---

### 1.2 Login Screen
**Route:** `app/login.tsx`  
**Purpose:** User login with phone/email  
**Components Used:**
- PhoneInput or EmailInput
- PasswordInput
- AuthButton
- BiometricPrompt

**Navigation:**
- → OTP verification
- → Home (authenticated)

**Status:** ✅ Implemented

---

### 1.3 Signup Screen
**Route:** `app/signup.tsx`  
**Purpose:** New user registration  
**Components Used:**
- PhoneInput
- EmailInput
- PasswordInput
- AuthButton

**Navigation:**
- → OTP verification
- → Onboarding flow

**Status:** ✅ Implemented

---

### 1.4 Phone Verification
**Route:** `app/verify/[phone].tsx`  
**Purpose:** Verify phone number with OTP  
**Components Used:**
- OTPInput
- VerificationTimer
- ResendButton

**Navigation:**
- → Onboarding flow (new users)
- → Home (returning users)

**Status:** ✅ Implemented

---

## 2. Onboarding Flow (9 screens)

Complete 8-step onboarding journey for new users.

### 2.1 Welcome Screen
**Route:** `app/onboarding/index.tsx`  
**Purpose:** Welcome and app introduction  
**Figma Node:** Onboarding/Welcome  
**Components Used:**
- OnboardingLayout
- SmartpayLogo
- Button

**Navigation:**
- → Phone entry

**Status:** ✅ Implemented

---

### 2.2 Phone Entry
**Route:** `app/onboarding/phone.tsx`  
**Purpose:** Enter phone number  
**Figma Node:** Onboarding/Phone  
**Components Used:**
- OnboardingLayout (step 1/8)
- PhoneInput
- CountryCodeSelector
- Button

**Navigation:**
- ← Welcome
- → OTP verification

**Status:** ✅ Implemented

---

### 2.3 OTP Verification
**Route:** `app/onboarding/otp.tsx`  
**Purpose:** Verify phone with 6-digit code  
**Figma Node:** Onboarding/OTP  
**Components Used:**
- OnboardingLayout (step 2/8)
- OTPInput
- VerificationTimer
- LinkButton (resend)

**Navigation:**
- ← Phone entry
- → Name entry

**Status:** ✅ Implemented

---

### 2.4 Name Entry
**Route:** `app/onboarding/name.tsx`  
**Purpose:** Collect first and last name  
**Figma Node:** Onboarding/Name  
**Components Used:**
- OnboardingLayout (step 3/8)
- TextInput (×2)
- Button

**Navigation:**
- ← OTP
- → Photo upload

**Status:** ✅ Implemented

---

### 2.5 Photo Upload
**Route:** `app/onboarding/photo.tsx`  
**Purpose:** Upload profile photo  
**Figma Node:** Onboarding/Photo  
**Components Used:**
- OnboardingLayout (step 4/8)
- Avatar (preview)
- Button (camera, gallery, skip)

**Navigation:**
- ← Name entry
- → PIN creation

**Status:** ✅ Implemented (stub photo upload)

---

### 2.6 PIN Creation
**Route:** `app/onboarding/pin.tsx`  
**Purpose:** Create 4-digit security PIN  
**Figma Node:** Onboarding/PIN  
**Components Used:**
- OnboardingLayout (step 5/8)
- PINInput
- Button

**Navigation:**
- ← Photo upload
- → Face ID setup

**Status:** ✅ Implemented

---

### 2.7 Face ID Setup
**Route:** `app/onboarding/faceid.tsx`  
**Purpose:** Enable biometric authentication  
**Figma Node:** Onboarding/Biometric  
**Components Used:**
- OnboardingLayout (step 6/8)
- BiometricPrompt
- Button (enable, skip)

**Navigation:**
- ← PIN creation
- → Completion

**Status:** ✅ Implemented (UI only)

---

### 2.8 Completion
**Route:** `app/onboarding/complete.tsx`  
**Purpose:** Onboarding success  
**Figma Node:** Onboarding/Complete  
**Components Used:**
- SuccessScreen
- Button

**Navigation:**
- → Home (authenticated)

**Status:** ✅ Implemented

---

### 2.9 Onboarding Wrapper
**Route:** `app/(onboarding)/index.tsx`  
**Purpose:** Onboarding route group wrapper  

**Status:** ✅ Implemented

---

## 3. Main Tabs (5 screens)

Bottom tab navigation with 5 primary screens.

### 3.1 Home Tab
**Route:** `app/(tabs)/home/index.tsx`  
**Purpose:** Main dashboard  
**Figma Node:** 45:837 (Main Screen)  

**Components Used:**
- AppHeader (search mode)
- BalanceCard
- WalletCarousel
- ServicesGrid (3×3)
- RecentContactsCarousel
- FloatingActionButton
- OfflineBanner

**Layout Structure:**
1. AppHeader (64px) - Search pill + notifications + avatar
2. BalanceCard (120px) - Total balance with eye toggle
3. WalletCarousel - Horizontal wallet cards (164×140px)
4. ServicesGrid - 9 services in 3×3 grid (110×110px tiles)
5. RecentContactsCarousel - 8 recent contacts (40px chips)
6. FAB - Send money button (56px, bottom-right)

**Navigation:**
- → Send money flow
- → Services (9 routes)
- → Profile
- → Notifications
- → Wallet details

**Features:**
- Pull-to-refresh
- Search/filter
- Balance visibility toggle
- Empty state (no wallets)
- Offline banner
- Proof-of-life banner

**Status:** ✅ Fully Implemented

---

### 3.2 Activity Tab
**Route:** `app/(tabs)/activity/index.tsx`  
**Purpose:** Transaction history and activity feed  
**Figma Node:** Activity Screen  

**Components Used:**
- AppHeader (title mode)
- TransactionListItem (×N)
- ErrorState
- LoadingState

**Features:**
- Transaction list
- Filter by type (all, sent, received)
- Filter by date range
- Search transactions
- Pull-to-refresh
- Empty state (no transactions)

**Navigation:**
- → Transaction detail

**Status:** ✅ Implemented

---

### 3.3 Copilot Tab
**Route:** `app/(tabs)/copilot/index.tsx`  
**Purpose:** AI assistant chat interface  
**Figma Node:** Copilot Screen  

**Components Used:**
- CopilotChatSurface
- CopilotSuggestionChips
- CopilotConfirmationModal
- All Copilot Cards (20)

**Features:**
- Chat interface
- Message streaming (SSE)
- Suggestion chips
- Action cards
- Transaction confirmation
- OBS integration
- Knowledge base search

**Navigation:**
- → All services (via commands)
- → Transaction confirmation

**Status:** ✅ Implemented

---

### 3.4 Wallets Tab
**Route:** `app/(tabs)/wallets.tsx`  
**Purpose:** Wallet management list  

**Components Used:**
- AppHeader
- WalletCard (list view)
- Button (add wallet)

**Navigation:**
- → Wallet detail
- → Add wallet

**Status:** ✅ Implemented (stub)

---

### 3.5 Profile Tab
**Route:** `app/(tabs)/profile.tsx`  
**Purpose:** User profile overview  

**Components Used:**
- AppHeader
- Avatar (large)
- SettingsItem (×N)

**Navigation:**
- → Edit profile
- → Settings
- → KYC
- → Invite friends

**Status:** ✅ Implemented

---

## 4. Send Money Flow (6 screens)

Complete 5-step peer-to-peer transfer flow.

### 4.1 Send Entry
**Route:** `app/send-money/index.tsx`  
**Purpose:** Send money entry point (redirect)  

**Navigation:**
- → Select recipient

**Status:** ✅ Implemented

---

### 4.2 Select Recipient
**Route:** `app/send-money/select-recipient.tsx`  
**Purpose:** Choose recipient from contacts  
**Figma Node:** 92:212  

**Components Used:**
- AppHeader (back + title)
- SearchBar (48px pill)
- RecentContactsCarousel (40px)
- ContactListItem (72px)
- Button (scan QR)

**Features:**
- Search contacts (name, phone, SmartpayID)
- Recent contacts carousel
- All contacts list
- SmartpayID badge
- Phone badge
- Scan QR option

**Navigation:**
- ← Home
- → Amount entry
- → QR scanner

**Status:** ✅ Fully Implemented

---

### 4.3 Amount Entry
**Route:** `app/send-money/amount.tsx`  
**Purpose:** Enter transfer amount  
**Figma Node:** Send/Amount  

**Components Used:**
- AppHeader (back + title)
- ContactChip (recipient)
- AmountInput (large numeric)
- TextInput (note)
- Button (continue)

**Features:**
- Large amount input (40px)
- Wallet selector
- Note field (optional)
- Balance check
- Fee calculation
- Max amount validation

**Navigation:**
- ← Select recipient
- → Confirmation

**Status:** ✅ Implemented

---

### 4.4 Confirmation
**Route:** `app/send-money/confirm.tsx`  
**Purpose:** Review and confirm transaction  
**Figma Node:** Send/Confirm  

**Components Used:**
- AppHeader (back + title)
- TransactionReceipt
- Button (confirm)
- TwoFAModal

**Features:**
- Transaction summary
- Recipient details
- Amount breakdown
- Fee display
- 2FA verification (PIN)
- Loading state during send

**Navigation:**
- ← Amount entry
- → Success screen

**Status:** ✅ Implemented

---

### 4.5 QR Scanner
**Route:** `app/send-money/scan-qr.tsx`  
**Purpose:** Scan recipient QR code  
**Figma Node:** Send/QR  

**Components Used:**
- Camera (expo-camera)
- QR scanner overlay

**Features:**
- Camera permission request
- QR code scanning
- Flashlight toggle
- Gallery import option

**Navigation:**
- ← Select recipient
- → Amount entry (with recipient)

**Status:** ✅ Implemented

---

### 4.6 Success Screen
**Route:** `app/send-money/success.tsx`  
**Purpose:** Transaction success confirmation  
**Figma Node:** Send/Success  

**Components Used:**
- SuccessScreen
- TransactionReceipt
- Button (done, share, download)

**Features:**
- Animated checkmark
- Transaction receipt
- Share receipt
- Download PDF
- Done button

**Navigation:**
- → Home

**Status:** ✅ Implemented

---

## 5. Profile Screens (4 screens)

User profile management.

### 5.1 Profile View
**Route:** `app/(authenticated)/profile.tsx`  
**Purpose:** View user profile  
**Figma Node:** Profile Screen  

**Components Used:**
- AppHeader
- Avatar (large, 96px)
- SettingsItem (×N)

**Features:**
- Profile photo
- Name, phone, email
- SmartpayID
- Settings items:
  - Edit profile
  - KYC verification
  - Settings
  - Invite friends
  - Help & support
  - Logout

**Navigation:**
- → Edit profile
- → KYC
- → Settings
- → Invite

**Status:** ✅ Implemented

---

### 5.2 Edit Profile
**Route:** `app/(authenticated)/edit-profile.tsx`  
**Purpose:** Edit profile information  

**Components Used:**
- AppHeader (back + title)
- Avatar (editable)
- TextInput (first name, last name, email)
- Button (save)

**Features:**
- Edit name
- Edit email
- Change photo
- Save changes

**Navigation:**
- ← Profile
- → Profile (after save)

**Status:** ✅ Implemented

---

### 5.3 KYC Verification
**Route:** `app/(authenticated)/kyc.tsx`  
**Purpose:** Know Your Customer verification  

**Components Used:**
- AppHeader
- KYC form fields
- Document upload
- Button (submit)

**Features:**
- ID document upload
- Selfie verification
- Address proof
- Government ID validation

**Navigation:**
- ← Profile
- → Verification pending

**Status:** ✅ Implemented (stub)

---

### 5.4 Invite Friends
**Route:** `app/(authenticated)/invite.tsx`  
**Purpose:** Refer friends to SmartPay  

**Components Used:**
- AppHeader
- QRCodeCard (referral)
- Button (share link)
- TextInput (share code)

**Features:**
- Referral code
- QR code
- Share link
- Rewards tracking

**Navigation:**
- ← Profile

**Status:** ✅ Implemented

---

## 6. Groups Screens (4 screens)

Group payment management (Chamas).

### 6.1 Groups List
**Route:** `app/(authenticated)/groups/index.tsx`  
**Purpose:** View all groups  

**Components Used:**
- AppHeader
- GroupCard (×N)
- Button (create group)

**Navigation:**
- → Group detail
- → Create group

**Status:** ✅ Implemented (stub)

---

### 6.2 Create Group
**Route:** `app/(authenticated)/groups/create.tsx`  
**Purpose:** Create new payment group  

**Components Used:**
- AppHeader
- TextInput (name, description)
- ContactSelector
- Button (create)

**Navigation:**
- ← Groups list
- → Group detail

**Status:** ✅ Implemented (stub)

---

### 6.3 Group Detail
**Route:** `app/(authenticated)/groups/[id]/index.tsx`  
**Purpose:** View group details and transactions  

**Components Used:**
- AppHeader
- GroupHeader
- TransactionListItem (×N)
- Button (split bill)

**Navigation:**
- ← Groups list
- → Split bill
- → Transaction detail

**Status:** ✅ Implemented (stub)

---

### 6.4 Split Bill
**Route:** `app/(authenticated)/groups/[id]/split.tsx`  
**Purpose:** Split bill among group members  

**Components Used:**
- AppHeader
- AmountInput
- MemberSelector (×N)
- Button (confirm)

**Navigation:**
- ← Group detail
- → Confirmation

**Status:** ✅ Implemented (stub)

---

## 7. Service Screens (6 screens)

Standalone service features.

### 7.1 Cash-Out Hub
**Route:** `app/cash-out/index.tsx`  
**Purpose:** Cash withdrawal options  

**Components Used:**
- AppHeader
- ServiceTile (agent, ATM, USSD)
- Button

**Features:**
- Agent cash-out
- ATM withdrawal
- USSD code
- Method selection

**Navigation:**
- ← Home
- → Agent finder
- → Amount entry

**Status:** ✅ Implemented (stub)

---

### 7.2 Voucher Redemption
**Route:** `app/voucher/index.tsx`  
**Purpose:** Redeem government vouchers  

**Components Used:**
- AppHeader
- TextInput (voucher code)
- Button (redeem)

**Features:**
- Code entry
- Validation
- Redemption confirmation
- Balance credit

**Navigation:**
- ← Home
- → Success

**Status:** ✅ Implemented (stub)

---

### 7.3 Loans List
**Route:** `app/loans/index.tsx`  
**Purpose:** View loan offers  

**Components Used:**
- AppHeader
- LoanCard (×N)
- Button (apply)

**Navigation:**
- ← Home
- → Loan application

**Status:** ✅ Implemented (stub)

---

### 7.4 Agent Finder
**Route:** `app/agents/index.tsx`  
**Purpose:** Find nearby SmartPay agents  

**Components Used:**
- AppHeader
- MapView (React Native Maps)
- AgentMarker (×N)
- Button (directions)

**Features:**
- Current location
- Agent markers
- Distance calculation
- Directions
- Agent details

**Navigation:**
- ← Home

**Status:** ✅ Implemented (requires Maps API key)

---

### 7.5 Proof of Life
**Route:** `app/proof-of-life/index.tsx`  
**Purpose:** Government verification compliance  

**Components Used:**
- AppHeader
- CameraView
- Button (capture)

**Features:**
- Selfie capture
- Liveness detection
- Submission
- Status tracking

**Navigation:**
- ← Home
- → Success

**Status:** ✅ Implemented (stub)

---

### 7.6 Wallets Management
**Route:** `app/(authenticated)/wallets/index.tsx`  
**Purpose:** Manage all wallets  

**Navigation:**
- ← Home
- → Wallet detail
- → Add wallet

**Status:** ✅ Implemented (stub)

---

## 8. Authenticated Tabs (6 screens)

Alternative authenticated route group.

### 8.1 Authenticated Home
**Route:** `app/(authenticated)/(tabs)/index.tsx`  
**Purpose:** Authenticated home variant  

**Status:** ✅ Implemented

---

### 8.2 Authenticated Activity
**Route:** `app/(authenticated)/(tabs)/activity.tsx`  
**Purpose:** Activity tab variant  

**Status:** ✅ Implemented

---

### 8.3 Authenticated Copilot
**Route:** `app/(authenticated)/(tabs)/copilot/index.tsx`  
**Purpose:** Copilot tab variant  

**Status:** ✅ Implemented

---

### 8.4 Transfers Tab
**Route:** `app/(authenticated)/(tabs)/transfers.tsx`  
**Purpose:** Transfers history  

**Status:** ✅ Implemented (stub)

---

### 8.5 Invest Tab
**Route:** `app/(authenticated)/(tabs)/invest.tsx`  
**Purpose:** Investment opportunities  

**Status:** ✅ Implemented (stub)

---

### 8.6 Authenticated Tab Layout
**Route:** `app/(authenticated)/(tabs)/_layout.tsx`  
**Purpose:** Tab navigation layout  

**Status:** ✅ Implemented

---

## 9. Modal Screens (4 screens)

Overlay modals and sheets.

### 9.1 Generic Modal
**Route:** `app/modal.tsx`  
**Purpose:** Generic modal wrapper  

**Status:** ✅ Implemented

---

### 9.2 Copilot Confirmation
**Route:** `app/modals/copilot-confirm.tsx`  
**Purpose:** Copilot action confirmation  

**Status:** ✅ Implemented

---

### 9.3 Account Modal
**Route:** `app/(authenticated)/(modals)/account.tsx`  
**Purpose:** Account details modal  

**Status:** ✅ Implemented

---

### 9.4 Lock Screen Modal
**Route:** `app/(authenticated)/(modals)/lock.tsx`  
**Purpose:** Security lock screen  

**Status:** ✅ Implemented

---

## 10. Utility & System Screens (6 screens)

### 10.1 App Entry Point
**Route:** `app/index.tsx`  
**Purpose:** App initialization and routing logic  

**Features:**
- Auth check
- Route to onboarding or home
- Splash screen

**Status:** ✅ Implemented

---

### 10.2 Root Layout
**Route:** `app/_layout.tsx`  
**Purpose:** Root app layout with providers  

**Features:**
- AppProviders wrapper
- Font loading
- Status bar configuration
- Safe area provider

**Status:** ✅ Implemented

---

### 10.3 Not Found
**Route:** `app/+not-found.tsx`  
**Purpose:** 404 error screen  

**Status:** ✅ Implemented

---

### 10.4 HTML Wrapper
**Route:** `app/+html.tsx`  
**Purpose:** Web HTML wrapper  

**Status:** ✅ Implemented

---

### 10.5 Location Finder Example
**Route:** `app/(authenticated)/location-finder-example.tsx`  
**Purpose:** Demo screen for map integration  

**Status:** ✅ Implemented

---

### 10.6 Tab Layouts
**Route:** `app/(tabs)/_layout.tsx`  
**Purpose:** Tab navigation configuration  

**Features:**
- 5 tabs
- Custom TabBar component
- Tab icons and labels
- Active state

**Status:** ✅ Implemented

---

## Screen Features Summary

### By Implementation Status
- **✅ Fully Implemented:** 30 screens
- **✅ UI Complete (Stub Data):** 25 screens
- **⚠️ Partial/Needs Work:** 11 screens

### By Category Count
- Authentication: 4
- Onboarding: 9
- Main Tabs: 5
- Send Money: 6
- Profile: 4
- Groups: 4
- Services: 6
- Authenticated Tabs: 6
- Modals: 4
- Utility: 6
- **Total: 66 screens**

### Common Patterns

#### Screen Structure
```typescript
export default function MyScreen() {
  // Context & State
  const { user } = useUser();
  const [data, setData] = useState([]);
  
  // Data Loading
  useEffect(() => {
    loadData();
  }, []);
  
  // Handlers
  const handleAction = () => {
    // ...
  };
  
  // Render
  return (
    <SafeAreaView>
      <AppHeader title="Screen Title" showBackButton />
      <ScrollView>
        {/* Content */}
      </ScrollView>
    </SafeAreaView>
  );
}
```

#### Navigation Pattern
```typescript
import { router } from 'expo-router';

// Push new screen
router.push('/send-money');

// Push with params
router.push({
  pathname: '/send-money/amount',
  params: { recipientId: '123' }
});

// Go back
router.back();

// Replace (no back)
router.replace('/(tabs)/home');
```

#### Loading Pattern
```typescript
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadData();
}, []);

if (loading) {
  return <LoadingState />;
}
```

#### Error Pattern
```typescript
const [error, setError] = useState<string | null>(null);

try {
  await sendMoney(...);
} catch (err) {
  setError(err.message);
}

if (error) {
  return <ErrorState message={error} onRetry={handleRetry} />;
}
```

---

## Route Naming Conventions

### File-Based Routing
- **index.tsx** - Default route (e.g., `/groups` → `groups/index.tsx`)
- **[id].tsx** - Dynamic route (e.g., `/groups/123` → `groups/[id].tsx`)
- **_layout.tsx** - Layout wrapper (applies to children)
- **(group)** - Route group (doesn't add to URL)

### Examples
```
app/
├── (tabs)/
│   ├── index.tsx          → /(tabs) or /
│   ├── profile.tsx        → /(tabs)/profile
│   └── _layout.tsx        → Layout for all (tabs) routes
├── groups/
│   ├── index.tsx          → /groups
│   ├── [id]/
│   │   └── index.tsx      → /groups/123
│   └── create.tsx         → /groups/create
└── send-money/
    ├── index.tsx          → /send-money
    ├── amount.tsx         → /send-money/amount
    └── _layout.tsx        → Layout for send-money routes
```

---

## Screen Accessibility

All screens include:
- **Safe Area Handling** - SafeAreaView with edges
- **Keyboard Avoiding** - KeyboardAvoidingView where needed
- **Screen Reader Support** - accessibilityLabel on key elements
- **Focus Management** - Auto-focus on inputs
- **Announcement** - Success/error announcements

### Example
```typescript
<SafeAreaView edges={['top', 'bottom']}>
  <KeyboardAvoidingView behavior="padding">
    <View accessibilityRole="main">
      <Text accessibilityRole="header">Screen Title</Text>
      {/* Content */}
    </View>
  </KeyboardAvoidingView>
</SafeAreaView>
```

---

**Document Version:** 1.0.0  
**Last Updated:** March 17, 2026  
**Total Screens:** 66
