/**
 * CMS Service Integration Tests
 *
 * Purpose: Exercise ContentService + MediaService against the real database, covering
 *          happy-path CRUD and tenant isolation (RLS + service-level tenant filter).
 * Location: /tests/integration/cms.test.ts
 *
 * Closes the CMS validation gap: the CMS layer drives public menu + facility imagery
 * but previously had no automated coverage.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { ContentService } from '@/lib/services/cms/ContentService';
import { MediaService } from '@/lib/services/cms/MediaService';
import { db, cmsContent, cmsMedia, setTenantContext, clearTenantContext } from '@/lib/db';
import {
  createTestTenant,
  createTestUser,
  createTestProperty,
  cleanupTestData,
} from '../utils/test-helpers';

describe('CMS Service Integration Tests', () => {
  // Hotel Etuna is the single hotel tenant. `partnerTenant` is NOT a second hotel — it
  // stands in for a partner-network tenant, the boundary RLS exists to enforce. It is used
  // only to prove Hotel Etuna's CMS content never leaks to another tenant on the platform.
  let tenantId: string;
  let partnerTenantId: string;
  let userId: string;
  let propertyId: string;
  let partnerPropertyId: string;
  const contentService = new ContentService();
  const mediaService = new MediaService();

  beforeAll(async () => {
    const tenant = await createTestTenant('Hotel Etuna (CMS test)');
    const partnerTenant = await createTestTenant('Partner Tenant (isolation boundary)');
    const user = await createTestUser(tenant.id);
    const partnerUser = await createTestUser(partnerTenant.id);
    tenantId = tenant.id;
    partnerTenantId = partnerTenant.id;
    userId = user.id;

    const property = await createTestProperty(tenantId, userId, 'Hotel Etuna Property');
    const partnerProperty = await createTestProperty(partnerTenantId, partnerUser.id, 'Partner Property');
    propertyId = property.id;
    partnerPropertyId = partnerProperty.id;

    await setTenantContext(tenantId);
  });

  afterAll(async () => {
    // CMS tables are not covered by cleanupTestData — remove rows for both tenants.
    for (const tid of [tenantId, partnerTenantId]) {
      await setTenantContext(tid);
      await db.delete(cmsMedia).where(eq(cmsMedia.tenantId, tid));
      await db.delete(cmsContent).where(eq(cmsContent.tenantId, tid));
    }
    await clearTenantContext();
    await cleanupTestData(tenantId);
    await cleanupTestData(partnerTenantId);
  });

  describe('ContentService CRUD', () => {
    let contentId: string;

    it('creates content (happy path)', async () => {
      const content = await contentService.createContent(tenantId, {
        propertyId,
        contentType: 'amenity_details',
        title: 'Conference Hall',
        content: 'A calm, well-lit meeting space in central Ongwediva.',
        status: 'published',
      });

      expect(content.id).toBeDefined();
      expect(content.tenantId).toBe(tenantId);
      expect(content.propertyId).toBe(propertyId);
      expect(content.title).toBe('Conference Hall');
      expect(content.status).toBe('published');
      contentId = content.id;
    });

    it('fetches content by property', async () => {
      const rows = await contentService.getContentByProperty(propertyId, tenantId);
      expect(rows.length).toBeGreaterThanOrEqual(1);
      expect(rows.every((r) => r.tenantId === tenantId)).toBe(true);
      expect(rows.some((r) => r.id === contentId)).toBe(true);
    });

    it('fetches content by id', async () => {
      const content = await contentService.getContentById(contentId, tenantId);
      expect(content.id).toBe(contentId);
      expect(content.title).toBe('Conference Hall');
    });

    it('updates content', async () => {
      const updated = await contentService.updateContent(contentId, tenantId, {
        title: 'Conference Hall — Updated',
        status: 'draft',
      });
      expect(updated.title).toBe('Conference Hall — Updated');
      expect(updated.status).toBe('draft');
    });

    it('deletes content', async () => {
      const deleted = await contentService.deleteContent(contentId, tenantId);
      expect(deleted.id).toBe(contentId);
      await expect(contentService.getContentById(contentId, tenantId)).rejects.toThrow();
    });
  });

  describe('MediaService CRUD', () => {
    let mediaId: string;

    it('creates media (happy path)', async () => {
      const media = await mediaService.createMedia(tenantId, {
        propertyId,
        fileName: 'conference-hall.jpg',
        filePath: '/uploads/conference-hall.jpg',
        fileType: 'image',
        mimeType: 'image/jpeg',
        storageLocation: 'local',
      });
      expect(media.id).toBeDefined();
      expect(media.tenantId).toBe(tenantId);
      expect(media.fileName).toBe('conference-hall.jpg');
      mediaId = media.id;
    });

    it('fetches media by property and by id', async () => {
      const list = await mediaService.getMediaByProperty(propertyId, tenantId);
      expect(list.some((m) => m.id === mediaId)).toBe(true);

      const one = await mediaService.getMediaById(mediaId, tenantId);
      expect(one.id).toBe(mediaId);
    });

    it('deletes media', async () => {
      const deleted = await mediaService.deleteMedia(mediaId, tenantId);
      expect(deleted.id).toBe(mediaId);
      await expect(mediaService.getMediaById(mediaId, tenantId)).rejects.toThrow();
    });
  });

  describe('Tenant isolation (partner-network boundary)', () => {
    // Note: DB-level RLS enforcement is proven separately by scripts/db/verify-tenant-rls.ts;
    // the app's DB connection role bypasses RLS, so here we assert the service-level tenant
    // filter that every CMS API route relies on to keep Hotel Etuna's content private.
    it('does not leak Hotel Etuna content to a partner tenant', async () => {
      const content = await contentService.createContent(tenantId, {
        propertyId,
        contentType: 'page',
        title: 'Hotel Etuna private content',
        content: 'secret',
        status: 'published',
      });

      // Service-level tenant filter: a partner tenant must 404 even with a valid id.
      await expect(
        contentService.getContentById(content.id, partnerTenantId)
      ).rejects.toThrow();

      // The partner's property listing must not contain Hotel Etuna's row.
      const partnerRows = await contentService.getContentByProperty(partnerPropertyId, partnerTenantId);
      expect(partnerRows.some((r) => r.id === content.id)).toBe(false);

      // And Hotel Etuna still sees its own row.
      const ownRows = await contentService.getContentByProperty(propertyId, tenantId);
      expect(ownRows.some((r) => r.id === content.id)).toBe(true);
    });
  });
});
