# SmartPay Security Features - Testing Checklist

## Test Environment Setup

### Device Requirements
- [ ] iOS device with Face ID/Touch ID
- [ ] Android device with fingerprint
- [ ] iOS Simulator (for PIN fallback testing)
- [ ] Android Emulator (for PIN fallback testing)

### Prerequisites
- [ ] `npm install` completed
- [ ] Native dependencies built (`npm run ios` / `npm run android`)
- [ ] Test user account created in Supabase
- [ ] Test device has biometric enrolled
- [ ] System haptics enabled

---

## 1. Biometric Authentication Tests

### 1.1 Hardware Detection
- [ ] **Test Case:** Device with biometric hardware
  - **Expected:** Biometric button appears on lock screen
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** Device without biometric hardware
  - **Expected:** Only PIN entry shown
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** iOS Simulator
  - **Expected:** Only PIN entry shown
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

### 1.2 Enrollment Detection
- [ ] **Test Case:** Biometric enrolled
  - **Expected:** Biometric prompt appears automatically
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** Biometric not enrolled
  - **Expected:** Only PIN entry shown
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** Biometric removed after app launch
  - **Expected:** Falls back to PIN on next lock
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

### 1.3 Face ID (iOS)
- [ ] **Test Case:** Face ID success
  - **Expected:** Success haptic → Unlocks immediately
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** Face ID failure
  - **Expected:** Error haptic → Shows alert → PIN option remains
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** Face ID cancelled
  - **Expected:** No haptic → Returns to lock screen
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** Use PIN fallback
  - **Expected:** Dismisses Face ID → Shows PIN entry
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

### 1.4 Touch ID (iOS)
- [ ] **Test Case:** Touch ID success
  - **Expected:** Success haptic → Unlocks immediately
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** Touch ID failure
  - **Expected:** Error haptic → Shows alert → Retry option
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** Touch ID cancelled
  - **Expected:** No haptic → Returns to lock screen
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

### 1.5 Fingerprint (Android)
- [ ] **Test Case:** Fingerprint success
  - **Expected:** Success haptic → Unlocks immediately
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** Fingerprint failure
  - **Expected:** Error haptic → Retry prompt
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** Too many failures
  - **Expected:** Falls back to PIN entry
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

### 1.6 PIN Entry
- [ ] **Test Case:** Enter 6-digit PIN
  - **Expected:** Light haptic on each digit → Auto-submits on 6th
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** Wrong PIN
  - **Expected:** Shake animation → Error haptic → Clears PIN → Shows alert
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** Correct PIN
  - **Expected:** Success haptic → Unlocks immediately
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** PIN masking
  - **Expected:** Shows bullet (•) for each digit
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** PIN focus
  - **Expected:** Auto-focuses on biometric button present
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

### 1.7 Animations
- [ ] **Test Case:** Shake animation smoothness
  - **Expected:** Smooth 60fps shake on wrong PIN
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** Shake animation timing
  - **Expected:** Completes in ~400ms
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

---

## 2. Auto-Lock Tests

### 2.1 Basic Functionality
- [ ] **Test Case:** Lock after 3 seconds
  - **Steps:**
    1. Sign in to app
    2. Go to background
    3. Wait 3+ seconds
    4. Return to app
  - **Expected:** Lock screen appears immediately
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** Don't lock before 3 seconds
  - **Steps:**
    1. Sign in to app
    2. Go to background
    3. Wait <3 seconds
    4. Return to app
  - **Expected:** App resumes normally, no lock screen
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** Don't lock when signed out
  - **Steps:**
    1. Sign out
    2. Go to background
    3. Wait 5+ seconds
    4. Return to app
  - **Expected:** No lock screen, resumes normally
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

### 2.2 Edge Cases
- [ ] **Test Case:** Exactly 3 seconds
  - **Expected:** Locks (≥3000ms triggers lock)
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** Rapid background/foreground
  - **Steps:**
    1. Background → Foreground quickly (repeat 5x)
  - **Expected:** No lock until 3s threshold met
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** App killed and restarted
  - **Expected:** Lock screen on launch if was signed in
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** System reboot
  - **Expected:** No lock on launch (timestamp cleared)
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

### 2.3 Platform-Specific
- [ ] **Test Case:** iOS - Home button
  - **Expected:** Locks after 3s when pressing home
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** iOS - App switcher
  - **Expected:** Locks after 3s when using app switcher
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** iOS - Control Center
  - **Expected:** Doesn't lock (inactive state, not background)
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** Android - Recent apps
  - **Expected:** Locks after 3s
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** Android - Home button
  - **Expected:** Locks after 3s
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** iPad - Split screen
  - **Expected:** Doesn't lock (still active)
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

### 2.4 Navigation
- [ ] **Test Case:** Deep link when locked
  - **Steps:**
    1. Lock app
    2. Tap deep link from another app
  - **Expected:** Shows lock screen first, then navigates
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** Notification tap when locked
  - **Expected:** Shows lock screen first, then notification content
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

---

## 3. Haptic Feedback Tests

### 3.1 Components with Haptics
- [ ] **RoundBtn** (Home screen actions)
  - **Expected:** Light haptic on press
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

- [ ] **Dropdown** (Menu options)
  - **Expected:** Light haptic on open, selection haptic on option
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

