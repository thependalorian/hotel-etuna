'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import type { CmsContent, CmsMedia, Property } from '@/lib/db/schema';
import { ImagePlaceholder } from '@/components/ui';
import { apiUrl } from '@/lib/utils/api-url';
import { formatDate } from '@/lib/formatters';
import { StatusBadge } from '@/components/shared/StatusBadge';
import ContentEditor from './ContentEditor';
import MediaUploader from './MediaUploader';

interface CmsDashboardProps {
  initialContent: CmsContent[];
  initialMedia: CmsMedia[];
  properties: Property[];
}

export default function CmsDashboard({ initialContent, initialMedia, properties }: CmsDashboardProps) {
  const [content, setContent] = useState<CmsContent[]>(initialContent);
  const [media, setMedia] = useState<CmsMedia[]>(initialMedia);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(properties.length > 0 ? properties[0].id : null);
  const [showContentEditor, setShowContentEditor] = useState(false);
  const [showMediaUploader, setShowMediaUploader] = useState(false);

  const fetchCmsData = useCallback(async (propId: string) => {
    try {
      const contentResponse = await fetch(apiUrl(`/api/cms/content?propertyId=${propId}`));
      const contentData: CmsContent[] = await contentResponse.json();
      setContent(contentData);

      const mediaResponse = await fetch(apiUrl(`/api/cms/media?propertyId=${propId}`));
      const mediaData: CmsMedia[] = await mediaResponse.json();
      setMedia(mediaData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error fetching CMS data:', err.message);
      } else {
        console.error('Error fetching CMS data:', err);
      }
    }
  }, []);

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    if (propertyId) {
      void fetchCmsData(propertyId);
    }
  };

  if (properties.length === 0) {
    return (
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body text-center py-16">
          <div className="w-20 h-20 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold font-display mb-2">No properties found</h3>
          <p className="text-base-content/70 mb-6">Please add a property first to manage content.</p>
          <Link href="/properties/new" className="btn btn-primary gentle-lift">
            Add New Property
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl md:text-4xl font-bold font-display mb-2">CMS Dashboard</h2>
        <p className="text-base-content/70">Manage content and media for your properties</p>
      </div>

      <div className="card bg-base-100 shadow-lg card-hover">
        <div className="card-body">
          <label htmlFor="propertySelect" className="label">
            <span className="label-text font-medium">Select Property:</span>
          </label>
          <select
            id="propertySelect"
            className="select select-bordered w-full max-w-md min-h-[44px]"
            value={selectedPropertyId || ''}
            onChange={(e) => handlePropertyChange(e.target.value)}
          >
            {properties.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedPropertyId ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Content Management Section */}
          <div className="card bg-base-100 shadow-lg card-hover animate-slide-up">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h3 className="card-title text-xl font-display">Content Management</h3>
                <button 
                  onClick={() => setShowContentEditor(!showContentEditor)} 
                  className="btn btn-primary btn-sm gentle-lift min-h-[44px]"
                  aria-label={showContentEditor ? 'Hide content editor' : 'Show content editor'}
                >
                  {showContentEditor ? 'Hide Editor' : 'Add New Content'}
                </button>
              </div>
              {showContentEditor && (
                <div className="animate-scale-in">
                  <ContentEditor propertyId={selectedPropertyId} onContentAdded={() => fetchCmsData(selectedPropertyId)} />
                </div>
              )}
              {content.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-base-content/70">No content found for this property.</p>
                </div>
              ) : (
                <div className="w-full overflow-x-auto scrollbar-thin mt-4 -mx-4 sm:mx-0 px-4 sm:px-0">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th className="text-base-content/70">Title</th>
                        <th className="text-base-content/70">Type</th>
                        <th className="text-base-content/70">Status</th>
                        <th className="text-base-content/70">Last Updated</th>
                        <th className="text-base-content/70">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {content.map((item, index) => (
                        <tr 
                          key={item.id}
                          className="hover:bg-base-200 transition-colors duration-200 animate-fade-in"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <td className="font-medium">{item.title}</td>
                          <td className="text-base-content/70">{item.contentType}</td>
                          <td>
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="text-base-content/60 text-sm">
                            {formatDate((item as CmsContent & { updated_at?: Date | string | null }).updatedAt || (item as CmsContent & { updated_at?: Date | string | null }).updated_at)}
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <button 
                                className="btn btn-ghost btn-xs gentle-lift min-h-[44px]" 
                                aria-label={`Edit ${item.title}`}
                              >
                                Edit
                              </button>
                              <button 
                                className="btn btn-ghost btn-xs btn-error gentle-lift min-h-[44px]" 
                                aria-label={`Delete ${item.title}`}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Media Library Section */}
          <div className="card bg-base-100 shadow-lg card-hover animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h3 className="card-title text-xl font-display">Media Library</h3>
                <button 
                  onClick={() => setShowMediaUploader(!showMediaUploader)} 
                  className="btn btn-primary btn-sm gentle-lift min-h-[44px]"
                  aria-label={showMediaUploader ? 'Hide media uploader' : 'Show media uploader'}
                >
                  {showMediaUploader ? 'Hide Uploader' : 'Upload Media'}
                </button>
              </div>
              {showMediaUploader && (
                <div className="animate-scale-in">
                  <MediaUploader propertyId={selectedPropertyId} onMediaUploaded={() => fetchCmsData(selectedPropertyId)} />
                </div>
              )}
              {media.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-base-content/70">No media found for this property.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {media.map((item, index) => (
                    <div 
                      key={item.id} 
                      className="card card-compact bg-base-200 shadow-md hover:shadow-lg transition-shadow duration-200 animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <figure className="relative h-24 w-full overflow-hidden bg-base-300">
                        {((item as any).file_type === 'image' || (item as any).fileType === 'image') ? (
                          <ImagePlaceholder
                            src={(item as any).file_path || (item as any).filePath}
                            alt={(item as any).file_name || (item as any).fileName || 'Media item'}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-24 bg-base-300 flex items-center justify-center text-base-content/40">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </figure>
                      <div className="card-body p-2 text-sm">
                        <p className="truncate text-base-content">{(item as any).file_name || (item as any).fileName}</p>
                        <div className="card-actions justify-end mt-2">
                          <button 
                            className="btn btn-ghost btn-xs gentle-lift min-h-[44px]" 
                            aria-label={`View ${(item as any).file_name || (item as any).fileName}`}
                          >
                            View
                          </button>
                          <button 
                            className="btn btn-ghost btn-xs btn-error gentle-lift min-h-[44px]" 
                            aria-label={`Delete ${(item as any).file_name || (item as any).fileName}`}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body text-center py-12">
            <p className="text-base-content/70">Select a property to manage its content and media.</p>
          </div>
        </div>
      )}
    </div>
  );
}
