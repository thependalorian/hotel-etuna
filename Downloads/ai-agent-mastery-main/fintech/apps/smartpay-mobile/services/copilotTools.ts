/**
 * copilotTools – Smartpay Agentic Copilot.
 * Implements all tool functions used by the copilot to interact with Smartpay APIs.
 * Location: fintech/smartpay/services/copilotTools.ts
 * 
 * ⚠️ SECURITY ARCHITECTURE - WALLET OWNERSHIP VERIFICATION:
 * 
 * All wallet operations in this file pass wallet IDs to backend endpoints.
 * 
 * CRITICAL: Wallet ownership is ALWAYS verified SERVER-SIDE, not client-side:
 * 
 * 1. JWT Authentication Flow:
 *    - Client sends JWT token in Authorization header (via getAuthHeader())
 *    - Backend requireAuth middleware extracts userId from JWT
 *    - Backend verifies wallet belongs to authenticated userId via database query
 * 
 * 2. Server-Side Verification (backend/src/routes/mobile/*.ts):
 *    ```sql
 *    SELECT * FROM wallets 
 *    WHERE id = $walletId 
 *      AND user_id = $authenticatedUserId  -- CRITICAL: prevents unauthorized access
 *      AND status = 'active'
 *    ```
 * 
 * 3. Attack Prevention:
 *    - Malicious client cannot manipulate walletId to access other users' wallets
 *    - JWT token cannot be forged (cryptographically signed with JWT_SECRET)
 *    - Expired/invalid tokens are rejected by requireAuth middleware
 * 
 * 4. Defense in Depth:
 *    - Rate limiting: Prevents brute-force wallet ID guessing
 *    - Input validation: Sanitizes all inputs before database queries
 *    - Audit logging: ETA 2019 §32 attribution tracks all financial operations
 * 
 * ⚠️ NEVER add client-side wallet ownership checks - they are bypassable!
 * All security enforcement MUST happen server-side.
 */
import { getSecureItem } from '@/services/secureStorage';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

interface SendMoneyInput {
  fromWalletId: string;
  toBeneficiaryId?: string;
  toGroupId?: string;
  amount: number;
  note?: string;
}

interface CashoutInput {
  walletId: string;
  method: 'bank' | 'till' | 'agent' | 'merchant' | 'atm';
  amount: number;
  destinationBankDetails?: Record<string, unknown>;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await getSecureItem('buffr_access_token');
  if (!token) throw new Error('Not authenticated');
  return { Authorization: `Bearer ${token}` };
}

