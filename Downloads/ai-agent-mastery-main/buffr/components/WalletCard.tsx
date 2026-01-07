/**
 * WalletCard Component
 * 
 * Location: components/WalletCard.tsx
 * Purpose: Reusable wallet card component
 * 
 * Displays individual wallet with icon, name, and balance
 * Supports both simple card view and detailed wallet view
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { Wallet } from '@/contexts/WalletsContext';
import CardFrame from '@/components/cards/CardFrame';

interface WalletCardProps {
  // Simple props (for list view)
  name?: string;
  balance?: number | string;
  currency?: string;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  iconColor?: string;
  backgroundColor?: string;
  width?: number;
  // Detailed props (for wallet overview)
  wallet?: Wallet;
  showBalance?: boolean;
  onToggleBalance?: () => void;
}

export default function WalletCard({
  name,
  balance,
  currency = 'N$',
  icon = 'credit-card',
  iconColor = Colors.primary,
  backgroundColor,
  width,
  wallet,
  showBalance = true,
  onToggleBalance,
}: WalletCardProps) {
  const [isBalanceVisible, setIsBalanceVisible] = useState(showBalance);

  // Use wallet object if provided, otherwise use individual props
  const walletName = wallet?.name || name || 'Wallet';
  const walletBalance = wallet?.balance || (typeof balance === 'number' ? balance : 0);
  const walletCurrency = wallet?.currency || currency || 'N$';
  const walletIcon = wallet?.icon || icon || 'credit-card';
  const displayBalance = isBalanceVisible
    ? `${walletCurrency} ${walletBalance.toLocaleString()}`
    : `${walletCurrency} XXX`;

  // If wallet object is provided, show detailed card view with custom design
  if (wallet) {
    return (
      <View style={styles.detailedCardContainer}>
        <CardFrame
          frameNumber={wallet.cardDesign || 2}
          cardNumber={`1234 5678 9012 ${wallet.cardNumber || '1234'}`}
          cardholderName={wallet.cardholderName || walletName}
          expiryDate={wallet.expiryDate || '12/25'}
        />
        <View style={styles.cardInfoOverlay}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{walletName}</Text>
            {onToggleBalance && (
              <TouchableOpacity
                onPress={() => {
                  setIsBalanceVisible(!isBalanceVisible);
                  onToggleBalance?.();
                }}
                style={styles.eyeButton}
              >
                <FontAwesome
                  name={isBalanceVisible ? 'eye' : 'eye-slash'}
                  size={20}
                  color={Colors.white}
                />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.cardBalanceLabel}>Balance</Text>
          <Text style={styles.cardBalance}>{displayBalance}</Text>
        </View>
      </View>
    );
  }

  // Simple card view for list
  const displayBalanceSimple = typeof balance === 'number' 
    ? balance.toLocaleString() 
    : balance || '0';

  // Get icon - prefer wallet icon from wallet object, then prop icon
  const walletIconName = wallet?.icon || icon;

  return (
    <View style={[styles.walletCard, { width }, backgroundColor && { backgroundColor }]}>
      <View style={styles.walletCardContent}>
        <View 
          style={[
            styles.walletIconContainer, 
            { backgroundColor: backgroundColor || Colors.primaryLight + '30' }
          ]}
        >
          <FontAwesome name={walletIconName as any} size={24} color={iconColor} />
        </View>
        <Text style={styles.walletName}>{walletName}</Text>
        <Text style={styles.walletBalance}>
          {walletCurrency} {displayBalanceSimple}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  walletCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginRight: 12,
    minHeight: 120,
  },
  walletCardContent: {
    alignItems: 'center',
    gap: 8,
  },
  walletIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  walletIconEmoji: {
    fontSize: 28,
  },
  walletName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  walletBalance: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  detailedCardContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  cardInfoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 24,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  eyeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBalanceLabel: {
    fontSize: 14,
    color: Colors.white + 'CC',
    marginBottom: 8,
  },
  cardBalance: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
  },
});
