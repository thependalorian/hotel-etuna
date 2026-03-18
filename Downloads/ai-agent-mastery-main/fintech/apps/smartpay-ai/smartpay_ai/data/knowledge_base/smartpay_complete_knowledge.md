# Smartpay Knowledge Base

**Version:** 1.0  
**Last Updated:** March 18, 2026  
**Purpose:** Comprehensive knowledge base for RAG ingestion into LanceDB

---

## Product Features

### Vouchers

#### What are Vouchers?
Government-to-Person (G2P) grants and partner-issued entitlements that provide social benefits to Namibian citizens. Vouchers are stored as digital records in the Smartpay system and can be redeemed for Namibian Dollars (NAD) through multiple channels.

#### Voucher Database Schema
**Table:** `vouchers`
- `id` - Unique identifier (UUID)
- `user_id` - Beneficiary user ID
- `amount` - Voucher value in NAD
- `currency` - Always 'NAD'
- `status` - 'available', 'redeemed', or 'expired'
- `type` - Voucher category
- `programme` - Government/partner programme name
- `expires_at` - Expiration timestamp
- `external_id` - External system reference
- `created_at` - Creation timestamp

**Table:** `voucher_redemptions`
- `id` - Redemption record ID
- `voucher_id` - Reference to voucher
- `user_id` - User who redeemed
- `method` - 'wallet', 'nampost', or 'smartpay'
- `amount_credited` - Amount credited to user
- `created_at` - Redemption timestamp

#### Voucher Redemption Workflows

**Method 1: Wallet Redemption (Instant)**
1. User selects voucher and chooses 'Redeem to Wallet'
2. System validates voucher status (must be 'available', not expired)
3. Atomic transaction:
   - Mark voucher as 'redeemed'
   - Credit user's wallet with voucher amount
   - Create `voucher_redemptions` record
   - Create `wallet_transaction` record
4. Instant confirmation to user
5. Voucher balance reflects in wallet immediately

**Method 2: NamPost Physical Collection**
1. User selects voucher and chooses 'Collect at NamPost'
2. System generates unique collection code
3. Mark voucher as 'redeemed' with method='nampost'
4. User receives SMS with:
   - Collection code
   - Nearest NamPost location
   - Operating hours
5. User visits NamPost branch with:
   - Collection code
   - National ID
6. NamPost verifies code and disburses cash (NAD)

**Method 3: SmartPay Agent (Mobile Money)**
1. User selects voucher and chooses 'Redeem via Agent'
2. System generates secure PIN code
3. Mark voucher as 'redeemed' with method='smartpay'
4. User receives SMS with:
   - Redemption PIN
   - Nearest agent location
5. User visits SmartPay agent with PIN
6. Agent processes redemption through POS/mobile terminal
7. Agent disburses cash or credits mobile money wallet

#### Voucher Service Functions
- `getUserVouchers(userId, status?)` - Fetch user's vouchers, optionally filtered by status
- `getVoucherById(voucherId, userId)` - Retrieve specific voucher
- `redeemVoucher(params)` - Handle redemption (validates status, supports all 3 methods)
- `createVoucher(params)` - Create new voucher with user_id, amount, programme, type, expires_at
- `getVoucherStats(userId)` - Statistics: total, available, redeemed vouchers and amounts
- `expireOldVouchers()` - Batch update expired vouchers to 'expired' status

#### Voucher API Routes
- `GET /api/v1/mobile/vouchers` - List user's vouchers
- `GET /api/v1/mobile/vouchers/:id` - Get voucher details
- `POST /api/v1/mobile/vouchers/:id/redeem` - Redeem to wallet (instant)
- `POST /api/v1/mobile/vouchers/:id/redeem-nampost` - Generate NamPost collection code
- `POST /api/v1/mobile/vouchers/:id/redeem-smartpay` - Generate agent redemption PIN

#### Regulatory Classification
**Not Virtual Assets:** Smartpay vouchers do NOT fall under the Virtual Assets Act, 2023 (Act No. 10 of 2023) because:
1. They do not use Distributed Ledger Technology (DLT) - stored in central PostgreSQL database
2. They are digital representations of fiat currency (NAD), which the Act explicitly excludes
3. They qualify as closed-loop items: non-transferable, non-exchangeable, no secondary market

**Applicable Regulations:** Payment System Management Act 2023, PSD-3 (e-money on wallet redemption), Financial Intelligence Act (AML/CFT)

---

### Loans

#### What are Loans?
Voucher-backed microloans that allow users to borrow against their voucher redemption history. Smartpay uses voucher history as collateral rather than traditional credit scoring.

#### Loan Eligibility Criteria

**Criterion 1: Voucher History**
- Maximum loan amount = 50% of total redeemed voucher value
- Calculation: `maxLoanAmount = totalRedeemedVoucherValue * 0.5`
- Example: If user redeemed N$10,000 in vouchers, max loan = N$5,000

**Criterion 2: No Existing Active Loans**
- User cannot have any loans with status 'pending' or 'active'
- Must repay existing loan before applying for new loan

**Criterion 3: Interest Rate by KYC Tier**
- Basic KYC: 7% interest
- Standard KYC: 5% interest (default)
- Enhanced KYC: 3% interest
- Default rate: 15% if tier not specified
- Total repayment = `amount * (1 + interestRate / 100)`

#### Loan Application Process
1. User requests loan through mobile app
2. System checks eligibility:
   - Query total redeemed voucher value
   - Check for existing pending/active loans
   - Verify requested amount ≤ 50% of redeemed voucher history
3. Calculate interest based on KYC tier
4. Create loan record with status 'pending'
5. Loan requires approval before disbursement

#### Loan Disbursement
1. Loan status changes from 'pending' to 'active'
2. Atomic transaction:
   - Credit user's wallet with loan amount
   - Update loan status
   - Create wallet_transaction record
3. User receives instant notification
4. Funds available immediately in wallet

#### Loan Repayment
1. User initiates repayment (must pay full amount ≥ total_repayment)
2. System validates:
   - Wallet balance sufficient
   - Loan exists and is 'active'
3. Database transaction:
   - Debit user's wallet
   - Update loan status to 'repaid'
   - Record wallet_transaction
4. Transaction uses BEGIN/COMMIT/ROLLBACK for safety

#### Loan Service Functions
- `applyForLoan(params)` - Create loan application with eligibility checks
- `disburseLoan(loanId, userId)` - Activate loan and credit wallet
- `getUserLoans(userId, status?)` - Fetch user's loans
- `getLoanById(loanId, userId)` - Get specific loan details
- `repayLoan(params)` - Process loan repayment
- `calculateRepayment(amount, interestRate?)` - Calculate principal, interest, total

#### Loan Database Schema
**Table:** `loans`
- `id` - Loan unique identifier
- `user_id` - Borrower ID
- `amount` - Principal amount
- `interest_rate` - Interest percentage
- `total_repayment` - Amount + interest
- `status` - 'pending', 'active', or 'repaid'
- `disbursed_at` - Disbursement timestamp
- `repaid_at` - Repayment timestamp
- `created_at` - Application timestamp

---

### Wallets

#### Wallet Types
1. **Main Wallet** - Primary transactional wallet (one per user)
2. **Savings Wallet** - Goal-based savings
3. **Grant Wallet** - For G2P voucher redemptions

#### Wallet Management

**Create Wallet**
- Function: `createWallet(userId, name, type)`
- Ensures only one 'main' wallet per user
- Initial balance: 0
- Currency: NAD
- Status: active

**Get User Wallets**
- Function: `getUserWallets(userId)`
- Returns all wallets for user

**Get Wallet by ID**
- Function: `getWalletById(walletId, userId)`
- Returns specific wallet details

**Update Wallet**
- Function: `updateWallet(walletId, userId, updates)`
- Can modify: name, type
- Cannot modify: balance (use transactions)

**Delete Wallet**
- Function: `deleteWallet(walletId, userId)`
- Requires: balance = 0
- Prevents deletion with outstanding balance

**Get Wallet Transactions**
- Function: `getWalletTransactions(walletId, userId, limit?, offset?)`
- Supports pagination
- Returns transaction history

#### Wallet Database Schema
**Table:** `wallets`
- `id` - Wallet unique identifier (UUID)
- `user_id` - Owner user ID
- `wallet_number` - Unique wallet number
- `name` - User-defined name
- `balance_cents` - Balance in cents (atomic operations)
- `currency` - Always 'NAD'
- `wallet_type` - 'main', 'savings', 'grant', or 'group'
- `status` - 'active', 'suspended', 'closed'
- `daily_limit_cents` - KYC-based daily transaction limit
- `monthly_balance_limit_cents` - KYC-based monthly balance limit
- `last_transaction_at` - Last activity timestamp
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**Table:** `wallet_transactions`
- `id` - Transaction ID
- `wallet_id` - Wallet reference
- `type` - 'load', 'transfer_out', 'transfer_in', 'payment', 'redemption', 'reversal', 'fee', 'refund'
- `amount_cents` - Transaction amount
- `fee_cents` - Transaction fee
- `balance_before_cents` - Balance before transaction
- `balance_after_cents` - Balance after transaction
- `status` - 'pending', 'completed', 'failed', 'reversed'
- `description` - Transaction description
- `metadata` - Additional JSON data
- `created_at` - Transaction timestamp

---

### Groups and Stokvels

#### What are Groups?
Digital savings circles and collective payment groups that enable:
- Group savings pools
- Split bill payments with automatic tracking
- Collective payments for shared expenses
- Stokvel-style financial cooperation

#### Group Database Schema
**Table:** `groups`
- `id` - Group unique identifier
- `name` - Group name (3-100 characters)
- `description` - Optional description (max 500 chars)
- `wallet_id` - Associated group wallet
- `created_by` - Creator user ID
- `member_count` - Total active members
- `status` - 'active' or 'deleted'
- `settings` - JSON configuration
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**Table:** `group_members`
- `id` - Membership record ID
- `group_id` - Group reference
- `user_id` - Member user ID
- `role` - 'admin', 'treasurer', or 'member'
- `status` - 'pending', 'active', or 'removed'
- `invited_by` - User who invited this member
- `invited_at` - Invitation timestamp
- `joined_at` - Acceptance timestamp
- `updated_at` - Last update timestamp

**Table:** `split_requests`
- `id` - Split request ID
- `group_id` - Group reference
- `created_by` - User who created split
- `title` - Split title (3-200 characters)
- `description` - Optional description
- `total_amount` - Total amount to split (N$1 - N$100,000)
- `currency` - Always 'NAD'
- `split_type` - 'equal' or 'custom'
- `status` - 'pending' or 'completed'
- `created_at` - Creation timestamp
- `completed_at` - Completion timestamp

**Table:** `split_shares`
- `id` - Share record ID
- `split_request_id` - Split reference
- `user_id` - Member responsible for share
- `share_amount` - Amount owed by this member
- `currency` - Always 'NAD'
- `status` - 'pending' or 'paid'
- `paid_at` - Payment timestamp
- `transaction_id` - Payment transaction reference

#### Group Creation Rules
1. Group name: 3-100 characters required
2. Description: Optional, max 500 characters
3. Currency: NAD (default and fixed)
4. Creator automatically becomes 'admin' member
5. Group wallet created automatically with zero balance
6. Initial member_count: 1 (creator)

#### Member Management Rules

**Roles and Permissions:**
- **Admin**: Can invite members, remove members, delete group, send payment reminders
- **Treasurer**: Can invite members, manage finances, send payment reminders
- **Member**: Can participate in splits, make payments, view group details

**Invitation Process:**
1. Admin or Treasurer invites user by userId or phone number
2. System validates user exists (phone lookup if needed)
3. Create `group_members` record with status='pending'
4. Invitee receives notification
5. Invitee accepts invitation → status changes to 'active'

