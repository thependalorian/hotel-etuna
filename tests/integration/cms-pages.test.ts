/**
 * CMS Pages Integration Tests
 * 
 * Tests for CMS pages CRUD operations and block management
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, cmsPages, cmsBlocks, tenants } from '@/lib/db';
import { eq } from 'drizzle-orm';

describe('CMS Pages Integration', () => {
  let testPageId: string = '';
  let testTenantId: string = '';

  beforeAll(async () => {
    const [tenant] = await db.select({ id: tenants.id }).from(tenants).limit(1);
    
    if (!tenant) {
      console.warn('No tenant found - skipping CMS tests');
      return;
    }
    
    testTenantId = tenant.id;

    await db.delete(cmsPages).where(eq(cmsPages.slug, 'test-cms-page'));
  });

  afterAll(async () => {
    if (testPageId) {
      await db.delete(cmsPages).where(eq(cmsPages.id, testPageId));
    }
  });

  it('should create a new CMS page', async () => {
    if (!testTenantId) return;

    const [newPage] = await db
      .insert(cmsPages)
      .values({
        title: 'Test CMS Page',
        slug: 'test-cms-page',
        metaDescription: 'A test page for CMS',
        tenantId: testTenantId,
        status: 'draft',
      })
      .returning();

    expect(newPage).toBeDefined();
    expect(newPage.title).toBe('Test CMS Page');
    expect(newPage.slug).toBe('test-cms-page');
    expect(newPage.status).toBe('draft');

    testPageId = newPage.id;
  });

  it('should fetch the created CMS page', async () => {
    if (!testPageId) return;

    const [page] = await db
      .select()
      .from(cmsPages)
      .where(eq(cmsPages.id, testPageId))
      .limit(1);

    expect(page).toBeDefined();
    expect(page.id).toBe(testPageId);
    expect(page.title).toBe('Test CMS Page');
  });

  it('should add blocks to the page', async () => {
    if (!testPageId) return;

    const blocks = [
      {
        pageId: testPageId,
        blockType: 'hero' as const,
        blockOrder: 0,
        content: {
          heading: 'Welcome',
          subheading: 'Test hero block',
        },
      },
      {
        pageId: testPageId,
        blockType: 'text' as const,
        blockOrder: 1,
        content: {
          heading: 'About Us',
          content: '<p>This is test content</p>',
        },
      },
    ];

    await db.insert(cmsBlocks).values(blocks);

    const savedBlocks = await db
      .select()
      .from(cmsBlocks)
      .where(eq(cmsBlocks.pageId, testPageId));

    expect(savedBlocks).toHaveLength(2);
    expect(savedBlocks[0].blockType).toBe('hero');
    expect(savedBlocks[1].blockType).toBe('text');
  });

  it('should update page status to published', async () => {
    if (!testPageId) return;

    const [updatedPage] = await db
      .update(cmsPages)
      .set({ 
        status: 'published',
        publishedAt: new Date(),
      })
      .where(eq(cmsPages.id, testPageId))
      .returning();

    expect(updatedPage.status).toBe('published');
    expect(updatedPage.publishedAt).toBeDefined();
  });

  it('should delete blocks when page is deleted', async () => {
    if (!testPageId) return;

    await db.delete(cmsPages).where(eq(cmsPages.id, testPageId));

    const remainingBlocks = await db
      .select()
      .from(cmsBlocks)
      .where(eq(cmsBlocks.pageId, testPageId));

    expect(remainingBlocks).toHaveLength(0);

    testPageId = '';
  });
});
