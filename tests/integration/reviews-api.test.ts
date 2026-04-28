/**
 * Reviews API integration tests.
 *
 * Purpose: verify CRM review moderation endpoints and authorization behavior.
 * Location: /tests/integration/reviews-api.test.ts
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db, guestReviews } from '@/lib/db';
import {
  cleanupTestData,
  createTestGuest,
  createTestProperty,
  createTestTenant,
  createTestUser,
} from '../utils/test-helpers';

const getServerSessionMock = vi.fn();
vi.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

describe('CRM Reviews API', () => {
  let tenantId: string;
  let propertyId: string;
  let guestId: string;
  let reviewId: string;

  beforeAll(async () => {
    const tenant = await createTestTenant(`Reviews API Tenant ${Date.now()}`);
    const adminUser = await createTestUser(tenant.id, `reviews-admin-${Date.now()}@example.com`);
    const property = await createTestProperty(tenant.id, adminUser.id, `Reviews Property ${Date.now()}`);
    const guest = await createTestGuest(tenant.id);

    tenantId = tenant.id;
    propertyId = property.id;
    guestId = guest.id;

    const [review] = await db
      .insert(guestReviews)
      .values({
        tenantId,
        propertyId,
        guestId,
        rating: 5,
        reviewText: 'Initial moderation review',
        isPublic: false,
      })
      .returning();
    reviewId = review.id;
  });

  beforeEach(() => {
    vi.resetModules();
    getServerSessionMock.mockReset();
  });

  afterAll(async () => {
    await cleanupTestData(tenantId);
  });

  it('GET /api/crm/reviews returns 401 when unauthenticated', async () => {
    getServerSessionMock.mockResolvedValue(null);
    const { GET } = await import('@/app/api/crm/reviews/route');
    const response = await GET(new NextRequest('http://localhost/api/crm/reviews'));

    expect(response.status).toBe(401);
  });

  it('GET /api/crm/reviews returns review array for authenticated admin', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'admin-user', role: 'admin', tenantId },
    });
    const { GET } = await import('@/app/api/crm/reviews/route');
    const response = await GET(new NextRequest('http://localhost/api/crm/reviews'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body.reviews)).toBe(true);
    expect(body.reviews.some((review: { id: string }) => review.id === reviewId)).toBe(true);
  });

  it('PATCH /api/crm/reviews/[id] sets is_public true', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'admin-user', role: 'admin', tenantId },
    });
    const { PATCH } = await import('@/app/api/crm/reviews/[id]/route');
    const req = new NextRequest(`http://localhost/api/crm/reviews/${reviewId}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_public: true }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await PATCH(req, { params: Promise.resolve({ id: reviewId }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.review.isPublic).toBe(true);

    const [updated] = await db
      .select({ isPublic: guestReviews.isPublic })
      .from(guestReviews)
      .where(eq(guestReviews.id, reviewId))
      .limit(1);
    expect(updated?.isPublic).toBe(true);
  });

  it('PATCH /api/crm/reviews/[id] sets is_public false', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'admin-user', role: 'admin', tenantId },
    });
    const { PATCH } = await import('@/app/api/crm/reviews/[id]/route');
    const req = new NextRequest(`http://localhost/api/crm/reviews/${reviewId}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_public: false }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await PATCH(req, { params: Promise.resolve({ id: reviewId }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.review.isPublic).toBe(false);
  });

  it('PATCH /api/crm/reviews/[id] returns 404 for nonexistent review', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'admin-user', role: 'admin', tenantId },
    });
    const { PATCH } = await import('@/app/api/crm/reviews/[id]/route');
    const missingId = randomUUID();
    const req = new NextRequest(`http://localhost/api/crm/reviews/${missingId}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_public: true }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await PATCH(req, { params: Promise.resolve({ id: missingId }) });

    expect(response.status).toBe(404);
  });

  it('PATCH /api/crm/reviews/[id] returns 403 for non-admin role', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'staff-user', role: 'staff', tenantId },
    });
    const { PATCH } = await import('@/app/api/crm/reviews/[id]/route');
    const req = new NextRequest(`http://localhost/api/crm/reviews/${reviewId}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_public: true }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await PATCH(req, { params: Promise.resolve({ id: reviewId }) });

    expect(response.status).toBe(403);
  });
});