**Membership Restrictions:**
- Cannot invite user already in group (active status)
- Cannot remove last admin (must have at least 1 admin)
- Only admins can remove members
- Members can remove themselves

#### Split Bill Rules

**Equal Split:**
- Total amount divided equally among all active members
- Calculation: `shareAmount = totalAmount / activeMembers.length`
- All members get identical share amounts

**Custom Split:**
- Creator specifies exact amount for each member
- Validation: Sum of shares must equal total amount (tolerance 0.01)
- Allows unequal distribution based on agreement

**Split Payment Rules:**
1. Each member pays their share individually
2. Payment source: Member's wallet (must have sufficient balance)
3. Payment destination: Group wallet
4. Transaction type: 'split_payment'
5. Share marked 'paid' when transaction completes
6. Split marked 'completed' when all shares paid
7. Reminders can be sent to members with unpaid shares

**Split Bill Limits:**
- Minimum amount: N$1
- Maximum amount: N$100,000 per split
- Title: 3-200 characters required
- Description: Optional, max 1000 characters

#### Group Deletion Rules
1. Only admins can delete groups
2. Requirements before deletion:
   - No pending split bills (all must be completed or cancelled)
   - Group wallet balance must be exactly N$0
3. Deletion is soft delete (status='deleted')
4. All members automatically removed (status='removed')
5. Group data preserved for audit trail

#### Group API Endpoints
- `GET /api/v1/mobile/groups` - List user's groups
- `POST /api/v1/mobile/groups` - Create new group
- `GET /api/v1/mobile/groups/:groupId` - Get group details with members
- `POST /api/v1/mobile/groups/:groupId/members` - Invite member (admin/treasurer only)
- `POST /api/v1/mobile/groups/:groupId/join` - Accept group invitation
- `DELETE /api/v1/mobile/groups/:groupId/members/:memberId` - Remove member
- `POST /api/v1/mobile/groups/:groupId/split` - Create split bill
- `POST /api/v1/mobile/groups/:groupId/splits/:splitId/pay` - Pay split share
- `POST /api/v1/mobile/groups/:groupId/splits/:splitId/remind` - Send payment reminders
- `DELETE /api/v1/mobile/groups/:groupId` - Delete group (admin only)

---

### Agent Banking Operations

#### What are Agents?
Physical locations where users can perform cash-in/cash-out transactions, redeem vouchers, and access other Smartpay services without requiring a smartphone or internet connection.

#### Agent Types
1. **NamPost** - Namibian Post Office branches (nationwide)
2. **Bank Branch** - Partner bank physical locations
3. **Retail** - Retail stores (e.g., supermarkets, gas stations)
4. **ATM** - Automated Teller Machine locations
5. **Mobile Agent** - Individual mobile money agents

#### Agent Capabilities
**Table:** `agent_locations`
- `id` - Agent location ID
- `agent_code` - Unique agent identifier
- `agent_name` - Agent/location name
- `agent_type` - Type of agent (see above)
- `latitude` / `longitude` - GPS coordinates
- `address` - Physical address
- `region` - Namibian region (e.g., Khomas, Erongo)
- `ussd_code` - USSD short code (if applicable)
- `supports_cashout` - Boolean: supports cash-out
- `supports_voucher_redeem` - Boolean: supports voucher redemption
- `supports_ewallet` - Boolean: supports e-wallet loading
- `supports_namqr` - Boolean: supports NAMQR payments
- `pos_terminal_id` - POS terminal identifier
- `api_endpoint` - Integration API URL
- `operating_hours` - JSON: {"mon-fri": "08:00-17:00", "sat": "08:00-13:00"}
- `is_active` - Boolean: agent currently operational

#### Agent Finder Features
**Find Nearest Agents:**
- API: `GET /api/v1/mobile/agents/nearest?lat={lat}&lng={lng}&service={service}&limit={limit}`
- Uses Haversine formula to calculate distance in kilometers
- Filters by service: 'cashout', 'voucher', 'ewallet', 'namqr', or 'all'
- Returns up to 50 nearest agents sorted by distance
- Includes agent details, distance, operating hours, supported services

**Find Agents by Region:**
- API: `GET /api/v1/mobile/agents/region/:region?service={service}&limit={limit}`
- Lists all agents in specified region (e.g., Khomas, Erongo)
- Filter by service type
- Sorted alphabetically by agent name

**Get Agent Details:**
- API: `GET /api/v1/mobile/agents/:agentCode`
- Returns complete agent information including capabilities and contact details

#### Agent Banking Processes

**Process 1: Voucher Redemption at Agent**
1. User requests voucher redemption via agent (see Voucher section)
2. System generates secure PIN code
3. User visits agent with PIN and National ID
4. Agent validates PIN through POS terminal or API
5. System verifies:
   - PIN is valid and not expired
   - Voucher status is 'redeemed' with method='smartpay'
   - Amount matches voucher value
6. Agent disburses cash to user
7. System logs redemption completion

**Process 2: Cash-Out at Agent**
1. User initiates cash-out from wallet via app
2. System generates withdrawal code
3. User visits agent supporting 'cashout'
4. Agent validates code and user ID
5. Agent disburses cash
6. System debits user's wallet
7. Transaction recorded with type='cash_out'

**Process 3: Cash-In at Agent**
1. User visits agent with cash
2. Agent initiates deposit through POS/API
3. User confirms transaction with PIN
4. Agent deposits cash into system
5. User's wallet credited instantly
6. Transaction recorded with type='load'

#### Agent Appointment Requirements (per PSD-1)
- Payment service provider must notify Bank of Namibia 60 days before appointing agent
- Due diligence required on agent (fitness and probity)
- Written agreement outlining roles, responsibilities, and liabilities
- Agent acts on behalf of PSP - PSP remains liable for agent actions
- Regular monitoring and audit of agent activities
- Agent training on AML/CFT compliance

---

## Regulations and Compliance

### PSD-1: Payment Service Provider Licensing

**Full Name:** Determination on the Licensing and Authorisation of Payment Service Providers in Namibia  
**Effective Date:** 2026 (updated version)  
**Applies To:** All persons intending to provide payment services in Namibia

#### Payment Service Provider Categories

**1. Payment Instrument Issuer**
- Issues payment instruments (cards, e-wallets, mobile money)
- Examples: E-money issuers, card issuers

**2. Payment Facilitator**
- Facilitates payments between parties
- Examples: Payment gateways, merchant aggregators

**3. Third-Party Payment Service Provider**
- Provides payment services on behalf of others
- Examples: Payment processors, remittance services

#### General Requirements for All PSPs

**Governance:**
- Board of directors with independent non-executive directors
- Fit and proper person assessments
- Written policies and procedures

**Board Appointments:**
- Bank approval required before appointment
- Fitness and probity assessment (2 months)
- Police clearance required

**Risk Management:**
- Comprehensive Risk Management Framework covering:
  - Operational risk
  - Fraud risk
  - Cyber security risk
  - Money laundering/terrorism financing risk
  - Liquidity risk
  - Legal and reputational risk
  - Data protection and privacy risk

**User Protection:**
- Transparent terms and conditions
- Clear fee disclosure
- Dispute resolution mechanisms
- Data security measures

**Capital Requirements (per Payment System Notice 2025):**
- Non-bank E-Money Issuer: N$1.5 million initial, ongoing = average outstanding liabilities over 6 months
- Micro E-Money Issuer: N$500,000 initial
- Payment Facilitation Service Provider: N$1.5 million initial
- Third-Party Payment Service Provider: N$1 million initial

**Contractual:**
- Written agreements with partners
- Clear liability allocation
- Business continuity measures

#### Agent Appointment Rules (Section 13)

**Notification Requirement:**
- PSP must notify Bank of Namibia **60 days before** appointing agent
- Notification includes agent details and due diligence results

**Due Diligence on Agents:**
- Fitness and probity assessment
- Financial stability check
- Police clearance certificate
- Business premises inspection
- AML/CFT compliance verification

**Agent Agreement Must Include:**
- Roles and responsibilities
- Services agent authorized to provide
- PSP liability for agent actions
- Training requirements (AML/CFT, customer protection)
- Monitoring and audit rights
- Termination conditions

**Liability:**
- PSP remains fully liable for agent actions
- Agent acts as extension of PSP
- PSP must indemnify customers for agent errors/fraud

**Monitoring:**
- Regular audits of agent activities
- Transaction monitoring
- Customer complaint tracking
- Compliance checks

#### Licensing Fees (per Payment System Notice 2025)
- Application fee: N$5,000 (non-refundable)
- Licensing fee: N$20,000
- Annual renewal: N$10,000
- Additional category application: N$5,000

**Note:** Banking institutions do not pay fees to offer payment services as PSPs.

#### Reporting Requirements
- Annual audited financial statements
- Quarterly transaction reports
- Incident reports (security breaches, system failures)
- Material changes notification (ownership, systems, services)

#### Administrative Penalties
- For contraventions of PSD-1 provisions
- See PSD-8 for penalty calculation framework

---

### PSD-3: E-Money Limits and Requirements

**Full Name:** Determination on Issuing of Electronic Money in Namibia  
**Effective Date:** November 28, 2019  
**Applies To:** All e-money issuers in Namibia

#### E-Money Definition
Electronic money (e-money) means monetary value that is:
1. Stored electronically, magnetically or digitally
2. Issued on receipt of funds (legal tender) of equivalent value
3. Accepted as payment by persons other than the issuer
4. Redeemable on demand for cash in Namibia Dollars (NAD)

#### E-Money Issuers
**Banking Institutions:**
- Banks authorized under Banking Institutions Act
- Can issue e-money as part of banking license

**Non-Bank Institutions:**
- Must be licensed specifically to issue e-money
- Subject to additional capital and safeguarding requirements

#### E-Money Characteristics
- **Denomination:** Must be denominated in NAD
- **No Interest:** E-money wallets cannot earn interest (not deposit accounts)
- **Redeemable:** Must be redeemable for cash NAD on demand
- **Acceptance:** Must be accepted by multiple merchants/users (not closed-loop)

#### Safeguarding Customer Funds

**100% Pooled Funds Requirement:**
- E-money issuer must hold 100% of customer e-money balances in trust account
- Trust account maintained at licensed banking institution
- Funds segregated from issuer's own assets
- Cannot be used for issuer's business operations

**Daily Reconciliation:**
- Daily reconciliation of:
  - Outstanding e-money liabilities (sum of all wallet balances)
  - Trust account balance
  - Transaction activity
- Reconciliation report generated daily
- Discrepancies must be resolved within 24 hours

**Trust Account Requirements:**
- Maintained at reputable banking institution
- Separate from issuer's operational accounts
- Protected in case of issuer insolvency
- Subject to Bank of Namibia inspection

#### Dormant Wallet Procedures

**Inactivity Period:** 6 months with no transactions

**Dormancy Process:**
1. After 6 months inactivity, wallet marked 'dormant'
2. Issuer sends notification to user (SMS, email, app notification)
3. No fees charged on dormant wallets
4. User can reactivate by making any transaction

**Dormant Wallet Fund Handling:**
- Funds remain in trust account
- User can reclaim funds at any time
- After 3 years dormancy:
  - Attempt to return funds to customer
  - If customer cannot be located, attempt return to original sender (if G2P)
  - If still unclaimed, may be used for payment scheme development (with BoN approval)

#### Capital Requirements for Non-Bank Issuers

**Initial Capital:**
- N$1.5 million minimum
- Includes capital assets and systems

**Ongoing Capital:**
- Liquid assets equal to average outstanding liabilities over previous 6 months
- Calculation: `ongoingCapital = average(monthlyOutstandingLiabilities, 6 months)`
- Must remain unencumbered
- Forms: Cash balances, short-term government securities, BoN-approved instruments
- Must be held at different bank than trust account

