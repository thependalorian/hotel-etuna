/**
 * OBS Copilot Handlers - Example orchestration of OBS tools
 * Location: fintech/smartpay/services/copilot/obsHandlers.ts
 * 
 * Demonstrates how to orchestrate multiple OBS tools to handle complex
 * user requests in the copilot interface.
 * 
 * These are example handlers showing best practices for:
 * - Error handling
 * - Tool chaining
 * - State management
 * - User feedback
 * - Card component integration
 */

import { copilotTools } from '../copilotTools';
import type {
  BankAccount,
  AccountBalance,
  BankTransaction,
  PaymentInitiationDetails,
} from '@/components/copilot/cards';

/**
 * Handler: Link Bank Account
 * 
 * Orchestrates the complete flow for linking a bank account:
 * 1. List available banks
 * 2. Initiate consent
 * 3. Show consent screen
 * 4. Redirect to bank
 * 5. Handle callback
 * 6. Fetch and display accounts
 * 
 * @example
 * User: "Link my FNB bank account"
 * → Initiates consent flow
 * → Shows OBSConsentScreen
 * → Redirects to bank
 * → Returns with BankAccountCard
 */
export async function handleLinkBankAccount(bankName?: string) {
  try {
    // Step 1: Get available banks
    const providersResult = await copilotTools.list_obs_data_providers.handler();
    const providers = providersResult.providers;

    // Step 2: Find matching bank or ask user to select
    let selectedProvider = providers[0];
    
    if (bankName) {
      const match = providers.find(
        (p: any) => p.name.toLowerCase().includes(bankName.toLowerCase())
      );
      if (match) {
        selectedProvider = match;
      }
    }

    if (!selectedProvider) {
      return {
        error: 'Bank not found',
        message: `Available banks: ${providers.map((p: any) => p.name).join(', ')}`,
        suggestions: providers.map((p: any) => `Link my ${p.name} account`),
      };
    }

    // Step 3: Initiate AIS consent
    const consentResult = await copilotTools.initiate_obs_consent.handler({
      dataProviderId: selectedProvider.id,
      purpose: 'ais',
      scopes: ['banking:accounts.basic.read'],
    });

    // Step 4: Return consent details for UI to show OBSConsentScreen
    return {
      action: 'show_consent_screen',
      consentId: consentResult.consentId,
      authorizationUrl: consentResult.authorizationUrl,
      provider: selectedProvider,
      message: consentResult.message,
    };
  } catch (error) {
    console.error('Error linking bank account:', error);
    return {
      error: 'Failed to link bank account',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Handler: Show Bank Balance
 * 
 * Fetches and displays bank account balances:
 * 1. Check for active AIS consent
 * 2. Get linked accounts
 * 3. Fetch balances for all accounts
 * 4. Return data for BankBalanceCard
 * 
 * @example
 * User: "What's my bank balance?"
 * → Returns BankBalanceCard with all account balances
 */
export async function handleShowBankBalance() {
  try {
    // Step 1: Check for active AIS consent
    const consentsResult = await copilotTools.list_obs_consents.handler();
    const activeAISConsent = consentsResult.consents.find(
      (c: any) => c.status === 'active' && c.purpose === 'ais'
    );

    if (!activeAISConsent) {
      return {
        error: 'No bank linked',
        message: 'You need to link a bank account first. Would you like to do that now?',
        suggestions: ['Link my bank account', 'Link FNB', 'Link Bank Windhoek'],
      };
    }

    // Step 2: Get linked accounts
    const accountsResult = await copilotTools.ais_get_accounts.handler({
      consentId: activeAISConsent.id,
    });

    if (!accountsResult.accounts || accountsResult.accounts.length === 0) {
      return {
        error: 'No accounts found',
        message: 'No bank accounts found for this consent.',
      };
    }

    // Step 3: Get balances for all accounts
    const accountIds = accountsResult.accounts.map((acc: any) => acc.accountId);
    const balancesResult = await copilotTools.ais_get_balances.handler({
      consentId: activeAISConsent.id,
      accountIds,
    });

    // Step 4: Return data for BankBalanceCard
    return {
      action: 'show_bank_balances',
      balances: balancesResult.balances as AccountBalance[],
      institutionName: accountsResult.accounts[0]?.institutionName ?? 'Bank',
      consentId: activeAISConsent.id,
      message: `Showing balances for ${balancesResult.balances.length} account${balancesResult.balances.length === 1 ? '' : 's'}`,
    };
  } catch (error) {
    console.error('Error fetching bank balance:', error);
    return {
      error: 'Failed to fetch balance',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Handler: Show Transaction History
 * 
 * Fetches and displays bank transaction history:
 * 1. Check for active AIS consent
 * 2. Get account (or let user select)
 * 3. Fetch recent transactions
 * 4. Return data for BankTransactionCard
 * 
 * @example
 * User: "Show my recent bank transactions"
 * → Returns BankTransactionCard with last 30 days of transactions
 */
export async function handleShowTransactions(accountName?: string, days: number = 30) {
  try {
    // Step 1: Check for active AIS consent
    const consentsResult = await copilotTools.list_obs_consents.handler();
    const activeAISConsent = consentsResult.consents.find(
      (c: any) => c.status === 'active' && c.purpose === 'ais'
    );

    if (!activeAISConsent) {
      return {
        error: 'No bank linked',
        message: 'You need to link a bank account first.',
        suggestions: ['Link my bank account'],
      };
    }

    // Step 2: Get accounts
    const accountsResult = await copilotTools.ais_get_accounts.handler({
      consentId: activeAISConsent.id,
    });

    if (!accountsResult.accounts || accountsResult.accounts.length === 0) {
      return {
        error: 'No accounts found',
        message: 'No bank accounts found.',
      };
    }

    // Find matching account or use first one
    let selectedAccount = accountsResult.accounts[0];
    if (accountName) {
      const match = accountsResult.accounts.find((acc: any) =>
        acc.accountName.toLowerCase().includes(accountName.toLowerCase())
      );
      if (match) selectedAccount = match;
    }

    // Step 3: Fetch transactions
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const toDate = new Date();

    const transactionsResult = await copilotTools.ais_get_transactions.handler({
      consentId: activeAISConsent.id,
      accountId: selectedAccount.accountId,
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
      limit: 20,
    });

    // Step 4: Return data for BankTransactionCard
    return {
      action: 'show_transactions',
      transactions: transactionsResult.transactions as BankTransaction[],
      accountName: selectedAccount.accountName,
      accountId: selectedAccount.accountId,
      dateRange: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
      message: `Showing ${transactionsResult.transactions.length} transaction${transactionsResult.transactions.length === 1 ? '' : 's'} from ${selectedAccount.accountName}`,
    };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return {
      error: 'Failed to fetch transactions',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Handler: Initiate Bank Payment
 * 
 * Orchestrates PISP payment flow:
 * 1. Check for active PISP consent
 * 2. Get debtor account
 * 3. Validate payment details
 * 4. Initiate payment
 * 5. Return data for PaymentInitiationCard
 * 6. Redirect to bank for SCA
 * 
 * @example
 * User: "Pay N$500 to John Doe from my FNB account"
 * → Returns PaymentInitiationCard
 * → Redirects to bank for SCA
 * → Polls for status updates
 */
export async function handleInitiateBankPayment(params: {
  amount: number;
  beneficiaryName: string;
  beneficiaryAccount: string;
  note?: string;
  accountName?: string;
}) {
  try {
    // Step 1: Validate amount
    if (params.amount <= 0) {
      return {
        error: 'Invalid amount',
        message: 'Payment amount must be greater than zero.',
      };
    }

    // Step 2: Check for active PISP consent
    const consentsResult = await copilotTools.list_obs_consents.handler();
    const activePISPConsent = consentsResult.consents.find(
      (c: any) => c.status === 'active' && c.purpose === 'pis'
    );

    if (!activePISPConsent) {
      return {
        error: 'No payment consent',
        message: 'You need to link your bank for payments first. Would you like to do that now?',
        suggestions: ['Enable bank payments', 'Link bank for payments'],
      };
    }

    // Step 3: Get accounts
    const accountsResult = await copilotTools.ais_get_accounts.handler({
      consentId: activePISPConsent.id,
    });

    if (!accountsResult.accounts || accountsResult.accounts.length === 0) {
      return {
        error: 'No accounts found',
        message: 'No bank accounts available for payment.',
      };
    }

    // Find matching account or use first one
    let debtorAccount = accountsResult.accounts[0];
    if (params.accountName) {
      const match = accountsResult.accounts.find((acc: any) =>
        acc.accountName.toLowerCase().includes(params.accountName!.toLowerCase())
      );
      if (match) debtorAccount = match;
    }

    // Step 4: Initiate payment
    const paymentResult = await copilotTools.pisp_initiate_payment.handler({
      consentId: activePISPConsent.id,
      debtorAccountId: debtorAccount.accountId,
      amount: params.amount,
      currency: 'NAD',
      beneficiaryName: params.beneficiaryName,
      beneficiaryAccountIdentifier: params.beneficiaryAccount,
      remittanceInformation: params.note,
    });

    // Step 5: Return data for PaymentInitiationCard
    const paymentDetails: PaymentInitiationDetails = {
      paymentId: paymentResult.paymentId,
      amount: params.amount,
      currency: 'NAD',
      beneficiaryName: params.beneficiaryName,
      beneficiaryAccountIdentifier: params.beneficiaryAccount,
      debtorAccountId: debtorAccount.accountId,
      debtorAccountName: debtorAccount.accountName,
      status: paymentResult.status,
      remittanceInformation: params.note,
      authorizationFlow: paymentResult.authorizationFlow,
      institutionName: debtorAccount.institutionName,
      createdAt: new Date().toISOString(),
    };

    return {
      action: 'show_payment_initiation',
      payment: paymentDetails,
      message: paymentResult.message,
    };
  } catch (error) {
    console.error('Error initiating payment:', error);
    return {
      error: 'Failed to initiate payment',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Handler: Check Payment Status
 * 
 * Polls payment status and updates UI:
 * 1. Fetch current status from Data Provider
 * 2. Update local record
 * 3. Return updated PaymentInitiationCard data
 * 
 * @example
 * User: "Check payment status" or automatic polling
 * → Returns updated payment details
 */
export async function handleCheckPaymentStatus(paymentId: string) {
  try {
    const statusResult = await copilotTools.get_obs_payment_status.handler({
      paymentId,
    });

    return {
      action: 'update_payment_status',
      payment: statusResult,
      message: statusResult.message,
    };
  } catch (error) {
    console.error('Error checking payment status:', error);
    return {
      error: 'Failed to check status',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Handler: List Linked Banks
 * 
 * Shows all active bank links with actions:
 * 1. Fetch all consents
 * 2. Group by Data Provider
 * 3. Show status and last used
 * 4. Provide revoke actions
 * 
 * @example
 * User: "What banks do I have linked?"
 * → Returns list of consents with details
 */
export async function handleListLinkedBanks() {
  try {
    const consentsResult = await copilotTools.list_obs_consents.handler();

    if (consentsResult.activeCount === 0) {
      return {
        message: 'No banks linked. Would you like to link a bank account?',
        suggestions: ['Link my bank account', 'Link FNB', 'Link Bank Windhoek'],
      };
    }

    // Format consent details
    const formattedConsents = consentsResult.consents.map((consent: any) => ({
      id: consent.id,
      bankName: consent.dataProviderName,
      purpose: consent.purpose === 'ais' ? 'Account Information' : 'Payment Initiation',
      status: consent.status,
      expiresAt: new Date(consent.expiresAt).toLocaleDateString('en-NA'),
      scopes: consent.scopes,
    }));

    return {
      action: 'show_linked_banks',
      consents: formattedConsents,
      activeCount: consentsResult.activeCount,
      message: consentsResult.message,
    };
  } catch (error) {
    console.error('Error listing linked banks:', error);
    return {
      error: 'Failed to list banks',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Handler: Revoke Bank Link
 * 
 * Disconnects a bank account:
 * 1. Confirm user intent
 * 2. Revoke consent
 * 3. Notify Data Provider
 * 4. Update UI
 * 
 * @example
 * User: "Disconnect my FNB account"
 * → Shows confirmation dialog
 * → Revokes consent
 * → Shows success message
 */
export async function handleRevokeBankLink(consentId: string, reason?: string) {
  try {
    const revokeResult = await copilotTools.revoke_obs_consent.handler({
      consentId,
      reason,
    });

    return {
      action: 'consent_revoked',
      success: true,
      message: revokeResult.message,
    };
  } catch (error) {
    console.error('Error revoking consent:', error);
    return {
      error: 'Failed to revoke consent',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Helper: Format amount for display
 */
function formatNAD(amount: number): string {
  return `N$${amount.toLocaleString('en-NA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Helper: Parse natural language amount
 * "N$500" → 500
 * "five hundred" → 500 (future enhancement)
 */
export function parseAmount(input: string): number | null {
  // Remove currency symbols and whitespace
  const cleaned = input.replace(/[N$\s,]/gi, '');
  const amount = parseFloat(cleaned);
  return isNaN(amount) ? null : amount;
}

/**
 * Helper: Extract payment details from natural language
 * "Pay N$500 to John Doe from my FNB account" →
 * { amount: 500, beneficiaryName: "John Doe", accountHint: "FNB" }
 */
export function parsePaymentIntent(input: string): {
  amount?: number;
  beneficiaryName?: string;
  accountHint?: string;
  note?: string;
} | null {
  const result: any = {};

  // Extract amount (N$500, 500 NAD, etc.)
  const amountMatch = input.match(/N?\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
  if (amountMatch) {
    result.amount = parseAmount(amountMatch[1]);
  }

  // Extract beneficiary (to [name])
  const beneficiaryMatch = input.match(/to\s+([A-Za-z\s]+?)(?:\s+from|\s+account|\s+for|$)/i);
  if (beneficiaryMatch) {
    result.beneficiaryName = beneficiaryMatch[1].trim();
  }

  // Extract account hint (from [bank name])
  const accountMatch = input.match(/from\s+(?:my\s+)?([A-Za-z\s]+?)(?:\s+account|$)/i);
  if (accountMatch) {
    result.accountHint = accountMatch[1].trim();
  }

  // Extract note (for [purpose])
  const noteMatch = input.match(/for\s+(.+)$/i);
  if (noteMatch) {
    result.note = noteMatch[1].trim();
  }

  return Object.keys(result).length > 0 ? result : null;
}
