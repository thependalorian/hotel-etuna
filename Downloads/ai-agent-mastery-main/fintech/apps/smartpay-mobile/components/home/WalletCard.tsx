/**
 * WalletCard - Smartpay Home Carousel
 * 
 * Figma Specs:
 * - Size: 164×140px
 * - Border Radius: 16px
 * - Padding: 16px
 * - Accent Bar: 4px height at top
 * - Icon: 40px circular with 999px radius
 * - Name: 14px weight 600
 * - Balance: 18px weight 700
 * - Progress Bar: 4px height (optional)
 * - Shadow: sm
 * 
 * @see Figma Node: WalletCard Molecule
 * @location components/home/WalletCard.tsx
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { designSystem as DS } from '@/constants/designSystem';
import type { Wallet } from '@/services/wallets';
import { getWalletCardFill } from '@/constants/CardDesign';
import { getWalletIcon, getWalletProgress } from '@/utils/walletDisplay';

export interface WalletCardComponentProps {
  wallet: Wallet;
  index: number;
  onPress: () => void;
}

// Map a wallet type to an Ionicons icon name
function getIoniconName(wallet: Wallet): React.ComponentProps<typeof Ionicons>['name'] {
  const t = ((wallet as any).type ?? '').toLowerCase();
  if (t.includes('saving')) return 'wallet-outline';
  if (t.includes('business')) return 'briefcase-outline';
  if (t.includes('loan')) return 'cash-outline';
  return 'card-outline';
}

/**
 * WalletCard component - card for wallet carousel
 * 
 * Figma: 164×140px, 16px radius, 40px icon circle
 */
export function WalletCard({ wallet, index, onPress }: WalletCardComponentProps) {
  const progress = getWalletProgress(wallet);
  const accentColor = getWalletCardFill((wallet as any).cardDesignFrameId, index);
  const barPercent = progress?.percent ?? 0;
  const iconBg = `${accentColor}26`; // 15% opacity tint

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityLabel={`Wallet ${wallet.name}, balance N$${wallet.balance.toFixed(2)}${progress ? `, ${progress.percent}% of goal` : ''}`}
      accessibilityRole="button"
    >
      {/* Top accent bar - 4px height, Figma spec */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      <View style={styles.body}>
        {/* Icon - 40px circular (Figma iconCircle) */}
        <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
          <Ionicons name={getIoniconName(wallet)} size={24} color={accentColor} />
        </View>

        {/* Name - 14px weight 600 (Figma) */}
        <Text style={styles.name} numberOfLines={1}>
          {wallet.name}
        </Text>

        {/* Balance - 18px weight 700 (Figma) */}
        <Text style={styles.balance}>
          N${wallet.balance.toLocaleString('en-NA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>

        {/* Progress bar - 4px height (Figma, optional) */}
        {progress && (
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: accentColor, width: `${Math.min(barPercent, 100)}%` },
              ]}
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: DS.components.walletCard.width,
    height: DS.components.walletCard.height,
    backgroundColor: DS.colors.background,
    borderRadius: DS.components.walletCard.borderRadius,
    overflow: 'hidden',
    ...DS.shadows.sm,
  },
  accentBar: {
    height: DS.components.walletCard.accentBarHeight,
    width: '100%',
  },
  body: {
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: DS.components.walletCard.iconSize,
    height: DS.components.walletCard.iconSize,
    borderRadius: DS.components.walletCard.iconCircleRadius,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: DS.colors.text,
    marginBottom: 4,
  },
  balance: {
    fontSize: 18,
    fontWeight: '700',
    color: DS.colors.text,
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    backgroundColor: DS.colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
