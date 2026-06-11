/**
 * NamQrQrDisplay — shared QR card after NamQR generation (desk + guest folio).
 * Location: components/features/payments/NamQrQrDisplay.tsx
 */

import { formatDateTime } from '@/lib/formatters';

export type NamQrDisplayData = {
  qrReference: string;
  qrImageUrl: string;
  qrPayload?: string;
  expiresAt?: string;
};

type NamQrQrDisplayProps = {
  qr: NamQrDisplayData;
  /** Desk uses daisyUI card; guest uses nude border styling */
  variant?: 'desk' | 'guest';
  imageAlt?: string;
  maxImageWidthClass?: string;
};

export function NamQrQrDisplay({
  qr,
  variant = 'desk',
  imageAlt = 'NamQR payment code',
  maxImageWidthClass,
}: NamQrQrDisplayProps) {
  const imageClass =
    maxImageWidthClass ??
    (variant === 'guest' ? 'max-w-[220px]' : 'max-w-[240px]');

  const shellClass =
    variant === 'guest'
      ? 'rounded-lg border border-nude-200 bg-white p-4 space-y-2'
      : 'card bg-base-200 p-4 space-y-3';

  const expiryClass =
    variant === 'guest' ? 'text-xs text-nude-500' : 'text-xs text-base-content/60';

  return (
    <div className={shellClass}>
      <p className="text-sm">
        Reference: <span className="font-mono">{qr.qrReference}</span>
      </p>
      {qr.expiresAt && (
        <p className={expiryClass}>Expires: {formatDateTime(qr.expiresAt)}</p>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qr.qrImageUrl}
        alt={imageAlt}
        className={`mx-auto ${imageClass} rounded-lg bg-white p-2`}
      />
      {variant === 'desk' && qr.qrPayload && (
        <details className="text-xs">
          <summary className="cursor-pointer">EMV payload</summary>
          <pre className="mt-2 overflow-x-auto break-all whitespace-pre-wrap">{qr.qrPayload}</pre>
        </details>
      )}
    </div>
  );
}
