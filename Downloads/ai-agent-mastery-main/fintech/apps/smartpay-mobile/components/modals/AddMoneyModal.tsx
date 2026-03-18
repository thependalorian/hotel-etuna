/**
 * AddMoneyModal – Smartpay.
 * Bottom sheet with 3 methods: Bank Transfer, Card, Agent.
 * Enhanced with haptic feedback. Used from Home or Wallet screens to add funds.
 * Location: fintech/smartpay/mobile/components/modals/AddMoneyModal.tsx
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { designSystem } from '@/constants/designSystem';

const DS = designSystem;

export interface AddMoneyModalProps {
  visible: boolean;
  onClose: () => void;
  /** Wallet ID for context. Can be null if coming from Home. */
  walletId: string | null;
}

const METHODS = [
  {
    id: 'bank' as const,
    label: 'Bank Transfer',
    description: 'EFT to your wallet',
    icon: 'business-outline' as const,
    color: '#2563eb',
    bg: '#eff6ff',
  },
  {
    id: 'card' as const,
    label: 'Debit / Credit Card',
    description: 'Link a card to top up',
    icon: 'card-outline' as const,
    color: '#22c55e',
    bg: '#f0fdf4',
  },
  {
    id: 'agent' as const,
    label: 'Find Agent',
    description: 'Cash in at an agent',
    icon: 'location-outline' as const,
    color: '#f59e0b',
    bg: '#fffbeb',
  },
];

export function AddMoneyModal({ visible, onClose, walletId }: AddMoneyModalProps) {
  function handleMethod(method: 'bank' | 'card' | 'agent') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    if (method === 'bank') {
      // Navigate to bank transfer flow
      // For now, just navigate to home - implement actual flow later
      router.push('/(tabs)' as never);
    } else if (method === 'card') {
      // Navigate to add card flow
      router.push('/(tabs)' as never);
    } else {
      // Navigate to agent finder
      router.push('/(tabs)' as never);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Add Money" maxHeight="50%">
      <View style={styles.content}>
        {METHODS.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[styles.methodRow, { backgroundColor: m.bg }]}
            onPress={() => handleMethod(m.id)}
            activeOpacity={0.8}
            accessibilityLabel={m.label}
          >
            <View style={[styles.iconWrap, { backgroundColor: m.bg }]}>
              <Ionicons name={m.icon} size={24} color={m.color} />
            </View>
            <View style={styles.methodText}>
              <Text style={styles.methodLabel}>{m.label}</Text>
              <Text style={styles.methodDesc}>{m.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={DS.colors.neutral.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: DS.colors.neutral.border,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  methodText: { flex: 1 },
  methodLabel: { fontSize: 16, fontWeight: '600', color: DS.colors.neutral.text, marginBottom: 2 },
  methodDesc: { fontSize: 13, color: DS.colors.neutral.textSecondary },
});
