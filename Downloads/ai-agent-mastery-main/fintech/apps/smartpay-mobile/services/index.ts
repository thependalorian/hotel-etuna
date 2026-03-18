/**
 * SmartPay Mobile Services - Central Export
 * Location: mobile/services/index.ts
 * 
 * All API service modules in one place for easy imports
 */

// Core API Client
export { api, clearSession, setTokens, getStoredToken, retryWithBackoff, checkNetworkStatus } from './api';

// Custom Error Classes
export {
  NetworkError,
  UnauthorizedError,
  RateLimitError,
  ValidationError,
} from './api';

// Authentication
export * from './auth';

// User Profile
export * from './profile';

// Wallets
export * from './wallets';

// Transactions
export * from './transactions';

// Send Money
export * from './send';

// Receive Money (NAMQR)
export * from './receive';

// Cash Out
export * from './cashOut';

// KYC
export * from './kyc';

// Vouchers
export * from './vouchers';

// Loans
export * from './loans';

// Groups & Splits
export * from './groups';

// Invite/Referral
export * from './invite';

// Agents Finder
export * from './agents';

// Incidents
export * from './incidents';

// Notifications
export * from './notifications';

// Two Factor Auth
export * from './twoFactorAuth';

// Re-export commonly used types from api types
export type {
  ApiResponse,
  ApiError,
  UserProfile,
  Wallet,
  Transaction,
  TransactionType,
  Group,
  GroupMember,
  GroupSplit,
  Loan,
  LoanEligibility,
  Voucher,
  Notification,
} from '../types/api';
