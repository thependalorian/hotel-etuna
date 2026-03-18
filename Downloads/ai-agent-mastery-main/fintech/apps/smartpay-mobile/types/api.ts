/**
 * API Response Types - SmartPay Mobile
 * TypeScript definitions for all API responses from the backend
 * Location: mobile/types/api.ts
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  total?: number;
  page?: number;
  limit?: number;
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface OtpRequestResponse {
  success: boolean;
  message: string;
  expiresIn: number;
  devCode?: string;
}

export interface OtpVerifyResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  token: string;
  smartpayId: string;
  user: UserProfile;
  message?: string;
  attemptsRemaining?: number;
}

export interface RefreshTokenResponse {
  success: boolean;
  accessToken: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// USER & PROFILE TYPES
// ============================================================================

export interface UserProfile {
  id: string;
  userId?: string;
  phone: string;
  email?: string | null;
  firstName: string;
  first_name?: string;
  lastName: string;
  last_name?: string;
  fullName?: string;
  full_name?: string;
  photoUrl?: string | null;
  photo_url?: string | null;
  avatarUrl?: string | null;
  walletStatus?: string;
  wallet_status?: string;
  kycTier?: string;
  kyc_tier?: string;
  kycVerified?: boolean;
  kyc_verified?: boolean;
  creditScore?: number | null;
  credit_score?: number | null;
  accountStatus?: string;
  account_status?: string;
  walletCount?: number;
  lastProofOfLife?: string | Date | null;
  last_proof_of_life?: string | Date | null;
  proofOfLifeDueDate?: string | Date | null;
  proof_of_life_due_date?: string | Date | null;
  proofOfLife?: ProofOfLifeStatus;
  createdAt?: string | Date;
  created_at?: string | Date;
  updatedAt?: string | Date;
  updated_at?: string | Date;
}

export interface ProofOfLifeStatus {
  status: 'current' | 'due_soon' | 'overdue' | 'required';
  lastVerified: string | Date | null;
  requiredBy: string | Date | null;
  daysUntilRequired: number | null;
  isOverdue: boolean;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  photoUrl?: string | null;
}

export interface UpdateProfileResponse {
  success: boolean;
  user?: UserProfile;
  data?: { updated: boolean };
}

// ============================================================================
// WALLET TYPES
// ============================================================================

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  type: 'main' | 'savings' | 'bills' | 'emergency' | 'travel' | 'shopping' | 'custom';
  currency: string;
  status: 'active' | 'frozen' | 'archived';
  icon: string;
  color: string;
  description?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  isPrimary?: boolean;
  goalAmount?: number;
}

export interface CreateWalletRequest {
  name: string;
  type: Wallet['type'];
  icon: string;
  color: string;
  currency?: string;
  description?: string;
}

export interface CreateWalletResponse {
  wallet: Wallet;
  message: string;
}

export interface UpdateWalletRequest {
  name?: string;
  icon?: string;
  color?: string;
  description?: string;
}

export interface UpdateWalletResponse {
  wallet: Wallet;
  message: string;
}

export interface DeleteWalletResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

export interface Transaction {
  id: string;
  type: TransactionType;
  status: 'completed' | 'pending' | 'failed';
  amount: number;
  fee?: number;
  currency: string;
  description?: string;
  created_at?: string | Date;
  createdAt?: string | Date;
  timestamp?: string | Date;
  direction?: 'in' | 'out';
  sourceWalletId?: string;
  source_wallet_id?: string;
  walletId?: string;
  destinationWalletId?: string;
  destination_wallet_id?: string;
  sourceUserId?: string;
  source_user_id?: string;
  destinationUserId?: string;
  destination_user_id?: string;
  metadata?: Record<string, unknown>;
  reference?: string;
  counterparty?: string;
}

export type TransactionType = 
  // Detailed types (backend format)
  | 'p2p_transfer'
  | 'cashout_bank'
  | 'cashout_till'
  | 'cashout_agent'
  | 'cashout_merchant'
  | 'cashout_atm'
  | 'voucher_redemption'
  | 'voucher_redemption_nampost'
  | 'voucher_redemption_smartpay'
  | 'loan_disbursement'
  | 'loan_repayment'
  | 'split_payment'
  | 'group_contribution'
  | 'group_withdrawal'
  // Simple types (frontend format)
  | 'send'
  | 'receive'
  | 'airtime'
  | 'cashout'
  | 'cashin'
  | 'bill_payment'
  | 'voucher'
  | 'voucher_redeem'
  | 'loan_payment'
  | 'add_money'
  | 'debit'
  | 'credit';

export interface TransactionsResponse {
  transactions: Transaction[];
  count?: number;
}

// ============================================================================
// SEND MONEY TYPES
// ============================================================================

export interface SendMoneyRequest {
  amount: number;
  beneficiaryId?: string;
  beneficiaryPhone?: string;
  sourceWalletId: string;
  note?: string;
}

export interface SendMoneyResponse {
  success: boolean;
  data?: {
    transactionId: string;
    status: string;
    amount: number;
    fee: number;
    totalDebited: number;
    newBalance: number;
    beneficiaryUserId: string;
    timestamp: string;
  };
  error?: ApiError;
}

// ============================================================================
// CASH OUT TYPES
// ============================================================================

export interface CashOutBankRequest {
  amount: number;
  walletId: string;
  bankAccount: string;
  bankCode: string;
}

export interface CashOutTillRequest {
  amount: number;
  walletId: string;
  tillNumber?: string;
}

export interface CashOutAgentRequest {
  amount: number;
  walletId: string;
  agentCode?: string;
}

export interface CashOutMerchantRequest {
  amount: number;
  walletId: string;
  merchantId: string;
}

export interface CashOutATMRequest {
  amount: number;
  walletId: string;
  atmId?: string;
}

export interface CashOutResponse {
  success: boolean;
  data?: {
    transactionId: string;
    status: string;
    amount: number;
    fee: number;
    newBalance: number;
    offlineCode?: string;
    authCode?: string;
    qrCode?: string;
    namqrCode?: string;
    expiresAt?: string;
    instructions?: string;
    estimatedCompletion?: string;
  };
  error?: ApiError;
}

// ============================================================================
// KYC TYPES
// ============================================================================

export interface KycStatus {
  kycTier: string;
  kycVerified: boolean;
  pendingSubmission: boolean;
  lastSubmission: {
    id: string;
    status: string;
    submittedAt: string;
  } | null;
}

export interface KycSubmitRequest {
  fullName: string;
  idNumber: string;
  idType: 'national_id' | 'passport';
  dateOfBirth: string;
  address?: string;
}

export interface KycSubmitResponse {
  success: boolean;
  data?: {
    message: string;
    kycTier: string;
    kycVerified: boolean;
  };
  error?: ApiError;
}

// ============================================================================
// VOUCHER TYPES
// ============================================================================

export interface Voucher {
  id: string;
  voucher_code: string;
  voucherCode?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'redeemed' | 'expired' | 'pending_collection' | 'expected';
  voucher_type: string;
  voucherType?: string;
  issuer: string;
  issued_at?: string | Date;
  issuedAt?: string | Date;
  expires_at?: string | Date;
  expiresAt?: string | Date;
  redeemed_at?: string | Date;
  redeemedAt?: string | Date;
  expected_date?: string | Date;
  expectedDate?: string | Date;
  redemption_method_allowed?: string[];
  redemptionMethodAllowed?: string[];
  metadata?: Record<string, unknown>;
}

export interface VouchersResponse {
  success: boolean;
  data?: {
    vouchers: Voucher[];
    count: number;
  };
}

export interface RedeemVoucherResponse {
  success: boolean;
  data?: {
    transactionId: string;
    voucherCode: string;
    amount: number;
    currency: string;
    walletId?: string;
    newBalance?: number;
    collectionCode?: string;
    expiresAt?: string;
    instructions?: string;
    redeemedAt?: string;
  };
  error?: ApiError;
}

// ============================================================================
// LOAN TYPES
// ============================================================================

export interface LoanEligibility {
  eligible: boolean;
  maxAmount: number;
  currency?: string;
  interestRate: number;
  interestRatePercent: string;
  repaymentDate: string | Date | null;
  reason?: string;
  backedByVoucher?: {
    voucherId: string;
    voucherAmount: number;
    voucherType: string;
    issuer: string;
    expectedDate: string | Date;
  };
  outstandingLoans?: number;
  estimatedInterest?: number;
  creditTier?: string;
  mlMaxLoanAmount?: number;
}

export interface LoanApplicationRequest {
  amount: number;
  walletId: string;
  purpose?: string;
}

export interface Loan {
  id: string;
  amount: number;
  interest: number;
  interest_rate: number;
  interestRate?: number;
  currency: string;
  status: 'active' | 'pending' | 'repaid' | 'defaulted';
  backed_by_voucher_id: string;
  backedByVoucherId?: string;
  repayment_due_date: string | Date;
  repaymentDueDate?: string | Date;
  repaid_at?: string | Date | null;
  repaidAt?: string | Date | null;
  purpose?: string;
  disbursed_at?: string | Date;
  disbursedAt?: string | Date;
  created_at: string | Date;
  createdAt?: string | Date;
}

export interface LoanApplicationResponse {
  success: boolean;
  data?: {
    loanId: string;
    transactionId: string;
    status: string;
    amount: number;
    interest: number;
    interestRate: number;
    interestRatePercent: string;
    totalRepayment: number;
    currency: string;
    repaymentDueDate: string | Date;
    walletId: string;
    newBalance: number;
    disbursedAt: string;
    repaymentNote: string;
  };
  error?: ApiError;
}

export interface LoansResponse {
  success: boolean;
  data?: {
    loans: Loan[];
    count: number;
  };
}

// ============================================================================
// GROUP TYPES
// ============================================================================

export interface GroupSplit {
  id: string;
  description: string;
  totalAmount: number;
  total_amount?: number;
  status: string;
  shares: {
    id: string;
    userId: string;
    user_id?: string;
    name: string;
    phone?: string;
    amount: number;
    isPaid: boolean;
    is_paid?: boolean;
  }[];
  createdAt?: string | Date;
  created_at?: string | Date;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  member_count?: number;
  status: string;
  walletId: string;
  wallet_id?: string;
  balance: number;
  walletBalance?: number;
  wallet_balance?: number;
  currency: string;
  role: 'admin' | 'member' | 'treasurer';
  membershipStatus?: string;
  membership_status?: string;
  createdBy: {
    id: string;
    name: string;
  } | string;
  created_by?: string;
  created_by_name?: string;
  settings?: Record<string, unknown>;
  members?: GroupMember[];
  pendingSplits?: GroupSplit[];
  pending_splits?: GroupSplit[];
  createdAt: string | Date;
  created_at?: string | Date;
  updatedAt?: string | Date;
  updated_at?: string | Date;
}

export interface GroupMember {
  id?: string;
  userId: string;
  user_id?: string;
  name: string;
  phone: string;
  photoUrl?: string | null;
  photo_url?: string | null;
  role: 'admin' | 'member' | 'treasurer';
  status: 'active' | 'pending' | 'removed';
  joinedAt: string | Date;
  joined_at?: string | Date;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  currency?: string;
  memberPhones?: string[];
  settings?: Record<string, unknown>;
}

export interface InviteMemberRequest {
  userId?: string;
  phone?: string;
  role?: 'member' | 'admin' | 'treasurer';
}

export interface SplitBillShare {
  userId: string;
  amount?: number;
}

export interface CreateSplitRequest {
  title: string;
  description?: string;
  totalAmount: number;
  splitType: 'equal' | 'custom';
  splitMethod?: 'equal' | 'custom';
  shares?: SplitBillShare[];
}

export interface SplitBill {
  id: string;
  title: string;
  description?: string;
  totalAmount: number;
  total_amount?: number;
  splitType: string;
  split_type?: string;
  status: string;
  shares: {
    id: string;
    userId: string;
    user_id?: string;
    name: string;
    amount: number;
    share_amount?: number;
    status: string;
  }[];
  createdAt: string | Date;
  created_at?: string | Date;
}

export interface PaySplitRequest {
  walletId: string;
}

export interface PaySplitResponse {
  success: boolean;
  data?: {
    transactionId: string;
    amount: number;
    newBalance: number;
    splitCompleted: boolean;
    paidAt: string;
  };
  message?: string;
  error?: ApiError;
}

// ============================================================================
// PROOF OF LIFE TYPES
// ============================================================================

export interface StartProofOfLifeRequest {
  method: 'sms' | 'biometric' | 'agent' | 'auto';
  location?: string;
}

export interface ProofOfLifeResponse {
  success: boolean;
  data?: {
    sessionId: string;
    method: string;
    status: string;
    expiresAt: string;
    message?: string;
    phone?: string;
    instructions?: string;
    code?: string;
    verificationCode?: string;
    biometricTypes?: string[];
    recentTransactions?: number;
    verifiedAt?: string;
    nextVerificationDue?: string;
    validUntil?: string;
  };
  error?: ApiError;
}

export interface CompleteProofOfLifeRequest {
  sessionId: string;
  code?: string;
  biometricToken?: string;
}

// ============================================================================
// PIN/2FA TYPES
// ============================================================================

export interface SetPinRequest {
  pin: string;
}

export interface VerifyPinRequest {
  pin: string;
}

export interface PinResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// NOTIFICATION TYPES (if needed)
// ============================================================================

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string | Date;
  createdAt?: string | Date;
  metadata?: Record<string, unknown>;
}
