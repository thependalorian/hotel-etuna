/**
 * PDF Export Utility
 * 
 * Location: utils/pdfExport.ts
 * Purpose: Export transaction receipts as PDF files
 * 
 * Uses expo-print and expo-file-system for PDF generation
 */

import { Platform } from 'react-native';
import type { Transaction } from '@/contexts/TransactionsContext';

// Conditionally import native modules (only available in native builds)
let Print: any = null;
let FileSystem: any = null;
let Sharing: any = null;

// Safely import native modules
if (Platform.OS !== 'web') {
  try {
    Print = require('expo-print');
  } catch (error) {
    console.warn('expo-print not available:', error);
  }
  
  try {
    FileSystem = require('expo-file-system');
  } catch (error) {
    console.warn('expo-file-system not available:', error);
  }
  
  try {
    Sharing = require('expo-sharing');
  } catch (error) {
    console.warn('expo-sharing not available:', error);
  }
}

interface ExportReceiptOptions {
  transaction: Transaction;
  reference?: string;
}

export async function exportReceiptToPDF(
  transaction: Transaction,
  reference?: string
): Promise<void> {
  // Check if native modules are available
  if (!Print || !FileSystem || !Sharing) {
    throw new Error(
      'PDF export is not available. Please rebuild the app with native modules: npx expo prebuild && npx expo run:ios (or run:android)'
    );
  }

  try {
    // Generate HTML content for the receipt
    const htmlContent = generateReceiptHTML(transaction, reference);

    // Generate PDF
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      // Share the PDF
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Receipt',
        UTI: 'com.adobe.pdf',
      });
    } else {
      // Fallback: Save to documents directory
      const fileName = `receipt_${transaction.id}_${Date.now()}.pdf`;
      const newPath = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.moveAsync({
        from: uri,
        to: newPath,
      });
      console.log('PDF saved to:', newPath);
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

function generateReceiptHTML(transaction: Transaction, reference?: string): string {
  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'failed':
        return '#E11D48';
      default:
        return '#64748B';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'sent':
      case 'transfer':
        return 'Amount Sent';
      case 'received':
      case 'payment':
        return 'Amount Received';
      default:
        return 'Amount';
    }
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Transaction Receipt</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            padding: 40px 20px;
            background: #F8FAFC;
            color: #020617;
          }
          .receipt {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 2px solid #E2E8F0;
          }
          .logo {
            font-size: 32px;
            font-weight: 700;
            color: #0029D6;
            margin-bottom: 8px;
          }
          .title {
            font-size: 24px;
            font-weight: 600;
            color: #020617;
            margin-bottom: 8px;
          }
          .status-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 1px;
            color: ${getStatusColor(transaction.status)};
            background: ${getStatusColor(transaction.status)}20;
            margin-top: 12px;
          }
          .amount-section {
            background: #0029D6;
            border-radius: 16px;
            padding: 32px;
            text-align: center;
            margin-bottom: 32px;
            color: white;
          }
          .amount-label {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 8px;
          }
          .amount {
            font-size: 48px;
            font-weight: 700;
          }
          .details-section {
            margin-bottom: 32px;
          }
          .detail-row {
            padding: 16px 0;
            border-bottom: 1px solid #E2E8F0;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-size: 12px;
            font-weight: 500;
            color: #64748B;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .detail-value {
            font-size: 16px;
            font-weight: 500;
            color: #020617;
          }
          .footer {
            text-align: center;
            padding-top: 24px;
            border-top: 2px solid #E2E8F0;
            color: #64748B;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="logo">BUFFR</div>
            <div class="title">Transaction Receipt</div>
            <div class="status-badge">${transaction.status.toUpperCase()}</div>
          </div>
          
          <div class="amount-section">
            <div class="amount-label">${getTypeLabel(transaction.type)}</div>
            <div class="amount">N$ ${transaction.amount.toLocaleString()}</div>
          </div>
          
          <div class="details-section">
            <div class="detail-row">
              <div class="detail-label">Description</div>
              <div class="detail-value">${transaction.description}</div>
            </div>
            ${transaction.recipient ? `
            <div class="detail-row">
              <div class="detail-label">Recipient</div>
              <div class="detail-value">${transaction.recipient}</div>
            </div>
            ` : ''}
            ${transaction.sender ? `
            <div class="detail-row">
              <div class="detail-label">Sender</div>
              <div class="detail-value">${transaction.sender}</div>
            </div>
            ` : ''}
            <div class="detail-row">
              <div class="detail-label">Date & Time</div>
              <div class="detail-value">${formatDate(transaction.date)}</div>
            </div>
            ${reference ? `
            <div class="detail-row">
              <div class="detail-label">Reference</div>
              <div class="detail-value">${reference}</div>
            </div>
            ` : ''}
            <div class="detail-row">
              <div class="detail-label">Transaction ID</div>
              <div class="detail-value">${transaction.id}</div>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an official receipt from Buffr</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
