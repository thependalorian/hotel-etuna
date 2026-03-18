/**
 * OtpScreen - Reusable OTP verification screen for auth flows.
 * Location: fintech/smartpay/components/auth/layout/OtpScreen.tsx
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AuthContainer } from './AuthContainer';
import { AuthHeader } from './AuthHeader';
import { OTPInput } from '../inputs/OTPInput';
import { AuthButton } from '../buttons/AuthButton';
import { designSystem } from '@/constants/designSystem';

export interface OtpScreenProps {
  title: string;
  subtitle: string;
  code: string;
  onChangeCode: (code: string) => void;
  error?: string;
  loading?: boolean;
  onSubmit: () => void;
  onResend?: () => void;
  resendLabel?: string;
}

export function OtpScreen({
  title,
  subtitle,
  code,
  onChangeCode,
  error,
  loading,
  onSubmit,
  onResend,
  resendLabel = 'Resend code',
}: OtpScreenProps) {
  return (
    <AuthContainer>
      <AuthHeader title={title} subtitle={subtitle} />
      <View style={styles.body}>
        <OTPInput
          value={code}
          onChangeText={onChangeCode}
          onComplete={() => onSubmit()}
          error={error}
        />
        <AuthButton
          title={loading ? 'Verifying...' : 'Verify'}
          onPress={onSubmit}
          loading={!!loading}
          disabled={code.length !== 6 || loading}
        />
        {onResend && (
          <View style={styles.resend}>
            <AuthButton
              title={resendLabel}
              onPress={onResend}
              variant="ghost"
              size="small"
              fullWidth={false}
            />
          </View>
        )}
      </View>
    </AuthContainer>
  );
}

const ds = designSystem;
const { spacing } = ds;

const styles = StyleSheet.create({
  body: {
    gap: spacing.lg,
  },
  resend: {
    alignItems: 'center',
  },
});

