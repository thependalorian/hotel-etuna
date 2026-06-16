/**
 * @fileoverview API route //api/guests/[id]
 * Location: /app/api/guests/[id]/route.ts
 */

/**
 * Guests by ID API compatibility route.
 *
 * Purpose: Preserve `/api/guests/[id]` contract by reusing CRM guest handlers.
 * Location: /app/api/guests/[id]/route.ts
 */

export { GET, PUT } from '@/app/api/crm/guests/[id]/route';
