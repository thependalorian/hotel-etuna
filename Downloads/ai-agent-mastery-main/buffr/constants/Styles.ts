/**
 * Reusable Stylesheet for Buffr App
 * 
 * Location: constants/Styles.ts
 * Purpose: Centralized styling system for consistent UI throughout the app
 * Usage: Import defaultStyles and use in components
 * 
 * Based on design patterns from Buffr App Design assets
 */
import { StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

export const defaultStyles = StyleSheet.create({
  // Container Styles
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  containerFull: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  containerCentered: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  containerWithPadding: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  // Text Styles
  header: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.text,
  },
  headerLarge: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
  },
  headerMedium: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
  },
  headerSmall: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  bodyText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  bodyTextSecondary: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  descriptionText: {
    fontSize: 18,
    marginTop: 20,
    color: Colors.textSecondary,
    lineHeight: 26,
  },
  textLink: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '500',
  },
  textLinkSmall: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    margin: 20,
    marginBottom: 10,
    color: Colors.text,
  },
  caption: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 8,
  },

  // Button Styles
  pillButton: {
    padding: 10,
    height: 60,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  pillButtonSecondary: {
    padding: 10,
    height: 60,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundGray,
  },
  pillButtonSmall: {
    paddingHorizontal: 20,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '500',
  },
  buttonTextSecondary: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '500',
  },
  buttonTextSmall: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  buttonOutline: {
    padding: 10,
    height: 60,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  buttonOutlineText: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '500',
  },

  // Card & Block Styles
  block: {
    marginHorizontal: 20,
    padding: 14,
    backgroundColor: Colors.white,
    borderRadius: 16,
    gap: 20,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: Colors.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardFlat: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },

  // Input Styles
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.white,
  },
  inputFocused: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: Colors.error,
  },

  // Divider Styles
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  dividerThick: {
    height: 2,
    backgroundColor: Colors.lightGray,
    marginVertical: 20,
  },

  // Badge & Tag Styles
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.primaryMuted,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
  },
  badgeSuccess: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.success + '20',
    alignSelf: 'flex-start',
  },
  badgeSuccessText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.success,
  },
  badgeError: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.error + '20',
    alignSelf: 'flex-start',
  },
  badgeErrorText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.error,
  },

  // Spacing Utilities
  marginTopSmall: {
    marginTop: 8,
  },
  marginTopMedium: {
    marginTop: 16,
  },
  marginTopLarge: {
    marginTop: 24,
  },
  marginBottomSmall: {
    marginBottom: 8,
  },
  marginBottomMedium: {
    marginBottom: 16,
  },
  marginBottomLarge: {
    marginBottom: 24,
  },
  paddingSmall: {
    padding: 8,
  },
  paddingMedium: {
    padding: 16,
  },
  paddingLarge: {
    padding: 24,
  },

  // Layout Utilities
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowSpaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowCenter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});