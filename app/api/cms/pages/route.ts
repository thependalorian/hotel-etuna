/**
 * CMS Pages API - List and Create
 *
 * GET /api/cms/pages - List all pages for tenant
 * POST /api/cms/pages - Create new page
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithTenantContext } from '@/lib/auth/tenant-context';
import { db, cmsPages } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const createPageSchema = z.object({
  title: z.string().min(1).max(500),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  metaDescription: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionWithTenantContext();

    if (!session || !session.user?.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const pages = await db
      .select()
      .from(cmsPages)
      .where(eq(cmsPages.tenantId, session.user.tenantId));

    return NextResponse.json(pages);
  } catch (error) {
    console.error('[CMS Pages API] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionWithTenantContext();

    if (!session || !session.user?.tenantId || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createPageSchema.parse(body);

    // Check if slug already exists
    const existingPage = await db
      .select()
      .from(cmsPages)
      .where(eq(cmsPages.slug, validatedData.slug))
      .limit(1);

    if (existingPage.length > 0) {
      return NextResponse.json(
        { error: 'A page with this slug already exists' },
        { status: 400 }
      );
    }

    // Create page
    const [newPage] = await db
      .insert(cmsPages)
      .values({
        tenantId: session.user.tenantId,
        createdBy: session.user.id,
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
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[CMS Pages API] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
