/**
 * Add Wallet - Create wallet screen
 * 
 * Figma Spec: 151:391
 * Features:
 * - Wallet name (required)
 * - Icon selection (grid of icons)
 * - Color/accent selection
 * - Wallet type: Standard, Savings, Business, Goal
 * - Goal amount (if Goal type)
 * - Primary CTA: "Create Wallet"
 * - API: POST /api/v1/mobile/wallets
 * 
 * Location: app/(authenticated)/wallets/add.tsx
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { designSystem as DS } from '@/constants/designSystem';
import { createWallet } from '@/services/wallets';

type WalletType = 'standard' | 'savings' | 'business' | 'goal';

const WALLET_ICONS = [
  'wallet-outline',
  'cash-outline',
  'card-outline',
  'briefcase-outline',
  'business-outline',
  'gift-outline',
  'home-outline',
  'cart-outline',
  'airplane-outline',
  'heart-outline',
  'star-outline',
  'trophy-outline',
];

const WALLET_COLORS = [
  '#0029D6', // Blue
  '#22C55E', // Green
  '#8B5CF6', // Purple
  '#FB923C', // Orange
  '#E11D48', // Red
  '#2563EB', // Light Blue
  '#A855F7', // Violet
  '#FFB800', // Gold
];

const WALLET_TYPES: { value: WalletType; label: string; description: string }[] = [
  { value: 'standard', label: 'Standard', description: 'General purpose wallet' },
  { value: 'savings', label: 'Savings', description: 'For saving money' },
  { value: 'business', label: 'Business', description: 'Business expenses' },
  { value: 'goal', label: 'Goal', description: 'Save for a specific goal' },
];

export default function AddWalletScreen() {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(WALLET_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(WALLET_COLORS[0]);
  const [walletType, setWalletType] = useState<WalletType>('standard');
  const [goalAmount, setGoalAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a wallet name');
      return;
    }

    if (walletType === 'goal' && !goalAmount.trim()) {
      Alert.alert('Required', 'Please enter a goal amount');
      return;
    }

    setLoading(true);
    try {
      const wallet = await createWallet({
        name: name.trim(),
        type: (walletType === 'standard' ? 'main' : walletType === 'goal' ? 'custom' : walletType) as 'main' | 'savings' | 'bills' | 'emergency' | 'travel' | 'shopping' | 'custom',
        icon: selectedIcon,
        color: selectedColor,
        currency: 'NAD',
      });

      if (wallet) {
        Alert.alert('Success', 'Wallet created successfully', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert('Error', 'Failed to create wallet');
      }
    } catch (error) {
      console.error('Failed to create wallet:', error);
      Alert.alert('Error', 'Failed to create wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader
        title="Add Wallet"
        showBackButton
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.label}>Wallet Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Personal, Savings, Business"
            placeholderTextColor={DS.colors.textPlaceholder}
            value={name}
            onChangeText={setName}
            maxLength={30}
            accessibilityLabel="Wallet name"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Choose Icon</Text>
          <View style={styles.iconGrid}>
            {WALLET_ICONS.map((icon) => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconOption,
                  selectedIcon === icon && styles.iconOptionSelected,
                  { borderColor: selectedIcon === icon ? selectedColor : DS.colors.border },
                ]}
                onPress={() => setSelectedIcon(icon)}
                activeOpacity={0.7}
                accessibilityLabel={`Icon ${icon}`}
                accessibilityRole="radio"
              >
                <Ionicons
                  name={icon as any}
                  size={28}
                  color={selectedIcon === icon ? selectedColor : DS.colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Choose Color</Text>
          <View style={styles.colorGrid}>
            {WALLET_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorOptionSelected,
                ]}
                onPress={() => setSelectedColor(color)}
                activeOpacity={0.7}
                accessibilityLabel={`Color ${color}`}
                accessibilityRole="radio"
              >
                {selectedColor === color && (
                  <Ionicons name="checkmark" size={20} color={DS.colors.background} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Wallet Type</Text>
          <View style={styles.typeGrid}>
            {WALLET_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeOption,
                  walletType === type.value && styles.typeOptionSelected,
                  { borderColor: walletType === type.value ? selectedColor : DS.colors.border },
                ]}
                onPress={() => setWalletType(type.value)}
                activeOpacity={0.7}
                accessibilityLabel={type.label}
                accessibilityRole="radio"
              >
                <View style={styles.typeContent}>
                  <Text style={[
                    styles.typeLabel,
                    walletType === type.value && { color: selectedColor },
                  ]}>
                    {type.label}
                  </Text>
                  <Text style={styles.typeDescription}>
                    {type.description}
                  </Text>
                </View>
                {walletType === type.value && (
                  <Ionicons name="checkmark-circle" size={20} color={selectedColor} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {walletType === 'goal' && (
          <View style={styles.section}>
            <Text style={styles.label}>Goal Amount *</Text>
            <View style={styles.amountInput}>
              <Text style={styles.currencySymbol}>N$</Text>
              <TextInput
                style={styles.amountInputField}
                placeholder="0.00"
                placeholderTextColor={DS.colors.textPlaceholder}
                value={goalAmount}
                onChangeText={setGoalAmount}
                keyboardType="decimal-pad"
                accessibilityLabel="Goal amount"
              />
            </View>
          </View>
        )}

        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Preview</Text>
          <View style={styles.previewCard}>
            <View style={[styles.previewAccent, { backgroundColor: selectedColor }]} />
            <View style={styles.previewBody}>
              <View style={[styles.previewIcon, { backgroundColor: `${selectedColor}15` }]}>
                <Ionicons name={selectedIcon as any} size={24} color={selectedColor} />
              </View>
              <Text style={styles.previewName} numberOfLines={1}>
                {name.trim() || 'Wallet Name'}
              </Text>
              <Text style={styles.previewBalance}>N$ 0.00</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomButton}>
        <Button
          title="Create Wallet"
          onPress={handleSubmit}
          disabled={loading || !name.trim()}
          loading={loading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: DS.spacing.md,
    paddingTop: DS.spacing.md,
    paddingBottom: 100,
  },
  section: {
    marginBottom: DS.spacing.lg,
  },
  label: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginBottom: DS.spacing.sm,
  },
  input: {
    height: DS.components.input.height,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: DS.colors.border,
    paddingHorizontal: DS.spacing.md,
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.text,
    backgroundColor: DS.colors.background,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DS.spacing.sm,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: DS.radius.md,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DS.colors.surface,
  },
  iconOptionSelected: {
    borderWidth: 2,
    backgroundColor: DS.colors.background,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DS.spacing.sm,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: DS.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: DS.colors.background,
  },
  typeGrid: {
    gap: DS.spacing.sm,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: DS.spacing.md,
    borderRadius: DS.radius.md,
    borderWidth: 2,
    backgroundColor: DS.colors.surface,
  },
  typeOptionSelected: {
    borderWidth: 2,
    backgroundColor: DS.colors.background,
  },
  typeContent: {
    flex: 1,
  },
  typeLabel: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginBottom: 2,
  },
  typeDescription: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    height: DS.components.input.height,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: DS.colors.border,
    paddingHorizontal: DS.spacing.md,
    backgroundColor: DS.colors.background,
  },
  currencySymbol: {
    fontSize: DS.typography.fontSize.lg,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.textSecondary,
    marginRight: DS.spacing.sm,
  },
  amountInputField: {
    flex: 1,
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.text,
    padding: 0,
  },
  preview: {
    marginTop: DS.spacing.md,
  },
  previewLabel: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginBottom: DS.spacing.sm,
  },
  previewCard: {
    width: DS.components.walletCard.width,
    height: DS.components.walletCard.height,
    backgroundColor: DS.colors.background,
    borderRadius: DS.components.walletCard.borderRadius,
    overflow: 'hidden',
    ...DS.shadows.sm,
  },
  previewAccent: {
    height: DS.components.walletCard.accentBarHeight,
    width: '100%',
  },
  previewBody: {
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: DS.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewName: {
    fontSize: 14,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
  },
  previewBalance: {
    fontSize: 18,
    fontWeight: DS.typography.fontWeight.bold,
    color: DS.colors.text,
  },
  bottomButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: DS.spacing.md,
    paddingVertical: DS.spacing.md,
    backgroundColor: DS.colors.background,
    borderTopWidth: 1,
    borderTopColor: DS.colors.border,
  },
});
