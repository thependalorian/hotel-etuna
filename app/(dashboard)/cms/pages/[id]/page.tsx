/**
 * Edit CMS Page - Block Editor
 *
 * Purpose: Edit existing CMS page with block editor
 * Location: /app/(dashboard)/cms/pages/[id]/page.tsx
 */

import React from 'react';
import { getSessionWithTenantContext } from '@/lib/auth/tenant-context';
import { redirect, notFound } from 'next/navigation';
import { db, cmsPages, cmsBlocks } from '@/lib/db';
import { eq, and, asc } from 'drizzle-orm';
import CmsBlockEditor from '@/components/features/cms/CmsBlockEditor';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCmsPagePage({ params }: PageProps) {
  const session = await getSessionWithTenantContext();

  if (!session || !session.user?.tenantId) {
    redirect('/login');
  }

  const { id } = await params;
  const tenantId = session.user.tenantId;

  // Fetch the page
  const [page] = await db
    .select()
    .from(cmsPages)
    .where(
      and(
        eq(cmsPages.id, id),
        eq(cmsPages.tenantId, tenantId)
      )
    )
    .limit(1);

  if (!page) {
    notFound();
  }

  // Fetch blocks for this page
  const blocks = await db
    .select()
    .from(cmsBlocks)
    .where(eq(cmsBlocks.pageId, id))
    .orderBy(asc(cmsBlocks.blockOrder));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{page.title}</h1>
        <p className="text-base-content/70 mt-2">
          Edit page content with the block editor
        </p>
        <div className="mt-4 flex gap-2">
          <span className={`badge ${page.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
            {page.status}
          </span>
          <code className="text-sm">/{page.slug}</code>
        </div>
      </div>

      <CmsBlockEditor
        page={{
          id: page.id,
          slug: page.slug,
          title: page.title,
          metaDescription: page.metaDescription || '',
          status: page.status,
          publishedAt: page.publishedAt,
        }}
        initialBlocks={blocks.map((block) => ({
          id: block.id,
          pageId: block.pageId,
          blockType: block.blockType,
          blockOrder: block.blockOrder,
          content: block.content as Record<string, any>,
        }))}
      />
    </div>
  );
}
