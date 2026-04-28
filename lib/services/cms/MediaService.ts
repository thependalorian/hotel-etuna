/**
 * MediaService - CMS media CRUD
 * Location: /lib/services/cms/MediaService.ts
 * Uses Drizzle ORM (db from @/lib/db).
 */

import { db } from '@/lib/db';
import { cmsMedia } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { CmsMedia } from '@/lib/db/schema';
import { CmsMediaData } from '@/lib/types/cms';
import { AppError, handleServiceError } from '@/lib/utils/errors';

export class MediaService {
  async createMedia(tenantId: string, data: CmsMediaData): Promise<CmsMedia> {
    try {
      const [media] = await db
        .insert(cmsMedia)
        .values({
          tenantId,
          propertyId: data.propertyId,
          fileName: data.fileName,
          filePath: data.filePath,
          fileType: data.fileType,
          fileSize: data.fileSize != null ? Number(data.fileSize) : undefined,
          mimeType: data.mimeType,
          storageLocation: data.storageLocation,
          metadata: (data.metadata || {}) as Record<string, unknown>,
        })
        .returning();
      if (!media) throw new Error('Insert did not return media');
      return media;
    } catch (error) {
      return handleServiceError(error, 'Error creating CMS media');
    }
  }

  async getMediaByProperty(propertyId: string, tenantId: string): Promise<CmsMedia[]> {
    try {
      return await db
        .select()
        .from(cmsMedia)
        .where(
          and(
            eq(cmsMedia.propertyId, propertyId),
            eq(cmsMedia.tenantId, tenantId)
          )
        )
        .orderBy(desc(cmsMedia.createdAt));
    } catch (error) {
      handleServiceError(error, 'Error fetching CMS media by property');
      return [];
    }
  }

  async getMediaById(mediaId: string, tenantId: string): Promise<CmsMedia> {
    try {
      const [media] = await db
        .select()
        .from(cmsMedia)
        .where(
          and(
            eq(cmsMedia.id, mediaId),
            eq(cmsMedia.tenantId, tenantId)
          )
        )
        .limit(1);
      if (!media) {
        throw new AppError(404, 'CMS media not found');
      }
      return media;
    } catch (error) {
      return handleServiceError(error, 'Error fetching CMS media by ID');
    }
  }

  async deleteMedia(mediaId: string, tenantId: string): Promise<CmsMedia> {
    try {
      const [media] = await db
        .select()
        .from(cmsMedia)
        .where(
          and(
            eq(cmsMedia.id, mediaId),
            eq(cmsMedia.tenantId, tenantId)
          )
        )
        .limit(1);
      if (!media) {
        throw new AppError(404, 'CMS media not found');
      }
      const [deleted] = await db
        .delete(cmsMedia)
        .where(eq(cmsMedia.id, mediaId))
        .returning();
      if (!deleted) throw new AppError(404, 'CMS media not found');
      return deleted;
    } catch (error) {
      return handleServiceError(error, 'Error deleting CMS media');
    }
  }
}
