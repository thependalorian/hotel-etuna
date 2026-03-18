/**
 * AuthScreenShell - High-level reusable shell for auth flows (identifier + CTA).
 * Location: fintech/smartpay/components/auth/layout/AuthScreenShell.tsx
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AuthContainer } from './AuthContainer';
import { AuthHeader } from './AuthHeader';
import { AuthButton } from '../buttons/AuthButton';
import { designSystem } from '@/constants/designSystem';

export interface AuthScreenShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  primaryLabel: string;
  primaryLoadingLabel?: string;
  onPrimaryPress: () => void;
  primaryDisabled?: boolean;
  loading?: boolean;
  footer?: React.ReactNode;
}

export function AuthScreenShell({
  title,
  subtitle,
  children,
  primaryLabel,
  primaryLoadingLabel,
  onPrimaryPress,
  primaryDisabled,
  loading,
  footer,
}: AuthScreenShellProps) {
  return (
    <AuthContainer>
      <AuthHeader title={title} subtitle={subtitle} />
      <View style={styles.formSection}>{children}</View>
      <AuthButton
        title={loading ? primaryLoadingLabel ?? primaryLabel : primaryLabel}
        onPress={onPrimaryPress}
        loading={!!loading}
        disabled={primaryDisabled || loading}
      />
      {footer && <View style={styles.footer}>{footer}</View>}
    </AuthContainer>
  );
}

const ds = designSystem;
const { spacing } = ds;

const styles = StyleSheet.create({
  formSection: {
    gap: spacing.md,
  },
  footer: {
    marginTop: spacing.lg,
  },
});

