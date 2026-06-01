/**
 * CMS Page By ID API Route
 * 
 * Purpose: Get and update specific CMS pages
 * Endpoints:
 * - GET /api/cms/pages/[id] - Get page by ID
 * - PATCH /api/cms/pages/[id] - Update page
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithTenantContext } from '@/lib/auth/tenant-context';
import { db, cmsPages } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updatePageSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
  metaDescription: z.string().max(1000).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getSessionWithTenantContext();
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error) {
    console.error('Error fetching page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getSessionWithTenantContext();
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const validated = updatePageSchema.parse(body);

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
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    if (validated.slug && validated.slug !== existingPage.slug) {
      const [slugConflict] = await db
        .select()
        .from(cmsPages)
        .where(
          and(
            eq(cmsPages.slug, validated.slug),
            eq(cmsPages.tenantId, session.user.tenantId)
          )
        )
        .limit(1);

      if (slugConflict) {
        return NextResponse.json(
          { error: 'A page with this slug already exists' },
          { status: 400 }
        );
      }
    }

    const updateData: any = { ...validated };
    
    if (validated.status === 'published' && existingPage.status !== 'published') {
      updateData.publishedAt = new Date();
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

    console.error('Error updating page:', error);
    return NextResponse.json(
      { error: 'Failed to update page' },
      { status: 500 }
    );
  }
}
