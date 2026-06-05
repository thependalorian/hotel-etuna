/**
 * Print Hotel Etuna HTML + plain-text email signatures for staff mail clients.
 * Usage: npx tsx scripts/print-email-signature.ts ["Staff Name"] ["Job title"]
 */

import { securityLogger } from '@/lib/utils/security-logger';
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

securityLogger.info('<!-- Paste below into Gmail / Outlook / Apple Mail (HTML mode) -->\n');
securityLogger.info(getHotelEtunaEmailSignatureHtml(opts));
securityLogger.info('\n\n--- PLAIN TEXT ---\n\n');
securityLogger.info(getHotelEtunaEmailSignaturePlainText(opts));
