/**
 * MMKV-backed storage for Zustand persist middleware.
 * Falls back to in-memory storage in Expo Go (MMKV native module not available).
 * Location: fintech/smartpay/store/mmkv-storage.ts
 */
import type { StateStorage } from 'zustand/middleware';

let storage: { getString: (k: string) => string | undefined; set: (k: string, v: string) => void; delete: (k: string) => void } | null = null;

function getStorage() {
  if (storage) return storage;
  try {
    const { MMKV } = require('react-native-mmkv');
    storage = new MMKV({ id: 'smartpay-storage' });
    return storage;
  } catch {
    const memory: Record<string, string> = {};
    storage = {
      getString: (k: string) => memory[k],
      set: (k: string, v: string) => { memory[k] = v; },
      delete: (k: string) => { delete memory[k]; },
    };
    return storage;
  }
}

export const zustandStorage: StateStorage = {
  getItem: (name: string) => getStorage().getString(name) ?? null,
  setItem: (name: string, value: string) => getStorage().set(name, value),
  removeItem: (name: string) => getStorage().delete(name),
};
