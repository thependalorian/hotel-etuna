/**
 * Copilot Tools - Location Services
 * Location: fintech/smartpay/services/copilot/copilotTools.ts
 * 
 * Implements copilot tools for agent/ATM/Nampost finder functionality.
 * These tools are used by the AI copilot to help users find locations.
 * 
 * References:
 * - PRD Appendix H §G20 (Agent Network Integration)
 * - BUFFR_MOBILE_ANALYSIS.md §3.9 (Agent Finder)
 */

import {
  findNearbyAgents,
  findNearbyATMs,
  findNampostOffices,
  getCurrentLocation,
  checkLocationPermission,
  AgentLocation,
  ATMLocation,
  NampostOffice,
} from './locationService';

// ========================================
// Tool Definitions
// ========================================

export interface CopilotTool<TInput = any, TOutput = any> {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (input: TInput) => Promise<TOutput>;
}

// ========================================
// Find Nearby Agents Tool
// ========================================

interface FindNearbyAgentsInput {
  latitude?: number;
  longitude?: number;
  radius?: number;
  service?: 'cashout' | 'voucher' | 'ewallet' | 'namqr' | 'all';
  useCurrentLocation?: boolean;
}

interface FindNearbyAgentsOutput {
  agents: AgentLocation[];
  count: number;
  message: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

export const find_nearby_agents: CopilotTool<FindNearbyAgentsInput, FindNearbyAgentsOutput> = {
  name: 'find_nearby_agents',
  description:
    'Find nearby cash-out agents, NamPost branches, or retail locations. Supports filtering by service type (cashout, voucher redemption, e-wallet, NAMQR). Returns up to 10 nearest locations with distance in km.',
  parameters: {
    type: 'object',
    properties: {
      latitude: {
        type: 'number',
        description: 'Latitude of search center. Optional if useCurrentLocation is true.',
      },
      longitude: {
        type: 'number',
        description: 'Longitude of search center. Optional if useCurrentLocation is true.',
      },
      radius: {
        type: 'number',
        description: 'Search radius in kilometers. Default is 10km.',
        default: 10,
      },
      service: {
        type: 'string',
        enum: ['cashout', 'voucher', 'ewallet', 'namqr', 'all'],
        description:
          'Filter by service type: cashout (cash withdrawal), voucher (redeem vouchers), ewallet (e-wallet services), namqr (NAMQR payments), or all (no filter).',
        default: 'cashout',
      },
      useCurrentLocation: {
        type: 'boolean',
        description: 'Use device GPS to get current location. Requires location permission.',
        default: false,
      },
    },
    required: [],
  },
  handler: async (input: FindNearbyAgentsInput): Promise<FindNearbyAgentsOutput> => {
    let lat = input.latitude;
    let lng = input.longitude;

    // Use current location if requested
    if (input.useCurrentLocation || (!lat || !lng)) {
      const permission = await checkLocationPermission();
      if (!permission.granted) {
        throw new Error(
          'Location permission is required. Please enable location services in your device settings.'
        );
      }

      const location = await getCurrentLocation();
      if (!location) {
        throw new Error('Unable to get current location. Please try again or provide coordinates manually.');
      }

      lat = location.latitude;
      lng = location.longitude;
    }

    if (!lat || !lng) {
      throw new Error('Location coordinates are required. Either provide lat/lng or enable location services.');
    }

    const radius = input.radius ?? 10;
    const service = input.service ?? 'cashout';

    const agents = await findNearbyAgents(lat, lng, radius, service);

    let message: string;
    if (agents.length === 0) {
      message = `No agents found within ${radius}km. Try increasing the search radius or changing the service filter.`;
    } else if (agents.length === 1) {
      const agent = agents[0];
      message = `Found 1 agent: ${agent.agent_name} is ${agent.distance_km.toFixed(1)}km away at ${agent.address ?? 'address not available'}.`;
    } else {
      const closest = agents[0];
      message = `Found ${agents.length} agents. The closest is ${closest.agent_name} (${closest.distance_km.toFixed(1)}km away).`;
    }

    return {
      agents,
      count: agents.length,
      message,
      location: {
        latitude: lat,
        longitude: lng,
      },
    };
  },
};

// ========================================
// Find Nearby ATMs Tool
// ========================================

interface FindNearbyATMsInput {
  latitude?: number;
  longitude?: number;
  radius?: number;
  useCurrentLocation?: boolean;
  statusFilter?: 'online' | 'all';
}

interface FindNearbyATMsOutput {
  atms: ATMLocation[];
  count: number;
  message: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

export const find_nearby_atms: CopilotTool<FindNearbyATMsInput, FindNearbyATMsOutput> = {
  name: 'find_nearby_atms',
  description:
    'Find nearby ATMs for cash withdrawals. Returns ATMs with their status (online/offline/maintenance), operating hours (24-hour or business hours), and available services (cash-out, deposit).',
  parameters: {
    type: 'object',
    properties: {
      latitude: {
        type: 'number',
        description: 'Latitude of search center. Optional if useCurrentLocation is true.',
      },
      longitude: {
        type: 'number',
        description: 'Longitude of search center. Optional if useCurrentLocation is true.',
      },
      radius: {
        type: 'number',
        description: 'Search radius in kilometers. Default is 10km.',
        default: 10,
      },
      useCurrentLocation: {
        type: 'boolean',
        description: 'Use device GPS to get current location. Requires location permission.',
        default: false,
      },
      statusFilter: {
        type: 'string',
        enum: ['online', 'all'],
        description: 'Filter by ATM status. "online" shows only operational ATMs, "all" shows all ATMs.',
        default: 'online',
      },
    },
    required: [],
  },
  handler: async (input: FindNearbyATMsInput): Promise<FindNearbyATMsOutput> => {
    let lat = input.latitude;
    let lng = input.longitude;

    if (input.useCurrentLocation || (!lat || !lng)) {
      const permission = await checkLocationPermission();
      if (!permission.granted) {
        throw new Error(
          'Location permission is required. Please enable location services in your device settings.'
        );
      }

      const location = await getCurrentLocation();
      if (!location) {
        throw new Error('Unable to get current location. Please try again or provide coordinates manually.');
      }

      lat = location.latitude;
      lng = location.longitude;
    }

    if (!lat || !lng) {
      throw new Error('Location coordinates are required.');
    }

    const radius = input.radius ?? 10;
    let atms = await findNearbyATMs(lat, lng, radius);

    // Filter by status if requested
    if (input.statusFilter === 'online') {
      atms = atms.filter((atm) => atm.status === 'online');
    }

    let message: string;
    if (atms.length === 0) {
      message = `No ATMs found within ${radius}km.`;
      if (input.statusFilter === 'online') {
        message += ' Try searching for all ATMs (including offline ones).';
      }
    } else if (atms.length === 1) {
      const atm = atms[0];
      const statusText = atm.status === 'online' ? 'operational' : atm.status;
      message = `Found 1 ATM: ${atm.bank_name} (${statusText}) is ${atm.distance_km.toFixed(1)}km away${atm.is_24_hour ? ' - Open 24/7' : ''}.`;
    } else {
      const closest = atms[0];
      const onlineCount = atms.filter((a) => a.status === 'online').length;
      message = `Found ${atms.length} ATMs (${onlineCount} online). The closest is ${closest.bank_name} (${closest.distance_km.toFixed(1)}km away).`;
    }

    return {
      atms,
      count: atms.length,
      message,
      location: {
        latitude: lat,
        longitude: lng,
      },
    };
  },
};

// ========================================
// Find Nampost Offices Tool
// ========================================

interface FindNampostOfficesInput {
  searchQuery: string;
  latitude?: number;
  longitude?: number;
}

interface FindNampostOfficesOutput {
  offices: NampostOffice[];
  count: number;
  message: string;
}

export const find_nampost_offices: CopilotTool<FindNampostOfficesInput, FindNampostOfficesOutput> = {
  name: 'find_nampost_offices',
  description:
    'Search for NamPost branch offices by name, region, or city. Returns office details including address, operating hours, phone number, and available services (mail, parcel, e-money, bill payments, voucher redemption).',
  parameters: {
    type: 'object',
    properties: {
      searchQuery: {
        type: 'string',
        description:
          'Search term: branch name (e.g., "Windhoek Main"), region (e.g., "Khomas"), or city (e.g., "Swakopmund").',
      },
      latitude: {
        type: 'number',
        description: 'Optional: User latitude for distance calculation.',
      },
      longitude: {
        type: 'number',
        description: 'Optional: User longitude for distance calculation.',
      },
    },
    required: ['searchQuery'],
  },
  handler: async (input: FindNampostOfficesInput): Promise<FindNampostOfficesOutput> => {
    if (!input.searchQuery || input.searchQuery.trim().length === 0) {
      throw new Error('Search query is required. Provide a branch name, region, or city.');
    }

    const offices = await findNampostOffices(input.searchQuery, input.latitude, input.longitude);

    let message: string;
    if (offices.length === 0) {
      message = `No NamPost offices found for "${input.searchQuery}". Try searching by region (e.g., "Khomas") or city (e.g., "Windhoek").`;
    } else if (offices.length === 1) {
      const office = offices[0];
      const distanceText = office.distance_km ? ` (${office.distance_km.toFixed(1)}km away)` : '';
      message = `Found: ${office.branch_name}${distanceText} at ${office.address}. Services: ${office.services.join(', ')}.`;
    } else {
      message = `Found ${offices.length} NamPost offices matching "${input.searchQuery}".`;
    }

    return {
      offices,
      count: offices.length,
      message,
    };
  },
};

// ========================================
// Export All Tools
// ========================================

export const locationTools = {
  find_nearby_agents,
  find_nearby_atms,
  find_nampost_offices,
};

export function getLocationTools(): CopilotTool[] {
  return Object.values(locationTools);
}
