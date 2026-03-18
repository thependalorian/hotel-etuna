/**
 * TransactionReceipt – Transaction details card with share button
 * Displays transaction ID, timestamp, amount, fee, and status
 * Location: mobile/components/shared/TransactionReceipt.tsx
 * 
 * USAGE:
 * ```tsx
 * <TransactionReceipt
 *   transaction={{
 *     id: 'TXN123',
 *     amount: 100,
 *     fee: 1.5,
 *     timestamp: '2026-03-17T14:23:00Z',
 *     status: 'completed',
 *   }}
 * />
 * ```
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { designSystem as DS } from '@/constants/designSystem';
import type { Transaction } from '@/services/transactions';

export interface TransactionReceiptProps {
  transaction: Transaction & {
    fee?: number;
    recipient?: string;
  };
  onShare?: () => void;
}

export function TransactionReceipt({
  transaction,
  onShare,
}: TransactionReceiptProps) {
  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const message = `Transaction Receipt\n\n` +
      `ID: ${transaction.id}\n` +
      `Amount: N$${transaction.amount.toFixed(2)}\n` +
      `${transaction.fee ? `Fee: N$${transaction.fee.toFixed(2)}\n` : ''}` +
      `Date: ${formatDate(transaction.timestamp)}\n` +
      `Status: ${transaction.status}`;

    try {
      await Share.share({ message });
      onShare?.();
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-NA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = () => {
    switch (transaction.status) {
      case 'completed':
        return DS.colors.success;
      case 'pending':
        return DS.colors.warning;
      case 'failed':
        return DS.colors.error;
      default:
        return DS.colors.textSecondary;
    }
  };

  const getStatusLabel = () => {
    switch (transaction.status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      default:
        return transaction.status;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transaction Receipt</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Share receipt"
          accessibilityRole="button"
        >
          <Ionicons name="share-outline" size={24} color={DS.colors.brand.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.details}>
        <View style={styles.row}>
          <Text style={styles.label}>Transaction ID</Text>
          <Text style={styles.value}>{transaction.id}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Date & Time</Text>
          <Text style={styles.value}>{formatDate(transaction.timestamp)}</Text>
        </View>

        {transaction.recipient && (
          <View style={styles.row}>
            <Text style={styles.label}>Recipient</Text>
            <Text style={styles.value}>{transaction.recipient}</Text>
          </View>
        )}

        <View style={styles.row}>
          <Text style={styles.label}>Amount</Text>
          <Text style={styles.valueAmount}>
            N$ {transaction.amount.toFixed(2)}
          </Text>
        </View>

        {transaction.fee && transaction.fee > 0 && (
          <View style={styles.row}>
            <Text style={styles.label}>Fee</Text>
            <Text style={styles.value}>N$ {transaction.fee.toFixed(2)}</Text>
          </View>
        )}

        <View style={[styles.row, styles.statusRow]}>
          <Text style={styles.label}>Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusLabel()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: DS.colors.background,
    borderRadius: DS.radius.lg,
    padding: DS.spacing.lg,
    ...DS.shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DS.spacing.md,
  },
  title: {
    fontSize: DS.typography.fontSize.xl,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
  },
  shareButton: {
    padding: DS.spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: DS.colors.border,
    marginBottom: DS.spacing.md,
  },
  details: {
    gap: DS.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
    flex: 1,
  },
  value: {
    fontSize: DS.typography.fontSize.sm,
    fontWeight: DS.typography.fontWeight.medium,
    color: DS.colors.text,
    flex: 1,
    textAlign: 'right',
  },
  valueAmount: {
    fontSize: DS.typography.fontSize.lg,
    fontWeight: DS.typography.fontWeight.bold,
    color: DS.colors.text,
    flex: 1,
    textAlign: 'right',
  },
  statusRow: {
    marginTop: DS.spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DS.spacing.sm,
    paddingVertical: DS.spacing.xs,
    borderRadius: DS.radius.pill,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: DS.typography.fontSize.sm,
    fontWeight: DS.typography.fontWeight.semibold,
  },
});
