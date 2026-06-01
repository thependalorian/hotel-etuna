/**
 * CMS Pages Integration Tests
 * 
 * Tests for CMS pages CRUD operations and block management
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, cmsPages, cmsBlocks } from '@/lib/db';
import { eq } from 'drizzle-orm';

describe('CMS Pages Integration', () => {
  let testPageId: string;
  const testTenantId = '00000000-0000-0000-0000-000000000001'; // Use a valid test tenant ID

  beforeAll(async () => {
    // Clean up any existing test pages
    await db.delete(cmsPages).where(eq(cmsPages.slug, 'test-page'));
  });

  afterAll(async () => {
    // Clean up test data
    if (testPageId) {
      await db.delete(cmsPages).where(eq(cmsPages.id, testPageId));
    }
  });

  it('should create a new CMS page', async () => {
    const [newPage] = await db
      .insert(cmsPages)
      .values({
        tenantId: testTenantId,
        title: 'Test Page',
        slug: 'test-page',
        metaDescription: 'Test page description',
        status: 'draft',
      })
      .returning();

    expect(newPage).toBeDefined();
    expect(newPage.title).toBe('Test Page');
    expect(newPage.slug).toBe('test-page');
    expect(newPage.status).toBe('draft');

    testPageId = newPage.id;
  });

  it('should fetch page by slug', async () => {
    const [page] = await db
      .select()
      .from(cmsPages)
      .where(eq(cmsPages.slug, 'test-page'))
      .limit(1);

    expect(page).toBeDefined();
    expect(page.title).toBe('Test Page');
  });

  it('should create blocks for a page', async () => {
    const blocks = await db
      .insert(cmsBlocks)
      .values([
        {
          pageId: testPageId,
          blockType: 'hero',
          blockOrder: 0,
          content: {
            heading: 'Hero Title',
            subheading: 'Hero subtitle',
            buttonText: 'Click Me',
            buttonLink: '/about',
          },
        },
        {
          pageId: testPageId,
          blockType: 'text',
          blockOrder: 1,
          content: {
            heading: 'Text Block',
            content: 'This is some text content',
          },
        },
      ])
      .returning();

    expect(blocks).toHaveLength(2);
    expect(blocks[0].blockType).toBe('hero');
    expect(blocks[1].blockType).toBe('text');
  });

  it('should fetch blocks in order', async () => {
    const blocks = await db
      .select()
      .from(cmsBlocks)
      .where(eq(cmsBlocks.pageId, testPageId))
      .orderBy(cmsBlocks.blockOrder);

    expect(blocks).toHaveLength(2);
    expect(blocks[0].blockOrder).toBe(0);
    expect(blocks[1].blockOrder).toBe(1);
  });

  it('should update page status to published', async () => {
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
    // This tests the CASCADE delete
    await db.delete(cmsPages).where(eq(cmsPages.id, testPageId));

    const blocks = await db
      .select()
      .from(cmsBlocks)
      .where(eq(cmsBlocks.pageId, testPageId));

    expect(blocks).toHaveLength(0);
    testPageId = ''; // Mark as cleaned up
  });
});
