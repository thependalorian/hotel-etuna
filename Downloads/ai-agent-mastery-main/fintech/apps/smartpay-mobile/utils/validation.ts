/**
 * Validation utility functions
 */

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 7 && cleaned.length <= 15;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateAmount(amount: string | number): boolean {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && num > 0;
}

export function validateOTP(code: string): boolean {
  return /^\d{6}$/.test(code);
}

export function validateName(name: string): boolean {
  return name.trim().length >= 2;
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}
