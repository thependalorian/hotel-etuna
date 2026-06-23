/**
 * CMS Block Editor
 *
 * Purpose: Block-based editor for CMS pages
 * Location: /components/features/cms/CmsBlockEditor.tsx
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import BlockHero from './blocks/BlockHero';
import BlockText from './blocks/BlockText';
import BlockImage from './blocks/BlockImage';
import BlockCta from './blocks/BlockCta';
import BlockTestimonialGrid from './blocks/BlockTestimonialGrid';

interface Block {
  id: string;
  pageId: string;
  blockType: string;
  blockOrder: number;
  content: Record<string, any>;
}

interface Page {
  id: string;
  slug: string;
  title: string;
  metaDescription: string;
  status: string;
  publishedAt: Date | null;
}

interface Props {
  page: Page;
  initialBlocks: Block[];
}

const BLOCK_TYPES = [
  { value: 'hero', label: 'Hero Section' },
  { value: 'text', label: 'Text Block' },
  { value: 'image', label: 'Image' },
  { value: 'cta', label: 'Call to Action' },
  { value: 'testimonial_grid', label: 'Testimonial Grid' },
];

export default function CmsBlockEditor({ page, initialBlocks }: Props) {
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [loading, setLoading] = useState(false);
  const [showAddBlockMenu, setShowAddBlockMenu] = useState(false);

  const addBlock = (blockType: string) => {
    const newBlock: Block = {
      id: `temp-${Date.now()}`,
      pageId: page.id,
      blockType,
      blockOrder: blocks.length,
      content: getDefaultContent(blockType),
    };
    setBlocks([...blocks, newBlock]);
    setShowAddBlockMenu(false);
  };

  const getDefaultContent = (blockType: string): Record<string, any> => {
    switch (blockType) {
      case 'hero':
        return {
          heading: 'Hero Heading',
          subheading: 'Hero subheading text',
          buttonText: 'Learn More',
          buttonLink: '#',
          backgroundImage: '',
        };
      case 'text':
        return {
          heading: 'Text Heading',
          content: 'Add your text content here...',
        };
      case 'image':
        return {
          src: '/placeholder.jpg',
          alt: 'Image description',
          caption: '',
        };
      case 'cta':
        return {
          heading: 'Ready to get started?',
          description: 'Join us today',
          buttonText: 'Get Started',
          buttonLink: '#',
        };
      case 'testimonial_grid':
        return {
          heading: 'What our customers say',
          testimonials: [],
        };
      default:
        return {};
    }
  };

  const updateBlock = (index: number, content: Record<string, any>) => {
    const newBlocks = [...blocks];
    newBlocks[index].content = content;
    setBlocks(newBlocks);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === blocks.length - 1)
    ) {
      return;
    }

    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[targetIndex]] = [
      newBlocks[targetIndex],
      newBlocks[index],
    ];

    // Update block orders
    newBlocks.forEach((block, i) => {
      block.blockOrder = i;
    });

    setBlocks(newBlocks);
  };

  const deleteBlock = (index: number) => {
    if (!confirm('Delete this block?')) return;
    const newBlocks = blocks.filter((_, i) => i !== index);
    newBlocks.forEach((block, i) => {
      block.blockOrder = i;
    });
    setBlocks(newBlocks);
  };

  const saveBlocks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cms/pages/${page.id}/blocks`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ blocks }),
      });

      if (!response.ok) {
        throw new Error('Failed to save blocks');
      }

      alert('Blocks saved successfully!');
      router.refresh();
    } catch (error) {
      alert('Failed to save blocks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const publishPage = async () => {
    if (!confirm('Publish this page? It will be visible to the public.')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/cms/pages/${page.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'published' }),
      });

      if (!response.ok) {
        throw new Error('Failed to publish page');
      }

      alert('Page published successfully!');
      router.refresh();
    } catch (error) {
      alert('Failed to publish page. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderBlockPreview = (block: Block, index: number) => {
    const commonProps = {
      content: block.content,
      onUpdate: (content: Record<string, any>) => updateBlock(index, content),
    };

    switch (block.blockType) {
      case 'hero':
        return <BlockHero {...commonProps} />;
      case 'text':
        return <BlockText {...commonProps} />;
      case 'image':
        return <BlockImage {...commonProps} />;
      case 'cta':
        return <BlockCta {...commonProps} />;
      case 'testimonial_grid':
        return <BlockTestimonialGrid {...commonProps} />;
      default:
        return <div>Unknown block type: {block.blockType}</div>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Block Editor */}
      <div className="lg:col-span-2">
        <div className="mb-4 flex gap-2">
          <Button onClick={saveBlocks} isLoading={loading}>
            Save Changes
          </Button>
          {page.status !== 'published' && (
            <button
              onClick={publishPage}
              className="btn btn-success"
              disabled={loading}
            >
              Publish
            </button>
          )}
        </div>

        <div className="space-y-4">
          {blocks.map((block, index) => (
            <div key={block.id} className="card bg-base-200">
              <div className="card-body">
                <div className="flex justify-between items-start mb-4">
                  <span className="badge badge-primary">
                    {BLOCK_TYPES.find((t) => t.value === block.blockType)?.label ||
                      block.blockType}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => moveBlock(index, 'up')}
                      className="btn btn-xs btn-ghost"
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveBlock(index, 'down')}
                      className="btn btn-xs btn-ghost"
                      disabled={index === blocks.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => deleteBlock(index)}
                      className="btn btn-xs btn-error btn-ghost"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {renderBlockPreview(block, index)}
              </div>
            </div>
          ))}

          {blocks.length === 0 && (
            <div className="card bg-base-200">
              <div className="card-body text-center">
                <p>No blocks yet. Add your first block to start building!</p>
              </div>
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setShowAddBlockMenu(!showAddBlockMenu)}
              className="btn btn-outline btn-block"
            >
              + Add Block
            </button>
            {showAddBlockMenu && (
              <div className="absolute z-10 mt-2 w-full card bg-base-100 shadow-etuna-elevated">
                <div className="card-body">
                  <div className="grid grid-cols-2 gap-2">
                    {BLOCK_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => addBlock(type.value)}
                        className="btn btn-ghost btn-sm justify-start"
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1">
        <div className="card bg-base-200 sticky top-4">
          <div className="card-body">
            <h3 className="card-title">Page Settings</h3>
            <div className="space-y-2">
              <div>
                <div className="text-sm opacity-70">Status</div>
                <div className="font-medium">{page.status}</div>
              </div>
              <div>
                <div className="text-sm opacity-70">Slug</div>
                <div className="font-mono text-sm">/{page.slug}</div>
              </div>
              {page.publishedAt && (
                <div>
                  <div className="text-sm opacity-70">Published</div>
                  <div className="text-sm">
                    {new Date(page.publishedAt).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
