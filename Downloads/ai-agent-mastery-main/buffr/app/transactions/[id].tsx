/**
 * Transaction Receipt Screen
 * 
 * Location: app/transactions/[id].tsx
 * Purpose: Display full transaction receipt/log details
 * 
 * Based on Receipt.svg design
 * Uses ReceiptView component from components/transactions/
 * Uses TransactionsContext for state management
 * Includes loading state and PDF export functionality
 */

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ReceiptView } from '@/components/transactions';
import AnimatedReceiptView from '@/components/transactions/AnimatedReceiptView';
import { useTransactions } from '@/contexts/TransactionsContext';
import Colors from '@/constants/Colors';
import { exportReceiptToPDF } from '@/utils/pdfExport';

export default function TransactionReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getTransactionById, loading } = useTransactions();
  const [exportingPDF, setExportingPDF] = useState(false);

  // Get transaction data from context
  const transaction = useMemo(() => {
    if (!id) return null;
    return getTransactionById(id);
  }, [id, getTransactionById]);

  // Generate reference number from transaction ID
  const reference = useMemo(() => {
    if (!transaction) return undefined;
    return transaction.reference || `BFR-${transaction.id.padStart(8, '0')}-${new Date(transaction.date).getTime().toString().slice(-6)}`;
  }, [transaction]);

  // Handle PDF export
  const handleExportPDF = async () => {
    if (!transaction) return;

    setExportingPDF(true);
    try {
      await exportReceiptToPDF(transaction, reference);
      Alert.alert('Success', 'Receipt exported successfully!');
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      const errorMessage = error?.message?.includes('not available') || error?.message?.includes('native module')
        ? 'PDF export requires a native build. Please rebuild the app with: npx expo prebuild && npx expo run:ios (or run:android)'
        : 'Failed to export receipt. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setExportingPDF(false);
    }
  };

  // Loading state
  if (loading && !transaction) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <FontAwesome name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading transaction...</Text>
        </View>
      </View>
    );
  }

  // Error state - transaction not found
  if (!transaction) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <FontAwesome name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>Transaction not found</Text>
          <TouchableOpacity
            style={styles.backToTransactionsButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backToTransactionsText}>Back to Transactions</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Map 'request' type to 'sent' for ReceiptView component
  const receiptType = transaction.type === 'request' ? 'sent' : transaction.type;

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <FontAwesome name="arrow-left" size={24} color={Colors.text} />
      </TouchableOpacity>

      {/* Export PDF Button */}
      <TouchableOpacity
        style={styles.exportButton}
        onPress={handleExportPDF}
        disabled={exportingPDF}
      >
        {exportingPDF ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <>
            <FontAwesome name="file-pdf-o" size={18} color={Colors.white} />
            <Text style={styles.exportButtonText}>Export PDF</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Receipt View with Animation */}
      <AnimatedReceiptView
        transactionId={transaction.id}
        type={receiptType as 'sent' | 'received' | 'payment' | 'transfer'}
        amount={transaction.amount}
        description={transaction.description}
        date={transaction.date}
        recipient={transaction.recipient}
        sender={transaction.sender}
        reference={reference}
        status={transaction.status}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  exportButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    shadowColor: Colors.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  backToTransactionsButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 24,
  },
  backToTransactionsText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
