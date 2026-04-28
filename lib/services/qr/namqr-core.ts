/**
 * NamQR Core Utilities
 * Purpose: Shared TLV and CRC helpers for Open Banking and hospitality QR services.
 * Location: /lib/services/qr/namqr-core.ts
 */

export function buildNamQrTlv(tag: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${tag}${length}${value}`;
}

export function calculateNamQrCrc(payload: string): string {
  let crc = 0xFFFF;
  const bytes = Buffer.from(payload, 'utf8');

  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i] << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }

  crc &= 0xFFFF;
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
