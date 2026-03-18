/**
 * AuthContainer - Screen wrapper for auth screens
 * Location: fintech/smartpay/components/auth/layout/AuthContainer.tsx
 */
import React from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { designSystem } from '@/constants/designSystem';

export interface AuthContainerProps {
  children: React.ReactNode;
  showAccent?: boolean;
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
  style?: any;
}

export function AuthContainer({
  children,
  showAccent = true,
  scrollable = true,
  keyboardAvoiding = true,
  style,
}: AuthContainerProps) {
  const content = (
    <View style={[styles.content, style]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {showAccent && <View style={styles.accent} />}
      
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {scrollable ? (
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {content}
            </ScrollView>
          ) : (
            content
          )}
        </KeyboardAvoidingView>
      ) : scrollable ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const ds = designSystem;
const { colors, spacing } = ds;
const { brand, neutral } = colors;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: neutral.background,
  },
  accent: {
    height: 4,
    backgroundColor: brand.primary,
    width: '100%',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  content: {
    flex: 1,
    gap: spacing.lg,
  },
});

/**
 * USAGE EXAMPLES:
 * 
 * // Basic usage
 * <AuthContainer>
 *   <AuthHeader title="Sign In" />
 *   <AuthForm>{/* form fields *}</AuthForm>
 *   <AuthFooter>{/* links *}</AuthFooter>
 * </AuthContainer>
 * 
 * // Without accent bar
 * <AuthContainer showAccent={false}>
 *   {/* content *}
 * </AuthContainer>
 * 
 * // Non-scrollable
 * <AuthContainer scrollable={false}>
 *   {/* content *}
 * </AuthContainer>
 * 
 * // Without keyboard avoiding
 * <AuthContainer keyboardAvoiding={false}>
 *   {/* content *}
 * </AuthContainer>
 */
