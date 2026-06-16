import { describe, expect, it } from 'vitest';
import {
  fromOpenWaChatId,
  normalizeWhatsappDigits,
  toOpenWaChatId,
} from '@/lib/integrations/whatsapp/openwa-phone';

describe('openwa-phone', () => {
  it('normalizes digits', () => {
    expect(normalizeWhatsappDigits('+264 81 802 4833')).toBe('264818024833');
  });

  it('builds chatId from E.164', () => {
    expect(toOpenWaChatId('264818024833')).toBe('264818024833@c.us');
    expect(toOpenWaChatId('264818024833@c.us')).toBe('264818024833@c.us');
  });

  it('extracts phone from chatId', () => {
    expect(fromOpenWaChatId('264818024833@c.us')).toBe('264818024833');
    expect(fromOpenWaChatId('264818024833')).toBe('264818024833');
  });
});
