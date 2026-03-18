# Smartpay Onboarding Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SMARTPAY ONBOARDING FLOW                             │
│                        8 Steps • 3 Required • 2 Optional                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│ STEP 1: WELCOME (index.tsx)                                              │
│ Figma: 23:1495                                                            │
├───────────────────────────────────────────────────────────────────────────┤
│ • Logo: 💸                                                                │
│ • Title: "Welcome to Smartpay"                                            │
│ • Description                                                             │
│ • Features: ⚡ 🔒 📱                                                       │
│ • [Get Started] ──────────────────────────────────────────┐              │
│ • Progress: ●○○○○○○○                                      │              │
└───────────────────────────────────────────────────────────┼───────────────┘
                                                            │
                                                            ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ STEP 2: PHONE (phone.tsx) ✅ REQUIRED                                     │
│ Figma: 44:461                                                             │
├───────────────────────────────────────────────────────────────────────────┤
│ • Title: "Tell us your mobile number"                                     │
│ • [← Back] [Skip]                                                         │
│ • Input: +264 [81 234 5678]                                               │
│ • [Verify Number] ────────────────────────────────────────┐              │
│ • Progress: ●●○○○○○○                                      │              │
│ • API: POST /api/v1/auth/send-otp                         │              │
│ • Test: EXPO_PUBLIC_TEST_USER_PHONE                       │              │
└───────────────────────────────────────────────────────────┼───────────────┘
                                                            │
                                                            ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ STEP 3: OTP (otp.tsx) ✅ REQUIRED                                         │
│ Figma: 44:509                                                             │
├───────────────────────────────────────────────────────────────────────────┤
│ • Title: "Can you please verify"                                          │
│ • [← Back]                                                                │
│ • Input: [0] [0] [0] [0] [0] [0]                                          │
│ • [Verify OTP] ───────────────────────────────────────────┐              │
│ • "Resend code" (60s countdown)                           │              │
│ • Progress: ●●●○○○○○                                      │              │
│ • API: POST /api/v1/auth/verify-otp                       │              │
│ • Test OTP: 123456                                        │              │
└───────────────────────────────────────────────────────────┼───────────────┘
                                                            │
                                                            ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ STEP 4: NAME (name.tsx) ✅ REQUIRED                                       │
│ Figma: 45:712                                                             │
├───────────────────────────────────────────────────────────────────────────┤
│ • Title: "Add user's details"                                             │
│ • [← Back]                                                                │
│ • Input: First Name [John]                                                │
│ • Input: Last Name [Doe]                                                  │
│ • [Continue] ─────────────────────────────────────────────┐              │
│ • Progress: ●●●●○○○○                                      │              │
│ • Test: EXPO_PUBLIC_TEST_USER_FIRST_NAME                  │              │
└───────────────────────────────────────────────────────────┼───────────────┘
                                                            │
                                                            ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ STEP 5: PHOTO (photo.tsx) ⚠️ OPTIONAL                                    │
│ Figma: NEW (PRD)                                                          │
├───────────────────────────────────────────────────────────────────────────┤
│ • Title: "Add your photo"                                                 │
│ • [← Back] [Skip]                                                         │
│ • Avatar: 80×80px (initials or photo)                                     │
│ • 📷 [Take Photo]                                                         │
│ • 🖼️  [Choose from Library]                                               │
│ • [Skip] ─────────────────────────────────────────────────┐              │
│ • Progress: ●●●●●○○○                                      │              │
└───────────────────────────────────────────────────────────┼───────────────┘
                                                            │
                                                            ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ STEP 6: PIN (pin.tsx) ✅ REQUIRED                                         │
│ Figma: NEW (PRD)                                                          │
├───────────────────────────────────────────────────────────────────────────┤
│ • Title: "Create your PIN"                                                │
│ • [← Back]                                                                │
│ • Subtitle: "6-digit PIN for transactions"                                │
│ • PIN: [●] [●] [●] [○] [○] [○]                                           │
│ • Step 1: Create → Step 2: Confirm                                        │
│ • [Auto-submit on complete] ──────────────────────────────┐              │
│ • Progress: ●●●●●●○○                                      │              │
│ • API: POST /api/v1/users/pin                             │              │
└───────────────────────────────────────────────────────────┼───────────────┘
                                                            │
                                                            ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ STEP 7: FACEID (faceid.tsx) ⚠️ OPTIONAL                                  │
│ Figma: 45:681                                                             │
├───────────────────────────────────────────────────────────────────────────┤
│ • Title: "Enable Authentication"                                          │
│ • [← Back] [Skip]                                                         │
│ • Icon: Face ID / Fingerprint (96×96 circle)                              │
│ • Benefits list (3 checkmarks)                                            │
│ • [Enable] or [Skip] ─────────────────────────────────────┐              │
│ • Progress: ●●●●●●●○                                      │              │
│ • Test: LocalAuthentication.authenticateAsync()           │              │
└───────────────────────────────────────────────────────────┼───────────────┘
                                                            │
                                                            ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ STEP 8: COMPLETE (complete.tsx) 🎉 FINAL                                 │
