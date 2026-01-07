/**
 * RequestStatus Component
 * 
 * Location: components/requests/RequestStatus.tsx
 * Purpose: Display request status and payment progress
 * 
 * Based on Requested Amount (paid 3/4).svg design
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';

interface RequestStatusProps {
  requestId: string;
  amount: number;
  paidAmount: number;
  recipientName: string;
  status: 'pending' | 'partial' | 'paid' | 'cancelled';
  onPay?: () => void;
  onCancel?: () => void;
}

export default function RequestStatus({
  amount,
  paidAmount,
  recipientName,
  status,
  onPay,
  onCancel,
}: RequestStatusProps) {
  const remainingAmount = amount - paidAmount;
  const progress = (paidAmount / amount) * 100;

  const getStatusColor = () => {
    switch (status) {
      case 'paid':
        return Colors.success;
      case 'partial':
        return Colors.warning;
      case 'cancelled':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'paid':
        return 'Fully Paid';
      case 'partial':
        return `Paid ${paidAmount.toLocaleString()} of ${amount.toLocaleString()}`;
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Pending Payment';
    }
  };

  return (
    <View style={defaultStyles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <FontAwesome
          name={status === 'paid' ? 'check-circle' : 'clock-o'}
          size={48}
          color={getStatusColor()}
        />
        <Text style={defaultStyles.headerMedium}>Request Status</Text>
        <Text style={styles.recipientName}>From {recipientName}</Text>
      </View>

      <View style={styles.amountSection}>
        <Text style={styles.amountLabel}>Requested Amount</Text>
        <Text style={styles.amount}>N$ {amount.toLocaleString()}</Text>
      </View>

      {status === 'partial' && (
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progress}%` }]}
            />
          </View>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              N$ {paidAmount.toLocaleString()} paid
            </Text>
            <Text style={styles.progressText}>
              N$ {remainingAmount.toLocaleString()} remaining
            </Text>
          </View>
        </View>
      )}

      <View style={styles.statusBadge}>
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>

      {status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity style={defaultStyles.pillButton} onPress={onPay}>
            <Text style={defaultStyles.buttonText}>Pay Request</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={defaultStyles.buttonOutline}
            onPress={onCancel}
          >
            <Text style={defaultStyles.buttonOutlineText}>Cancel Request</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  recipientName: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  amount: {
    fontSize: 42,
    fontWeight: '700',
    color: Colors.text,
  },
  progressSection: {
    width: '100%',
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 24,
    marginBottom: 32,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
});
