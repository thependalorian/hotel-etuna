/**
 * Restaurant Table Card Component
 * 
 * Purpose: Display individual restaurant table with QR code
 * Location: /components/features/restaurant/TableCard.tsx
 * 
 * Features:
 * - QR code image display
 * - Table number and name
 * - Capacity and location
 * - Action buttons (View QR, Edit, Delete)
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Card shadows: shadow-lg with hover:shadow-xl
 * - Button sizes: min-h-[36px] for small buttons
 * 
 * Accessibility:
 * - Semantic HTML structure
 * - Proper heading hierarchy (h4)
 * - Alt text for images
 * - ARIA labels for buttons
 * 
 * @param {Object} table - Table data object
 * @param {number} index - Index for animation delay
 * 
 * @module TableCard
 */

import Image from 'next/image';
import { QRCodeService } from '@/lib/services/restaurant/QRCodeService';

const qrCodeService = new QRCodeService();

interface RestaurantTable {
  id: string;
  table_number: string;
  table_name?: string;
  capacity: number;
  location?: string;
  qr_code: string;
  qr_code_url: string;
}

interface TableCardProps {
  table: RestaurantTable;
  index: number;
}

export default function TableCard({ table, index }: TableCardProps) {
  return (
    <div 
      className="card bg-base-100 shadow-lg card-hover animate-slide-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <figure className="px-10 pt-10">
        <Image 
          src={qrCodeService.generateQRCodeImageUrl(table.qr_code)} 
          alt={`QR Code for Table ${table.table_number}`} 
          width={200} 
          height={200} 
          className="rounded-xl" 
          unoptimized
        />
      </figure>
      <div className="card-body items-center text-center">
        <h4 className="card-title text-lg font-display">
          Table {table.table_number} 
          {table.table_name && <span className="text-base-content/70"> ({table.table_name})</span>}
        </h4>
        <div className="space-y-1 mb-4">
          <p className="text-sm text-base-content/70">Capacity: <span className="font-medium">{table.capacity}</span></p>
          {table.location && (
            <p className="text-sm text-base-content/70">Location: <span className="font-medium">{table.location}</span></p>
          )}
        </div>
        <div className="card-actions gap-2">
          <a 
            href={qrCodeService.generateQRCodeUrl(table.qr_code)} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-sm btn-info gentle-lift min-h-[36px]"
            aria-label={`View QR code for table ${table.table_number}`}
          >
            View QR
          </a>
          <button 
            className="btn btn-sm btn-ghost gentle-lift min-h-[36px]"
            aria-label={`Edit table ${table.table_number}`}
          >
            Edit
          </button>
          <button 
            className="btn btn-sm btn-error gentle-lift min-h-[36px]"
            aria-label={`Delete table ${table.table_number}`}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