**Micro E-Money Issuer:**
- Initial capital: N$500,000
- Lower limits on transactions and user base

#### AML/CFT Compliance
- Full compliance with Financial Intelligence Act, 2012
- Customer Due Diligence (CDD) based on KYC tiers
- Transaction monitoring for suspicious activity
- Suspicious Transaction Reporting (STR) to Financial Intelligence Centre
- Record keeping: 7 years for transactions and CDD records

#### Customer Protection
- Transparent fee disclosure
- Clear terms and conditions
- Accessible dispute resolution
- Transaction limits based on KYC tier (see Transaction Limits section)
- Real-time transaction processing (PSD-3 Section 13.3)
- No interest on e-money wallets (not deposit accounts)

#### Competition and Interoperability
- Open access to e-money acceptance network
- Interoperability with other payment systems required
- No exclusive merchant agreements that restrict competition
- Fair pricing for merchant acceptance

#### Remittances
- E-money can be used for domestic and cross-border remittances
- Subject to Exchange Control Regulations
- Cross-border remittances require additional reporting

#### Reporting to Bank of Namibia
- Monthly transaction statistics
- Quarterly financial statements
- Annual audited financial statements (within 3 months of fiscal year end)
- Immediate incident reporting (fraud, breaches, system failures)
- Trust account reconciliation records

#### Administrative Penalties
- For non-compliance with PSD-3 provisions
- See PSD-8 for penalty calculation framework
- Range: N$100,000 daily (max N$1,000,000 total per case)

---

### Transaction Limits (Payment System Notice 2025 - Table 4)

#### Lite KYC - Individual
- **Daily Transaction Limit:** N$10,000
- **Monthly Balance Limit:** N$10,000
- **KYC Requirements:**
  - Full Name
  - Nationality
  - National Identity or Passport Number

#### Lite KYC - Business
- **Daily Transaction Limit:** N$10,000
- **Monthly Balance Limit:** N$10,000
- **KYC Requirements:**
  - Full Name
  - Nationality
  - National Identity or Passport Number
  - Company Registration

#### Full KYC - Individual
- **Daily Transaction Limit:** N$20,000
- **Monthly Balance Limit:** N$50,000
- **KYC Requirements:**
  - Full Name
  - Nationality
  - National Identity or Passport Number
  - Residential Address (both Namibians & Non-Citizens)
  - Contact Information (telephone, mobile, email)

#### Full KYC - Business
- **Daily Transaction Limit:** N$50,000
- **Monthly Balance Limit:** N$100,000
- **KYC Requirements:**
  - Full Name
  - Nationality
  - National Identity or Passport Number
  - Residential Address
  - Contact Information (telephone, mobile, email)
  - Company Registration
  - Nature & Location of Business Activity

#### Transaction Validation Rules

**Daily Limit Enforcement:**
- Applies to outgoing transactions: transfers, payments, redemptions
- Sum of all outgoing transactions in calendar day cannot exceed limit
- Tracked in `daily_transaction_totals` table
- Warning at 80% of daily limit

**Monthly Balance Limit Enforcement:**
- Applies to incoming transactions and wallet balance
- Wallet balance cannot exceed monthly limit after incoming transaction
- Example: Lite Individual with N$8,000 balance can only receive N$2,000 more
- Warning at 80% of monthly balance limit

**KYC Upgrade Prompts:**
- When transaction rejected due to limits, system suggests KYC upgrade
- Shows comparison: current tier limits vs upgraded tier limits
- Example: "Upgrade to Full KYC for N$20,000 daily limit"

**Enforcement:** All limits checked before transaction execution in `TransactionValidator` class

---

### PSD-4: Card Transactions

**Full Name:** Determination on the Conduct of Card Transactions within the National Payment System  
**Effective Date:** July 25, 2022  
**Applies To:** Card issuers, acquirers, payment service providers, processors, and merchants

#### Key Definitions

**Payment Card Types:**
- Debit Card - Linked to deposit account
- Credit Card - Credit facility
- Hybrid Card - Combines debit and credit features
- Prepaid Card - Pre-loaded value

**Transaction Types:**
- **Card-Present (CP):** Card physically present at POS/ATM
- **Card-Not-Present (CNP):** Remote transactions (online, phone, mail order)

**Systems:**
- **Closed-Loop:** Card accepted only at issuer's own merchants (e.g., store cards)
- **Interoperable:** Card accepted across multiple institutions' networks

#### Key Prohibitions

**Cross-Border Acquiring Prohibition:**
- Domestic transactions (both parties in Namibia) MUST be acquired domestically
- Cannot use foreign acquirer for domestic merchant transactions
- Purpose: Keep domestic transaction value within Namibia, support local economy

#### Processing Requirements

**Domestic Transactions:**
- POS and ATM domestic transactions MUST be:
  - Processed domestically
  - Cleared domestically
  - Settled domestically
- Ensures transaction data stays within Namibia

**Card-Not-Present (CNP) Transactions:**
- May use international processing with Bank approval
- Requires risk mitigation measures:
  - 3D Secure authentication
  - Address Verification Service (AVS)
  - Card Verification Value (CVV) checks
  - Fraud monitoring systems

#### Exclusions
PSD-4 does NOT apply to specific-purpose closed-loop cards:
- Store cards (single retailer)
- Gift cards
- Membership cards
- Transport cards (e.g., bus fare cards)
- Meal vouchers

---

### PSD-7: National Payment System Efficiency

**Full Name:** Determination on the Efficiency of the National Payment System  
**Effective Date:** December 31, 2014  
**Applies To:** All system participants, payment instrument issuers, and service providers

#### Efficiency Principles

An efficient National Payment System ensures:

1. **Fast Processing**
   - Payments processed quickly
   - Minimal delays in clearing and settlement
   - Real-time or near-real-time transaction confirmation

2. **Safe Processing**
   - Payments processed safely with minimal risk
   - Robust security measures
   - Protection against fraud and errors

3. **Reasonable Cost**
   - Payment services offered at reasonable cost to users
   - Transparent fee structures
   - No excessive charges that restrict access

4. **Risk Management**
   - Systemic risks identified and managed
   - Credit risk, liquidity risk, operational risk mitigated
   - Business continuity plans in place

5. **No Disruption**
   - System operates without significant disruption
   - High availability and reliability
   - Quick recovery from incidents

6. **Delivery-versus-Payment (DvP)**
   - Incorporation of DvP principles where applicable
   - Ensures securities are delivered if and only if payment is made

7. **BIS Principles Adherence**
   - Follows Bank for International Settlements (BIS) principles
   - Core Principles for Financial Market Infrastructures (FMIs)

8. **Payment Finality and Irrevocability**
   - Clear point when payment becomes final
   - Payment cannot be reversed after finality
   - Legal certainty for payment finality

9. **Reliable Service**
   - Services are reliable and meet customer needs
   - Responsive to changing customer requirements
   - Innovation encouraged while maintaining safety

#### Access to Payment System

**Open and Fair Access:**
- Access must be open and flexible
- Competitive environment
- Fair treatment of all participants
- Transparent access criteria
- Equitable rules (no preferential treatment)

**Payment Instruction Processing:**
- Processing order rules must be transparent
- No preferential treatment (e.g., sorting-at-source prohibited)
- First-in-first-out (FIFO) or other transparent rules
- See PSDIR-5 on sorting-at-source prohibition

---

### PSD-8: Administrative Penalties

**Full Name:** Determination on the Imposition of Administrative Penalties in the National Payment System  
**Effective Date:** June 1, 2017  
**Applies To:** All authorized participants in the National Payment System

#### Purpose of Administrative Penalties

1. **Deter Contraventions**
   - Discourage violations of NPS regulations
   - Create financial incentive for compliance

2. **Encourage Remedial Action**
   - Motivate participants to fix non-compliance quickly
   - Reward cooperation with Bank

3. **Reduce Criminal Prosecution**
   - Provide alternative to criminal charges
   - Faster resolution for regulatory violations

#### Assessment Principles (12 Factors)

When determining penalty amount, Bank considers:

1. **Intent:** Was contravention deliberate or negligent?
2. **Reoccurrence Likelihood:** Is participant likely to repeat violation?
3. **Severity:** How serious is the breach?
4. **Duration:** How long did contravention persist?
5. **Cooperation:** Did participant cooperate with Bank investigation?
6. **Economic Benefit:** Did participant gain financially from contravention?
7. **Financial Condition:** What is participant's ability to pay?
8. **Previous History:** Any prior violations?
9. **Remedial Action:** Has participant fixed the issue?
10. **Nature of Business:** Size and scale of participant's operations
11. **Impact on System:** Did breach affect NPS stability or user confidence?
12. **Mitigating Factors:** Any circumstances that reduce culpability?

#### Administrative Sanctions

**Option 1: Warning or Instruction**
- Written warning to cease contravention
- Instructions to take remedial action
- Timeline for compliance
- No financial penalty

**Option 2: Administrative Penalty**
- Financial penalty imposed
- Calculated using risk assessment matrix
- Paid to Bank of Namibia

#### Penalty Amount Calculation

**Maximum Amounts:**
- **Daily Penalty:** Up to N$100,000 per day
- **Total Penalty:** Maximum N$1,000,000 per case
- **Calculation Period:** From date of contravention OR date Bank became aware

**Formula:**
1. Assess severity using 12 principles (Schedule 1)
2. Determine risk level using Risk Assessment Matrix (Schedule 2)
3. Calculate points based on severity and impact
4. Apply penalty amount from Schedule 3

**Schedule 3: Penalty Ranges (by severity points)**
- Low severity: N$10,000 - N$50,000
- Medium severity: N$50,001 - N$200,000
- High severity: N$200,001 - N$500,000
- Critical severity: N$500,001 - N$1,000,000

#### Risk Assessment Matrix (Schedule 2)

**Risk Dimensions:**
- Likelihood of occurrence
- Impact on system
- Impact on customers
- Reputational damage to NPS

**Risk Levels:**
- Low Risk: Minor impact, easily corrected
- Medium Risk: Moderate impact, requires remediation
- High Risk: Significant impact, threatens system integrity
- Critical Risk: Severe impact, systemic threat

#### Due Process
1. Bank issues notice of contravention
2. Participant given opportunity to respond (30 days)
3. Bank reviews response and evidence
4. Bank issues determination (warning or penalty)
5. Participant can appeal to Minister of Finance
6. Penalty must be paid within specified timeframe

---

### PSD-9: Electronic Funds Transfer

**Full Name:** Determination on the Conduct of Electronic Funds Transfer Transactions in the National Payment System  
**Original Effective Date:** April 14, 2023  
**Amendment Effective Date:** September 30, 2024

#### Scope
Governs the conduct of:
- Domestic EFT transactions (debits and credits)
- Cross-border EFT transactions (regional and international)

#### Key Amendment (2024)
- Effective date for determination changed to September 30, 2024
- Includes directive on user fees, charges, and speed for:
  - Cross-border Common Monetary Area (CMA) low-value transactions
  - Effective September 30, 2024

#### Common Monetary Area (CMA) Context
CMA members: Namibia, South Africa, Lesotho, Eswatini
- Shared currency arrangements
- Special rules for cross-border payments within CMA
- Lower cost and faster processing for CMA transactions

---

### PSD-11: Interchange Rates and ATM Fees

**Full Name:** Determination on Interchange Rates and Off-Us ATM Withdrawal Fees  
**Effective Date:** October 1, 2022 (most provisions); August 22, 2022 (fuel transactions)  
**Applies To:** All card participants in interbank card and instant payment transactions

#### Card Interchange Rates

**Retail Transactions:**
- Debit Card: 0.50% of transaction value
- Hybrid Card: 0.75% of transaction value
- Credit Card: 1.55% of transaction value

