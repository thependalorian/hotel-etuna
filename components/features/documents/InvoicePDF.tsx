/**
 * Tax invoice PDF — issued when folio is closed.
 * Location: components/features/documents/InvoicePDF.tsx
 */

import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import type { DocumentMetadataSnapshot } from '@/lib/services/documents/document-types';
import { DocumentPdfShell } from '@/components/features/documents/DocumentPdfShell';

const styles = StyleSheet.create({
  taxInvoice: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  note: { marginTop: 12, fontSize: 9, color: '#444' },
});

export function InvoicePDF({ data }: { data: DocumentMetadataSnapshot }) {
  return (
    <DocumentPdfShell data={data} documentTitle="Tax Invoice">
      <View>
        <Text style={styles.taxInvoice}>TAX INVOICE</Text>
        <Text style={styles.note}>
          Final tax invoice for stay {data.bookingReference}. Folio closed.
        </Text>
      </View>
    </DocumentPdfShell>
  );
}
