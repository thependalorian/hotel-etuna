/**
 * WalletTypeSelector – Smartpay Agentic Copilot.
 * Modal for selecting wallet type during wallet creation.
 * Location: fintech/smartpay/components/copilot/cards/WalletTypeSelector.tsx
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { designSystem } from '@/constants/designSystem';
import { getWalletTypes, type WalletType } from '@/services/copilot/walletManagementService';

interface WalletTypeSelectorProps {
  selectedType?: string;
  onSelect: (type: WalletType) => void;
  onClose: () => void;
}

export function WalletTypeSelector({ selectedType, onSelect, onClose }: WalletTypeSelectorProps) {
  const types = getWalletTypes();

  return (
    <Modal
      visible
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Choose Wallet Type</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={designSystem.colors.neutral.text} />
            </TouchableOpacity>
          </View>

          {/* Type List */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {types.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  selectedType === type.id && styles.typeCardSelected,
                ]}
                onPress={() => onSelect(type)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: type.defaultColor }]}>
                  <Ionicons name={type.icon as any} size={24} color="#fff" />
                </View>
                <View style={styles.typeContent}>
                  <View style={styles.typeHeader}>
                    <Text style={styles.typeName}>{type.name}</Text>
                    {selectedType === type.id && (
                      <Ionicons name="checkmark-circle" size={20} color={designSystem.colors.brand.primary} />
                    )}
                  </View>
                  <Text style={styles.typeDescription}>{type.description}</Text>
                  <Text style={styles.typeCurrency}>Currency: {type.allowedCurrencies.join(', ')}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Info Footer */}
          <View style={styles.footer}>
            <Ionicons name="information-circle-outline" size={16} color={designSystem.colors.neutral.textSecondary} />
            <Text style={styles.footerText}>
              Each wallet type helps you organize money for different purposes.
            </Text>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: designSystem.colors.neutral.surface,
    borderTopLeftRadius: designSystem.radius.xl,
    borderTopRightRadius: designSystem.radius.xl,
    maxHeight: '80%',
    paddingTop: designSystem.spacing.lg,
    paddingHorizontal: designSystem.spacing.lg,
    paddingBottom: designSystem.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designSystem.spacing.lg,
  },
  title: {
    ...designSystem.typography.textStyles.h2,
    color: designSystem.colors.neutral.text,
  },
  scrollView: {
    maxHeight: 500,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: designSystem.spacing.md,
    padding: designSystem.spacing.md,
    backgroundColor: designSystem.colors.neutral.background,
    borderRadius: designSystem.radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: designSystem.spacing.md,
  },
  typeCardSelected: {
    borderColor: designSystem.colors.brand.primary,
    backgroundColor: designSystem.colors.brand.primaryLight,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeContent: {
    flex: 1,
  },
  typeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeName: {
    ...designSystem.typography.textStyles.body,
    fontWeight: '600',
    color: designSystem.colors.neutral.text,
  },
  typeDescription: {
    ...designSystem.typography.textStyles.bodySmall,
    color: designSystem.colors.neutral.textSecondary,
    marginBottom: 4,
  },
  typeCurrency: {
    ...designSystem.typography.textStyles.caption,
    color: designSystem.colors.neutral.textTertiary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: designSystem.spacing.lg,
    padding: designSystem.spacing.md,
    backgroundColor: designSystem.colors.neutral.background,
    borderRadius: designSystem.radius.md,
  },
  footerText: {
    flex: 1,
    ...designSystem.typography.textStyles.bodySmall,
    color: designSystem.colors.neutral.textSecondary,
  },
});
