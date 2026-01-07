/**
 * Wallet Settings Screen
 * 
 * Location: app/wallets/[id]/settings.tsx
 * Purpose: Configure wallet settings and preferences
 * 
 * Based on Wallet Settings.svg
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useWallets } from '@/contexts/WalletsContext';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';

export default function WalletSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getWalletById, updateWallet, deleteWallet, refreshWallets } = useWallets();

  const wallet = useMemo(() => {
    return id ? getWalletById(id) : null;
  }, [id, getWalletById]);

  const [walletName, setWalletName] = useState(wallet?.name || '');
  const [pinProtected, setPinProtected] = useState(wallet?.pinProtected || false);
  const [biometricEnabled, setBiometricEnabled] = useState(wallet?.biometricEnabled || false);
  const [autoPayEnabled, setAutoPayEnabled] = useState(wallet?.autoPayEnabled || false);
  const [autoPayMaxAmount, setAutoPayMaxAmount] = useState(
    wallet?.autoPayMaxAmount?.toString() || '500'
  );

  useEffect(() => {
    if (id && !wallet) {
      refreshWallets();
    }
  }, [id, wallet, refreshWallets]);

  useEffect(() => {
    if (wallet) {
      setWalletName(wallet.name);
      setPinProtected(wallet.pinProtected || false);
      setBiometricEnabled(wallet.biometricEnabled || false);
      setAutoPayEnabled(wallet.autoPayEnabled || false);
      setAutoPayMaxAmount(wallet.autoPayMaxAmount?.toString() || '500');
    }
  }, [wallet]);

  const handleSave = async () => {
    if (!walletName.trim()) {
      Alert.alert('Error', 'Wallet name cannot be empty');
      return;
    }

    try {
      await updateWallet(id!, {
        name: walletName.trim(),
        pinProtected,
        biometricEnabled,
        autoPayEnabled,
        autoPayMaxAmount: autoPayEnabled ? parseFloat(autoPayMaxAmount) : undefined,
      });
      Alert.alert('Success', 'Wallet settings updated', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update settings. Please try again.');
    }
  };

  const handleDeleteWallet = () => {
    Alert.alert(
      'Delete Wallet',
      `Are you sure you want to delete "${wallet?.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWallet(id!);
              router.replace('/(tabs)');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete wallet. Please try again.');
            }
          },
        },
      ]
    );
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
        <Text style={styles.headerTitle}>Wallet Settings</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Wallet Information */}
      <View style={styles.section}>
        <SectionHeader title="Wallet Information" />
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Wallet Name</Text>
            <TextInput
              style={styles.settingInput}
              value={walletName}
              onChangeText={setWalletName}
              placeholder="Enter wallet name"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Wallet Type</Text>
            <Text style={styles.settingValue}>
              {wallet.type ? wallet.type.charAt(0).toUpperCase() + wallet.type.slice(1) : 'Personal'} Wallet
            </Text>
          </View>
        </View>
      </View>

      {/* Security */}
      <View style={styles.section}>
        <SectionHeader title="Security" />
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>PIN Protection</Text>
            <Switch
              value={pinProtected}
              onValueChange={setPinProtected}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Biometric Authentication</Text>
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </View>
      </View>

      {/* Auto Pay */}
      <View style={styles.section}>
        <SectionHeader title="Auto Pay" />
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Auto Pay</Text>
            <Switch
              value={autoPayEnabled}
              onValueChange={setAutoPayEnabled}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
          {autoPayEnabled && (
            <>
              <View style={styles.divider} />
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Max Auto Pay Amount</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>{wallet.currency || 'N$'}</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={autoPayMaxAmount}
                    onChangeText={setAutoPayMaxAmount}
                    keyboardType="decimal-pad"
                    placeholder="500"
                  />
                </View>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Linked Accounts */}
      <View style={styles.section}>
        <SectionHeader title="Linked Accounts" />
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <FontAwesome name="bank" size={20} color={Colors.primary} />
            <View style={styles.accountInfo}>
              <Text style={styles.accountLabel}>Bank Account</Text>
              <Text style={styles.accountDetails}>•••• 1234</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.manageText}>Manage</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <FontAwesome name="credit-card" size={20} color={Colors.primary} />
            <View style={styles.accountInfo}>
              <Text style={styles.accountLabel}>Card</Text>
              <Text style={styles.accountDetails}>•••• 5678</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.manageText}>Manage</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Save Button */}
      <PillButton
        label="Save Settings"
        variant="primary"
        onPress={handleSave}
      />

      {/* Delete Wallet */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteWallet}>
        <FontAwesome name="trash" size={20} color={Colors.error} />
        <Text style={styles.deleteText}>Delete Wallet</Text>
      </TouchableOpacity>
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
    paddingBottom: 40,
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
  settingCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  settingValue: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  settingInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  amountInput: {
    width: 100,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'right',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 4,
  },
  accountInfo: {
    flex: 1,
    marginLeft: 12,
    gap: 2,
  },
  accountLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  accountDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  manageText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error + '20',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
});
