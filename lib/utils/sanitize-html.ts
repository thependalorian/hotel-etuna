/**
 * sanitize-html — DOMPurify wrapper for user/CMS HTML before render or email.
 * Location: lib/utils/sanitize-html.ts
 */

import DOMPurify from 'isomorphic-dompurify';

const DEFAULT_ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  'h1',
  'h2',
  'h3',
  'h4',
  'ul',
  'ol',
  'li',
  'a',
  'img',
  'blockquote',
  'span',
] as const;

/** Strip scripts and dangerous markup; safe for dangerouslySetInnerHTML after this. */
export function sanitizeHtml(
  dirty: string,
  options?: { allowedTags?: string[] }
): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: options?.allowedTags ?? [...DEFAULT_ALLOWED_TAGS],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
}
