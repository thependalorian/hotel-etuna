/**
 * NAMQR Code Utilities
 * 
 * Location: utils/namqr.ts
 * Purpose: Generate and parse NAMQR codes according to NAMQR Code Standards Version 5.0
 * 
 * Based on: NAMQR Code Standards Version 5.0 (09 May 2025)
 * 
 * NAMQR uses TLV (Tag-Length-Value) format where:
 * - Tag: 2-digit numeric (00-99)
 * - Length: 2-digit numeric (01-99)
 * - Value: Variable length data
 */

export interface NAMQRData {
  // Payload Format Indicator
  payloadFormatIndicator: string; // "01" for NAMQR
  
  // Point of Initiation Method
  pointOfInitiation: '11' | '12' | '13' | '14'; // 11=static payee, 12=dynamic payee, 13=static payer, 14=dynamic payer
  
  // Payee Account Information (Tag 26 for IPP)
  payeeAccountInfo?: {
    globallyUniqueIdentifier: string; // e.g., "na.com.operator.IPP"
    payeeIPPFullFormAlias: string; // IPP full form alias (e.g., "user@buffr")
    orgId?: string; // 6-12 digits, optional
    merchantId?: string; // For merchants only
    minimumAmount?: string; // Optional
  };
  
  // Alternative: Payee Account Information (Tag 17 for existing payment systems)
  payeeAccountInfoLegacy?: {
    globallyUniqueIdentifier: string; // e.g., "na.com.namclear.nrtc"
    payeePSPId: string;
    payeeIdentifier: string; // e.g., mobile number as alias
  };
  
  // Merchant Category Code
  merchantCategoryCode: string; // "0000" for P2P, actual MCC for merchants
  
  // Transaction Currency
  transactionCurrency?: string; // 3-digit ISO 4217 (e.g., "516" for NAD)
  
  // Transaction Amount
  transactionAmount?: string; // Up to 13 chars, format "99.34"
  
  // Country Code
  countryCode: string; // 2-character ISO 3166-1 alpha 2 (e.g., "NA")
  
  // Payee Name
  payeeName: string; // Up to 25 chars
  
  // Payee City
  payeeCity: string; // Up to 15 chars
  
  // Token Vault Unique Identifier
  tokenVaultUniqueIdentifier: string; // xx-digit unique identifier (mandatory)
  
  // Unreserved Template (Tag 80)
  unreservedTemplate?: {
    globallyUniqueIdentifier: string; // e.g., "na.com.operator.namqr"
    initiationMode: string; // e.g., "01" (Static NAMQR Code Offline)
    purpose?: string; // Optional purpose code
    merchantType?: string; // For merchants
    merchantGenre?: string; // For merchants
  };
  
  // Additional Data Field Template (Tag 62) - Optional
  additionalDataField?: {
    billNumber?: string;
    mobileNumber?: string;
    storeLabel?: string;
    referenceLabel?: string;
    shortDescription?: string;
  };
  
  // CRC (calculated automatically)
  crc?: string;
}

/**
 * Calculate CRC-16 checksum according to ISO/IEC 13239
 * Polynomial: 0x1021 (hex), Initial value: 0xFFFF (hex)
 * 
 * The CRC is calculated over all data objects including their Tag, Length and Value,
 * as well as the Tag and Length of the CRC itself (but excluding the CRC Value).
 */