- [ ] **AddMoneyModal** (Method selection)
  - **Expected:** Medium haptic on method select
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

- [ ] **BottomSheet** (Modal open)
  - **Expected:** Light haptic on open
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

- [ ] **SuccessScreen** (Success states)
  - **Expected:** Success haptic on mount, medium on button
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

- [ ] **ErrorState** (Error states)
  - **Expected:** Error haptic on mount, medium on retry
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

- [ ] **Lock Screen** (PIN entry)
  - **Expected:** Light on digit, error on wrong, success on correct
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

### 3.2 Haptic Types
- [ ] **Light Impact**
  - **Feel:** Subtle tap
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

- [ ] **Medium Impact**
  - **Feel:** Standard tap
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

- [ ] **Heavy Impact**
  - **Feel:** Strong tap
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

- [ ] **Success Notification**
  - **Feel:** Success pattern (iOS: tap-tap-tap)
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

- [ ] **Error Notification**
  - **Feel:** Error pattern (iOS: buzz-buzz-buzz)
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

- [ ] **Warning Notification**
  - **Feel:** Warning pattern
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

- [ ] **Selection**
  - **Feel:** Light click
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

### 3.3 Device Support
- [ ] **iPhone with Taptic Engine**
  - **Expected:** All haptic types work correctly
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

- [ ] **Android with vibration**
  - **Expected:** Haptics work (may feel different)
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

- [ ] **Device without haptics**
  - **Expected:** No crash, silent failure
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

### 3.4 System Settings
- [ ] **Haptics disabled in system**
  - **Steps:**
    1. Disable system haptics
    2. Test button presses
  - **Expected:** No haptic feedback
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

- [ ] **Reduced motion enabled**
  - **Steps:**
    1. Enable reduced motion
    2. Test all haptics
  - **Expected:** Haptics still work (visual animations reduced)
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

---

## 4. Performance Tests

### 4.1 Battery Impact
- [ ] **Test Case:** 1-hour usage with haptics
  - **Expected:** <5% additional battery drain
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** Compare with haptics disabled
  - **Expected:** Minimal difference
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

### 4.2 Memory
- [ ] **Test Case:** 20 lock/unlock cycles
  - **Expected:** No memory leaks
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** Extended use (2+ hours)
  - **Expected:** Stable memory usage
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

### 4.3 Animations
- [ ] **Test Case:** Shake animation FPS
  - **Expected:** Smooth 60fps
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** Lock screen transition
  - **Expected:** Smooth fade-in
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

- [ ] **Test Case:** BottomSheet animation
  - **Expected:** Smooth slide-up
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A
  - **Notes:**

---

## 5. Accessibility Tests

### 5.1 Screen Reader
- [ ] **Lock screen with VoiceOver**
  - **Expected:** All elements announced correctly
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

- [ ] **Biometric button announced**
  - **Expected:** "Use Face ID" or "Use Touch ID" announced
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

- [ ] **PIN entry accessible**
  - **Expected:** Can enter PIN with VoiceOver
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

### 5.2 Large Text
- [ ] **Lock screen with large text**
  - **Expected:** All text scales, no clipping
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

- [ ] **PIN entry with large text**
  - **Expected:** Digits remain visible
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

### 5.3 Color Contrast
- [ ] **Lock screen in dark mode**
  - **Expected:** Good contrast, readable text
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

- [ ] **Error states visible**
  - **Expected:** Error colors have sufficient contrast
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

---

## 6. Integration Tests

### 6.1 Full Flow
- [ ] **Test Case:** Complete lock/unlock cycle
  - **Steps:**
    1. Sign in
    2. Background for 3s
    3. Foreground
    4. See lock screen
    5. Unlock with biometric
    6. Continue using app
  - **Expected:** Seamless flow, all haptics fire
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

- [ ] **Test Case:** Multiple lock/unlock cycles
  - **Expected:** Consistent behavior
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

### 6.2 Error Scenarios
- [ ] **Test Case:** Biometric fails → Use PIN
  - **Expected:** Smooth fallback
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

- [ ] **Test Case:** Wrong PIN → Retry → Success
  - **Expected:** All haptics and animations work
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

### 6.3 State Management
- [ ] **Test Case:** Lock during transaction
  - **Expected:** Transaction state preserved after unlock
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

- [ ] **Test Case:** Lock during form entry
  - **Expected:** Form data preserved after unlock
  - **Status:** ⬜ Pass | ⬜ Fail | ⬜ N/A

---

## 7. Build Tests

### 7.1 Development Build
- [ ] All features work in development
- [ ] Hot reload works
- [ ] No console errors

### 7.2 Production Build
- [ ] All features work in production
- [ ] No debug logs
- [ ] Performance optimized

### 7.3 Platforms
- [ ] iOS device
- [ ] iOS simulator
- [ ] Android device
- [ ] Android emulator

---

## Test Summary

**Total Tests:** 100+  
**Passed:** ___  
**Failed:** ___  
**N/A:** ___  

**Critical Issues:**
1. 
2. 
3. 

**Non-Critical Issues:**
1. 
2. 
3. 

**Notes:**


**Tested By:** ________________  
**Date:** ________________  
**Build Version:** ________________  
**Device(s):** ________________
