/**
 * Quotation PDF — deposit due before arrival.
 * Location: components/features/documents/QuotationPDF.tsx
 */

import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import type { DocumentMetadataSnapshot } from '@/lib/services/documents/document-types';
import { DocumentPdfShell } from '@/components/features/documents/DocumentPdfShell';

const styles = StyleSheet.create({
  note: { marginTop: 16, fontSize: 10, color: '#333' },
  highlight: { fontWeight: 'bold', marginTop: 8 },
});

export function QuotationPDF({ data }: { data: DocumentMetadataSnapshot }) {
  const deposit = data.totals.depositDue ?? 0;
  const pct = data.totals.depositPercent ?? 30;

  return (
    <DocumentPdfShell data={data} documentTitle="Quotation">
      <View style={styles.note}>
        <Text>This quotation is valid for 14 days from issue date.</Text>
        <Text style={styles.highlight}>
          Deposit due: {deposit.toFixed(2)} {data.totals.currency} ({pct}% of total)
        </Text>
        {data.totals.balanceDue != null && data.totals.balanceDue > 0 ? (
          <Text>Balance on arrival: {data.totals.balanceDue.toFixed(2)} {data.totals.currency}</Text>
        ) : null}
      </View>
    </DocumentPdfShell>
  );
}
