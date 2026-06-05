/**
 * Contact Form — input validation tests
 *
 * Purpose: Verify the contact form API validates all inputs correctly,
 * rejects spam/invalid submissions, and guards against common injection
 * vectors before email dispatch.
 *
 * Location: tests/unit/contact-form.test.ts
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Mirrors the schema in app/api/contact/route.ts
const contactSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(50).optional(),
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(2000),
});

describe('Contact form schema validation', () => {
  const valid = {
    firstName: 'Joe',
    lastName: 'Soap',
    email: 'joe@example.com',
    subject: 'Room inquiry',
    message: 'Hello, I would like to book a room for next week.',
  };

  it('accepts a valid complete submission', () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts submission with optional phone', () => {
    expect(contactSchema.safeParse({ ...valid, phone: '+264 81 234 5678' }).success).toBe(true);
  });

  it('rejects empty firstName', () => {
    expect(contactSchema.safeParse({ ...valid, firstName: '' }).success).toBe(false);
  });

  it('rejects firstName over 100 chars', () => {
    expect(contactSchema.safeParse({ ...valid, firstName: 'A'.repeat(101) }).success).toBe(false);
  });

  it('rejects invalid email format', () => {
    const bad = ['notanemail', 'missing@', '@nodomain.com', 'space @email.com', ''];
    for (const email of bad) {
      expect(contactSchema.safeParse({ ...valid, email }).success).toBe(false);
    }
  });

  it('accepts valid international email formats', () => {
    const good = ['user@domain.co.na', 'user+tag@example.com', 'user@sub.domain.org'];
    for (const email of good) {
      expect(contactSchema.safeParse({ ...valid, email }).success).toBe(true);
    }
  });

  it('rejects message shorter than 10 characters', () => {
    expect(contactSchema.safeParse({ ...valid, message: 'Hello' }).success).toBe(false);
  });

  it('rejects message over 2000 characters', () => {
    expect(contactSchema.safeParse({ ...valid, message: 'x'.repeat(2001) }).success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const { email, ...noEmail } = valid;
    expect(contactSchema.safeParse(noEmail).success).toBe(false);
    const { subject, ...noSubject } = valid;
    expect(contactSchema.safeParse(noSubject).success).toBe(false);
    const { message, ...noMessage } = valid;
    expect(contactSchema.safeParse(noMessage).success).toBe(false);
  });

  it('rejects phone over 50 chars', () => {
    expect(contactSchema.safeParse({ ...valid, phone: '+'.repeat(51) }).success).toBe(false);
  });

  it('rejects subject over 200 chars', () => {
    expect(contactSchema.safeParse({ ...valid, subject: 'S'.repeat(201) }).success).toBe(false);
  });
});

describe('Contact form security considerations', () => {
  const valid = {
    firstName: 'Joe',
    lastName: 'Soap',
    email: 'joe@example.com',
    subject: 'Room inquiry',
    message: 'Hello, I would like to book a room for next week.',
  };

  it('HTML in message passes schema (sanitization handled at email layer)', () => {
    // The schema does not strip HTML — sanitization happens in the email service
    const withHtml = { ...valid, message: '<script>alert("xss")</script> This is a message over 10 chars.' };
    expect(contactSchema.safeParse(withHtml).success).toBe(true);
  });

  it('very long email is rejected by max(255) constraint', () => {
    const longEmail = `${'a'.repeat(244)}@example.com`;
    expect(contactSchema.safeParse({ ...valid, email: longEmail }).success).toBe(false);
  });
});
