/**
 * Cards Screen
 * 
 * Location: app/cards.tsx
 * Purpose: Display and manage all linked payment cards
 * 
 * Shows list of cards with options to add, edit, or remove cards
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';
import { useCards, Card } from '@/contexts/CardsContext';
import CardList from '@/components/cards/CardList';
import ScreenHeader from '@/components/common/ScreenHeader';

export default function CardsScreen() {
  const router = useRouter();
  const { cards, loading, fetchCards, deleteCard, setDefaultCard } = useCards();

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleAddCard = () => {
    router.push('/add-card');
  };

  const handleCardPress = (card: Card) => {
    // Navigate to card details screen
    router.push(`/cards/${card.id}`);
  };

  const handleDeleteCard = (cardId: string) => {
    Alert.alert(
      'Remove Card',
      'Are you sure you want to remove this card?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCard(cardId);
              Alert.alert('Success', 'Card removed successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove card');
            }
          },
        },
      ]
    );
  };

  if (loading && cards.length === 0) {
    return (
      <View style={[defaultStyles.containerFull, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={defaultStyles.containerFull}>
      <ScreenHeader
        title="Linked Cards"
        showBackButton
        onBack={() => router.back()}
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {cards.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome name="credit-card" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Cards Linked</Text>
            <Text style={styles.emptyText}>
              Link a debit or credit card to fund your Buffr Card
            </Text>
            <TouchableOpacity
              style={defaultStyles.pillButton}
              onPress={handleAddCard}
            >
              <Text style={defaultStyles.buttonText}>Add Your First Card</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <CardList
              cards={cards.map((card) => ({
                id: card.id,
                last4: card.last4,
                cardType: card.cardType,
                network: card.network,
                cardholderName: card.cardholderName,
                expiryDate: card.expiryDate,
              }))}
              onCardPress={handleCardPress}
              onAddCard={handleAddCard}
            />

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <FontAwesome name="info-circle" size={16} color={Colors.info} />
                <Text style={styles.infoText}>
                  Your card details are securely stored and encrypted
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  infoSection: {
    marginTop: 32,
    padding: 16,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
