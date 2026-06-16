/**
 * Production password rules for traveller registration.
 * Location: lib/validation/password.ts
 */

import * as z from 'zod';

export const PASSWORD_MIN_LENGTH = 12;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, {
    message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
  })
  .max(128, { message: 'Password must be at most 128 characters.' })
  .regex(/[a-z]/, { message: 'Password must include a lowercase letter.' })
  .regex(/[A-Z]/, { message: 'Password must include an uppercase letter.' })
  .regex(/[0-9]/, { message: 'Password must include a number.' });
