import { db } from '@/lib/db';
import { cmsContent } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { CmsContent } from '@/lib/db/schema';
import { CmsContentData } from '@/lib/types/cms';
import { AppError, handleServiceError } from '@/lib/utils/errors';

export class ContentService {
  async createContent(tenantId: string, data: CmsContentData): Promise<CmsContent> {
    try {
      const [content] = await db
        .insert(cmsContent)
        .values({
          tenantId,
          propertyId: data.propertyId,
          contentType: data.contentType || 'page',
          title: data.title,
          content: data.content,
          metadata: (data.metadata || {}) as Record<string, unknown>,
          status: data.status || 'draft',
        })
        .returning();
      if (!content) throw new Error('Insert did not return content');
      return content;
    } catch (error) {
      return handleServiceError(error, 'Error creating CMS content');
    }
  }

  async getContentByProperty(propertyId: string, tenantId: string): Promise<CmsContent[]> {
    try {
      return await db
        .select()
        .from(cmsContent)
        .where(and(eq(cmsContent.propertyId, propertyId), eq(cmsContent.tenantId, tenantId)))
        .orderBy(desc(cmsContent.createdAt));
    } catch (error) {
      handleServiceError(error, 'Error fetching CMS content by property');
      return [];
    }
  }

  async getContentById(contentId: string, tenantId: string): Promise<CmsContent> {
    try {
      const [content] = await db
        .select()
        .from(cmsContent)
        .where(and(eq(cmsContent.id, contentId), eq(cmsContent.tenantId, tenantId)))
        .limit(1);
      if (!content) {
        throw new AppError(404, 'CMS content not found');
      }
      return content;
    } catch (error) {
      return handleServiceError(error, 'Error fetching CMS content by ID');
    }
  }

  async updateContent(contentId: string, tenantId: string, data: Partial<CmsContentData>): Promise<CmsContent> {
    try {
      const existing = await db
        .select()
        .from(cmsContent)
        .where(and(eq(cmsContent.id, contentId), eq(cmsContent.tenantId, tenantId)))
        .limit(1);
      if (!existing.length) {
        throw new AppError(404, 'CMS content not found');
      }
      const set: Partial<typeof cmsContent.$inferInsert> = {};
      if (data.propertyId !== undefined) set.propertyId = data.propertyId;
      if (data.contentType !== undefined) set.contentType = data.contentType;
      if (data.title !== undefined) set.title = data.title;
      if (data.content !== undefined) set.content = data.content;
      if (data.metadata !== undefined) set.metadata = (data.metadata || {}) as Record<string, unknown>;
      if (data.status !== undefined) set.status = data.status;

      const [content] = await db
        .update(cmsContent)
        .set(set)
        .where(eq(cmsContent.id, contentId))
        .returning();
      if (!content) throw new AppError(404, 'CMS content not found');
      return content;
    } catch (error) {
      return handleServiceError(error, 'Error updating CMS content');
    }
  }

  async deleteContent(contentId: string, tenantId: string): Promise<CmsContent> {
    try {
      const [content] = await db
        .select()
        .from(cmsContent)
        .where(and(eq(cmsContent.id, contentId), eq(cmsContent.tenantId, tenantId)))
        .limit(1);
      if (!content) {
        throw new AppError(404, 'CMS content not found');
      }
      const [deleted] = await db.delete(cmsContent).where(eq(cmsContent.id, contentId)).returning();
      if (!deleted) throw new AppError(404, 'CMS content not found');
      return deleted;
    } catch (error) {
      return handleServiceError(error, 'Error deleting CMS content');
    }
  }
}