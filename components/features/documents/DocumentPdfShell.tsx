/**
 * Shared PDF layout — NamRA supplier block, footer, line table.
 * Location: components/features/documents/DocumentPdfShell.tsx
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { DocumentMetadataSnapshot } from '@/lib/services/documents/document-types';
import { pdfFontFamily } from '@/lib/services/documents/pdf-fonts';

const styles = StyleSheet.create({
  page: {
    fontFamily: pdfFontFamily,
    fontSize: 10,
    padding: 40,
    color: '#1a1a1a',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#c4a574',
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#555',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  col: { width: '48%' },
  label: { fontSize: 9, color: '#666', marginBottom: 2 },
  value: { fontSize: 10, marginBottom: 6 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f0e8',
    padding: 6,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  colDesc: { width: '55%' },
  colAmt: { width: '45%', textAlign: 'right' },
  totals: {
    marginTop: 12,
    alignSelf: 'flex-end',
    width: '45%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#333',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#666',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 8,
  },
});

type DocumentPdfShellProps = {
  data: DocumentMetadataSnapshot;
  documentTitle: string;
  children?: React.ReactNode;
};

export function DocumentPdfShell({ data, documentTitle, children }: DocumentPdfShellProps) {
  const { property, guest, totals, tax } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{documentTitle}</Text>
          <Text style={styles.subtitle}>{data.referenceNumber}</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Supplier (Tax Invoice)</Text>
            <Text style={styles.value}>{property.legalName}</Text>
            <Text style={styles.value}>CC: {property.ccNumber ?? '—'}</Text>
            <Text style={styles.value}>VAT: {property.vatRef ?? '—'}</Text>
            <Text style={styles.value}>{property.postalAddress}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Guest</Text>
            <Text style={styles.value}>{guest.name}</Text>
            <Text style={styles.value}>{guest.email}</Text>
            {guest.phone ? <Text style={styles.value}>{guest.phone}</Text> : null}
            <Text style={styles.label}>Booking</Text>
            <Text style={styles.value}>{data.bookingReference}</Text>
            <Text style={styles.value}>
              {data.checkInDate} → {data.checkOutDate}
            </Text>
            <Text style={styles.label}>Issued</Text>
            <Text style={styles.value}>{data.issuedAt.slice(0, 10)}</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Description</Text>
          <Text style={styles.colAmt}>Amount ({totals.currency})</Text>
        </View>
        {data.lineItems.map((line, idx) => (
          <View key={`${line.description}-${idx}`} style={styles.tableRow}>
            <Text style={styles.colDesc}>{line.description}</Text>
            <Text style={styles.colAmt}>{line.amount.toFixed(2)}</Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Taxable base (ex VAT)</Text>
            <Text>{tax.taxableBase.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>VAT 15%</Text>
            <Text>{tax.vat15.toFixed(2)}</Text>
          </View>
          {tax.ntbLevy2 > 0 ? (
            <View style={styles.totalRow}>
              <Text>NTB tourism levy 2%</Text>
              <Text>{tax.ntbLevy2.toFixed(2)}</Text>
            </View>
          ) : null}
          <View style={styles.grandTotal}>
            <Text>Total</Text>
            <Text>{totals.total.toFixed(2)} {totals.currency}</Text>
          </View>
        </View>

        {children}

        <View style={styles.footer} fixed>
          <Text>
            Prices are {data.pricesVatInclusive ? 'VAT-inclusive' : 'VAT-exclusive'} where shown.
            NTB levy applies to accommodation only. VAT reg. {property.vatRef ?? '—'}.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
