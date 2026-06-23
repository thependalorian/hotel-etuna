/**
 * PropertyMediaGallery Component
 * 
 * Purpose: Display property image gallery from CMS
 * Location: /components/features/cms/PropertyMediaGallery.tsx
 * 
 * Features:
 * - Image gallery with lazy loading
 * - Lightbox functionality (optional)
 * - Image ordering support
 * - Responsive grid layout
 */

'use client';

import { useState, useEffect } from 'react';
import { ImagePlaceholder } from '@/components/ui';
import { apiUrl } from '@/lib/utils/api-url';
import { securityLogger } from '@/lib/utils/security-logger.client';

interface MediaItem {
  id: string;
  file_path?: string;
  filePath?: string;
  file_name?: string;
  fileName?: string;
  alt_text?: string;
  altText?: string;
  caption?: string;
  display_order?: number;
  displayOrder?: number;
}

interface PropertyMediaGalleryProps {
  propertyId: string;
  limit?: number;
  showCaption?: boolean;
  className?: string;
}

export default function PropertyMediaGallery({ 
  propertyId, 
  limit = 6,
  showCaption = false,
  className = ''
}: PropertyMediaGalleryProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        setLoading(true);
        const response = await fetch(apiUrl(`/api/cms/media?propertyId=${propertyId}&fileType=image&limit=${limit}`));
        if (!response.ok) {
          throw new Error('Failed to fetch media');
        }
        const data = await response.json();
        setMedia(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        securityLogger.error('Error fetching property media:', err);
        setError('Failed to load images');
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchMedia();
    }
  }, [propertyId, limit]);

  if (loading) {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 ${className}`}>
        {[...Array(limit)].map((_, i) => (
          <div key={i} className="aspect-video bg-base-200 rounded-etuna-input animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`alert alert-warning ${className}`}>
        <span>{error}</span>
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <svg className="w-12 h-12 text-base-content/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-base-content/70">No images found</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 ${className}`}>
      {media.map((item) => {
        const imageUrl = item.file_path || item.filePath || '';
        const altText = item.alt_text || item.altText || item.file_name || item.fileName || 'Property image';
        
        return (
          <div key={item.id} className="relative aspect-video rounded-etuna-input overflow-hidden bg-base-200 group cursor-pointer">
            <ImagePlaceholder
              src={imageUrl}
              alt={altText}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
              aspectRatio="video"
            />
            {showCaption && (item.caption || altText) && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <p className="text-white text-sm font-medium">{item.caption || altText}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
