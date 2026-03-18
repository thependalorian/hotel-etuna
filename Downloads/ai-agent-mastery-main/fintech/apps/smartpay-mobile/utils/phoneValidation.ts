/**
 * Phone Number Validation Utility
 * Location: utils/phoneValidation.ts
 * 
 * Provides secure validation and sanitization of phone numbers
 * to prevent injection attacks and ensure format consistency.
 */

export interface PhoneValidationResult {
  isValid: boolean;
  formatted: string | null;
  error: string | null;
}

/**
 * Validates and sanitizes a phone number with country code
 * 
 * @param countryCode - Country code (e.g., "+264" for Namibia)
 * @param phoneNumber - Phone number without country code
 * @returns Validation result with formatted number or error
 * 
 * @example
 * validatePhoneNumber("+264", "811234567")
 * // => { isValid: true, formatted: "+264811234567", error: null }
 * 
 * @security
 * - Removes all non-numeric characters except + prefix
 * - Validates country code format (+XX or +XXX)
 * - Validates phone number length (8-15 digits)
 * - Prevents injection attacks through strict character filtering
 */
export function validatePhoneNumber(
  countryCode: string,
  phoneNumber: string
): PhoneValidationResult {
  // Sanitize: remove all non-numeric characters except + from country code
  const cleanCode = countryCode.trim().replace(/[^\+\d]/g, '');
  
  // Sanitize: remove all non-numeric characters from phone number
  const cleanNumber = phoneNumber.trim().replace(/\D/g, '');
  
  // Validate country code format
  if (!cleanCode.startsWith('+')) {
    return {
      isValid: false,
      formatted: null,
      error: 'Country code must start with +'
    };
  }
  
  // Country code should be 2-4 digits after +
  const codeDigits = cleanCode.slice(1);
  if (codeDigits.length < 1 || codeDigits.length > 4) {
    return {
      isValid: false,
      formatted: null,
      error: 'Invalid country code format (e.g., +264)'
    };
  }
  
  // Validate phone number length (international standard: 8-15 digits)
  if (cleanNumber.length < 8) {
    return {
      isValid: false,
      formatted: null,
      error: 'Phone number too short (minimum 8 digits)'
    };
  }
  
  if (cleanNumber.length > 15) {
    return {
      isValid: false,
      formatted: null,
      error: 'Phone number too long (maximum 15 digits)'
    };
  }
  
  // All validations passed
  const formatted = `${cleanCode}${cleanNumber}`;
  
  return {
    isValid: true,
    formatted,
    error: null
  };
}

/**
 * Quick validation check without detailed error messages
 * Useful for UI disable/enable logic
 */
export function isValidPhoneNumber(countryCode: string, phoneNumber: string): boolean {
  const result = validatePhoneNumber(countryCode, phoneNumber);
  return result.isValid;
}

/**
 * Format phone number for display (adds spaces for readability)
 * 
 * @example
 * formatPhoneForDisplay("+264811234567")
 * // => "+264 81 123 4567"
 */
export function formatPhoneForDisplay(fullNumber: string): string {
  if (!fullNumber || fullNumber.length < 4) return fullNumber;
  
  const match = fullNumber.match(/^(\+\d{1,4})(\d{2})(\d{3})(\d+)$/);
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
  }
  
  return fullNumber;
}
