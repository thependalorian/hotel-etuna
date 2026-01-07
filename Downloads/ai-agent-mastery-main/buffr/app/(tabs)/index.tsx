/**
 * Buffr Home Screen
 * 
 * Location: app/(tabs)/index.tsx
 * Purpose: Main home screen displaying account balance, card, and wallets
 * 
 * Based on Buffr App Design
 * Uses reusable components from components folder
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';
import { useWallets } from '@/contexts/WalletsContext';
import { useUser } from '@/contexts/UserContext';
import {
  SearchBar,
  BalanceDisplay,
  WalletCard,
  AddWalletCard,
  UtilityButton,
  ActionButton,
  AccountQuickView,
} from '@/components';
import { useCards } from '@/contexts/CardsContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Real Estate Constants - Spacing for distinct sections
const HORIZONTAL_PADDING = 20;
const SECTION_SPACING = 32;
const LARGE_SECTION_SPACING = 40;
const WALLET_CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - 24) / 3;
const UTILITY_BUTTON_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - 24) / 3;

export default function HomeScreen() {
  const router = useRouter();
  const { wallets, fetchWallets } = useWallets();
  const { user, preferences, fetchUser, toggleBalanceVisibility, loading: userLoading } = useUser();
  const { fetchCards } = useCards();

  useEffect(() => {
    fetchWallets();
    fetchUser();
    fetchCards();
  }, [fetchWallets, fetchUser, fetchCards]);

  // Get balance from user context or default to 0
  const balance = user?.buffrCardBalance ?? 0;
  const currency = user?.currency ?? preferences.currency ?? 'N$';

  const handleNotificationPress = () => {
    // Navigate to notifications
    console.log('Notifications pressed');
  };

  const handleProfilePress = () => {
    // Navigate to profile screen
    router.push('/profile');
  };

  const handleAddFunds = () => {
    // Navigate to cards screen to add a card
    router.push('/cards');
  };

  const handleAddCard = () => {
    // Navigate to add card screen
    router.push('/add-card');
  };

  const handleAccountPress = (accountId: string, type: 'buffr' | 'card') => {
    if (type === 'card') {
      // Navigate to card details/management
      router.push(`/cards/${accountId}`);
    } else {
      // Buffr main account - navigate to account details screen
      router.push('/cards/buffr-account');
    }
  };

  const handleAddWallet = () => {
    router.push('/add-wallet');
  };

  const handleWalletPress = (walletId: string) => {
    router.push(`/wallets/${walletId}`);
  };

  const handleUtilityPress = (utilityName: string) => {
    // Handle utility button press
    console.log(`${utilityName} pressed`);
  };

  const handleSendPress = () => {
    // Navigate to send money screen
    router.push('/send-money/select-recipient');
  };

  const handleScanPress = () => {
    // Navigate to standalone QR scanner (separate from send-money flow)
    router.push('/qr-scanner');
  };

  // Generate Buffr account number (same as AccountQuickView)
  const getBuffrAccountNumber = (): string => {
    if (!user) return '018';
    const identifier = user.id || user.email || user.phoneNumber || '018';
    const hash = identifier.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return String(hash % 1000).padStart(3, '0');
  };

  return (
    <View style={defaultStyles.containerFull}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
        scrollEnabled={true}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <SearchBar
            onNotificationPress={handleNotificationPress}
            onProfilePress={handleProfilePress}
          />
        </View>

        {/* Buffr Account Section */}
        <View style={styles.accountSection}>
          {/* Account Quick View - Centered */}
          <AccountQuickView
            onAddCard={handleAddCard}
            onAccountPress={handleAccountPress}
          />

          {/* Balance Display */}
          <BalanceDisplay
            balance={balance}
            currency={currency}
            showBalance={preferences.showBalance}
            onShowToggle={toggleBalanceVisibility}
            onAddFunds={handleAddFunds}
          />
        </View>

        {/* Buffr Card Section with Gradient Background - Centered */}
        <View style={styles.cardSectionWrapper}>
          <View style={styles.gradientBlob} />
          <View style={styles.cardSection}>
            <View style={styles.cardContainer}>
              <View style={styles.cardPreview}>
                <View style={styles.cardVisual}>
                  <View style={styles.cardGradient} />
                </View>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>Buffr Card</Text>
                <Text style={styles.cardNumber}>...{getBuffrAccountNumber()}</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/cards/buffr-account')}
                activeOpacity={0.7}
              >
                <Text style={styles.viewLink}>View {'>'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Wallets Section */}
        <View style={styles.walletsSection}>
          <Text style={styles.sectionTitle}>Wallets</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.walletsScrollContent}
          >
            {wallets.map((wallet) => (
              <TouchableOpacity
                key={wallet.id}
                onPress={() => handleWalletPress(wallet.id)}
              >
                <WalletCard
                  name={wallet.name}
                  balance={wallet.balance}
                  currency={wallet.currency || 'N$'}
                  icon="credit-card"
                  width={WALLET_CARD_WIDTH}
                />
              </TouchableOpacity>
            ))}
            <AddWalletCard
              width={WALLET_CARD_WIDTH}
              onPress={handleAddWallet}
            />
          </ScrollView>
        </View>

        {/* Utilities/Services Grid */}
        <View style={styles.utilitiesSection}>
          <View style={styles.utilitiesGrid}>
            <UtilityButton
              label="Mobile Recharge"
              icon="mobile"
              width={UTILITY_BUTTON_WIDTH}
              onPress={() => handleUtilityPress('Mobile Recharge')}
            />
            <UtilityButton
              label="Buy Tickets"
              icon="ticket"
              width={UTILITY_BUTTON_WIDTH}
              onPress={() => handleUtilityPress('Buy Tickets')}
            />
            <UtilityButton
              label="Your Subscriptions"
              icon="list"
              width={UTILITY_BUTTON_WIDTH}
              onPress={() => handleUtilityPress('Your Subscriptions')}
            />
            <UtilityButton
              label="Sponsored Section"
              icon="star-o"
              width={UTILITY_BUTTON_WIDTH}
              onPress={() => handleUtilityPress('Sponsored Section')}
            />
            <UtilityButton
              label="All Insurance"
              icon="shield"
              width={UTILITY_BUTTON_WIDTH}
              onPress={() => handleUtilityPress('All Insurance')}
            />
            <UtilityButton
              label="Explore Utilities"
              icon="th"
              width={UTILITY_BUTTON_WIDTH}
              onPress={() => handleUtilityPress('Explore Utilities')}
            />
            <UtilityButton
              label="Vouchers"
              icon="gift"
              width={UTILITY_BUTTON_WIDTH}
              onPress={() => handleUtilityPress('Vouchers')}
            />
            <UtilityButton
              label="AI"
              icon="magic"
              width={UTILITY_BUTTON_WIDTH}
              onPress={() => handleUtilityPress('AI')}
            />
            <UtilityButton
              label="Learn"
              icon="book"
              width={UTILITY_BUTTON_WIDTH}
              onPress={() => handleUtilityPress('Learn')}
            />
          </View>
        </View>

        {/* Action Buttons - Below Utilities Grid */}
        <View style={styles.actionButtonsContainer}>
          <ActionButton
            label="Send"
            icon="paper-plane"
            variant="primary"
            onPress={handleSendPress}
          />
          <ActionButton
            label="Scan"
            icon="qrcode"
            variant="dark"
            onPress={handleScanPress}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 50,
    paddingBottom: 24,
  },
  accountSection: {
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: LARGE_SECTION_SPACING,
    paddingTop: 8,
    alignItems: 'center',
  },
  // Card Section with Gradient Background
  cardSectionWrapper: {
    position: 'relative',
    marginBottom: LARGE_SECTION_SPACING,
    marginTop: 8,
    overflow: 'visible',
  },
  gradientBlob: {
    position: 'absolute',
    bottom: -40,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primaryLight,
    opacity: 0.15,
    zIndex: 0,
  },
  cardSection: {
    paddingHorizontal: HORIZONTAL_PADDING,
    position: 'relative',
    zIndex: 1,
    alignItems: 'center', // Center the card container
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 16,
    width: '100%',
    maxWidth: 400, // Limit width for better centering on larger screens
  },
  cardPreview: {
    width: 56,
    height: 36,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardVisual: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  cardGradient: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    opacity: 0.8,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  cardNumber: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  viewLink: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  walletsSection: {
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: LARGE_SECTION_SPACING,
    marginTop: 8,
    position: 'relative',
    zIndex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 20,
  },
  walletsScrollContent: {
    gap: 12,
    paddingRight: HORIZONTAL_PADDING,
  },
  utilitiesSection: {
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: LARGE_SECTION_SPACING,
    marginTop: 8,
  },
  utilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: HORIZONTAL_PADDING,
    marginTop: LARGE_SECTION_SPACING,
    marginBottom: 40,
    paddingTop: 16,
    paddingBottom: 16,
  },
});
