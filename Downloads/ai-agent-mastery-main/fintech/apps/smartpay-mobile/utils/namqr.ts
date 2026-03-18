/**
 * NAMQR Validator & Parser
 * 
 * NAMQR v5.0 Standards (Bank of Namibia)
 * EMV-compliant QR code format for Namibian payments
 * 
 * TAG STRUCTURE:
 * - Tag 00: Payload Format Indicator (e.g., "01")
 * - Tag 53: Transaction Currency (NAD - Namibian Dollar)
 * - Tag 58: Country Code (NA - Namibia)
 * - Tag 65: Token Vault ID (SmartpayID)
 * - Tag 63: CRC-16 checksum
 * 
 * FORMAT: TTLLVV where:
 * - TT = 2-digit tag
 * - LL = 2-digit length
 * - VV = variable-length value
 * 
 * EXAMPLE:
 * 000201 (Tag 00, Length 02, Value "01")
 * 5303NAD (Tag 53, Length 03, Value "NAD")
 * 5802NA (Tag 58, Length 02, Value "NA")
 * 6512SP-12345678 (Tag 65, Length 12, Value "SP-12345678")
 * 6304XXXX (Tag 63, Length 04, Value CRC-16)
 */

export interface NAMQRData {
  version: string;
  currency: string;
  country: string;
  smartpayId: string;
  amount?: number;
  merchantName?: string;
  merchantCategory?: string;
  checksum: string;
  isValid: boolean;
  rawData: string;
}

export interface NAMQRValidationResult {
  isValid: boolean;
  data?: NAMQRData;
  error?: string;
}

/**
 * Parse a NAMQR tag from the string
 * @param qrString The QR code string
 * @param startIndex Starting position
 * @returns Object with tag, length, value, and next position
 */
function parseTag(qrString: string, startIndex: number): {
  tag: string;
  length: number;
  value: string;
  nextIndex: number;
} | null {
  if (startIndex + 4 > qrString.length) {
    return null;
  }

  const tag = qrString.substring(startIndex, startIndex + 2);
  const lengthStr = qrString.substring(startIndex + 2, startIndex + 4);
  const length = parseInt(lengthStr, 10);

  if (isNaN(length)) {
    return null;
  }

  if (startIndex + 4 + length > qrString.length) {
    return null;
  }

  const value = qrString.substring(startIndex + 4, startIndex + 4 + length);
  const nextIndex = startIndex + 4 + length;

  return { tag, length, value, nextIndex };
}

/**
 * Calculate CRC-16 checksum for NAMQR validation
 * Uses CRC-16-CCITT algorithm (polynomial 0x1021)
 */
function calculateCRC16(data: string): string {
  const polynomial = 0x1021;
  let crc = 0xFFFF;

  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;

    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc = crc << 1;
      }
    }
  }

  crc &= 0xFFFF;
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Validate NAMQR checksum
 */
function validateChecksum(qrString: string): boolean {
  // Find checksum tag (63)
  const checksumTagIndex = qrString.lastIndexOf('6304');
  
  if (checksumTagIndex === -1) {
    return false;
  }

  // Extract the checksum value
  const checksumValue = qrString.substring(checksumTagIndex + 4, checksumTagIndex + 8);
  
  // Calculate checksum on data without the checksum itself
  const dataWithoutChecksum = qrString.substring(0, checksumTagIndex + 4);
  const calculatedChecksum = calculateCRC16(dataWithoutChecksum);

  return checksumValue === calculatedChecksum;
}

/**
 * Parse and validate a NAMQR code
 * @param qrString The scanned QR code string
 * @returns Validation result with parsed data or error
 */
