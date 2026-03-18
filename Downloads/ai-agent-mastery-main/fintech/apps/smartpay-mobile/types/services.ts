/**
 * Service Types - SmartPay Mobile
 * Consolidated type exports from all service modules
 * Location: mobile/types/services.ts
 */

// Re-export all API types
export * from './api';

// Groups service types
export type {
  CreateGroupParams,
  CreateSplitParams,
} from '../services/groups';

// Profile service types
export type {
  UserProfileFromApi,
} from '../services/profile';

// Wallets service types
export type {
  Wallet,
  CreateWalletRequest,
  UpdateWalletRequest,
} from '../services/wallets';

// Transactions service types
export type {
  Transaction,
  TransactionType,
} from '../services/transactions';

// Loans service types
export type {
  Loan,
  LoanEligibility,
} from '../services/loans';

// Notifications service types
export type {
  Notification,
} from '../services/notifications';
