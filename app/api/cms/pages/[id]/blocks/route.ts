/**
 * CMS Blocks API Route
 * 
 * Purpose: Save all blocks for a page
 * Endpoints:
 * - PUT /api/cms/pages/[id]/blocks - Replace all blocks for a page
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithTenantContext } from '@/lib/auth/tenant-context';
import { db, cmsPages, cmsBlocks } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const blockSchema = z.object({
  id: z.string(),
  blockType: z.enum(['hero', 'text', 'image', 'cta', 'testimonial_grid']),
  blockOrder: z.number(),
  content: z.record(z.any()),
});

const saveBlocksSchema = z.object({
  blocks: z.array(blockSchema),
});

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getSessionWithTenantContext();
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: pageId } = await context.params;
    const body = await request.json();
    const validated = saveBlocksSchema.parse(body);

    const [page] = await db
      .select()
      .from(cmsPages)
      .where(
        and(
          eq(cmsPages.id, pageId),
          eq(cmsPages.tenantId, session.user.tenantId)
        )
      )
      .limit(1);

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    await db.delete(cmsBlocks).where(eq(cmsBlocks.pageId, pageId));

    if (validated.blocks.length > 0) {
      const blocksToInsert = validated.blocks.map(block => ({
        pageId,
        blockType: block.blockType,
        blockOrder: block.blockOrder,
        content: block.content,
      }));

      await db.insert(cmsBlocks).values(blocksToInsert);
    }

    const savedBlocks = await db
      .select()
      .from(cmsBlocks)
      .where(eq(cmsBlocks.pageId, pageId));

    return NextResponse.json({ blocks: savedBlocks });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error saving blocks:', error);
    return NextResponse.json(
      { error: 'Failed to save blocks' },
      { status: 500 }
    );
  }
}
