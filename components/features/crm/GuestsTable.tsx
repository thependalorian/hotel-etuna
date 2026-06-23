/**
 * Guests Table Component
 * 
 * Purpose: Display guests in table format
 * Location: /components/features/crm/GuestsTable.tsx
 * 
 * Features:
 * - Table with name, email, phone
 * - View action links
 * - Staggered row animations
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Table hover effects
 * 
 * Accessibility:
 * - Semantic HTML table structure
 * - Proper table headers
 * - ARIA labels for links
 * 
 * @param {Array} guests - Array of guest objects
 * 
 * @module GuestsTable
 */

import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Mail, Phone, User } from 'lucide-react';

interface Guest {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  createdAt?: Date | string | null;
}

interface GuestsTableProps {
  guests: Guest[];
}

export default function GuestsTable({ guests }: GuestsTableProps) {
  if (guests.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 mx-auto text-nude-300 mb-3" />
        <p className="text-ink-600 font-medium">No guests found</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto scrollbar-thin -mx-4 sm:mx-0 px-4 sm:px-0">
      <table className="w-full min-w-[640px] sm:min-w-0">
        <thead>
          <tr className="border-b-2 border-nude-200">
            <th className="text-left py-3 px-4 text-sm font-semibold text-ink-700">Guest</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-ink-700">Contact</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-ink-700">Stats</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-ink-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {guests.map((guest, index) => (
            <tr 
              key={guest.id}
              className="border-b border-nude-100 hover:bg-nude-50 transition-colors duration-200 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-nude-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-ink-700">
                      {(guest.firstName?.[0] || '').toUpperCase()}{(guest.lastName?.[0] || '').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-ink-900">
                      {guest.firstName || ''} {guest.lastName || ''}
                    </p>
                    <p className="text-xs text-ink-500 mt-0.5">Guest ID: {guest.id.slice(0, 8)}</p>
                  </div>
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-ink-600">
                    <Mail className="w-4 h-4 text-nude-400" />
                    <span>{guest.email}</span>
                  </div>
                  {guest.phone && (
                    <div className="flex items-center gap-2 text-sm text-ink-600">
                      <Phone className="w-4 h-4 text-nude-400" />
                      <span>{guest.phone}</span>
                    </div>
                  )}
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="flex gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-nude-100 text-ink-700">
                    0 visits
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-nude-100 text-ink-700">
                    N$0
                  </span>
                </div>
              </td>
              <td className="py-4 px-4 text-right">
                <Link 
                  href={`/crm/guests/${guest.id}`} 
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-nude-100 rounded-etuna-input transition-colors duration-200 min-h-[44px]"
                  aria-label={`View details for ${guest.firstName || ''} ${guest.lastName || ''}`}
                >
                  View
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
