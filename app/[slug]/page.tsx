/**
 * Dynamic CMS Page Renderer
 *
 * Purpose: Render published CMS pages by slug
 * Location: /app/[slug]/page.tsx
 */

import React from 'react';
import { notFound } from 'next/navigation';
import { db, cmsPages, cmsBlocks } from '@/lib/db';
import { eq, and, asc } from 'drizzle-orm';
import BlockHeroRender from '@/components/features/cms/renders/BlockHeroRender';
import BlockTextRender from '@/components/features/cms/renders/BlockTextRender';
import BlockImageRender from '@/components/features/cms/renders/BlockImageRender';
import BlockCtaRender from '@/components/features/cms/renders/BlockCtaRender';
import BlockTestimonialGridRender from '@/components/features/cms/renders/BlockTestimonialGridRender';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;

  const [page] = await db
    .select()
    .from(cmsPages)
    .where(
      and(
        eq(cmsPages.slug, slug),
        eq(cmsPages.status, 'published')
      )
    )
    .limit(1);

  if (!page) {
    return {
      title: 'Page Not Found',
    };
  }

  return {
    title: page.title,
    description: page.metaDescription || page.title,
  };
}

export default async function DynamicCmsPage({ params }: PageProps) {
  const { slug } = await params;

  // Fetch published page
  const [page] = await db
    .select()
    .from(cmsPages)
    .where(
      and(
        eq(cmsPages.slug, slug),
        eq(cmsPages.status, 'published')
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
    .where(eq(cmsBlocks.pageId, page.id))
    .orderBy(asc(cmsBlocks.blockOrder));

  const renderBlock = (block: typeof blocks[0]) => {
    const content = block.content as Record<string, any>;

    switch (block.blockType) {
      case 'hero':
        return <BlockHeroRender key={block.id} content={content} />;
      case 'text':
        return <BlockTextRender key={block.id} content={content} />;
      case 'image':
        return <BlockImageRender key={block.id} content={content} />;
      case 'cta':
        return <BlockCtaRender key={block.id} content={content} />;
      case 'testimonial_grid':
        return <BlockTestimonialGridRender key={block.id} content={content} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-base-200 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold">{page.title}</h1>
          {page.metaDescription && (
            <p className="mt-4 text-lg text-base-content/70">
              {page.metaDescription}
            </p>
          )}
        </div>
      </div>

      {/* Blocks */}
      <div className="container mx-auto px-4 py-12 space-y-12">
        {blocks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-base-content/70">
              This page is empty. Content will appear here soon.
            </p>
          </div>
        ) : (
          blocks.map((block) => renderBlock(block))
        )}
      </div>
    </div>
  );
}