**Fuel Transactions:**
- Debit Card: 0.50% of transaction value
- Hybrid Card: 0.75% of transaction value
- Credit Card: 0.80% of transaction value (lower than retail)

**Cashback Transactions:**
- Pure Cashback (no purchase): N$1.25 flat fee (paid by issuer to acquirer)
- Cashback with Purchase: N$1.25 for cashback portion + standard retail rate for purchase portion

#### ATM Financial Transactions (Reverse Interchange)

**Successful Withdrawal:**
- Base fee: N$4.00
- Plus: N$0.80 per N$100 withdrawn
- Example: N$500 withdrawal = N$4.00 + (5 × N$0.80) = N$8.00 interchange

**Unsuccessful Withdrawal:**
- Flat fee: N$4.80
- Applies when withdrawal fails (insufficient funds, incorrect PIN, etc.)

#### ATM Non-Financial Transactions (Reverse Interchange)
Flat fee of N$0.60 for:
- Balance enquiry
- Invalid PIN entry
- Insufficient funds message
- Mini-statement request
- PIN change request

#### Instant Payment Interchange Rates

**P2B/P2M Payments at Merchants (Retail & Fuel):**
- Flat rate: 0.40% of transaction value
- Lower than card rates to encourage instant payment adoption

**Cash-In / Cash-Out at Merchant/Agent:**
- Reverse Interchange: N$1.25
- Paid by issuer to merchant/agent

**ATM Transactions (Instant Payment):**
- Financial (Withdrawal):
  - N$4.00 base + N$0.80 per N$100 withdrawn
  - Unsuccessful: N$4.80
- Non-Financial (Balance Enquiry): N$0.60

**Zero Interchange Transactions:**
No interchange fee charged for:
- P2P (Person-to-Person) transfers
- B2P (Business-to-Person) payments
- B2B (Business-to-Business) payments
- B2G (Business-to-Government) payments
- G2P (Government-to-Person) payments (e.g., social grants, vouchers)
- Request to Pay transactions

#### Off-Us ATM Withdrawal Fees (Charged to User)

**Card Transactions:**
- Base fee: N$7.20
- Plus: N$13.70 per N$500 withdrawn or part thereof
- Maximum fee: N$35.00 per withdrawal
- Balance enquiry: N$1.60

**Example Calculations:**
- N$200 withdrawal: N$7.20 + N$13.70 = N$20.90
- N$600 withdrawal: N$7.20 + (2 × N$13.70) = N$34.60
- N$1,500 withdrawal: Capped at N$35.00

**Instant Payment Transactions:**
- Base fee: N$4.80
- Plus: N$9.00 per transaction (flat, not amount-based)
- Balance enquiry: N$1.60
- **First Monthly Withdrawal Free:** Instant payment participants must offer first off-us withdrawal per month at no charge to user

---

### PSD-12: Cybersecurity Standards

**Full Name:** Determination of the Operational and Cybersecurity Standards within the National Payment System  
**Effective Date:** July 1, 2023  
**Applies To:** FMIs, Designated NBFIs, payment system participants, PSPs, and FinTech entities

#### Governance and Accountability

**Board Responsibility:**
- Board of Directors ultimately responsible for cybersecurity
- Must approve cybersecurity policies and frameworks
- Regular board reporting on cyber risks and incidents
- Board training on cyber threats and risk management

**Senior Management Responsibility:**
- Implement board-approved cybersecurity framework
- Day-to-day management of cyber risks
- Allocate adequate resources (budget, personnel, technology)
- Report to board on cybersecurity posture

#### Cybersecurity Framework (5 Pillars)

**1. Identification**
- Identify critical business functions and assets
- Conduct comprehensive risk assessments
- Maintain threat intelligence on emerging cyber threats
- **Penetration Testing:** Every 3 years for critical systems
- Document all systems, networks, and data flows

**2. Protection**
- Implement layered security controls:
  - **Encryption, tokenization, or masking** for all data in transit
  - **Two-Factor Authentication (2FA)** REQUIRED for every payment initiation
  - Firewalls, intrusion prevention systems
  - Access controls (least privilege principle)
  - Secure coding practices
- Third-party security agreements
- Staff training on cybersecurity

**3. Detection**
- Continuous monitoring of systems and networks
- Real-time fraud detection
- Security Information and Event Management (SIEM)
- Anomaly detection for unusual patterns
- Log aggregation and analysis

**4. Response**
- Incident response plan documented and tested
- Incident response team identified
- Communication protocols for breaches
- Evidence preservation procedures
- Regulatory notification requirements

**5. Recovery**
- Business continuity plans
- Disaster recovery procedures
- Regular testing of recovery capabilities
- Data backup and restoration processes

#### Mandatory Security Standards

**Two-Factor Authentication (2FA):**
- **REQUIRED for EVERY payment initiation**
- Applies to:
  - Payment instruments (cards, e-wallets)
  - Payment websites
  - Mobile applications
- Must use combination of:
  - Something you know (password, PIN)
  - Something you have (device, OTP token)
  - Something you are (biometric)

**Data Protection:**
- Encryption/tokenization/masking for data in transit
- Secure storage of customer data
- Data minimization (only collect necessary data)
- Customer consent for data use

#### Risk Indicators and Tolerance Levels

**Uptime/Availability of Critical Systems:**
- **Target: 99.9%** minimum
- Calculation: (Total time - Downtime) / Total time
- Critical systems: Payment processing, authentication, clearing/settlement

**Recovery Time Objective (RTO):**
- **Target: Within 2 hours**
- Maximum time to restore critical systems after incident
- Measured from incident start to full service restoration

**Recovery Point Objective (RPO):**
- **Target: 5 minutes** for critical systems
- Maximum acceptable data loss period
- Requires frequent backups and transaction logging

**Testing Requirements:**
- **Response/Resumption/Recovery Plans:** 2 successful tests per year minimum
- Tests must simulate realistic failure scenarios
- Document test results and lessons learned
- Update plans based on test findings

#### Incident Reporting
- Immediate notification to Bank of Namibia for:
  - Security breaches
  - System outages > 30 minutes
  - Fraud incidents > N$10,000
  - Data breaches affecting customer information
- Full incident report within 72 hours
- Post-incident review and remediation plan

---

### PSD-13: Systemically Important Systems

**Full Name:** Determination on the Designation of Systemically Important Systems and Authorisation of Financial Market Infrastructures in Namibia  
**Effective Date:** November 26, 2024  
**Applies To:** Payment system operators and payment service providers authorized under PSMA 2023

#### Systemically Important System Definition
A payment system that has significant impact on the National Payment System and is capable of triggering or transmitting disruptions among participants or to the entire NPS if not sufficiently protected against risk.

#### Designation Criteria

Bank may designate a system as systemically important based on:

1. **Degree of Systemic Risk**
   - Would disruption impact efficient functioning of NPS?
   - Effect on system participants and public confidence?

2. **Market Share**
   - Is system widely used in Namibia?
   - Processes ≥30% of total volume of interbank transactions annually?
   - Handles >30% of annual value of interbank transactions?

3. **National Interest**
   - Is designation in interest of NPS per PSMA objectives?

4. **Public Interest**
   - Would designation protect public interest?

5. **Cross-Border Activities**
   - Involves multiple countries?
   - Significant cross-border transaction volumes/values?

6. **Volume of Transactions**
   - Threshold: 30% or more of interbank transaction volume

7. **Value of Transactions**
   - Threshold: 30% or more of high-value payment value

8. **Inter-dependency Among Participants**
   - Number of direct and indirect participants
   - Potential cascade effect of failure

9. **Degree of Interoperability**
   - Connected to national/regional/international systems?
   - Critical for cross-system transactions?

#### Financial Market Infrastructure (FMI) Authorization

**FMI Criteria:**
- Systemically important (usually prerequisite)
- Degree of substitutability (is there alternative?)
- Recovery and resolution impact
- Interconnectedness with other FMIs
- Concentration of financial risk
- Visibility requirements for risk management

**Enhanced Oversight:**
- Designated FMIs subject to:
  - More frequent inspections
  - Additional reporting requirements
  - Compliance with Principles of Financial Market Infrastructures (PFMI)
  - Recovery and resolution planning

#### Designation Process
1. Bank assesses system against criteria
2. Bank notifies PSP/PSO of intention to designate
3. PSP/PSO has 30 business days to respond
4. Bank considers response and makes final decision
5. Bank publishes designation in Government Gazette
6. Designation includes terms and conditions

---

### PSD-6: Payment System Operators Authorization

**Full Name:** Determination for the Authorisation of Payment System Operators and System Participants in the National Payment System  
**Effective Date:** June 21, 2024  
**Applies To:** Persons intending to operate payment systems and system participants

#### Authorization Requirements for Payment System Operators

**Governance:**
- Memorandum and articles of association
- Certificate of incorporation
- Company profile and organizational structure
- Beneficial ownership information (25% threshold)

**Board Composition:**
- Equal number of independent non-executive directors and executive directors
- Plus independent non-executive chairperson
- Fitness and probity assessment for all directors

**Risk Management Framework:**
Must address:
- Operational risk
- Outsourcing risk
- Fraud risk
- Money laundering/terrorism financing risk
- Cyber security risk
- Reputational and legal risk
- Liquidity risk
- Credit risk and counterparty risk
- Data protection and privacy risk

**Technical Requirements:**
- Operational and technical capability assessment
- Interoperability confirmation with banks/clearing house
- System reliability and efficiency controls
- Minimum service level targets
- Business continuity plans

**Payment System Rules (for Bank approval):**
- Governance, management, and operations
- Access criteria for participants
- Suspension/exclusion/termination conditions
- Risk management procedures
- Payment finality determination
- Common execution/clearing/settlement standards
- Business continuity procedures
- Fees, charges, and penalties
- Rights and obligations of participants

#### Compliance Requirements
- Annual capacity and performance testing
- Stress testing under extreme scenarios
- Penetration security testing annually (by independent expert every 2 years)
- Annual audited financial statements (within 3 months of year end)
- Fitness and probity updates for board changes

#### Suspension/Revocation Grounds
- Contravention of Act or determinations
- Operating in manner detrimental to NPS stability
- Failure to operate for 12 consecutive months
- No longer meets requirements
- Misrepresentation in application
- Public interest concerns

#### Fees (per Payment System Notice 2025)
- Application fee: N$5,000
- Authorization fee: N$20,000
- Annual renewal: N$20,000

---

### Fraud Detection (NPS Fraud Trend Report 2013-2022)

**Total Fraud (10 Years):**
- **Incidents:** 66,200
- **Total Value:** N$158.9 million
- **Trend:** Increasing sophistication and online fraud

---

#### Card Fraud (95% of incidents, 38% of value)

**Total Card Fraud:**
- **Incidents:** 63,000+ (95% of all fraud)
- **Value:** N$60.3 million (38% of total)

**Card-Not-Present (CNP) Fraud - MOST FREQUENT**
- **Incidents:** 53,600 (most common card fraud type)
- **Value:** N$31.6 million
- **Peak Year:** 2021 (surge during COVID-19)
- **Causes:**
  - Increased online shopping during pandemic
  - Inadequate security on e-commerce websites
  - Lack of 3D Secure implementation
  - CVV not always verified
- **Risk Factors:**
  - Online purchases
  - Telephone orders
  - Mail order transactions
  - Lack of physical card verification

**Lost/Stolen Card Fraud**
- Physical card lost or stolen
- Unauthorized use before cardholder reports
- Prevention: Immediate card blocking, SMS alerts

**Forged/Counterfeit Card Fraud**
- Card skimming at compromised POS/ATM
- Card cloning with copied magnetic stripe
- Prevention: EMV chip cards, regular terminal inspections

**Card Not Received (Issued Card)**
- Card intercepted during delivery
- Fraudster activates and uses card
- Prevention: Secure delivery, activation requirements

