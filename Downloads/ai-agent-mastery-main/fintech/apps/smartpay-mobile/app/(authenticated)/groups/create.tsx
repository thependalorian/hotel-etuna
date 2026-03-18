/**
 * Group creation screen – Smartpay.
 * Form for creating new groups with wallet linking options.
 * Location: mobile/app/(authenticated)/groups/create.tsx
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { designSystem } from '@/constants/designSystem';
import { createGroup, CreateGroupParams } from '@/services/groups';
import { getWallets } from '@/services/wallets';

const ds = designSystem;

export default function CreateGroupScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [memberPhones, setMemberPhones] = useState('');
  const [walletOption, setWalletOption] = useState<'new' | 'existing'>('new');
  const [selectedWalletId, setSelectedWalletId] = useState<string | undefined>();

  const { data: wallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: getWallets,
  });

  const createGroupMutation = useMutation({
    mutationFn: (params: CreateGroupParams) => createGroup(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      Alert.alert('Success', 'Group created successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (error) => {
      Alert.alert('Error', error instanceof Error ? error.message : 'An unexpected error occurred');
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a group name');
      return;
    }

    if (walletOption === 'existing' && !selectedWalletId) {
      Alert.alert('Validation Error', 'Please select a wallet');
      return;
    }

    const phones = memberPhones
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const params: CreateGroupParams = {
      name: name.trim(),
      description: description.trim() || undefined,
      memberPhones: phones,
      walletOption,
      existingWalletId: walletOption === 'existing' ? selectedWalletId : undefined,
    };

    createGroupMutation.mutate(params);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        onPress={() => router.back()} 
        style={styles.backButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={24} color={ds.colors.text} />
      </TouchableOpacity>
      <Text style={styles.title}>Create Group</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {renderHeader()}
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Group Details</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Group Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Weekend Warriors"
                  placeholderTextColor={ds.colors.textTertiary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="What's this group for?"
                  placeholderTextColor={ds.colors.textTertiary}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Members</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Numbers</Text>
                <Text style={styles.helperText}>
                  Enter phone numbers separated by commas
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="+264812345678, +264817654321"
                  placeholderTextColor={ds.colors.textTertiary}
                  value={memberPhones}
                  onChangeText={setMemberPhones}
                  keyboardType="phone-pad"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Wallet</Text>
              
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setWalletOption('new')}
                  activeOpacity={0.7}
                >
                  <View style={styles.radio}>
                    {walletOption === 'new' && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.radioContent}>
                    <Text style={styles.radioLabel}>Create New Wallet</Text>
                    <Text style={styles.radioDescription}>
                      A new wallet will be created for this group
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setWalletOption('existing')}
                  activeOpacity={0.7}
                >
                  <View style={styles.radio}>
                    {walletOption === 'existing' && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.radioContent}>
                    <Text style={styles.radioLabel}>Link Existing Wallet</Text>
                    <Text style={styles.radioDescription}>
                      Use one of your existing wallets
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {walletOption === 'existing' && wallets && wallets.length > 0 && (
                <View style={styles.walletsContainer}>
                  {wallets.map((wallet) => (
                    <TouchableOpacity
                      key={wallet.id}
                      style={[
                        styles.walletOption,
                        selectedWalletId === wallet.id && styles.walletOptionSelected,
                      ]}
                      onPress={() => setSelectedWalletId(wallet.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.walletInfo}>
                        <Ionicons 
                          name={wallet.icon as any || 'wallet'} 
                          size={24} 
                          color={wallet.color || ds.colors.primary} 
                        />
                        <View style={styles.walletDetails}>
                          <Text style={styles.walletName}>{wallet.name}</Text>
                          <Text style={styles.walletBalance}>
                            {wallet.currency} {wallet.balance.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                      {selectedWalletId === wallet.id && (
                        <Ionicons name="checkmark-circle" size={24} color={ds.colors.success} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {walletOption === 'existing' && (!wallets || wallets.length === 0) && (
                <View style={styles.noWalletsContainer}>
                  <Text style={styles.noWalletsText}>
                    You don't have any wallets yet. Create a new wallet for this group.
                  </Text>
                  <TouchableOpacity
                    style={styles.switchButton}
                    onPress={() => setWalletOption('new')}
                  >
                    <Text style={styles.switchButtonText}>Create New Wallet</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, createGroupMutation.isPending && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={createGroupMutation.isPending}
            activeOpacity={0.8}
          >
            {createGroupMutation.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>Create Group</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: ds.colors.background 
  },
  safe: { 
    flex: 1 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ds.spacing.smartpay.horizontalPadding,
    paddingVertical: ds.spacing.md,
    backgroundColor: ds.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...ds.typography.textStyles.titleSm,
    color: ds.colors.text,
  },
  scrollView: { 
    flex: 1 
  },
  scrollContent: {
    paddingBottom: 100,
  },
  form: {
    padding: ds.spacing.smartpay.horizontalPadding,
    gap: ds.spacing.xl,
  },
  section: {
    gap: ds.spacing.md,
  },
  sectionTitle: {
    ...ds.typography.textStyles.h3,
    color: ds.colors.text,
    marginBottom: ds.spacing.sm,
  },
  inputGroup: {
    gap: ds.spacing.sm,
  },
  label: {
    ...ds.typography.textStyles.body,
    fontWeight: '600',
    color: ds.colors.text,
  },
  required: {
    color: ds.colors.error,
  },
  helperText: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.textSecondary,
  },
  input: {
    ...ds.typography.textStyles.body,
    backgroundColor: ds.colors.surface,
    borderWidth: 1,
    borderColor: ds.colors.border,
    borderRadius: ds.radius.md,
    padding: ds.spacing.md,
    color: ds.colors.text,
  },
  textArea: {
    minHeight: 80,
    paddingTop: ds.spacing.md,
  },
  radioGroup: {
    gap: ds.spacing.md,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: ds.colors.surface,
    borderWidth: 1,
    borderColor: ds.colors.border,
    borderRadius: ds.radius.md,
    padding: ds.spacing.md,
    gap: ds.spacing.md,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: ds.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ds.colors.primary,
  },
  radioContent: {
    flex: 1,
    gap: 4,
  },
  radioLabel: {
    ...ds.typography.textStyles.body,
    fontWeight: '600',
    color: ds.colors.text,
  },
  radioDescription: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.textSecondary,
  },
  walletsContainer: {
    gap: ds.spacing.sm,
    marginTop: ds.spacing.sm,
  },
  walletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ds.colors.surface,
    borderWidth: 1,
    borderColor: ds.colors.border,
    borderRadius: ds.radius.md,
    padding: ds.spacing.md,
  },
  walletOptionSelected: {
    borderColor: ds.colors.success,
    borderWidth: 2,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.md,
    flex: 1,
  },
  walletDetails: {
    flex: 1,
    gap: 4,
  },
  walletName: {
    ...ds.typography.textStyles.body,
    fontWeight: '600',
    color: ds.colors.text,
  },
  walletBalance: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.textSecondary,
  },
  noWalletsContainer: {
    backgroundColor: ds.colors.neutral.muted,
    borderRadius: ds.radius.md,
    padding: ds.spacing.md,
    marginTop: ds.spacing.sm,
    gap: ds.spacing.md,
  },
  noWalletsText: {
    ...ds.typography.textStyles.body,
    color: ds.colors.textSecondary,
    textAlign: 'center',
  },
  switchButton: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: ds.colors.primary,
    borderRadius: ds.radius.md,
  },
  switchButtonText: {
    ...ds.typography.textStyles.body,
    fontWeight: '600',
    color: '#FFF',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: ds.spacing.smartpay.horizontalPadding,
    paddingBottom: ds.spacing.lg,
    backgroundColor: ds.colors.surface,
    borderTopWidth: 1,
    borderTopColor: ds.colors.border,
    ...ds.shadows.lg,
  },
  submitButton: {
    height: 56,
    backgroundColor: ds.colors.primary,
    borderRadius: ds.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...ds.shadows.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...ds.typography.textStyles.button,
    color: '#FFF',
    fontSize: 17,
  },
});
