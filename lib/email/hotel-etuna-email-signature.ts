/**
 * Hotel Etuna — HTML and plain-text email signatures (staff + transactional footers).
 * Location: lib/email/hotel-etuna-email-signature.ts
 *
 * Logo CI Rustic Red + cream; body copy uses official CI secondary/accent palette.
 * Address: 5544 Valley Street (not Valley of the Leopard). Tours omitted from marketing copy.
 */

import { brand } from '@/lib/copy/brand';

/** Brand tokens for email clients that ignore class names */
export const EMAIL_SIGNATURE_COLORS = {
  logoRustic: brand.colors.rusticRed,
  logoCream: brand.colors.cream,
  terracotta800: brand.colors.secondary.chocolate,
  khaki600: brand.colors.accent.ochre,
  nude800: brand.colors.secondary.chocolate,
  nude50: brand.colors.accent.offWhite,
  nude200: brand.colors.cream,
  muted: brand.colors.secondary.taupe,
} as const;

const LEGAL_LINE =
  'Etuna Guesthouse and Tours CC · CC/2011/3890 · VAT 05517026-015';

const AMENITIES_LINE =
  'Standard, Executive & Premiere rooms · 35 rooms · Conference facilities · Restaurant · Swimming pool · Free Wi‑Fi';

const SERVICES_LINE = `${brand.proofPoints.shuttle} · ${brand.proofPoints.tradeFair}`;

export type HotelEtunaEmailSignatureOptions = {
  /** e.g. "Jane Nekwaya" — omit for generic property signature */
  staffName?: string;
  staffTitle?: string;
  /** Show Facebook / Instagram / WhatsApp row */
  includeSocial?: boolean;
  /** Condensed amenities bullets (transactional emails often use shorter footer) */
  includeAmenities?: boolean;
  /** Absolute site origin for logo + links */
  siteUrl?: string;
  /** Embed mark image (PNG for broad email client support). */
  includeLogo?: boolean;
};

function resolveSiteUrl(override?: string): string {
  const base =
    override ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    'https://hoteletuna.com';
  return base.replace(/\/$/, '');
}

/**
 * Full HTML signature block for Outlook / Gmail / Apple Mail paste, or transactional footers.
 */
