import * as SecureStore from 'expo-secure-store';

export const KEY_ONBOARDING_DONE = 'onboarding_done';
export const KEY_AUTH_TOKEN = 'auth_token';
export const KEY_USER_ID = 'user_id';

/** Key used for Supabase access_token in secure storage. */
export function getAccessTokenKey(): string {
  return KEY_AUTH_TOKEN;
}

export async function getSecureItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`Error getting secure item ${key}:`, error);
    return null;
  }
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error(`Error setting secure item ${key}:`, error);
  }
}

export async function deleteSecureItem(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error(`Error deleting secure item ${key}:`, error);
  }
}

// Backward compatibility alias
export const removeSecureItem = deleteSecureItem;
