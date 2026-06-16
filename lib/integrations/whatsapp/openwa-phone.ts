/**
 * OpenWA chatId helpers — normalize guest phone numbers for whatsapp-web.js transport.
 * Location: lib/integrations/whatsapp/openwa-phone.ts
 */

/** Strip non-digits from E.164 or local input. */
export function normalizeWhatsappDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

/** Convert Meta-style `from` or E.164 to OpenWA chatId (`{digits}@c.us`). */
export function toOpenWaChatId(phoneOrChatId: string): string {
  const trimmed = phoneOrChatId.trim();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  const digits = normalizeWhatsappDigits(trimmed);
  if (!digits) {
    throw new Error('Invalid WhatsApp phone');
  }
  return `${digits}@c.us`;
}

/** Extract digits from OpenWA `from` chatId for session keys and guest lookup. */
export function fromOpenWaChatId(chatId: string): string {
  const trimmed = chatId.trim();
  if (!trimmed.includes('@')) {
    return normalizeWhatsappDigits(trimmed);
  }
  return normalizeWhatsappDigits(trimmed.split('@')[0] ?? trimmed);
}
