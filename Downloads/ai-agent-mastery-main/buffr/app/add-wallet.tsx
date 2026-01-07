/**
 * Add New Wallet Screen
 * 
 * Location: app/add-wallet.tsx
 * Purpose: Multi-step wallet creation flow with pagination
 * 
 * Step 1: Icon, Name, Auto Pay setup
 * Step 2: Card Design selection
 * Then save and appear on home page
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useWallets } from '@/contexts/WalletsContext';
import { AddWalletForm } from '@/components/wallets';
import Colors from '@/constants/Colors';

export default function AddWalletScreen() {
  const router = useRouter();
  const { addWallet } = useWallets();

  const handleWalletCreated = async (walletData: { 
    name: string; 
    purpose?: string;
    type?: 'personal' | 'business' | 'savings' | 'investment' | 'bills' | 'travel' | 'budget';
    cardDesign?: number;
    icon?: string;
    autoPayEnabled?: boolean;
    autoPayFrequency?: 'weekly' | 'bi-weekly' | 'monthly';
    autoPayDeductDate?: string;
    autoPayDeductTime?: string;
    autoPayAmount?: number;
    autoPayRepayments?: number;
    autoPayPaymentMethod?: string;
  }) => {
    try {
      const newWallet = await addWallet({
        name: walletData.name,
        purpose: walletData.purpose,
        balance: 0,
        currency: 'N$',
        type: walletData.type || 'personal',
        icon: walletData.icon || 'credit-card',
        cardDesign: walletData.cardDesign || 2,
        autoPayEnabled: walletData.autoPayEnabled || false,
        autoPayFrequency: walletData.autoPayFrequency,
        autoPayDeductDate: walletData.autoPayDeductDate,
        autoPayDeductTime: walletData.autoPayDeductTime,
        autoPayAmount: walletData.autoPayAmount,
        autoPayRepayments: walletData.autoPayRepayments,
        autoPayPaymentMethod: walletData.autoPayPaymentMethod,
        pinProtected: false,
        biometricEnabled: false,
      });

      Alert.alert('Success', `Wallet "${newWallet.name}" created successfully`, [
        {
          text: 'OK',
          onPress: () => {
            // Navigate to home page (tabs index) so wallet appears there
            router.replace('/(tabs)');
          },
        },
      ]);
    } catch (error) {
      console.error('Error creating wallet:', error);
      Alert.alert('Error', 'Failed to create wallet. Please try again.');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <FontAwesome name="arrow-left" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Wallet</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Add Wallet Form with Multi-Step Flow */}
      <AddWalletForm onWalletCreated={handleWalletCreated} onCancel={handleCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 0,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE', // Light blue circle from design
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
