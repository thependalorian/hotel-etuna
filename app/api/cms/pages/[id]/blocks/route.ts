/**
 * CMS Page Blocks API
 *
 * PUT /api/cms/pages/[id]/blocks - Save all blocks for a page
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithTenantContext } from '@/lib/auth/tenant-context';
import { db, cmsPages, cmsBlocks } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const blockSchema = z.object({
  id: z.string(),
  pageId: z.string(),
  blockType: z.string(),
  blockOrder: z.number(),
  content: z.record(z.any()),
});

const saveBlocksSchema = z.object({
  blocks: z.array(blockSchema),
});

export async function PUT(
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

    const { id: pageId } = await context.params;

    // Verify page belongs to tenant
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
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = saveBlocksSchema.parse(body);

    // Delete all existing blocks for this page
    await db.delete(cmsBlocks).where(eq(cmsBlocks.pageId, pageId));

    // Insert new blocks (only non-temp ones)
    const blocksToInsert = validatedData.blocks
      .filter((block) => !block.id.startsWith('temp-'))
      .map((block) => ({
        pageId: pageId,
        blockType: block.blockType,
        blockOrder: block.blockOrder,
        content: block.content,
      }));

    // Also insert temp blocks but with new IDs
    const tempBlocks = validatedData.blocks
      .filter((block) => block.id.startsWith('temp-'))
      .map((block) => ({
        pageId: pageId,
        blockType: block.blockType,
        blockOrder: block.blockOrder,
        content: block.content,
      }));

    const allBlocks = [...blocksToInsert, ...tempBlocks];

    let savedBlocks = [];
    if (allBlocks.length > 0) {
      savedBlocks = await db
        .insert(cmsBlocks)
        .values(allBlocks)
        .returning();
    }

    return NextResponse.json({ 
      success: true, 
      blocks: savedBlocks 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[CMS Blocks API] PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
