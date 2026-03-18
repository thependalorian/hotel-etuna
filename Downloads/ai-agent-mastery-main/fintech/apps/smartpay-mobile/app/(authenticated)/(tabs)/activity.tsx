/**
 * Activity tab – Recent transactions from backend API + Copilot CTA.
 * Location: fintech/smartpay/mobile/app/(authenticated)/(tabs)/activity.tsx
 */
import React from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { designSystem } from '@/constants/designSystem';
import { getTransactions, type Transaction } from '@/services/transactions';

const ds = designSystem;

function formatTxnDate(iso: string | Date | undefined): string {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatAmount(amount: number): string {
  const sign = amount >= 0 ? '+' : '−';
  return `${sign}N$${Math.abs(amount).toLocaleString('en-NA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ActivityScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      setLoading(true);
      getTransactions({ limit: 50 })
        .then((list) => { if (!cancelled) setTransactions(list); })
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <Text style={styles.title}>Recent activity</Text>
        <Text style={styles.subtitle}>Transactions from your wallet and Copilot.</Text>

        {loading ? (
          <View style={styles.listCard}>
            <Text style={styles.txnEmpty}>Loading…</Text>
          </View>
        ) : transactions.length > 0 ? (
          <View style={styles.listCard}>
            {transactions.map((tx, idx) => (
              <View key={tx.id} style={[styles.txnRow, idx === transactions.length - 1 && styles.txnRowLast]}>
                <View style={styles.txnIcon}>
                  <Text style={styles.txnIconText}>{tx.amount >= 0 ? '↓' : '↑'}</Text>
                </View>
                <View style={styles.txnBody}>
                  <Text style={styles.txnTitle}>{tx.description}</Text>
                  <Text style={styles.txnDate}>{formatTxnDate(tx.timestamp)}</Text>
                </View>
                <Text style={[styles.txnAmount, tx.amount < 0 && styles.txnAmountNeg]}>{formatAmount(tx.amount)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.iconWrap}><Text style={styles.icon}>💬</Text></View>
          <Text style={styles.cardTitle}>Ask the Copilot</Text>
          <Text style={styles.cardBody}>"What did I spend last month?" or "Show my last grant payment."</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/(authenticated)/(tabs)/copilot')} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Open Copilot</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ds.colors.neutral.background },
  scroll: { flex: 1 },
  container: { paddingHorizontal: ds.spacing.lg, paddingTop: ds.spacing.lg, paddingBottom: ds.spacing.xxl },
  title: { ...ds.typography.textStyles.h1, color: ds.colors.neutral.text, marginBottom: ds.spacing.xs },
  subtitle: { ...ds.typography.textStyles.bodySmall, color: ds.colors.neutral.textSecondary, marginBottom: ds.spacing.xl },
  listCard: {
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.lg,
    padding: ds.spacing.md,
    marginBottom: ds.spacing.lg,
    borderWidth: 1,
    borderColor: ds.colors.neutral.border,
    ...ds.shadows.sm,
  },
  txnRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: ds.spacing.sm, borderBottomWidth: 1, borderBottomColor: ds.colors.neutral.border },
  txnRowLast: { borderBottomWidth: 0 },
  txnIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: ds.colors.neutral.muted, alignItems: 'center', justifyContent: 'center', marginRight: ds.spacing.md },
  txnIconText: { fontSize: 18, fontWeight: '700', color: ds.colors.neutral.textSecondary },
  txnBody: { flex: 1 },
  txnTitle: { ...ds.typography.textStyles.bodySmall, color: ds.colors.neutral.text, fontWeight: '600' },
  txnDate: { ...ds.typography.textStyles.caption, color: ds.colors.neutral.textSecondary, marginTop: 2 },
  txnAmount: { ...ds.typography.textStyles.bodySmall, color: ds.colors.success, fontWeight: '600' },
  txnAmountNeg: { color: ds.colors.neutral.text },
  txnEmpty: { ...ds.typography.textStyles.caption, color: ds.colors.neutral.textSecondary, fontStyle: 'italic', paddingVertical: ds.spacing.md, textAlign: 'center' },
  card: { padding: ds.spacing.lg, borderRadius: ds.radius.lg, borderWidth: 1, borderColor: ds.colors.neutral.border, backgroundColor: ds.colors.neutral.surface, ...ds.shadows.sm },
  iconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: ds.colors.brand.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: ds.spacing.md },
  icon: { fontSize: 24 },
  cardTitle: { ...ds.typography.textStyles.h3, color: ds.colors.neutral.text, marginBottom: ds.spacing.sm },
  cardBody: { ...ds.typography.textStyles.bodySmall, color: ds.colors.neutral.textSecondary, marginBottom: ds.spacing.lg, fontStyle: 'italic' },
  button: { alignSelf: 'flex-start', paddingVertical: 12, paddingHorizontal: ds.spacing.lg, borderRadius: ds.radius.md, backgroundColor: ds.colors.brand.primary, ...ds.shadows.sm },
  buttonText: { ...ds.typography.textStyles.button, color: '#fff' },
});
