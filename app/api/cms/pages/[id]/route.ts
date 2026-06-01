/**
 * CMS Page API - Individual Page Operations
 *
 * GET /api/cms/pages/[id] - Get page details
 * PATCH /api/cms/pages/[id] - Update page
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithTenantContext } from '@/lib/auth/tenant-context';
import { db, cmsPages } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updatePageSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
  metaDescription: z.string().optional(),
  status: z.enum(['draft', 'published']).optional(),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionWithTenantContext();

    if (!session || !session.user?.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const [page] = await db
      .select()
      .from(cmsPages)
      .where(
        and(
          eq(cmsPages.id, id),
          eq(cmsPages.tenantId, session.user.tenantId)
        )
      )
      .limit(1);

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(page);
  } catch (error) {
    console.error('[CMS Page API] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionWithTenantContext();

    if (!session || !session.user?.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const validatedData = updatePageSchema.parse(body);

    // Verify page belongs to tenant
    const [existingPage] = await db
      .select()
      .from(cmsPages)
      .where(
        and(
          eq(cmsPages.id, id),
          eq(cmsPages.tenantId, session.user.tenantId)
        )
      )
      .limit(1);

    if (!existingPage) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // If changing slug, check it doesn't conflict
    if (validatedData.slug && validatedData.slug !== existingPage.slug) {
      const [conflictingPage] = await db
        .select()
        .from(cmsPages)
        .where(eq(cmsPages.slug, validatedData.slug))
        .limit(1);

      if (conflictingPage) {
        return NextResponse.json(
          { error: 'A page with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Update page
    const updateData: any = {};
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
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[CMS Page API] PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
