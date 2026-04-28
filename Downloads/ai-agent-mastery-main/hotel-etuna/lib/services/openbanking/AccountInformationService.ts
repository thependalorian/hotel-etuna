/**
 * Account Information Service (AIS) - Namibian Open Banking Standards v1.0
 * 
 * Purpose: Provide account information APIs to authorized TPPs
 * Location: /lib/services/openbanking/AccountInformationService.ts
 * 
 * Implements:
 * - Namibian Open Banking Standards v1.0 (Section 9.2.5: AIS Use Cases)
 * - List Accounts API
 * - Get Account Balance API
 * - List Transactions API
 * 
 * Compliance:
 * - Requires OAuth 2.0 access token with 'banking:accounts.basic.read' scope
 * - Tenant isolation via RLS
 * - Response time: < 300ms median (PSD-12)
 * 
 * @version 1.0.0
 * @since January 28, 2026
 */

import { db, guests, bookings, transactions, eq, and, gte, lte, desc } from '@/lib/db';
import { OAuthService } from './OAuthService';

// ============================================================================
// TYPES (Per Open Banking Standards Data Dictionary)
// ============================================================================

export interface Account {
  accountId: string; // Unique identifier
  accountType: string; // 'current', 'savings', 'ewallet', 'credit_card'
  accountNumber: string; // Masked (e.g., **** **** 1234)
  accountName: string; // Account holder name
  currency: string; // NAD
  status: string; // 'active', 'closed'
  openedDate?: string; // ISO 8601 date
}

export interface Balance {
  balanceType: string; // 'current', 'available', 'credit_limit'
  amount: number;
  currency: string; // NAD
  dateTime: string; // ISO 8601 timestamp
}

export interface Transaction {
  transactionId: string;
  accountId: string;
  transactionType: string; // 'debit', 'credit', 'fee', 'interest'
  amount: number;
  currency: string;
  postingDate: string; // ISO 8601 date
  valueDate: string; // ISO 8601 date
  description: string;
  reference?: string;
  beneficiaryName?: string;
  beneficiaryAccount?: string; // Masked
  status: string; // 'posted', 'pending', 'reversed'
}

export interface ListAccountsRequest {
  accessToken: string;
  accountStatus?: 'open' | 'closed' | 'all'; // Filter parameter
  page?: number;
  pageSize?: number;
}

export interface ListAccountsResponse {
  data: Account[];
  links: {
    self: string;
    first?: string;
    last?: string;
    prev?: string;
    next?: string;
  };
  meta: {
    totalRecords: number;
    totalPages: number;
  };
}

export interface GetAccountBalanceRequest {
  accessToken: string;
  accountId: string;
}

export interface GetAccountBalanceResponse {
  data: {
    accountId: string;
    balances: Balance[];
  };
}

export interface ListTransactionsRequest {
  accessToken: string;
  accountId: string;
  fromDate?: string; // ISO 8601 date
  toDate?: string; // ISO 8601 date
  page?: number;
  pageSize?: number;
}

export interface ListTransactionsResponse {
  data: Transaction[];
  links: {
    self: string;
    first?: string;
    last?: string;
    prev?: string;
    next?: string;
  };
  meta: {
    totalRecords: number;
    totalPages: number;
  };
}

// ============================================================================
// ACCOUNT INFORMATION SERVICE
// ============================================================================

