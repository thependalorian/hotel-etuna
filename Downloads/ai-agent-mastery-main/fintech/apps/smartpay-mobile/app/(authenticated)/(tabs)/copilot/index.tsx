/**
 * Copilot tab – Smartpay Agentic Copilot (authenticated).
 * Location: fintech/smartpay/app/(authenticated)/(tabs)/copilot/index.tsx
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CopilotProvider } from '@/contexts/copilot/CopilotContext';
import { CopilotChatSurface } from '@/components/copilot/CopilotChatSurface';
import { useUser } from '@/contexts/UserContext';
import { designSystem } from '@/constants/designSystem';
import { BalanceStrip } from '@/components/BalanceStrip';
import { SmartpayLogo } from '@/components/SmartpayLogo';

const ds = designSystem;

function CopilotScreenContent() {
  const { profile } = useUser();
  const firstName = profile?.firstName ?? '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <SmartpayLogo size={44} useBrandColor />
          <View style={styles.greetingBlock}>
            <Text style={styles.greeting}>Hi{firstName ? `, ${firstName}` : ''} 👋</Text>
            <Text style={styles.subtitle}>How can I help you today?</Text>
            <View style={styles.balanceWrap}><BalanceStrip /></View>
          </View>
        </View>
      </View>
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
  safe: { flex: 1, backgroundColor: ds.colors.neutral.background },
  header: { paddingHorizontal: ds.spacing.md, paddingTop: ds.spacing.sm, paddingBottom: ds.spacing.sm, borderBottomWidth: 1, borderBottomColor: ds.colors.neutral.border, backgroundColor: ds.colors.neutral.surface },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: ds.spacing.md },
  greetingBlock: { flex: 1 },
  greeting: { ...ds.typography.textStyles.h2, color: ds.colors.neutral.text },
  subtitle: { ...ds.typography.textStyles.bodySmall, color: ds.colors.neutral.textSecondary, marginTop: 2 },
  balanceWrap: { marginTop: ds.spacing.sm },
});
