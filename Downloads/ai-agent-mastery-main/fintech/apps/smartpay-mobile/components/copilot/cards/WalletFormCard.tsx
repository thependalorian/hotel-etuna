/**
 * WalletFormCard – Smartpay Agentic Copilot.
 * Form for creating or editing wallets with validation and real-time feedback.
 * Location: fintech/smartpay/components/copilot/cards/WalletFormCard.tsx
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { designSystem } from '@/constants/designSystem';
import {
  validateWalletName,
  type CreateWalletInput,
  type UpdateWalletInput,
  type WalletDetails,
} from '@/services/copilot/walletManagementService';
import { WalletTypeSelector } from './WalletTypeSelector';
import { IconPicker } from './IconPicker';

interface WalletFormCardProps {
  mode: 'create' | 'edit';
  initialData?: Partial<WalletDetails>;
  onSubmit: (data: CreateWalletInput | UpdateWalletInput) => Promise<void>;
  onCancel: () => void;
}

export function WalletFormCard({ mode, initialData, onSubmit, onCancel }: WalletFormCardProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState(initialData?.type || '');
  const [icon, setIcon] = useState(initialData?.icon || '');
  const [color, setColor] = useState(initialData?.color || '#2563eb');
  const [description, setDescription] = useState(initialData?.description || '');
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate name on change
  useEffect(() => {
    if (name.length > 0) {
      const validation = validateWalletName(name);
      setNameError(validation.valid ? null : validation.error || null);
    } else {
      setNameError(null);
    }
  }, [name]);

  const handleSubmit = async () => {
    // Final validation
    const nameValidation = validateWalletName(name);
    if (!nameValidation.valid) {
      setNameError(nameValidation.error || 'Invalid wallet name');
      return;
    }

    if (mode === 'create' && !type) {
      Alert.alert('Wallet Type Required', 'Please select a wallet type.');
      return;
    }

    if (!icon) {
      Alert.alert('Icon Required', 'Please select an icon for your wallet.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        await onSubmit({
          name: name.trim(),
          type,
          icon,
          color,
          description: description.trim() || undefined,
        } as CreateWalletInput);
      } else {
        const updates: UpdateWalletInput = {};
        if (name !== initialData?.name) updates.name = name.trim();
        if (icon !== initialData?.icon) updates.icon = icon;
        if (color !== initialData?.color) updates.color = color;
        if (description !== initialData?.description) updates.description = description.trim();
        
        await onSubmit(updates);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to save wallet'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = name.trim().length >= 2 && !nameError && icon && (mode === 'edit' || type);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {mode === 'create' ? 'Create New Wallet' : 'Edit Wallet'}
            </Text>
            <TouchableOpacity onPress={onCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={designSystem.colors.neutral.text} />
            </TouchableOpacity>
          </View>

          {/* Wallet Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Wallet Name *</Text>
            <TextInput
              style={[styles.input, nameError ? styles.inputError : null]}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Emergency Fund"
              placeholderTextColor={designSystem.colors.neutral.textTertiary}
              maxLength={50}
              autoFocus={mode === 'create'}
            />
            {nameError && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color={designSystem.colors.error} />
                <Text style={styles.errorText}>{nameError}</Text>
              </View>
            )}
            <Text style={styles.hint}>{name.length}/50 characters</Text>
          </View>

          {/* Wallet Type (Create mode only) */}
          {mode === 'create' && (
            <View style={styles.field}>
              <Text style={styles.label}>Wallet Type *</Text>
              <TouchableOpacity
                style={[styles.selector, type ? styles.selectorActive : null]}
                onPress={() => setShowTypeSelector(true)}
              >
                <View style={styles.selectorContent}>
                  {type ? (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color={designSystem.colors.brand.primary} />
                      <Text style={styles.selectorText}>{type}</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="apps-outline" size={20} color={designSystem.colors.neutral.textSecondary} />
                      <Text style={styles.selectorPlaceholder}>Select wallet type</Text>
                    </>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={designSystem.colors.neutral.textTertiary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Icon Picker */}
          <View style={styles.field}>
            <Text style={styles.label}>Icon *</Text>
            <TouchableOpacity
              style={[styles.selector, icon ? styles.selectorActive : null]}
              onPress={() => setShowIconPicker(true)}
            >
              <View style={styles.selectorContent}>
                {icon ? (
                  <>
                    <View style={[styles.iconPreview, { backgroundColor: color }]}>
                      <Ionicons name={icon as any} size={20} color="#fff" />
                    </View>
                    <Text style={styles.selectorText}>Icon selected</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="image-outline" size={20} color={designSystem.colors.neutral.textSecondary} />
                    <Text style={styles.selectorPlaceholder}>Choose an icon</Text>
                  </>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={designSystem.colors.neutral.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Color Picker */}
          <View style={styles.field}>
            <Text style={styles.label}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorList}>
              {getQuickColors().map((c) => (
                <TouchableOpacity
                  key={c.hex}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: c.hex },
                    color === c.hex && styles.colorSwatchActive,
                  ]}
                  onPress={() => setColor(c.hex)}
                  activeOpacity={0.7}
                >
                  {color === c.hex && <Ionicons name="checkmark" size={16} color="#fff" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Description (Optional) */}
          <View style={styles.field}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add a note about this wallet..."
              placeholderTextColor={designSystem.colors.neutral.textTertiary}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
            <Text style={styles.hint}>{description.length}/200 characters</Text>
          </View>

          {/* Preview */}
          {name && icon && (
            <View style={styles.previewSection}>
              <Text style={styles.label}>Preview</Text>
              <View style={[styles.previewCard, { borderColor: color }]}>
                <View style={[styles.previewIcon, { backgroundColor: color }]}>
                  <Ionicons name={icon as any} size={24} color="#fff" />
                </View>
                <View style={styles.previewContent}>
                  <Text style={styles.previewName}>{name}</Text>
                  {description && <Text style={styles.previewDescription}>{description}</Text>}
                </View>
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel} disabled={isSubmitting}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, (!isValid || isSubmitting) && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? (
                <Text style={styles.submitText}>Saving...</Text>
              ) : (
                <Text style={styles.submitText}>{mode === 'create' ? 'Create Wallet' : 'Save Changes'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      {showTypeSelector && (
        <WalletTypeSelector
          selectedType={type}
          onSelect={(selectedType) => {
            setType(selectedType.id);
            // Auto-set icon and color from type defaults
            if (!icon) setIcon(selectedType.icon);
            if (color === '#2563eb') setColor(selectedType.defaultColor);
            setShowTypeSelector(false);
          }}
          onClose={() => setShowTypeSelector(false)}
        />
      )}

      {showIconPicker && (
        <IconPicker
          selectedIcon={icon}
          selectedColor={color}
          onSelect={(selectedIcon) => {
            setIcon(selectedIcon.ionicon);
            setShowIconPicker(false);
          }}
          onClose={() => setShowIconPicker(false)}
        />
      )}
    </View>
  );
}

function getQuickColors() {
  return [
    { name: 'Blue', hex: '#2563eb' },
    { name: 'Green', hex: '#22c55e' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Red', hex: '#ef4444' },
    { name: 'Purple', hex: '#8b5cf6' },
    { name: 'Pink', hex: '#ec4899' },
    { name: 'Cyan', hex: '#06b6d4' },
    { name: 'Teal', hex: '#14b8a6' },
  ];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designSystem.colors.neutral.background,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: designSystem.colors.neutral.surface,
    margin: designSystem.spacing.md,
    borderRadius: designSystem.radius.lg,
    padding: designSystem.spacing.lg,
    ...designSystem.shadows.md,
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
  field: {
    marginBottom: designSystem.spacing.lg,
  },
  label: {
    ...designSystem.typography.textStyles.body,
    fontWeight: '600',
    color: designSystem.colors.neutral.text,
    marginBottom: designSystem.spacing.sm,
  },
  input: {
    ...designSystem.typography.textStyles.body,
    backgroundColor: designSystem.colors.neutral.background,
    borderWidth: 1,
    borderColor: designSystem.colors.neutral.border,
    borderRadius: designSystem.radius.md,
    padding: designSystem.spacing.md,
    color: designSystem.colors.neutral.text,
  },
  inputError: {
    borderColor: designSystem.colors.error,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  errorText: {
    ...designSystem.typography.textStyles.caption,
    color: designSystem.colors.error,
  },
  hint: {
    ...designSystem.typography.textStyles.caption,
    marginTop: 4,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: designSystem.colors.neutral.background,
    borderWidth: 1,
    borderColor: designSystem.colors.neutral.border,
    borderRadius: designSystem.radius.md,
    padding: designSystem.spacing.md,
  },
  selectorActive: {
    borderColor: designSystem.colors.brand.primary,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectorText: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.neutral.text,
    textTransform: 'capitalize',
  },
  selectorPlaceholder: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.neutral.textSecondary,
  },
  iconPreview: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorList: {
    flexDirection: 'row',
    gap: designSystem.spacing.sm,
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: designSystem.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchActive: {
    borderColor: designSystem.colors.neutral.text,
  },
  previewSection: {
    marginTop: designSystem.spacing.md,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designSystem.spacing.md,
    padding: designSystem.spacing.md,
    backgroundColor: designSystem.colors.neutral.background,
    borderRadius: designSystem.radius.md,
    borderWidth: 2,
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContent: {
    flex: 1,
  },
  previewName: {
    ...designSystem.typography.textStyles.body,
    fontWeight: '600',
    color: designSystem.colors.neutral.text,
  },
  previewDescription: {
    ...designSystem.typography.textStyles.bodySmall,
    color: designSystem.colors.neutral.textSecondary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: designSystem.spacing.md,
    marginTop: designSystem.spacing.xl,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: designSystem.spacing.md,
    borderRadius: designSystem.radius.md,
    borderWidth: 1,
    borderColor: designSystem.colors.neutral.border,
    alignItems: 'center',
  },
  cancelText: {
    ...designSystem.typography.textStyles.button,
    color: designSystem.colors.neutral.text,
  },
  submitButton: {
    flex: 1,
    paddingVertical: designSystem.spacing.md,
    borderRadius: designSystem.radius.md,
    backgroundColor: designSystem.colors.brand.primary,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    ...designSystem.typography.textStyles.button,
    color: '#fff',
  },
});
