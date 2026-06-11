/**
 * Payment notification PDF — EFT / bank deposit acknowledgement.
 * Location: components/features/documents/PaymentNotificationPDF.tsx
 */

import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import type { DocumentMetadataSnapshot } from '@/lib/services/documents/document-types';
import { DocumentPdfShell } from '@/components/features/documents/DocumentPdfShell';

const styles = StyleSheet.create({
  box: {
    marginTop: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#c4a574',
    backgroundColor: '#faf8f5',
  },
  title: { fontSize: 11, fontWeight: 'bold', marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
});

export function PaymentNotificationPDF({ data }: { data: DocumentMetadataSnapshot }) {
  const txn = data.transaction;

  return (
    <DocumentPdfShell data={data} documentTitle="Payment Notification">
      <View style={styles.box}>
        <Text style={styles.title}>We have received your payment instruction</Text>
        {txn ? (
          <>
            <View style={styles.row}>
              <Text>Amount</Text>
              <Text>
                {txn.amount.toFixed(2)} {data.totals.currency}
              </Text>
            </View>
            <View style={styles.row}>
              <Text>Method</Text>
              <Text>{txn.method}</Text>
            </View>
            <View style={styles.row}>
              <Text>Bank / wallet reference</Text>
              <Text>{txn.reference}</Text>
            </View>
          </>
        ) : null}
        <Text style={{ marginTop: 6, fontSize: 9 }}>
          This is not a tax invoice. A receipt will be issued once funds clear.
        </Text>
      </View>
    </DocumentPdfShell>
  );
}
