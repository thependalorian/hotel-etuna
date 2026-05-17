/**
 * StaffCard Component
 * 
 * Purpose: Display a single staff member card with details and actions
 * Location: /components/features/staff/StaffCard.tsx
 * 
 * Features:
 * - Staff information display
 * - Status indicators
 * - Quick actions (edit, view schedule)
 * - Contact information
 * - Responsive design
 */

'use client';

import React from 'react';
import type { Staff } from '@/lib/db/schema';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Edit, Mail, Phone, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface StaffCardProps {
  staff: Staff;
  onEdit?: (staff: Staff) => void;
  onViewSchedule?: (staff: Staff) => void;
  className?: string;
}

export default function StaffCard({
  staff,
  onEdit,
  onViewSchedule,
  className = '',
}: StaffCardProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      ACTIVE: 'badge-success',
      INACTIVE: 'badge-warning',
      TERMINATED: 'badge-error',
      ON_LEAVE: 'badge-ghost',
    };
    return variants[status] || 'badge-ghost';
  };

  const getStatusColor = (status: string) => {
    const variants: Record<string, { bg: string; text: string; dot: string }> = {
      ACTIVE: { bg: 'bg-semantic-success-light', text: 'text-semantic-success-dark', dot: 'bg-semantic-success' },
      INACTIVE: { bg: 'bg-semantic-warning-light', text: 'text-semantic-warning-dark', dot: 'bg-semantic-warning' },
      TERMINATED: { bg: 'bg-semantic-error-light', text: 'text-semantic-error-dark', dot: 'bg-semantic-error' },
      ON_LEAVE: { bg: 'bg-nude-100', text: 'text-nude-800', dot: 'bg-nude-400' },
    };
    return variants[status] || variants.INACTIVE;
  };

  const statusColors = getStatusColor(staff.status ?? 'ACTIVE');

  return (
    <Card className={cn('hover:shadow-nude-medium hover:-translate-y-0.5 transition-all duration-200', className)} variant="elevated">
      <CardContent className="p-5">
        {/* Staff Header with Avatar */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-nude-200 to-nude-300 flex items-center justify-center shadow-nude-soft flex-shrink-0">
              <span className="text-xl font-bold text-nude-700">
                {staff.firstName[0]}{staff.lastName[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-lg font-semibold text-nude-900 truncate">
                {staff.firstName} {staff.lastName}
              </h3>
              <p className="text-sm text-nude-600 font-medium">{staff.position}</p>
            </div>
          </div>
          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0', statusColors.bg, statusColors.text)}>
            <span className={cn('w-2 h-2 rounded-full', statusColors.dot)} />
            {staff.status}
          </span>
        </div>

        {/* Contact Information */}
        <div className="space-y-2 mb-4 p-3 bg-nude-50 rounded-lg border border-nude-200">
          {staff.email && (
            <div className="flex items-center gap-2 text-sm text-nude-700">
              <Mail className="w-4 h-4 text-nude-500" />
              <span className="truncate">{staff.email}</span>
            </div>
          )}
          {staff.phone && (
            <div className="flex items-center gap-2 text-sm text-nude-700">
              <Phone className="w-4 h-4 text-nude-500" />
              <span>{staff.phone}</span>
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 bg-nude-50 rounded-lg">
            <p className="text-xs text-nude-600 mb-1">Shifts</p>
            <p className="font-display text-lg font-bold text-nude-900">0</p>
          </div>
          <div className="text-center p-2 bg-nude-50 rounded-lg">
            <p className="text-xs text-nude-600 mb-1">Hours</p>
            <p className="font-display text-lg font-bold text-nude-900">0</p>
          </div>
          <div className="text-center p-2 bg-nude-50 rounded-lg">
            <p className="text-xs text-nude-600 mb-1">Rating</p>
            <p className="font-display text-lg font-bold text-nude-900">-</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-nude-200">
          {onEdit && (
            <button
              onClick={() => onEdit(staff)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-nude-700 hover:bg-nude-50 rounded-lg transition-colors duration-200 min-h-[44px]"
              aria-label={`Edit ${staff.firstName} ${staff.lastName}`}
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          )}
          {onViewSchedule && (
            <button
              onClick={() => onViewSchedule(staff)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-nude-700 hover:bg-nude-50 rounded-lg transition-colors duration-200 min-h-[44px]"
              aria-label={`View schedule for ${staff.firstName} ${staff.lastName}`}
            >
              <Calendar className="w-4 h-4" />
              Schedule
            </button>
          )}
          <Link
            href={`/staff/${staff.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-nude-600 text-white rounded-lg font-semibold text-sm hover:bg-nude-700 transition-colors duration-200 ml-auto min-h-[44px]"
            aria-label={`View full details for ${staff.firstName} ${staff.lastName}`}
          >
            View Details
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