export class AccountInformationService {
  /**
   * List Accounts
   * 
   * GET /bon/v1/banking/accounts
   * 
   * Returns list of accounts for the authenticated account holder
   * Requires scope: banking:accounts.basic.read
   * 
   * @param request - List accounts request
   * @returns List of accounts with pagination
   */
  static async listAccounts(request: ListAccountsRequest): Promise<ListAccountsResponse> {
    // Validate access token and scopes
    const consent = await OAuthService.validateAccessToken(
      request.accessToken,
      ['banking:accounts.basic.read']
    );

    if (!consent.accountHolderId) {
      throw new Error('INVALID_TOKEN: Account holder not found in consent');
    }

    // Get account holder (guest)
    const guest = await db
      .select()
      .from(guests)
      .where(eq(guests.id, consent.accountHolderId))
      .limit(1);

    if (!guest || guest.length === 0) {
      throw new Error('ACCOUNT_HOLDER_NOT_FOUND');
    }

    const accountHolder = guest[0];

    // Build accounts list
    // In Buffr Host context, an "account" is represented by a guest's booking/payment history
    // In a real bank, this would query actual bank accounts
    const accounts: Account[] = [
      {
        accountId: accountHolder.id,
        accountType: 'ewallet', // Buffr Host uses e-wallet model
        accountNumber: this.maskAccountNumber(accountHolder.email),
        accountName: `${accountHolder.firstName} ${accountHolder.lastName}`,
        currency: 'NAD',
        status: 'active',
        openedDate: accountHolder.createdAt?.toISOString(),
      },
    ];

    // Filter by status if requested
    const filteredAccounts = request.accountStatus && request.accountStatus !== 'all'
      ? accounts.filter((acc) => acc.status === request.accountStatus)
      : accounts;

    // Pagination
    const page = request.page || 1;
    const pageSize = Math.min(request.pageSize || 25, 1000); // Max 1000 per BoN standards
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedAccounts = filteredAccounts.slice(startIndex, endIndex);

    const totalRecords = filteredAccounts.length;
    const totalPages = Math.ceil(totalRecords / pageSize);

    // Build links
    const baseUrl = '/bon/v1/banking/accounts';
    const links = {
      self: `${baseUrl}?page=${page}&pageSize=${pageSize}`,
      first: page > 1 ? `${baseUrl}?page=1&pageSize=${pageSize}` : undefined,
      last: page < totalPages ? `${baseUrl}?page=${totalPages}&pageSize=${pageSize}` : undefined,
      prev: page > 1 ? `${baseUrl}?page=${page - 1}&pageSize=${pageSize}` : undefined,
      next: page < totalPages ? `${baseUrl}?page=${page + 1}&pageSize=${pageSize}` : undefined,
    };

    return {
      data: paginatedAccounts,
      links,
      meta: {
        totalRecords,
        totalPages,
      },
    };
  }

