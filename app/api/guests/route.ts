/**
 * Guests API compatibility route.
 *
 * Staff CRM guest CRUD — distinct from /api/guest/* (guest self-service portal).
 * Thin re-export shim of @/app/api/crm/guests/route for the staff CRM (plural
 * `guests`); the authenticated staff member manages all guest records here.
 *
 * Purpose: Preserve `/api/guests` contract by reusing CRM guest handlers.
 * Location: /app/api/guests/route.ts
 */

export { GET, POST } from '@/app/api/crm/guests/route';
