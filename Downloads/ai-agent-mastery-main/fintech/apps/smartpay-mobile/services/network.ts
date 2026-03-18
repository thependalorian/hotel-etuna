/**
 * Network utilities for SmartPay.
 * Provides API reachability checks and configuration.
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

/**
 * Get the configured API base URL.
 * Returns empty string if no API is configured.
 */
export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

/**
 * Check if the API is reachable.
 * Returns true if API responds, false otherwise.
 */
export async function checkApiReachable(): Promise<boolean> {
  if (!API_BASE_URL) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_BASE_URL}/api/v1/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn('API reachability check failed:', error);
    return false;
  }
}

/**
 * Get network status information.
 */
export async function getNetworkStatus(): Promise<{
  isReachable: boolean;
  hasApiConfigured: boolean;
  apiUrl: string;
}> {
  const hasApiConfigured = !!API_BASE_URL;
  const isReachable = hasApiConfigured ? await checkApiReachable() : false;

  return {
    isReachable,
    hasApiConfigured,
    apiUrl: API_BASE_URL,
  };
}
