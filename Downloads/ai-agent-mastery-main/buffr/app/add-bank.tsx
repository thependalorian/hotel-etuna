/**
 * Add Bank Screen
 * 
 * Location: app/add-bank.tsx
 * Purpose: Screen for adding a new bank account
 * 
 * Based on Add Card screen pattern
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';
import AddBankForm from '@/components/banks/AddBankForm';
import { useBanks, Bank } from '@/contexts/BanksContext';

export default function AddBankScreen() {
  const router = useRouter();
  const { fetchBanks } = useBanks();

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  const handleBankAdded = (bank: Bank) => {
    // Navigate back after bank is added
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
        <Text style={styles.headerTitle}>Add Bank Account</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Form */}
      <AddBankForm
        onBankAdded={handleBankAdded}
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
