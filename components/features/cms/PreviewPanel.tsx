/**
 * PreviewPanel Component
 * 
 * Purpose: Preview panel for CMS content before publishing
 * Location: /components/features/cms/PreviewPanel.tsx
 * 
 * Features:
 * - Content preview
 * - Media preview
 * - Responsive preview modes
 * - Publish/draft toggle
 * - Responsive design
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { ImagePlaceholder } from '@/components/ui';
import { Eye, Monitor, Tablet, Smartphone, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface PreviewPanelProps {
  content?: {
    title?: string;
    body?: string;
    contentType?: string;
  };
  media?: {
    url: string;
    type: string;
    alt?: string;
  };
  onPublish?: () => void;
  onDraft?: () => void;
  className?: string;
}

type PreviewMode = 'desktop' | 'tablet' | 'mobile';

export default function PreviewPanel({
  content,
  media,
  onPublish,
  onDraft,
  className = '',
}: PreviewPanelProps) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');

  const previewWidths = {
    desktop: 'w-full',
    tablet: 'max-w-2xl mx-auto',
    mobile: 'max-w-sm mx-auto',
  };

  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold font-display flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Preview
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={cn(
                'btn btn-ghost btn-sm min-h-[44px]',
                previewMode === 'desktop' && 'btn-active'
              )}
              aria-label="Desktop preview"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewMode('tablet')}
              className={cn(
                'btn btn-ghost btn-sm min-h-[44px]',
                previewMode === 'tablet' && 'btn-active'
              )}
              aria-label="Tablet preview"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={cn(
                'btn btn-ghost btn-sm min-h-[44px]',
                previewMode === 'mobile' && 'btn-active'
              )}
              aria-label="Mobile preview"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className={cn('border-2 border-base-300 rounded-lg overflow-hidden bg-base-100', previewWidths[previewMode])}>
          {media && (
            <div className="relative w-full aspect-video">
              {media.type.startsWith('image/') ? (
                <ImagePlaceholder
                  src={media.url}
                  alt={media.alt || 'Preview'}
                  fill
                  className="object-contain"
                  aspectRatio="video"
                />
              ) : media.type.startsWith('video/') ? (
                <video
                  src={media.url}
                  controls
                  className="w-full h-auto"
                />
              ) : null}
            </div>
          )}

          {content && (
            <div className="p-6">
              {content.title && (
                <h2 className="text-2xl font-bold font-display mb-4">{content.title}</h2>
              )}
              {content.body && (
                <div
                  className="buffr-legal-content max-w-none [&_img]:max-w-full [&_img]:rounded-xl"
                  dangerouslySetInnerHTML={{ __html: content.body }}
                />
              )}
            </div>
          )}

          {!content && !media && (
            <div className="p-12 text-center text-base-content/60">
              <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No content to preview</p>
            </div>
          )}
        </div>

        {/* Actions */}
        {(onPublish || onDraft) && (
          <div className="flex items-center gap-2 mt-6 pt-6 border-t border-base-200">
            {onPublish && (
              <button
                onClick={onPublish}
                className="btn btn-primary min-h-[44px] flex-1"
                aria-label="Publish content"
              >
                <Check className="w-4 h-4 mr-2" />
                Publish
              </button>
            )}
            {onDraft && (
              <button
                onClick={onDraft}
                className="btn btn-outline min-h-[44px] flex-1"
                aria-label="Save as draft"
              >
                <X className="w-4 h-4 mr-2" />
                Save Draft
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
