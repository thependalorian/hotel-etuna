/**
 * SmartpayLogo – Our logo using brand colors.
 * Uses the Ketchup logo asset tinted with designSystem brand colors so the app is clearly ours.
 * Location: fintech/smartpay/components/SmartpayLogo.tsx
 */
import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { designSystem } from '@/constants/designSystem';

interface SmartpayLogoProps {
  /** Size in pixels (width and height). Default 44. */
  size?: number;
  /** Show "Smartpay" text next to the icon. Default false. */
  showWordmark?: boolean;
  /** Use primary brand color for tint and text. Default true. */
  useBrandColor?: boolean;
}

const primary = designSystem.colors.brand.primary;

export function SmartpayLogo({ size = 44, showWordmark = false, useBrandColor = true }: SmartpayLogoProps) {
  const tint = useBrandColor ? primary : undefined;

  return (
    <View style={styles.wrap}>
      <Image
        source={require('@/assets/images/ketchup-logo.png')}
        style={[styles.logo, { width: size, height: size }, tint ? { tintColor: tint } : undefined]}
        resizeMode="contain"
        accessibilityLabel="Smartpay logo"
      />
      {showWordmark && (
        <Text style={[styles.wordmark, useBrandColor && { color: primary }]}>
          Smartpay
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designSystem.spacing.sm,
  },
  logo: {},
  wordmark: {
    ...designSystem.typography.textStyles.titleLg,
    fontWeight: '700',
    color: designSystem.colors.neutral.text,
  },
});
