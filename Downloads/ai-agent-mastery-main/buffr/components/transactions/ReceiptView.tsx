/**
 * ReceiptView Component
 * 
 * Location: components/transactions/ReceiptView.tsx
 * Purpose: Display transaction receipt details
 * 
 * Based on Receipt.svg design
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Share } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';

export interface ReceiptViewProps {
  transactionId: string;
  type: 'sent' | 'received' | 'payment' | 'transfer';
  amount: number;
  description: string;
  date: Date;
  recipient?: string;
  sender?: string;
  reference?: string;
  status: 'completed' | 'pending' | 'failed';
  onShare?: () => void;
}

export default function ReceiptView({
  type,
  amount,
  description,
  date,
  recipient,
  sender,
  reference,
  status,
  onShare,
}: ReceiptViewProps) {
  const handleShare = async () => {
    try {
      const receiptText = `Transaction Receipt\n\n${description}\nAmount: N$ ${amount.toLocaleString()}\nDate: ${date.toLocaleString()}\nReference: ${reference || 'N/A'}`;
      await Share.share({
        message: receiptText,
        title: 'Transaction Receipt',
      });
      onShare?.();
    } catch (error) {
      console.error('Error sharing receipt:', error);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'failed':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ScrollView style={defaultStyles.containerFull} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <FontAwesome
          name={status === 'completed' ? 'check-circle' : 'clock-o'}
          size={64}
          color={getStatusColor()}
        />
        <Text style={defaultStyles.headerMedium}>
          {status === 'completed' ? 'Transaction Complete' : 'Transaction Pending'}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.amountCard}>
        <Text style={styles.amountLabel}>
          {type === 'sent' || type === 'transfer' ? 'Amount Sent' : 'Amount Received'}
        </Text>
        <Text style={styles.amount}>N$ {amount.toLocaleString()}</Text>
      </View>

      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Description</Text>
          <Text style={styles.detailValue}>{description}</Text>
        </View>
        {recipient && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Recipient</Text>
            <Text style={styles.detailValue}>{recipient}</Text>
          </View>
        )}
        {sender && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sender</Text>
            <Text style={styles.detailValue}>{sender}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date & Time</Text>
          <Text style={styles.detailValue}>{formatDate(date)}</Text>
        </View>
        {reference && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reference</Text>
            <Text style={styles.detailValue}>{reference}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[defaultStyles.pillButton, styles.shareButton]}
        onPress={handleShare}
      >
        <FontAwesome name="share" size={20} color={Colors.white} />
        <Text style={defaultStyles.buttonText}>Share Receipt</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  amountCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 8,
  },
  amount: {
    fontSize: 42,
    fontWeight: '700',
    color: Colors.white,
  },
  detailsSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  shareButton: {
    flexDirection: 'row',
    gap: 8,
  },
});
