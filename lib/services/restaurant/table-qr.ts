/**
 * Restaurant table QR helpers — self-contained (no NAMQR dependency).
 * Location: lib/services/restaurant/table-qr.ts
 *
 * A table QR encodes the public guest menu URL (/t/[qr]). The image is generated locally
 * with the `qrcode` package so printed table codes don't depend on a third-party image API.
 */
import QRCode from 'qrcode';
import { getPublicAppUrl } from '@/lib/utils/public-app-url';

/** Public guest-facing scan target for a table QR lookup code. */
export function buildTableScanUrl(qrLookupCode: string): string {
  return `${getPublicAppUrl()}/t/${encodeURIComponent(qrLookupCode)}`;
}

/** PNG data URL of the table QR, suitable for storing and printing. */
export async function buildTableQrImageDataUrl(qrLookupCode: string): Promise<string> {
  return QRCode.toDataURL(buildTableScanUrl(qrLookupCode), {
    width: 300,
    margin: 1,
    errorCorrectionLevel: 'M',
  });
}
