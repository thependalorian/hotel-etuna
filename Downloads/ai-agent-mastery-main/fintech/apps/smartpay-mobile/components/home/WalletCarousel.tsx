/**
 * WalletCarousel - Smartpay Home Wallets
 * 
 * Figma Specs:
 * - Horizontal FlatList
 * - WalletCard items: 164px width + gap
 * - "Add Wallet" card at end
 * - Gap: 16px between cards
 * - Horizontal padding: 16px
 * 
 * @see Figma Node: Wallet Carousel
 * @location components/home/WalletCarousel.tsx
 */
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { designSystem as DS } from '@/constants/designSystem';
import type { Wallet } from '@/services/wallets';
import { WalletCard } from './WalletCard';

export interface WalletCarouselProps {
  /** Array of wallets to display */
  wallets?: Wallet[];
  /** Callback when wallet is pressed */
  onWalletPress?: (wallet: Wallet) => void;
  /** Callback when Add Wallet card is pressed */
  onAddWallet?: () => void;
  /** Refresh trigger to reload wallets */
  refreshTrigger?: number;
}

/**
 * WalletCarousel component - horizontal scrollable wallet cards
 * 
 * Figma: 164px cards + 16px gap, Add Wallet card at end
 */
export function WalletCarousel({
  wallets = [],
  onWalletPress,
  onAddWallet,
  refreshTrigger,
}: WalletCarouselProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 300);
    }
  }, [refreshTrigger]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={DS.colors.brand.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={DS.components.walletCard.width + 16}
        snapToAlignment="start"
      >
        {wallets.map((wallet, index) => (
          <WalletCard
            key={wallet.id}
            wallet={wallet}
            index={index}
            onPress={() => onWalletPress && onWalletPress(wallet)}
          />
        ))}
        
        {/* Add Wallet Card */}
        {onAddWallet && (
          <TouchableOpacity
            style={styles.addCard}
            onPress={onAddWallet}
            activeOpacity={0.8}
            accessibilityLabel="Add new wallet"
            accessibilityRole="button"
          >
            <View style={styles.addIconCircle}>
              <Ionicons name="add" size={28} color={DS.colors.brand.primary} />
            </View>
            <Text style={styles.addCardText}>Add Wallet</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: DS.spacing.sectionSpacing,
  },
  loadingContainer: {
    height: DS.components.walletCard.height,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: DS.spacing.horizontalPadding,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: DS.spacing.horizontalPadding,
    paddingBottom: 8,
  },
  addCard: {
    width: DS.components.walletCard.width,
    height: DS.components.walletCard.height,
    backgroundColor: DS.colors.background,
    borderRadius: DS.components.walletCard.borderRadius,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: DS.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${DS.colors.brand.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: DS.colors.brand.primary,
  },
});
