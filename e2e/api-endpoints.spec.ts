import { test, expect } from '@playwright/test';

/**
 * E2E Test: Critical API Endpoints
 * 
 * Tests the critical API endpoints for:
 * - Bookings API (create, list, availability)
 * - Payments API (virtual payment initiate/confirm)
 * - Sofia AI API (chat endpoint)
 * - CRM API (guests, loyalty)
 * - Fraud API (alerts, statistics)
 * - Compliance API (KYC, AML)
 */

test.describe('API Endpoints - Critical Paths', () => {
  test.describe.configure({ mode: 'parallel' });

  // ===========================================
  // Bookings API Tests
  // ===========================================
  test.describe('Bookings API', () => {
    test('GET /api/bookings should return 401 without auth', async ({ request }) => {
      const response = await request.get('/api/bookings');
      expect(response.status()).toBe(401);
    });

    test('GET /api/bookings/availability should return validation error without params', async ({ request }) => {
      const response = await request.get('/api/bookings/availability');
      expect(response.status()).toBe(400);
    });

    test('POST /api/bookings should return 401 without auth', async ({ request }) => {
      const response = await request.post('/api/bookings', {
        data: {
          propertyId: 'test-property-id',
          checkIn: '2026-07-01',
          checkOut: '2026-07-03',
          guests: 2,
        },
      });
      expect(response.status()).toBe(401);
    });
  });

  // ===========================================
  // Payments API Tests
  // ===========================================
  test.describe('Payments API', () => {
    test('POST /api/payments/virtual/initiate should return 401 without auth', async ({ request }) => {
      const response = await request.post('/api/payments/virtual/initiate', {
        data: {
          amount: 100,
          purpose: 'booking_deposit',
        },
      });
      expect(response.status()).toBe(401);
    });

    test('POST /api/payments/virtual/confirm should return 401 without auth', async ({ request }) => {
      const response = await request.post('/api/payments/virtual/confirm', {
        data: {
          paymentId: 'test-payment-id',
        },
      });
      expect(response.status()).toBe(401);
    });
  });

  // ===========================================
  // Sofia AI API Tests
  // ===========================================
  test.describe('Sofia AI API', () => {
    test('POST /api/sofia/email should return 401 without auth', async ({ request }) => {
      const response = await request.post('/api/sofia/email', {
        data: {
          to: 'test@example.com',
          subject: 'Test',
          body: 'Test body',
        },
      });
      expect(response.status()).toBe(401);
    });

    test('POST /api/ai/concierge should return 401 without auth', async ({ request }) => {
      const response = await request.post('/api/ai/concierge', {
        data: {
          message: 'Hello',
        },
      });
      expect(response.status()).toBe(401);
    });
  });

  // ===========================================
  // CRM API Tests
  // ===========================================
  test.describe('CRM API', () => {
    test('GET /api/crm/guests should return 401 without auth', async ({ request }) => {
      const response = await request.get('/api/crm/guests');
      expect(response.status()).toBe(401);
    });

    test('GET /api/crm/loyalty/transactions should return 401 without auth', async ({ request }) => {
      const response = await request.get('/api/crm/loyalty/transactions');
      expect(response.status()).toBe(401);
    });
  });

  // ===========================================
  // Fraud API Tests
  // ===========================================
  test.describe('Fraud API', () => {
    test('GET /api/fraud/alerts should return 401 without auth', async ({ request }) => {
      const response = await request.get('/api/fraud/alerts');
      expect(response.status()).toBe(401);
    });

    test('GET /api/fraud/statistics should return 401 without auth', async ({ request }) => {
      const response = await request.get('/api/fraud/statistics');
      expect(response.status()).toBe(401);
    });

    test('POST /api/fraud/analyze should return 401 without auth', async ({ request }) => {
      const response = await request.post('/api/fraud/analyze', {
        data: {
          transactionId: 'test-transaction-id',
        },
      });
      expect(response.status()).toBe(401);
    });
  });

  // ===========================================
  // Compliance API Tests
  // ===========================================
  test.describe('Compliance API', () => {
    test('GET /api/compliance/kyc-cases should return 401 without auth', async ({ request }) => {
      const response = await request.get('/api/compliance/kyc-cases');
      expect(response.status()).toBe(401);
    });

    test('GET /api/compliance/aml/reports/dashboard should return 401 without auth', async ({ request }) => {
      const response = await request.get('/api/compliance/aml/reports/dashboard');
      expect(response.status()).toBe(401);
    });

    test('POST /api/compliance/psd/bon-incident should return 401 without auth', async ({ request }) => {
      const response = await request.post('/api/compliance/psd/bon-incident', {
        data: {
          incidentId: 'test-incident-id',
        },
      });
      expect(response.status()).toBe(401);
    });
  });

  // ===========================================
  // Housekeeping API Tests
  // ===========================================
  test.describe('Housekeeping API', () => {
    test('GET /api/housekeeping/tasks should return 401 without auth', async ({ request }) => {
      const response = await request.get('/api/housekeeping/tasks');
      expect(response.status()).toBe(401);
    });

    test('GET /api/housekeeping/tasks/[id] should return 401 without auth', async ({ request }) => {
      const response = await request.get('/api/housekeeping/tasks/test-id');
      expect(response.status()).toBe(401);
    });
  });

  // ===========================================
  // Inventory API Tests
  // ===========================================
  test.describe('Inventory API', () => {
    test('GET /api/inventory/items should return 401 without auth', async ({ request }) => {
      const response = await request.get('/api/inventory/items');
      expect(response.status()).toBe(401);
    });

    test('GET /api/inventory/alerts should return 401 without auth', async ({ request }) => {
      const response = await request.get('/api/inventory/alerts');
      expect(response.status()).toBe(401);
    });
  });

  // ===========================================
  // Public API Tests (No Auth Required)
  // ===========================================
  test.describe('Public API Endpoints', () => {
    test('GET /public/properties/[slug] should return 404 for non-existent property', async ({ request }) => {
      const response = await request.get('/api/public/properties/non-existent-property');
      expect(response.status()).toBe(404);
    });

    test('GET /public/restaurant/menu/[slug] should return 404 for non-existent menu', async ({ request }) => {
      const response = await request.get('/api/public/restaurant/menu/non-existent');
      expect(response.status()).toBe(404);
    });

    test('GET /public/room-qr/[code] should return 404 for non-existent QR code', async ({ request }) => {
      const response = await request.get('/api/public/room-qr/non-existent-code');
      expect(response.status()).toBe(404);
    });
  });

  // ===========================================
  // Cron API Tests
  // ===========================================
  test.describe('Cron API', () => {
    test('GET /api/cron/booking-reminders should return 401 without CRON_SECRET', async ({ request }) => {
      const response = await request.get('/api/cron/booking-reminders');
      expect(response.status()).toBe(401);
    });

    test('GET /api/cron/email-inbox-monitor should return 401 without CRON_SECRET', async ({ request }) => {
      const response = await request.get('/api/cron/email-inbox-monitor');
      expect(response.status()).toBe(401);
    });
  });
});