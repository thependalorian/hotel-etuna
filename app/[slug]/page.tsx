/**
 * Dynamic CMS Page Renderer
 * 
 * Purpose: Render published CMS pages by slug
 * Location: /app/[slug]/page.tsx
 */

import React from 'react';
import { db, cmsPages, cmsBlocks } from '@/lib/db';
import { eq, and, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { BlockHeroRender } from '@/components/features/cms/renders/BlockHeroRender';
import { BlockTextRender } from '@/components/features/cms/renders/BlockTextRender';
import { BlockImageRender } from '@/components/features/cms/renders/BlockImageRender';
import { BlockCtaRender } from '@/components/features/cms/renders/BlockCtaRender';
import { BlockTestimonialGridRender } from '@/components/features/cms/renders/BlockTestimonialGridRender';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
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
    description: page.metaDescription || undefined,
  };
}

export default async function DynamicCmsPage({ params }: PageProps) {
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
    notFound();
  }

  const blocks = await db
    .select()
    .from(cmsBlocks)
    .where(eq(cmsBlocks.pageId, page.id))
    .orderBy(asc(cmsBlocks.blockOrder));

  const renderBlock = (block: typeof blocks[0]) => {
    switch (block.blockType) {
      case 'hero':
        return <BlockHeroRender key={block.id} content={block.content as any} />;
      case 'text':
        return <BlockTextRender key={block.id} content={block.content as any} />;
      case 'image':
        return <BlockImageRender key={block.id} content={block.content as any} />;
      case 'cta':
        return <BlockCtaRender key={block.id} content={block.content as any} />;
      case 'testimonial_grid':
        return <BlockTestimonialGridRender key={block.id} content={block.content as any} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-4">{page.title}</h1>
          {page.metaDescription && (
            <p className="text-lg text-nude-600">{page.metaDescription}</p>
          )}
        </header>
        
        <div className="space-y-8">
          {blocks.map(renderBlock)}
        </div>
      </div>
    </div>
  );
}
