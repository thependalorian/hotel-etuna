/**
 * Guests API compatibility route.
 *
 * Purpose: Preserve `/api/guests` contract by reusing CRM guest handlers.
 * Location: /app/api/guests/route.ts
 */

export { GET, POST } from '@/app/api/crm/guests/route';
