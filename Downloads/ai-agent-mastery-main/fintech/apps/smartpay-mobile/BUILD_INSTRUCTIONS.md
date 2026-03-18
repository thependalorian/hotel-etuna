# SmartPay Mobile - Build Instructions

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Development Builds](#development-builds)
3. [Production Builds](#production-builds)
4. [Platform-Specific Instructions](#platform-specific-instructions)
5. [Troubleshooting](#troubleshooting)
6. [Build Profiles](#build-profiles)

---

## Prerequisites

### Required Software

#### All Platforms
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher (or yarn/pnpm)
- **Expo CLI**: Install globally or use npx
  ```bash
  npm install -g expo-cli
  ```

#### iOS Development (macOS only)
- **Xcode**: Latest stable version
  - Download from Mac App Store
  - Install Command Line Tools:
    ```bash
    xcode-select --install
    ```
- **CocoaPods**: Install via Homebrew
  ```bash
  brew install cocoapods
  ```
- **iOS Simulator**: Installed with Xcode

#### Android Development
- **Android Studio**: Latest stable version
  - Download from https://developer.android.com/studio
- **Android SDK**: API Level 33 or higher
- **Java Development Kit (JDK)**: v11 or higher
- **Android Emulator**: Set up in Android Studio

#### Production Builds
- **EAS CLI**: For managed builds
  ```bash
  npm install -g eas-cli
  ```
- **Expo Account**: Create at https://expo.dev

### Environment Setup

1. **Install Dependencies**
   ```bash
   cd /Users/georgenekwaya/Downloads/ai-agent-mastery-main/fintech/smartpay/mobile
   npm install
   ```

2. **Configure Environment Variables**
   ```bash
   # Copy example env file
   cp .env.example .env
   
   # Edit .env with your configuration
   # Make sure to set:
   # - EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
   # - EXPO_PUBLIC_API_BASE_URL
   # - EXPO_PUBLIC_SUPABASE_URL
   # - EXPO_PUBLIC_SUPABASE_ANON_KEY
   ```

3. **Install iOS Pods (macOS only)**
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Verify Setup**
   ```bash
   # Check Expo configuration
   npx expo config
   
   # Verify TypeScript (should pass before building)
   npx tsc --noEmit
   ```

---

## Development Builds

### Start Expo Development Server

#### Standard Development Mode
```bash
npm start
# or
npx expo start
```

**Opens:** Metro bundler with QR code for Expo Go app

**Options in Terminal:**
- Press `a` → Open on Android emulator
- Press `i` → Open on iOS simulator (macOS only)
- Press `w` → Open in web browser
- Press `r` → Reload app
- Press `m` → Toggle menu

#### Development Server with Options
```bash
# Clear cache
npx expo start --clear

# Specific platform
npx expo start --android
npx expo start --ios
npx expo start --web

# Production mode (minified)
npx expo start --no-dev --minify

# Offline mode
npx expo start --offline

# Custom port
npx expo start --port 8081
```

### iOS Development Build

#### Using Expo Go (Quick Testing)
```bash
npm start
# Scan QR code with iPhone Camera or Expo Go app
```

#### Native Development Build
```bash
# First time setup - install iOS dependencies
cd ios && pod install && cd ..

# Build and run on simulator
npm run ios
# or
npx expo run:ios

# Specific simulator
npx expo run:ios --device "iPhone 15 Pro"

# Physical device
npx expo run:ios --device
```

**Requirements:**
- Xcode must be installed
- iOS Simulator must be running or connected device
- Apple Developer account (for physical devices)

### Android Development Build

#### Using Expo Go (Quick Testing)
```bash
npm start
# Scan QR code with Expo Go app on Android
```

#### Native Development Build
```bash
# Build and run on emulator
npm run android
# or
npx expo run:android

# Specific emulator
npx expo run:android --device "Pixel_7_API_33"

# Physical device (USB debugging enabled)
npx expo run:android --device
```

**Requirements:**
- Android Studio must be installed
- Android Emulator must be running or device connected
- USB debugging enabled (for physical devices)

### Web Development Build

```bash
npm run web
# or
npx expo start --web
```

**Opens:** Browser at http://localhost:8081

**Note:** Not all React Native features work on web. Check compatibility.

---

## Production Builds

### Using EAS Build (Recommended)

#### Initial Setup
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure EAS for project
eas build:configure
```

This creates `eas.json` with build profiles.

#### iOS Production Build

```bash
# Build for App Store
eas build --platform ios --profile production

# Build for TestFlight
eas build --platform ios --profile preview

# Build for development
eas build --platform ios --profile development
```

**Requirements:**
- Apple Developer account ($99/year)
- App Store Connect access
- iOS Distribution Certificate
- Provisioning Profiles

**Artifacts:** `.ipa` file for App Store submission

#### Android Production Build

```bash
# Build for Google Play Store (AAB)
eas build --platform android --profile production

# Build APK for testing
eas build --platform android --profile preview

# Build development APK
eas build --platform android --profile development
```

**Requirements:**
- Google Play Developer account ($25 one-time)
- Keystore for signing (EAS can generate)
- Service account credentials (for automated uploads)

**Artifacts:** `.aab` (App Bundle) or `.apk` file

#### Build Both Platforms
```bash
# Production builds for iOS and Android
eas build --platform all --profile production
```

### Local Production Builds (Advanced)

#### iOS Local Build
```bash
# Build archive
cd ios
xcodebuild -workspace smartpay.xcworkspace \
  -scheme smartpay \
  -configuration Release \
  -archivePath ./build/smartpay.xcarchive \
  archive

# Export IPA
xcodebuild -exportArchive \
  -archivePath ./build/smartpay.xcarchive \
  -exportPath ./build \
  -exportOptionsPlist ExportOptions.plist

cd ..
```

#### Android Local Build
```bash
# Create release APK
cd android
./gradlew assembleRelease

# Create release AAB (for Play Store)
./gradlew bundleRelease

cd ..
```

**Outputs:**
- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

---

## Platform-Specific Instructions

### iOS Specific

#### Simulator Management
```bash
# List available simulators
xcrun simctl list devices

# Boot simulator
xcrun simctl boot "iPhone 15 Pro"

# Open Simulator app
open -a Simulator

# Install on simulator
xcrun simctl install booted path/to/smartpay.app

# Uninstall from simulator
xcrun simctl uninstall booted com.thependalorian.smartpay
```

#### Code Signing Issues
```bash
# Clear derived data
rm -rf ~/Library/Developer/Xcode/DerivedData

# Reset provisioning profiles
rm -rf ~/Library/MobileDevice/Provisioning\ Profiles

# Reinstall pods
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
```

#### Update Pods
```bash
cd ios
pod repo update
pod update
cd ..
```

### Android Specific

#### Emulator Management
```bash
# List available AVDs
emulator -list-avds

# Start emulator
emulator -avd Pixel_7_API_33 &

# Check connected devices
adb devices

# Install APK on device
adb install android/app/build/outputs/apk/release/app-release.apk

# Uninstall from device
adb uninstall com.thependalorian.smartpay
```

#### Clean Build
```bash
cd android
./gradlew clean
./gradlew --stop
cd ..
```

#### Gradle Issues
```bash
# Fix Gradle daemon
cd android
./gradlew --stop
./gradlew clean
cd ..

# Clear Gradle cache
rm -rf ~/.gradle/caches/
```

#### Enable USB Debugging
1. Go to Settings → About Phone
2. Tap "Build Number" 7 times
3. Go to Settings → Developer Options
4. Enable "USB Debugging"

---

## Build Profiles

### Recommended `eas.json` Configuration

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "APP_ENV": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "APP_ENV": "staging"
      }
    },
    "production": {
      "distribution": "store",
      "env": {
        "APP_ENV": "production"
      },
      "ios": {
        "bundleIdentifier": "com.thependalorian.smartpay"
      },
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890"
      },
      "android": {
        "serviceAccountKeyPath": "./service-account.json",
        "track": "production"
      }
    }
  }
}
```

---

## Troubleshooting

### Common Issues

#### 1. Metro Bundler Port Conflict
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Start on different port
npx expo start --port 8082
```

#### 2. "Unable to resolve module" Errors
```bash
# Clear Metro cache
npx expo start --clear

# Clear watchman (macOS)
watchman watch-del-all

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### 3. iOS Build Failures
```bash
# Clean Xcode build
cd ios
xcodebuild clean
cd ..

# Reinstall pods
cd ios
rm -rf Pods Podfile.lock
pod deintegrate
pod install
cd ..

# Clear derived data
rm -rf ~/Library/Developer/Xcode/DerivedData
```

#### 4. Android Build Failures
```bash
# Clean Gradle build
cd android
./gradlew clean
./gradlew --stop
cd ..

# Clear Android build cache
cd android
rm -rf app/build
rm -rf .gradle
cd ..
```

#### 5. TypeScript Errors During Build
```bash
# Run type check
npx tsc --noEmit

# See PRE_BUILD_CHECKLIST.md for fixing 479 type errors
```

#### 6. Environment Variables Not Loading
```bash
# Restart Metro bundler after changing .env
# Kill bundler (Ctrl+C) and run:
npx expo start --clear
```

#### 7. Simulator/Emulator Not Found
```bash
# iOS - Open Simulator first
open -a Simulator

# Android - List and start emulator
emulator -list-avds
emulator -avd Pixel_7_API_33 &

# Then run build
npm run ios  # or npm run android
```

#### 8. Code Signing Errors (iOS)
- Open `ios/smartpay.xcworkspace` in Xcode
- Select target → Signing & Capabilities
- Select your development team
- Xcode will auto-generate provisioning profile

#### 9. Dependency Version Conflicts
```bash
# Use exact versions from package-lock.json
npm ci

# Or clean install
rm -rf node_modules package-lock.json
npm install
```

#### 10. Expo Go Incompatibility
If using native modules (e.g. Supabase):
```bash
# Cannot use Expo Go - need development build
npx expo run:ios
# or
npx expo run:android
```

### Getting Help

- **Expo Docs**: https://docs.expo.dev
- **React Native Docs**: https://reactnative.dev
- **Expo Forums**: https://forums.expo.dev
- **Stack Overflow**: Tag with `expo` or `react-native`
- **GitHub Issues**: Check project's issue tracker

---

## Build Checklist

### Before Every Build

- [ ] Pull latest changes from git
- [ ] Run `npm install` to update dependencies
- [ ] Verify `.env` has correct values
- [ ] Run `npx tsc --noEmit` (should pass with 0 errors)
- [ ] Run tests: `npm test`
- [ ] Update version in `app.json`

### Before Production Release

- [ ] All TypeScript errors resolved (currently 479 errors)
- [ ] All tests passing
- [ ] Update API URLs to production endpoints
- [ ] Remove test/debug code
- [ ] Update app icons and splash screens
- [ ] Review app permissions
- [ ] Test on physical devices (iOS and Android)
- [ ] Update version and build number
- [ ] Create release notes
- [ ] Tag release in git

---

## Quick Reference

### Essential Commands

```bash
# Development
npm start                           # Start Expo dev server
npm run ios                         # Run on iOS simulator
npm run android                     # Run on Android emulator
npm run web                         # Run in web browser

# Testing
npm test                           # Run Jest tests
npm run test:watch                 # Run tests in watch mode
npm run test:coverage              # Run tests with coverage

# Type Checking
npx tsc --noEmit                   # Check TypeScript errors

# Production Builds
eas build --platform ios           # Build iOS app
eas build --platform android       # Build Android app
eas build --platform all           # Build both platforms

# Deployment
eas submit --platform ios          # Submit to App Store
eas submit --platform android      # Submit to Play Store

# Maintenance
npm install                        # Install dependencies
npx expo install --fix            # Fix dependency compatibility
npx expo upgrade                   # Upgrade Expo SDK
```

### Build Status Check

```bash
# Check if ready to build
./scripts/pre-build-check.sh

# Or manually:
echo "Checking build readiness..."
[ -d "node_modules" ] && echo "✅ Dependencies installed" || echo "❌ Run npm install"
[ -f ".env" ] && echo "✅ Environment configured" || echo "❌ Create .env file"
npx tsc --noEmit && echo "✅ TypeScript OK" || echo "❌ Fix TypeScript errors"
npx expo config > /dev/null && echo "✅ Expo config valid" || echo "❌ Check app.json"
```

---

## Next Steps

1. **Fix Critical Issues**: See `PRE_BUILD_CHECKLIST.md`
2. **Resolve TypeScript Errors**: 479 errors must be fixed
3. **Set Up ESLint**: Configure and run linting
4. **Run Tests**: Verify all tests pass
5. **Test on Devices**: Physical iOS and Android devices
6. **Set Up CI/CD**: Automate builds and deployments

---

**Last Updated**: March 17, 2026  
**App Version**: 1.0.0  
**Expo SDK**: ~55.0.6  
**React Native**: 0.83.2
