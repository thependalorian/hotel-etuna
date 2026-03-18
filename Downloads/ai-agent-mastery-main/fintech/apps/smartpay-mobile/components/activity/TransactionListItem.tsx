/**
 * TransactionListItem - Activity tab list item (72px height).
 * 
 * Figma Specs: 72px height, 40px icon circle, three-column layout
 * Layout: [Icon] [Name + Type] [Amount + Time]
 * 
 * Location: components/activity/TransactionListItem.tsx
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { designSystem as DS } from '@/constants/designSystem';
import { 
  type Transaction, 
  formatTransactionType, 
  formatTransactionAmount,
  transactionIcon 
} from '@/services/transactions';

export interface TransactionListItemProps {
  transaction: Transaction;
  onPress: (transaction: Transaction) => void;
}

/**
 * Formats timestamp to relative time (e.g., "2h ago", "Just now").
 */
function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return new Date(timestamp).toLocaleDateString('en-NA', { 
    month: 'short', 
    day: 'numeric' 
  });
}

/**
 * Gets icon background color based on transaction type.
 */
function getIconBgColor(type: Transaction['type']): string {
  const isReceive = ['receive', 'voucher_redeem', 'add_money', 'loan_disbursement'].includes(type);
  return isReceive ? '#DCFCE7' : DS.colors.transactionBg;
}

/**
 * Gets icon color based on transaction type.
 */
function getIconColor(type: Transaction['type']): string {
  const isReceive = ['receive', 'voucher_redeem', 'add_money', 'loan_disbursement'].includes(type);
  return isReceive ? DS.colors.success : DS.colors.primary;
}

export function TransactionListItem({ transaction, onPress }: TransactionListItemProps) {
  const isReceive = ['receive', 'voucher_redeem', 'add_money', 'loan_disbursement'].includes(transaction.type);
  const iconName = transactionIcon(transaction.type);
  const iconBgColor = getIconBgColor(transaction.type);
  const iconColor = getIconColor(transaction.type);
  const formattedAmount = formatTransactionAmount(transaction);
  const relativeTime = formatRelativeTime(transaction.timestamp);
  const typeLabel = formatTransactionType(transaction.type);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(transaction)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${typeLabel} transaction with ${transaction.counterparty}, amount ${formattedAmount}`}
    >
      {/* Left: Icon circle (40px) */}
      <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
        <Ionicons 
          name={iconName as any} 
          size={20} 
          color={iconColor}
        />
      </View>

      {/* Center: Name + description */}
      <View style={styles.centerContent}>
        <Text style={styles.primaryText} numberOfLines={1}>
          {transaction.counterparty || typeLabel}
        </Text>
        <Text style={styles.secondaryText} numberOfLines={1}>
          {typeLabel} • {transaction.reference || transaction.id.slice(0, 8)}
        </Text>
      </View>

      {/* Right: Amount + time */}
      <View style={styles.rightContent}>
        <Text 
          style={[
            styles.amount,
            isReceive && styles.amountReceived
          ]}
          numberOfLines={1}
        >
          {formattedAmount}
        </Text>
        <Text style={styles.time} numberOfLines={1}>
          {relativeTime}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 72,
    paddingHorizontal: DS.spacing[4],
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: DS.colors.borderLight,
    backgroundColor: DS.colors.background,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: DS.colors.text,
    marginBottom: 2,
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '400',
    color: DS.colors.textSecondary,
  },
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 12,
    minWidth: 80,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: DS.colors.text,
    marginBottom: 2,
  },
  amountReceived: {
    color: DS.colors.success,
  },
  time: {
    fontSize: 12,
    fontWeight: '400',
    color: DS.colors.textTertiary,
  },
});
