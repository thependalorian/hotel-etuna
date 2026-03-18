/**
 * Location Service for Agent/ATM/Nampost Finder
 * Location: fintech/smartpay/services/copilot/locationService.ts
 * 
 * Provides geolocation-based search for agents, ATMs, and Nampost offices.
 * Implements offline caching and permission handling.
 * 
 * References:
 * - PRD Appendix H §G20 (Agent Network Integration)
 * - BUFFR_MOBILE_ANALYSIS.md §8.7 (Cash Out / Agent Network)
 * - Backend API: /api/v1/mobile/agents/nearest
 */

import * as Location from 'expo-location';
import { getSecureItem } from '@/services/secureStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY_PREFIX = 'location_cache_';

// ========================================
// Types
// ========================================

export interface AgentLocation {
  id: string;
  agent_code: string;
  agent_name: string;
  agent_type: 'nampost' | 'bank_branch' | 'retail' | 'atm' | 'mobile_agent';
  latitude: number;
  longitude: number;
  address: string | null;
  region: string | null;
  ussd_code: string | null;
  supports_cashout: boolean;
  supports_voucher_redeem: boolean;
  supports_ewallet: boolean;
  supports_namqr: boolean;
  pos_terminal_id: string | null;
  operating_hours: Record<string, string>;
  distance_km: number;
}

export interface ATMLocation {
  id: string;
  atm_code: string;
  bank_name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  region: string | null;
  is_24_hour: boolean;
  has_deposit: boolean;
  has_cash_out: boolean;
  status: 'online' | 'offline' | 'maintenance';
  distance_km: number;
}

export interface NampostOffice {
  id: string;
  branch_code: string;
  branch_name: string;
  latitude: number;
  longitude: number;
  address: string;
  region: string;
  phone: string | null;
  operating_hours: Record<string, string>;
  services: string[];
  distance_km?: number;
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: Location.PermissionStatus;
}

interface CachedData<T> {
  data: T[];
  timestamp: number;
  query: {
    lat: number;
    lng: number;
    radius?: number;
  };
}

// ========================================
// Helper Functions
// ========================================

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await getSecureItem('buffr_access_token');
  if (!token) throw new Error('Not authenticated');
  return { Authorization: `Bearer ${token}` };
}

/**
 * Get cached data if still valid
 */
