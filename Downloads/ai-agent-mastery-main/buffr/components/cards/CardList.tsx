/**
 * CardList Component
 * 
 * Location: components/cards/CardList.tsx
 * Purpose: Display list of linked cards (debit/credit cards)
 * 
 * Shows all cards linked to the user's Buffr account
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { EmptyState } from '@/components/common';

interface Card {
  id: string;
  last4: string;
  cardType: 'debit' | 'credit';
  network: 'visa' | 'mastercard' | 'other';
  cardholderName: string;
  expiryDate: string;
}

interface CardListProps {
  cards: Card[];
  onCardPress?: (card: Card) => void;
  onAddCard?: () => void;
}

export default function CardList({ cards, onCardPress, onAddCard }: CardListProps) {
  const getNetworkIcon = (network: string) => {
    switch (network) {
      case 'visa':
        return 'cc-visa';
      case 'mastercard':
        return 'cc-mastercard';
      default:
        return 'credit-card';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Linked Cards</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddCard}>
          <FontAwesome name="plus" size={18} color={Colors.primary} />
          <Text style={styles.addButtonText}>Add Card</Text>
        </TouchableOpacity>
      </View>

      {cards.length === 0 ? (
        <EmptyState
          icon="credit-card"
          title="No cards linked"
          message="Add a card to fund your Buffr Card wallet"
          actionLabel="Add Your First Card"
          onAction={onAddCard}
        />
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {cards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={styles.cardItem}
              onPress={() => onCardPress?.(card)}
            >
              <View style={styles.cardIcon}>
                <FontAwesome
                  name={getNetworkIcon(card.network)}
                  size={32}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardType}>
                  {card.cardType === 'credit' ? 'Credit' : 'Debit'} Card
                </Text>
                <Text style={styles.cardNumber}>•••• •••• •••• {card.last4}</Text>
                <Text style={styles.cardName}>{card.cardholderName}</Text>
              </View>
              <FontAwesome name="chevron-right" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
  list: {
    flex: 1,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 16,
  },
  cardIcon: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primaryMuted,
    borderRadius: 12,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardType: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: 1,
  },
  cardName: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
