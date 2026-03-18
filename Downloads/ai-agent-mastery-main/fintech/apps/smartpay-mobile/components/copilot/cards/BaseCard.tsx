/**
 * BaseCard – Smartpay Agentic Copilot.
 * Reusable card template for all copilot response types.
 * Provides consistent styling, optional actions, and proper TypeScript typing.
 * Location: fintech/smartpay/components/copilot/cards/BaseCard.tsx
 */
import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { designSystem } from '@/constants/designSystem';

const ds = designSystem;

export interface BaseCardAction {
  /** Unique identifier for the action */
  id: string;
  /** Display label for the action button */
  label: string;
  /** Action handler */
  onPress: () => void;
  /** Action variant - primary (filled), secondary (outlined), or danger (red) */
  variant?: 'primary' | 'secondary' | 'danger';
  /** Disable the action */
  disabled?: boolean;
}

export interface BaseCardProps {
  /** Card title (optional) */
  title?: string;
  /** Card subtitle (optional) */
  subtitle?: string;
  /** Icon to display (optional) */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Main content of the card */
  children?: ReactNode;
  /** Array of action buttons to display at the bottom */
  actions?: BaseCardAction[];
  /** Additional custom styles for the card container */
  style?: ViewStyle;
  /** Card variant - default (white bg), info (blue tint), success (green tint), warning (yellow tint), error (red tint) */
  variant?: 'default' | 'info' | 'success' | 'warning' | 'error';
  /** Test ID for automated testing */
  testID?: string;
}

/**
 * BaseCard component - Reusable card template for copilot responses.
 * Supports title, subtitle, custom content, and action buttons.
 * 
 * @example
 * ```tsx
 * <BaseCard 
 *   title="Wallet Balance"
 *   subtitle="Main Wallet"
 *   actions={[
 *     { id: 'view', label: 'View Details', onPress: handleView, variant: 'primary' },
 *     { id: 'close', label: 'Close', onPress: handleClose, variant: 'secondary' }
 *   ]}
 * >
 *   <Text>Your balance is N$1,234.56</Text>
 * </BaseCard>
 * ```
 */
export function BaseCard({
  title,
  subtitle,
  icon,
  children,
  actions,
  style,
  variant = 'default',
  testID,
}: BaseCardProps) {
  const cardStyle = [
    styles.card,
    variant === 'info' && styles.cardInfo,
    variant === 'success' && styles.cardSuccess,
    variant === 'warning' && styles.cardWarning,
    variant === 'error' && styles.cardError,
    style,
  ];

  const getIconColor = () => {
    switch (variant) {
      case 'info':
        return ds.colors.info;
      case 'success':
        return ds.colors.success;
      case 'warning':
        return ds.colors.warning;
      case 'error':
        return ds.colors.error;
      default:
        return ds.colors.primary;
    }
  };

  return (
    <View style={cardStyle} testID={testID}>
      {/* Header */}
      {(title || subtitle || icon) && (
        <View style={styles.header}>
          {icon && (
            <Ionicons 
              name={icon} 
              size={24} 
              color={getIconColor()} 
              style={styles.headerIcon}
            />
          )}
          <View style={styles.headerText}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>
      )}

      {/* Content */}
      {children && <View style={styles.content}>{children}</View>}

      {/* Actions */}
      {actions && actions.length > 0 && (
        <View style={styles.actions}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.actionButton,
                action.variant === 'primary' && styles.actionButtonPrimary,
                action.variant === 'secondary' && styles.actionButtonSecondary,
                action.variant === 'danger' && styles.actionButtonDanger,
                action.disabled && styles.actionButtonDisabled,
              ]}
              onPress={action.onPress}
              disabled={action.disabled}
              activeOpacity={0.7}
              testID={`${testID}-action-${action.id}`}
            >
              <Text
                style={[
                  styles.actionText,
                  action.variant === 'primary' && styles.actionTextPrimary,
                  action.variant === 'secondary' && styles.actionTextSecondary,
                  action.variant === 'danger' && styles.actionTextDanger,
                  action.disabled && styles.actionTextDisabled,
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.md,
    padding: ds.spacing.md,
    marginVertical: ds.spacing.sm,
    marginHorizontal: ds.spacing.md,
    ...ds.shadows.sm,
  },
  cardInfo: {
    backgroundColor: ds.colors.feedback.blue100,
    borderLeftWidth: 4,
    borderLeftColor: ds.colors.semantic.info,
  },
  cardSuccess: {
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 4,
    borderLeftColor: ds.colors.semantic.success,
  },
  cardWarning: {
    backgroundColor: '#fffbeb',
    borderLeftWidth: 4,
    borderLeftColor: ds.colors.semantic.warning,
  },
  cardError: {
    backgroundColor: ds.colors.feedback.red100,
    borderLeftWidth: 4,
    borderLeftColor: ds.colors.semantic.error,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: ds.spacing.sm,
    gap: ds.spacing.sm,
  },
  headerIcon: {
    marginTop: 2,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...ds.typography.textStyles.h3,
    color: ds.colors.neutral.text,
    marginBottom: 4,
  },
  subtitle: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.textSecondary,
  },
  content: {
    marginBottom: ds.spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: ds.spacing.sm,
    marginTop: ds.spacing.sm,
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    borderRadius: ds.radius.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: ds.colors.brand.primary,
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: ds.colors.neutral.border,
  },
  actionButtonDanger: {
    backgroundColor: ds.colors.semantic.error,
  },
  actionButtonDisabled: {
    backgroundColor: ds.colors.neutral.muted,
    opacity: 0.5,
  },
  actionText: {
    ...ds.typography.textStyles.button,
    fontSize: 15,
  },
  actionTextPrimary: {
    color: '#fff',
  },
  actionTextSecondary: {
    color: ds.colors.neutral.text,
  },
  actionTextDanger: {
    color: '#fff',
  },
  actionTextDisabled: {
    color: ds.colors.neutral.textSecondary,
  },
});
