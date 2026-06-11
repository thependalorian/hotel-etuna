/**
 * Payment receipt PDF — per completed transaction.
 * Location: components/features/documents/ReceiptPDF.tsx
 */

import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import type { DocumentMetadataSnapshot } from '@/lib/services/documents/document-types';
import { DocumentPdfShell } from '@/components/features/documents/DocumentPdfShell';

const styles = StyleSheet.create({
  receipt: { marginTop: 12, fontSize: 11 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
});

export function ReceiptPDF({ data }: { data: DocumentMetadataSnapshot }) {
  const txn = data.transaction;

  return (
    <DocumentPdfShell data={data} documentTitle="Payment Receipt">
      {txn ? (
        <View style={styles.receipt}>
          <View style={styles.row}>
            <Text>Amount received</Text>
            <Text>
              {txn.amount.toFixed(2)} {data.totals.currency}
            </Text>
          </View>
          <View style={styles.row}>
            <Text>Method</Text>
            <Text>{txn.method}</Text>
          </View>
          <View style={styles.row}>
            <Text>Reference</Text>
            <Text>{txn.reference}</Text>
          </View>
          <View style={styles.row}>
            <Text>Processed</Text>
            <Text>{txn.processedAt.slice(0, 19).replace('T', ' ')}</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.receipt}>Payment received — thank you.</Text>
      )}
    </DocumentPdfShell>
  );
}
