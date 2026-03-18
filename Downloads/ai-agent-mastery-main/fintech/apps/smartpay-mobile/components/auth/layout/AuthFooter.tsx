/**
 * AuthFooter - Legal links, help, and additional navigation
 * Location: fintech/smartpay/components/auth/layout/AuthFooter.tsx
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinkButton } from '../buttons/LinkButton';
import { designSystem } from '@/constants/designSystem';

export interface AuthFooterProps {
  children?: React.ReactNode;
  showLegalLinks?: boolean;
  showHelp?: boolean;
  testID?: string;
}

export function AuthFooter({
  children,
  showLegalLinks = true,
  showHelp = true,
  testID = 'auth-footer',
}: AuthFooterProps) {
  return (
    <View style={styles.container} testID={testID}>
      {children}
      
      {showLegalLinks && (
        <View style={styles.legalLinks}>
          <LinkButton
            title="Terms"
            href="/terms"
            size="small"
            variant="muted"
          />
          <Text style={styles.separator}>•</Text>
          <LinkButton
            title="Privacy"
            href="/privacy"
            size="small"
            variant="muted"
          />
          {showHelp && (
            <>
              <Text style={styles.separator}>•</Text>
              <LinkButton
                title="Help"
                href="/help"
                size="small"
                variant="muted"
              />
            </>
          )}
        </View>
      )}
      
      <Text style={styles.copyright}>
        © {new Date().getFullYear()} SmartPay. All rights reserved.
      </Text>
    </View>
  );
}

const ds = designSystem;
const { colors, spacing } = ds;
const { neutral } = colors;

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: spacing.lg,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  separator: {
    fontSize: 12,
    color: neutral.textSecondary,
  },
  copyright: {
    fontSize: 12,
    color: neutral.textSecondary,
    textAlign: 'center',
  },
});

/**
 * USAGE EXAMPLES:
 * 
 * // Basic
 * <AuthFooter />
 * 
 * // Without legal links
 * <AuthFooter showLegalLinks={false} />
 * 
 * // With custom content
 * <AuthFooter>
 *   <View style={styles.linkContainer}>
 *     <Text>Don't have an account? </Text>
 *     <LinkButton title="Sign Up" href="/sign-up" />
 *   </View>
 * </AuthFooter>
 * 
 * // Complete auth screen example
 * <AuthContainer>
 *   <AuthHeader
 *     title="Sign In"
 *     subtitle="Welcome back to SmartPay"
 *   />
 *   
 *   <AuthForm>{/* fields *}</AuthForm>
 *   
 *   <AuthFooter>
 *     <View style={styles.linkContainer}>
 *       <Text>Don't have an account? </Text>
 *       <LinkButton title="Sign Up" href="/sign-up" />
 *     </View>
 *   </AuthFooter>
 * </AuthContainer>
 */