  /**
   * Get Account Balance
   * 
   * GET /bon/v1/banking/accountbalance?accountId={id}
   * 
   * Returns current balance for specified account
   * Requires scope: banking:accounts.basic.read
   * 
   * @param request - Get balance request
   * @returns Account balances
   */
  static async getAccountBalance(request: GetAccountBalanceRequest): Promise<GetAccountBalanceResponse> {
    // Validate access token
    const consent = await OAuthService.validateAccessToken(
      request.accessToken,
      ['banking:accounts.basic.read']
    );

    // Verify account belongs to account holder
    if (request.accountId !== consent.accountHolderId) {
      throw new Error('UNAUTHORIZED: Account does not belong to this account holder');
    }

    // Calculate balances from transactions
    // In real bank, query actual account balance
    const guestTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.guestId, request.accountId));

    let currentBalance = 0;
    let availableBalance = 0;

    for (const txn of guestTransactions) {
      const amount = Number(txn.amount);
      if (txn.type === 'payment' && txn.status === 'completed') {
        currentBalance += amount; // Credits
      } else if (txn.type === 'refund' && txn.status === 'completed') {
        currentBalance -= amount; // Debits
      }
    }

    availableBalance = currentBalance; // No holds for now

    const balances: Balance[] = [
      {
        balanceType: 'current',
        amount: currentBalance,
        currency: 'NAD',
        dateTime: new Date().toISOString(),
      },
      {
        balanceType: 'available',
        amount: availableBalance,
        currency: 'NAD',
        dateTime: new Date().toISOString(),
      },
    ];

    return {
      data: {
        accountId: request.accountId,
        balances,
      },
    };
  }

  /**
   * List Transactions
   * 
   * GET /bon/v1/banking/transactions?accountId={id}&from={date}&to={date}
   * 
   * Returns transaction history for specified account
   * Requires scope: banking:accounts.basic.read
   * 
   * @param request - List transactions request
   * @returns Transaction list with pagination
   */
  static async listTransactions(request: ListTransactionsRequest): Promise<ListTransactionsResponse> {
    // Validate access token
    const consent = await OAuthService.validateAccessToken(
      request.accessToken,
      ['banking:accounts.basic.read']
    );

    // Verify account belongs to account holder
    if (request.accountId !== consent.accountHolderId) {
      throw new Error('UNAUTHORIZED: Account does not belong to this account holder');
    }

    // Build query with date filters
    const filters = [eq(transactions.guestId, request.accountId)];

    if (request.fromDate) {
      const fromDate = new Date(request.fromDate);
      filters.push(gte(transactions.createdAt, fromDate));
    }

    if (request.toDate) {
      const toDate = new Date(request.toDate);
      filters.push(lte(transactions.createdAt, toDate));
    }

    // Query transactions
    const guestTransactions = await db
      .select()
      .from(transactions)
      .where(and(...filters))
      .orderBy(desc(transactions.createdAt));

    // Map to Open Banking transaction format
    const mappedTransactions: Transaction[] = guestTransactions.map((txn) => ({
      transactionId: txn.id,
      accountId: request.accountId,
      transactionType: txn.type || 'payment',
      amount: Number(txn.amount),
      currency: txn.currency ?? 'NAD',
      postingDate: txn.createdAt?.toISOString().split('T')[0] || '',
      valueDate: txn.processedAt?.toISOString().split('T')[0] || txn.createdAt?.toISOString().split('T')[0] || '',
      description: txn.description || 'Payment transaction',
      reference: txn.transactionReference,
      status: txn.status ?? 'posted',
    }));

    // Pagination
    const page = request.page || 1;
    const pageSize = Math.min(request.pageSize || 25, 1000);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedTransactions = mappedTransactions.slice(startIndex, endIndex);

    const totalRecords = mappedTransactions.length;
    const totalPages = Math.ceil(totalRecords / pageSize);

    // Build links
    const baseUrl = `/bon/v1/banking/transactions?accountId=${request.accountId}`;
    const dateParams = request.fromDate || request.toDate
      ? `&from=${request.fromDate || ''}&to=${request.toDate || ''}`
      : '';

    const links = {
      self: `${baseUrl}${dateParams}&page=${page}&pageSize=${pageSize}`,
      first: page > 1 ? `${baseUrl}${dateParams}&page=1&pageSize=${pageSize}` : undefined,
      last: page < totalPages ? `${baseUrl}${dateParams}&page=${totalPages}&pageSize=${pageSize}` : undefined,
      prev: page > 1 ? `${baseUrl}${dateParams}&page=${page - 1}&pageSize=${pageSize}` : undefined,
      next: page < totalPages ? `${baseUrl}${dateParams}&page=${page + 1}&pageSize=${pageSize}` : undefined,
    };

    return {
      data: paginatedTransactions,
      links,
      meta: {
        totalRecords,
        totalPages,
      },
    };
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Mask account number for security
   * 
   * @param accountNumber - Full account number or email
   * @returns Masked account number
   */
  private static maskAccountNumber(accountNumber: string): string {
    if (accountNumber.includes('@')) {
      // Email: show first 2 chars + domain
      const [local, domain] = accountNumber.split('@');
      const maskedLocal = local.substring(0, 2) + '****';
      return `${maskedLocal}@${domain}`;
    } else if (accountNumber.length >= 8) {
      // Account number: show last 4 digits
      return '**** **** ' + accountNumber.slice(-4);
    } else {
      return '****';
    }
  }
}
