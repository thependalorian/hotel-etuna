/**
 * AccountQuickView Component
 * 
 * Location: components/AccountQuickView.tsx
 * Purpose: Quick view of current account with Buffr logo and account number
 * 
 * Features:
 * - Centered account display with Buffr logo
 * - Account number display (e.g., ..823)
 * - Swipeable carousel for multiple accounts/cards
 * - Add button to link new cards
 * - Pill-shaped styling
 */

import React, { useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useCards } from '@/contexts/CardsContext';
import { useUser } from '@/contexts/UserContext';

interface AccountQuickViewProps {
  onAddCard?: () => void;
  onAccountPress?: (accountId: string, type: 'buffr' | 'card') => void;
}

interface AccountItem {
  id: string;
  type: 'buffr' | 'card';
  name: string;
  accountNumber: string; // Last 4 digits or account identifier
  isDefault?: boolean;
}

export default function AccountQuickView({
  onAddCard,
  onAccountPress,
}: AccountQuickViewProps) {
  const { user } = useUser();
  const { cards, getDefaultCard } = useCards();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Generate Buffr account number from user data
  const getBuffrAccountNumber = (): string => {
    if (!user) return '823';
    // Use user ID or email to generate consistent account number
    const identifier = user.id || user.email || user.phoneNumber || '823';
    // Extract last 3 digits from identifier hash
    const hash = identifier.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return String(hash % 1000).padStart(3, '0');
  };

  // Build accounts list: Buffr main account + linked cards
  const accounts: AccountItem[] = useMemo(() => {
    const buffrAccount: AccountItem = {
      id: 'buffr-main',
      type: 'buffr',
      name: 'Buffr',
      accountNumber: getBuffrAccountNumber(),
      isDefault: true,
    };

    const cardAccounts: AccountItem[] = cards.map((card) => ({
      id: card.id,
      type: 'card',
      name: card.cardType === 'credit' ? 'Credit Card' : 'Debit Card',
      accountNumber: card.last4,
      isDefault: card.isDefault || false,
    }));

    // Put default card first if exists, otherwise Buffr account first
    const defaultCard = getDefaultCard();
    if (defaultCard && cardAccounts.length > 0) {
      const defaultIndex = cardAccounts.findIndex((c) => c.id === defaultCard.id);
      if (defaultIndex > 0) {
        const [defaultCardItem] = cardAccounts.splice(defaultIndex, 1);
        cardAccounts.unshift(defaultCardItem);
      }
    }

    return [buffrAccount, ...cardAccounts];
  }, [cards, getDefaultCard, user]);

  const handleAccountPress = (account: AccountItem) => {
    onAccountPress?.(account.id, account.type);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / 240); // Approximate width of account item + gap
    setCurrentIndex(index);
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        {accounts.length > 0 ? (
          <>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              contentContainerStyle={styles.scrollContent}
              snapToInterval={240}
              decelerationRate="fast"
              style={styles.scrollView}
            >
              {accounts.map((account) => (
                <View key={account.id} style={styles.page}>
                  <TouchableOpacity
                    style={styles.accountItem}
                    onPress={() => handleAccountPress(account)}
                    activeOpacity={0.7}
                  >
                    {account.type === 'buffr' ? (
                      <Image
                        source={require('@/assets/images/buffr_logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.cardIconContainer}>
                        <FontAwesome
                          name={account.name.includes('Credit') ? 'credit-card' : 'credit-card-alt'}
                          size={20}
                          color={Colors.primary}
                        />
                      </View>
                    )}
                    {account.type === 'buffr' ? null : (
                      <Text style={styles.accountName}>{account.name}</Text>
                    )}
                    <Text style={styles.accountNumber}>..{account.accountNumber}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            {/* Page Indicators */}
            {accounts.length > 1 && (
              <View style={styles.indicators}>
                {accounts.map((_, index) => (
                  <View
                    key={index}
                    style={[styles.indicator, index === currentIndex && styles.indicatorActive]}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <TouchableOpacity
            style={styles.accountItem}
            onPress={() => onAddCard?.()}
            activeOpacity={0.7}
          >
            <Image
              source={require('@/assets/images/buffr_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.accountNumber}>..{getBuffrAccountNumber()}</Text>
          </TouchableOpacity>
        )}

        {/* Add Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAddCard}
          activeOpacity={0.7}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  contentWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingRight: 50, // Space for add button
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  page: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 220,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderRadius: 25, // Pill-shaped
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 180,
    maxWidth: 260,
  },
  logo: {
    width: 24,
    height: 24,
  },
  cardIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  accountNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  addButton: {
    position: 'absolute',
    right: 0,
    top: '50%',
    marginTop: -18, // Half of height to center vertically
    width: 36,
    height: 36,
    borderRadius: 18, // Circular
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 22,
  },
  indicators: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    justifyContent: 'center',
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  indicatorActive: {
    backgroundColor: Colors.primary,
    width: 20,
  },
});
