/**
 * Add Card Screen
 * 
 * Location: app/add-card.tsx
 * Purpose: Screen for adding a new payment card
 * 
 * Based on Add Card.svg design
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';
import AddCardForm from '@/components/cards/AddCardForm';
import { useCards, Card } from '@/contexts/CardsContext';

export default function AddCardScreen() {
  const router = useRouter();
  const { fetchCards } = useCards();

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleCardAdded = (card: Card) => {
    // Navigate back after card is added
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={defaultStyles.containerFull}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleCancel}
        >
          <FontAwesome name="arrow-left" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Card</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Form */}
      <AddCardForm
        onCardAdded={handleCardAdded}
        onCancel={handleCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
});
