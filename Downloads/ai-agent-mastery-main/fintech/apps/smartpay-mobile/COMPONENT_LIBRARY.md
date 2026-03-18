# SmartPay Component Library

**Complete inventory of all reusable components**  
**Total Components:** 93  
**Last Updated:** March 17, 2026

---

## Table of Contents
1. [UI Components](#ui-components) (9)
2. [Layout Components](#layout-components) (5)
3. [Home Components](#home-components) (6)
4. [Shared Components](#shared-components) (4)
5. [Modal Components](#modal-components) (2)
6. [Copilot Components](#copilot-components) (27)
7. [Authentication Components](#authentication-components) (28)
8. [Activity Components](#activity-components) (1)
9. [Common Components](#common-components) (1)
10. [Legacy Components](#legacy-components) (11)

---

## UI Components

Core UI primitives following Figma specifications. All components use `designSystem.ts` tokens.

### 1. Button
**Purpose:** Primary call-to-action button with multiple variants and states

**Props Interface:**
```typescript
interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}
```

**Usage Example:**
```typescript
import { Button } from '@/components/ui';

<Button 
  variant="primary" 
  size="lg" 
  onPress={handleSubmit}
  isLoading={loading}
>
  Continue
</Button>
```

**Features:**
- 4 variants (primary, secondary, outline, ghost)
- 3 sizes (sm: 40px, md: 48px, lg: 56px)
- Scale animation (0.98) on press
- Haptic feedback (variant-specific intensity)
- Loading spinner
- Full accessibility support

**Figma Reference:** Primary CTA (56px height)  
**File:** `components/ui/Button.tsx`

---

### 2. TextInput
**Purpose:** Text input field with validation, prefix/suffix support

**Props Interface:**
```typescript
interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  prefix?: string;
  prefixIcon?: keyof typeof Ionicons.glyphMap;
  suffix?: string;
  suffixIcon?: keyof typeof Ionicons.glyphMap;
  clearable?: boolean;
  required?: boolean;
  showValidation?: boolean;
  isValid?: boolean;
}
```

**Usage Example:**
```typescript
import { TextInput } from '@/components/ui';

<TextInput
  label="Phone Number"
  prefix="+264"
  value={phone}
  onChangeText={setPhone}
  error={phoneError}
  clearable
  required
  keyboardType="phone-pad"
/>
```

**Features:**
- 56px height (Figma spec)
- Pill-shaped (999px radius)
- Animated border on focus (1px → 2px)
- Prefix/suffix text or icons
- Clear button (when clearable)
- Validation checkmark
- Error message display

**Figma Reference:** Input/Large (1417:42922)  
**File:** `components/ui/TextInput.tsx`

---

### 3. Avatar
**Purpose:** User avatar with sizes and fallback states

**Props Interface:**
```typescript
interface AvatarProps {
  uri?: string | null;
  initials?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  onPress?: () => void;
}

type AvatarSize = 32 | 40 | 56 | 72 | 96;
```

**Usage Example:**
```typescript
import { Avatar } from '@/components/ui';

<Avatar
  uri={user.photoUri}
  initials="JD"
  size="lg"
  onPress={handleAvatarPress}
/>
```

**Features:**
- 5 sizes (32, 40, 56, 72, 96px)
- Image loading with fallback
- Initials display (2 letters)
- Icon fallback (person-outline)
- Circular shape
- Optional press handler
- Accessibility labels

**Figma Reference:** Profile Avatar  
**File:** `components/ui/Avatar.tsx`

---

### 4. BottomSheet
**Purpose:** Modal bottom sheet for forms and actions

**Props Interface:**
```typescript
interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  maxHeight?: string | number;
}
```

**Usage Example:**
```typescript
import { BottomSheet } from '@/components/ui';

<BottomSheet
  visible={isOpen}
  onClose={() => setIsOpen(false)}
  title="Add Money"
  maxHeight="80%"
>
  <AddMoneyForm />
</BottomSheet>
```

**Features:**
- Slide up animation (220ms)
- Backdrop with opacity 0.25
- Drag handle (36×5px)
- 24px top border radius
- Safe area padding
- Dismiss on backdrop press
- Keyboard avoiding

**Figma Reference:** Modal  
**File:** `components/ui/BottomSheet.tsx`

---

### 5. LoadingState
**Purpose:** Loading skeletons and spinners

**Props Interface:**
```typescript
interface LoadingStateProps {
  variant?: 'spinner' | 'skeleton' | 'overlay';
  message?: string;
}
```

**Usage Example:**
```typescript
import { LoadingState } from '@/components/ui';

<LoadingState variant="spinner" message="Loading..." />
```

**Features:**
- 3 variants (spinner, skeleton, overlay)
- Customizable message
- Brand color spinner
- Animated skeleton shimmer
- Full-screen overlay option

**File:** `components/ui/LoadingState.tsx`

---

### 6. ErrorState
**Purpose:** Error display with retry action

**Props Interface:**
```typescript
interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}
```

**Usage Example:**
```typescript
import { ErrorState } from '@/components/ui';

<ErrorState
  title="Connection Error"
  message="Unable to load data. Check your connection."
  onRetry={handleRetry}
  icon="cloud-offline-outline"
/>
```

**Features:**
- Custom error icon (48px)
- Title and message
- Optional retry button
- Centered layout
- Accessibility support

**File:** `components/ui/ErrorState.tsx`

---

### 7. SuccessScreen
**Purpose:** Success feedback screen with checkmark animation

**Props Interface:**
```typescript
interface SuccessScreenProps {
  title: string;
  message?: string;
  onContinue: () => void;
  buttonLabel?: string;
}
```

**Usage Example:**
```typescript
import { SuccessScreen } from '@/components/ui';

<SuccessScreen
  title="Money Sent!"
  message="N$50.00 sent to John Doe"
  onContinue={handleContinue}
  buttonLabel="Done"
/>
```

**Features:**
- Animated checkmark (scale + fade)
- Green success color
- Optional message
- Continue button
- Confetti effect (optional)

**Figma Reference:** Success Screen  
**File:** `components/ui/SuccessScreen.tsx`

---

### 8. HapticButton
**Purpose:** Button with enhanced haptic feedback

**Props Interface:**
```typescript
interface HapticButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  hapticStyle?: ImpactFeedbackStyle;
}
```

**Usage Example:**
```typescript
import { HapticButton } from '@/components/ui';

<HapticButton 
  variant="primary" 
  onPress={handlePress}
  hapticStyle={Haptics.ImpactFeedbackStyle.Heavy}
>
  Confirm
</HapticButton>
```

**File:** `components/ui/HapticButton.tsx`

---

### 9. FloatingActionButton
**Purpose:** Floating action button (FAB) for primary actions

**Props Interface:**
```typescript
interface FloatingActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  onPress: () => void;
  backgroundColor?: string;
  iconColor?: string;
}
```

**Usage Example:**
```typescript
import { FloatingActionButton } from '@/components/ui';

<FloatingActionButton
  icon="paper-plane-outline"
  label="Send"
  onPress={handleSend}
  backgroundColor={DS.colors.brand}
/>
```

**Features:**
- 56px size (Figma spec)
- 28px icon
- Optional label
- Fixed positioning (bottom-right)
- Shadow elevation
- Haptic feedback

**Figma Reference:** FAB  
**File:** `components/ui/FloatingActionButton.tsx`

---

## Layout Components

Navigation and screen structure components.

### 1. AppHeader
**Purpose:** Universal app header with search or title modes

**Props Interface:**
```typescript
interface AppHeaderProps {
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  searchPlaceholder?: string;
  title?: string;
  onNotificationPress?: () => void;
  onAvatarPress?: () => void;
  avatarUri?: string | null;
  avatarInitials?: string | null;
  notificationBadge?: boolean;
  showBackButton?: boolean;
  onBackPress?: () => void;
}
```

**Usage Example:**
```typescript
import { AppHeader } from '@/components/layout';

// Search mode (Home)
<AppHeader
  showSearch
  searchValue={query}
  onSearchChange={setQuery}
  onNotificationPress={handleNotifications}
  onAvatarPress={handleProfile}
  avatarUri={user.photoUri}
  notificationBadge
/>

// Title mode (Stack screens)
<AppHeader
  title="Send Money"
  showBackButton
  onBackPress={router.back}
/>
```

**Features:**
- 64px height
- 2 modes: search pill or title
- Search pill: 48px with icon
- Notifications: 24px bell with badge
- Avatar: 36px circular (44px touch target)
- Back button: 24px chevron (44px touch target)
- Blur effect background (iOS)
- Safe area insets

**Figma Reference:** App Header  
**File:** `components/layout/AppHeader.tsx`

---

### 2. ScreenLayout
**Purpose:** Standard screen wrapper with consistent structure

**Props Interface:**
```typescript
interface ScreenLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  headerTitle?: string;
  showBackButton?: boolean;
  scrollable?: boolean;
  safeAreaEdges?: Array<'top' | 'bottom' | 'left' | 'right'>;
}
```

**Usage Example:**
```typescript
import { ScreenLayout } from '@/components/layout';

<ScreenLayout
  headerTitle="Profile"
  showBackButton
  scrollable
>
  <ProfileContent />
</ScreenLayout>
```

**File:** `components/layout/ScreenLayout.tsx`

---

### 3. OnboardingLayout
**Purpose:** Onboarding screen template with progress and navigation

**Props Interface:**
```typescript
interface OnboardingLayoutProps {
  children: React.ReactNode;
  step: number;
  totalSteps: number;
  onBack?: () => void;
  showBackButton?: boolean;
}
```

**Usage Example:**
```typescript
import { OnboardingLayout } from '@/components/layout';

<OnboardingLayout
  step={2}
  totalSteps={8}
  onBack={handleBack}
  showBackButton
>
  <PhoneInputForm />
</OnboardingLayout>
```

**Features:**
- Progress indicator (dots or bar)
- Back button
- Safe area handling
- Gradient background
- Keyboard avoiding view

**File:** `components/layout/OnboardingLayout.tsx`

---

### 4. HeaderBackButton
**Purpose:** Back navigation button with haptic feedback

**Props Interface:**
```typescript
interface HeaderBackButtonProps {
  onPress: () => void;
  color?: string;
  accessibilityLabel?: string;
}
```

**Usage Example:**
```typescript
import { HeaderBackButton } from '@/components/layout';

<HeaderBackButton
  onPress={() => router.back()}
  color={DS.colors.text}
/>
```

**File:** `components/layout/HeaderBackButton.tsx`

---

### 5. TabBar
**Purpose:** Bottom tab navigation with 5 tabs

**Features:**
- 72px height
- 24px icons
- 11px labels
- 3px active indicator
- Haptic feedback on tab press
- 5 tabs: Home, Activity, Copilot, Wallets, Profile

**Figma Reference:** Tab Bar  
**File:** `components/layout/TabBar.tsx`

---

## Home Components

Components specific to the home screen dashboard.

### 1. BalanceCard
**Purpose:** Display total balance with privacy toggle

**Props Interface:**
```typescript
interface BalanceCardProps {
  balance: number;
  balanceVisible: boolean;
  onToggleVisibility: () => void;
  walletName: string;
}
```

**Usage Example:**
```typescript
import { BalanceCard } from '@/components/home';

<BalanceCard
  balance={2500.50}
  balanceVisible={true}
  onToggleVisibility={() => setVisible(!visible)}
  walletName="Primary Wallet"
/>
```

**Features:**
- 120px height (Figma spec)
- 12px border radius
- 24px padding
- Eye toggle icon
- Hidden state (••••••)
- Currency formatting (N$)
- Shadow elevation

**Figma Reference:** BalanceCard Organism  
**File:** `components/home/BalanceCard.tsx`

---

### 2. WalletCard
**Purpose:** Individual wallet card in carousel

**Props Interface:**
```typescript
interface WalletCardComponentProps {
  wallet: Wallet;
  onPress: () => void;
}

interface Wallet {
  id: string;
  name: string;
  balance: number;
  icon: string;
  color: string;
  type: 'bank' | 'mobile' | 'cash' | 'custom';
}
```

**Usage Example:**
```typescript
import { WalletCard } from '@/components/home';

<WalletCard
  wallet={{
    id: '1',
    name: 'Bank Account',
    balance: 1500.00,
    icon: 'card-outline',
    color: '#2563EB',
    type: 'bank'
  }}
  onPress={() => handleWalletPress('1')}
/>
```

**Features:**
- 164×140px dimensions
- 16px border radius
- 4px accent bar at top
- 40px icon in circle
- Balance display
- Wallet type badge
- Press animation

**Figma Reference:** Wallet Card  
**File:** `components/home/WalletCard.tsx`

---

### 3. WalletCarousel
**Purpose:** Horizontal scrollable wallet list

**Props Interface:**
```typescript
interface WalletCarouselProps {
  wallets: Wallet[];
  onWalletPress: (wallet: Wallet) => void;
  onAddWallet?: () => void;
}
```

**Usage Example:**
```typescript
import { WalletCarousel } from '@/components/home';

<WalletCarousel
  wallets={wallets}
  onWalletPress={handleWalletPress}
  onAddWallet={handleAddWallet}
/>
```

**Features:**
- Horizontal scroll
- 16px gap between cards
- Add wallet card (dashed border)
- Snap to card on scroll
- Loading skeleton

**File:** `components/home/WalletCarousel.tsx`

---

### 4. ServiceTile
**Purpose:** Individual service tile in grid

**Props Interface:**
```typescript
interface ServiceTileProps {
  service: Service;
  onPress: (service: Service) => void;
}

interface Service {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
}
```

**Usage Example:**
```typescript
import { ServiceTile } from '@/components/home';

<ServiceTile
  service={{
    id: 'send',
    label: 'Send Money',
    icon: 'paper-plane-outline',
    color: '#22C55E',
    route: '/send-money'
  }}
  onPress={handleServicePress}
/>
```

**Features:**
- 110×110px dimensions
- 12px border radius
- 28px icon
- 13px label
- Service-specific color
- Press animation
- Haptic feedback

**Figma Reference:** Service Card  
**File:** `components/home/ServiceTile.tsx`

---

### 5. ServicesGrid
**Purpose:** 3×3 grid of service tiles

**Props Interface:**
```typescript
interface ServicesGridProps {
  services: Service[];
  onServicePress: (service: Service) => void;
}
```

**Usage Example:**
```typescript
import { ServicesGrid } from '@/components/home';

<ServicesGrid
  services={SERVICES}
  onServicePress={handleServicePress}
/>
```

**Features:**
- 3 columns
- 16px gap
- 9 tiles total
- Responsive layout

**File:** `components/home/ServicesGrid.tsx`

---

### 6. RecentContactsCarousel
**Purpose:** Horizontal list of recent contacts

**Props Interface:**
```typescript
interface RecentContactsCarouselProps {
  contacts: Contact[];
  onContactPress: (contact: Contact) => void;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  avatarUri?: string;
  smartpayId?: string;
}
```

**Usage Example:**
```typescript
import { RecentContactsCarousel } from '@/components/home';

<RecentContactsCarousel
  contacts={recentContacts}
  onContactPress={handleContactPress}
/>
```

**Features:**
- 40px circular chips
- Horizontal scroll
- Avatar + name
- 8 contacts max
- Tap to send money

**File:** `components/home/RecentContactsCarousel.tsx`

---

## Shared Components

Reusable components used across multiple screens.

### 1. ContactChip
**Purpose:** Contact avatar chip (40px circular)

**Props Interface:**
```typescript
interface ContactChipProps {
  contact: Contact;
  onPress: (contact: Contact) => void;
  size?: number;
}
```

**Usage Example:**
```typescript
import { ContactChip } from '@/components/shared';

<ContactChip
  contact={contact}
  onPress={handleSelectContact}
  size={40}
/>
```

**File:** `components/shared/ContactChip.tsx`

---

### 2. AmountInput
**Purpose:** Currency input with validation and formatting

**Props Interface:**
```typescript
interface AmountInputProps {
  value: string;
  onChangeText: (value: string) => void;
  label?: string;
  currency?: string;
  maxAmount?: number;
  error?: string;
}
```

**Usage Example:**
```typescript
import { AmountInput } from '@/components/shared';

<AmountInput
  value={amount}
  onChangeText={setAmount}
  label="Amount to Send"
  currency="NAD"
  maxAmount={5000}
  error={amountError}
/>
```

**Features:**
- Large numeric display (40px)
- Currency symbol (NAD)
- Decimal input (2 places)
- Max amount validation
- Balance check
- Formatted output

**File:** `components/shared/AmountInput.tsx`

---

### 3. QRCodeCard
**Purpose:** QR code display card

**Props Interface:**
```typescript
interface QRCodeCardProps {
  data: string;
  size?: number;
  logo?: boolean;
}
```

**Usage Example:**
```typescript
import { QRCodeCard } from '@/components/shared';

<QRCodeCard
  data={smartpayId}
  size={200}
  logo
/>
```

**Features:**
- Minimum 200px size
- 12px border radius
- 16px padding
- Optional logo overlay
- Share/download actions

**File:** `components/shared/QRCodeCard.tsx`

---

### 4. TransactionReceipt
**Purpose:** Transaction confirmation receipt

**Props Interface:**
```typescript
interface TransactionReceiptProps {
  transaction: Transaction;
  onShare?: () => void;
  onDownload?: () => void;
}
```

**Usage Example:**
```typescript
import { TransactionReceipt } from '@/components/shared';

<TransactionReceipt
  transaction={txn}
  onShare={handleShare}
  onDownload={handleDownload}
/>
```

**Features:**
- Transaction details
- QR code
- Share button
- Download PDF
- Print option

**File:** `components/shared/TransactionReceipt.tsx`

---

## Modal Components

Overlay dialogs and bottom sheets.

### 1. TwoFAModal
**Purpose:** Two-factor authentication PIN verification

**Props Interface:**
```typescript
interface TwoFAModalProps {
  visible: boolean;
  onClose: () => void;
  onVerify: (pin: string) => void;
  isVerifying?: boolean;
  error?: string;
}
```

**Usage Example:**
```typescript
import { TwoFAModal } from '@/components/modals';

<TwoFAModal
  visible={show2FA}
  onClose={() => setShow2FA(false)}
  onVerify={handleVerifyPIN}
  isVerifying={verifying}
  error={verifyError}
/>
```

**Features:**
- 4-digit PIN input
- Secure dots display
- Biometric option
- Error handling
- Slide up animation
- Backdrop dismiss

**File:** `components/modals/TwoFAModal.tsx`

---

### 2. AddMoneyModal
**Purpose:** Add money to wallet bottom sheet

**Props Interface:**
```typescript
interface AddMoneyModalProps {
  visible: boolean;
  onClose: () => void;
  walletId: string;
}
```

**Usage Example:**
```typescript
import { AddMoneyModal } from '@/components/modals';

<AddMoneyModal
  visible={isOpen}
  onClose={() => setIsOpen(false)}
  walletId={selectedWallet.id}
/>
```

**File:** `components/modals/AddMoneyModal.tsx`

---

## Copilot Components

AI assistant cards and conversational UI.

### Core Copilot (7 components)

#### 1. CopilotChatSurface
**Purpose:** Main chat interface with message bubbles

**Features:**
- Message bubbles (user, assistant, system)
- Streaming responses
- Action cards
- Suggestion chips
- Auto-scroll to bottom

**File:** `components/copilot/CopilotChatSurface.tsx`

---

#### 2. CopilotSuggestionChips
**Purpose:** Quick action suggestion pills

**Features:**
- Horizontal scroll
- Pill-shaped chips
- Icon + label
- Press animation

**File:** `components/copilot/CopilotSuggestionChips.tsx`

---

#### 3. CopilotConfirmationModal
**Purpose:** Transaction confirmation dialog

**File:** `components/copilot/CopilotConfirmationModal.tsx`

---

#### 4. CopilotConfirmationCard
**Purpose:** Embedded confirmation card

**File:** `components/copilot/CopilotConfirmationCard.tsx`

---

#### 5. CopilotErrorState
**Purpose:** Error state for copilot failures

**File:** `components/copilot/CopilotErrorState.tsx`

---

#### 6. CopilotSummaryCard
**Purpose:** Summary card for completed actions

**File:** `components/copilot/CopilotSummaryCard.tsx`

---

#### 7. OBSConsentScreen
**Purpose:** Open Banking System consent flow

**File:** `components/copilot/OBSConsentScreen.tsx`

---

### Copilot Cards (20 components)

All copilot cards extend **BaseCard** and follow a consistent pattern.

#### BaseCard
**Purpose:** Foundation for all action cards

**Props Interface:**
```typescript
interface BaseCardProps {
  title: string;
  description?: string;
  status?: 'idle' | 'loading' | 'success' | 'error';
  actions?: BaseCardAction[];
  children?: React.ReactNode;
}

interface BaseCardAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}
```

**File:** `components/copilot/cards/BaseCard.tsx`

---

#### Banking Cards (3)
1. **BankAccountCard** - Display bank account details
2. **BankBalanceCard** - Show bank balance
3. **BankTransactionCard** - Bank transaction details

---

#### Transaction Cards (5 with 2FA)
1. **SendMoneyCard** - P2P transfer initiation
2. **CashOutCard** - Cash withdrawal
3. **VoucherRedemptionCard** - Redeem voucher
4. **LoanOfferCard** - Loan application
5. **GroupTransactionCard** - Group payment/split

All include:
- 2FA PIN verification
- Transaction confirmation
- Amount display
- Recipient details
- Fee breakdown

---

#### Wallet Cards (4)
1. **WalletBalanceCard** - Wallet balance display
2. **WalletFormCard** - Create/edit wallet
3. **WalletTypeSelector** - Select wallet type
4. **IconPicker** - Pick wallet icon

---

#### Location Cards (3)
1. **LocationCard** - Generic location display
2. **AgentMapCard** - Agent finder map
3. **ATMMapCard** - ATM finder map

Features:
- React Native Maps integration
- Current location marker
- Agent/ATM markers
- Directions button
- Distance calculation

---

#### Education Cards (2)
1. **EducationCard** - Financial literacy content (full)
2. **CompactEducationCard** - Educational tips (compact)

Features:
- Rich content
- Expandable sections
- Progress tracking
- Share functionality

---

#### Utility Cards (3)
1. **PaymentInitiationCard** - Payment flow starter
2. **TransactionConfirmationCard** - Confirm transaction
3. **IconPicker** - Icon selection

---

## Authentication Components

Complete authentication system with 28 components organized by type.

### Input Components (5)

#### 1. PhoneInput
**Purpose:** Phone number input with country code selector

**Props Interface:**
```typescript
interface PhoneInputProps {
  value: string;
  onChangeText: (value: string) => void;
  countryCode?: string;
  onCountryCodeChange?: (code: string) => void;
  error?: string;
  disabled?: boolean;
}
```

**Usage Example:**
```typescript
import { PhoneInput } from '@/components/auth';

<PhoneInput
  value={phone}
  onChangeText={setPhone}
  countryCode="NA"
  onCountryCodeChange={setCountryCode}
  error={phoneError}
/>
```

**Features:**
- Country code selector (150+ countries)
- Flag emoji display
- Phone number validation
- International format
- Error states

**File:** `components/auth/inputs/PhoneInput.tsx`

---

#### 2. EmailInput
**Purpose:** Email input with validation

**File:** `components/auth/inputs/EmailInput.tsx`

---

#### 3. OTPInput
**Purpose:** 6-digit OTP code entry

**Features:**
- 6 separate boxes
- Auto-focus next box
- Auto-submit when complete
- Paste support
- Numeric keyboard

**File:** `components/auth/inputs/OTPInput.tsx`

---

#### 4. PasswordInput
**Purpose:** Password input with strength meter

**Features:**
- Show/hide toggle
- Strength indicator (weak, medium, strong)
- Real-time validation
- Requirements checklist

**File:** `components/auth/inputs/PasswordInput.tsx`

---

#### 5. PINInput
**Purpose:** 4-digit PIN entry (secure)

**Features:**
- 4 dots display
- Biometric option
- Forgot PIN link
- Secure text entry

**File:** `components/auth/inputs/PINInput.tsx`

---

### Button Components (3)

#### 1. AuthButton
**Purpose:** Primary auth CTA button

**File:** `components/auth/buttons/AuthButton.tsx`

---

#### 2. SocialAuthButton
**Purpose:** Social login buttons (Google, Apple, Facebook)

**Props Interface:**
```typescript
interface SocialAuthButtonProps {
  provider: 'google' | 'apple' | 'facebook';
  onPress: () => void;
  loading?: boolean;
}
```

**File:** `components/auth/buttons/SocialAuthButton.tsx`

---

#### 3. LinkButton
**Purpose:** Text link button

**File:** `components/auth/buttons/LinkButton.tsx`

---

### Form Components (3)

#### 1. AuthForm
**Purpose:** Form wrapper with validation

**File:** `components/auth/forms/AuthForm.tsx`

#### 2. FormField
**Purpose:** Form field wrapper

**File:** `components/auth/forms/FormField.tsx`

#### 3. FormSection
**Purpose:** Form section divider

**File:** `components/auth/forms/FormSection.tsx`

---

### Feedback Components (4)

#### 1. AuthError
**Purpose:** Display auth errors

**File:** `components/auth/feedback/AuthError.tsx`

#### 2. AuthSuccess
**Purpose:** Success feedback

**File:** `components/auth/feedback/AuthSuccess.tsx`

#### 3. LoadingSpinner
**Purpose:** Loading indicator

**File:** `components/auth/feedback/LoadingSpinner.tsx`

#### 4. ProgressIndicator
**Purpose:** Multi-step progress

**File:** `components/auth/feedback/ProgressIndicator.tsx`

---

### Layout Components (5)

#### 1. AuthContainer
**Purpose:** Auth screen wrapper

**File:** `components/auth/layout/AuthContainer.tsx`

#### 2. AuthHeader
**Purpose:** Auth screen header

**File:** `components/auth/layout/AuthHeader.tsx`

#### 3. AuthFooter
**Purpose:** Auth screen footer

**File:** `components/auth/layout/AuthFooter.tsx`

#### 4. AuthScreenShell
**Purpose:** Complete auth screen shell

**File:** `components/auth/layout/AuthScreenShell.tsx`

#### 5. OtpScreen
**Purpose:** OTP verification layout

**File:** `components/auth/layout/OtpScreen.tsx`

---

### Specialty Components (4)

#### 1. BiometricPrompt
**Purpose:** Face ID/Touch ID prompt

**File:** `components/auth/specialty/BiometricPrompt.tsx`

#### 2. CountryCodeSelector
**Purpose:** Country code dropdown (150+ countries)

**File:** `components/auth/specialty/CountryCodeSelector.tsx`

#### 3. VerificationTimer
**Purpose:** OTP countdown timer (60s)

**File:** `components/auth/specialty/VerificationTimer.tsx`

#### 4. PasswordStrengthMeter
**Purpose:** Password strength visualization

**File:** `components/auth/specialty/PasswordStrengthMeter.tsx`

---

### Authentication Screens (4)

(Auth screens use backend OTP and onboarding flow.)
3. **SignInSupabaseScreen** - Supabase sign in
4. **SignUpSupabaseScreen** - Supabase sign up

**Files:** `components/auth/*.tsx`

---

## Activity Components

### 1. TransactionListItem
**Purpose:** Transaction list item for activity feed

**Props Interface:**
```typescript
interface TransactionListItemProps {
  transaction: Transaction;
  onPress: (transaction: Transaction) => void;
}
```

**Usage Example:**
```typescript
import { TransactionListItem } from '@/components/activity';

<TransactionListItem
  transaction={txn}
  onPress={handleViewTransaction}
/>
```

**Features:**
- 72px height
- Transaction icon
- Amount (colored by type)
- Date/time
- Status badge
- Swipe actions (future)

**File:** `components/activity/TransactionListItem.tsx`

---

## Common Components

### 1. OfflineBanner
**Purpose:** Network offline indicator banner

**Features:**
- Yellow warning banner
- Icon + message
- Auto-show when offline
- Auto-hide when online
- Slide down animation

**File:** `components/common/OfflineBanner.tsx`

---

## Legacy Components

Utility components from initial implementation (11 components):
- BalanceStrip
- CustomHeader
- Dropdown
- EditScreenInfo
- ExternalLink
- RoundBtn
- SmartpayLogo
- StyledText
- Themed
- useColorScheme
- useClientOnlyValue

---

## Component Usage Patterns

### Import Pattern
All components use barrel exports for clean imports:

```typescript
// UI components
import { Button, TextInput, Avatar } from '@/components/ui';

// Layout components
import { AppHeader, ScreenLayout } from '@/components/layout';

// Home components
import { BalanceCard, WalletCard, ServicesGrid } from '@/components/home';

// Shared components
import { ContactChip, AmountInput } from '@/components/shared';

// Copilot cards
import { SendMoneyCard, WalletFormCard } from '@/components/copilot/cards';

// Auth components
import { PhoneInput, OTPInput, AuthButton } from '@/components/auth';
```

### Design System Usage
All components use centralized design tokens:

```typescript
import { designSystem as DS } from '@/constants/designSystem';

const styles = StyleSheet.create({
  container: {
    backgroundColor: DS.colors.background,
    padding: DS.spacing.md,
    borderRadius: DS.radius.md,
    ...DS.shadows.md,
  },
  text: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
  },
});
```

### Accessibility Pattern
All interactive components include:

```typescript
<TouchableOpacity
  onPress={handlePress}
  accessibilityRole="button"
  accessibilityLabel="Descriptive label"
  accessibilityHint="What happens when pressed"
  accessibilityState={{ disabled: isDisabled }}
  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
>
  {children}
</TouchableOpacity>
```

### Haptic Feedback Pattern
```typescript
import * as Haptics from 'expo-haptics';

const handlePress = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  onPress();
};
```

---

## Component Hierarchy

### Composition Example
Home Screen component tree:

```
HomeScreen
├── AppHeader
│   ├── SearchBar (TextInput)
│   ├── Notification (Icon + Badge)
│   └── Avatar
├── OfflineBanner (conditional)
├── ScrollView
│   ├── BalanceCard
│   ├── WalletCarousel
│   │   ├── WalletCard (×N)
│   │   └── AddWalletCard
│   ├── ServicesGrid
│   │   └── ServiceTile (×9)
│   └── RecentContactsCarousel
│       └── ContactChip (×8)
└── FloatingActionButton
```

---

## Testing Components

### Unit Test Example
```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/ui';

describe('Button', () => {
  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <Button onPress={onPress}>Click me</Button>
    );
    
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
  
  it('shows loading spinner when isLoading', () => {
    const { getByTestId } = render(
      <Button onPress={() => {}} isLoading>
        Submit
      </Button>
    );
    
    expect(getByTestId('activity-indicator')).toBeTruthy();
  });
});
```

---

## Documentation Standards

All components include:
1. **File Header Comment** - Purpose, Figma ref, location
2. **Props Interface** - TypeScript definitions
3. **JSDoc Comments** - Parameter descriptions
4. **Usage Examples** - Code snippets
5. **Features List** - Key capabilities
6. **Accessibility** - ARIA attributes
7. **Design Tokens** - DS usage

---

**Document Version:** 1.0.0  
**Last Updated:** March 17, 2026  
**Total Components:** 93
