/**
 * AuthHeader - Logo + title + subtitle for auth screens
 * Location: fintech/smartpay/components/auth/layout/AuthHeader.tsx
 */
import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { designSystem } from '@/constants/designSystem';

export interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  logoSource?: any;
  showBack?: boolean;
  onBack?: () => void;
  backHref?: string;
  testID?: string;
}

export function AuthHeader({
  title,
  subtitle,
  showLogo = false,
  logoSource,
  showBack = false,
  onBack,
  backHref,
  testID = 'auth-header',
}: AuthHeaderProps) {
  return (
    <View style={styles.container} testID={testID}>
      {showBack && (
        backHref ? (
          <Link href={backHref} asChild>
            <Pressable style={styles.backButton} accessibilityLabel="Go back">
              <Text style={styles.backIcon}>←</Text>
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          </Link>
        ) : (
          <Pressable
            style={styles.backButton}
            onPress={onBack}
            accessibilityLabel="Go back"
          >
            <Text style={styles.backIcon}>←</Text>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        )
      )}
      
      {showLogo && logoSource && (
        <Image source={logoSource} style={styles.logo} resizeMode="contain" />
      )}
      
      <Text style={styles.title}>{title}</Text>
      
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const ds = designSystem;
const { colors, spacing, typography } = ds;
const { brand, neutral } = colors;

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  backIcon: {
    fontSize: 20,
    color: brand.primary,
  },
  backText: {
    fontSize: 15,
    color: brand.primary,
    fontWeight: '600',
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.textStyles.largeTitle,
    color: neutral.text,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: neutral.textSecondary,
  },
});

/**
 * USAGE EXAMPLES:
 * 
 * // Basic
 * <AuthHeader
 *   title="Welcome back"
 *   subtitle="Sign in to your SmartPay account"
 * />
 * 
 * // With logo
 * <AuthHeader
 *   title="Welcome to SmartPay"
 *   subtitle="Your smart financial companion"
 *   showLogo
 *   logoSource={require('@/assets/logo.png')}
 * />
 * 
 * // With back button
 * <AuthHeader
 *   title="Create Account"
 *   showBack
 *   backHref="/"
 * />
 * 
 * // With custom back handler
 * <AuthHeader
 *   title="Verify Phone"
 *   showBack
 *   onBack={() => router.back()}
 * />
 */
