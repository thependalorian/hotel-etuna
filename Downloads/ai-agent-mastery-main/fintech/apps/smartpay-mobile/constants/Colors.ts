/**
 * Colors – Smartpay.
 * Re-exports and flat view of designSystem.colors for auth, headers, tab bar, Themed.
 * Single source of truth: constants/designSystem.ts (no duplicate hex values).
 * Location: fintech/smartpay/constants/Colors.ts
 */
import { designSystem } from '@/constants/designSystem';

const c = designSystem.colors;

export default {
  primary: c.brand.primary,
  primaryMuted: c.brand.primaryMuted,
  background: c.neutral.background,
  ink: c.neutral.text,
  gray: c.neutral.textSecondary,
  lightGray: c.neutral.border,
  light: c.theme.light,
  dark: c.theme.dark,
};
