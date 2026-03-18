/**
 * IconPicker – Smartpay Agentic Copilot.
 * Modal for selecting wallet icon with category filtering.
 * Location: fintech/smartpay/components/copilot/cards/IconPicker.tsx
 */
import React, { useState } from 'react';
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
import { getWalletIcons, type WalletIcon } from '@/services/copilot/walletManagementService';

interface IconPickerProps {
  selectedIcon?: string;
  selectedColor: string;
  onSelect: (icon: WalletIcon) => void;
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'all', name: 'All', icon: 'apps-outline' },
  { id: 'financial', name: 'Financial', icon: 'wallet-outline' },
  { id: 'lifestyle', name: 'Lifestyle', icon: 'heart-outline' },
  { id: 'travel', name: 'Travel', icon: 'airplane-outline' },
  { id: 'shopping', name: 'Shopping', icon: 'cart-outline' },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal-outline' },
];

export function IconPicker({ selectedIcon, selectedColor, onSelect, onClose }: IconPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const allIcons = getWalletIcons();

  const filteredIcons = activeCategory === 'all'
    ? allIcons
    : allIcons.filter((icon) => icon.category === activeCategory);

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
            <Text style={styles.title}>Choose an Icon</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={designSystem.colors.neutral.text} />
            </TouchableOpacity>
          </View>

          {/* Category Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  activeCategory === category.id && styles.categoryChipActive,
                ]}
                onPress={() => setActiveCategory(category.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={category.icon as any}
                  size={16}
                  color={
                    activeCategory === category.id
                      ? '#fff'
                      : designSystem.colors.neutral.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.categoryText,
                    activeCategory === category.id && styles.categoryTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Icon Grid */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.iconGrid}>
              {filteredIcons.map((icon) => (
                <TouchableOpacity
                  key={icon.id}
                  style={[
                    styles.iconButton,
                    selectedIcon === icon.ionicon && styles.iconButtonSelected,
                  ]}
                  onPress={() => onSelect(icon)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: selectedIcon === icon.ionicon ? selectedColor : designSystem.colors.neutral.muted },
                    ]}
                  >
                    <Ionicons
                      name={icon.ionicon as any}
                      size={24}
                      color={
                        selectedIcon === icon.ionicon
                          ? '#fff'
                          : designSystem.colors.neutral.textSecondary
                      }
                    />
                  </View>
                  <Text style={styles.iconLabel} numberOfLines={1}>
                    {icon.name}
                  </Text>
                  {selectedIcon === icon.ionicon && (
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark-circle" size={16} color={designSystem.colors.brand.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {filteredIcons.length} {filteredIcons.length === 1 ? 'icon' : 'icons'} available
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
    marginBottom: designSystem.spacing.md,
  },
  title: {
    ...designSystem.typography.textStyles.h2,
    color: designSystem.colors.neutral.text,
  },
  categoryScroll: {
    marginBottom: designSystem.spacing.md,
  },
  categoryScrollContent: {
    gap: designSystem.spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.sm,
    borderRadius: designSystem.radius.full,
    backgroundColor: designSystem.colors.neutral.background,
    borderWidth: 1,
    borderColor: designSystem.colors.neutral.border,
  },
  categoryChipActive: {
    backgroundColor: designSystem.colors.brand.primary,
    borderColor: designSystem.colors.brand.primary,
  },
  categoryText: {
    ...designSystem.typography.textStyles.bodySmall,
    color: designSystem.colors.neutral.textSecondary,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
  },
  scrollView: {
    maxHeight: 450,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.md,
  },
  iconButton: {
    width: '30%',
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  iconButtonSelected: {
    opacity: 1,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLabel: {
    ...designSystem.typography.textStyles.caption,
    color: designSystem.colors.neutral.textSecondary,
    textAlign: 'center',
    fontSize: 12,
  },
  checkmark: {
    position: 'absolute',
    top: 0,
    right: 10,
  },
  footer: {
    marginTop: designSystem.spacing.md,
    paddingTop: designSystem.spacing.md,
    borderTopWidth: 1,
    borderTopColor: designSystem.colors.neutral.border,
    alignItems: 'center',
  },
  footerText: {
    ...designSystem.typography.textStyles.caption,
    color: designSystem.colors.neutral.textSecondary,
  },
});