---

#### EFT Fraud (1% of incidents, 10% of value)

**Total EFT Fraud:**
- **Incidents:** 660 (1% of all fraud)
- **Value:** N$15.8 million (10% of total)

**Phishing - MOST FREQUENT EFT FRAUD**
- **Incidents:** 345 (92.5% of EFT incidents)
- **Value:** N$11.1 million (77% of EFT value)
- **Method:**
  - Fake emails/SMS pretending to be from bank
  - Requests for login credentials, PIN, or OTP
  - Fake banking websites (look-alike URLs)
  - Social engineering to gain trust
- **Prevention:**
  - User education on phishing
  - URL verification before login
  - Never share OTP/PIN
  - Official communication channels only
  - Anti-phishing filters

**SIM Card Swopping**
- Fraudster obtains duplicate SIM card for victim's phone number
- Intercepts SMS OTPs and banking notifications
- Takes over mobile banking and e-wallet accounts
- Prevention: SIM swap detection, multi-factor authentication beyond SMS

**Denial-of-Service Attacks**
- System overwhelmed with requests
- Prevents legitimate transactions
- Prevention: DDoS protection, rate limiting, redundant infrastructure

---

#### E-Money Fraud (3% of incidents, 19% of value)

**Total E-Money Fraud:**
- **Incidents:** 2,000 (3% of all fraud)
- **Value:** N$30.1 million (19% of total)

**Phone Call Scams - MOST FREQUENT E-MONEY FRAUD**
- **Incidents:** 2,100 (most common e-money fraud)
- **Value:** N$27.1 million
- **Method:**
  - Fraudster calls victim pretending to be from service provider
  - Creates urgency (account will be blocked, winning prize, family emergency)
  - Requests user to transfer money or share OTP
  - Social engineering tactics
- **Common Scenarios:**
  - "Your account is suspended, send N$X to reactivate"
  - "You won a prize, pay N$X processing fee"
  - "Family member arrested, send bail money"
  - "System upgrade, verify account with OTP"
- **Prevention:**
  - Never share OTP over phone
  - Service providers never request money via phone
  - Verify caller identity through official channels
  - User education campaigns

**SIM Card Swopping (E-Money)**
- **Incidents:** 45
- **Value:** N$3.4 million
- Similar to EFT SIM swopping but targets e-wallets
- Higher value per incident than phone scams
- Prevention: Enhanced SIM swap verification, device fingerprinting

---

#### Cash Fraud (1% of incidents, 33% of value)

**Total Cash Fraud:**
- **Incidents:** 660 (1% of all fraud)
- **Value:** N$52.3 million (33% of total - highest value category)

**Cash Counterfeits - MOST INCIDENTS**
- **Percentage:** 46.7% of cash fraud incidents
- Fake banknotes in circulation
- Detection: UV light, watermarks, security threads
- Prevention: Staff training, counterfeit detection machines

**External Theft - MOST VALUE**
- **Value:** N$36.6 million (most valuable cash fraud type)
- Robberies at ATMs, cash-in-transit, bank branches, agents
- Armed robberies and burglaries
- Prevention: Security guards, surveillance, cash limits, insurance

**Internal Theft**
- Theft by employees or insiders
- Includes embezzlement and misappropriation
- Prevention: Dual control, segregation of duties, audit trails, background checks

---

#### Fraud Prevention Best Practices

**For Card Fraud:**
1. Implement 3D Secure for all CNP transactions
2. Mandatory CVV verification
3. Address Verification Service (AVS)
4. Real-time fraud monitoring
5. SMS alerts for all transactions
6. EMV chip cards (not magnetic stripe)
7. Regular terminal security inspections

**For EFT/E-Money Fraud:**
1. User education on phishing and scams
2. Never share OTP, PIN, or passwords
3. Verify communication authenticity
4. Multi-factor authentication beyond SMS
5. Device fingerprinting and anomaly detection
6. Transaction velocity checks (10+ transactions/hour flagged)
7. SIM swap detection and alerts

**For Cash Fraud:**
1. Counterfeit detection training and equipment
2. Cash handling limits and dual control
3. Secure cash-in-transit procedures
4. Surveillance systems at agent locations
5. Insurance coverage
6. Regular audits and reconciliation

**AML/CFT Compliance:**
- High-value transaction threshold: N$100,000 (triggers compliance review)
- Velocity monitoring: >10 transactions per hour flagged
- Politically Exposed Person (PEP) checks
- Enhanced due diligence for suspicious patterns
- Suspicious Transaction Reports (STR) to Financial Intelligence Centre

---

## Transaction Workflows

### P2P (Person-to-Person) Transfer

**Endpoint:** `POST /api/v1/mobile/send-money` or `POST /api/v1/mobile/transactions/send`

**Workflow:**
1. **Input Validation**
   - Recipient identifier (wallet number, phone, or user ID)
   - Amount (must be > 0)
   - Description (optional)

2. **Pre-Transaction Validation**
   - Sender wallet exists and is 'active'
   - Recipient wallet exists and is 'active'
   - Amount > 0
   - Sender balance sufficient (including fees)

3. **Limit Checks**
   - Check sender's daily transaction limit (based on KYC tier)
   - Check sender's daily usage (sum of today's outgoing transactions)
   - Check recipient's monthly balance limit (wallet + incoming amount)

4. **AML/CFT Checks**
   - If amount ≥ N$100,000: Create compliance alert for review
   - Check transaction velocity (>10 transactions/hour = anomaly)
   - Check sender/recipient PEP status

5. **Transaction Execution (Atomic)**
   - BEGIN transaction
   - Lock sender wallet (`SELECT ... FOR UPDATE`)
   - Lock recipient wallet (`SELECT ... FOR UPDATE`)
   - Debit sender wallet
   - Credit recipient wallet
   - Create transaction records for both parties
   - Update daily transaction totals
   - COMMIT transaction
   - If any step fails: ROLLBACK

6. **Post-Transaction**
   - Send notifications to sender and recipient
   - Update transaction status to 'completed'
   - Record audit log

**Fee Structure:** Per PSD-11, P2P transfers have **zero interchange fee**

**Transaction Types:**
- `transfer_out` - Sender's transaction record
- `transfer_in` - Recipient's transaction record

---

### Voucher to Wallet Redemption

**Endpoint:** `POST /api/v1/mobile/vouchers/:id/redeem` (method='wallet')

**Workflow:**
1. **Validation**
   - Voucher exists
   - Voucher belongs to user
   - Voucher status is 'available' (not already redeemed)
   - Voucher not expired (`expires_at > NOW()`)
   - Target wallet exists and is 'active'

2. **Atomic Redemption Transaction**
   - BEGIN transaction
   - Lock voucher record (`SELECT ... FOR UPDATE`)
   - Lock wallet record (`SELECT ... FOR UPDATE`)
   - Update voucher status to 'redeemed'
   - Credit wallet with voucher amount
   - Create `voucher_redemptions` record (method='wallet')
   - Create `wallet_transaction` record (type='redemption')
   - COMMIT transaction
   - If any step fails: ROLLBACK entire operation

3. **Real-Time Processing**
   - Per PSD-3 Section 13.3: Real-time processing required
   - Funds available in wallet immediately
   - User receives instant confirmation

4. **Post-Redemption**
   - SMS notification to user
   - Update voucher statistics
   - Audit log entry

**No Fees:** Voucher redemption has no transaction fees (G2P benefit)

---

### Loan Application and Disbursement

**Loan Application Endpoint:** `POST /api/v1/mobile/loans/apply`

**Workflow:**
1. **Eligibility Check**
   - Query total redeemed voucher value: `SELECT SUM(amount) FROM voucher_redemptions WHERE user_id = ?`
   - Calculate max loan: `maxLoan = totalRedeemed * 0.5`
   - Check requested amount ≤ maxLoan
   - Verify no existing 'pending' or 'active' loans

2. **Risk Assessment**
   - Get user's KYC tier for interest rate determination
   - Check credit_score (if available)
   - Calculate account age

3. **Interest Rate Assignment**
   - Enhanced KYC: 3%
   - Standard KYC: 5%
   - Basic KYC: 7%
   - Default: 15%

4. **Loan Creation**
   - Calculate total repayment: `amount * (1 + interest/100)`
   - Create loan record with status='pending'
   - Loan requires approval before disbursement

**Loan Disbursement Endpoint:** `POST /api/v1/mobile/loans/:id/disburse`

**Workflow:**
1. Verify loan exists and status='pending'
2. Verify loan belongs to user
3. Atomic transaction:
   - Update loan status to 'active'
   - Set `disbursed_at` timestamp
   - Credit user's wallet with loan amount
   - Create wallet_transaction (type='loan_disbursement')
4. Send confirmation to user

**Loan Repayment Endpoint:** `POST /api/v1/mobile/loans/:id/repay`

**Workflow:**
1. **Validation**
   - Loan exists and status='active'
   - Loan belongs to user
   - Payment amount ≥ total_repayment (full repayment only)
   - User wallet has sufficient balance

2. **Atomic Repayment Transaction**
   - BEGIN transaction
   - Lock wallet (`SELECT ... FOR UPDATE`)
   - Debit wallet with repayment amount
   - Update loan status to 'repaid'
   - Set `repaid_at` timestamp
   - Create wallet_transaction (type='loan_repayment')
   - COMMIT transaction
   - If any step fails: ROLLBACK

3. **Post-Repayment**
   - User notified of successful repayment
   - User now eligible for new loan

---

### Group Split Bill Payment

**Create Split Endpoint:** `POST /api/v1/mobile/groups/:groupId/split`

**Workflow:**
1. **Validation**
   - User is active group member
   - Total amount: N$1 - N$100,000
   - Title: 3-200 characters
   - Split type: 'equal' or 'custom'

2. **Share Calculation**
   - **Equal Split:** `shareAmount = totalAmount / activeMemberCount`
   - **Custom Split:** Validate sum of shares = total amount (tolerance 0.01)

3. **Split Creation (Atomic)**
   - Create split_request record (status='pending')
   - Create split_shares for each member
   - All shares start with status='pending'

**Pay Split Share Endpoint:** `POST /api/v1/mobile/groups/:groupId/splits/:splitId/pay`

**Workflow:**
1. **Validation**
   - User has unpaid share in this split
   - Share status='pending' (not already 'paid')
   - Source wallet exists, is active, has sufficient balance
   - Currency matches (NAD)

2. **Payment Execution (Atomic)**
   - BEGIN transaction
   - Lock source wallet
   - Lock group wallet
   - Debit member's wallet with share amount
   - Credit group wallet with share amount
   - Create transaction record (type='split_payment')
   - Update share status to 'paid' with timestamp
   - Check if all shares paid:
     - If yes: Update split_request status to 'completed'
     - If no: Split remains 'pending'
   - COMMIT transaction

3. **Notifications**
   - Payer receives payment confirmation
   - Group admin receives progress update
   - If split completed: All members notified

**Reminder Endpoint:** `POST /api/v1/mobile/groups/:groupId/splits/:splitId/remind`
- Only split creator or group admin can send reminders
- Queries unpaid shares
- Sends notifications to members with pending shares

---

## Compliance and Regulatory Framework

### Know Your Customer (KYC) Requirements

#### KYC Tiers (per Payment System Notice 2025 Table 4)

**Lite KYC:**
Required information:
- Full Name
- Nationality
- National Identity Number or Passport Number
- Company Registration (for businesses only)

**Full KYC:**
Required information:
- Full Name
- Nationality
- National Identity Number or Passport Number
- Residential Address (both Namibians & Non-Citizens)
- Contact Information (telephone number, mobile number, email address)
- Company Registration (for businesses)
- Nature & Location of Business Activity (for businesses)

#### KYC Document Requirements (Full KYC)