export function parseNAMQR(qrString: string): NAMQRValidationResult {
  if (!qrString || typeof qrString !== 'string') {
    return {
      isValid: false,
      error: 'Invalid QR code: empty or not a string',
    };
  }

  // Remove whitespace
  qrString = qrString.trim();

  // Check minimum length (at least version + checksum)
  if (qrString.length < 12) {
    return {
      isValid: false,
      error: 'Invalid QR code: too short',
    };
  }

  // Parse all tags
  const tags: Record<string, string> = {};
  let currentIndex = 0;

  while (currentIndex < qrString.length) {
    const parsed = parseTag(qrString, currentIndex);
    
    if (!parsed) {
      break;
    }

    tags[parsed.tag] = parsed.value;
    currentIndex = parsed.nextIndex;
  }

  // Validate required tags
  const requiredTags = ['00', '53', '58', '63'];
  const missingTags = requiredTags.filter(tag => !tags[tag]);

  if (missingTags.length > 0) {
    return {
      isValid: false,
      error: `Missing required tags: ${missingTags.join(', ')}`,
    };
  }

  // Validate currency (must be NAD)
  if (tags['53'] !== 'NAD') {
    return {
      isValid: false,
      error: `Invalid currency: ${tags['53']} (expected NAD)`,
    };
  }

  // Validate country (must be NA)
  if (tags['58'] !== 'NA') {
    return {
      isValid: false,
      error: `Invalid country: ${tags['58']} (expected NA)`,
    };
  }

  // Validate checksum
  if (!validateChecksum(qrString)) {
    return {
      isValid: false,
      error: 'Invalid checksum',
    };
  }

  // Extract SmartpayID from tag 65 (Token Vault ID)
  const smartpayId = tags['65'] || '';
  
  if (!smartpayId) {
    return {
      isValid: false,
      error: 'SmartpayID not found in QR code',
    };
  }

  // Validate SmartpayID format (SP-XXXXXXXX)
  const smartpayIdPattern = /^SP-\d{8}$/;
  if (!smartpayIdPattern.test(smartpayId)) {
    return {
      isValid: false,
      error: `Invalid SmartpayID format: ${smartpayId}`,
    };
  }

  // Parse optional amount (tag 54)
  let amount: number | undefined;
  if (tags['54']) {
    amount = parseFloat(tags['54']);
    if (isNaN(amount) || amount <= 0) {
      amount = undefined;
    }
  }

  // Parse optional merchant info (tag 59 = name, tag 52 = category)
  const merchantName = tags['59'];
  const merchantCategory = tags['52'];

  // Build result
  const data: NAMQRData = {
    version: tags['00'],
    currency: tags['53'],
    country: tags['58'],
    smartpayId,
    amount,
    merchantName,
    merchantCategory,
    checksum: tags['63'],
    isValid: true,
    rawData: qrString,
  };

  return {
    isValid: true,
    data,
  };
}

/**
 * Generate a NAMQR code string
 * @param smartpayId The SmartpayID (e.g., SP-12345678)
 * @param amount Optional transaction amount
 * @returns NAMQR-formatted string
 */
export function generateNAMQR(
  smartpayId: string,
  amount?: number
): string {
  let qrString = '';

  // Tag 00: Payload Format Indicator
  qrString += '000201';

  // Tag 53: Currency (NAD)
  qrString += '5303NAD';

  // Tag 58: Country (NA)
  qrString += '5802NA';

  // Tag 65: Token Vault ID (SmartpayID)
  const smartpayIdLength = smartpayId.length.toString().padStart(2, '0');
  qrString += `65${smartpayIdLength}${smartpayId}`;

  // Tag 54: Amount (optional)
  if (amount && amount > 0) {
    const amountStr = amount.toFixed(2);
    const amountLength = amountStr.length.toString().padStart(2, '0');
    qrString += `54${amountLength}${amountStr}`;
  }

  // Tag 63: CRC-16 checksum (placeholder)
  qrString += '6304';

  // Calculate and append checksum
  const checksum = calculateCRC16(qrString);
  qrString += checksum;

  return qrString;
}

/**
 * Validate SmartpayID format
 * @param smartpayId The SmartpayID to validate
 * @returns true if valid format
 */
export function isValidSmartpayId(smartpayId: string): boolean {
  const pattern = /^SP-\d{8}$/;
  return pattern.test(smartpayId);
}

/**
 * Extract SmartpayID from various QR formats
 * Handles NAMQR, deep links, and plain SmartpayID
 */
export function extractSmartpayId(qrData: string): string | null {
  // Try parsing as NAMQR
  const namqrResult = parseNAMQR(qrData);
  if (namqrResult.isValid && namqrResult.data) {
    return namqrResult.data.smartpayId;
  }

  // Try extracting from deep link (e.g., smartpay://receive?id=SP-12345678)
  const deepLinkMatch = qrData.match(/[?&]id=(SP-\d{8})/);
  if (deepLinkMatch) {
    return deepLinkMatch[1];
  }

  // Try direct SmartpayID
  if (isValidSmartpayId(qrData)) {
    return qrData;
  }

  return null;
}

/**
 * Determine QR code type based on content
 */
export function getQRCodeType(qrData: string): 'namqr' | 'agent' | 'merchant' | 'till' | 'deeplink' | 'unknown' {
  const namqrResult = parseNAMQR(qrData);
  
  if (namqrResult.isValid && namqrResult.data) {
    // Check merchant category to determine type
    if (namqrResult.data.merchantCategory) {
      if (namqrResult.data.merchantCategory.includes('AGENT')) {
        return 'agent';
      }
      if (namqrResult.data.merchantCategory.includes('TILL')) {
        return 'till';
      }
      return 'merchant';
    }
    return 'namqr';
  }

  // Check for deep link
  if (qrData.includes('smartpay://') || qrData.includes('https://smartpay.na/')) {
    return 'deeplink';
  }

  return 'unknown';
}