function calculateCRC(data: string): string {
  const polynomial = 0x1021;
  let crc = 0xffff;
  
  // Convert string to bytes
  for (let i = 0; i < data.length; i++) {
    const byte = data.charCodeAt(i);
    crc ^= (byte << 8);
    
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  
  // Convert to 4-character uppercase hex string
  // Each nibble is converted to Alphanumeric Special character
  const hex = crc.toString(16).toUpperCase().padStart(4, '0');
  return hex;
}

/**
 * Format TLV (Tag-Length-Value) data object
 */
function formatTLV(tag: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${tag}${length}${value}`;
}

/**
 * Generate NAMQR code string from data
 */
export function generateNAMQR(data: NAMQRData): string {
  let qrString = '';
  
  // Tag 00: Payload Format Indicator (Mandatory)
  qrString += formatTLV('00', data.payloadFormatIndicator || '01');
  
  // Tag 01: Point of Initiation Method (Mandatory)
  qrString += formatTLV('01', data.pointOfInitiation);
  
  // Tag 26: Payee Account Information (IPP) - if using IPP
  if (data.payeeAccountInfo) {
    let payeeInfo = '';
    payeeInfo += formatTLV('00', data.payeeAccountInfo.globallyUniqueIdentifier);
    payeeInfo += formatTLV('01', data.payeeAccountInfo.payeeIPPFullFormAlias);
    
    if (data.payeeAccountInfo.orgId) {
      payeeInfo += formatTLV('02', data.payeeAccountInfo.orgId);
    }
    
    if (data.payeeAccountInfo.merchantId) {
      payeeInfo += formatTLV('03', data.payeeAccountInfo.merchantId);
    }
    
    if (data.payeeAccountInfo.minimumAmount) {
      payeeInfo += formatTLV('04', data.payeeAccountInfo.minimumAmount);
    }
    
    qrString += formatTLV('26', payeeInfo);
  }
  
  // Tag 17: Payee Account Information (Legacy) - if using existing payment systems
  if (data.payeeAccountInfoLegacy) {
    let payeeInfo = '';
    payeeInfo += formatTLV('00', data.payeeAccountInfoLegacy.globallyUniqueIdentifier);
    payeeInfo += formatTLV('01', data.payeeAccountInfoLegacy.payeePSPId);
    payeeInfo += formatTLV('02', data.payeeAccountInfoLegacy.payeeIdentifier);
    
    qrString += formatTLV('17', payeeInfo);
  }
  
  // Tag 52: Merchant Category Code (Mandatory)
  qrString += formatTLV('52', data.merchantCategoryCode);
  
  // Tag 53: Transaction Currency (Conditional)
  if (data.transactionCurrency) {
    qrString += formatTLV('53', data.transactionCurrency);
  }
  
  // Tag 54: Transaction Amount (Optional for static, Conditional for dynamic)
  if (data.transactionAmount) {
    qrString += formatTLV('54', data.transactionAmount);
  }
  
  // Tag 58: Country Code (Mandatory)
  qrString += formatTLV('58', data.countryCode);
  
  // Tag 59: Payee Name (Mandatory)
  qrString += formatTLV('59', data.payeeName);
  
  // Tag 60: Payee City (Mandatory)
  qrString += formatTLV('60', data.payeeCity);
  
  // Tag 62: Additional Data Field Template (Optional)
  if (data.additionalDataField) {
    let additionalData = '';
    
    if (data.additionalDataField.billNumber) {
      additionalData += formatTLV('01', data.additionalDataField.billNumber);
    }
    
    if (data.additionalDataField.mobileNumber) {
      additionalData += formatTLV('02', data.additionalDataField.mobileNumber);
    }
    
    if (data.additionalDataField.storeLabel) {
      additionalData += formatTLV('03', data.additionalDataField.storeLabel);
    }
    
    if (data.additionalDataField.referenceLabel) {
      additionalData += formatTLV('05', data.additionalDataField.referenceLabel);
    }
    
    if (data.additionalDataField.shortDescription) {
      additionalData += formatTLV('08', data.additionalDataField.shortDescription);
    }
    
    if (additionalData) {
      qrString += formatTLV('62', additionalData);
    }
  }
  
  // Tag 65: Token Vault Unique Identifier (Mandatory)
  qrString += formatTLV('65', data.tokenVaultUniqueIdentifier);
  
  // Tag 80: Unreserved Template (Mandatory)
  if (data.unreservedTemplate) {
    let unreserved = '';
    unreserved += formatTLV('00', data.unreservedTemplate.globallyUniqueIdentifier);
    unreserved += formatTLV('01', data.unreservedTemplate.initiationMode);
    
    if (data.unreservedTemplate.purpose) {
      unreserved += formatTLV('02', data.unreservedTemplate.purpose);
    }
    
    if (data.unreservedTemplate.merchantType) {
      unreserved += formatTLV('03', data.unreservedTemplate.merchantType);
    }
    
    if (data.unreservedTemplate.merchantGenre) {
      unreserved += formatTLV('04', data.unreservedTemplate.merchantGenre);
    }
    
    qrString += formatTLV('80', unreserved);
  }
  
  // Tag 63: CRC (Mandatory, always last)
  // Calculate CRC over all data objects including Tag, Length, and Value
  // Also include Tag (63) and Length (04) of CRC itself, but exclude CRC Value
  const crcData = qrString + '6304'; // Include Tag (63) and Length (04) of CRC
  const crc = calculateCRC(crcData);
  qrString += formatTLV('63', crc);
  
  return qrString;
}

/**
 * Parse TLV data from NAMQR string
 */
function parseTLV(qrString: string, startIndex: number): { tag: string; length: number; value: string; nextIndex: number } | null {
  if (startIndex + 4 > qrString.length) {
    return null;
  }
  
  const tag = qrString.substring(startIndex, startIndex + 2);
  const lengthStr = qrString.substring(startIndex + 2, startIndex + 4);
  const length = parseInt(lengthStr, 10);
  
  if (isNaN(length) || startIndex + 4 + length > qrString.length) {
    return null;
  }
  
  const value = qrString.substring(startIndex + 4, startIndex + 4 + length);
  const nextIndex = startIndex + 4 + length;
  
  return { tag, length, value, nextIndex };
}

/**
 * Parse nested TLV (for templates like Tag 26, 17, 62, 80)
 */
function parseNestedTLV(value: string): Record<string, string> {
  const result: Record<string, string> = {};
  let index = 0;
  
  while (index < value.length) {
    const tlv = parseTLV(value, index);
    if (!tlv) break;
    result[tlv.tag] = tlv.value;
    index = tlv.nextIndex;
  }
  
  return result;
}

/**
 * Parse NAMQR code string
 */
export function parseNAMQR(qrString: string): { data: NAMQRData | null; error?: string } {
  try {
    const data: Partial<NAMQRData> = {};
    let index = 0;
    let crcValue: string | null = null;
    
    while (index < qrString.length) {
      const tlv = parseTLV(qrString, index);
      if (!tlv) break;
      
      switch (tlv.tag) {
        case '00':
          data.payloadFormatIndicator = tlv.value;
          break;
        case '01':
          data.pointOfInitiation = tlv.value as '11' | '12' | '13' | '14';
          break;
        case '17': {
          // Payee Account Information (Legacy)
          const nested = parseNestedTLV(tlv.value);
          data.payeeAccountInfoLegacy = {
            globallyUniqueIdentifier: nested['00'] || '',
            payeePSPId: nested['01'] || '',
            payeeIdentifier: nested['02'] || '',
          };
          break;
        }
        case '26': {
          // Payee Account Information (IPP)
          const nested = parseNestedTLV(tlv.value);
          data.payeeAccountInfo = {
            globallyUniqueIdentifier: nested['00'] || '',
            payeeIPPFullFormAlias: nested['01'] || '',
            orgId: nested['02'],
            merchantId: nested['03'],
            minimumAmount: nested['04'],
          };
          break;
        }
        case '52':
          data.merchantCategoryCode = tlv.value;
          break;
        case '53':
          data.transactionCurrency = tlv.value;
          break;
        case '54':
          data.transactionAmount = tlv.value;
          break;
        case '58':
          data.countryCode = tlv.value;
          break;
        case '59':
          data.payeeName = tlv.value;
          break;
        case '60':
          data.payeeCity = tlv.value;
          break;
        case '62': {
          // Additional Data Field Template
          const nested = parseNestedTLV(tlv.value);
          data.additionalDataField = {
            billNumber: nested['01'],
            mobileNumber: nested['02'],
            storeLabel: nested['03'],
            referenceLabel: nested['05'],
            shortDescription: nested['08'],
          };
          break;
        }
        case '65':
          data.tokenVaultUniqueIdentifier = tlv.value;
          break;
        case '80': {
          // Unreserved Template
          const nested = parseNestedTLV(tlv.value);
          data.unreservedTemplate = {
            globallyUniqueIdentifier: nested['00'] || '',
            initiationMode: nested['01'] || '',
            purpose: nested['02'],
            merchantType: nested['03'],
            merchantGenre: nested['04'],
          };
          break;
        }
        case '63':
          // CRC is always last
          crcValue = tlv.value;
          break;
      }
      
      index = tlv.nextIndex;
    }
    
    // Validate required fields
    if (!data.payloadFormatIndicator || !data.pointOfInitiation || !data.merchantCategoryCode ||
        !data.countryCode || !data.payeeName || !data.payeeCity || !data.tokenVaultUniqueIdentifier) {
      return {
        data: null,
        error: 'Missing required NAMQR fields',
      };
    }
    
    // Verify CRC (if present)
    if (crcValue) {
      // Recalculate CRC excluding the CRC tag itself
      const dataWithoutCRC = qrString.substring(0, qrString.length - 8); // Remove "6304" + CRC value
      const calculatedCRC = calculateCRC(dataWithoutCRC + '6304'); // Add tag and length
      
      if (calculatedCRC !== crcValue) {
        return {
          data: null,
          error: 'CRC validation failed - QR code may be corrupted',
        };
      }
    }
    
    return { data: data as NAMQRData };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to parse NAMQR code',
    };
  }
}

/**
 * Generate NAMQR for Buffr account (main account)
 */
export function generateBuffrAccountNAMQR(
  phoneNumber: string,
  userName: string,
  userCity: string,
  tokenVaultId: string,
  amount?: string,
  isStatic: boolean = true
): string {
  const data: NAMQRData = {
    payloadFormatIndicator: '01',
    pointOfInitiation: isStatic ? '11' : '12', // Payee presented static/dynamic
    payeeAccountInfo: {
      globallyUniqueIdentifier: 'na.com.buffr.IPP', // Buffr IPP identifier
      payeeIPPFullFormAlias: `${phoneNumber}@buffr`, // IPP full form alias
    },
    merchantCategoryCode: '0000', // P2P transaction
    transactionCurrency: amount ? '516' : undefined, // 516 = NAD (Namibian Dollar)
    transactionAmount: amount,
    countryCode: 'NA', // Namibia
    payeeName: userName.substring(0, 25),
    payeeCity: userCity.substring(0, 15),
    tokenVaultUniqueIdentifier: tokenVaultId,
    unreservedTemplate: {
      globallyUniqueIdentifier: 'na.com.buffr.namqr',
      initiationMode: isStatic ? '01' : '15', // 01=Static Offline, 15=Dynamic Offline
    },
  };
  
  return generateNAMQR(data);
}

/**
 * Generate NAMQR for Buffr wallet
 */
export function generateBuffrWalletNAMQR(
  walletId: string,
  walletName: string,
  walletCity: string,
  tokenVaultId: string,
  amount?: string,
  isStatic: boolean = true
): string {
  const data: NAMQRData = {
    payloadFormatIndicator: '01',
    pointOfInitiation: isStatic ? '11' : '12', // Payee presented static/dynamic
    payeeAccountInfo: {
      globallyUniqueIdentifier: 'na.com.buffr.IPP',
      payeeIPPFullFormAlias: `${walletId}@buffr.wallet`, // Wallet IPP alias
    },
    merchantCategoryCode: '0000', // P2P transaction
    transactionCurrency: amount ? '516' : undefined,
    transactionAmount: amount,
    countryCode: 'NA',
    payeeName: walletName.substring(0, 25),
    payeeCity: walletCity.substring(0, 15),
    tokenVaultUniqueIdentifier: tokenVaultId,
    unreservedTemplate: {
      globallyUniqueIdentifier: 'na.com.buffr.namqr',
      initiationMode: isStatic ? '01' : '15',
    },
  };
  
  return generateNAMQR(data);
}

/**
 * Parse NAMQR and extract Buffr payment information
 */
export interface ParsedBuffrQR {
  accountType: 'buffr' | 'wallet';
  identifier: string; // Phone number or wallet ID
  name: string;
  city: string;
  amount?: string;
  currency?: string;
  isValid: boolean;
  error?: string;
}

export function parseBuffrNAMQR(qrString: string): ParsedBuffrQR {
  const result = parseNAMQR(qrString);
  
  if (!result.data || result.error) {
    return {
      accountType: 'buffr',
      identifier: '',
      name: '',
      city: '',
      isValid: false,
      error: result.error || 'Invalid NAMQR format',
    };
  }
  
  const data = result.data;
  
  // Extract identifier from IPP full form alias
  let identifier = '';
  let accountType: 'buffr' | 'wallet' = 'buffr';
  
  if (data.payeeAccountInfo?.payeeIPPFullFormAlias) {
    const alias = data.payeeAccountInfo.payeeIPPFullFormAlias;
    if (alias.includes('@buffr.wallet')) {
      accountType = 'wallet';
      identifier = alias.replace('@buffr.wallet', '');
    } else if (alias.includes('@buffr')) {
      accountType = 'buffr';
      identifier = alias.replace('@buffr', '');
    }
  } else if (data.payeeAccountInfoLegacy?.payeeIdentifier) {
    identifier = data.payeeAccountInfoLegacy.payeeIdentifier;
  }
  
  return {
    accountType,
    identifier,
    name: data.payeeName || '',
    city: data.payeeCity || '',
    amount: data.transactionAmount,
    currency: data.transactionCurrency,
    isValid: true,
  };
}
