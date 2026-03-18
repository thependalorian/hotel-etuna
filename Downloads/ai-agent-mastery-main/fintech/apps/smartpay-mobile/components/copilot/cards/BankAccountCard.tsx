/**
 * BankAccountCard – Smartpay Agentic Copilot OBS Integration.
 * Displays linked bank accounts from OBS AIS with account details.
 * Location: fintech/smartpay/components/copilot/cards/BankAccountCard.tsx
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseCard, type BaseCardAction } from './BaseCard';
import { designSystem } from '@/constants/designSystem';

const ds = designSystem;

export interface BankAccount {
  /** Account ID from Data Provider */
  accountId: string;
  /** Account holder name */
  accountName: string;
  /** Account type (Current, Savings, etc.) */
  accountType: string;
  /** Account number (masked for security) */
  accountNumber: string;
  /** Currency code (NAD) */
  currency: string;
  /** Bank/Data Provider name */
  institutionName: string;
  /** Account status (active, closed) */
  status?: string;
}

export interface BankAccountCardProps {
  /** Array of bank accounts to display */
  accounts: BankAccount[];
  /** Consent ID for this account link */
  consentId: string;
  /** Callback to view account balances */
  onViewBalances?: (consentId: string, accountIds: string[]) => void;
  /** Callback to view transactions for specific account */
  onViewTransactions?: (consentId: string, accountId: string) => void;
  /** Callback to initiate payment from account */
  onInitiatePayment?: (consentId: string, accountId: string) => void;
  /** Test ID for automated testing */
  testID?: string;
}

/**
 * BankAccountCard component - Displays linked bank accounts from OBS AIS.
 * Shows account details with actions for viewing balances, transactions, and payments.
 * 
 * @example
 * ```tsx
 * <BankAccountCard 
 *   accounts={linkedAccounts}
 *   consentId="consent-123"
 *   onViewBalances={(cId, accIds) => handleViewBalances(cId, accIds)}
 *   onViewTransactions={(cId, accId) => handleViewTransactions(cId, accId)}
 * />
 * ```
 */
export function BankAccountCard({
  accounts,
  consentId,
  onViewBalances,
  onViewTransactions,
  onInitiatePayment,
  testID = 'bank-account-card',
}: BankAccountCardProps) {
  const actions: BaseCardAction[] = [];

  if (onViewBalances && accounts.length > 0) {
    actions.push({
      id: 'view-balances',
      label: 'View Balances',
      onPress: () => onViewBalances(consentId, accounts.map(a => a.accountId)),
      variant: 'primary',
    });
  }

  const activeAccounts = accounts.filter(a => a.status !== 'closed');
  const subtitle = activeAccounts.length === 1 
    ? `${activeAccounts[0].institutionName} - ${activeAccounts.length} account linked`
    : `${activeAccounts[0]?.institutionName ?? 'Bank'} - ${activeAccounts.length} accounts linked`;

  return (
    <BaseCard
      title="Linked Bank Accounts"
      subtitle={subtitle}
      actions={actions}
      variant="info"
      testID={testID}
    >
      <View style={styles.accountsContainer}>
        {accounts.map((account, index) => (
          <View 
            key={account.accountId} 
            style={[
              styles.accountRow,
              index < accounts.length - 1 && styles.accountRowBorder
            ]}
          >
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{account.accountName}</Text>
              <Text style={styles.accountType}>{account.accountType}</Text>
              <Text style={styles.accountNumber}>
                {maskAccountNumber(account.accountNumber)}
              </Text>
            </View>
            
            <View style={styles.accountActions}>
              {onViewTransactions && account.status === 'active' && (
                <Text 
                  style={styles.actionLink}
                  onPress={() => onViewTransactions(consentId, account.accountId)}
                >
                  Transactions
                </Text>
              )}
              {onInitiatePayment && account.status === 'active' && (
                <Text 
                  style={styles.actionLink}
                  onPress={() => onInitiatePayment(consentId, account.accountId)}
                >
                  Pay
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
      
      <View style={styles.obsNotice}>
        <Text style={styles.obsNoticeText}>
          🔒 Bank accounts linked via Open Banking Services (OBS). Your credentials are never stored.
        </Text>
      </View>
    </BaseCard>
  );
}

/**
 * Mask account number for security (show last 4 digits only).
 */
function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber;
  const lastFour = accountNumber.slice(-4);
  return `•••• ${lastFour}`;
}

const styles = StyleSheet.create({
  accountsContainer: {
    marginVertical: ds.spacing.sm,
  },
  accountRow: {
    paddingVertical: ds.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  accountRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral.border,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  accountType: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.textSecondary,
    marginBottom: 2,
  },
  accountNumber: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textTertiary,
    fontFamily: 'monospace',
  },
  accountActions: {
    flexDirection: 'row',
    gap: ds.spacing.sm,
    alignItems: 'center',
  },
  actionLink: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.brand.primary,
    fontWeight: '600',
  },
  obsNotice: {
    marginTop: ds.spacing.sm,
    padding: ds.spacing.sm,
    backgroundColor: ds.colors.neutral.muted,
    borderRadius: ds.radius.sm,
  },
  obsNoticeText: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
  },
});