async function getCachedData<T>(cacheKey: string): Promise<T[] | null> {
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (!cached) return null;

    const parsed: CachedData<T> = JSON.parse(cached);
    const isExpired = Date.now() - parsed.timestamp > CACHE_DURATION_MS;

    if (isExpired) {
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

/**
 * Cache data for offline use
 */
async function setCachedData<T>(
  cacheKey: string,
  data: T[],
  query: { lat: number; lng: number; radius?: number }
): Promise<void> {
  try {
    const cacheData: CachedData<T> = {
      data,
      timestamp: Date.now(),
      query,
    };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error writing cache:', error);
  }
}

// ========================================
// Permission Handling
// ========================================

/**
 * Check location permission status
 */
export async function checkLocationPermission(): Promise<LocationPermissionStatus> {
  try {
    const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
    return {
      granted: status === Location.PermissionStatus.GRANTED,
      canAskAgain,
      status,
    };
  } catch (error) {
    console.error('Error checking location permission:', error);
    return {
      granted: false,
      canAskAgain: false,
      status: Location.PermissionStatus.UNDETERMINED,
    };
  }
}

/**
 * Request location permission from user
 */
export async function requestLocationPermission(): Promise<LocationPermissionStatus> {
  try {
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    return {
      granted: status === Location.PermissionStatus.GRANTED,
      canAskAgain,
      status,
    };
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return {
      granted: false,
      canAskAgain: false,
      status: Location.PermissionStatus.UNDETERMINED,
    };
  }
}

/**
 * Get user's current location
 */
export async function getCurrentLocation(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) {
      throw new Error('Location permission not granted');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
}

// ========================================
// API Functions
// ========================================

/**
 * Find nearby agents for cash-out and other services
 * 
 * @param lat - Latitude
 * @param lng - Longitude
 * @param radius - Search radius in km (not used by backend, but kept for future)
 * @param service - Service type filter ('cashout' | 'voucher' | 'ewallet' | 'namqr' | 'all')
 * @returns Array of agent locations with distance
 */
export async function findNearbyAgents(
  lat: number,
  lng: number,
  radius: number = 10,
  service: 'cashout' | 'voucher' | 'ewallet' | 'namqr' | 'all' = 'cashout'
): Promise<AgentLocation[]> {
  const cacheKey = `${CACHE_KEY_PREFIX}agents_${lat}_${lng}_${service}`;

  // Try cache first
  const cached = await getCachedData<AgentLocation>(cacheKey);
  if (cached) {
    return cached;
  }

  if (!API_BASE) {
    // Return mock data for development
    return getMockAgents(lat, lng);
  }

  try {
    const headers = await getAuthHeader();
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      service,
      limit: '10',
    });

    const res = await fetch(`${API_BASE}/api/v1/mobile/agents/nearest?${params}`, {
      headers,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    const agents = data.agents ?? [];

    // Cache for offline use
    await setCachedData(cacheKey, agents, { lat, lng, radius });

    return agents;
  } catch (error) {
    console.error('Error finding nearby agents:', error);
    
    // Return cached data if available (even if expired)
    const cached = await getCachedData<AgentLocation>(cacheKey);
    if (cached) {
      return cached;
    }

    // Return mock data as last resort
    return getMockAgents(lat, lng);
  }
}

/**
 * Find nearby ATMs
 * 
 * @param lat - Latitude
 * @param lng - Longitude
 * @param radius - Search radius in km
 * @returns Array of ATM locations with distance
 */
export async function findNearbyATMs(
  lat: number,
  lng: number,
  radius: number = 10
): Promise<ATMLocation[]> {
  const cacheKey = `${CACHE_KEY_PREFIX}atms_${lat}_${lng}`;

  // Try cache first
  const cached = await getCachedData<ATMLocation>(cacheKey);
  if (cached) {
    return cached;
  }

  if (!API_BASE) {
    return getMockATMs(lat, lng);
  }

  try {
    const headers = await getAuthHeader();
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      radius: String(radius),
      limit: '10',
    });

    const res = await fetch(`${API_BASE}/api/v1/mobile/atms/nearby?${params}`, {
      headers,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    const atms = data.atms ?? [];

    // Cache for offline use
    await setCachedData(cacheKey, atms, { lat, lng, radius });

    return atms;
  } catch (error) {
    console.error('Error finding nearby ATMs:', error);
    
    const cached = await getCachedData<ATMLocation>(cacheKey);
    if (cached) {
      return cached;
    }

    return getMockATMs(lat, lng);
  }
}

/**
 * Find Nampost offices by search query
 * 
 * @param searchQuery - Search term (branch name, region, or city)
 * @param lat - Optional latitude for distance calculation
 * @param lng - Optional longitude for distance calculation
 * @returns Array of Nampost offices
 */
export async function findNampostOffices(
  searchQuery: string,
  lat?: number,
  lng?: number
): Promise<NampostOffice[]> {
  const cacheKey = `${CACHE_KEY_PREFIX}nampost_${searchQuery.toLowerCase()}`;

  // Try cache first
  const cached = await getCachedData<NampostOffice>(cacheKey);
  if (cached) {
    return cached;
  }

  if (!API_BASE) {
    return getMockNampostOffices(searchQuery);
  }

  try {
    const headers = await getAuthHeader();
    const params = new URLSearchParams({
      search: searchQuery,
      ...(lat && { lat: String(lat) }),
      ...(lng && { lng: String(lng) }),
      limit: '10',
    });

    const res = await fetch(`${API_BASE}/api/v1/mobile/locations/nampost?${params}`, {
      headers,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    const offices = data.offices ?? [];

    // Cache for offline use
    await setCachedData(cacheKey, offices, { lat: lat ?? 0, lng: lng ?? 0 });

    return offices;
  } catch (error) {
    console.error('Error finding Nampost offices:', error);
    
    const cached = await getCachedData<NampostOffice>(cacheKey);
    if (cached) {
      return cached;
    }

    return getMockNampostOffices(searchQuery);
  }
}

// ========================================
// Mock Data for Development
// ========================================

function getMockAgents(lat: number, lng: number): AgentLocation[] {
  return [
    {
      id: 'agent-1',
      agent_code: 'WDH-001',
      agent_name: 'OK Foods Windhoek Central',
      agent_type: 'retail',
      latitude: lat + 0.01,
      longitude: lng + 0.01,
      address: '123 Independence Ave, Windhoek',
      region: 'Khomas',
      ussd_code: '*282*1#',
      supports_cashout: true,
      supports_voucher_redeem: true,
      supports_ewallet: true,
      supports_namqr: true,
      pos_terminal_id: 'POS-WDH-001',
      operating_hours: {
        'mon-fri': '08:00-18:00',
        'sat': '08:00-13:00',
        'sun': 'Closed',
      },
      distance_km: 1.2,
    },
    {
      id: 'agent-2',
      agent_code: 'WDH-NP-001',
      agent_name: 'NamPost Windhoek Main',
      agent_type: 'nampost',
      latitude: lat + 0.02,
      longitude: lng - 0.01,
      address: 'Independence Ave, Windhoek',
      region: 'Khomas',
      ussd_code: null,
      supports_cashout: true,
      supports_voucher_redeem: true,
      supports_ewallet: true,
      supports_namqr: true,
      pos_terminal_id: null,
      operating_hours: {
        'mon-fri': '08:00-17:00',
        'sat': '08:00-12:00',
        'sun': 'Closed',
      },
      distance_km: 2.5,
    },
  ];
}

function getMockATMs(lat: number, lng: number): ATMLocation[] {
  return [
    {
      id: 'atm-1',
      atm_code: 'FNB-ATM-001',
      bank_name: 'FNB Namibia',
      latitude: lat + 0.005,
      longitude: lng + 0.005,
      address: 'Maerua Mall, Windhoek',
      region: 'Khomas',
      is_24_hour: true,
      has_deposit: true,
      has_cash_out: true,
      status: 'online',
      distance_km: 0.8,
    },
    {
      id: 'atm-2',
      atm_code: 'STD-ATM-002',
      bank_name: 'Standard Bank',
      latitude: lat + 0.015,
      longitude: lng - 0.008,
      address: 'Grove Mall, Windhoek',
      region: 'Khomas',
      is_24_hour: true,
      has_deposit: false,
      has_cash_out: true,
      status: 'online',
      distance_km: 1.5,
    },
  ];
}

function getMockNampostOffices(searchQuery: string): NampostOffice[] {
  const allOffices: NampostOffice[] = [
    {
      id: 'np-1',
      branch_code: 'WDH-MAIN',
      branch_name: 'Windhoek Main Post Office',
      latitude: -22.5609,
      longitude: 17.0658,
      address: 'Independence Avenue, Windhoek',
      region: 'Khomas',
      phone: '+264 61 201 9111',
      operating_hours: {
        'mon-fri': '08:00-17:00',
        'sat': '08:00-12:00',
        'sun': 'Closed',
      },
      services: ['Mail', 'Parcel', 'E-Money', 'Bill Payments', 'Voucher Redemption'],
    },
    {
      id: 'np-2',
      branch_code: 'SWPM',
      branch_name: 'Swakopmund Post Office',
      latitude: -22.6792,
      longitude: 14.5272,
      address: 'Sam Nujoma Avenue, Swakopmund',
      region: 'Erongo',
      phone: '+264 64 405 5000',
      operating_hours: {
        'mon-fri': '08:00-17:00',
        'sat': '08:00-12:00',
        'sun': 'Closed',
      },
      services: ['Mail', 'Parcel', 'E-Money', 'Bill Payments'],
    },
  ];

  // Simple search filter
  const query = searchQuery.toLowerCase();
  return allOffices.filter(
    (office) =>
      office.branch_name.toLowerCase().includes(query) ||
      office.region.toLowerCase().includes(query) ||
      office.address.toLowerCase().includes(query)
  );
}

// ========================================
// Utility Functions
// ========================================

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Clear all location caches
 */
export async function clearLocationCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_KEY_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error('Error clearing location cache:', error);
  }
}
