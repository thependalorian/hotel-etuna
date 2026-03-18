/**
 * Incidents Service - SmartPay Mobile
 * Handles PSD-12 compliant incident reporting
 * Location: mobile/services/incidents.ts
 */

import { api } from './api';

export interface Incident {
  id: string;
  type: string;
  category: string;
  description: string;
  status: 'pending' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string | Date;
  created_at?: string | Date;
  updatedAt?: string | Date;
  updated_at?: string | Date;
  resolvedAt?: string | Date;
  resolved_at?: string | Date;
  metadata?: Record<string, unknown>;
}

export interface CreateIncidentRequest {
  type: string;
  category: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
}

/**
 * Create an incident report
 * POST /api/v1/mobile/incidents
 */
export async function createIncident(request: CreateIncidentRequest): Promise<{
  success: boolean;
  data?: { incident: Incident };
  error?: string;
}> {
  try {
    const response = await api.post<{ data: { incident: Incident } }>(
      '/api/v1/mobile/incidents',
      request,
      { retry: false }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('createIncident error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create incident',
    };
  }
}

/**
 * Get user's incident reports
 * GET /api/v1/mobile/incidents
 */
export async function getIncidents(options?: {
  limit?: number;
  offset?: number;
  status?: string;
}): Promise<Incident[]> {
  try {
    const params: Record<string, unknown> = {};
    
    if (options?.limit) params.limit = options.limit;
    if (options?.offset) params.offset = options.offset;
    if (options?.status) params.status = options.status;

    const response = await api.get<{ data: { incidents: Incident[]; count: number } }>(
      '/api/v1/mobile/incidents',
      { params, retry: true }
    );

    return response.data?.incidents || [];
  } catch (error) {
    console.error('getIncidents error:', error);
    return [];
  }
}

/**
 * Get specific incident details
 * GET /api/v1/mobile/incidents/:id
 */
export async function getIncidentById(incidentId: string): Promise<Incident | null> {
  try {
    const response = await api.get<{ data: { incident: Incident } }>(
      `/api/v1/mobile/incidents/${incidentId}`
    );

    return response.data?.incident || null;
  } catch (error) {
    console.error('getIncidentById error:', error);
    return null;
  }
}
