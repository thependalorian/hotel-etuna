# SmartPay Mobile App

A comprehensive React Native mobile application for SmartPay - a fintech platform for sending money, paying bills, and managing finances in Namibia.

## Features

### Core Functionality
- **Multi-screen Navigation**: Tab-based navigation with Home, Transactions, Copilot, Wallets, and Profile
- **Onboarding Flow**: Phone verification with OTP, name collection, and account setup
- **Wallet Management**: Multiple wallets with real-time balance tracking
- **Send Money**: P2P transfers with contact selection and amount entry
- **Cash Out**: Agent-based cash withdrawal and ATM access
- **Voucher Redemption**: Government voucher code redemption
- **Loan Management**: View loan offers and apply for loans
- **Groups**: Group payment management (Chamas)
- **Agent Finder**: Locate nearby SmartPay agents
- **Proof of Life**: Government verification compliance
- **AI Copilot**: Intelligent assistant for transaction queries and support

### Technical Features
- **AI Copilot**: Conversational interface with bge-m3 semantic search
- **Offline-First Architecture**: Works without internet connection
- **Secure Storage**: PIN and sensitive data encryption
- **Biometric Authentication**: Face ID/Touch ID support
- **Real-time Updates**: Pull-to-refresh on all screens
- **Type-Safe**: Full TypeScript implementation
- **Design System**: Centralized design tokens for consistent UI
- **Context API**: Global state management
- **Service Layer**: Clean API abstraction with dual backend support
- **SSE Streaming**: Real-time AI responses via Server-Sent Events

## Technology Stack

- **Framework**: React Native 0.83.2
- **Platform**: Expo ~55.0.0
- **Router**: Expo Router (file-based routing)
- **Language**: TypeScript ~5.9.2
- **UI**: React Native components with custom design system
- **Icons**: @expo/vector-icons (Ionicons)
- **Storage**: AsyncStorage, Expo SecureStore
- **Network**: NetInfo for connectivity monitoring

## Project Structure

```
mobile/
├── app/                          # Expo Router pages
│   ├── (tabs)/                   # Tab navigation
│   │   ├── home.tsx              # Home dashboard
│   │   ├── transactions.tsx      # Transaction history
│   │   ├── copilot.tsx           # AI assistant
│   │   ├── wallets.tsx           # Wallet management
│   │   └── profile.tsx           # User profile
│   ├── onboarding/               # Onboarding flow
│   │   ├── index.tsx             # Welcome screen
│   │   ├── phone.tsx             # Phone entry
│   │   ├── otp.tsx               # OTP verification
│   │   ├── name.tsx              # Name collection
│   │   └── complete.tsx          # Completion
│   ├── send-money/               # Send money flow
│   ├── cash-out/                 # Cash out screens
│   ├── voucher/                  # Voucher redemption
│   ├── loans/                    # Loan management
│   ├── groups/                   # Group payments
│   ├── agents/                   # Agent finder
│   ├── proof-of-life/            # Verification
│   ├── _layout.tsx               # Root layout
│   └── index.tsx                 # Entry point
├── components/                   # Reusable components
│   ├── ui/                       # UI primitives
│   │   ├── TextInput.tsx         # Input component
│   │   ├── ErrorState.tsx        # Error handling
│   │   ├── LoadingState.tsx      # Loading states
│   │   └── SuccessScreen.tsx     # Success feedback
│   └── layout/                   # Layout components
│       ├── AppHeader.tsx         # App header
│       └── OnboardingLayout.tsx  # Onboarding wrapper
├── contexts/                     # React Context providers
│   ├── UserContext.tsx           # User state
│   ├── WalletsContext.tsx        # Wallet state
│   ├── NetworkContext.tsx        # Network status
│   └── AppProviders.tsx          # Provider composition
├── services/                     # API integration
│   ├── auth.ts                   # Authentication
│   ├── wallets.ts                # Wallet operations
│   ├── transactions.ts           # Transaction history
│   ├── send.ts                   # P2P transfers
│   └── secureStorage.ts          # Secure storage wrapper
├── hooks/                        # Custom React hooks
│   ├── usePullToRefresh.ts       # Pull-to-refresh
│   └── useNetworkStatus.ts       # Network monitoring
├── constants/                    # Design system & config
│   ├── designSystem.ts           # Design tokens
│   └── ussdRegistry.ts           # USSD codes
├── utils/                        # Helper functions
│   ├── formatters.ts             # Data formatting
│   └── validation.ts             # Input validation
├── app.json                      # Expo configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
└── babel.config.js               # Babel config
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

1. Clone the repository
2. Navigate to the mobile directory:
   ```bash
   cd fintech/smartpay/mobile
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

