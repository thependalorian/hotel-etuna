import { describe, expect, it } from 'vitest';
import {
  getHotelEtunaEmailSignatureHtml,
  getHotelEtunaEmailSignaturePlainText,
} from '@/lib/email/hotel-etuna-email-signature';
import { brand } from '@/lib/copy/brand';

describe('Hotel Etuna email signature', () => {
  it('uses Valley Street address and omits tours from marketing copy', () => {
    const html = getHotelEtunaEmailSignatureHtml({ siteUrl: 'https://hoteletuna.com' });
    const plain = getHotelEtunaEmailSignaturePlainText();

    expect(html).toContain('5544 Valley Street');
    expect(plain).toContain('5544 Valley Street');
    expect(html).not.toMatch(/Valley of the Leopard/i);
    expect(html).not.toMatch(/Cultural tours/i);
    expect(html).not.toMatch(/excursions/i);
    expect(plain).not.toMatch(/Cultural tours/i);
  });

  it('includes brand tagline, logo mark, and legal line', () => {
    const html = getHotelEtunaEmailSignatureHtml();
    expect(html).toContain(brand.tagline);
    expect(html).toContain(brand.assets.logoMark);
    expect(html).toContain('VAT 05517026-015');
    expect(html).toContain('frontdesk@hoteletuna.com');
  });

  it('supports optional staff name block', () => {
    const html = getHotelEtunaEmailSignatureHtml({
      staffName: 'Front Desk',
      staffTitle: 'Reservations',
    });
    expect(html).toContain('Front Desk');
    expect(html).toContain('Reservations');
  });
});
