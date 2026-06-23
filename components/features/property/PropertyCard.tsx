'use client';

import React, { useEffect, useState } from 'react';
import type { Property } from '@/lib/db/schema';
import Link from 'next/link';
import { apiUrl } from '@/lib/utils/api-url';
import { ImagePlaceholder, PropertyAvatar } from '@/components/ui';
import { securityLogger } from '@/lib/utils/security-logger.client';

type PropertyCardProps = {
  property: Property & {
    _count?: {
      rooms: number;
      bookings: number;
    };
  };
};

const PropertyCard = ({ property }: PropertyCardProps) => {
  const [propertyImage, setPropertyImage] = useState<string | null>(null);
  const [propertyDescription, setPropertyDescription] = useState<string | null>(null);

  useEffect(() => {
    // Fetch property image from CMS
    const fetchPropertyMedia = async () => {
      try {
        const mediaResponse = await fetch(apiUrl(`/api/cms/media?propertyId=${property.id}&fileType=image&limit=1`));
        if (mediaResponse.ok) {
          const media = await mediaResponse.json();
          if (Array.isArray(media) && media.length > 0) {
            setPropertyImage((media[0] as any).file_path || (media[0] as any).filePath);
          }
        }
      } catch (error) {
        securityLogger.error('Error fetching property media:', error);
      }
    };

    // Fetch property description from CMS
    const fetchPropertyContent = async () => {
      try {
        const contentResponse = await fetch(apiUrl(`/api/cms/content?propertyId=${property.id}&contentType=property&status=published&limit=1`));
        if (contentResponse.ok) {
          const content = await contentResponse.json();
          if (Array.isArray(content) && content.length > 0) {
            setPropertyDescription((content[0] as any).content || null);
          }
        }
      } catch (error) {
        securityLogger.error('Error fetching property content:', error);
      }
    };

    fetchPropertyMedia();
    fetchPropertyContent();
  }, [property.id]);

  return (
    <div className="rounded-etuna-input border border-nude-200 bg-surface-elevated hover:-translate-y-1 transition-all duration-300 animate-slide-up group overflow-hidden">
      {/* Property Image from CMS */}
      <figure className="relative h-56 w-full overflow-hidden bg-nude-100">
        <ImagePlaceholder
          src={propertyImage}
          alt={property.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Status badge overlay */}
        <div className="absolute top-3 right-3">
          {property.status === 'active' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-semantic-success-light text-semantic-success-dark border border-semantic-success/20">
              <span className="w-2 h-2 rounded-full bg-semantic-success" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-nude-100 text-ink-800 border border-nude-300">
              <span className="w-2 h-2 rounded-full bg-nude-400" />
              Inactive
            </span>
          )}
        </div>
      </figure>
      
      <div className="p-6">
        {/* Header */}
        <div className="mb-4">
          <h2 className="font-display text-xl font-semibold text-ink-900 mb-2 group-hover:text-ink-700 transition-colors duration-200">
            {property.name}
          </h2>
          <p className="text-sm text-ink-600 line-clamp-2 leading-relaxed">
            {propertyDescription || property.description || 'No description provided.'}
          </p>
        </div>
        
        {/* Stats Row */}
        <div className="flex justify-between items-center mb-6 p-4 bg-gradient-to-r from-nude-50 to-nude-100 rounded-etuna-input border border-nude-200">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-nude-600 text-white border border-nude-700">
              {property.type?.toUpperCase() || 'PROPERTY'}
            </span>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-bold text-ink-900 flex items-center gap-1">
              {property._count?.rooms || 0}
              <span className="text-xs font-sans font-normal text-ink-600">rooms</span>
            </p>
            <p className="text-xs text-ink-500 mt-0.5">
              {property._count?.bookings || 0} bookings
            </p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end pt-4 border-t border-nude-200">
          <Link 
            href={`/properties/${property.id}`} 
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-nude-600 text-white rounded-etuna-input font-semibold text-sm hover:bg-nude-700 shadow-nude-soft transition-all duration-200 min-h-[44px]"
          >
            View Details
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;