5. Start the development server:
   ```bash
   npm start
   ```

6. Run on iOS or Android:
   ```bash
   npm run ios     # iOS Simulator
   npm run android # Android Emulator
   ```

## Environment Variables

Configure the following in your `.env` file:

```env
# Node.js Backend (Primary API)
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000

# Python AI Backend (Copilot & ML)
EXPO_PUBLIC_AI_API_BASE_URL=http://localhost:8000

# App Configuration
APP_NAME=SmartPay
APP_VERSION=1.0.0
APP_ENV=development

# Features
EXPO_PUBLIC_ENABLE_BIOMETRICS=true
EXPO_PUBLIC_ENABLE_OFFLINE_MODE=true
EXPO_PUBLIC_ENABLE_AI_COPILOT=true
```

## Development

### Key Commands

```bash
npm start          # Start Expo dev server
npm run ios        # Run on iOS
npm run android    # Run on Android
npm test           # Run tests
npm run lint       # Lint code
```

### Development Mode Features

- **OTP Bypass**: In dev mode, any 6-digit code works for OTP verification
- **Mock Data**: Services return mock data when API is not configured
- **Dev Indicators**: Console logs for debugging

## Design System

The app uses a centralized design system (`constants/designSystem.ts`) with:

- **Colors**: Brand, semantic, and neutral color palettes
- **Typography**: Text styles and font scales
- **Spacing**: Consistent spacing scale
- **Shadows**: Shadow presets for elevation
- **Components**: Component-specific tokens

Example usage:

```typescript
import { designSystem } from '@/constants/designSystem';

const styles = StyleSheet.create({
  container: {
    backgroundColor: designSystem.colors.background,
    padding: designSystem.spacing.md,
    borderRadius: designSystem.borderRadius.md,
  },
  title: {
    ...designSystem.typography.textStyles.titleLg,
    color: designSystem.colors.text,
  },
});
```

## State Management

### Contexts

- **UserContext**: User profile, authentication state
- **WalletsContext**: Wallet data and operations
- **NetworkContext**: Network connectivity status

### Usage

```typescript
import { useUser } from '@/contexts/UserContext';
import { useWallets } from '@/contexts/WalletsContext';

function MyComponent() {
  const { profile, smartpayId } = useUser();
  const { wallets, totalBalance } = useWallets();
  
  // Use context data
}
```

## API Integration

The mobile app integrates with two backend services:

**1. Node.js API Layer (`http://localhost:4000`)**
- User authentication, wallets, transactions
- Primary data operations and business logic

**2. Python AI Backend (`http://localhost:8000`)**
- AI Copilot with 6 specialized agents
- RAG with bge-m3 embeddings (semantic search)
- 5 ML models (fraud detection, credit scoring)
- Real-time streaming via SSE

Services are located in `services/` and provide clean abstractions:

```typescript
import { sendMoney } from '@/services/send';

const result = await sendMoney({
  recipientPhone: '+26481234567',
  amount: 50.00,
  note: 'Lunch payment',
  walletId: 'wallet-123',
});
```

## Routing

The app uses Expo Router for file-based routing:

```typescript
import { router } from 'expo-router';

// Navigate to a screen
router.push('/send-money');

// Navigate with params
router.push({ 
  pathname: '/send-money/amount', 
  params: { recipientPhone: '+26481234567' } 
});

// Go back
router.back();

// Replace screen (no back navigation)
router.replace('/(tabs)/home');
```

## Security

- **Secure Storage**: Sensitive data (tokens, PINs) stored in Expo SecureStore
- **PIN Hashing**: PINs are hashed before transmission
- **Token Expiry**: Automatic token expiration and renewal
- **Biometric Auth**: Face ID/Touch ID for sensitive operations

## Testing

Run tests:

```bash
npm test
```

Test coverage:

```bash
npm run test:coverage
```

## Building for Production

### iOS

```bash
eas build --platform ios
```

### Android

```bash
eas build --platform android
```

## Deployment

The app uses EAS (Expo Application Services) for builds and OTA updates:

1. Configure `app.json` with your project details
2. Set up EAS credentials
3. Build and submit to app stores

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Proprietary - SmartPay

## Support

For support, contact the SmartPay development team.

---

Built with ❤️ by the SmartPay Team
