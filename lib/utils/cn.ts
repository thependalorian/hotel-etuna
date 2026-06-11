/**
 * @fileoverview Tailwind class-name merge helper (clsx + tailwind-merge).
 * Location: lib/utils/cn.ts
 */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge conditional class names, resolving Tailwind conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
