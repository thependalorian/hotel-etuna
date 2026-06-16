/**
 * @fileoverview API route //api/cms/pages/[id]
 * Location: /app/api/cms/pages/[id]/route.ts
 */

/**
 * CMS Page API — single page read/update.
 * Location: /app/api/cms/pages/[id]/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, cmsPages } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { withPlatformApiAuth, errorResponse } from '@/lib/utils/api-helpers';
import { securityLogger } from '@/lib/utils/security-logger';

const updatePageSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
  metaDescription: z.string().optional(),
  status: z.enum(['draft', 'published']).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  return withPlatformApiAuth(request, async (_req, user) => {
    try {
      if (!user.tenantId) {
        return errorResponse('Unauthorized', 401);
      }

      const { id } = await context.params;

      const [page] = await db
        .select()
        .from(cmsPages)
        .where(and(eq(cmsPages.id, id), eq(cmsPages.tenantId, user.tenantId)))
        .limit(1);

      if (!page) {
        return errorResponse('Page not found', 404);
      }

      return NextResponse.json(page);
    } catch (error) {
      securityLogger.error('[CMS Page API] GET error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return withPlatformApiAuth(request, async (req, user) => {
    try {
      if (!user.tenantId) {
        return errorResponse('Unauthorized', 401);
      }

      const { id } = await context.params;
      const body = await req.json();
      const validatedData = updatePageSchema.parse(body);

      const [existingPage] = await db
        .select()
        .from(cmsPages)
        .where(and(eq(cmsPages.id, id), eq(cmsPages.tenantId, user.tenantId)))
        .limit(1);

      if (!existingPage) {
        return errorResponse('Page not found', 404);
      }

      if (validatedData.slug && validatedData.slug !== existingPage.slug) {
        const [conflictingPage] = await db
          .select()
          .from(cmsPages)
          .where(eq(cmsPages.slug, validatedData.slug))
          .limit(1);

        if (conflictingPage) {
          return errorResponse('A page with this slug already exists', 400);
        }
      }

      const updateData: Partial<typeof cmsPages.$inferInsert> = {};
      if (validatedData.title !== undefined) updateData.title = validatedData.title;
      if (validatedData.slug !== undefined) updateData.slug = validatedData.slug;
      if (validatedData.metaDescription !== undefined) {
        updateData.metaDescription = validatedData.metaDescription;
      }
      if (validatedData.status !== undefined) {
        updateData.status = validatedData.status;
        if (validatedData.status === 'published' && !existingPage.publishedAt) {
          updateData.publishedAt = new Date();
        }
      }

      const [updatedPage] = await db
        .update(cmsPages)
        .set(updateData)
        .where(eq(cmsPages.id, id))
        .returning();

      return NextResponse.json(updatedPage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid input', details: error.issues },
          { status: 400 }
        );
      }

      securityLogger.error('[CMS Page API] PATCH error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}
