/**
 * Slugify helper
 *
 * Purpose: Create URL-safe slugs from labels like room names.
 * Location: /lib/utils/slugify.ts
 */
export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