**Individual Verification:**
- National ID or Passport (certified copy)
- Proof of residence (utility bill, bank statement < 3 months old)
- Selfie photo for biometric verification

**Business Verification:**
- Company registration certificate
- Certificate of incorporation
- Directors' IDs
- Proof of business address
- Business license (where applicable)

#### KYC Verification Process
1. User submits KYC documents via app
2. System creates `kyc_submissions` record (status='PENDING')
3. Compliance team reviews documents
4. Verification statuses: 'PENDING', 'APPROVED', 'REJECTED'
5. If approved:
   - Update `users.kyc_tier` to 'full'
   - Update `users.kyc_verified` to true
   - Set `kyc_verified_at` timestamp
   - Increase transaction limits immediately
6. If rejected:
   - Set `rejection_reason`
   - User can resubmit with corrections

#### KYC Expiry and Renewal
- Full KYC expires after period determined by risk assessment
- Compliance monitoring flags expiring KYC (30 days before expiry)
- Expired KYC requires renewal before higher limits continue
- System tracks: `kyc_expires_at` timestamp

---

### Financial Intelligence Act (FIA) Compliance

#### AML/CFT Requirements

**Customer Due Diligence (CDD):**
- Performed based on KYC tier
- Enhanced due diligence for:
  - Politically Exposed Persons (PEPs)
  - High-risk jurisdictions
  - High-value transactions (≥N$100,000)

**Transaction Monitoring:**
- Real-time monitoring for suspicious patterns
- Thresholds:
  - Single transaction ≥ N$100,000: Compliance alert
  - Velocity >10 transactions per hour: Flag for review
  - Unusual geographic patterns
  - Round-number transactions (potential structuring)

**Suspicious Transaction Reporting (STR):**
- Reported to Financial Intelligence Centre (FIC)
- Timeline: As soon as suspicious activity identified
- Report includes: Transaction details, customer info, reason for suspicion
- Confidential: Customer not informed of STR

**Record Keeping:**
- Transaction records: 7 years minimum
- CDD records: 7 years after relationship ends
- Format: Must be retrievable and auditable
- Access: Available to FIC and Bank of Namibia on request

**PEP Identification:**
- Maintain PEP database
- Flag PEP accounts: `users.is_pep = true`
- Enhanced due diligence for PEP transactions
- More frequent reviews and monitoring

---

### Electronic Transactions Act, 2019

**Full Name:** Electronic Transactions Act 4 of 2019  
**Purpose:** Legal framework for electronic transactions, ensuring legal recognition and promoting e-commerce and e-government

#### Legal Recognition

**Data Messages:**
- Electronic information not invalid solely because it's electronic
- Same legal effect as paper documents when requirements met
- "Data message" includes email, SMS, electronic records, app data

**Electronic Signatures:**
- Legally recognized if reliable and appropriate
- Advanced Electronic Signature requirements:
  - Uniquely linked to signatory
  - Capable of identifying signatory
  - Created using means under signatory's sole control
  - Linked to data in manner that any subsequent change is detectable

#### Retention of Electronic Records

Records are admissible if:
1. **Accessible:** Information available for subsequent reference
2. **Complete:** Retained in format originally generated, sent, or received
3. **Unaltered:** Maintains integrity of information
4. **Identifies:** Origin, destination, date and time of sending/receiving

#### Admissibility of Computer Evidence

**Legal Proceedings:**
- Electronic records admissible as evidence
- Court assesses evidential weight based on:
  - Reliability of system that generated record
  - Reliability of system that stored record
  - Integrity of information system used
  - Identification of originator
  - Any other relevant factors

**Presumptions:**
- Electronic records presumed accurate unless proven otherwise
- Timestamps presumed correct unless disputed
- Digital signatures presumed valid unless challenged

#### Electronic Contracts

**Formation and Validity:**
- Contracts not invalid solely because formed electronically
- Offer and acceptance can be electronic
- Contract formed when acceptance communicated to offeror
- Electronic contracts binding like paper contracts

#### Consumer Protection (Not Yet in Force - Future Provisions)

**Supplier Information Requirements:**
- Business name, registration, and contact details
- Full description of goods/services
- Total price including all fees and taxes
- Delivery arrangements and costs
- Payment options and security
- Return and refund policy

**Cooling-Off Period:**
- 7 days for consumers to cancel electronic transactions
- Exceptions (no cooling-off):
  - Financial services
  - Goods made to specification
  - Perishable goods
  - Software downloads
  - Services already performed

**Unsolicited Communications:**
- Must provide opt-out facility
- Cannot send further communications after opt-out
- Penalties for non-compliance

**Supplier Liability:**
- Suppliers liable for insecure payment systems
- Must implement reasonable security measures
- Liable for losses due to inadequate security

#### Service Provider Liability

**Limited Liability (Safe Harbors):**

1. **Mere Conduit:** Not liable if only transmitting data
2. **Caching:** Not liable for temporary automatic storage
3. **Hosting:** Not liable for user content if:
   - No actual knowledge of unlawful content
   - On receiving notice, acts expeditiously to remove
4. **Information Location Tools:** Not liable for linking to unlawful content if acts on notice

**Take-Down Notice:**
- Must be in writing
- Identify unlawful material with URL/location
- Statement of unlawfulness and supporting facts
- Contact details of complainant
- Service provider must act expeditiously on valid notice

---

### NAMQR Code Standards

**Purpose:** Standardize QR code payments for interoperability, safety, and security across all acquirers in Namibia

#### Transaction Flows

**Payee-Presented QR Code:**
1. Merchant displays QR code at checkout
2. Customer scans QR code with mobile banking/e-wallet app
3. App decodes NAMQR parameters (merchant ID, amount, reference)
4. Customer confirms payment
5. Payment instruction sent to customer's bank/e-money issuer
6. Issuer debits customer account
7. Acquirer credits merchant account
8. Customer and merchant receive confirmation

**Payer-Presented QR Code:**
1. Customer displays QR code from mobile app
2. Merchant scans customer's QR code
3. Merchant enters transaction amount
4. Merchant confirms transaction
5. Payment instruction routed to customer's issuer
6. Customer receives push notification to approve
7. Customer approves with PIN/biometric
8. Payment processed (same as payee-presented steps 6-8)

**USSD Channel Flow (For Feature Phones):**
1. Customer dials USSD code (e.g., `*123#`)
2. Customer enters merchant code from physical sign
3. Customer enters amount
4. System displays merchant name for confirmation
5. Customer confirms with PIN
6. Payment processed
7. Customer receives SMS confirmation

#### Security Features

**Token Vault:**
- Secure storage of NAMQR parameters
- Tokenization of sensitive data
- Prevents exposure of account details

**Security Risks and Mitigation:**
- **Tampering:** QR code altered to redirect funds → Digital signatures, secure generation
- **Spoofing:** Fake QR code overlays genuine code → Merchant verification, secure displays
- **Data Theft:** QR code intercepted → Encryption, tokenization, limited validity period
- **Replay Attacks:** QR code reused → One-time tokens, transaction nonces, expiry times

#### Interoperability
- All banks and e-money issuers must accept NAMQR codes
- Standardized format ensures cross-platform compatibility
- Promotes financial inclusion (no need for specific app)

---

### Open Banking Standards (Namibia)

**Version:** 1.0  
**Finalized:** April 25, 2025  
**Context:** Bank of Namibia Position Paper (October 31, 2022) initiated Open Banking program

#### Open Banking Definition
Allows Account Holders to instruct their Payment Service Providers (Banks) to provide their data to Third Party Providers (TPPs), so data can be used to benefit the Account Holder who owns the data.

#### Key Actors

**Data Provider:**
- Banking institutions holding customer accounts
- E-money issuers with customer wallets
- Provide APIs for TPPs to access data (with customer consent)

**Third-Party Provider (TPP):**
- FinTech companies, apps, and services
- Access customer data via APIs (with consent)
- Build value-added services: credit checking, accounting, financial management, tax filing

**Account Holder:**
- Individual or business with account at Data Provider
- Owns the data
- Grants consent for TPPs to access data

**Scheme Manager:**
- Oversees Open Banking framework
- Manages participant registration
- Monitors compliance

#### API Use Cases

**Supported Sectors:**
- Banking (initial phase)
- Future: Insurance, investments, pensions

**Supported Services:**
- Account Information Services (AIS): Read account balances, transactions, details
- Payment Initiation Services (PIS): Initiate payments on behalf of account holder
- Confirmation of Funds Services (CoF): Verify sufficient funds available

**Resource Objects (Banking):**
- Accounts (balance, details, type)
- Transactions (history, details)
- Beneficiaries (saved recipients)
- Standing Orders (recurring payments)
- Direct Debits (authorized recurring debits)
- Scheduled Payments (future-dated payments)

#### Consent Management

**Consent Principles:**
1. **Explicit Consent:** Account holder must explicitly grant consent (no implicit consent)
2. **Informed Consent:** Clear explanation of what data will be shared and how it will be used
3. **Granular Consent:** Account holder can consent to specific data/services, not all-or-nothing
4. **Revocable Consent:** Account holder can revoke consent at any time
5. **Time-Limited:** Consent expires after maximum duration

**Consent Scopes:**
- Account balance: Read current balance
- Transaction history: Read past transactions (specify date range)
- Account details: Read account holder name, account number
- Payment initiation: Authorize TPP to make payments
- Standing orders: Read recurring payment arrangements

**Maximum Consent Duration:**
- Account Information: 90 days maximum
- Payment Initiation: Per transaction or 90 days for recurring
- Customer can revoke earlier

**Strong Customer Authentication (SCA):**
- Required for payment initiation
- 2FA: Two independent factors from:
  - Knowledge (password, PIN)
  - Possession (device, token)
  - Inherence (biometric)

#### Participant Registration

**Registration Paths:**
- Data Provider: Bank/e-money issuer providing APIs
- TPP: Third-party accessing APIs
- Combined: Entity playing both roles

**Provisioning:**
- OAuth 2.0 for authorization
- OpenID Connect for authentication
- TLS certificates for secure communication
- API keys and client credentials

**Testing:**
- Sandbox environment for testing
- Certification before production access
- Ongoing monitoring of API usage

#### Service Level Standards

**TPP towards Data Providers:**
- Professional conduct
- Respect rate limits
- Handle data securely
- Notify Data Provider of security incidents

**Data Provider towards TPPs:**
- API uptime: 99.5% minimum
- Response time: <3 seconds for 95% of requests
- Advance notice of planned maintenance
- Support for TPP integration issues

#### Ongoing Management

**Transaction Reporting:**
- Daily API usage statistics
- Monthly transaction volumes
- Quarterly compliance reports

**Dispute Resolution:**
- Helpdesk for TPPs
- Incident management procedures
- Dispute types: Technical, commercial, compliance
- Service levels: Response within 2 business days, resolution within 10 business days

---

### FinTech Regulatory Framework (Bank of Namibia)

**Purpose:** Guidance for FinTech innovations not covered by existing regulations

#### FinTech Innovation Definition
Includes:
- New payment methods and instruments
- Digital lending platforms
- InsurTech solutions
- RegTech and SupTech
- **Virtual Asset Service Providers (VASPs)**
- Robo-advisors
- Crowdfunding platforms

#### Regulatory Objectives
1. Protect customer funds
2. Maintain financial system stability
3. Ensure cyber security and data security
4. Safe access to payment systems
5. Promote interoperability
6. Reduce cross-border remittance costs
7. Foster financial inclusion
8. Enhance financial system efficiency

#### 4-Stage Analytical Framework

**Stage 1: Identification**
- FinTech innovator submits proposal to Bank
- Bank identifies innovation type and potential

**Stage 2: Regulatory Status**
- Bank determines if existing regulations apply
- Identifies regulatory gaps

