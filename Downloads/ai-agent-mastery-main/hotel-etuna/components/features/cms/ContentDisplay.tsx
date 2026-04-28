/**
 * ContentDisplay Component
 * 
 * Purpose: Display CMS content with formatting
 * Location: /components/features/cms/ContentDisplay.tsx
 * 
 * Features:
 * - Support for different content types
 * - Rich text formatting
 * - Status badges
 * - Responsive layout
 */

'use client';

import { useState, useEffect } from 'react';
import { apiUrl } from '@/lib/utils/api-url';

interface ContentItem {
  id: string;
  title: string;
  content?: string;
  content_type?: string;
  contentType?: string;
  status: string;
  published_at?: Date | string;
  publishedAt?: Date | string;
  metadata?: Record<string, any>;
}

interface ContentDisplayProps {
  propertyId: string;
  contentType?: string;
  limit?: number;
  showStatus?: boolean;
  className?: string;
}

export default function ContentDisplay({
  propertyId,
  contentType,
  limit = 5,
  showStatus = true,
  className = ''
}: ContentDisplayProps) {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        let url = `/api/cms/content?propertyId=${propertyId}&limit=${limit}`;
        if (contentType) {
          url += `&contentType=${contentType}`;
        }
        
        const response = await fetch(apiUrl(url));
        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }
        const data = await response.json();
        setContent(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error('Error fetching content:', err);
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchContent();
    }
  }, [propertyId, contentType, limit]);

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(limit)].map((_, i) => (
          <div key={i} className="h-24 bg-base-200 rounded-lg animate-pulse" />
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

  if (content.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <svg className="w-12 h-12 text-base-content/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-base-content/70">No content found</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {content.map((item) => {
        const type = item.content_type || item.contentType || 'general';
        const isPublished = item.status === 'published';
        
        return (
          <div key={item.id} className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
            <div className="card-body p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-2">{item.title}</h4>
                  {item.content && (
                    <p className="text-sm text-base-content/70 line-clamp-3 mb-2">
                      {item.content}
                    </p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge badge-outline badge-sm">{type}</span>
                    {showStatus && (
                      <span className={`badge badge-sm ${
                        isPublished ? 'badge-success' : 'badge-warning'
                      }`}>
                        {item.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
