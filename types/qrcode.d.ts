/**
 * Type declaration for 'qrcode' module (no @types/qrcode).
 * Location: types/qrcode.d.ts
 */
declare module 'qrcode' {
  export interface QRCodeToDataURLOptions {
    type?: 'image/png' | 'image/jpeg' | 'image/webp';
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    margin?: number;
    width?: number;
    color?: { dark?: string; light?: string };
  }
  export function toDataURL(text: string, options?: QRCodeToDataURLOptions): Promise<string>;
  export function toString(text: string, options?: { type?: string; errorCorrectionLevel?: string }): Promise<string>;
  export default { toDataURL, toString };
}
