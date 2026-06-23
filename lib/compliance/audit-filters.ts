/**
 * Audit log UI filter options (aligns with `audit_trail.resource_type` / `action`)
 * Location: lib/compliance/audit-filters.ts
 */

import { AuditActions } from './regulatory-context';

export const RESOURCE_TYPE_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All resource types' },
  { value: 'support_ticket', label: 'Support ticket' },
  { value: 'consumer_rights_request', label: 'Consumer rights (ETA)' },
  { value: 'open_banking', label: 'Open banking / consent' },
  { value: 'payment', label: 'Payment / transaction' },
  { value: 'security', label: 'Security' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'user', label: 'User' },
  { value: 'tenant', label: 'Tenant' },
  { value: 'property', label: 'Property' },
  { value: 'booking', label: 'Booking' },
];

/** Values must match `audit_trail.action` strings used in code */
export const ACTION_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All actions' },
  { value: AuditActions.SUPPORT_TICKET_STATUS_UPDATE, label: 'Support: status change' },
  { value: AuditActions.SUPPORT_TICKET_ADMIN_REPLY, label: 'Support: admin reply' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'login', label: 'Login' },
  { value: 'unauthorized_access', label: 'Unauthorized access' },
  { value: 'rate_limit_exceeded', label: 'Rate limit exceeded' },
];