export function getHotelEtunaEmailSignatureHtml(
  options: HotelEtunaEmailSignatureOptions = {}
): string {
  const siteUrl = resolveSiteUrl(options.siteUrl);
  const includeSocial = options.includeSocial ?? true;
  const includeAmenities = options.includeAmenities ?? true;
  const includeLogo = options.includeLogo ?? true;
  const c = EMAIL_SIGNATURE_COLORS;

  const staffBlock =
    options.staffName != null && options.staffName.length > 0
      ? `
        <tr>
          <td style="padding-bottom: 8px; font-size: 15px; font-weight: 600; color: ${c.logoRustic};">
            ${escapeHtml(options.staffName)}${options.staffTitle ? `<span style="font-weight: 400; color: ${c.nude800};"> · ${escapeHtml(options.staffTitle)}</span>` : ''}
          </td>
        </tr>`
      : '';

  const logoCell = includeLogo
    ? `
        <td style="vertical-align: top; padding-right: 16px; width: 64px;">
          <img src="${siteUrl}${brand.assets.logoMark}" width="56" height="56" alt="Hotel Etuna" style="display: block; border: 0; width: 56px; height: 56px;" />
        </td>`
    : '';

  const amenitiesRows = includeAmenities
    ? `
        <tr>
          <td style="padding-bottom: 10px; font-size: 13px; line-height: 1.5; color: ${c.nude800};">
            <span style="font-weight: 600; color: ${c.terracotta800};">✦</span> ${AMENITIES_LINE}
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 12px; font-size: 13px; line-height: 1.5; color: ${c.nude800};">
            <span style="font-weight: 600; color: ${c.terracotta800};">✦</span> ${escapeHtml(SERVICES_LINE)}
          </td>
        </tr>
        <tr>
          <td style="height: 1px; background-color: ${c.nude200}; font-size: 0; line-height: 0;">&nbsp;</td>
        </tr>`
    : '';

  const socialRow = includeSocial
    ? `
        <tr>
          <td style="padding-top: 14px;">
            <a href="https://facebook.com/hoteletuna" style="text-decoration: none; margin-right: 12px; color: ${c.khaki600};">Facebook</a>
            <a href="https://instagram.com/hoteletuna" style="text-decoration: none; margin-right: 12px; color: ${c.khaki600};">Instagram</a>
            <a href="https://wa.me/264818024833" style="text-decoration: none; color: ${c.khaki600};">WhatsApp</a>
          </td>
        </tr>`
    : '';

  return `
<!-- Hotel Etuna Email Signature -->
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 550px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: ${c.nude800}; background-color: ${c.nude50}; border-collapse: collapse; margin-top: 24px;">
  <tr>
    <td style="padding: 20px 18px 16px 18px; border-bottom: 2px solid ${c.khaki600};">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${logoCell}
          <td style="vertical-align: top;">
            <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: 700; color: ${c.logoRustic}; letter-spacing: 0.5px;">
              ${brand.name}
            </div>
            <div style="font-size: 14px; font-style: italic; color: ${c.khaki600}; padding-top: 4px;">
              “${brand.tagline}”
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 16px 18px 18px 18px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${staffBlock}
        ${amenitiesRows}
        <tr>
          <td style="padding: 12px 0 0 0; font-size: 13px; line-height: 1.55; color: ${c.nude800};">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align: top; padding-right: 8px;">📍</td>
                <td style="padding-bottom: 6px;">${escapeHtml(brand.address)}</td>
              </tr>
              <tr>
                <td style="vertical-align: top; padding-right: 8px;">📞</td>
                <td style="padding-bottom: 6px;">${escapeHtml(brand.phones.replace(' | ', ' / '))}</td>
              </tr>
              <tr>
                <td style="vertical-align: top; padding-right: 8px;">✉️</td>
                <td style="padding-bottom: 6px;">
                  <a href="mailto:${brand.emailFrontDesk}" style="color: ${c.khaki600}; text-decoration: none; border-bottom: 1px solid ${c.nude200};">${brand.emailFrontDesk}</a>
                </td>
              </tr>
              <tr>
                <td style="vertical-align: top; padding-right: 8px;">🌐</td>
                <td>
                  <a href="${siteUrl}" style="color: ${c.khaki600}; text-decoration: none; border-bottom: 1px solid ${c.nude200};">hoteletuna.com</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        ${socialRow}
        <tr>
          <td style="font-size: 11px; color: ${c.muted}; padding-top: 16px; border-top: 1px solid ${c.nude200};">
            ${LEGAL_LINE}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();
}

/** Plain-text signature for simple clients and `text/plain` MIME parts */
export function getHotelEtunaEmailSignaturePlainText(
  options: HotelEtunaEmailSignatureOptions = {}
): string {
  const siteUrl = resolveSiteUrl(options.siteUrl);
  const includeAmenities = options.includeAmenities ?? true;
  const includeSocial = options.includeSocial ?? true;

  const lines: string[] = [
    brand.name,
    `“${brand.tagline}”`,
    '',
  ];

  if (options.staffName) {
    lines.push(
      options.staffTitle
        ? `${options.staffName} · ${options.staffTitle}`
        : options.staffName,
      ''
    );
  }

  if (includeAmenities) {
    lines.push(AMENITIES_LINE, SERVICES_LINE, '');
  }

  lines.push(
    brand.address,
    brand.phones.replace(' | ', '  |  '),
    brand.emailFrontDesk,
    siteUrl,
    ''
  );

  if (includeSocial) {
    lines.push(
      'Facebook: /hoteletuna  |  Instagram: @hoteletuna  |  WhatsApp: +264 81 802 4833',
      ''
    );
  }

  lines.push(LEGAL_LINE);
  return lines.join('\n');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
