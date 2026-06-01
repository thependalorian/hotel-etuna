/**
 * Introducer Code Validation API Tests
 * 
 * Tests the POST /api/introducers/validate endpoint
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
  },
  introducers: {
    id: 'id',
    name: 'name',
    commissionRate: 'commissionRate',
    isActive: 'isActive',
    code: 'code',
  },
}));

describe('POST /api/introducers/validate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 for invalid JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/introducers/validate', {
      method: 'POST',
      body: 'invalid json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INVALID_JSON');
  });

  it('should return 400 for missing code', async () => {
    const request = new NextRequest('http://localhost:3000/api/introducers/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return valid=false for non-existent code', async () => {
    const { db } = await import('@/lib/db');
    
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/introducers/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'INVALID-CODE' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.valid).toBe(false);
  });

  it('should return valid=true with introducer info for valid code', async () => {
    const { db } = await import('@/lib/db');
    
    const mockIntroducer = {
      id: 'test-uuid-123',
      name: 'Test Travel Agency',
      commissionRate: '15.00',
      isActive: true,
    };

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([mockIntroducer])),
        })),
      })),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/introducers/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'TRAVEL-AGENT-001' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.valid).toBe(true);
    expect(data.data.introducer).toEqual({
      id: mockIntroducer.id,
      name: mockIntroducer.name,
      commission_rate: mockIntroducer.commissionRate,
    });
  });

  it('should handle uppercase code conversion', async () => {
    const { db } = await import('@/lib/db');
    
    const mockIntroducer = {
      id: 'test-uuid-456',
      name: 'Another Agency',
      commissionRate: '12.50',
      isActive: true,
    };

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([mockIntroducer])),
        })),
      })),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/introducers/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'travel-agent-002' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.valid).toBe(true);
  });
});
