/**
 * Print Hotel Etuna HTML + plain-text email signatures for staff mail clients.
 * Usage: npx tsx scripts/print-email-signature.ts ["Staff Name"] ["Job title"]
 */

import {
  getHotelEtunaEmailSignatureHtml,
  getHotelEtunaEmailSignaturePlainText,
} from '../lib/email/hotel-etuna-email-signature';

const staffName = process.argv[2];
const staffTitle = process.argv[3];

const opts = {
  staffName: staffName || undefined,
  staffTitle: staffTitle || undefined,
  includeSocial: true,
  includeAmenities: true,
  includeLogo: true,
};

console.log('<!-- Paste below into Gmail / Outlook / Apple Mail (HTML mode) -->\n');
console.log(getHotelEtunaEmailSignatureHtml(opts));
console.log('\n\n--- PLAIN TEXT ---\n\n');
console.log(getHotelEtunaEmailSignaturePlainText(opts));
