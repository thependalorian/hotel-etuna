/**
 * Camera & QR Scanner Configuration Tests
 * Verifies camera setup and QR scanning functionality
 */

import { parseNAMQR, generateNAMQR, isValidSmartpayId, extractSmartpayId, getQRCodeType } from '../utils/namqr';

describe('Camera & QR Scanner Configuration', () => {
  describe('NAMQR Validation', () => {
    it('should validate correct NAMQR format', () => {
      const qrData = generateNAMQR('SP-12345678', 100.50);
      const result = parseNAMQR(qrData);
      
      expect(result.isValid).toBe(true);
      expect(result.data?.smartpayId).toBe('SP-12345678');
      expect(result.data?.currency).toBe('NAD');
      expect(result.data?.country).toBe('NA');
    });

    it('should reject invalid NAMQR with wrong currency', () => {
      const invalidQR = '0002015303USD5802NA6511SP-123456786304ABCD';
      const result = parseNAMQR(invalidQR);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('currency');
    });

    it('should reject NAMQR with missing required tags', () => {
      const invalidQR = '0002015303NAD';
      const result = parseNAMQR(invalidQR);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Missing required tags');
    });

    it('should reject invalid SmartpayID format', () => {
      const result = parseNAMQR(generateNAMQR('INVALID-ID'));
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid SmartpayID format');
    });
  });

  describe('SmartpayID Validation', () => {
    it('should validate correct SmartpayID format', () => {
      expect(isValidSmartpayId('SP-12345678')).toBe(true);
      expect(isValidSmartpayId('SP-00000001')).toBe(true);
      expect(isValidSmartpayId('SP-99999999')).toBe(true);
    });

    it('should reject invalid SmartpayID formats', () => {
      expect(isValidSmartpayId('SP12345678')).toBe(false);
      expect(isValidSmartpayId('SP-1234567')).toBe(false);
      expect(isValidSmartpayId('SP-123456789')).toBe(false);
      expect(isValidSmartpayId('sp-12345678')).toBe(false);
      expect(isValidSmartpayId('XP-12345678')).toBe(false);
    });
  });

  describe('SmartpayID Extraction', () => {
    it('should extract SmartpayID from NAMQR', () => {
      const qrData = generateNAMQR('SP-12345678');
      const smartpayId = extractSmartpayId(qrData);
      
      expect(smartpayId).toBe('SP-12345678');
    });

    it('should extract SmartpayID from deep link', () => {
      const deepLink = 'smartpay://receive?id=SP-87654321&amount=50';
      const smartpayId = extractSmartpayId(deepLink);
      
      expect(smartpayId).toBe('SP-87654321');
    });

    it('should extract direct SmartpayID', () => {
      const smartpayId = extractSmartpayId('SP-11111111');
      
      expect(smartpayId).toBe('SP-11111111');
    });

    it('should return null for invalid QR data', () => {
      const smartpayId = extractSmartpayId('invalid-qr-data');
      
      expect(smartpayId).toBeNull();
    });
  });

  describe('QR Code Type Detection', () => {
    it('should detect NAMQR type', () => {
      const qrData = generateNAMQR('SP-12345678');
      const type = getQRCodeType(qrData);
      
      expect(type).toBe('namqr');
    });

    it('should detect deep link type', () => {
      const deepLink = 'smartpay://receive?id=SP-12345678';
      const type = getQRCodeType(deepLink);
      
      expect(type).toBe('deeplink');
    });

    it('should detect unknown type', () => {
      const type = getQRCodeType('https://example.com/qr');
      
      expect(type).toBe('unknown');
    });
  });

  describe('NAMQR Generation', () => {
    it('should generate valid NAMQR without amount', () => {
      const qrData = generateNAMQR('SP-12345678');
      const result = parseNAMQR(qrData);
      
      expect(result.isValid).toBe(true);
      expect(result.data?.smartpayId).toBe('SP-12345678');
      expect(result.data?.amount).toBeUndefined();
    });

    it('should generate valid NAMQR with amount', () => {
      const qrData = generateNAMQR('SP-12345678', 250.75);
      const result = parseNAMQR(qrData);
      
      expect(result.isValid).toBe(true);
      expect(result.data?.smartpayId).toBe('SP-12345678');
      expect(result.data?.amount).toBe(250.75);
    });

    it('should include all required tags', () => {
      const qrData = generateNAMQR('SP-12345678');
      
      expect(qrData).toContain('0002');
      expect(qrData).toContain('5303NAD');
      expect(qrData).toContain('5802NA');
      expect(qrData).toContain('6511SP-12345678');
      expect(qrData).toContain('6304');
    });
  });

  describe('Camera Permissions', () => {
    it('should have camera permission configuration', () => {
      const appJson = require('../app.json');
      
      expect(appJson.expo.ios.infoPlist.NSCameraUsageDescription).toBeDefined();
      expect(appJson.expo.ios.infoPlist.NSCameraUsageDescription).toContain('camera');
      
      expect(appJson.expo.android.permissions).toContain('CAMERA');
    });

    it('should have expo-camera plugin configured', () => {
      const appJson = require('../app.json');
      const cameraPlugin = appJson.expo.plugins.find(
        (plugin: any) => Array.isArray(plugin) && plugin[0] === 'expo-camera'
      );
      
      expect(cameraPlugin).toBeDefined();
      expect(cameraPlugin[1].cameraPermission).toBeDefined();
    });
  });

  describe('Package Dependencies', () => {
    it('should have expo-camera installed', () => {
      const packageJson = require('../package.json');
      
      expect(packageJson.dependencies['expo-camera']).toBeDefined();
    });

    it('should have required QR dependencies', () => {
      const packageJson = require('../package.json');
      
      expect(packageJson.dependencies['expo-camera']).toBeDefined();
      expect(packageJson.dependencies['react-native-qrcode-svg']).toBeDefined();
      expect(packageJson.dependencies['expo-clipboard']).toBeDefined();
      expect(packageJson.dependencies['expo-haptics']).toBeDefined();
    });
  });
});
