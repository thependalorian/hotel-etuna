/**
 * react-pdf font registration — uses built-in Helvetica family (no CDN dependency).
 * Location: lib/services/documents/pdf-fonts.ts
 *
 * Drop Inter/Playfair TTFs under public/fonts/ and extend registerPdfFonts() when bundled.
 */

import { Font } from '@react-pdf/renderer';

let registered = false;

export function registerPdfFonts(): void {
  if (registered) return;
  // Built-in Helvetica is default; explicit registration keeps a single hook for custom fonts.
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}

export const pdfFontFamily = 'Helvetica';
