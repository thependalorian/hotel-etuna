/**
 * Onboarding PIN Screen - Smartpay
 * Figma: NEW from PRD (Required step)
 * 
 * Flow: welcome → phone → otp → name → photo → pin → faceid → complete
 * Step 6 of 8
 * 
 * Features:
 * - Title: "Create your PIN"
 * - Subtitle: "6-digit PIN for transactions"
 * - PIN dots (6 dots, 12px per Figma)
 * - Numeric keypad (simulated via react-native-confirmation-code-field)
 * - Confirm PIN screen
 * - API: POST /api/v1/users/pin
 * 
 * Location: mobile/app/onboarding/pin.tsx
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { CodeField, Cursor, useBlurOnFulfill, useClearByFocusCell } from 'react-native-confirmation-code-field';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '@/components/layout';
import { designSystem } from '@/constants/designSystem';
import { setupPIN } from '@/services/twoFactorAuth';
import { getAuthHeader } from '@/services/auth';

const PIN_LENGTH = 6;
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

export default function OnboardingPinScreen() {
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refCreate = useBlurOnFulfill({ value: pin, cellCount: PIN_LENGTH });
  const [propsCreate, getCellOnLayoutHandlerCreate] = useClearByFocusCell({ value: pin, setValue: setPin });
  const refConfirm = useBlurOnFulfill({ value: confirmPin, cellCount: PIN_LENGTH });
  const [propsConfirm, getCellOnLayoutHandlerConfirm] = useClearByFocusCell({ value: confirmPin, setValue: setConfirmPin });

  useEffect(() => {
    if (step === 'create' && pin.length === PIN_LENGTH) {
      setError(null);
      setStep('confirm');
      setConfirmPin('');
    }
  }, [step, pin]);

  useEffect(() => {
    if (step === 'confirm' && confirmPin.length === PIN_LENGTH) {
      if (confirmPin !== pin) {
        setError('PINs do not match');
        setConfirmPin('');
        return;
      }
      setError(null);
      handleSubmit();
    }
  }, [step, confirmPin, pin]);

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await setupPIN(confirmPin);
      if (!result.success) {
        setError(result.error ?? 'Failed to set PIN');
        setConfirmPin('');
        setPin('');
        setStep('create');
        return;
      }
      if (API_BASE) {
        try {
          const headers = await getAuthHeader();
          const res = await fetch(`${API_BASE}/api/v1/users/pin`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: confirmPin }),
          });
          if (!res.ok && res.status !== 404) {
            const data = await res.json().catch(() => ({}));
            console.warn('Backend PIN sync failed:', data.error || res.status);
          }
        } catch (e) {
          console.warn('Backend PIN sync error:', e);
        }
      }
          router.push('/onboarding/faceid');
    } catch (e) {
      setError('Something went wrong. Please try again.');
      setConfirmPin('');
      setPin('');
      setStep('create');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('create');
      setConfirmPin('');
      setError(null);
    } else {
      router.back();
    }
  };

  const renderCodeField = (
    ref: React.RefObject<any>,
    props: any,
    value: string,
    setValue: (v: string) => void,
    getCellOnLayoutHandler: (i: number) => (event: any) => void
  ) => (
    <CodeField
      ref={ref}
      {...props}
      value={value}
      onChangeText={(t: string) => {
        setError(null);
        setValue(t.replace(/\D/g, '').slice(0, PIN_LENGTH));
      }}
      cellCount={PIN_LENGTH}
      rootStyle={styles.codeFieldRoot}
      keyboardType="number-pad"
      textContentType="oneTimeCode"
      renderCell={({ index, symbol, isFocused }) => (
        <View
          key={index}
          style={[styles.cell, isFocused && styles.focusCell]}
          onLayout={getCellOnLayoutHandler(index)}
        >
          <Text style={styles.cellText}>
            {symbol ? '●' : isFocused ? <Cursor /> : null}
          </Text>
        </View>
      )}
    />
  );

  return (
    <OnboardingLayout
      currentStep={6}
      totalSteps={8}
      screenTitle={step === 'create' ? 'Create your PIN' : 'Confirm your PIN'}
      screenSubtitle={
        step === 'create'
          ? '6-digit PIN for transactions'
          : 'Enter your PIN again to confirm'
      }
      onBack={handleBack}
    >
      <View style={styles.fieldRow}>
        {step === 'create'
          ? renderCodeField(refCreate, propsCreate, pin, setPin, getCellOnLayoutHandlerCreate)
          : renderCodeField(refConfirm, propsConfirm, confirmPin, setConfirmPin, getCellOnLayoutHandlerConfirm)}
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={20} color={designSystem.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      {loading ? (
        <ActivityIndicator size="large" color={designSystem.colors.primary} style={styles.loader} />
      ) : (
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel={step === 'confirm' ? 'Go back' : 'Cancel'}
        >
          <Text style={styles.backButtonText}>{step === 'confirm' ? 'Back' : 'Cancel'}</Text>
        </TouchableOpacity>
      )}
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  fieldRow: {
    marginTop: designSystem.spacing.xl ?? 24,
  },
  codeFieldRoot: {
    gap: designSystem.spacing.sm ?? 8,
  },
  cell: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: designSystem.colors.border ?? '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusCell: {
    borderColor: designSystem.colors.primary,
  },
  cellText: {
    ...designSystem.typography.textStyles?.body,
    fontSize: 24,
    color: designSystem.colors.text,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: designSystem.spacing.md ?? 16,
  },
  errorText: {
    ...designSystem.typography.textStyles?.body,
    color: designSystem.colors.error,
  },
  loader: {
    marginTop: designSystem.spacing.xl ?? 24,
  },
  backButton: {
    marginTop: designSystem.spacing.xl ?? 24,
    alignItems: 'center',
  },
  backButtonText: {
    ...designSystem.typography.textStyles?.body,
    color: designSystem.colors.textSecondary,
    fontWeight: '600',
  },
});
