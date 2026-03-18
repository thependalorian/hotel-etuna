/**
 * OAuth Callback - Handle bank OAuth redirect
 * 
 * Processes OAuth callback from bank authorization
 * Exchanges authorization code for tokens
 * 
 * Flow:
 * 1. Parse callback URL
 * 2. Exchange code for tokens
 * 3. Fetch linked accounts
 * 4. Navigate to success/error
 * 
 * Location: app/(authenticated)/banking/oauth-callback.tsx
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { designSystem as DS } from '@/constants/designSystem';
import { handleOAuthCallback } from '@/services/openBanking';

export default function OAuthCallbackScreen() {
  const params = useLocalSearchParams<{ url?: string }>();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Connecting to your bank...');

  useEffect(() => {
    processCallback();
  }, []);

  const processCallback = async () => {
    try {
      const url = params.url;
      
      if (!url) {
        setStatus('error');
        setMessage('Invalid callback URL');
        setTimeout(() => router.back(), 2000);
        return;
      }

      setMessage('Exchanging authorization code...');

      const result = await handleOAuthCallback(url);

      if (result.success) {
        setStatus('success');
        setMessage('Bank account linked successfully!');

        setTimeout(() => {
          router.replace('/banking/linked-accounts');
        }, 1500);
      } else {
        setStatus('error');
        setMessage(result.error || 'Failed to link bank account');
        setTimeout(() => router.back(), 3000);
      }
    } catch (error) {
      console.error('processCallback error:', error);
      setStatus('error');
      setMessage('An unexpected error occurred');
      setTimeout(() => router.back(), 3000);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {status === 'processing' && (
          <>
            <ActivityIndicator size="large" color={DS.colors.brand.primary} />
            <Text style={styles.message}>{message}</Text>
            <Text style={styles.submessage}>This may take a few seconds</Text>
          </>
        )}

        {status === 'success' && (
          <>
            <View style={styles.iconContainer}>
              <Ionicons
                name="checkmark-circle"
                size={64}
                color={DS.colors.semantic.success}
              />
            </View>
            <Text style={styles.successMessage}>{message}</Text>
          </>
        )}

        {status === 'error' && (
          <>
            <View style={styles.iconContainer}>
              <Ionicons
                name="close-circle"
                size={64}
                color={DS.colors.semantic.error}
              />
            </View>
            <Text style={styles.errorMessage}>{message}</Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: DS.spacing.xl,
  },
  iconContainer: {
    marginBottom: DS.spacing.lg,
  },
  message: {
    fontSize: DS.typography.fontSize.lg,
    fontWeight: DS.typography.fontWeight.medium,
    color: DS.colors.text,
    textAlign: 'center',
    marginTop: DS.spacing.lg,
  },
  submessage: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
    textAlign: 'center',
    marginTop: DS.spacing.sm,
  },
  successMessage: {
    fontSize: DS.typography.fontSize.xl,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.semantic.success,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: DS.typography.fontSize.lg,
    fontWeight: DS.typography.fontWeight.medium,
    color: DS.colors.semantic.error,
    textAlign: 'center',
  },
});
