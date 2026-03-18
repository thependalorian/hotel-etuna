/**
 * defaultStyles – Smartpay.
 * Base layout and text styles for auth and full-screen forms. Uses designSystem via Colors.
 * Location: fintech/smartpay/constants/Styles.ts
 */
import { StyleSheet } from 'react-native';
import Colors from '@/constants/Colors'; // derived from designSystem

export const defaultStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  header: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.ink,
  },
  pillButton: {
    padding: 10,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textLink: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 16,
    marginTop: 12,
    color: Colors.gray,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pillButtonSmall: {
    paddingHorizontal: 20,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonTextSmall: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginVertical: 12,
    color: Colors.ink,
  },
  block: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
});
