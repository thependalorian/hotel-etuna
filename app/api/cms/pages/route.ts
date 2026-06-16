/**
 * @fileoverview API route //api/cms/pages
 * Location: /app/api/cms/pages/route.ts
 */

/**
 * CMS Pages API — list and create tenant pages.
 * Location: /app/api/cms/pages/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, cmsPages } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { withPlatformApiAuth, errorResponse } from '@/lib/utils/api-helpers';
import { securityLogger } from '@/lib/utils/security-logger';

const createPageSchema = z.object({
  title: z.string().min(1).max(500),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  metaDescription: z.string().optional(),
});

export async function GET(request: NextRequest) {
  return withPlatformApiAuth(request, async (_req, user) => {
    try {
      if (!user.tenantId) {
        return errorResponse('Unauthorized', 401);
      }

      const pages = await db
        .select()
        .from(cmsPages)
        .where(eq(cmsPages.tenantId, user.tenantId));

      return NextResponse.json(pages);
    } catch (error) {
      securityLogger.error('[CMS Pages API] GET error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function POST(request: NextRequest) {
  return withPlatformApiAuth(request, async (req, user) => {
    try {
      if (!user.tenantId || !user.id) {
        return errorResponse('Unauthorized', 401);
      }

      const body = await req.json();
      const validatedData = createPageSchema.parse(body);

      const existingPage = await db
        .select()
        .from(cmsPages)
        .where(eq(cmsPages.slug, validatedData.slug))
        .limit(1);

      if (existingPage.length > 0) {
        return errorResponse('A page with this slug already exists', 400);
      }

      const [newPage] = await db
        .insert(cmsPages)
        .values({
          tenantId: user.tenantId,
          createdBy: user.id,
          title: validatedData.title,
          slug: validatedData.slug,
          metaDescription: validatedData.metaDescription || null,
          status: 'draft',
        })
        .returning();

      return NextResponse.json(newPage, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid input', details: error.issues },
          { status: 400 }
        );
      }

      securityLogger.error('[CMS Pages API] POST error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}
