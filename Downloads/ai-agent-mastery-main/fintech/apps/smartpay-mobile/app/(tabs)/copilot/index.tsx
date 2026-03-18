/**
 * Copilot Tab - Smartpay Agentic Copilot
 * 
 * Features from design skill:
 * - Chat UI with messages (left: bot, right: user)
 * - Input bar with send button
 * - Suggestion chips (36px pills)
 * - Transaction cards in chat bubbles
 * - Agent map cards
 * - Wallet form cards
 * - Handoff buttons: "Complete in Chat" vs "Open [Screen]"
 * 
 * Layout:
 * - AppHeader (title "Smartpay Copilot")
 * - MessagesList (FlatList inverted)
 * - SuggestionChips (below latest message)
 * - InputBar (48px height, pill)
 * 
 * Location: app/(tabs)/copilot/index.tsx
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CopilotProvider } from '@/contexts/copilot/CopilotContext';
import { CopilotChatSurface } from '@/components/copilot/CopilotChatSurface';
import { CopilotErrorState } from '@/components/copilot/CopilotErrorState';
import { AppHeader } from '@/components/layout/AppHeader';
import { useUser } from '@/contexts/UserContext';
import { useCopilotSession } from '@/hooks/useCopilotSession';
import { designSystem as DS } from '@/constants/designSystem';
import { router } from 'expo-router';

const ds = designSystem;

function CopilotScreenContent() {
  const { profile } = useUser();
  const { sessionData, isSessionReady, initializeSession, refreshWallets } = useCopilotSession();
  const firstName = profile?.firstName ?? '';

  useEffect(() => {
    if (profile?.id && !sessionData.sessionStarted) {
      initializeSession();
    }
  }, [profile?.id, sessionData.sessionStarted, initializeSession]);

  // Show loading state while session is initializing
  if (sessionData.isLoading && !sessionData.sessionStarted) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ds.colors.brand} />
          <Text style={styles.loadingText}>Initializing copilot session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state if session initialization failed
  if (sessionData.error && !sessionData.sessionStarted) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <CopilotErrorState
          title="Session Error"
          message={sessionData.error}
          onRetry={initializeSession}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader
        title="Smartpay Copilot"
        showSearch={false}
        onNotificationPress={() => router.push('/notifications' as any)}
        onAvatarPress={() => router.push('/(tabs)/profile')}
        avatarInitials={
          (profile?.firstName?.[0]?.toUpperCase() || '') +
          (profile?.lastName?.[0]?.toUpperCase() || '')
        }
      />
      <CopilotChatSurface />
    </SafeAreaView>
  );
}

export default function CopilotScreen() {
  return (
    <CopilotProvider>
      <CopilotScreenContent />
    </CopilotProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.colors.background },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DS.spacing.xl,
  },
  loadingText: {
    ...ds.typography.textStyles.body,
    color: ds.colors.textSecondary,
    marginTop: ds.spacing.md,
  },
});