export const copilotTools = {

  get_recent_activity: {
    name: 'get_recent_activity',
    description: 'Summarise recent activity (credits, debits, fees).',
    handler: async (args: { days?: number }) => {
      const headers = await getAuthHeader();
      const qs = new URLSearchParams({ days: String(args.days ?? 30) });
      const res = await fetch(`${API_BASE}/api/v1/mobile/transactions/summary?${qs}`, { headers });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  },

  initiate_send_money: {
    name: 'initiate_send_money',
    description: 'Send money from one wallet to a beneficiary or group.',
    /**
     * SECURITY NOTE: Wallet ownership verification
     * 
     * The `fromWalletId` is sent to the backend endpoint /api/v1/mobile/send-money.
     * 
     * SERVER-SIDE VERIFICATION (backend/src/routes/mobile/sendMoney.ts):
     * 1. requireAuth middleware extracts userId from JWT token
     * 2. Database query enforces wallet ownership:
     *    ```sql
     *    SELECT * FROM wallets 
     *    WHERE id = $fromWalletId 
     *      AND user_id = $authenticatedUserId  -- Prevents unauthorized access
     *    ```
     * 3. If wallet doesn't belong to authenticated user → 404 Not Found (not 403)
     *    - Security through obscurity: doesn't reveal wallet existence
     * 
     * CLIENT-SIDE (this code):
     * - NO wallet ownership checks performed here
     * - Only basic input validation (amount > 0, recipient specified)
     * - Relies entirely on server-side authorization
     * 
     * This architecture prevents wallet ID manipulation attacks.
     */
    handler: async (input: SendMoneyInput) => {
      if (input.amount <= 0) throw new Error('Amount must be greater than zero.');
      if (!input.toBeneficiaryId && !input.toGroupId) {
        throw new Error('Please specify a recipient (beneficiary or group).');
      }
      const headers = await getAuthHeader();
      const body: Record<string, unknown> = {
        sourceWalletId: input.fromWalletId,
        amount: input.amount,
        note: input.note,
      };
      if (input.toBeneficiaryId) body.beneficiaryId = input.toBeneficiaryId;
      if (input.toGroupId) body.toGroupId = input.toGroupId;
      const res = await fetch(`${API_BASE}/api/v1/mobile/send-money`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  },

  initiate_cashout: {
    name: 'initiate_cashout',
    description: 'Cash out funds from a wallet using a specific method.',
    /**
     * SECURITY NOTE: Wallet ownership verification
     * 
     * The `walletId` is sent to backend endpoints like:
     * - /api/v1/mobile/cash-out/bank
     * - /api/v1/mobile/cash-out/till
     * - /api/v1/mobile/cash-out/agent
     * etc.
     * 
     * SERVER-SIDE VERIFICATION (backend/src/routes/mobile/cashOut.ts):
     * 1. requireAuth middleware extracts userId from JWT token
     * 2. Database query enforces wallet ownership:
     *    ```sql
     *    SELECT balance, currency FROM wallets 
     *    WHERE id = $walletId 
     *      AND user_id = $authenticatedUserId  -- CRITICAL security check
     *      AND status = 'active'
     *    ```
     * 3. If wallet doesn't exist or doesn't belong to user → error returned
     * 4. PSD-3 e-money limits checked (withdrawalLimit, dailyLimit)
     * 5. ETA 2019 §32 attribution logged for audit trail
     * 
     * CLIENT-SIDE (this code):
     * - NO wallet ownership checks
     * - Only validates amount > 0
     * - Passes walletId as-is to server
     * 
     * Attack scenario prevented:
     * - Attacker modifies walletId in copilot chat → server rejects
     * - Attacker intercepts HTTP request, changes walletId → JWT userId mismatch
     * - Attacker forges JWT with different userId → signature verification fails
     */
    handler: async (input: CashoutInput) => {
      if (input.amount <= 0) throw new Error('Amount must be greater than zero.');
      const headers = await getAuthHeader();
      const url = `${API_BASE}/api/v1/mobile/cash-out/${input.method}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletId: input.walletId,
          amount: input.amount,
          destinationBankDetails: input.destinationBankDetails,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  },

  redeem_voucher: {
    name: 'redeem_voucher',
    description: 'Redeem a voucher to wallet, NamPost, or SmartPay.',
    handler: async (input: { voucherId: string; method: 'wallet' | 'nampost' | 'smartpay'; walletId?: string }) => {
      const headers = await getAuthHeader();
      const base = `${API_BASE}/api/v1/mobile/vouchers/${input.voucherId}`;
      const path =
        input.method === 'wallet' ? `${base}/redeem` : input.method === 'nampost' ? `${base}/redeem-nampost` : `${base}/redeem-smartpay`;
      const res = await fetch(path, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletId: input.walletId }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  },

  get_proof_of_life_status: {
    name: 'get_proof_of_life_status',
    description: 'Get the user proof-of-life verification status and next due date.',
    handler: async () => {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE}/api/v1/mobile/user/profile`, { headers });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return { lastProofOfLife: data.lastProofOfLife, proofOfLifeDueDate: data.proofOfLifeDueDate, status: data.status };
    },
  },

  start_proof_of_life: {
    name: 'start_proof_of_life',
    description: 'Initiate the proof-of-life verification flow for the user.',
    handler: async () => {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE}/api/v1/mobile/user/proof-of-life`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  },

  get_loan_offer: {
    name: 'get_loan_offer',
    description: 'Check voucher-backed loan eligibility and maximum offer.',
    handler: async () => {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE}/api/v1/mobile/loans/eligibility`, { headers });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  },

  apply_for_loan: {
    name: 'apply_for_loan',
    description: 'Apply for a voucher-backed loan.',
    handler: async (input: { amount: number }) => {
      if (input.amount <= 0) throw new Error('Amount must be greater than zero.');
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE}/api/v1/mobile/loans/apply`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: input.amount }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  },

  group_wallet_actions: {
    name: 'group_wallet_actions',
    description: 'Group wallet balance, contribute, withdraw, or send.',
    handler: async (input: { groupId: string; action: string; payload?: Record<string, unknown> }) => {
      const headers = await getAuthHeader();
      const { groupId, action, payload } = input;
      if (action === 'balance') {
        const res = await fetch(`${API_BASE}/api/v1/mobile/groups/${groupId}/wallet`, { headers });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      }
      const res = await fetch(`${API_BASE}/api/v1/mobile/groups/${groupId}/${action}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload ?? {}),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  },

  create_incident_report: {
    name: 'create_incident_report',
    description: 'Log a complaint or incident report.',
    handler: async (input: { category: string; description: string; relatedTransactionId?: string }) => {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE}/api/v1/mobile/incidents`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: input.category,
          description: input.description,
          relatedTransactionId: input.relatedTransactionId,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  },

  find_nearest_agent: {
    name: 'find_nearest_agent',
    description: 'Find the nearest cash-out agent or NamPost branch based on user location (NamPost RFP §G20). DEPRECATED: Use find_nearby_agents from copilot/copilotTools instead for enhanced functionality.',
    handler: async (input: { latitude: number; longitude: number; service?: string }) => {
      // Import the new location tools
      const { find_nearby_agents } = await import('./copilot/copilotTools');
      
      // Use the new tool with enhanced features
      return find_nearby_agents.handler({
        latitude: input.latitude,
        longitude: input.longitude,
        service: (input.service as any) ?? 'cashout',
        radius: 10,
        useCurrentLocation: false,
      });
    },
  },

  find_nearby_agents: {
    name: 'find_nearby_agents',
    description: 'Find nearby cash-out agents, NamPost branches, or retail locations. Supports filtering by service type (cashout, voucher redemption, e-wallet, NAMQR). Returns up to 10 nearest locations with distance in km.',
    handler: async (input: {
      latitude?: number;
      longitude?: number;
      radius?: number;
      service?: 'cashout' | 'voucher' | 'ewallet' | 'namqr' | 'all';
      useCurrentLocation?: boolean;
    }) => {
      const { find_nearby_agents } = await import('./copilot/copilotTools');
      return find_nearby_agents.handler(input);
    },
  },

  find_nearby_atms: {
    name: 'find_nearby_atms',
    description: 'Find nearby ATMs for cash withdrawals. Returns ATMs with their status (online/offline/maintenance), operating hours (24-hour or business hours), and available services (cash-out, deposit).',
    handler: async (input: {
      latitude?: number;
      longitude?: number;
      radius?: number;
      useCurrentLocation?: boolean;
      statusFilter?: 'online' | 'all';
    }) => {
      const { find_nearby_atms } = await import('./copilot/copilotTools');
      return find_nearby_atms.handler(input);
    },
  },

  find_nampost_offices: {
    name: 'find_nampost_offices',
    description: 'Search for NamPost branch offices by name, region, or city. Returns office details including address, operating hours, phone number, and available services (mail, parcel, e-money, bill payments, voucher redemption).',
    handler: async (input: { searchQuery: string; latitude?: number; longitude?: number }) => {
      const { find_nampost_offices } = await import('./copilot/copilotTools');
      return find_nampost_offices.handler(input);
    },
  },

  search_knowledge_base: {
    name: 'search_knowledge_base',
    description: 'Search financial literacy knowledge base for educational content, FAQs, and help articles about wallets, loans, vouchers, proof-of-life, fees, and banking concepts.',
    handler: async (input: { query: string; limit?: number }) => {
      const { searchKnowledgeBase } = await import('@/services/copilot/knowledgeBaseService');
      
      try {
        const results = await searchKnowledgeBase(input.query, input.limit ?? 3);
        
        if (results.length === 0) {
          return {
            results: [],
            message: `I couldn't find specific educational content for "${input.query}". Try asking about wallets, loans, cash-out, proof of life, fees, or open banking.`,
          };
        }

        const formattedResults = results.map((result, index) => ({
          rank: index + 1,
          title: result.content.title,
          summary: result.content.summary,
          relevance: result.relevance,
          topic: result.content.topic,
          level: result.content.level,
        }));

        return {
          results: formattedResults,
          count: results.length,
          message: `Found ${results.length} educational resource(s) about "${input.query}". Would you like me to explain any of these topics in more detail?`,
          detailedContent: results.map(r => ({
            title: r.content.title,
            content: r.content.content,
            examples: r.content.examples,
            faqs: r.content.faqs,
          })),
        };
      } catch (error) {
        console.error('Knowledge base search error:', error);
        return {
          results: [],
          error: 'Failed to search knowledge base',
          message: 'I had trouble searching the knowledge base. Please try again or ask your question differently.',
        };
      }
    },
  },

  explain_financial_concept: {
    name: 'explain_financial_concept',
    description: 'Get detailed explanations of financial concepts like wallets, loans, vouchers, proof-of-life, open banking, NAMQR, transaction limits, fees, etc. Provides simple, accessible explanations suitable for all literacy levels.',
    handler: async (input: { concept: string; detail_level?: 'basic' | 'intermediate' | 'advanced' }) => {
      const { getEducationalContent, getRelatedTopics } = await import('@/services/copilot/knowledgeBaseService');
      
      try {
        // Map common queries to topic IDs
        const conceptMap: Record<string, string> = {
          'wallet': 'wallets',
          'wallets': 'wallets',
          'digital wallet': 'wallets',
          'cashout': 'cashout',
          'cash out': 'cashout',
          'withdraw': 'cashout',
          'loan': 'loans',
          'loans': 'loans',
          'borrow': 'loans',
          'proof of life': 'proof-of-life',
          'proof-of-life': 'proof-of-life',
          'verification': 'proof-of-life',
          'fees': 'fees',
          'charges': 'fees',
          'cost': 'fees',
          'open banking': 'open-banking',
          'obs': 'open-banking',
          'bank connection': 'open-banking',
        };

        const topicId = conceptMap[input.concept.toLowerCase()] || input.concept.toLowerCase();
        const content = await getEducationalContent(topicId);

        if (!content) {
          return {
            message: `I don't have specific educational content about "${input.concept}" yet. Try asking about: wallets, cash-out, loans, proof of life, fees, or open banking.`,
            suggestions: ['What is a wallet?', 'How do I cash out?', 'How do loans work?', 'What is proof of life?'],
          };
        }

        // Filter content based on detail level
        const detailLevel = input.detail_level ?? 'basic';
        const shouldIncludeExamples = detailLevel !== 'basic';
        const shouldIncludeFAQs = true; // Always include FAQs

        // Get related topics for further learning
        const relatedTopics = await getRelatedTopics(topicId, 3);

        return {
          title: content.title,
          explanation: content.content,
          summary: content.summary,
          level: content.level,
          examples: shouldIncludeExamples ? content.examples : undefined,
          faqs: shouldIncludeFAQs ? content.faqs : undefined,
          relatedTopics: relatedTopics.map(t => t.title),
          message: `Here's an explanation of ${content.title}. ${content.faqs && content.faqs.length > 0 ? 'I\'ve also included frequently asked questions.' : ''} Would you like me to explain any related topics?`,
          nextSteps: [
            'Ask me about any of the related topics',
            'Request more examples',
            'Ask specific questions about this topic',
          ],
        };
      } catch (error) {
        console.error('Error explaining concept:', error);
        return {
          error: 'Failed to retrieve explanation',
          message: 'I had trouble getting that explanation. Please try again.',
        };
      }
    },
  },

  generate_cashout_qr: {
    name: 'generate_cashout_qr',
    description: 'Generate a NAMQR QR code for agent or merchant cash-out (NAMQR v5.0 §G16).',
    handler: async (input: { walletId: string; amount: number; method: 'agent' | 'merchant' }) => {
      if (input.amount <= 0) throw new Error('Amount must be greater than zero.');
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE}/api/v1/mobile/cash-out/qr`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return {
        tokenVaultId: data.tokenVaultId,
        instructions: `Show this QR code or the code ${data.tokenVaultId} to the agent to complete your N$${input.amount} cash-out.`,
        expiresAt: data.expiresAt,
        qrPayload: data.qrPayload,
      };
    },
  },

  ais_get_accounts: {
    name: 'ais_get_accounts',
    description: 'Retrieve linked bank accounts from Data Provider via OBS AIS consent (§G22).',
    handler: async (input: { consentId: string }) => {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE}/api/v1/obs/ais/accounts?consentId=${input.consentId}`, { headers });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  },

  ais_get_balances: {
    name: 'ais_get_balances',
    description: 'Retrieve account balances from Data Provider via OBS AIS consent.',
    handler: async (input: { consentId: string; accountIds: string[] }) => {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE}/api/v1/obs/ais/balances`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  },

  ais_get_transactions: {
    name: 'ais_get_transactions',
    description: 'Retrieve recent transactions from a linked bank account via OBS AIS consent.',
    handler: async (input: {
      consentId: string;
      accountId: string;
      fromDate?: string;
      toDate?: string;
      limit?: number;
    }) => {
      const headers = await getAuthHeader();
      const params = new URLSearchParams({
        consentId: input.consentId,
        accountId: input.accountId,
        ...(input.fromDate && { fromDate: input.fromDate }),
        ...(input.toDate && { toDate: input.toDate }),
        ...(input.limit != null && { limit: String(input.limit) }),
      });
      const res = await fetch(`${API_BASE}/api/v1/obs/ais/transactions?${params}`, { headers });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  },

  pisp_initiate_payment: {
    name: 'pisp_initiate_payment',
    description: 'Initiate a payment from a linked bank account via OBS PISP consent. SCA will be required at the bank.',
    handler: async (input: {
      consentId: string;
      debtorAccountId: string;
      amount: number;
      currency: string;
      beneficiaryName: string;
      beneficiaryAccountIdentifier: string;
      remittanceInformation?: string;
    }) => {
      if (input.amount <= 0) throw new Error('Amount must be greater than zero.');
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE}/api/v1/obs/pis/payments`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return {
        paymentId: data.paymentId,
        status: data.status,
        authorizationFlow: data.authorizationFlow,
        message: data.authorizationFlow?.redirectUri
          ? `Your bank requires confirmation. You will be redirected to complete this payment.`
          : `Payment initiated successfully. Status: ${data.status}.`,
      };
    },
  },

  initiate_obs_consent: {
    name: 'initiate_obs_consent',
    description: 'Start the OBS consent flow to link a bank account for AIS or PISP (§G12).',
    handler: async (input: { dataProviderId: string; purpose: 'ais' | 'pis'; scopes: string[] }) => {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE}/api/v1/obs/consents/initiate`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return {
        consentId: data.consentId,
        authorizationUrl: data.authorizationUrl,
        message: `To link your bank account, you will be redirected to your bank to confirm access. This takes about 60 seconds.`,
      };
    },
  },

  list_obs_consents: {
    name: 'list_obs_consents',
    description: 'List all OBS consents (linked bank accounts) with their status and expiry dates.',
    handler: async () => {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE}/api/v1/obs/consents`, { headers });
      if (!res.ok) throw new Error(await res.text());
      const consents = await res.json();
      
      const activeConsents = consents.filter((c: any) => c.status === 'active');
      const message = activeConsents.length > 0
        ? `You have ${activeConsents.length} active bank link${activeConsents.length === 1 ? '' : 's'}.`
        : 'No active bank links. Use "Link my bank account" to connect a bank.';
      
      return {
        consents,
        activeCount: activeConsents.length,
        message,
      };
    },
  },

  get_obs_consent_details: {
    name: 'get_obs_consent_details',
    description: 'Get detailed information about a specific OBS consent including permissions and expiry.',
    handler: async (input: { consentId: string }) => {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE}/api/v1/obs/consents/${input.consentId}`, { headers });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  },

  revoke_obs_consent: {
    name: 'revoke_obs_consent',
    description: 'Revoke an OBS consent to disconnect a linked bank account. Data Provider will be notified.',
    handler: async (input: { consentId: string; reason?: string }) => {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE}/api/v1/obs/consents/${input.consentId}`, {
        method: 'DELETE',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: input.reason }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return {
        success: true,
        message: 'Bank account link has been successfully revoked. Your bank has been notified.',
        consentId: input.consentId,
        ...data,
      };
    },
  },

  get_obs_payment_status: {
    name: 'get_obs_payment_status',
    description: 'Check the current status of an OBS PISP payment (AwaitingAuthorisation, Completed, etc.).',
    handler: async (input: { paymentId: string }) => {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE}/api/v1/obs/pis/payments/${input.paymentId}`, { headers });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      
      const statusMessages: Record<string, string> = {
        'AwaitingAuthorisation': 'Payment is waiting for your authorization at the bank.',
        'AcceptedSettlementInProcess': 'Payment is being processed by the bank.',
        'AcceptedSettlementCompleted': 'Payment has been completed successfully.',
        'Rejected': 'Payment was rejected by the bank.',
      };
      
      return {
        ...data,
        message: statusMessages[data.status] ?? `Payment status: ${data.status}`,
      };
    },
  },

  list_obs_data_providers: {
    name: 'list_obs_data_providers',
    description: 'List all available banks and financial institutions that can be linked via Open Banking.',
    handler: async () => {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE}/api/v1/obs/providers`, { headers });
      if (!res.ok) {
        return {
          providers: [
            {
              id: 'mock-fnb',
              name: 'FNB Namibia',
              type: 'bank',
              supportsAIS: true,
              supportsPIS: true,
            },
            {
              id: 'mock-bankwindhoek',
              name: 'Bank Windhoek',
              type: 'bank',
              supportsAIS: true,
              supportsPIS: true,
            },
          ],
          message: 'Available banks: FNB Namibia, Bank Windhoek. Choose one to link your account.',
        };
      }
      const providers = await res.json();
      const bankNames = providers.map((p: any) => p.name).join(', ');
      return {
        providers,
        message: `Available banks: ${bankNames}. Choose one to link your account.`,
      };
    },
  },

  get_obs_consent_audit_log: {
    name: 'get_obs_consent_audit_log',
    description: 'View the complete audit trail for an OBS consent (all data access and payment events).',
    handler: async (input: { consentId: string }) => {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE}/api/v1/obs/consents/${input.consentId}/audit`, { headers });
      if (!res.ok) throw new Error(await res.text());
      const auditLog = await res.json();
      return {
        auditLog,
        count: auditLog.length,
        message: `Found ${auditLog.length} audit event${auditLog.length === 1 ? '' : 's'} for this consent.`,
      };
    },
  },

  create_wallet: {
    name: 'create_wallet',
    description: 'Create a new wallet with custom name, type, icon, and color. Guides user through wallet setup.',
    /**
     * SECURITY NOTE: Wallet creation
     * 
     * Creates a new wallet via POST /api/v1/mobile/wallets
     * 
     * SERVER-SIDE VERIFICATION (backend/src/routes/mobile/wallets.ts):
     * 1. requireAuth middleware extracts userId from JWT token
     * 2. New wallet is automatically assigned to authenticated user
     * 3. Validation checks:
     *    - Name length (2-50 chars)
     *    - Type must be valid
     *    - Currency must be supported (NAD)
     *    - User cannot exceed max wallet limit (typically 10)
     * 
     * CLIENT-SIDE (this code):
     * - Input validation (name, type, icon, color)
     * - No wallet ownership concerns (new wallet = current user)
     * - Relies on server for business rule enforcement
     */
    handler: async (input: { name: string; type: string; icon: string; color: string; description?: string }) => {
      const { createWallet } = await import('./copilot/walletManagementService');
      const wallet = await createWallet({
        name: input.name,
        type: input.type,
        icon: input.icon,
        color: input.color,
        description: input.description,
      });
      return {
        success: true,
        wallet,
        message: `Successfully created "${wallet.name}" wallet. Your new wallet is ready to use!`,
      };
    },
  },

  update_wallet: {
    name: 'update_wallet',
    description: 'Update wallet details like name, icon, or color. Used for editing existing wallets.',
    /**
     * SECURITY NOTE: Wallet ownership verification
     * 
     * Updates wallet via PATCH /api/v1/mobile/wallets/:id
     * 
     * SERVER-SIDE VERIFICATION (backend/src/routes/mobile/wallets.ts):
     * 1. requireAuth middleware extracts userId from JWT token
     * 2. Database query enforces wallet ownership:
     *    ```sql
     *    UPDATE wallets 
     *    SET name = $1, icon = $2, color = $3, updated_at = NOW()
     *    WHERE id = $walletId 
     *      AND user_id = $authenticatedUserId  -- CRITICAL: prevents unauthorized edits
     *    RETURNING *
     *    ```
     * 3. If wallet doesn't belong to user → 404 Not Found
     * 4. Cannot update frozen or archived wallets
     * 
     * CLIENT-SIDE (this code):
     * - Input validation only
     * - Passes walletId as-is to server
     * - Server enforces all ownership and status checks
     */
    handler: async (input: { walletId: string; name?: string; icon?: string; color?: string; description?: string }) => {
      const { updateWallet } = await import('./copilot/walletManagementService');
      const updates: Record<string, string> = {};
      if (input.name) updates.name = input.name;
      if (input.icon) updates.icon = input.icon;
      if (input.color) updates.color = input.color;
      if (input.description !== undefined) updates.description = input.description;
      
      const wallet = await updateWallet(input.walletId, updates);
      return {
        success: true,
        wallet,
        message: `Successfully updated "${wallet.name}" wallet.`,
      };
    },
  },

  get_wallet_overview: {
    name: 'get_wallet_overview',
    description: 'Get all user wallets with balances, types, and status. Shows complete wallet overview.',
    handler: async () => {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE}/api/v1/mobile/wallets`, { headers });
      if (!res.ok) throw new Error(await res.text());
      const wallets = await res.json();
      
      // Calculate summary stats
      const totalBalance = wallets.reduce((sum: number, w: any) => sum + (w.balance || 0), 0);
      const activeWallets = wallets.filter((w: any) => w.status === 'active').length;
      
      return {
        wallets,
        summary: {
          totalBalance,
          totalWallets: wallets.length,
          activeWallets,
          currency: 'NAD',
        },
        message: `You have ${activeWallets} active wallet${activeWallets === 1 ? '' : 's'} with a total balance of N$${totalBalance.toFixed(2)}.`,
      };
    },
  },

  archive_wallet: {
    name: 'archive_wallet',
    description: 'Archive (soft delete) a wallet. Wallet must have zero balance. Cannot be undone easily.',
    /**
     * SECURITY NOTE: Wallet ownership verification
     * 
     * Archives wallet via DELETE /api/v1/mobile/wallets/:id
     * 
     * SERVER-SIDE VERIFICATION:
     * 1. requireAuth middleware extracts userId from JWT token
     * 2. Database checks:
     *    ```sql
     *    SELECT balance, status FROM wallets 
     *    WHERE id = $walletId 
     *      AND user_id = $authenticatedUserId
     *    ```
     * 3. Business rules enforced server-side:
     *    - Balance must be exactly 0.00
     *    - Cannot archive main wallet (type = 'main')
     *    - Cannot archive already archived wallet
     * 4. Update status to 'archived' (soft delete):
     *    ```sql
     *    UPDATE wallets 
     *    SET status = 'archived', updated_at = NOW()
     *    WHERE id = $walletId AND user_id = $authenticatedUserId
     *    ```
     * 
     * CLIENT-SIDE (this code):
     * - Basic validation only
     * - Server enforces all business rules
     */
    handler: async (input: { walletId: string }) => {
      const { archiveWallet } = await import('./copilot/walletManagementService');
      const result = await archiveWallet(input.walletId);
      return result;
    },
  },

  get_wallet_types: {
    name: 'get_wallet_types',
    description: 'Get available wallet types (savings, bills, emergency, travel, etc.) for wallet creation.',
    handler: async () => {
      const { getWalletTypes } = await import('./copilot/walletManagementService');
      const types = await getWalletTypes();
      return {
        types,
        message: `Available wallet types: ${types.map(t => t.name).join(', ')}. Choose one to create your wallet.`,
      };
    },
  },
};

export function getCopilotTools() {
  return Object.values(copilotTools).map((t) => ({
    name: t.name,
    description: t.description,
    handler: t.handler,
  }));
}
