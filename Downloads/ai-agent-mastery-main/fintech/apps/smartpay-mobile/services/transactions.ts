/**
 * Transactions Service - SmartPay Mobile
 * Handles transaction history and details
 * Location: mobile/services/transactions.ts
 */

import { api, NetworkError } from './api';
import { Transaction, TransactionsResponse, TransactionType } from '../types/api';

export { Transaction, TransactionType };

/**
 * Get transactions for authenticated user
 * GET /api/v1/mobile/transactions
 */
export async function getTransactions(options?: {
  limit?: number;
  offset?: number;
  walletId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Transaction[]> {
  try {
    const params: Record<string, unknown> = {};
    
    if (options?.limit) params.limit = options.limit;
    if (options?.offset) params.offset = options.offset;
    if (options?.walletId) params.walletId = options.walletId;
    if (options?.startDate) params.startDate = options.startDate;
    if (options?.endDate) params.endDate = options.endDate;

    const response = await api.get<TransactionsResponse>(
      '/api/v1/mobile/transactions',
      { params, retry: true }
    );

    // Backend returns { transactions: [...] }
    return response.transactions || [];
  } catch (error) {
    console.error('getTransactions error:', error);

    // Return mock data in development if API unavailable
    if (__DEV__ && error instanceof NetworkError) {
      return getMockTransactions();
    }

    throw error;
  }
}

/**
 * Get single transaction by ID
 * GET /api/v1/mobile/transactions/:id
 */
export async function getTransactionById(id: string): Promise<Transaction | null> {
  try {
    const response = await api.get<{ transaction: Transaction }>(
      `/api/v1/mobile/transactions/${id}`
    );

    return response.transaction;
  } catch (error) {
    console.error('getTransactionById error:', error);

    // Fallback to mock data in development
    if (__DEV__) {
      const transactions = getMockTransactions();
      return transactions.find(t => t.id === id) ?? null;
    }

    return null;
  }
}

function getMockTransactions(): Transaction[] {
  const now = Date.now();
  return [
    {
      id: '1',
      type: 'send' as TransactionType,
      amount: 50.00,
      fee: 0,
      currency: 'NAD',
      counterparty: 'John Doe',
      description: 'Lunch payment',
      status: 'completed',
      timestamp: new Date(now - 1000 * 60 * 30).toISOString(),
      created_at: new Date(now - 1000 * 60 * 30).toISOString(),
      createdAt: new Date(now - 1000 * 60 * 30).toISOString(),
      walletId: '1',
      reference: 'TXN001',
    },
    {
      id: '2',
      type: 'receive' as TransactionType,
      amount: 200.00,
      fee: 0,
      currency: 'NAD',
      counterparty: 'Jane Smith',
      description: 'Payment received',
      status: 'completed',
      timestamp: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
      created_at: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
      createdAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
      walletId: '1',
      reference: 'TXN002',
    },
    {
      id: '3',
      type: 'airtime' as TransactionType,
      amount: 20.00,
      fee: 0,
      currency: 'NAD',
      counterparty: 'MTC',
      description: 'Airtime purchase',
      status: 'completed',
      timestamp: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
      created_at: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
      createdAt: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
      walletId: '1',
      reference: 'TXN003',
    },
  ];
}

/**
 * Format transaction type for display.
 */
export function formatTransactionType(type: TransactionType): string {
  const typeMap: Partial<Record<TransactionType, string>> = {
    send: 'Sent',
    receive: 'Received',
    cashout: 'Cash Out',
    cashin: 'Cash In',
    bill_payment: 'Bill Payment',
    airtime: 'Airtime',
    voucher: 'Voucher',
    voucher_redeem: 'Voucher Redeemed',
    loan_payment: 'Loan Payment',
    add_money: 'Money Added',
    loan_disbursement: 'Loan Received',
    p2p_transfer: 'Transfer',
    cashout_bank: 'Cash Out - Bank',
    cashout_till: 'Cash Out - Till',
    cashout_agent: 'Cash Out - Agent',
    cashout_merchant: 'Cash Out - Merchant',
    cashout_atm: 'Cash Out - ATM',
    voucher_redemption: 'Voucher Redeemed',
    loan_repayment: 'Loan Payment',
    split_payment: 'Split Payment',
    group_contribution: 'Group Contribution',
    group_withdrawal: 'Group Withdrawal',
  };
  return typeMap[type] || type;
}

/**
 * Format transaction amount with sign prefix.
 */
export function formatTransactionAmount(transaction: Transaction): string {
  const isPositive = ['receive', 'voucher_redeem', 'add_money', 'loan_disbursement'].includes(transaction.type);
  const sign = isPositive ? '+' : '';
  return `${sign}N$${transaction.amount.toFixed(2)}`;
}

/**
 * Get icon name for transaction type.
 */
export function transactionIcon(type: TransactionType): string {
  const iconMap: Partial<Record<TransactionType, string>> = {
    send: 'arrow-up-outline',
    receive: 'arrow-down-outline',
    cashout: 'cash-outline',
    cashin: 'wallet-outline',
    bill_payment: 'document-text-outline',
    airtime: 'phone-portrait-outline',
    voucher: 'gift-outline',
    voucher_redeem: 'gift-outline',
    loan_payment: 'card-outline',
    add_money: 'add-circle-outline',
    loan_disbursement: 'business-outline',
    p2p_transfer: 'arrow-forward-outline',
    cashout_bank: 'business-outline',
    cashout_till: 'storefront-outline',
    cashout_agent: 'person-outline',
    cashout_merchant: 'card-outline',
    cashout_atm: 'cash-outline',
    voucher_redemption: 'gift-outline',
    loan_repayment: 'card-outline',
    split_payment: 'people-outline',
    group_contribution: 'people-outline',
    group_withdrawal: 'arrow-down-outline',
  };
  return iconMap[type] || 'swap-horizontal-outline';
}
