/**
 * Transfer from Wallet Screen
 * 
 * Location: app/wallets/[id]/transfer.tsx
 * Purpose: Transfer money from wallet to another user
 * 
 * Based on Transfer.svg and Transfer Amount (Wallet).svg
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useWallets } from '@/contexts/WalletsContext';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';

export default function TransferScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getWalletById, transferFromWallet, refreshWallets } = useWallets();

  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');

  const wallet = useMemo(() => {
    return id ? getWalletById(id) : null;
  }, [id, getWalletById]);

  useEffect(() => {
    if (id && !wallet) {
      refreshWallets();
    }
  }, [id, wallet, refreshWallets]);

  const quickAmounts = [100, 500, 1000];

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const handleTransfer = async () => {
    const amountNum = parseFloat(amount);
    
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    if (amountNum > (wallet?.balance || 0)) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    if (!recipient.trim()) {
      Alert.alert('Error', 'Please enter recipient phone number or name');
      return;
    }

    try {
      await transferFromWallet(id!, amountNum, recipient.trim(), note.trim() || undefined);
      Alert.alert('Success', `N$ ${amountNum.toLocaleString()} transferred successfully`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to transfer. Please try again.');
    }
  };

  if (!wallet) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <ErrorState
          title="Wallet not found"
          message="The wallet you're looking for doesn't exist or has been deleted."
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transfer Money</Text>
        <View style={styles.placeholder} />
      </View>

      {/* From Wallet */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>From Wallet</Text>
        <View style={styles.walletCard}>
          <FontAwesome name="credit-card" size={24} color={Colors.primary} />
          <View style={styles.walletInfo}>
            <Text style={styles.walletName}>{wallet.name}</Text>
            <Text style={styles.walletBalance}>
              Balance: {wallet.currency || 'N$'} {wallet.balance.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* To Recipient */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>To</Text>
        <TextInput
          style={defaultStyles.input}
          placeholder="Search contacts or enter number"
          placeholderTextColor={Colors.textSecondary}
          value={recipient}
          onChangeText={setRecipient}
        />
        
        {/* Mock Contacts */}
        <View style={styles.contactsList}>
          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => setRecipient('Alice (+264 81 234 5678)')}
          >
            <View style={styles.contactAvatar}>
              <FontAwesome name="user" size={20} color={Colors.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>Alice</Text>
              <Text style={styles.contactPhone}>+264 81 234 5678</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => setRecipient('Bob (+264 81 345 6789)')}
          >
            <View style={styles.contactAvatar}>
              <FontAwesome name="user" size={20} color={Colors.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>Bob</Text>
              <Text style={styles.contactPhone}>+264 81 345 6789</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Amount */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Amount</Text>
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>{wallet.currency || 'N$'}</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor={Colors.textSecondary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Quick Amount Buttons */}
        <View style={styles.quickAmounts}>
          {quickAmounts.map((value) => (
            <TouchableOpacity
              key={value}
              style={styles.quickAmountButton}
              onPress={() => handleQuickAmount(value)}
            >
              <Text style={styles.quickAmountText}>{wallet.currency || 'N$'} {value}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Note */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Note (Optional)</Text>
        <TextInput
          style={[defaultStyles.input, styles.noteInput]}
          placeholder="Add a note..."
          placeholderTextColor={Colors.textSecondary}
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Transfer Button */}
      <PillButton
        label="Transfer"
        variant="primary"
        onPress={handleTransfer}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  placeholder: {
    width: 44,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 16,
  },
  walletInfo: {
    flex: 1,
    gap: 4,
  },
  walletName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  walletBalance: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  contactsList: {
    marginTop: 12,
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
    gap: 2,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  contactPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
