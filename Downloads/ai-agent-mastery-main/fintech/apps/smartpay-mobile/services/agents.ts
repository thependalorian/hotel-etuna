/**
 * Agents Service - SmartPay Mobile
 * Handles agent location and information lookup
 * Location: mobile/services/agents.ts
 */

import { api } from './api';

export interface Agent {
  id: string;
  code: string;
  name: string;
  type: 'agent' | 'merchant' | 'till';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    region?: string;
  };
  services: string[];
  operatingHours?: {
    open: string;
    close: string;
  };
  rating?: number;
  distance?: number;
  phone?: string;
  status: 'active' | 'inactive';
}

/**
 * Find nearest agents by location
 * GET /api/v1/mobile/agents/nearest
 */
export async function getNearestAgents(params: {
  latitude: number;
  longitude: number;
  radius?: number;
  limit?: number;
}): Promise<Agent[]> {
  try {
    const queryParams: Record<string, unknown> = {
      latitude: params.latitude,
      longitude: params.longitude,
    };

    if (params.radius) queryParams.radius = params.radius;
    if (params.limit) queryParams.limit = params.limit;

    const response = await api.get<{ agents: Agent[] }>(
      '/api/v1/mobile/agents/nearest',
      { params: queryParams, retry: true }
    );

    return response.agents || [];
  } catch (error) {
    console.error('getNearestAgents error:', error);
    return [];
  }
}

/**
 * Get agent by code
 * GET /api/v1/mobile/agents/:agentCode
 */
export async function getAgentByCode(agentCode: string): Promise<Agent | null> {
  try {
    const response = await api.get<{ agent: Agent }>(`/api/v1/mobile/agents/${agentCode}`);
    return response.agent;
  } catch (error) {
    console.error('getAgentByCode error:', error);
    return null;
  }
}

/**
 * Get agents by region
 * GET /api/v1/mobile/agents/region/:region
 */
export async function getAgentsByRegion(region: string): Promise<Agent[]> {
  try {
    const response = await api.get<{ agents: Agent[] }>(
      `/api/v1/mobile/agents/region/${region}`,
      { retry: true }
    );

    return response.agents || [];
  } catch (error) {
    console.error('getAgentsByRegion error:', error);
    return [];
  }
}
