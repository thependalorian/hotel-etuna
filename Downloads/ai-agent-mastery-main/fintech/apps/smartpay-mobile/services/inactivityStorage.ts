/**
 * inactivityStorage – Smartpay.
 * Stores inactivity timestamp for app lock (PRD §4.7.2). Uses MMKV when native
 * module is available (dev build), falls back to expo-secure-store in Expo Go.
 * Location: fintech/smartpay/services/inactivityStorage.ts
 */
import * as SecureStore from 'expo-secure-store';

const INACTIVITY_KEY = 'smartpay_inactivity_startTime';

let mmkv: import('react-native-mmkv').MMKV | null = null;
let useFallback = false;

function getMmkv(): import('react-native-mmkv').MMKV | null {
  if (useFallback) return null;
  if (mmkv) return mmkv;
  try {
    const { MMKV } = require('react-native-mmkv');
    mmkv = new MMKV({ id: 'smartpay-inactivity' });
    return mmkv;
  } catch {
    useFallback = true;
    return null;
  }
}

export async function getInactivityTime(): Promise<number | undefined> {
  const m = getMmkv();
  if (m) {
    const v = m.getNumber(INACTIVITY_KEY);
    return v ?? undefined;
  }
  try {
    const raw = await SecureStore.getItemAsync(INACTIVITY_KEY);
    if (raw == null) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  } catch {
    return undefined;
  }
}

export async function setInactivityTime(value: number): Promise<void> {
  const m = getMmkv();
  if (m) {
    m.set(INACTIVITY_KEY, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(INACTIVITY_KEY, String(value));
  } catch (e) {
    console.warn('inactivityStorage setInactivityTime failed:', e);
  }
}

export async function clearInactivityTime(): Promise<void> {
  const m = getMmkv();
  if (m) {
    m.delete(INACTIVITY_KEY);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(INACTIVITY_KEY);
  } catch {}
}