**Stage 3: Risk Assessment**
- Assess risks: Financial stability, consumer protection, security, AML/CFT
- Determine risk profile: Low, Medium, High

**Stage 4: Decision on Regulatory Programme**
- Admit to Allow-and-See Programme
- Admit to Regulatory Sandbox Programme
- Reject (too risky or non-compliant)

#### Regulatory Programmes

**Allow-and-See Programme**

**Characteristics:**
- Innovation goes live with minimal restrictions
- Observed and monitored by Bank
- Full market access (no customer limits)
- No transaction or balance limits (subject to FIA and Exchange Control)
- Security testing generally not required (unless high risk)
- Suitable for: Lower-risk innovations, proven technologies

**Conditions:**
- Financial Intelligence Act (FIA) and AML/CTF/CPF regulations ALWAYS apply (cannot be relaxed)
- No admission or participation fees
- Bank publishes non-confidential information about innovation
- Innovator bears all liability for losses
- Well-defined exit strategy required
- Quarterly reporting to Bank
- Bank can remove from programme for non-compliance

---

**Regulatory Sandbox Programme**

**Characteristics:**
- Innovation tested in controlled live environment
- Testing period: 6-18 months
- Limited customers/market segment
- Transaction limits set case-by-case based on risk profile
- Vulnerability and penetration testing reports required
- Suitable for: Higher-risk innovations, unproven technologies

**Restrictions:**
- Customer limit: Set by Bank (e.g., 1,000 customers)
- Market segment restrictions (e.g., region, demographics)
- Transaction limits based on risk:
  - Low risk: N$5,000/day per customer
  - Medium risk: N$1,000/day per customer
  - High risk: N$500/day per customer (examples - actual limits set case-by-case)
- Balance limits similarly defined

**Testing Requirements:**
- Vulnerability assessment before launch
- Penetration testing by certified third party
- Security audit reports
- Regular testing during sandbox period

**Exit from Sandbox:**
- After successful testing: Graduate to full authorization or Allow-and-See
- If unsuccessful: Wind down with customer protection measures
- Exit strategy must be defined before entering sandbox

**Conditions (Same as Allow-and-See):**
- FIA Act and AML/CTF/CPF always apply
- No fees
- Bank publishes non-confidential info
- Innovator liability
- Exit strategy required
- Monthly reporting (more frequent than Allow-and-See)

#### Key Principle: FIA Compliance is Non-Negotiable
- Financial Intelligence Act requirements ALWAYS apply
- AML (Anti-Money Laundering) cannot be relaxed
- CTF (Counter-Terrorism Financing) cannot be relaxed
- CPF (Counter-Proliferation Financing) cannot be relaxed
- No regulatory sandbox participant exempt from FIA

#### Exchange Control
- Exchange Control Regulations always apply
- Cannot be relaxed in sandbox
- Cross-border transactions require Bank approval
- Limits on foreign currency transactions

---

### Virtual Assets Act, 2023

**Applies To:** Virtual Asset Service Providers (VASPs)  
**Regulatory Authority:** Bank of Namibia (designated by Minister)

#### Virtual Asset Definition
Digital representation of value that:
1. Can be digitally transferred, stored, or traded
2. Uses Distributed Ledger Technology (DLT) or similar technology (blockchain)
3. Can be used for payment or investment purposes

**Exclusions:**
- Digital representations of fiat currencies (e.g., e-money)
- Securities or other financial assets regulated under securities law

**Smartpay Context:** Smartpay vouchers and e-money are NOT virtual assets (see analysis in Product Features > Vouchers > Regulatory Classification)

#### Virtual Asset Services (Part 1 of Schedule 2)
- Initial token offering
- Exchanging virtual asset for virtual asset or for fiat
- Transfer of virtual assets
- Operating a virtual asset exchange
- Safekeeping/administration of virtual assets
- Participation in/provision of financial services related to token issuer's offer/sale

#### Excluded Services (Part 2 of Schedule 2)
**Closed-Loop Items** - NOT virtual asset services if:
- Non-transferable
- Non-exchangeable
- Cannot be used for payment or investment purposes
- Cannot be sold on secondary market outside closed-loop system

Examples: Store loyalty points, gift cards (single retailer), transport tokens (bus fare)

#### Licensing Requirements for VASPs
- Fit and proper person assessment
- Adequate capital and financial resources
- Robust risk management framework
- AML/CFT compliance (FIA Act)
- Customer due diligence procedures
- Cyber security measures
- Safekeeping of client virtual assets (cold storage, insurance)

#### Consumer Protection
- Prospectus for initial token offerings
- Disclosure of risks
- Purchaser's right to rescission or damages
- Purchaser's right of withdrawal (cooling-off period)
- Prevention of market abuse

#### Administrative Sanctions
- For non-compliance with Virtual Assets Act
- Similar framework to PSD-8
- Penalties determined by Regulatory Authority (Bank of Namibia)

---

### Payment System Management Act (PSMA), 2023

**Act Number:** Act 14 of 2023  
**Effective Date:** July 28, 2023  
**Purpose:** Comprehensive framework for payment, clearing, and settlement systems in Namibia

#### Key Definitions

**National Payment System (NPS):**
Entire payments ecosystem including:
- Payment systems, clearing systems, settlement systems
- Rules, standards, arrangements, procedures
- Laws, agreements, technologies
- Payment instruments and institutions

**Payment Services:**
- Facilitation of payment instructions
- Issuance and acquiring of payment instruments
- Electronic money issuance
- Other services incidental to executing payments
- Specified in Act Schedule

**Agent:**
Entity appointed by payment service provider or system participant to perform certain payment services on behalf of the PSP/participant

**Settlement:**
Discharge of payment obligations between system participants
- Uses settlement accounts at Bank of Namibia
- Final and irrevocable once settled

**Systemic Risk:**
Risk that failure of one participant causes cascade failure of other participants, threatening entire NPS stability

#### Bank of Namibia Powers (Section 3)

**Oversight Powers:**
- License payment service providers
- Authorize payment system operators
- Designate systemically important systems
- Issue determinations, directives, guidelines
- Inspect and investigate participants
- Impose administrative penalties
- Ensure NPS is accessible, safe, secure, efficient, and effective

**Regulatory Tools:**
- **Determinations:** Binding rules (e.g., PSDs 1-13)
- **Directives:** Specific instructions to participants
- **Guidelines:** Best practice guidance
- **Circulars:** Informational communications
- **Notices:** Formal announcements

#### Payments Association of Namibia

**Mandate:**
- Promote efficiency and safety of NPS
- Develop industry standards and best practices
- Facilitate cooperation among participants
- Resolve disputes between members
- Represent industry to Bank and government

**Membership:**
- Banking institutions
- Licensed payment service providers
- Authorized payment system operators
- Non-bank financial institutions offering payment services

#### Licensing and Authorization

**Payment Service Providers:**
- Must be licensed before providing payment services
- Categories: Payment instrument issuer, payment facilitator, third-party PSP
- See PSD-1 for licensing requirements

**Payment System Operators:**
- Must be authorized before operating payment system
- See PSD-6 for authorization requirements

**Agent Use (Section 13):**
- PSPs can appoint agents to provide services
- Agent agreement required
- PSP remains liable for agent actions
- Bank must be notified (see PSD-1 for 60-day notice requirement)

#### Electronic Money and Trust Accounts (Part 6)

**E-Money Issuance:**
- Only licensed PSPs can issue e-money
- Banking institutions and authorized non-banks
- See PSD-3 for full requirements

**Trust Account:**
- E-money issuer must maintain trust account at banking institution
- Hold 100% of outstanding e-money liabilities
- Segregated from issuer's assets
- Protected in insolvency
- Subject to Bank inspection

**Trust Account Control:**
- Cannot be used for issuer's operations
- Only for customer e-money redemptions
- Daily reconciliation required
- Bank of Namibia has oversight

#### Consumer Protection (Part 8)

**Principles:**
- Transparency of fees and charges
- Non-discrimination
- Data protection and privacy
- Accessible complaint mechanisms
- Fair treatment of customers

**Transparency:**
- Clear disclosure of all fees before transaction
- Fee schedule publicly available
- No hidden charges
- See PSD-10 for fee standards (not yet read fully)

**Complaints:**
- PSPs must have complaint handling procedures
- Internal resolution attempted first
- Escalation to Bank if not resolved
- Bank can investigate and impose remedies

**Data Sharing:**
- Customer consent required for data sharing
- Customers can access their own data
- Aligns with Open Banking principles
- See Electronic Transactions Act for data protection

#### Insolvency Proceedings (Part 10)

**Winding-Up of Participant:**
- Bank must be notified immediately
- Settlement finality rules still apply
- Collateral can be utilized for obligations
- Protection of customer funds in trust accounts

#### Dispute Resolution (Part 11)

**Between PSPs:**
- Attempt resolution through Payments Association
- Mediation and arbitration
- Escalate to Bank if unresolved

**With Bank:**
- Appeal to Minister of Finance
- Appeal Board appointed
- Due process and hearing rights

#### Administrative Penalties (Section 40)
- Bank can impose penalties for contraventions
- See PSD-8 for detailed framework
- Alternative to criminal prosecution
- Must follow due process

#### Offences (Part 12)
- Providing unlicensed payment services: Criminal offence
- Operating unauthorized payment system: Criminal offence
- Penalties: Fines and/or imprisonment
- In addition to administrative penalties

---

## AI Backend Capabilities

### Overview
**Technology Stack:** Pydantic AI, LangGraph, FastAPI, DeepSeek LLM, PostgreSQL (Neon), LanceDB, DuckDB  
**Purpose:** Intelligent AI Copilot system with 6 specialized agents, 5 ML models, RAG, and analytics

### AI Agents

#### 1. Orchestrator Agent (Pydantic AI)
- Routes user queries to appropriate specialist agent
- Coordinates multi-agent workflows
- Human-in-the-Loop (HITL) for critical decisions
- LangGraph state management

#### 2. Transaction Analyst Agent
- Analyzes spending patterns and trends
- Categorizes transactions automatically
- Detects anomalies and unusual activity
- Budget tracking and recommendations

#### 3. Savings Advisor Agent
- Goal-based savings recommendations
- Optimal savings strategies
- Compares wallet performance
- Nudges for savings contributions

#### 4. Bill Payment Assistant Agent
- Tracks upcoming bill payments
- Sends payment reminders
- Suggests payment scheduling
- Detects duplicate bills

#### 5. Group Manager Agent
- Helps create and manage group savings circles
- Split bill coordination
- Member contribution tracking
- Stokvel management

#### 6. Security Guardian Agent
- Real-time fraud detection
- Suspicious transaction alerts
- Security best practices guidance
- Compliance monitoring

### Machine Learning Models

#### 1. Fraud Detection Model
- Algorithm: XGBoost classifier
- Features: Transaction amount, velocity, time, location, merchant category
- Training data: Historical fraud cases from DuckDB
- Real-time scoring: <100ms per transaction
- Output: Fraud probability (0-1), risk score, flagged features

#### 2. Credit Scoring Model
- Algorithm: Random Forest
- Features: Voucher redemption history, transaction patterns, wallet balance, KYC tier
- Determines loan eligibility and interest rate
- Trained on loan repayment outcomes

#### 3. Transaction Categorization Model
- Algorithm: Scikit-learn text classification
- Features: Transaction description, merchant name, amount
- Categories: Groceries, Transport, Utilities, Healthcare, Education, Entertainment, etc.
- Accuracy: ~92% on test set

#### 4. Spending Prediction Model
- Algorithm: Time series forecasting (Prophet/ARIMA)
- Predicts future spending by category
- Helps users budget and plan
- Trained on transaction history

#### 5. Savings Recommendation Model
- Algorithm: Collaborative filtering + rules engine
- Suggests optimal savings amount based on income and expenses
- Considers user's financial goals
- Personalized recommendations

