/**
 * Shared auth screen styles – single source for sign-in/sign-up layout (DRY).
 * Location: fintech/smartpay/constants/authScreenStyles.ts
 */
import { StyleSheet } from 'react-native';
import { designSystem } from './designSystem';

const { spacing, radius, typography, shadows, colors } = designSystem;
const { brand, neutral } = colors;

export const authScreenStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: neutral.background },
  accent: { height: 4, backgroundColor: brand.primary, width: '100%' },
  keyboardView: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  backLink: { alignSelf: 'flex-start', paddingVertical: spacing.sm, paddingRight: spacing.md, marginBottom: spacing.sm },
  backLinkText: { fontSize: 15, color: brand.primary, fontWeight: '600' },
  title: { ...typography.textStyles.largeTitle, color: neutral.text, marginBottom: spacing.sm },
  subtitle: { fontSize: 16, lineHeight: 24, color: neutral.textSecondary, marginBottom: spacing.lg },
  label: { fontWeight: '600', fontSize: 14, color: neutral.text, marginBottom: spacing.sm },
  input: {
    borderWidth: 1.5,
    borderColor: neutral.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    backgroundColor: neutral.surface,
    color: neutral.text,
    ...shadows.sm,
  },
  button: {
    backgroundColor: brand.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadows.md,
    shadowColor: brand.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  buttonPressed: { opacity: 0.9 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  secondaryButton: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.md, alignItems: 'center', marginTop: spacing.sm },
  secondaryButtonText: { color: brand.primary, fontWeight: '600', fontSize: 16 },
  linkContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg, flexWrap: 'wrap' as const },
  linkText: { fontSize: 14, color: neutral.textSecondary },
  link: { fontSize: 14, color: brand.primary, fontWeight: '600' },
  error: { color: colors.error, fontSize: 12, marginTop: -spacing.sm },
  toggleRow: { flexDirection: 'row', marginBottom: spacing.md, backgroundColor: neutral.surface, borderRadius: radius.lg, padding: 2 },
  toggleOption: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  toggleOptionActive: { backgroundColor: brand.primary },
  toggleOptionText: { fontSize: 14, color: neutral.textSecondary, fontWeight: '500' },
  toggleOptionTextActive: { color: '#fff', fontWeight: '600' },
});
