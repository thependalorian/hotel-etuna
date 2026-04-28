/**
 * AuditLogViewer Component
 *
 * Purpose: Audit trail viewer wrapper for platform admin audit route.
 * Location: components/features/admin/platform/AuditLogViewer.tsx
 */
'use client';

import AuditLogList from '@/components/features/admin/platform/AuditLogList';

export default function AuditLogViewer() {
  return <AuditLogList />;
}