### RAG (Retrieval Augmented Generation)

**Vector Database:** LanceDB  
**Embeddings Model:** bge-m3 (1024-dimensional vectors)  
**Search Performance:** <50ms semantic search

**Knowledge Sources:**
1. Namibian regulations (PSDs 1-13, FIA, ETA)
2. Product features documentation
3. Transaction workflows
4. Fraud patterns
5. Compliance requirements
6. User FAQs and support articles

**RAG Workflow:**
1. User query → bge-m3 embedding
2. Vector similarity search in LanceDB
3. Retrieve top-k relevant documents (k=5 typically)
4. Context provided to DeepSeek LLM
5. LLM generates response grounded in retrieved documents
6. Response includes source citations

### Three-Database Architecture

**1. PostgreSQL (Neon) - Primary Transactional Database**
- User accounts, wallets, transactions
- Vouchers, loans, groups
- Real-time OLTP workload
- Atomic transactions with ACID guarantees

**2. LanceDB - Vector Database**
- Stores bge-m3 embeddings (1024-dim)
- Semantic search for RAG
- Knowledge base vectors
- Transaction description embeddings for similarity search

**3. DuckDB - Analytics and ML Training**
- OLAP queries on transaction history
- Aggregations for dashboards and reports
- ML model training data preparation
- Export datasets for scikit-learn/XGBoost training
- In-memory for fast analytics

### API Endpoints (Python Backend)

**Chat:**
- `POST /api/v1/ai/chat` - Streaming chat with AI agents
- `POST /api/v1/ai/chat-sync` - Synchronous chat response

**Streaming:**
- `GET /api/v1/ai/stream` - Server-Sent Events (SSE) for real-time updates

**Health:**
- `GET /health` - System health check

**ML:**
- `POST /api/v1/ml/predict-fraud` - Fraud prediction for transaction
- `POST /api/v1/ml/credit-score` - Credit score calculation
- `POST /api/v1/ml/categorize-transaction` - Transaction categorization

**Admin:**
- `POST /api/v1/admin/retrain-models` - Trigger ML model retraining
- `GET /api/v1/admin/analytics` - System analytics dashboard

### Security Features

**Authentication:**
- JWT token validation (calls Node.js backend for verification)
- API key authentication for ML endpoints
- Rate limiting per user/IP

**Data Security:**
- No PII stored in LanceDB/DuckDB
- Encryption at rest (PostgreSQL)
- TLS for all API calls
- Audit logging for all AI interactions

**Compliance:**
- All AI recommendations subject to compliance checks
- Fraud detection alerts logged and reviewed
- Human oversight for critical operations (HITL)

### Analytics and Training Pipelines

**Daily Pipeline:**
- Export previous day's transactions to DuckDB
- Update aggregate statistics
- Detect anomalies and trends
- Generate daily reports

**Weekly Pipeline:**
- Retrain fraud detection model with new fraud cases
- Update transaction categorization model
- Refresh credit scoring model parameters
- Validate model performance metrics

**Monthly Pipeline:**
- Comprehensive analytics reports
- Model performance evaluation
- Compliance reporting
- Business intelligence dashboards

---

## Appendix: Quick Reference Tables

### Transaction Limit Summary

| KYC Tier | User Type | Daily Limit | Monthly Balance Limit | Required Documents |
|----------|-----------|-------------|----------------------|-------------------|
| Lite | Individual | N$10,000 | N$10,000 | Name, Nationality, ID Number |
| Lite | Business | N$10,000 | N$10,000 | Name, Nationality, ID Number, Company Reg |
| Full | Individual | N$20,000 | N$50,000 | Lite + Address, Contact Info |
| Full | Business | N$50,000 | N$100,000 | Full Individual + Company Reg, Business Location |

### Interchange Rate Summary

| Transaction Type | Card Type | Rate | Notes |
|-----------------|-----------|------|-------|
| Retail POS | Debit | 0.50% | - |
| Retail POS | Hybrid | 0.75% | - |
| Retail POS | Credit | 1.55% | - |
| Fuel POS | Debit | 0.50% | - |
| Fuel POS | Hybrid | 0.75% | - |
| Fuel POS | Credit | 0.80% | Lower than retail |
| Pure Cashback | All | N$1.25 | Flat fee |
| ATM Withdrawal | All | N$4.00 + N$0.80/N$100 | Reverse interchange |
| ATM Unsuccessful | All | N$4.80 | Flat fee |
| ATM Balance Enquiry | All | N$0.60 | Flat fee |
| Instant Payment (P2B) | N/A | 0.40% | Lower than card |
| Instant Payment (P2P) | N/A | 0% | Zero interchange |
| G2P | N/A | 0% | Zero interchange |

### Off-Us ATM Fees (User-Charged)

| Transaction Type | Fee Structure | Maximum | Notes |
|-----------------|---------------|---------|-------|
| Card Withdrawal | N$7.20 + N$13.70 per N$500 | N$35.00 | - |
| Card Balance Enquiry | N$1.60 | N$1.60 | Flat |
| Instant Payment Withdrawal | N$4.80 + N$9.00 | N/A | - |
| Instant Payment Balance Enquiry | N$1.60 | N$1.60 | Flat |
| Instant Payment (First Monthly) | N$0 | N$0 | Free |

### Capital Requirements Summary (Payment System Notice 2025)

| PSP Type | Initial Capital | Ongoing Capital |
|----------|----------------|-----------------|
| Non-Bank E-Money Issuer | N$1,500,000 | Avg outstanding liabilities (6 months) |
| Micro E-Money Issuer | N$500,000 | Not specified |
| Payment Facilitation Provider | N$1,500,000 | Not applicable |
| Third-Party PSP | N$1,000,000 | Not applicable |
| Banking Institution | Per Banking Act | Per Banking Act |

### Licensing Fees Summary (Payment System Notice 2025)

| Fee Type | PSP | Payment System Operator |
|----------|-----|------------------------|
| Application | N$5,000 | N$5,000 |
| Licensing/Authorization | N$20,000 | N$20,000 |
| Annual Renewal | N$10,000 | N$20,000 |
| Additional Category | N$5,000 | N/A |

**Note:** Banking institutions do not pay fees to offer payment services as PSPs.

### Fraud Pattern Summary (NPS Report 2013-2022)

| Fraud Type | % Incidents | % Value | Most Common Sub-Type | Prevention |
|------------|-------------|---------|---------------------|------------|
| Card Fraud | 95% | 38% | Card-Not-Present (53.6k, N$31.6M) | 3D Secure, CVV verification |
| EFT Fraud | 1% | 10% | Phishing (345, N$11.1M) | User education, 2FA |
| E-Money Fraud | 3% | 19% | Phone Scams (2.1k, N$27.1M) | "Never share OTP" campaigns |
| Cash Fraud | 1% | 33% | External Theft (N$36.6M) | Security, cash limits |

### Cybersecurity Risk Indicators (PSD-12)

| Metric | Target/Requirement | Notes |
|--------|-------------------|-------|
| Uptime (Critical Systems) | 99.9% minimum | Payment processing, authentication |
| Recovery Time Objective (RTO) | Within 2 hours | Time to restore service |
| Recovery Point Objective (RPO) | 5 minutes | Maximum data loss |
| Test Frequency | 2 successful tests/year | Response, resumption, recovery plans |
| Penetration Testing | Every 3 years | Critical systems only |
| 2FA Requirement | Every payment initiation | Non-negotiable |
| Data in Transit | Encrypted/tokenized/masked | Always |

### Voucher Redemption Methods Comparison

| Method | Speed | Location | Requirements | Process |
|--------|-------|----------|--------------|---------|
| Wallet | Instant | Anywhere (app) | Active wallet | Atomic DB transaction |
| NamPost | 1-2 days | NamPost branch | National ID, collection code | SMS code → visit branch → collect cash |
| SmartPay Agent | Same day | Agent location | PIN, National ID | SMS PIN → visit agent → collect cash |

---

## Glossary

**2FA (Two-Factor Authentication):** Security method requiring two independent factors: knowledge (password/PIN), possession (device/token), or inherence (biometric). REQUIRED for all payment initiations per PSD-12.

**AML (Anti-Money Laundering):** Policies and procedures to prevent the use of financial systems for money laundering. Part of FIA compliance.

**Atomic Transaction:** Database transaction where all operations succeed together or all fail together (ACID properties). Prevents partial updates.

**CDD (Customer Due Diligence):** Process of verifying customer identity and assessing risk. Required under Financial Intelligence Act.

**CFT (Counter-Financing of Terrorism):** Measures to prevent financial systems from being used to finance terrorism. Part of FIA compliance.

**CNP (Card-Not-Present):** Transaction where card is not physically present (online, phone, mail order). Highest fraud rate.

**DLT (Distributed Ledger Technology):** Blockchain and similar decentralized ledger systems. NOT used by Smartpay.

**FIA (Financial Intelligence Act):** Namibian law governing AML/CFT compliance. FIA 2012, Act No. 13 of 2012.

**FMI (Financial Market Infrastructure):** Systemically important payment, clearing, settlement, or recording systems. Subject to enhanced oversight.

**G2P (Government-to-Person):** Payments from government to individuals (e.g., social grants, vouchers). Zero interchange fee.

**Haversine Formula:** Mathematical formula to calculate distance between two points on a sphere using latitude/longitude. Used for finding nearest agents.

**HITL (Human-in-the-Loop):** AI system design where humans review and approve critical decisions. Used in Smartpay AI backend.

**KYC (Know Your Customer):** Identity verification process. Two tiers in Smartpay: Lite and Full.

**NAMQR:** Namibia QR Code Standards - standardized QR code format for interoperable payments across all issuers.

**NAD (Namibia Dollar):** Currency of Namibia. ISO code: NAD. All Smartpay transactions in NAD.

**NPS (National Payment System):** Entire payments ecosystem in Namibia including systems, rules, technologies, and institutions.

**OTP (One-Time Password):** Temporary password valid for single use. Sent via SMS for authentication.

**P2P (Person-to-Person):** Transfer between individuals. Zero interchange fee.

**PEP (Politically Exposed Person):** Individual in prominent public position. Subject to enhanced due diligence.

**PSA (Payments Association of Namibia):** Industry body for NPS participants. Formerly Payment System Management Body (PSMB).

**PSD (Payment System Determination):** Binding regulation issued by Bank of Namibia under PSMA. PSDs 1-13 currently active.

**PSMA (Payment System Management Act):** Act 14 of 2023. Primary legislation governing NPS in Namibia.

**PSP (Payment Service Provider):** Entity licensed to provide payment services (e-money issuers, card issuers, payment facilitators, etc.).

**RAG (Retrieval Augmented Generation):** AI technique combining vector search (LanceDB) with language models (DeepSeek) for grounded responses.

**RTO (Recovery Time Objective):** Maximum time to restore system after incident. PSD-12 target: 2 hours.

**RPO (Recovery Point Objective):** Maximum acceptable data loss period. PSD-12 target: 5 minutes.

**STR (Suspicious Transaction Report):** Report filed with Financial Intelligence Centre for suspicious activity. Confidential.

**Trust Account:** Segregated bank account holding 100% of customer e-money liabilities. Protected from issuer insolvency.

**VASP (Virtual Asset Service Provider):** Entity providing virtual asset services. Requires licensing under Virtual Assets Act 2023. NOT applicable to Smartpay.

---

**End of Knowledge Base**

**Document Version:** 1.0  
**Last Updated:** March 18, 2026  
**Prepared For:** LanceDB RAG Ingestion  
**Coverage:** Comprehensive Smartpay product features, Namibian payment regulations (PSDs 1-13, PSMA, ETA), fraud patterns, transaction workflows, agent banking, compliance requirements, and AI backend capabilities.