│ Figma: 45:818                                                             │
├───────────────────────────────────────────────────────────────────────────┤
│ • Success Badge: 96×96 ✅ (spring animation)                             │
│ • Profile Card:                                                           │
│   - Avatar: 80×80px                                                       │
│   - Name: "John Doe"                                                      │
│   - SmartpayID: "SP-12345678" [📋 Copy]                                  │
│ • Features:                                                               │
│   - 📨 Send money                                                         │
│   - ⬇️  Receive payments                                                  │
│   - 📱 Pay with QR                                                        │
│ • KYC Note: ℹ️  "Complete KYC in Profile..."                             │
│ • [Get Started] ──────────────────────────────────────────┐              │
│ • Progress: ●●●●●●●●                                      │              │
└───────────────────────────────────────────────────────────┼───────────────┘
                                                            │
                                                            ▼
                                              ┌─────────────────────────┐
                                              │   /(tabs)/home          │
                                              │   Main App Experience   │
                                              └─────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
LEGEND
═══════════════════════════════════════════════════════════════════════════════

✅ REQUIRED    = User must complete (cannot skip)
⚠️  OPTIONAL    = User can skip
🎉 FINAL       = Last step before main app
● Active dot   = Current step
○ Inactive dot = Not yet reached
[Button]       = Primary CTA
[← Back]       = Navigation back
[Skip]         = Skip button (optional steps only)

═══════════════════════════════════════════════════════════════════════════════
PROGRESS INDICATOR (OnboardingLayout)
═══════════════════════════════════════════════════════════════════════════════

Step 1: ●○○○○○○○
Step 2: ●●○○○○○○
Step 3: ●●●○○○○○
Step 4: ●●●●○○○○
Step 5: ●●●●●○○○
Step 6: ●●●●●●○○
Step 7: ●●●●●●●○
Step 8: ●●●●●●●● (Complete!)

═══════════════════════════════════════════════════════════════════════════════
SKIP PATHS
═══════════════════════════════════════════════════════════════════════════════

Photo (Step 5):
  Skip → Continue to PIN

Face ID (Step 7):
  Skip → Continue to Complete
  Not Available → Auto-continue to Complete

═══════════════════════════════════════════════════════════════════════════════
ERROR HANDLING PATHS
═══════════════════════════════════════════════════════════════════════════════

OTP Verification:
  3 Failed Attempts → Alert → Navigate back to Phone screen
  Invalid Code → Show inline error + enable Resend

PIN Setup:
  Mismatch → Show error → Clear fields → Return to Create step
  Network Error → Show error → Clear both fields → Return to Create step

API Failures:
  Phone → Inline error: "Failed to send OTP"
  OTP → Toast: "Invalid code"
  PIN → Alert: "Failed to set PIN"

═══════════════════════════════════════════════════════════════════════════════
DATA FLOW (UserContext)
═══════════════════════════════════════════════════════════════════════════════

Phone Screen:
  ↓ setProfile({ phone: "+26481234567" })

OTP Screen:
  ↓ setSmartpayId("SP12345678")

Name Screen:
  ↓ setProfile({ firstName: "John", lastName: "Doe" })

Photo Screen:
  ↓ setProfile({ photoUri: "..." })

PIN Screen:
  ↓ Local state (not stored in UserContext for security)

Complete Screen:
  ↓ AsyncStorage.setItem('smartpay_onboarding_complete', 'true')
  ↓ router.replace('/(tabs)/home')

═══════════════════════════════════════════════════════════════════════════════
DESIGN SYSTEM SPECS
═══════════════════════════════════════════════════════════════════════════════

Layout:
  - Screen Width: 393px (iPhone 14/15)
  - Padding: 16px horizontal
  - Progress Dots: 8px diameter, 8px gap
  - Active Dot: 24px width (elongated)

Components:
  - Button: 56px height, 16px radius
  - Input: 56px height, 999px radius (pill)
  - Avatar: 80×80px (photo, complete)
  - Success Badge: 96×96px (complete only)
  - PIN Cell: 48×56px

Colors:
  - Primary: #020617 (slate-950)
  - Brand: #005D6E (teal)
  - Success: #22C55E (green)
  - Error: #E11D48 (rose)
  - Background: #F8FAFC (slate-50)

Typography:
  - Title: 24px, 600 weight
  - Subtitle: 16px, 400 weight
  - Button: 16px, 600 weight

═══════════════════════════════════════════════════════════════════════════════
