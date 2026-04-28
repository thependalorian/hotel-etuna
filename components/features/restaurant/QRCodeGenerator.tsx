/**
 * QRCodeGenerator Component
 * 
 * Purpose: Generate and display QR codes for tables, menus, or orders
 * Location: /components/features/restaurant/QRCodeGenerator.tsx
 * 
 * Features:
 * - QR code generation
 * - Download functionality
 * - Print support
 * - Customizable size and data
 * - Responsive design
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Download, Printer, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface QRCodeGeneratorProps {
  data: string; // URL or data to encode
  title?: string;
  size?: number; // Size in pixels
  onDownload?: (dataUrl: string) => void;
  className?: string;
}

export default function QRCodeGenerator({
  data,
  title = 'QR Code',
  size = 256,
  onDownload,
  className = '',
}: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use a QR code API service (you can replace this with a library like qrcode.react)
        // For now, using a simple API endpoint
        const encodedData = encodeURIComponent(data);
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}`;
        
        // Verify the URL is accessible
        const response = await fetch(qrApiUrl);
        if (response.ok) {
          setQrCodeUrl(qrApiUrl);
        } else {
          throw new Error('Failed to generate QR code');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate QR code');
      } finally {
        setLoading(false);
      }
    };

    if (data) {
      generateQRCode();
    }
  }, [data, size]);

  const handleDownload = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `qrcode-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onDownload?.(qrCodeUrl);
    }
  };

  const handlePrint = () => {
    if (qrCodeUrl) {
      const printWindow = window.open();
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>${title}</title></head>
            <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
              <div style="text-align: center;">
                <h2>${title}</h2>
                <img src="${qrCodeUrl}" alt="QR Code" style="max-width: 100%;" />
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold font-display flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            {title}
          </h3>
        </div>

        {loading && (
          <div className="flex items-center justify-center min-h-64">
            <LoadingSpinner size="lg" text="Generating QR code..." />
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {qrCodeUrl && !loading && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="border-2 border-base-300 rounded-lg"
                style={{ width: size, height: size }}
              />
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handleDownload}
                className="btn btn-primary btn-sm min-h-[44px]"
                aria-label="Download QR code"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </button>
              <button
                onClick={handlePrint}
                className="btn btn-outline btn-sm min-h-[44px]"
                aria-label="Print QR code"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-base-content/60 break-all">{data}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
