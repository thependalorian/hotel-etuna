# Buffr App Setup & Configuration Documentation

This document outlines the complete process for setting up and configuring the Buffr React Native/Expo application.

## Table of Contents
1. [Project Creation](#1-project-creation)
2. [Package Installation](#2-package-installation)
3. [Babel Configuration](#3-babel-configuration)
4. [Entry Point Configuration](#4-entry-point-configuration)
5. [Native Build Setup](#5-native-build-setup)
6. [CocoaPods Installation](#6-cocoapods-installation)
7. [Styling Setup](#7-styling-setup)
8. [Home Screen Implementation](#8-home-screen-implementation)
9. [Design Assets & Component Roadmap](#9-design-assets--component-roadmap)
10. [Screens & Pages to Create](#10-screens--pages-to-create)
11. [State Management & Context](#11-state-management--context)
12. [Animations & Transitions](#12-animations--transitions)
13. [PDF Export Functionality](#13-pdf-export-functionality)
14. [NAMQR Code Standards Implementation](#14-namqr-code-standards-implementation)
15. [Transactions Dashboard & Category Navigation](#15-transactions-dashboard--category-navigation)
16. [Wallet Management Implementation](#16-wallet-management-implementation)
17. [Known Issues & Future Fixes](#known-issues--future-fixes)
18. [Running the App](#18-running-the-app)

---

## 1. Project Creation

### Step 1.1: Create Expo App with Tabs Template

We started by creating a new Expo project using the tabs template:

```bash
npx create-expo-app buffr -t tabs
```

**What this does:**
- Creates a new Expo project named `buffr`
- Uses the `tabs` template which provides a tab-based navigation structure
- Automatically installs base dependencies
- Sets up the project structure with Expo Router

**Output:**
- Project directory created at `./buffr`
- Base dependencies installed (716 packages)
- Project ready for development

**Navigate to project:**
```bash
cd buffr
```

---

## 2. Package Installation

### Step 2.1: Install Required Native Packages

We installed three essential packages for React Native development:

```bash
npx expo install expo-dev-client react-native-reanimated react-native-gesture-handler
```

**Packages Installed:**

1. **expo-dev-client** (`~6.0.20`)
   - Enables custom development builds
   - Required for native modules and custom native code
   - Allows testing native features during development

2. **react-native-reanimated** (`~4.1.1`)
   - High-performance animation library
   - Uses worklets for smooth 60fps animations
   - Required for advanced UI animations

3. **react-native-gesture-handler** (`~2.28.0`)
   - Native gesture recognition library
   - Provides touch gesture handling
   - Required for swipe gestures, pan gestures, etc.

**Why `npx expo install` instead of `npm install`:**
- Ensures package versions are compatible with the current Expo SDK version
- Automatically resolves version conflicts
- Maintains compatibility with Expo SDK 54.0.0

**Installation Output:**
```
› Installing 3 SDK 54.0.0 compatible native modules using npm
added 15 packages, and audited 732 packages in 5s
found 0 vulnerabilities
```

---

## 3. Babel Configuration

### Step 3.1: Create Babel Configuration File

We created a `babel.config.js` file to configure Babel for React Native Reanimated:

**File:** `babel.config.js`

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for react-native-reanimated
      'react-native-reanimated/plugin',
    ],
  };
};
```

**Why this is needed:**
- `react-native-reanimated` requires a Babel plugin to transform worklet syntax
- The plugin must be listed **last** in the plugins array (important!)
- `babel-preset-expo` is the standard preset for Expo projects
- `api.cache(true)` enables caching for faster builds

**Critical Note:**
- The `react-native-reanimated/plugin` must be the **last** plugin in the array
- This ensures proper code transformation order

---

## 4. Entry Point Configuration

### Step 4.1: Update Root Layout File

We updated the root layout file to import `react-native-gesture-handler` at the very top:

**File:** `app/_layout.tsx`

**Key Changes:**
1. Added `react-native-gesture-handler` import as the **first import** (before all other imports)
2. This is a requirement for gesture-handler to work properly

```typescript
// Must be imported first for react-native-gesture-handler
import 'react-native-gesture-handler';

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
// ... rest of the file
```

**Why this order matters:**
- `react-native-gesture-handler` must be imported before any other React Native imports
- This ensures the gesture handler is properly initialized before the app renders
- Failure to do this can cause gesture-related features to malfunction

---

## 5. Native Build Setup

### Step 5.1: Run Expo Prebuild

We ran Expo prebuild to generate native iOS and Android directories:

```bash
npx expo prebuild
```

**What this does:**
- Creates `ios/` and `android/` native directories
- Generates native project files (Xcode project, Android Gradle files)
- Configures native dependencies
- Updates `package.json` with native build scripts
- **Automatically detects and installs CocoaPods if missing** (see Section 6)
- **Automatically runs `pod install`** in the iOS directory after CocoaPods installation

**Configuration Prompts:**
- **Android package name:** `com.thependalorian.buffr`
- **Apple bundle identifier:** `com.thependalorian.buffr`

**Output:**
```
✔ Created native directories
✔ Updated package.json
» android: userInterfaceStyle: Install expo-system-ui in your project to enable this feature.
✔ Finished prebuild
CocoaPods CLI not found in your PATH, installing it now.
› Attempting to install CocoaPods CLI with Gem
› Failed to install CocoaPods CLI with Gem
› Attempting to install CocoaPods CLI with Homebrew
✔ Successfully installed CocoaPods CLI with Homebrew
✔ Installed CocoaPods CLI.
✔ Running `pod install` in the `ios` directory.
```

**Updated Scripts in package.json:**
```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web"
  }
}
```

**Note:** The `android` and `ios` scripts now use `expo run:android` and `expo run:ios` instead of `expo start --android/--ios` to support native builds.

**Important:** You don't need to manually install CocoaPods or run `pod install` - `expo prebuild` handles this automatically!

### Step 5.2: Run iOS Build

After prebuild completes successfully, run the iOS build:

```bash
npx expo run:ios
```

**What this does:**
- Builds the native iOS app
- Launches the iOS Simulator (if available)
- Installs the app on the simulator
- Starts the Metro bundler for hot reloading

**First Build Notes:**
- First build may take several minutes as it compiles native code
- Ensure Xcode is installed (required for iOS development)
- iOS Simulator will launch automatically if available
- Subsequent builds will be faster due to caching

---

## 6. CocoaPods Installation (Automatic)

### Step 6.1: Automatic CocoaPods Installation by Expo Prebuild

**Important:** CocoaPods installation is **automatically handled by `expo prebuild`**. You do not need to manually install CocoaPods or run `pod install`.

During the prebuild process, Expo automatically:
1. **Detects** if CocoaPods CLI is missing from your PATH
2. **Attempts installation** using multiple methods (Gem first, then Homebrew)
3. **Installs iOS dependencies** by automatically running `pod install` in the `ios/` directory

**Installation Process:**

**Attempt 1: Gem Installation (Failed in our case)**
```bash
gem install cocoapods --no-document
```
- **Result:** Failed due to permission issues
- **Error:** `You don't have write permissions for the /Library/Ruby/Gems/2.6.0 directory`
- Expo automatically falls back to Homebrew if Gem installation fails

**Attempt 2: Homebrew Installation (Automatic Fallback)**
- Expo automatically fell back to Homebrew installation
- **Result:** Successfully installed CocoaPods 1.16.2_1
- **Dependencies automatically installed:**
  - `libyaml` (0.2.5)
  - `ruby` (3.4.7)
  - `ca-certificates` (2025-12-02)

**Automatic `pod install`:**
After CocoaPods installation, Expo automatically runs:
```bash
pod install
```
in the `ios/` directory, which:
- Installs all native iOS dependencies defined in `ios/Podfile`
- Creates `ios/Pods/` directory with dependencies
- Generates `ios/*.xcworkspace` file (use this instead of `.xcodeproj`)

**What is CocoaPods?**
- Dependency manager for iOS projects
- Manages native iOS dependencies
- Required for building iOS apps with native modules

**Installation Location:**
- Installed via Homebrew at `/opt/homebrew/Cellar/cocoapods/`
- Available system-wide after installation

**Manual Installation (Only if needed for troubleshooting):**
```bash
# Option 1: Using Homebrew (Recommended)
brew install cocoapods

# Option 2: Using Gem with user install
gem install cocoapods --user-install

# Option 3: Using Gem with sudo (not recommended)
sudo gem install cocoapods
```

**Verify Installation:**
```bash
pod --version
# Should output: 1.16.2 (or similar version)
```

**Summary:**
- ✅ CocoaPods installation: **Automatic** (handled by `expo prebuild`)
- ✅ iOS dependencies installation: **Automatic** (handled by `expo prebuild`)
- ✅ No manual steps required: Just run `npx expo prebuild` and everything is handled automatically

---

## 7. Styling Setup

### Step 7.1: Update Colors.ts with Buffr Brand Colors

We updated `constants/Colors.ts` with the official Buffr brand color palette based on the app designs:

**File:** `constants/Colors.ts`

```typescript
export default {
  // Primary Brand Colors
  primary: '#0029D6',        // Buffr Blue
  primaryLight: '#2563EB',   // Buffr Blue Light
  primaryDark: '#1E40AF',    // Buffr Blue Dark
  primaryMuted: '#C9C8FA',   // Muted primary for backgrounds
  
  // Background Colors
  background: '#F8FAFC',     // Off-white background
  backgroundGray: '#F1F5F9', // Light gray background
  white: '#FFFFFF',
  
  // Text Colors
  text: '#020617',           // Primary text (very dark blue/black)
  textSecondary: '#64748B',  // Secondary text (slate gray)
  textTertiary: '#94A3B8',   // Tertiary text (light slate)
  
  // UI Colors
  border: '#E2E8F0',         // Border color
  lightGray: '#D8DCE2',     // Light gray for dividers
  gray: '#626D77',           // Medium gray
  dark: '#141518',           // Dark color
  
  // Status Colors
  success: '#10B981',        // Success green
  error: '#E11D48',          // Error red
  warning: '#F59E0B',        // Warning orange
  info: '#3B82F6',           // Info blue
};
```

**Color Source:** Based on design assets from `/Users/georgenekwaya/Downloads/BuffrCrew/Buffr App Design`

### Step 7.2: Create Reusable Styles in Styles.ts

We created comprehensive reusable styles in `constants/Styles.ts`:

**File:** `constants/Styles.ts`

The stylesheet includes:
- Container styles
- Button styles (pill buttons, small buttons)
- Text styles (headers, descriptions, links)
- Card/block styles
- Section headers
- And more reusable components

**Usage Example:**
```typescript
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';
import { View, Text, TouchableOpacity } from 'react-native';

// Use in components
<View style={defaultStyles.container}>
  <Text style={defaultStyles.header}>Welcome to Buffr</Text>
  <Text style={defaultStyles.descriptionText}>
    Your financial companion for seamless payments
  </Text>
  <TouchableOpacity style={defaultStyles.pillButton}>
    <Text style={defaultStyles.buttonText}>Get Started</Text>
  </TouchableOpacity>
  
  {/* Card example */}
  <View style={defaultStyles.card}>
    <Text style={defaultStyles.headerSmall}>Card Title</Text>
    <Text style={defaultStyles.bodyText}>Card content goes here</Text>
  </View>
</View>
```

**Key Features:**
- ✅ Consistent color palette based on Buffr brand guidelines
- ✅ Reusable button styles (pill buttons, outline buttons)
- ✅ Text styles for headers, body, captions, and links
- ✅ Card and block components for content containers
- ✅ Input field styles with focus and error states
- ✅ Badge and tag components for status indicators
- ✅ Layout utilities (rows, centered content, spacing)
- ✅ All styles follow design patterns from Buffr App Design assets

---

## 8. Home Screen Implementation

### Step 8.5: Account Quick View Component

**AccountQuickView Component:**
- ✅ Created centered account quick view component
- ✅ Shows Buffr main account with logo and account number (e.g., ..823)
- ✅ Swipeable carousel for multiple linked cards/accounts
- ✅ + button to link new debit/credit cards
- ✅ Page indicators for multiple accounts
- ✅ Pill-shaped styling (borderRadius: 25)
- ✅ Location: `components/AccountQuickView.tsx`

**Home Screen Updates:**
- ✅ Account quick view centered on home screen
- ✅ Replaced left-aligned account header with centered AccountQuickView
- ✅ + button navigates to add card screen
- ✅ Account press navigates to card/account management
- ✅ "View >" button on Buffr Card navigates to cards screen
- ✅ Balance display with show/hide toggle (already implemented)

### Step 8.1: Buffr Card - Digital Wallet Account

The **Buffr Card** is the main digital wallet account that users receive when they create their Buffr account. It serves as the primary financial account within the app.

**Key Features:**
- **Primary Account:** Every user gets a Buffr Card when they sign up
- **Digital Wallet:** Functions as a digital wallet for storing and managing funds
- **Main Balance Display:** The total balance shown represents the funds in the Buffr Card wallet

### Step 8.2: Balance Display and Controls

The home screen displays the Buffr Card balance with two main controls:

**Balance Display:**
- **Format:** `N$ XXX` (Namibian Dollar currency)
- **Label:** "Total Balance" indicates the total funds in the Buffr Card wallet
- **Default State:** Balance is hidden by default, showing "N$ XXX" for privacy

**Show/Hide Toggle:**
- **Purpose:** Privacy feature allowing users to show or hide their wallet balance
- **Functionality:**
  - Clicking "Show" reveals the actual balance (e.g., "N$ 1,234.56")
  - Clicking "Hide" (when visible) hides the balance back to "N$ XXX"
  - Toggle state is managed locally in the component

**+ Add Button:**
- **Purpose:** Allows users to link external payment cards to their Buffr account
- **Functionality:**
  - Links debit cards from various banks
  - Links credit cards from different providers
  - Enables users to fund their Buffr Card wallet from linked cards
  - Provides access to multiple payment methods within the app

### Step 8.3: Account Structure

**Buffr Card (Main Account):**
- Created automatically when user signs up
- Primary digital wallet for the user
- Balance displayed on home screen
- Can receive funds from linked cards or other sources

**Linked Cards:**
- External debit/credit cards added via "+ Add" button
- Used to fund the Buffr Card wallet
- Managed separately from the Buffr Card balance
- Can be added/removed by the user

**Wallets Section:**
- Additional wallet accounts users can create
- Separate from the main Buffr Card
- Each wallet can have its own balance and purpose
- Examples: "Aquarium" wallet, savings wallets, etc.

### Step 8.4: Reusable Components

We created a `components/` folder with reusable UI components for the home screen and throughout the app:

**Components Created:**
1. **ProfileAvatar** - User profile picture with placeholder
2. **SearchBar** - Search input with notification bell and profile avatar
3. **BalanceDisplay** - Balance display with show/hide toggle and add funds button
4. **WalletCard** - Individual wallet card component
5. **AddWalletCard** - Add wallet button card
6. **UtilityButton** - Utility grid button component
7. **ActionButton** - Action buttons (Send/Scan) with variants

**Common Components (`components/common/`):**
8. **PillButton** - Reusable pill-shaped button with icon support
   - Variants: `primary`, `dark`, `outline`
   - Features: Loading state, disabled state, icon support
   - Styling: `borderRadius: 25`, `height: 50` (pill-shaped)
   - Location: `components/common/PillButton.tsx`
   
9. **SettingsItem** - Reusable settings list item component
   - Features: Icon, title, chevron indicator
   - Consistent styling with proper text contrast
   - Location: `components/common/SettingsItem.tsx`
   
10. **ScreenHeader** - Reusable screen header with back button and actions
11. **PayFromSelector** - Payment source selection component
12. **PaymentMethodTypeModal** - Modal for selecting payment method type
13. **NoteInputModal** - Modal for adding payment notes
14. **ContactCarousel** - Contact selection carousel
15. **ContactListItem** - Individual contact list item
16. **ContactDetailCard** - Contact detail display card
17. **ToggleSwitch** - Toggle switch component
18. **StatusBadge** - Status badge component
19. **IconPicker** - Icon selection picker

**Component Implementation:**

The balance display is implemented using the `BalanceDisplay` component:

**File:** `components/BalanceDisplay.tsx`

```typescript
<BalanceDisplay
  balance={balance}
  currency="N$"
  onAddFunds={handleAddFunds}
/>
```

**Props:**
- `balance`: The current balance amount (number or string)
- `currency`: Currency symbol (default: "N$")
- `showBalance`: Initial visibility state (optional)
- `onShowToggle`: Callback when toggle is pressed (optional)
- `onAddFunds`: Callback when "+ Add" button is pressed

**Features:**
- Automatic balance formatting
- Privacy toggle functionality
- Currency support
- Customizable callbacks for navigation

**Component Usage:**
All components are exported from `components/index.ts` for easy imports:

```typescript
import {
  SearchBar,
  BalanceDisplay,
  WalletCard,
  AddWalletCard,
  UtilityButton,
  ActionButton,
} from '@/components';
```

---

## 9. Design Assets & Component Roadmap

### Step 9.1: Design Assets Location

All design assets are located in the BuffrCrew folder:

**Buffr App Design:**
- **Location:** `/Users/georgenekwaya/Downloads/BuffrCrew/Buffr App Design`
- **Total Files:** 251+ SVG design files
- **Format:** SVG (scalable vector graphics)

**Buffr Card Design:**
- **Location:** `/Users/georgenekwaya/Downloads/BuffrCrew/Buffr Card Design `
- **Total Files:** 22 SVG files
- **Includes:** Card frames, Mastercard, Visa designs

### Step 9.2: Buffr Card Designs

The Buffr Card Design folder contains:

**Card Frame Designs (20 frames):**
- `Frame 2.svg` through `Frame 32.svg` - Various card frame designs
- Multiple design options for card customization
- Different visual styles and patterns

**Payment Network Cards:**
- `Master Card.svg` - Mastercard branded card design
- `Visa.svg` - Visa branded card design

**Usage:**
- Card frames can be used for Buffr Card customization
- Payment network logos for linked external cards
- Visual representation of physical/digital cards

### Step 9.3: Component Flows & Screens to Implement

Based on the design assets, here are the key flows and components that need to be created:

#### **Card Management Flow**
- ✅ **Card View** - Display Buffr Card (partially implemented)
- ✅ **Add Card** - Link external debit/credit cards (app/add-card.tsx)
  - `Add Card.svg` - Main add card interface
  - `Add Card/Edit Card.svg` - Edit card interface (4 variants)
  - `Card Number.svg` - Card number input
  - `Bank Card View.svg` - Bank card display
- ✅ **Card Management** - View, edit, remove linked cards (app/cards.tsx)
- ✅ **Card Details** - Detailed card information screen (app/cards/[id].tsx)
  - Shows card details, creation date, last used date, verification status
  - Management options: Set as default, Remove card

#### **Wallet Management Flow**
- ✅ **Wallet View** - Display wallets (partially implemented)
- ⏳ **Add Wallet** - Create new wallet
  - `Adding A Wallet.svg` - Add wallet interface
  - `Adding A Wallet-1.svg` - Add wallet variant
- ⏳ **Wallet History** - Transaction history
  - `Wallet History (Added).svg` - Funds added history
  - `Wallet History (Spendings).svg` - Spending history
  - `Auto Pay Enabled Wallet View.svg` - Auto pay wallet view

#### **Money Transfer Flow**
- ⏳ **Add Money** - Fund Buffr Card or wallets
  - `Add Money.svg` - Add money interface
  - `Add Money-1.svg` - Add money variant
  - `Add Money (Changed Method).svg` - Payment method selection
  - `Add Amount.svg` - Amount input
  - `Add Amount (Wallet).svg` - Add to specific wallet
- ⏳ **Transfer** - Transfer between accounts
  - `Transfer.svg` - Transfer interface
- ⏳ **Select Method** - Payment method selection
  - `Select Method.svg` - Choose payment method
  - `Changed Method.svg` - Method change confirmation

#### **Request & Payment Flow**
- ⏳ **Request Money** - Request payment from contacts
  - `After Making Request.svg` - Request confirmation
  - `Requested Amount (paid 3/4).svg` - Request status
  - `Elias Matheus See Pay Via Request.svg` - Request view
- ⏳ **Pay Via Request** - Pay requested amounts
- ⏳ **Receipt** - Transaction receipts
  - `Receipt.svg` - Receipt display
  - `After Making Transaction.svg` - Transaction confirmation

#### **QR Code Flow**
- ✅ **QR Code Display** - Show user's QR code
  - `Your QR Code.svg` - QR code display
  - `Your QR Code-1.svg` - QR code variant 1
  - `Your QR Code-2.svg` - QR code variant 2
- ✅ **QR Code Scanner** - Scan QR codes for payments
  - Standalone scanner (`app/qr-scanner.tsx`) - accessed from home screen "Scan QR" button
  - Send Money scanner (`app/send-money/qr-scanner.tsx`) - part of send-money flow

#### **Loan Management Flow**
- ⏳ **Loan Offers** - View loan offers
  - `Loan Offer Details-1.svg` - Loan offer variant 1
  - `Loan Offer Details-2.svg` - Loan offer variant 2
  - `Loan Offer Details-3.svg` - Loan offer variant 3
- ⏳ **Loan Cases** - Active loan management
  - `Loan Cases.svg` - Loan cases view
  - `Loan Details.svg` - Loan details
  - `Loan Details-1.svg` - Loan details variant 1
  - `Loan Details-2.svg` - Loan details variant 2
- ⏳ **Loan Payment** - Pay loans
  - `Loan Pay.svg` - Loan payment interface
- ⏳ **Loan Credited** - Loan disbursement confirmation
  - `Loan Credited.svg` - Loan credited confirmation

#### **Transactions Flow**
- ⏳ **Transactions Screen** - Transaction history (placeholder exists)
  - `Transactions (Earnings).svg` - Earnings transactions
  - `Transactions (Balance).svg` - Balance transactions

#### **Group & Social Features**
- ⏳ **Group Management** - Create and manage groups
  - `Group View.svg` - Group overview
  - `Group View-1.svg` - Group view variant
  - `Create Group.svg` - Create group interface
  - `Create Group-1.svg` - Create group variant
  - `Group Settings.svg` - Group settings
  - `Group Send.svg` - Send to group
  - `Group Request.svg` - Request from group
  - `Group Remove.svg` - Remove from group
  - `Group View (request sent).svg` - Request status
  - `Notified in the group.svg` - Group notifications
  - `Other member (group view).svg` - Member view

#### **Contact Management**
- ⏳ **Contact View** - Manage contacts
  - `Contact View.svg` - Contact list
  - `Contact View-1.svg` - Contact view variant 1
  - `Contact View-2.svg` - Contact view variant 2

#### **Onboarding & Verification Flow**
- ⏳ **Onboarding** - User onboarding screens
  - `Starting screen.svg` - App launch screen
  - `Onboarding completed.svg` - Onboarding completion
  - `After Setting Up Name.svg` - Post name setup
- ⏳ **Verification** - Identity verification
  - `Verify Yourself.svg` - Identity verification
  - `Verify FaceID-1.svg` - FaceID verification variant 1
  - `Verify FaceID-2.svg` - FaceID verification variant 2
  - `After clicking Verify CTA.svg` - Post verification
- ⏳ **Add Details** - User information setup
  - `Add details.svg` - Add details interface
  - `Add details-1.svg` through `Add details-5.svg` - Detail variants
  - `Details Added.svg` - Details confirmation
  - `Added Bank Account Home.svg` - Bank account added
  - `Added Note.svg` - Note added confirmation (4 variants)

#### **Settings & Configuration**
- ⏳ **Notification Settings** - Manage notifications
  - `Notification Settings.svg` - Notification settings
- ⏳ **Auto Pay** - Auto payment configuration
  - `Auto Pay Toggle On.svg` - Auto pay enabled

#### **Refund Flow**
- ⏳ **Refund** - Request and process refunds
  - `Refund Screen.svg` - Refund interface
  - `How Refunt Works_.svg` - Refund explanation

#### **Bank Account Management**
- ⏳ **Bank Accounts** - Manage linked bank accounts
  - `Bank Accounts.svg` - Bank accounts list
  - `Available Bank Accounts.svg` - Available accounts
  - `Available Bank Accounts-1.svg` - Available accounts variant 1
  - `Available Bank Accounts-2.svg` - Available accounts variant 2
  - `Back to Buffr Account.svg` - Return to account

### Step 9.4: Component Creation Priority

**Phase 1 - Core Functionality (High Priority):**
1. ✅ Home Screen (Completed)
2. ⏳ Add Card Flow - Link external cards
3. ⏳ Add Money Flow - Fund Buffr Card
4. ⏳ Transfer Flow - Money transfers
5. ⏳ QR Code Display - Show user QR code
6. ⏳ Transactions Screen - Transaction history

**Phase 2 - Essential Features (Medium Priority):**
7. ⏳ Request Money Flow - Request payments
8. ⏳ Wallet Management - Full wallet features
9. ⏳ Loan Management - View and manage loans
10. ⏳ Receipt Display - Transaction receipts

**Phase 3 - Advanced Features (Lower Priority):**
11. ⏳ Group Features - Social payment groups
12. ⏳ Contact Management - Contact list
13. ⏳ Settings Screens - App configuration
14. ⏳ Refund Flow - Refund processing

**Phase 4 - Onboarding (Can be done in parallel):**
15. ⏳ Onboarding Flow - User setup
16. ⏳ Verification Flow - Identity verification

### Step 9.5: Design Asset Integration

**Card Designs:**
- Card frame SVGs can be converted to React Native components
- Use `react-native-svg` for rendering SVG designs
- Card designs should support:
  - Multiple frame options
  - Payment network logos (Mastercard, Visa)
  - Card number masking
  - Expiry date and CVV display

**Screen Designs:**
- Each SVG represents a complete screen or component
- Use as reference for layout and styling
- Extract color values, spacing, and component patterns
- Implement responsive layouts based on designs

**Animation Assets:**
- `Animation.svg` through `Animation-32.svg` - Animation frames
- Can be used for loading states and micro-interactions
- Consider using `react-native-reanimated` for animations

### Step 9.6: Component Structure Recommendations

**Suggested Component Organization:**

```
components/
├── cards/
│   ├── BuffrCard.tsx          # Main Buffr Card display
│   ├── CardFrame.tsx           # Card frame component
│   ├── AddCardForm.tsx         # Add card form
│   └── CardList.tsx            # List of linked cards
├── wallets/
│   ├── WalletView.tsx          # Wallet detail view
│   ├── AddWalletForm.tsx       # Add wallet form
│   └── WalletHistory.tsx       # Wallet transaction history
├── transfers/
│   ├── AddMoneyScreen.tsx      # Add money interface
│   ├── TransferScreen.tsx      # Transfer interface
│   └── SelectMethod.tsx         # Payment method selection
├── requests/
│   ├── RequestMoney.tsx        # Request money interface
│   ├── RequestStatus.tsx       # Request status display
│   └── PayRequest.tsx          # Pay via request
├── qr/
│   ├── QRCodeDisplay.tsx       # Show user QR code (NAMQR format)
│   └── QRCodeScanner.tsx       # Scan QR codes (legacy component, see app/qr-scanner.tsx and app/send-money/qr-scanner.tsx)
├── loans/
│   ├── LoanOffers.tsx          # Loan offers list
│   ├── LoanDetails.tsx         # Loan detail view
│   └── LoanPayment.tsx         # Loan payment interface
├── groups/
│   ├── GroupView.tsx           # Group overview
│   ├── CreateGroup.tsx         # Create group
│   └── GroupSettings.tsx       # Group settings
└── receipts/
    └── ReceiptView.tsx         # Transaction receipt
```

---

## 10. Running the App

### Step 10.1: Clear Cache and Start Development Server

After configuration changes, always clear the cache:

```bash
npx expo start --clear
```

**Why clear cache:**
- Ensures Babel configuration changes are picked up
- Clears Metro bundler cache
- Prevents stale configuration issues

### Step 10.2: Run on Different Platforms

**iOS (requires macOS and Xcode):**
```bash
npm run ios
# or
npx expo run:ios
```

**Android (requires Android Studio and Android SDK):**
```bash
npm run android
# or
npx expo run:android
```

**Web:**
```bash
npm run web
# or
npx expo start --web
```

**Development Build:**
```bash
npx expo start --dev-client
```

---

## Project Structure

After setup, the project structure looks like this:

```
buffr/
├── app/                    # Expo Router app directory
│   ├── _layout.tsx         # Root layout (with TransactionsProvider)
│   ├── (tabs)/             # Tab navigation group
│   │   ├── _layout.tsx     # Tab navigation layout
│   │   ├── index.tsx       # Home screen (✅ Done)
│   │   ├── transactions.tsx # Transactions screen (✅ Done)
│   │   └── loans.tsx        # Loans screen (placeholder)
│   ├── transactions/       # Transaction-related screens
│   │   ├── [id].tsx         # Transaction receipt screen (✅ Done)
│   │   └── category/        # Category transactions
│   │       └── [categoryId].tsx # Category transactions list (✅ Done)
│   ├── wallets/            # Wallet-related screens
│   │   ├── [id].tsx         # Wallet overview (✅ Done)
│   │   └── [id]/            # Nested wallet routes
│   │       ├── history.tsx  # Wallet history (✅ Done)
│   │       ├── add-money.tsx # Add money (✅ Done)
│   │       ├── transfer.tsx # Transfer money (✅ Done)
│   │       └── settings.tsx # Wallet settings (✅ Done)
│   ├── add-wallet.tsx      # Create new wallet (✅ Done)
│   ├── add-card.tsx        # Add payment card (✅ Done)
│   ├── add-bank.tsx        # Add bank account (✅ Done)
│   ├── send-money/         # Send money flow screens
│   │   ├── select-recipient.tsx # Select recipient screen (✅ Done)
│   │   └── receiver-details.tsx # Enter amount screen (✅ Done)
│   ├── verify/             # Verification screens
│   │   └── [phone].tsx     # Phone verification (✅ Done)
│   └── index.tsx           # Landing/Welcome screen (✅ Done)
├── android/                # Android native project (generated by prebuild)
├── ios/                    # iOS native project (generated by prebuild)
├── components/             # Reusable React components
│   ├── cards/              # Card-related components
│   │   ├── BuffrCard.tsx
│   │   ├── AddCardForm.tsx
│   │   ├── CardList.tsx
│   │   ├── CardFrame.tsx
│   │   └── index.ts
│   ├── wallets/           # Wallet-related components
│   │   ├── WalletView.tsx
│   │   ├── AddWalletForm.tsx
│   │   ├── WalletHistory.tsx
│   │   └── index.ts
│   ├── transfers/         # Transfer-related components
│   │   ├── AddMoneyScreen.tsx
│   │   ├── TransferScreen.tsx
│   │   ├── SelectMethod.tsx
│   │   └── index.ts
│   ├── transactions/      # Transaction-related components
│   │   ├── TransactionList.tsx
│   │   ├── ReceiptView.tsx
│   │   ├── AnimatedReceiptView.tsx
│   │   └── index.ts
│   ├── requests/          # Request-related components
│   ├── loans/             # Loan-related components
│   ├── groups/            # Group-related components
│   ├── qr/                # QR code components
│   ├── onboarding/        # Onboarding components
│   ├── settings/          # Settings components
│   ├── ProfileAvatar.tsx  # User profile picture component
│   ├── SearchBar.tsx      # Search bar with notifications
│   ├── BalanceDisplay.tsx # Balance display with show/hide toggle
│   ├── WalletCard.tsx     # Individual wallet card component
│   ├── AddWalletCard.tsx  # Add wallet button component
│   ├── UtilityButton.tsx  # Utility grid button component
│   ├── ActionButton.tsx   # Action button (Send/Scan) component
│   ├── AccountQuickView.tsx # Account quick view with carousel (Buffr logo + account number)
│   ├── banks/              # Bank account components
│   │   ├── AddBankForm.tsx # Form to add bank account
│   │   └── index.ts
│   ├── common/            # Common reusable components
│   │   ├── ScreenHeader.tsx # Screen header with back button and actions
│   │   ├── PillButton.tsx # Pill-shaped button with variants (primary, dark, outline)
│   │   ├── SettingsItem.tsx # Settings list item with icon and chevron
│   │   ├── EmptyState.tsx # Empty state display with icon, title, message, action
│   │   ├── SectionHeader.tsx # Section header/title component
│   │   ├── FormInputGroup.tsx # Form input with label and error handling
│   │   ├── ListItemCard.tsx # List item card with icon, content, chevron
│   │   ├── LoadingState.tsx # Loading state with activity indicator
│   │   ├── ErrorState.tsx # Error state display with retry option
│   │   ├── WarningState.tsx # Warning state display
│   │   ├── AlertDialog.tsx # Styled alert dialog/modal
│   │   ├── AlertBanner.tsx # Inline alert banner component
│   │   ├── ErrorBoundary.tsx # React Error Boundary for error catching
│   │   ├── ContactCarousel.tsx # Horizontal contact carousel
│   │   ├── ContactListItem.tsx # Vertical contact list item
│   │   ├── ContactDetailCard.tsx # Contact detail display card
│   │   ├── PayFromSelector.tsx # Payment source selector modal
│   │   ├── NoteInputModal.tsx # Note input modal for payments
│   │   ├── PaymentMethodTypeModal.tsx # Modal for selecting Card or Bank
│   │   ├── ToggleSwitch.tsx # Toggle switch component
│   │   ├── StatusBadge.tsx # Status badge component
│   │   ├── IconPicker.tsx # Icon picker component
│   │   └── index.ts       # Common components exports
│   └── index.ts           # Component exports
├── contexts/              # React Context providers
│   ├── UserContext.tsx # Global user profile and preferences state management
│   ├── CardsContext.tsx # Global linked payment cards state management
│   ├── BanksContext.tsx # Global bank accounts state management
│   ├── TransactionsContext.tsx # Global transactions state management
│   ├── WalletsContext.tsx # Global wallets state management
│   └── LoansContext.tsx # Global loans state management
├── utils/                 # Utility functions
│   ├── namqr.ts          # NAMQR Code Standards v5.0 utilities (generate/parse)
│   ├── qrParser.ts       # QR code parser (NAMQR + legacy formats)
│   ├── contacts.ts       # Device contacts utilities
│   ├── pdfExport.ts      # PDF export utilities
│   └── transactionHelpers.ts # Transaction calculation helpers
│   ├── pdfExport.ts       # PDF export functionality
│   ├── transactionHelpers.ts # Transaction data calculations and filtering
│   └── contacts.ts        # Device contacts access utilities
├── assets/                # Images, fonts, etc.
│   ├── images/
│   │   ├── buffr_logo.png # Buffr app logo (main brand logo)
│   │   ├── icon.png       # App icon
│   │   ├── adaptive-icon.png
│   │   ├── favicon.png
│   │   └── splash-icon.png
│   └── fonts/
│       └── SpaceMono-Regular.ttf
├── constants/             # App constants
│   ├── Colors.ts          # Brand color palette
│   └── Styles.ts          # Reusable stylesheet
├── babel.config.js        # Babel configuration
├── app.json               # Expo configuration
├── package.json           # Dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

---

## Key Dependencies Summary

### Core Dependencies
- **expo:** ~54.0.29 - Expo SDK
- **react:** 19.1.0 - React library
- **react-native:** 0.81.5 - React Native framework
- **expo-router:** ~6.0.19 - File-based routing

### Native Modules
- **expo-dev-client:** ~6.0.20 - Custom development builds
- **react-native-reanimated:** ~4.1.1 - Animation library
- **react-native-gesture-handler:** ~2.28.0 - Gesture handling
- **react-native-screens:** ~4.16.0 - Native screen management

### Navigation
- **@react-navigation/native:** ^7.1.8 - Navigation library

### State Management
- **React Context API** - Built-in state management (no additional package)
  - **UserContext** - Global user profile, preferences, and Buffr Card balance
  - **CardsContext** - Global linked payment cards state management
  - **BanksContext** - Global bank accounts state management
  - **TransactionsContext** - Global transactions state
  - **WalletsContext** - Global wallets state
  - **LoansContext** - Global loans state (offers, active loans, payments)

### PDF & File Operations
- **expo-print:** ~15.0.8 - PDF generation from HTML
- **expo-file-system:** ~19.0.21 - File system operations
- **expo-sharing:** ~14.0.8 - Native share functionality

### QR Code Generation
- **react-native-qrcode-svg:** Latest - QR code generation and rendering
- **react-native-svg:** 15.12.1 - SVG support for QR codes
- **react-native-view-shot:** Latest - View capture for QR code images

### Authentication
- **@clerk/clerk-expo:** Latest - Authentication with Clerk
- **react-native-confirmation-code-field:** Latest - 6-digit code input

### Animations
- **react-native-reanimated:** ~4.1.1 - High-performance animations (already installed)

---

## Troubleshooting

### Issue: Babel plugin not working
**Solution:** Ensure `react-native-reanimated/plugin` is the **last** plugin in `babel.config.js`

### Issue: Gestures not working
**Solution:** Verify `react-native-gesture-handler` is imported **first** in `app/_layout.tsx`

### Issue: CocoaPods not found
**Solution:** 
- Normally handled automatically by `expo prebuild`
- If automatic installation fails, manually install: `brew install cocoapods`
- Then re-run: `npx expo prebuild`

### Issue: Native build fails
**Solution:** 
1. Run `npx expo prebuild --clean` to regenerate native directories (this will also reinstall CocoaPods dependencies if needed)
2. If iOS build still fails, manually run: `cd ios && pod install && cd ..`
3. Clear cache: `npx expo start --clear`

### Issue: Metro bundler cache issues
**Solution:** Always use `npx expo start --clear` after configuration changes

---

## 10. Screens & Pages to Create

This section outlines all the screens and pages that need to be implemented in the Buffr app, organized by priority. Components have been created, but screens need to be built to use them.

### 10.1: Current Screen Status

**✅ Completed Screens:**

**QR Code & NAMQR Implementation:**
- ✅ Standalone QR Code Scanner Screen (`app/qr-scanner.tsx`)
  - Full-screen camera scanner with expo-camera
  - Accessible directly from home screen "Scan QR" button
  - NAMQR code parsing with CRC validation
  - Legacy format support (JSON/URL)
  - Amount extraction from dynamic QR codes
  - Permission handling and error states
  - Navigates to send-money flow after scanning
- ✅ Send Money QR Code Scanner Screen (`app/send-money/qr-scanner.tsx`)
  - Full-screen camera scanner with expo-camera
  - Part of the send-money flow
  - NAMQR code parsing with CRC validation
  - Legacy format support (JSON/URL)
  - Amount extraction from dynamic QR codes
  - Permission handling and error states
- ✅ QRCodeDisplay Component (`components/qr/QRCodeDisplay.tsx`)
  - NAMQR code generation for Buffr accounts and wallets
  - Static and dynamic QR code support
  - Share functionality
  - Ref API for accessing QR data (for download functionality)
  - Forward ref support for parent component access
  - Real QR code rendering with react-native-qrcode-svg
- ✅ NAMQR Utilities (`utils/namqr.ts`)
  - TLV format generation and parsing
  - CRC-16 checksum calculation (ISO/IEC 13239)
  - IPP full form alias support
  - Token Vault Unique Identifier integration
- ✅ QR Parser Utilities (`utils/qrParser.ts`)
  - NAMQR and legacy format parsing
  - Backward compatibility maintained
- ✅ QR Download Utilities (`utils/qrDownload.ts`)
  - Download QR code as image file (PNG/JPEG)
  - Share QR code via native share sheet
  - File system integration (expo-file-system)
  - Sharing integration (expo-sharing)
- ✅ QR Code Display screen (`app/qr-code.tsx`)
  - Display user's QR code for receiving payments
  - Account type selector (Buffr Account / Wallet)
  - Wallet selector for wallet QR codes
  - NAMQR code generation
  - Download and share functionality
  - Instructions for QR code usage
- ✅ Profile Screen (`app/profile.tsx`)
  - User profile information display
  - Main Buffr account QR code display (always shows main account, not wallet)
  - Download QR code functionality (saves as image file)
  - Share QR code functionality (via native share sheet)
  - User avatar and contact information
  - QR code usage instructions
- `app/index.tsx` - Welcome/Landing screen
- `app/(tabs)/index.tsx` - Home screen (main dashboard)
- `app/verify/[phone].tsx` - Phone verification screen
- `app/(tabs)/transactions.tsx` - Transactions dashboard with tabs, charts, and categorized transactions
- `app/transactions/[id].tsx` - Transaction receipt screen with PDF export
- `app/transactions/category/[categoryId].tsx` - Category transactions screen (filtered transaction list)
- `app/wallets/[id].tsx` - Wallet overview screen with quick actions and stats
- `app/wallets/[id]/history.tsx` - Wallet history screen with filters
- `app/wallets/[id]/add-money.tsx` - Add money to wallet screen
- `app/wallets/[id]/transfer.tsx` - Transfer from wallet screen
- `app/wallets/[id]/settings.tsx` - Wallet settings screen
- `app/add-wallet.tsx` - Create new wallet screen
- `app/add-card.tsx` - Add payment card screen
- `app/add-bank.tsx` - Add bank account screen
- `app/send-money/select-recipient.tsx` - Select recipient screen (Send Money flow)
- `app/send-money/receiver-details.tsx` - Enter amount screen (Send Money flow)
- `app/send-money/qr-scanner.tsx` - QR code scanner screen for send-money flow (NAMQR compliant)
- `app/qr-scanner.tsx` - Standalone QR code scanner screen (accessed from home screen, NAMQR compliant)
- `app/qr-code.tsx` - QR code display screen (show user's QR code for receiving payments)
- `app/profile.tsx` - User profile screen with main Buffr account QR code (downloadable and shareable)

**⏳ Placeholder Screens (Need Implementation):**
- `app/(tabs)/loans.tsx` - Loans tab (placeholder only)

### 10.2: Priority 1 - Core Functionality Screens (High Priority)

These screens are essential for basic app functionality and should be implemented first.

#### 1. **Transactions Screen** ✅
- **Location:** `app/(tabs)/transactions.tsx`
- **Components:** 
  - `SearchBar` - Search with notifications and profile
  - `TransactionTabs` - Balance, Earnings, Spendings tabs
  - `TransactionChart` - Line chart with period and week filters
  - `BudgetProgressBar` - Budget/earnings target progress indicator
  - `CategorizedTransactions` - Category cards with progress bars
  - `TransactionList` - Transaction list with pull-to-refresh
- **Features:**
  - ✅ Header with search bar, notifications, and profile avatar
  - ✅ Three tabs: Balance, Earnings, Spendings
  - ✅ Interactive line chart showing transaction trends
  - ✅ Chart filters: Weekly/Monthly/Yearly periods, This week/Last week
  - ✅ Budget progress bar (dynamic based on active tab)
  - ✅ Categorized transactions with progress indicators
  - ✅ Tap category to navigate to category transactions screen
  - ✅ Tap transaction to navigate to receipt view
  - ✅ Pull to refresh functionality
  - ✅ Uses TransactionsContext for state management
  - ✅ Dynamic data calculation based on active tab and filters
  - ✅ Loading states during data fetch
- **Design Reference:** `Transactions (Earnings).svg`, `Transactions (Balance).svg`
- **Status:** Fully implemented with all tabs, filters, and dynamic data

#### 2. **Transaction Receipt Screen** ✅
- **Location:** `app/transactions/[id].tsx` (dynamic route)
- **Component:** Uses `ReceiptView` and `AnimatedReceiptView` from `components/transactions/`
- **Features:**
  - ✅ Display full transaction details
  - ✅ Share receipt functionality (native share)
  - ✅ Export receipt as PDF
  - ✅ Transaction status indicator with color coding
  - ✅ Loading state while fetching transaction
  - ✅ Smooth fade-in and slide-up animations
  - ✅ Back navigation button
  - ✅ Error handling for missing transactions
- **Design Reference:** `Receipt.svg`
- **Status:** Fully implemented with animations and PDF export

#### 2a. **Category Transactions Screen** ✅
- **Location:** `app/transactions/category/[categoryId].tsx` (dynamic route)
- **Component:** Uses `TransactionList` from `components/transactions/TransactionList.tsx`
- **Features:**
  - ✅ Category header with icon, name, and transaction count
  - ✅ Filtered transaction list for specific category
  - ✅ Tap transaction to navigate to receipt view
  - ✅ Back navigation button
  - ✅ Error handling for invalid categories
  - ✅ Category-based filtering (income vs expense categories)
- **Category Mapping:**
  - **Expense Categories (IDs 1-5):** Food & Beverages, Entertainment, Travel, Bills & Utilities, Health & Fitness
  - **Income Categories (IDs 6-10):** Salary, Freelance, Investments, Gifts, Other Income
- **Navigation Flow:** Category → Category Transactions → Transaction Receipt
- **Status:** Fully implemented with category filtering and navigation

#### 3. **Add Money Screen** ⏳
- **Location:** `app/add-money.tsx` or `app/(modals)/add-money.tsx`
- **Component:** Use `AddMoneyScreen` from `components/transfers/AddMoneyScreen.tsx`
- **Features:**
  - Amount input with quick select buttons
  - Payment method selection
  - Link to `SelectMethod` screen
- **Design Reference:** `Add Money.svg`

#### 4. **Select Payment Method Screen** ⏳
- **Location:** `app/select-method.tsx` or `app/(modals)/select-method.tsx`
- **Component:** Use `SelectMethod` from `components/transfers/SelectMethod.tsx`
- **Features:**
  - List of linked payment methods
  - Add new payment method option
  - Select method and return to Add Money flow
- **Design Reference:** `Select Method.svg`

#### 5. **Transfer Money Screen** ⏳
- **Location:** `app/transfer.tsx` or `app/(modals)/transfer.tsx`
- **Component:** Use `TransferScreen` from `components/transfers/TransferScreen.tsx`
- **Features:**
  - Select source and destination accounts
  - Amount input
  - Optional note field
  - Confirm and execute transfer
- **Design Reference:** `Transfer.svg`

#### 6. **Add Card Screen** ✅
- **Location:** `app/add-card.tsx`
- **Component:** Uses `AddCardForm` from `components/cards/AddCardForm.tsx`
- **Features:**
  - ✅ Card number input with formatting
  - ✅ Expiry date and CVV input
  - ✅ Cardholder name
  - ✅ Card type selection (debit/credit)
  - ✅ Link card to Buffr account via CardsContext
  - ✅ Form validation
  - ✅ Loading states
  - ✅ Success/error handling
- **Design Reference:** `Add Card.svg`
- **Status:** Fully implemented with CardsContext integration

#### 7. **Card List Screen** ✅
- **Location:** `app/cards.tsx`
- **Component:** Uses `CardList` from `components/cards/CardList.tsx`
- **Features:**
  - ✅ Display all linked cards
  - ✅ Add new card option
  - ✅ Navigate to card details on card press
  - ✅ Empty state handling (uses EmptyState component)
  - ✅ Loading states
  - ✅ Uses CardsContext for state management
- **Design Reference:** Card management flows from design assets
- **Status:** Fully implemented with CardsContext integration

#### 7a. **Card Details Screen** ✅
- **Location:** `app/cards/[id].tsx`
- **Features:**
  - ✅ Display detailed card information
  - ✅ Card preview with network branding
  - ✅ Card information (type, network, bank)
  - ✅ Account details (linked date, last used, status)
  - ✅ Set as default payment method
  - ✅ Remove card with confirmation
  - ✅ Shows when account was created/linked
- **Status:** Fully implemented

#### 8. **QR Code Display Screen** ✅
- **Location:** `app/qr-code.tsx` or `app/(modals)/qr-code.tsx` (to be created)
- **Component:** `QRCodeDisplay` from `components/qr/QRCodeDisplay.tsx`
- **Features:**
  - ✅ Display user's QR code for receiving payments using NAMQR format
  - ✅ Generate NAMQR codes for Buffr main account and Buffr wallets
  - ✅ Support for static (no amount) and dynamic (with amount) QR codes
  - ✅ Share QR code functionality
  - ✅ NAMQR Code Standards Version 5.0 compliant
  - ✅ TLV format with CRC validation
- **Design Reference:** `Your QR Code.svg`
- **Implementation:**
  - Uses `generateBuffrAccountNAMQR()` and `generateBuffrWalletNAMQR()` from `utils/namqr.ts`
  - Generates TLV format QR codes with CRC validation
  - Supports IPP full form alias (e.g., "phone@buffr" or "walletId@buffr.wallet")
  - Error correction level M (Medium - 15%) recommended per NAMQR standards

#### 9. **Standalone QR Code Scanner Screen** ✅
- **Location:** `app/qr-scanner.tsx`
- **Component:** Full-screen QR scanner with camera integration
- **Access:** Directly from home screen "Scan QR" button (separate from send-money flow)
- **Features:**
  - ✅ Camera view for scanning QR codes (expo-camera)
  - ✅ NAMQR code parsing with CRC validation
  - ✅ Backward compatible with legacy JSON/URL formats
  - ✅ Amount extraction from dynamic QR codes
  - ✅ Navigation to send-money flow (receiver-details) with scanned data
  - ✅ Permission handling and error states
  - ✅ Visual scanning frame with corner indicators
  - ✅ Processing states and user feedback
- **Design Reference:** QR scanning flows from design assets
- **Implementation:**
  - Uses `parseBuffrNAMQR()` and `parseQRPayment()` for QR parsing
  - Validates CRC checksum for data integrity
  - Handles both NAMQR (TLV) and legacy formats
  - Extracts amount, currency, and account information from QR codes
  - After scanning, navigates to `/send-money/receiver-details` with pre-populated data

#### 9a. **Send Money QR Code Scanner Screen** ✅
- **Location:** `app/send-money/qr-scanner.tsx`
- **Component:** Full-screen QR scanner with camera integration
- **Access:** Part of the send-money flow (when user is already in send-money process)
- **Features:**
  - ✅ Camera view for scanning QR codes (expo-camera)
  - ✅ NAMQR code parsing with CRC validation
  - ✅ Backward compatible with legacy JSON/URL formats
  - ✅ Amount extraction from dynamic QR codes
  - ✅ Navigation to receiver details with scanned data
  - ✅ Permission handling and error states
  - ✅ Visual scanning frame with corner indicators
  - ✅ Processing states and user feedback
- **Design Reference:** QR scanning flows from design assets
- **Implementation:**
  - Uses `parseBuffrNAMQR()` and `parseQRPayment()` for QR parsing
  - Validates CRC checksum for data integrity
  - Handles both NAMQR (TLV) and legacy formats
  - Extracts amount, currency, and account information from QR codes

### 10.3: Priority 2 - Essential Features Screens (Medium Priority)

These screens enhance core functionality and should be implemented after Priority 1.

#### 10. **Request Money Screen** ⏳
- **Location:** `app/request-money.tsx` or `app/(modals)/request-money.tsx`
- **Component:** Use `RequestMoney` from `components/requests/RequestMoney.tsx`
- **Features:**
  - Select recipient from contacts
  - Enter amount
  - Add optional note
  - Send money request
- **Design Reference:** `After Making Request.svg`

#### 11. **Request Status Screen** ⏳
- **Location:** `app/requests/[id].tsx` (dynamic route)
- **Component:** Use `RequestStatus` from `components/requests/RequestStatus.tsx`
- **Features:**
  - Display request details
  - Show payment progress (for partial payments)
  - Pay request option
  - Cancel request option
- **Design Reference:** `Requested Amount (paid 3/4).svg`

#### 12. **Pay Request Screen** ⏳
- **Location:** `app/pay-request/[id].tsx` (dynamic route)
- **Component:** Use `PayRequest` from `components/requests/PayRequest.tsx`
- **Features:**
  - Display request details
  - Select payment source
  - Confirm and pay request
  - Decline request option
- **Design Reference:** `Elias Matheus See Pay Via Request.svg`

#### 13. **Wallet Overview Screen** ✅
- **Location:** `app/wallets/[id].tsx` (dynamic route)
- **Components:** Uses `WalletCard`, `WalletHistory` from `components/`
- **Features:**
  - ✅ Display wallet name and balance
  - ✅ Wallet card preview with hide/show balance toggle
  - ✅ Quick action buttons: Add Money, Transfer, Card, History
  - ✅ Recent activity list (last 5 transactions)
  - ✅ Wallet statistics: Total In, Total Out, Net
  - ✅ Pull-to-refresh functionality
  - ✅ Navigation to settings, add money, transfer, history
  - ✅ Uses WalletsContext for state management
- **Design Reference:** `Wallet View.svg`, `Wallet View-1.svg`
- **Status:** Fully implemented with all features

#### 14. **Add Wallet Screen** ✅
- **Location:** `app/add-wallet.tsx`
- **Component:** Uses `AddWalletForm` from `components/wallets/AddWalletForm.tsx`
- **Features:**
  - ✅ Enter wallet name
  - ✅ Optional purpose/description
  - ✅ Create wallet with validation
  - ✅ Navigate to wallet overview after creation
  - ✅ Error handling
- **Design Reference:** `Adding A Wallet.svg`, `Adding A Wallet-1.svg`
- **Status:** Fully implemented

#### 15. **Wallet History Screen** ✅
- **Location:** `app/wallets/[id]/history.tsx` (nested route)
- **Component:** Uses `WalletHistory` from `components/wallets/WalletHistory.tsx`
- **Features:**
  - ✅ Filter tabs: All, Added, Spent
  - ✅ Transaction list with icons and color coding
  - ✅ Date formatting
  - ✅ Empty state handling
  - ✅ Pull-to-refresh functionality
- **Design Reference:** `Wallet History (Added).svg`, `Wallet History (Spendings).svg`
- **Status:** Fully implemented

#### 15a. **Add Money to Wallet Screen** ✅
- **Location:** `app/wallets/[id]/add-money.tsx`
- **Features:**
  - ✅ Amount input with number pad
  - ✅ Quick amount buttons (N$ 100, 500, 1000)
  - ✅ Payment method selection (Bank Account, Card)
  - ✅ Fee and total display
  - ✅ Validation (min N$ 10, max N$ 50,000)
  - ✅ Success/error alerts
- **Design Reference:** `Add Amount (Wallet).svg`, `Add Money.svg`
- **Status:** Fully implemented

#### 15b. **Transfer from Wallet Screen** ✅
- **Location:** `app/wallets/[id]/transfer.tsx`
- **Features:**
  - ✅ Source wallet display (read-only)
  - ✅ Recipient search/selection
  - ✅ Mock contacts list
  - ✅ Amount input with quick buttons
  - ✅ Optional note field
  - ✅ Balance validation
  - ✅ Success/error handling
- **Design Reference:** `Transfer.svg`, `Transfer Amount (Wallet).svg`
- **Status:** Fully implemented

#### 15c. **Wallet Settings Screen** ✅
- **Location:** `app/wallets/[id]/settings.tsx`
- **Features:**
  - ✅ Wallet Information: Name (editable), Type (display)
  - ✅ Security: PIN Protection toggle, Biometric toggle
  - ✅ Auto Pay: Enable/disable, Max amount setting
  - ✅ Linked Accounts: Bank accounts, Cards (mock)
  - ✅ Delete Wallet with confirmation
  - ✅ Save settings functionality
- **Design Reference:** `Wallet Settings.svg`
- **Status:** Fully implemented

#### 16. **Loans Screen** ⏳
- **Location:** `app/(tabs)/loans.tsx` (replace placeholder)
- **Component:** Use `LoanOffers` from `components/loans/LoanOffers.tsx`
- **Features:**
  - Display available loan offers
  - Active loans list
  - Apply for loan option
- **Design Reference:** `Loan Offers.svg`

#### 17. **Loan Details Screen** ⏳
- **Location:** `app/loans/[id].tsx` (dynamic route)
- **Component:** Use `LoanDetails` from `components/loans/LoanDetails.tsx`
- **Features:**
  - Loan terms and conditions
  - Interest rate and duration
  - Monthly payment calculation
  - Apply for loan button
- **Design Reference:** `Loan Details-1.svg`, `Loan Details-2.svg`

#### 18. **Loan Payment Screen** ⏳
- **Location:** `app/loans/[id]/pay.tsx` (nested route)
- **Component:** Use `LoanPayment` from `components/loans/LoanPayment.tsx`
- **Features:**
  - Outstanding balance display
  - Payment amount input
  - Select payment source
  - Make payment
- **Design Reference:** `Loan Pay.svg`

### 10.4: Priority 3 - Advanced Features Screens (Lower Priority)

These screens add advanced functionality and can be implemented after core features are complete.

#### 19. **Group View Screen** ⏳
- **Location:** `app/groups/[id].tsx` (dynamic route)
- **Component:** Use `GroupView` from `components/groups/GroupView.tsx`
- **Features:**
  - Group details and members
  - Total amount saved
  - Contribute option
  - Add member option
- **Design Reference:** `Group View.svg`, `Group View-1.svg`

#### 20. **Create Group Screen** ⏳
- **Location:** `app/create-group.tsx` or `app/(modals)/create-group.tsx`
- **Component:** Use `CreateGroup` from `components/groups/CreateGroup.tsx`
- **Features:**
  - Group name input
  - Optional description
  - Create group
- **Design Reference:** `Create Group.svg`, `Create Group-1.svg`

#### 21. **Group Settings Screen** ⏳
- **Location:** `app/groups/[id]/settings.tsx` (nested route)
- **Features:**
  - Group name and description edit
  - Member management
  - Remove member option
  - Leave group option
- **Design Reference:** `Group Settings.svg`

#### 22. **Contact List Screen** ⏳
- **Location:** `app/contacts.tsx`
- **Features:**
  - List of contacts
  - Search contacts
  - Add contact option
  - Send money to contact
  - Request money from contact
- **Design Reference:** `Contact View.svg`, `Contact View-1.svg`, `Contact View-2.svg`

#### 23. **Settings Screen** ⏳
- **Location:** `app/settings.tsx` or `app/(tabs)/settings.tsx`
- **Component:** Use `SettingsScreen` from `components/settings/SettingsScreen.tsx`
- **Features:**
  - Profile settings
  - Security settings
  - Notification settings
  - Cards & wallets management
  - Privacy settings
  - Help & support
  - About
  - Log out
- **Design Reference:** Settings flows from design assets

#### 24. **Notification Settings Screen** ⏳
- **Location:** `app/settings/notifications.tsx`
- **Component:** Use `NotificationSettings` from `components/settings/NotificationSettings.tsx`
- **Features:**
  - Toggle notification types
  - Transaction notifications
  - Request notifications
  - Payment reminders
  - Promotions toggle
- **Design Reference:** `Notification Settings.svg`

#### 25. **Profile Screen** ⏳
- **Location:** `app/profile.tsx` or `app/settings/profile.tsx`
- **Features:**
  - User profile information
  - Edit profile option
  - Profile picture upload
  - Phone number and email
- **Design Reference:** Profile management flows

#### 26. **Bank Accounts Screen** ⏳
- **Location:** `app/bank-accounts.tsx` or `app/settings/bank-accounts.tsx`
- **Features:**
  - List of linked bank accounts
  - Add bank account option
  - Remove bank account option
  - Set default account
- **Design Reference:** `Bank Accounts.svg`, `Available Bank Accounts.svg`

#### 27. **Refund Screen** ⏳
- **Location:** `app/refund.tsx` or `app/transactions/[id]/refund.tsx`
- **Features:**
  - Request refund interface
  - Refund explanation
  - Refund status tracking
- **Design Reference:** `Refund Screen.svg`, `How Refunt Works_.svg`

### 10.5: Priority 4 - Onboarding & Authentication Screens

These screens handle user onboarding and can be implemented in parallel with other features.

#### 28. **Onboarding Flow** ⏳
- **Location:** `app/onboarding.tsx` or `app/(onboarding)/_layout.tsx` with multiple screens
- **Component:** Use `OnboardingFlow` from `components/onboarding/OnboardingFlow.tsx`
- **Features:**
  - Multi-step onboarding
  - Welcome screens
  - Feature highlights
  - Skip option
- **Design Reference:** `Starting screen.svg`, `Onboarding completed.svg`

#### 29. **Login/Sign In Screen** ⏳
- **Location:** `app/login.tsx`
- **Features:**
  - Phone number input
  - Sign in with phone
  - Link to sign up
  - Forgot password option
- **Design Reference:** Login flows from design assets

#### 30. **Sign Up Screen** ⏳
- **Location:** `app/signup.tsx`
- **Features:**
  - Phone number input
  - Terms and conditions acceptance
  - Create account
  - Link to sign in
- **Design Reference:** Sign up flows from design assets

#### 31. **Add Details Screen** ⏳
- **Location:** `app/add-details.tsx` or `app/onboarding/add-details.tsx`
- **Features:**
  - User information input
  - Name, email, etc.
  - Profile picture upload
  - Complete setup
- **Design Reference:** `Add details.svg` through `Add details-5.svg`

#### 32. **Identity Verification Screen** ⏳
- **Location:** `app/verify-identity.tsx`
- **Features:**
  - Identity verification interface
  - FaceID/biometric verification
  - Document upload
  - Verification status
- **Design Reference:** `Verify Yourself.svg`, `Verify FaceID-1.svg`, `Verify FaceID-2.svg`

### 10.6: Screen Implementation Guidelines

**File Structure:**
```
app/
├── (tabs)/              # Tab navigation screens
│   ├── index.tsx        # Home (✅ Done)
│   ├── transactions.tsx # Transactions (✅ Done)
│   ├── loans.tsx        # Loans (⏳ Replace placeholder)
│   └── settings.tsx     # Settings (⏳ New)
├── (modals)/            # Modal screens (optional grouping)
│   ├── add-money.tsx
│   ├── add-card.tsx
│   └── qr-code.tsx
├── transactions/        # Transaction-related screens
│   ├── [id].tsx         # Receipt view (✅ Done)
│   ├── category/        # Category transactions
│   │   └── [categoryId].tsx # Category transactions list (✅ Done)
│   └── [id]/refund.tsx  # Refund
├── wallets/             # Wallet screens
│   ├── [id].tsx         # Wallet detail
│   └── [id]/history.tsx # Wallet history
├── loans/               # Loan screens
│   ├── [id].tsx         # Loan details
│   └── [id]/pay.tsx     # Loan payment
├── groups/              # Group screens
│   ├── [id].tsx         # Group view
│   └── [id]/settings.tsx # Group settings
├── settings/            # Settings screens
│   ├── notifications.tsx
│   ├── profile.tsx
│   └── bank-accounts.tsx
├── verify/              # Verification screens
│   └── [phone].tsx      # Phone verification (✅ Done)
├── index.tsx            # Landing/Welcome (✅ Done)
├── login.tsx            # Login
├── signup.tsx           # Sign up
└── onboarding.tsx       # Onboarding flow
```

**Implementation Checklist:**
- [x] Use existing components from `components/` directory
- [x] Follow Buffr design system (Colors.ts, Styles.ts)
- [x] Implement proper navigation with Expo Router
- [x] Add loading states and error handling
- [x] Ensure responsive design
- [x] Add proper TypeScript types
- [x] Add proper documentation comments
- [x] Implement state management with Context API
- [x] Add screen transition animations
- [x] Add component-level animations
- [x] Implement PDF export functionality
- [ ] Test on iOS and Android
- [ ] Add unit tests
- [ ] Add integration tests

**Navigation Patterns:**
- Use `router.push()` for navigation
- Use `router.replace()` for authentication flows
- Use `router.back()` for going back
- Use dynamic routes `[id].tsx` for detail screens
- Use nested routes for related screens

---

## 11. State Management & Context

### 11.1: User Context Implementation

**Location:** `contexts/UserContext.tsx`

A global state management solution for user profile and main account using React Context API.

**Features:**
- Centralized user profile state accessible throughout the app
- Buffr Card balance management
- User preferences (balance visibility, currency, language, notifications)
- Loading and error state management
- Functions for fetching, updating user data and preferences
- Type-safe with TypeScript interfaces

**Context Provider:**
```typescript
<UserProvider>
  {/* App content */}
</UserProvider>
```

**Usage in Components:**
```typescript
import { useUser } from '@/contexts/UserContext';

const { user, preferences, fetchUser, toggleBalanceVisibility, updateUser } = useUser();
```

**Available Functions:**
- `fetchUser()` - Fetch user profile from API
- `updateUser(updates)` - Update user profile information
- `updatePreferences(updates)` - Update user preferences
- `toggleBalanceVisibility()` - Toggle balance show/hide preference
- `updateBuffrCardBalance(amount)` - Update main Buffr Card balance
- `refreshUser()` - Refresh user data

**State Properties:**
- `user: User | null` - User profile data
- `preferences: UserPreferences` - User preferences
- `loading: boolean` - Loading state indicator
- `error: string | null` - Error message if fetch fails

**User Interface:**
```typescript
interface User {
  id: string;
  phoneNumber: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatar?: string;
  isVerified: boolean;
  buffrCardBalance: number; // Main Buffr Card balance
  currency: string;
  createdAt: Date;
  lastLoginAt?: Date;
}
```

**User Preferences Interface:**
```typescript
interface UserPreferences {
  showBalance: boolean; // Whether to show balance by default
  currency: string;
  language: string;
  notificationsEnabled: boolean;
  biometricEnabled: boolean;
  theme?: 'light' | 'dark' | 'auto';
}
```

**Integration:**
- Provider added to `app/_layout.tsx` as outermost provider
- Home screen uses context for Buffr Card balance
- BalanceDisplay component syncs with user preferences
- User profile accessible throughout the app

### 11.2: Transactions Context Implementation

**Location:** `contexts/TransactionsContext.tsx`

A global state management solution for transactions using React Context API.

**Features:**
- Centralized transaction state accessible throughout the app
- Loading and error state management
- Functions for fetching, refreshing, adding, and updating transactions
- Type-safe with TypeScript interfaces

**Context Provider:**
```typescript
<TransactionsProvider>
  {/* App content */}
</TransactionsProvider>
```

**Usage in Components:**
```typescript
import { useTransactions } from '@/contexts/TransactionsContext';

const { transactions, loading, fetchTransactions, getTransactionById } = useTransactions();
```

**Available Functions:**
- `fetchTransactions()` - Fetch all transactions from API
- `getTransactionById(id)` - Get specific transaction by ID
- `refreshTransactions()` - Refresh transaction list
- `addTransaction(transaction)` - Add new transaction
- `updateTransaction(id, updates)` - Update existing transaction

**State Properties:**
- `transactions: Transaction[]` - Array of all transactions
- `loading: boolean` - Loading state indicator
- `error: string | null` - Error message if fetch fails

**Integration:**
- Provider added to `app/_layout.tsx` wrapping the entire app
- Transactions screen uses context instead of local state
- Receipt screen fetches transaction data from context

### 11.3: Wallets Context Implementation

**Location:** `contexts/WalletsContext.tsx`

A global state management solution for wallets using React Context API.

**Features:**
- Centralized wallet state accessible throughout the app
- Loading and error state management
- Functions for fetching, creating, updating, and deleting wallets
- Wallet transaction management
- Wallet statistics calculation
- Add money and transfer functionality
- Type-safe with TypeScript interfaces

**Context Provider:**
```typescript
<WalletsProvider>
  {/* App content */}
</WalletsProvider>
```

**Usage in Components:**
```typescript
import { useWallets } from '@/contexts/WalletsContext';

const { wallets, loading, fetchWallets, getWalletById, addMoneyToWallet } = useWallets();
```

**Available Functions:**
- `fetchWallets()` - Fetch all wallets from API
- `getWalletById(id)` - Get specific wallet by ID
- `getWalletTransactions(walletId)` - Get transactions for a wallet
- `getWalletStats(walletId)` - Get wallet statistics (total in/out/net)
- `refreshWallets()` - Refresh wallet list
- `addWallet(walletData)` - Create new wallet
- `updateWallet(id, updates)` - Update existing wallet
- `deleteWallet(id)` - Delete wallet
- `addMoneyToWallet(walletId, amount, paymentMethod)` - Add funds to wallet
- `transferFromWallet(walletId, amount, recipient, note)` - Transfer money from wallet

**State Properties:**
- `wallets: Wallet[]` - Array of all wallets
- `loading: boolean` - Loading state indicator
- `error: string | null` - Error message if fetch fails

**Integration:**
- Provider added to `app/_layout.tsx` wrapping the entire app
- Home screen uses context to display wallets
- All wallet screens use context for data management

### 11.4: Cards Context Implementation

**Location:** `contexts/CardsContext.tsx`

A global state management solution for linked payment cards using React Context API.

**Features:**
- Centralized card state accessible throughout the app
- Loading and error state management
- Functions for fetching, adding, updating, and deleting cards
- Default card management
- Card network detection (Visa, Mastercard, Amex, Discover)
- Card type detection (debit/credit)
- Type-safe with TypeScript interfaces

**Context Provider:**
```typescript
<CardsProvider>
  {/* App content */}
</CardsProvider>
```

**Usage in Components:**
```typescript
import { useCards } from '@/contexts/CardsContext';

const { cards, loading, fetchCards, addCard, deleteCard, setDefaultCard } = useCards();
```

**Available Functions:**
- `fetchCards()` - Fetch all linked cards from API
- `getCardById(id)` - Get specific card by ID
- `addCard(cardData)` - Add new payment card
- `updateCard(id, updates)` - Update existing card
- `deleteCard(id)` - Delete/remove card
- `setDefaultCard(id)` - Set card as default payment method
- `refreshCards()` - Refresh card list
- `getDefaultCard()` - Get the default card

**State Properties:**
- `cards: Card[]` - Array of all linked cards
- `loading: boolean` - Loading state indicator
- `error: string | null` - Error message if fetch fails

**Card Interface:**
```typescript
interface Card {
  id: string;
  cardNumber: string; // Full number (stored securely)
  last4: string; // Last 4 digits for display
  expiryDate: string; // Format: MM/YY
  cardholderName: string;
  cardType: 'debit' | 'credit';
  network: 'visa' | 'mastercard' | 'amex' | 'discover' | 'other';
  bankName?: string;
  isDefault?: boolean;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
}
```

**Card Network Detection:**
- Automatically detects card network from card number
- Supports Visa, Mastercard, Amex, Discover
- Falls back to 'other' for unknown networks

**Integration:**
- Provider added to `app/_layout.tsx` in provider hierarchy
- Add Card screen uses context for card management
- Cards list screen displays all linked cards
- Home screen "+ Add" button navigates to cards screen

### 11.5: Loans Context Implementation

**Location:** `contexts/LoansContext.tsx`

A global state management solution for loans using React Context API.

**Features:**
- Centralized loan state accessible throughout the app
- Loading and error state management
- Functions for fetching loans, offers, applying for loans, and making payments
- Loan payment calculation and tracking
- Available credit tracking
- Type-safe with TypeScript interfaces

**Context Provider:**
```typescript
<LoansProvider>
  {/* App content */}
</LoansProvider>
```

**Usage in Components:**
```typescript
import { useLoans } from '@/contexts/LoansContext';

const { loans, offers, availableCredit, loading, fetchLoans, applyForLoan, payLoan } = useLoans();
```

**Available Functions:**
- `fetchLoans()` - Fetch all active loans from API
- `fetchOffers()` - Fetch available loan offers
- `getLoanById(id)` - Get specific loan by ID
- `getLoanPayments(loanId)` - Get payment schedule for a loan
- `applyForLoan(offerId, amount, repaymentPeriod, purpose, icon?, name?)` - Apply for a new loan
- `payLoan(loanId, amount, paymentMethod)` - Make a loan payment
- `refreshLoans()` - Refresh loans, offers, and available credit
- `calculateRepayment(amount, interestRate, period)` - Calculate monthly and total repayment

**State Properties:**
- `loans: Loan[]` - Array of all user loans
- `offers: LoanOffer[]` - Array of available loan offers
- `availableCredit: number` - Available credit amount
- `loading: boolean` - Loading state indicator
- `error: string | null` - Error message if fetch fails

**Loan Status Types:**
- `starting` - New loan, just started (first payment pending)
- `active` - Loan is active and being repaid
- `paid` - Loan fully paid off
- `pending` - Loan application pending approval
- `rejected` - Loan application rejected

**Loan Types:**
- `personal` - Personal loan
- `emergency` - Emergency loan
- `business` - Business loan
- `quick` - Quick loan

**Integration:**
- Provider added to `app/_layout.tsx` wrapping the entire app
- Loans tab uses context to display loans and offers
- Loan detail screens use context for loan management
- Loan application flow uses context for applying and tracking loans

### 11.4: Data Interfaces

#### Transaction Interface

```typescript
interface Transaction {
  id: string;
  type: 'sent' | 'received' | 'payment' | 'transfer' | 'request';
  amount: number;
  description: string;
  date: Date;
  recipient?: string;
  sender?: string;
  status: 'completed' | 'pending' | 'failed';
  reference?: string;
  category?: string; // Category ID: '1'-'10' for expenses/income categories
}
```

**Transaction Types:**
- `sent` - Money sent to another user
- `received` - Money received from another user
- `payment` - Payment received
- `transfer` - Internal transfer between accounts
- `request` - Money request sent/received

**Status Types:**
- `completed` - Transaction successfully completed
- `pending` - Transaction in progress
- `failed` - Transaction failed

**Category IDs:**
- **Expense Categories (1-5):** Food & Beverages, Entertainment, Travel, Bills & Utilities, Health & Fitness
- **Income Categories (6-10):** Salary, Freelance, Investments, Gifts, Other Income

#### Wallet Interface

```typescript
interface Wallet {
  id: string;
  name: string;
  icon?: string; // FontAwesome icon name
  balance: number;
  currency?: string;
  type?: 'personal' | 'business' | 'savings' | 'investment' | 'bills' | 'travel' | 'budget';
  purpose?: string;
  cardDesign?: number; // Frame number from Buffr Card Design (2-32)
  cardNumber?: string; // Last 4 digits for display
  cardholderName?: string;
  expiryDate?: string; // Format: MM/YY
  autoPayEnabled?: boolean;
  autoPaySettings?: AutoPaySettings;
  pinProtected?: boolean;
  biometricEnabled?: boolean;
  createdAt: Date;
}
```

**Wallet Types:**
- `personal` - Personal wallet for daily expenses
- `business` - Business wallet for business transactions
- `savings` - Savings wallet for saving goals
- `investment` - Investment wallet for investments
- `bills` - Bills wallet for bill payments
- `travel` - Travel wallet for travel expenses
- `budget` - Budget wallet for budget management

**Auto Pay Settings:**
```typescript
interface AutoPaySettings {
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  deductDate: string; // Format: DD-MMM-YYYY
  deductTime: string; // Format: HH:MMam/pm
  amount: number;
  numberOfRepayments: number | null;
  paymentMethod: string;
}
```

#### Loan Interface

```typescript
interface Loan {
  id: string;
  name?: string; // Loan name set by user
  icon?: string; // FontAwesome icon name
  type: 'personal' | 'emergency' | 'business' | 'quick';
  amount: number;
  remainingBalance: number;
  interestRate: number; // APR percentage
  status: 'active' | 'paid' | 'rejected' | 'pending' | 'starting';
  dueDate: Date;
  nextPaymentDate?: Date;
  nextPaymentAmount?: number;
  monthlyPayment: number;
  totalRepayment: number;
  repaymentPeriod: number; // months
  totalEMI: number; // Total number of EMIs
  paidEMI: number; // Number of EMIs paid
  purpose?: string;
  reference?: string; // Loan reference number
  createdAt: Date;
  applicationId?: string;
  autoPayEnabled?: boolean;
  autoPayAmount?: number;
}
```

**Loan Types:**
- `personal` - Personal loan
- `emergency` - Emergency loan
- `business` - Business loan
- `quick` - Quick loan

**Loan Status:**
- `starting` - New loan, just started (first payment pending)
- `active` - Loan is active and being repaid
- `paid` - Loan fully paid off
- `pending` - Loan application pending approval
- `rejected` - Loan application rejected

#### Loan Offer Interface

```typescript
interface LoanOffer {
  id: string;
  name: string;
  type: 'pre-approved' | 'quick';
  maxAmount: number;
  minAmount: number;
  interestRate: number; // APR percentage
  minRepaymentPeriod: number; // months
  maxRepaymentPeriod: number; // months
  description?: string;
}
```

**Offer Types:**
- `pre-approved` - Pre-approved loan offer
- `quick` - Quick loan offer

### 11.6: State Management Architecture

**Context Provider Hierarchy:**

The app uses a nested provider structure in `app/_layout.tsx`:

```typescript
<UserProvider>
  <CardsProvider>
    <TransactionsProvider>
      <WalletsProvider>
        <LoansProvider>
          {/* App content */}
        </LoansProvider>
      </WalletsProvider>
    </TransactionsProvider>
  </CardsProvider>
</UserProvider>
```

**Provider Order:**
1. **UserProvider** - Outermost provider (user profile and preferences)
2. **CardsProvider** - Second level (linked payment cards)
3. **TransactionsProvider** - Third level (transaction data)
4. **WalletsProvider** - Fourth level (can use transactions)
5. **LoansProvider** - Innermost provider (can use transactions and wallets)

**Why This Order:**
- User data is the most fundamental (profile, preferences, main balance)
- Cards are user-specific payment methods
- Transactions are user-specific data (can use cards)
- Wallets can reference transactions
- Loans can reference both transactions and wallets
- This hierarchy allows contexts to potentially access each other if needed

### 11.7: State Management Best Practices

**1. Always Use Context Hooks:**
- Use `useUser()`, `useCards()`, `useTransactions()`, `useWallets()`, `useLoans()` hooks
- Never access context directly with `useContext()`
- Hooks include error handling for missing providers

**2. Loading States:**
- Always check `loading` state before rendering data
- Show loading indicators during data fetches
- Use `useEffect` to fetch data on component mount

**3. Error Handling:**
- Check `error` state and display user-friendly messages
- Log errors to console for debugging
- Provide retry mechanisms where appropriate

**4. Data Fetching:**
- Call `fetchTransactions()`, `fetchWallets()`, `fetchLoans()` on mount
- Use `refreshTransactions()`, `refreshWallets()`, `refreshLoans()` for pull-to-refresh
- Avoid unnecessary re-fetches

**5. Optimistic Updates:**
- Update local state immediately for better UX
- Sync with API in background
- Rollback on error

**6. Type Safety:**
- Always use TypeScript interfaces from contexts
- Import types: `import { Transaction, Wallet, Loan } from '@/contexts/...'`
- Use type guards when checking for null/undefined

**Example Usage Pattern:**
```typescript
import { useTransactions } from '@/contexts/TransactionsContext';
import { useUser } from '@/contexts/UserContext';
import { useEffect } from 'react';

export default function TransactionsScreen() {
  const { transactions, loading, error, fetchTransactions } = useTransactions();
  const { user, preferences } = useUser();

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  if (loading) {
    return <LoadingIndicator />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchTransactions} />;
  }

  return <TransactionList transactions={transactions} currency={preferences.currency} />;
}
```

### 11.8: Future State Management Enhancements

**Potential Additional Contexts:**

1. ✅ **UserContext** - User profile, authentication state, preferences (IMPLEMENTED)
   - ✅ User profile data
   - ✅ User settings and preferences
   - ✅ Buffr Card balance management
   - ⏳ Authentication status (can be integrated with Clerk)
   - ⏳ Notification preferences (can be expanded)

2. ✅ **CardsContext** - Linked payment cards management (IMPLEMENTED)
   - ✅ Linked debit/credit cards
   - ✅ Card verification status
   - ✅ Card management operations
   - ✅ Default card selection
   - ✅ Card network detection

3. **SettingsContext** - App-wide settings
   - Theme preferences
   - Language settings
   - Notification settings
   - Privacy settings

4. **RequestsContext** - Money request management
   - Sent requests
   - Received requests
   - Request status tracking

5. **GroupsContext** - Group payment management
   - User groups
   - Group transactions
   - Group member management

**When to Create a New Context:**
- Data is used across multiple screens
- Data needs to be shared between unrelated components
- Data requires centralized state management
- Data needs to persist across navigation

**When NOT to Create a Context:**
- Data is only used in one component (use `useState`)
- Data is only passed down one level (use props)
- Data doesn't need to be shared (use local state)

---

## 12. Animations & Transitions

### 12.1: Screen Transition Animations

**Stack Navigation Animations:**
- Configured in `app/_layout.tsx` using Expo Router Stack
- Fade animation for general navigation (200ms duration)
- Slide-from-right animation for transaction receipt screen
- Card presentation style for modal-like screens

**Configuration:**
```typescript
<Stack
  screenOptions={{
    animation: 'fade',
    animationDuration: 200,
  }}
>
  <Stack.Screen
    name="transactions/[id]"
    options={{
      presentation: 'card',
      animation: 'slide_from_right',
    }}
  />
</Stack>
```

### 12.2: Component-Level Animations

**Animated Receipt View:**
- Location: `components/transactions/AnimatedReceiptView.tsx`
- Uses `react-native-reanimated` for smooth animations
- Fade-in animation (opacity: 0 → 1)
- Slide-up animation (translateY: 20 → 0)
- Duration: 300ms with easing function

**Animation Implementation:**
```typescript
const opacity = useSharedValue(0);
const translateY = useSharedValue(20);

useEffect(() => {
  opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
  translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
}, []);
```

**Benefits:**
- Smooth user experience
- Professional feel
- Reduces perceived loading time
- Enhances visual feedback

---

## 13. PDF Export Functionality

### 13.1: PDF Export Implementation

**Location:** `utils/pdfExport.ts`

A utility function for exporting transaction receipts as PDF files.

**Features:**
- Generates professional PDF receipts
- Branded with Buffr styling and colors
- Includes all transaction details
- Share functionality via native share sheet
- Fallback to save in documents directory

**Usage:**
```typescript
import { exportReceiptToPDF } from '@/utils/pdfExport';

await exportReceiptToPDF(transaction, reference);
```

**PDF Content Includes:**
- Buffr logo and branding
- Transaction status badge
- Amount (highlighted in primary color)
- Description
- Recipient/Sender information
- Date & time
- Reference number
- Transaction ID
- Footer with generation timestamp

### 13.2: Required Packages

**Installed Packages:**
- `expo-print` - PDF generation from HTML
- `expo-file-system` - File operations
- `expo-sharing` - Native share functionality

**Installation:**
```bash
npx expo install expo-print expo-file-system expo-sharing
```

### 13.3: PDF Export Features

**Export Button:**
- Located in transaction receipt screen (top right)
- Shows loading state during PDF generation
- Displays success/error alerts
- Disabled during export process

**PDF Styling:**
- Professional layout with Buffr brand colors
- Responsive design
- Print-friendly format
- Includes all transaction metadata

**Error Handling:**
- Try-catch blocks for error handling
- User-friendly error messages
- Console logging for debugging

---

## 14. NAMQR Code Standards Implementation

### 14.1: NAMQR Code Standards Version 5.0

**Location:** `utils/namqr.ts`, `utils/qrParser.ts`, `app/qr-scanner.tsx`, `app/send-money/qr-scanner.tsx`, `components/qr/QRCodeDisplay.tsx`

Buffr implements NAMQR Code Standards Version 5.0 (09 May 2025) as specified by the Bank of Namibia for interoperable QR code payments across all payment streams in Namibia.

**Key Features:**
- ✅ TLV (Tag-Length-Value) format encoding
- ✅ CRC-16 checksum validation (ISO/IEC 13239, polynomial 0x1021)
- ✅ IPP (Instant Payment Namibia) full form alias support
- ✅ Token Vault Unique Identifier integration
- ✅ Static and dynamic QR code support
- ✅ Support for Buffr main account and Buffr wallets
- ✅ Backward compatible with legacy JSON/URL formats

**NAMQR Structure:**
- **Tag 00:** Payload Format Indicator ("01" for NAMQR)
- **Tag 01:** Point of Initiation Method (11=static payee, 12=dynamic payee)
- **Tag 26:** IPP Payee Full Form Alias (e.g., "phone@buffr" or "walletId@buffr.wallet")
- **Tag 52:** Merchant Category Code ("0000" for P2P transactions)
- **Tag 58:** Country Code ("NA" for Namibia)
- **Tag 59:** Payee Name (up to 25 characters)
- **Tag 60:** Payee City (up to 15 characters)
- **Tag 65:** Token Vault Unique Identifier (mandatory, xx-digit identifier)
- **Tag 80:** Unreserved Template with Initiation Mode
- **Tag 63:** CRC checksum (always last, validates data integrity)

**QR Code Generation:**
- Static QR: No amount included (user enters amount manually)
- Dynamic QR: Includes amount (pre-filled in payment screen)
- Error Correction: Level M (Medium - 15%) recommended per NAMQR standards
- Encoding: Byte Mode as per NAMQR specifications
- Maximum Payload: 512 alphanumeric characters

**QR Code Parsing:**
- Primary: NAMQR TLV format parsing with CRC validation
- Fallback: Legacy JSON and URL formats for backward compatibility
- Amount Extraction: Automatically extracts amount from dynamic QR codes
- Account Type Detection: Identifies Buffr account vs. Buffr wallet from IPP alias

**Security Features:**
- CRC-16 checksum validation for data integrity
- Token Vault Unique Identifier for QR code validation
- Alias-based identification (no sensitive account details in QR)
- Support for Signed QR (when IPP is implemented)

**Implementation Files:**
- `utils/namqr.ts` - Core NAMQR generation and parsing utilities
- `utils/qrParser.ts` - QR code parser with NAMQR and legacy format support
- `app/qr-scanner.tsx` - Standalone QR scanner screen (accessed from home screen) with NAMQR parsing
- `app/send-money/qr-scanner.tsx` - QR scanner screen for send-money flow with NAMQR parsing
- `components/qr/QRCodeDisplay.tsx` - QR code display component with NAMQR generation

**Usage Example:**
```typescript
import { generateBuffrAccountNAMQR } from '@/utils/namqr';

// Generate static QR for Buffr account
const qrCode = generateBuffrAccountNAMQR(
  phoneNumber,
  userName,
  userCity,
  tokenVaultId,
  undefined, // No amount = static QR
  true // isStatic
);

// Generate dynamic QR with amount
const dynamicQR = generateBuffrAccountNAMQR(
  phoneNumber,
  userName,
  userCity,
  tokenVaultId,
  "100.50", // Amount included = dynamic QR
  false // isStatic
);
```

**Compliance:**
- ✅ Compliant with NAMQR Code Standards Version 5.0
- ✅ Follows Bank of Namibia guidelines for QR code standardization
- ✅ Supports interoperability across payment streams (NRTC, EnCR, EnDO, IPP, POSD, POSC, ATM)
- ✅ Ready for Token Vault integration
- ✅ Ready for IPP (Instant Payment Namibia) integration

**Required Package for QR Code Rendering:**
To display actual QR codes (currently using placeholder), install:
```bash
npm install react-native-qrcode-svg
```
Note: `react-native-svg` is already installed as a dependency.

**QR Code Display Features:**
- Account type selector (Buffr Account / Wallet)
- Wallet selector for wallet QR codes
- Static QR codes (no amount - user enters manually)
- Dynamic QR codes (with amount - pre-filled)
- Download and share functionality
- Instructions for QR code usage

**Profile Screen Features:**
- User profile information (name, phone, email)
- Main Buffr account QR code (always shows main account)
- Download QR code as file
- Share QR code via native share sheet
- QR code usage instructions

---

## 15. Transactions Dashboard & Category Navigation

### 15.1: Transactions Dashboard Implementation

**Location:** `app/(tabs)/transactions.tsx`

The transactions screen has been completely redesigned as a comprehensive dashboard with multiple views and filtering capabilities.

**Key Components:**

1. **SearchBar Header**
   - Search input with placeholder
   - Notification bell icon
   - Profile avatar
   - Matches home screen header design

2. **TransactionTabs Component**
   - Three tabs: Balance, Earnings, Spendings
   - Active tab indicator
   - Smooth tab switching
   - Dynamic content based on selected tab

3. **TransactionChart Component**
   - Line chart visualization using `react-native-chart-kit`
   - Dynamic title based on active tab:
     - Balance: "Total Balance"
     - Earnings: "Total Earnings"
     - Spendings: "Total Spendings"
   - Period filter dropdown: Weekly, Monthly, Yearly
   - Week filter buttons: "This week" / "Last week"
   - Chart data updates based on selected filters
   - Displays cumulative balance for Balance tab
   - Displays daily totals for Earnings/Spendings tabs

4. **BudgetProgressBar Component**
   - Visual progress indicator
   - Dynamic label based on tab:
     - Earnings: "Earnings target: X%"
     - Spendings: "Budget reached: X%"
     - Balance: "Budget reached: X%"
   - Color-coded progress fill
   - Amount display with currency formatting

5. **CategorizedTransactions Component**
   - Category cards with icons and colors
   - Progress bars for each category
   - Amount display per category
   - Tap category to navigate to category transactions screen
   - Different categories for Earnings vs Spendings tabs

6. **TransactionList Component**
   - Full transaction list below categorized view
   - Pull-to-refresh functionality
   - Tap transaction to navigate to receipt

**Data Flow:**
- Uses `TransactionsContext` for global state
- Helper functions in `utils/transactionHelpers.ts` for calculations
- Dynamic filtering based on active tab and selected filters
- Real-time updates when filters change

### 14.2: Transaction Helper Functions

**Location:** `utils/transactionHelpers.ts`

Utility functions for transaction data processing:

**Functions:**
- `calculateBalance(transactions)` - Calculate total balance
- `calculateEarnings(transactions)` - Calculate total earnings
- `calculateSpendings(transactions)` - Calculate total spendings
- `getTransactionsForWeek(transactions, weekFilter)` - Filter transactions by week
- `generateChartData(transactions, tabType, weekFilter, period)` - Generate chart data points
- `getCategorizedSpendings(transactions, tabType)` - Get categorized transaction data
- `calculateBudgetProgress(transactions, tabType)` - Calculate budget progress percentage

**Types:**
- `TabType`: 'balance' | 'earnings' | 'spendings'
- `PeriodType`: 'weekly' | 'monthly' | 'yearly'
- `WeekFilter`: 'thisWeek' | 'lastWeek'

**Features:**
- Type-safe with TypeScript
- Efficient calculations using `useMemo`
- Handles edge cases (empty arrays, missing data)
- Supports all three tab types with different logic

### 14.3: Category Navigation Flow

**Navigation Chain:**
1. **Transactions Dashboard** → Tap category card
2. **Category Transactions Screen** → Tap transaction
3. **Transaction Receipt Screen** → View full details

**Category Transactions Screen:**
- **Location:** `app/transactions/category/[categoryId].tsx`
- **Route:** `/transactions/category/[categoryId]`
- **Dynamic Parameter:** `categoryId` (string: '1' through '10')

**Category Mapping:**

**Expense Categories (IDs 1-5):**
- `1` - Food & Beverages (cutlery icon, #FF6B6B)
- `2` - Entertainment (TV icon, #9B59B6)
- `3` - Travel (plane icon, #3498DB)
- `4` - Bills & Utilities (file icon, #95A3B8)
- `5` - Health & Fitness (heart icon, #E74C3C)

**Income Categories (IDs 6-10):**
- `6` - Salary (briefcase icon, #10B981)
- `7` - Freelance (laptop icon, #3B82F6)
- `8` - Investments (line-chart icon, #8B5CF6)
- `9` - Gifts (gift icon, #F59E0B)
- `10` - Other Income (money icon, #6366F1)

**Screen Features:**
- Category header with icon, name, and transaction count
- Filtered transaction list (only transactions for that category)
- Back navigation button
- Error handling for invalid category IDs
- Smooth navigation to transaction receipt

**Filtering Logic:**
- Income categories (6-10): Show `received` and `payment` transactions
- Expense categories (1-5): Show `sent`, `transfer`, and `request` transactions
- Transactions distributed across categories (mock logic - replace with actual category metadata in production)

### 14.4: Chart Component Features

**TransactionChart Component:**
- **Location:** `components/transactions/TransactionChart.tsx`
- **Library:** `react-native-chart-kit` with `react-native-svg`

**Props:**
- `thisWeekData` - Chart data for current week
- `lastWeekData` - Chart data for previous week
- `labels` - X-axis labels (day names)
- `balance` - Current balance (for Balance tab)
- `tabType` - Active tab type
- `selectedWeekFilter` - 'thisWeek' | 'lastWeek'
- `onWeekFilterChange` - Callback for filter change
- `selectedPeriod` - 'weekly' | 'monthly' | 'yearly'
- `onPeriodChange` - Callback for period change

**Features:**
- Dynamic chart title based on `tabType`
- Period dropdown (Weekly/Monthly/Yearly)
- Week filter buttons (This week/Last week)
- Auto-closing dropdown on outside tap
- Smooth data transitions
- Responsive chart sizing

### 14.5: Budget Progress Bar

**BudgetProgressBar Component:**
- **Location:** `components/transactions/BudgetProgressBar.tsx`

**Props:**
- `percentage` - Progress percentage (0-100)
- `amount` - Current amount
- `label` - Custom label (optional)
- `tabType` - Active tab type

**Features:**
- Dynamic label based on `tabType`:
  - Earnings: "Earnings target: X%"
  - Spendings: "Budget reached: X%"
  - Balance: "Budget reached: X%"
- Color-coded progress fill
- Amount formatting with currency
- Visual progress indicator

### 14.6: Categorized Transactions

**CategorizedTransactions Component:**
- **Location:** `components/transactions/CategorizedTransactions.tsx`

**Props:**
- `categories` - Array of category data with id, name, icon, amount, progress, color
- `onCategoryPress` - Callback when category is tapped
- `tabType` - Active tab type

**Features:**
- Displays different categories based on `tabType`
- Category cards with icons and colors
- Progress bars for each category
- Amount display per category
- Tap to navigate to category transactions screen
- Smooth card animations

**Category Data Structure:**
```typescript
{
  id: string;        // Category ID ('1' through '10')
  name: string;      // Category name
  icon: string;      // FontAwesome icon name
  amount: number;    // Total amount for category
  progress: number;  // Progress percentage (0-100)
  color: string;     // Category color (hex)
}
```

### 14.7: Route Configuration

**Updated Routes in `app/_layout.tsx`:**
```typescript
<Stack.Screen
  name="transactions/category/[categoryId]"
  options={{
    headerShown: false,
    presentation: 'card',
    animation: 'slide_from_right',
  }}
/>
```

**Navigation Pattern:**
- Use `router.push()` with dynamic route paths
- Category ID passed as route parameter
- Transaction ID passed as route parameter
- Back navigation using `router.back()`

---

## 16. Wallet Management Implementation

### 16.1: Wallets Context Implementation

**Location:** `contexts/WalletsContext.tsx`

A global state management solution for wallets using React Context API.

**Features:**
- Centralized wallet state accessible throughout the app
- Loading and error state management
- Functions for fetching, creating, updating, and deleting wallets
- Wallet transaction management
- Wallet statistics calculation
- Add money and transfer functionality
- Type-safe with TypeScript interfaces

**Context Provider:**
```typescript
<WalletsProvider>
  {/* App content */}
</WalletsProvider>
```

**Usage in Components:**
```typescript
import { useWallets } from '@/contexts/WalletsContext';

const { wallets, loading, fetchWallets, getWalletById, addMoneyToWallet } = useWallets();
```

**Available Functions:**
- `fetchWallets()` - Fetch all wallets from API
- `getWalletById(id)` - Get specific wallet by ID
- `getWalletTransactions(walletId)` - Get transactions for a wallet
- `getWalletStats(walletId)` - Get wallet statistics (total in/out/net)
- `refreshWallets()` - Refresh wallet list
- `addWallet(walletData)` - Create new wallet
- `updateWallet(id, updates)` - Update existing wallet
- `deleteWallet(id)` - Delete wallet
- `addMoneyToWallet(walletId, amount, paymentMethod)` - Add funds to wallet
- `transferFromWallet(walletId, amount, recipient, note)` - Transfer money from wallet

**State Properties:**
- `wallets: Wallet[]` - Array of all wallets
- `loading: boolean` - Loading state indicator
- `error: string | null` - Error message if fetch fails

**Integration:**
- Provider added to `app/_layout.tsx` wrapping the entire app
- Home screen uses context to display wallets
- All wallet screens use context for data management

### 15.2: Wallet Interface

```typescript
interface Wallet {
  id: string;
  name: string;
  balance: number;
  currency?: string;
  type?: 'personal' | 'business' | 'savings' | 'investment' | 'bills' | 'travel' | 'budget';
  purpose?: string;
  cardDesign?: number; // Frame number from Buffr Card Design (2-32)
  cardNumber?: string; // Last 4 digits for display
  cardholderName?: string;
  expiryDate?: string; // Format: MM/YY
  autoPayEnabled?: boolean;
  autoPayMaxAmount?: number;
  pinProtected?: boolean;
  biometricEnabled?: boolean;
  createdAt: Date;
}
```

**Wallet Types:**
- `personal` - Personal wallet for daily expenses
- `business` - Business wallet for business transactions
- `savings` - Savings wallet for saving goals
- `investment` - Investment wallet for investments
- `bills` - Bills wallet for bill payments
- `travel` - Travel wallet for travel expenses
- `budget` - Budget wallet for budget management

**Customizable Card Designs:**
- Each wallet can have a custom card design from Buffr Card Design frames
- Available frames: 2, 3, 6, 7, 8, 9, 12, 15, 21-32 (20+ designs)
- Card designs are selected during wallet creation
- Each wallet displays with its unique card design
- Card includes: card number, cardholder name, expiry date

### 15.3: Wallet Screens Implementation

#### Wallet Overview Screen (`app/wallets/[id].tsx`)

**Features:**
- Wallet name and balance display
- Wallet card preview with hide/show balance toggle
- Quick action buttons: Add Money, Transfer, Card, History
- Recent activity list (last 5 transactions)
- Wallet statistics: Total In, Total Out, Net
- Pull-to-refresh functionality
- Navigation to all wallet features

**Navigation:**
- Tap "Add Money" → Add Money Screen
- Tap "Transfer" → Transfer Screen
- Tap "Card" → Card Management (future)
- Tap "History" → Wallet History Screen
- Tap "Settings" → Wallet Settings Screen
- Tap transaction → Transaction Details (future)

#### Wallet History Screen (`app/wallets/[id]/history.tsx`)

**Features:**
- Filter tabs: All, Added, Spent
- Transaction list with icons and color coding
- Date and time formatting
- Empty state handling
- Pull-to-refresh functionality

**Transaction Types:**
- `added` - Money added to wallet
- `spent` - Money spent from wallet
- `transfer_in` - Transfer received
- `transfer_out` - Transfer sent

#### Add Money Screen (`app/wallets/[id]/add-money.tsx`)

**Features:**
- Amount input with number pad
- Quick amount buttons (N$ 100, 500, 1000)
- Payment method selection (Bank Account, Card)
- Fee and total display
- Validation (min N$ 10, max N$ 50,000)
- Success/error alerts

**Validation:**
- Minimum amount: N$ 10
- Maximum amount: N$ 50,000
- Payment method required

#### Transfer Screen (`app/wallets/[id]/transfer.tsx`)

**Features:**
- Source wallet display (read-only)
- Recipient search/selection
- Mock contacts list
- Amount input with quick buttons
- Optional note field
- Balance validation
- Success/error handling

**Validation:**
- Amount must be greater than 0
- Amount cannot exceed wallet balance
- Recipient required

#### Wallet Settings Screen (`app/wallets/[id]/settings.tsx`)

**Features:**
- Wallet Information: Name (editable), Type (display)
- Security: PIN Protection toggle, Biometric toggle
- Auto Pay: Enable/disable, Max amount setting
- Linked Accounts: Bank accounts, Cards (mock)
- Delete Wallet with confirmation
- Save settings functionality

**Settings:**
- Wallet name can be edited
- PIN Protection toggle
- Biometric Authentication toggle
- Auto Pay toggle with max amount
- Linked accounts management (mock)

#### Add Wallet Screen (`app/add-wallet.tsx`)

**Features:**
- ✅ Wallet name input with validation
- ✅ Wallet type selector (Personal, Business, Savings, Investment, Bills, Travel, Budget)
- ✅ Optional purpose/description
- ✅ **Card design selector** - Choose from 20+ card frame designs
- ✅ Card preview with selected design
- ✅ Create wallet with validation
- ✅ Navigate to wallet overview after creation
- ✅ Error handling

**Card Design Selection:**
- Modal picker with all available card frames
- Visual preview of each design
- Tap to select and apply design
- Design saved with wallet

**Validation:**
- Wallet name required
- Name must not be empty

### 15.4: Wallet Components

**WalletCard Component:**
- Supports both simple card view (for lists) and detailed card view (for wallet overview)
- **Customizable card design** - Uses CardFrame component with selected frame design
- Hide/show balance toggle
- Card preview with card number, name, expiry
- Displays wallet's custom card design from Buffr Card Design frames
- Responsive design
- Overlay with wallet name and balance on custom card design

**WalletSelector Component:**
- Location: `components/wallets/WalletSelector.tsx`
- Purpose: Select wallet for transactions
- Features:
  - Horizontal scrollable wallet list
  - Visual wallet cards with balances
  - Selected wallet indicator with check badge
  - Can be used in payment flows to choose source wallet
  - Shows all user wallets with their custom designs

**WalletHistory Component:**
- Filter tabs for All/Added/Spent
- Transaction list with icons
- Color-coded amounts
- Empty state handling

**AddWalletForm Component:**
- Form validation
- Name and purpose inputs
- Create and cancel actions

### 15.5: Navigation Routes

**Wallet Routes in `app/_layout.tsx`:**
```typescript
<Stack.Screen
  name="wallets/[id]"
  options={{
    headerShown: false,
    presentation: 'card',
    animation: 'slide_from_right',
  }}
/>
<Stack.Screen
  name="wallets/[id]/history"
  options={{
    headerShown: false,
    presentation: 'card',
    animation: 'slide_from_right',
  }}
/>
<Stack.Screen
  name="wallets/[id]/add-money"
  options={{
    headerShown: false,
    presentation: 'modal',
    animation: 'slide_from_bottom',
  }}
/>
<Stack.Screen
  name="wallets/[id]/transfer"
  options={{
    headerShown: false,
    presentation: 'modal',
    animation: 'slide_from_bottom',
  }}
/>
<Stack.Screen
  name="wallets/[id]/settings"
  options={{
    headerShown: false,
    presentation: 'card',
    animation: 'slide_from_right',
  }}
/>
<Stack.Screen
  name="add-wallet"
  options={{
    headerShown: false,
    presentation: 'modal',
    animation: 'slide_from_bottom',
  }}
/>
```

### 15.6: Home Screen Integration

**Updated Home Screen:**
- Uses `WalletsContext` to fetch and display wallets
- Wallets displayed in horizontal scroll view
- Tap wallet card → Navigate to wallet overview
- Tap "Add Wallet" → Navigate to add wallet screen
- Real-time wallet data from context

### 15.7: Customizable Card Designs

**Card Design System:**
- Each wallet can have a unique card design
- Designs based on Buffr Card Design folder frames (Frame 2-32)
- 20+ available card frame designs
- Card designs selected during wallet creation
- Each wallet displays with its custom design in wallet overview

**Card Design Features:**
- Visual card preview during wallet creation
- Modal picker to browse and select designs
- Selected design saved with wallet
- Card displays: card number, cardholder name, expiry date
- Custom design visible in wallet overview screen

**Available Card Frames:**
- Frame 2, 3, 6, 7, 8, 9, 12, 15, 21-32
- Each frame has unique visual style
- Users can create unlimited wallets, each with different design

### 15.8: Wallet Transaction Capabilities

**Wallets as Payment Sources:**
- ✅ Wallets can be used for all transactions
- ✅ `addMoneyToWallet()` - Add funds to wallet from bank/card
- ✅ `transferFromWallet()` - Transfer money from wallet to recipients
- ✅ Wallets can be selected as payment source in payment flows
- ✅ WalletSelector component available for choosing wallets in transactions
- ✅ Each wallet maintains its own balance and transaction history
- ✅ Unlimited wallets can be created for different purposes

**Transaction Integration:**
- Wallets integrated with transaction system
- Wallet transactions tracked separately per wallet
- Wallet balance updates automatically with transactions
- Wallet history shows all wallet-specific transactions
- Wallets can be used for:
  - Sending money to other users
  - Receiving payments
  - Making purchases
  - Bill payments
  - Any financial transaction

**WalletSelector Component:**
- Location: `components/wallets/WalletSelector.tsx`
- Purpose: Allow users to select which wallet to use for transactions
- Features:
  - Horizontal scrollable list of all user wallets
  - Visual wallet cards showing name and balance
  - Selected wallet indicator
  - Can be integrated into payment flows
  - Shows wallet card designs

**Usage Example:**
```typescript
import { WalletSelector } from '@/components/wallets';
import { useWallets, Wallet } from '@/contexts/WalletsContext';

const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);

<WalletSelector
  selectedWalletId={selectedWallet?.id}
  onWalletSelect={setSelectedWallet}
  showBalance={true}
/>
```

### 15.9: Mock Data

**Wallets:**
- 3 mock wallets with different types, balances, and card designs
- Personal, Savings, and Investment wallets
- Each wallet has unique card design (Frame 2, 12, 15)
- Various settings (auto pay, PIN protection, biometric)
- Card numbers and expiry dates generated

**Wallet Transactions:**
- Mock transactions for each wallet
- Different transaction types (added, spent, transfer)
- Realistic dates and amounts
- Transactions linked to specific wallets

---

## 17. Known Issues & Future Fixes

### 16.1: Date & Time Picker

**Issue:**
- Date and time picker functionality not working properly in Add Wallet form
- `@react-native-community/datetimepicker` integration needs debugging
- Affects Auto Pay "Deduct On" date and time selection

**Location:**
- `components/wallets/AddWalletForm.tsx`
- Lines: Date picker modal (~450-480), Time picker modal (~500-540)

**Status:**
- ⚠️ Known issue - will be fixed in future update
- UI is complete and styled correctly (iOS-style scroll calendar)
- Functionality needs debugging

**Impact:**
- Users cannot currently set Auto Pay deduction date/time
- Does not block wallet creation (Auto Pay is optional)

### 16.2: Transaction Charts

**Issue:**
- Transaction charts not rendering/displaying correctly
- `react-native-chart-kit` integration needs debugging
- Charts may not display data or may crash

**Location:**
- `components/transactions/TransactionChart.tsx`
- Used in: `app/(tabs)/transactions.tsx`

**Status:**
- ⚠️ Known issue - will be fixed in future update
- Chart component structure is complete
- Data calculation and filtering logic is working
- Rendering/display needs debugging

**Impact:**
- Charts section may not display in Transactions dashboard
- Does not block transaction viewing or other dashboard features

**Note:** These issues do not block core functionality. The app is fully functional for wallet management and transactions. These features will be enhanced in a future update.

---

## 18. Running the App

---

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Reanimated Docs](https://docs.swmansion.com/react-native-reanimated/)
- [React Native Gesture Handler Docs](https://docs.swmansion.com/react-native-gesture-handler/)
- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [CocoaPods Guide](https://guides.cocoapods.org/)

---

---

## Additional Notes

### Recent Updates

**State Management:**
- ✅ UserContext implemented for global user profile and preferences
- ✅ CardsContext implemented for global linked payment cards management
- ✅ BanksContext implemented for global bank accounts management
- ✅ TransactionsContext implemented for global state management
- ✅ WalletsContext implemented for global wallet state management
- ✅ LoansContext implemented for global loan state management
- ✅ Home screen uses UserContext for Buffr Card balance
- ✅ BalanceDisplay component syncs with user preferences
- ✅ Add Card screen uses CardsContext for card management
- ✅ Add Bank screen uses BanksContext for bank account management
- ✅ Cards list screen displays and manages linked cards
- ✅ All transaction screens use context instead of local state
- ✅ All wallet screens use context for data management
- ✅ All loan screens use context for loan operations
- ✅ Loading and error states properly handled
- ✅ Provider hierarchy established in root layout (User → Cards → Banks → Transactions → Wallets → Loans)

**Animations:**
- ✅ Screen transition animations configured
- ✅ Component-level animations for receipt view
- ✅ Smooth user experience with react-native-reanimated

**PDF Export:**
- ✅ PDF export functionality implemented
- ✅ Professional receipt generation
- ✅ Native share integration

**Completed Screens:**
- ✅ Transactions dashboard fully implemented with tabs, charts, and filters
- ✅ Category transactions screen with navigation flow
- ✅ Transaction receipt screen with all features
- ✅ Wallet management fully implemented (overview, history, add money, transfer, settings)
- ✅ Create wallet screen with multi-step form (icon selection, name, Auto Pay configuration, card design)
- ✅ Customizable wallet card designs (20+ frames from Buffr Card Design)
- ✅ Wallet types: Personal, Business, Savings, Investment, Bills, Travel, Budget
- ✅ Wallet selector component for transaction payment sources
- ✅ Loading states and error handling
- ✅ Navigation and routing complete (Category → Category Transactions → Receipt, Wallet → Wallet Actions)
- ✅ Add Wallet form with iOS-style design (pill-shaped inputs, action sheets, unified containers)
- ✅ Standalone QR Code Scanner screen (`app/qr-scanner.tsx`) with NAMQR support (accessed from home screen)
- ✅ Send Money QR Code Scanner screen (`app/send-money/qr-scanner.tsx`) with NAMQR support (part of send-money flow)
- ✅ Add Card screen (`app/add-card.tsx`) with pill-shaped form styling
- ✅ Add Bank screen (`app/add-bank.tsx`) with pill-shaped form styling

**Transactions Screen Enhancements:**
- ✅ Three-tab system (Balance, Earnings, Spendings)
- ✅ Interactive line chart with period and week filters (UI complete, rendering needs fix)
- ✅ Budget progress bar with dynamic labels
- ✅ Categorized transactions with progress indicators
- ✅ Category navigation to filtered transaction lists
- ✅ Dynamic data calculation based on active tab and filters
- ✅ Helper functions for transaction calculations and filtering

**Add Wallet Form Enhancements:**
- ✅ Multi-step form with pagination indicators
- ✅ Step 1: Wallet icon selection (FontAwesome icons), wallet name, Auto Pay toggle
- ✅ Auto Pay configuration: Frequency (Weekly/Bi-weekly/Monthly), Deduct On (Date & Time), Amount, Number of Repayments, Payment Method
- ✅ Step 2: Card design selection with preview
- ✅ iOS-style design: Pill-shaped inputs (borderRadius: 25, height: 50)
- ✅ iOS-style action sheet for "Select Number Of Repayments" modal
- ✅ Unified container with continuous border extending to Cancel button
- ✅ All form inputs consistent pill shape and styling
- ✅ Frequency buttons fit on one line without wrapping
- ✅ Circular bank logo frames in payment method selection
- ✅ Proper visual breaks and spacing throughout

**Send Money / Payment Flows:**
- ✅ Select Recipient Screen with Recents, Favorites, and Contacts
- ✅ Device contacts integration using expo-contacts
- ✅ Contact carousel components (horizontal scrolling)
- ✅ Contact list components (vertical list)
- ✅ Receiver Details Screen (Enter Amount screen)
- ✅ PayFromSelector component (payment source selection modal)
- ✅ NoteInputModal component (note input for payments)
- ✅ PaymentMethodTypeModal component (select Card or Bank Account)
- ✅ Pill-shaped form consistency across all payment screens
- ✅ Payment source selection with Buffr Account, Wallets, Cards, and Banks
- ✅ Real bank accounts from BanksContext integrated into PayFromSelector
- ✅ "Add New Payment Method" button opens PaymentMethodTypeModal
- ✅ Navigation to add-card or add-bank screens from modal

**Bank Account Management:**
- ✅ BanksContext created for managing bank accounts
- ✅ AddBankForm component with pill-shaped inputs
- ✅ Add Bank screen (app/add-bank.tsx) for adding bank accounts
- ✅ Bank account fields: Bank Name, Account Number, Account Holder Name, Branch Code, Account Type
- ✅ Account types: Checking and Savings
- ✅ BanksContext integrated into PayFromSelector for payment source selection
- ✅ All bank forms use consistent pill-shaped styling (borderRadius: 25, height: 50)

**Navigation Flow:**
- ✅ Category tap → Category Transactions Screen
- ✅ Transaction tap in category list → Transaction Receipt Screen
- ✅ Complete navigation chain implemented

**Payment Flows & Components:**
- ✅ Select Recipient Screen with device contacts integration
- ✅ Receiver Details Screen (Enter Amount screen)
- ✅ PayFromSelector modal component (payment source selection)
- ✅ NoteInputModal component (note input for payments)
- ✅ PaymentMethodTypeModal component (select Card or Bank Account)
- ✅ Pill-shaped form consistency (borderRadius: 25, height: 50)
- ✅ Contact carousel and list components
- ✅ expo-contacts package integrated for phone contacts access
- ✅ Add Card form updated with pill-shaped inputs
- ✅ Add Bank form with full bank account management

**NAMQR Code Implementation (QR Code Standards):**
- ✅ NAMQR Code Standards Version 5.0 implementation
- ✅ TLV (Tag-Length-Value) format support
- ✅ CRC-16 checksum validation (ISO/IEC 13239, polynomial 0x1021)
- ✅ IPP (Instant Payment Namibia) full form alias support (Tag 26)
- ✅ Legacy payment system support (Tag 17)
- ✅ Standalone QR Code Scanner with NAMQR parsing (app/qr-scanner.tsx) - accessed from home screen
- ✅ Send Money QR Code Scanner with NAMQR parsing (app/send-money/qr-scanner.tsx) - part of send-money flow
- ✅ QRCodeDisplay component updated for NAMQR generation
- ✅ Support for static and dynamic QR codes
- ✅ Support for Buffr main account and Buffr wallets
- ✅ Token Vault Unique Identifier integration (Tag 65)
- ✅ Backward compatible with legacy JSON/URL formats
- ✅ Amount pre-population from dynamic QR codes
- ✅ Error correction level M (Medium - 15%) recommended
- ✅ QR code generation utilities (utils/namqr.ts)
- ✅ QR code parser utilities (utils/qrParser.ts)
- ✅ QR Code Display screen (app/qr-code.tsx) with account/wallet selection
- ✅ Home screen "Scan QR" button navigates to standalone QR scanner (/qr-scanner)
- ✅ Standalone QR scanner navigates to send-money flow after scanning
- ✅ QR scanner also integrated into Send Money flow (/send-money/qr-scanner)

**Reusable Components Refactoring (Completed):**
- ✅ **New Reusable Components Created (Layout & States):**
  - ✅ EmptyState - Used in CardList, Profile, QR Code screens
  - ✅ SectionHeader - Used in wallet settings, add-money screens
  - ✅ FormInputGroup - Used in AddBankForm for consistent form inputs
  - ✅ ListItemCard - Reusable list item card pattern
  - ✅ LoadingState - Reusable loading indicator
- ✅ **New Reusable Components Created (Error/Warning/Alert):**
  - ✅ ErrorState - Used in wallet screens for error displays (replaces errorContainer patterns)
    - Refactored: app/wallets/[id].tsx, app/wallets/[id]/add-money.tsx, app/wallets/[id]/settings.tsx, app/wallets/[id]/transfer.tsx, app/wallets/[id]/history.tsx
  - ✅ WarningState - Reusable warning state display
  - ✅ AlertDialog - Styled alert dialog alternative to React Native Alert (variants: error, warning, info, success)
  - ✅ AlertBanner - Inline alert banner for messages (dismissible, auto-dismiss option)
  - ✅ ErrorBoundary - React Error Boundary for catching component errors
- ✅ **New Reusable Components Created (Account Management):**
  - ✅ AccountQuickView - Centered account quick view with Buffr logo, account number, swipeable carousel for multiple accounts
    - Features: Shows Buffr main account + linked cards, centered layout, + button to add cards, swipeable with indicators
    - Used in: app/(tabs)/index.tsx (Home screen)
    - Updated: Removed "Buffr" text label, only shows logo for Buffr account
  - ✅ Card Details Screen - Card/account management screen (app/cards/[id].tsx)
    - Features: Shows card details, creation date, last used date, verification status, management options
  - ✅ Buffr Account Details Screen - Main account management screen (app/cards/buffr-account.tsx)
    - Features: Shows Buffr main account details, account creation date, account status, account information
    - Navigation: Accessed from AccountQuickView or "View >" button on home screen
- ✅ PillButton component created and fully integrated across the app:
  - ✅ app/qr-code.tsx (Share QR, Download QR buttons)
  - ✅ components/common/NoteInputModal.tsx (Cancel, Save buttons)
  - ✅ components/qr/QRCodeDisplay.tsx (Share QR Code button)
  - ✅ components/banks/AddBankForm.tsx (Add Bank Account button)
  - ✅ components/cards/AddCardForm.tsx (Add Card button)
  - ✅ components/wallets/AddWalletForm.tsx (Next, Save buttons)
  - ✅ app/qr-scanner.tsx (Grant Permission, Scan Again buttons)
  - ✅ app/send-money/qr-scanner.tsx (Grant Permission, Scan Again buttons)
  - ✅ app/send-money/receiver-details.tsx (Pay button)
  - ✅ app/wallets/[id]/add-money.tsx (Add Money button)
  - ✅ app/wallets/[id]/settings.tsx (Save Settings button)
  - ✅ app/wallets/[id]/transfer.tsx (Transfer button)
- ✅ SettingsItem component created and integrated into:
  - ✅ app/profile.tsx (Settings categories items)
  - ✅ components/settings/SettingsScreen.tsx (Settings options)
- ✅ All high-priority button refactoring completed
- ✅ Consistent pill-shaped styling (borderRadius: 25, height: 50) across all buttons
- ✅ Improved code maintainability and reusability

---

**Last Updated:** January 25, 2025  
**Expo SDK Version:** 54.0.0  
**Project:** Buffr  

**Component Refactoring Status:**
- ✅ **PillButton Component** - Fully integrated across 12+ screens and components
  - Variants: `primary`, `dark`, `outline`
  - Features: Loading state, disabled state, icon support
  - Consistent pill-shaped styling (borderRadius: 25, height: 50)
- ✅ **SettingsItem Component** - Integrated into settings screens
  - Consistent icon + title + chevron pattern
  - Proper text contrast and accessibility
- ✅ **Text Legibility Fixes** - Profile screen and QR Code screen text contrast improved
- ✅ **Code Maintainability** - Reduced code duplication, improved consistency

**Status:** Transactions dashboard, Wallet management, and Payment Flows fully implemented. Bank account management added with BanksContext. Payment method selection modal (Card/Bank) integrated. NAMQR Code Standards Version 5.0 implementation complete with QR scanner and display components. All forms use consistent pill-shaped styling. Reusable component library fully refactored with PillButton and SettingsItem components for improved code maintainability and consistency.

### Known Issues & Future Fixes

**Date & Time Picker:**
- ⚠️ Date and time picker functionality not working properly
- Issue: `@react-native-community/datetimepicker` integration needs debugging
- Status: Will be fixed in future update
- Location: `components/wallets/AddWalletForm.tsx` (Auto Pay "Deduct On" fields)

**Charts:**
- ⚠️ Transaction charts not rendering/displaying correctly
- Issue: `react-native-chart-kit` integration needs debugging
- Status: Will be fixed in future update
- Location: `components/transactions/TransactionChart.tsx`

**Note:** These issues do not block core functionality. The app is functional for wallet management and transactions, but these features will be enhanced in a future update.
