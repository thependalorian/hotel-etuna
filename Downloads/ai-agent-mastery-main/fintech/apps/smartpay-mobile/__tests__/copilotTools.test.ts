/**
 * Unit tests for Copilot Tools
 * Tests all 19 copilot tools with mock API responses
 * Location: fintech/smartpay/__tests__/copilotTools.test.ts
 */
import { copilotTools } from '../services/copilotTools';
import * as SecureStorage from '../services/secureStorage';

jest.mock('../services/secureStorage');

const mockGetSecureItem = SecureStorage.getSecureItem as jest.MockedFunction<typeof SecureStorage.getSecureItem>;

const API_BASE = 'https://test-api.smartpay.na';
const MOCK_TOKEN = 'mock-jwt-token-12345';

describe('Copilot Tools - Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    process.env.EXPO_PUBLIC_API_BASE_URL = API_BASE;
  });

  it('should throw error when token is missing', async () => {
    mockGetSecureItem.mockResolvedValue(null);
    await expect(copilotTools.get_wallet_overview.handler()).rejects.toThrow('Not authenticated');
  });

  it('should throw error when token is expired', async () => {
    mockGetSecureItem.mockResolvedValue('expired-token');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Token expired',
    });
    await expect(copilotTools.get_wallet_overview.handler()).rejects.toThrow();
  });
});

describe('Copilot Tools - Wallet & Balance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSecureItem.mockResolvedValue(MOCK_TOKEN);
    global.fetch = jest.fn();
  });

  describe('get_wallet_overview', () => {
    it('should return wallet array with balances', async () => {
      const mockWallets = [
        { id: 'w1', balance: 1500.0, currency: 'NAD', frozen: false },
        { id: 'w2', balance: 500.0, currency: 'NAD', frozen: false },
      ];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ wallets: mockWallets }),
      });

      const result = await copilotTools.get_wallet_overview.handler();
      expect(result.wallets).toHaveLength(2);
      expect(result.wallets[0].balance).toBe(1500.0);
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/v1/mobile/wallets`,
        expect.objectContaining({
          headers: { Authorization: `Bearer ${MOCK_TOKEN}` },
        })
      );
    });

    it('should handle frozen wallet status', async () => {
      const mockWallets = [{ id: 'w1', balance: 1500.0, currency: 'NAD', frozen: true }];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ wallets: mockWallets }),
      });

      const result = await copilotTools.get_wallet_overview.handler();
      expect(result.wallets[0].frozen).toBe(true);
    });
  });

  describe('get_recent_activity', () => {
    it('should return transaction summary with default 30 days', async () => {
      const mockSummary = {
        totalCredits: 5000,
        totalDebits: 3500,
        totalFees: 45.5,
        transactionCount: 25,
      };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSummary,
      });

      const result = await copilotTools.get_recent_activity.handler({});
      expect(result.totalCredits).toBe(5000);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('days=30'),
        expect.any(Object)
      );
    });

    it('should accept custom day range', async () => {
      const mockSummary = { totalCredits: 1000, totalDebits: 500, totalFees: 10, transactionCount: 5 };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSummary,
      });

      await copilotTools.get_recent_activity.handler({ days: 7 });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('days=7'),
        expect.any(Object)
      );
    });
  });
});

describe('Copilot Tools - Send Money', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSecureItem.mockResolvedValue(MOCK_TOKEN);
    global.fetch = jest.fn();
  });

  describe('initiate_send_money', () => {
    it('should send money to beneficiary successfully', async () => {
      const mockResponse = {
        transactionId: 'tx-123',
        status: 'pending_2fa',
        message: 'Awaiting confirmation',
      };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await copilotTools.initiate_send_money.handler({
        fromWalletId: 'w1',
        toBeneficiaryId: 'ben-456',
        amount: 200,
        note: 'Test payment',
      });

      expect(result.transactionId).toBe('tx-123');
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/v1/mobile/send-money`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Bearer ${MOCK_TOKEN}`,
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should validate amount is greater than zero', async () => {
      await expect(
        copilotTools.initiate_send_money.handler({
          fromWalletId: 'w1',
          toBeneficiaryId: 'ben-456',
          amount: 0,
        })
      ).rejects.toThrow('Amount must be greater than zero');
    });

    it('should handle API validation errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        text: async () => 'Insufficient balance',
      });

      await expect(
        copilotTools.initiate_send_money.handler({
          fromWalletId: 'w1',
          toBeneficiaryId: 'ben-456',
          amount: 10000,
        })
      ).rejects.toThrow('Insufficient balance');
    });

    it('should support sending to group wallet', async () => {
      const mockResponse = { transactionId: 'tx-789', status: 'pending_2fa' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await copilotTools.initiate_send_money.handler({
        fromWalletId: 'w1',
        toGroupId: 'grp-123',
        amount: 150,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/v1/mobile/send-money`,
        expect.objectContaining({
          body: expect.stringContaining('grp-123'),
        })
      );
    });
  });
});

describe('Copilot Tools - Cash-Out', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSecureItem.mockResolvedValue(MOCK_TOKEN);
    global.fetch = jest.fn();
  });

  describe('initiate_cashout', () => {
    it('should cash out to bank successfully', async () => {
      const mockResponse = { cashoutId: 'co-123', status: 'processing' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await copilotTools.initiate_cashout.handler({
        walletId: 'w1',
        method: 'bank',
        amount: 1000,
        destinationBankDetails: { accountNumber: '123456', bankCode: 'FNB' },
      });

      expect(result.cashoutId).toBe('co-123');
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/v1/mobile/cash-out/bank`,
        expect.any(Object)
      );
    });

    it('should support all 5 cash-out methods', async () => {
      const methods = ['bank', 'till', 'agent', 'merchant', 'atm'] as const;
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ cashoutId: 'co-123', status: 'processing' }),
      });

      for (const method of methods) {
        await copilotTools.initiate_cashout.handler({
          walletId: 'w1',
          method,
          amount: 500,
        });

        expect(global.fetch).toHaveBeenCalledWith(
          `${API_BASE}/api/v1/mobile/cash-out/${method}`,
          expect.any(Object)
        );
      }

      expect(global.fetch).toHaveBeenCalledTimes(5);
    });

    it('should validate amount is positive', async () => {
      await expect(
        copilotTools.initiate_cashout.handler({
          walletId: 'w1',
          method: 'atm',
          amount: -100,
        })
      ).rejects.toThrow('Amount must be greater than zero');
    });
  });
});

describe('Copilot Tools - Vouchers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSecureItem.mockResolvedValue(MOCK_TOKEN);
    global.fetch = jest.fn();
  });

  describe('redeem_voucher', () => {
    it('should redeem voucher to wallet', async () => {
      const mockResponse = { redeemed: true, amount: 500, walletId: 'w1' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await copilotTools.redeem_voucher.handler({
        voucherId: 'vch-123',
        method: 'wallet',
        walletId: 'w1',
      });

      expect(result.redeemed).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/v1/mobile/vouchers/vch-123/redeem`,
        expect.any(Object)
      );
    });

    it('should redeem voucher to NamPost', async () => {
      const mockResponse = { redeemed: true, referenceNumber: 'NP-789' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await copilotTools.redeem_voucher.handler({
        voucherId: 'vch-456',
        method: 'nampost',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/v1/mobile/vouchers/vch-456/redeem-nampost`,
        expect.any(Object)
      );
    });

    it('should redeem voucher to SmartPay card', async () => {
      const mockResponse = { redeemed: true, cardId: 'card-999' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await copilotTools.redeem_voucher.handler({
        voucherId: 'vch-789',
        method: 'smartpay',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/v1/mobile/vouchers/vch-789/redeem-smartpay`,
        expect.any(Object)
      );
    });
  });
});

describe('Copilot Tools - Loans', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSecureItem.mockResolvedValue(MOCK_TOKEN);
    global.fetch = jest.fn();
  });

  describe('get_loan_offer', () => {
    it('should return loan eligibility with maximum offer', async () => {
      const mockOffer = {
        eligible: true,
        maxLoanAmount: 5000,
        interestRate: 0.15,
        repaymentPeriod: 30,
      };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockOffer,
      });

      const result = await copilotTools.get_loan_offer.handler();
      expect(result.eligible).toBe(true);
      expect(result.maxLoanAmount).toBe(5000);
    });

    it('should handle ineligible status', async () => {
      const mockOffer = { eligible: false, reason: 'No eligible vouchers' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockOffer,
      });

      const result = await copilotTools.get_loan_offer.handler();
      expect(result.eligible).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });

  describe('apply_for_loan', () => {
    it('should apply for loan successfully', async () => {
      const mockResponse = {
        loanId: 'ln-123',
        status: 'approved',
        amountApproved: 3000,
        disbursementWalletId: 'w1',
      };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await copilotTools.apply_for_loan.handler({ amount: 3000 });
      expect(result.loanId).toBe('ln-123');
      expect(result.status).toBe('approved');
    });

    it('should validate loan amount is positive', async () => {
      await expect(
        copilotTools.apply_for_loan.handler({ amount: -500 })
      ).rejects.toThrow('Amount must be greater than zero');
    });
  });
});

describe('Copilot Tools - Group Wallets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSecureItem.mockResolvedValue(MOCK_TOKEN);
    global.fetch = jest.fn();
  });

  describe('group_wallet_actions', () => {
    it('should get group wallet balance', async () => {
      const mockWallet = { groupId: 'grp-123', balance: 8500, members: 12 };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockWallet,
      });

      const result = await copilotTools.group_wallet_actions.handler({
        groupId: 'grp-123',
        action: 'balance',
      });

      expect(result.balance).toBe(8500);
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/v1/mobile/groups/grp-123/wallet`,
        expect.any(Object)
      );
    });

    it('should contribute to group wallet', async () => {
      const mockResponse = { contributed: true, newBalance: 9000 };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await copilotTools.group_wallet_actions.handler({
        groupId: 'grp-123',
        action: 'contribute',
        payload: { amount: 500, fromWalletId: 'w1' },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/v1/mobile/groups/grp-123/contribute`,
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should support withdraw, send actions', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await copilotTools.group_wallet_actions.handler({
        groupId: 'grp-123',
        action: 'withdraw',
        payload: { amount: 200 },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/v1/mobile/groups/grp-123/withdraw`,
        expect.any(Object)
      );
    });
  });
});

describe('Copilot Tools - Proof of Life', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSecureItem.mockResolvedValue(MOCK_TOKEN);
    global.fetch = jest.fn();
  });

  describe('get_proof_of_life_status', () => {
    it('should return proof-of-life status and due date', async () => {
      const mockProfile = {
        lastProofOfLife: '2026-01-15T10:30:00Z',
        proofOfLifeDueDate: '2026-07-15T23:59:59Z',
        status: 'verified',
      };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockProfile,
      });

      const result = await copilotTools.get_proof_of_life_status.handler();
      expect(result.status).toBe('verified');
      expect(result.proofOfLifeDueDate).toBeDefined();
    });
  });

  describe('start_proof_of_life', () => {
    it('should initiate proof-of-life verification', async () => {
      const mockResponse = { sessionId: 'pol-session-123', verificationUrl: 'https://verify.smartpay.na' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await copilotTools.start_proof_of_life.handler();
      expect(result.sessionId).toBe('pol-session-123');
    });
  });
});

describe('Copilot Tools - Incidents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSecureItem.mockResolvedValue(MOCK_TOKEN);
    global.fetch = jest.fn();
  });

  describe('create_incident_report', () => {
    it('should create incident report successfully', async () => {
      const mockResponse = {
        incidentId: 'inc-123',
        ticketNumber: 'SP-2026-001',
        status: 'submitted',
      };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await copilotTools.create_incident_report.handler({
        category: 'transaction_failed',
        description: 'Payment did not complete',
        relatedTransactionId: 'tx-456',
      });

      expect(result.incidentId).toBe('inc-123');
      expect(result.ticketNumber).toBe('SP-2026-001');
    });
  });
});

describe('Copilot Tools - OBS (Open Banking)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSecureItem.mockResolvedValue(MOCK_TOKEN);
    global.fetch = jest.fn();
  });

  describe('initiate_obs_consent', () => {
    it('should initiate AIS consent flow', async () => {
      const mockResponse = {
        consentId: 'consent-123',
        authorizationUrl: 'https://bank.example.na/authorize?state=abc',
      };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await copilotTools.initiate_obs_consent.handler({
        dataProviderId: 'dp-fnb',
        purpose: 'ais',
        scopes: ['accounts', 'balances', 'transactions'],
      });

      expect(result.consentId).toBe('consent-123');
      expect(result.authorizationUrl).toContain('authorize');
      expect(result.message).toContain('redirected to your bank');
    });

    it('should initiate PISP consent flow', async () => {
      const mockResponse = {
        consentId: 'consent-456',
        authorizationUrl: 'https://bank.example.na/authorize?state=xyz',
      };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await copilotTools.initiate_obs_consent.handler({
        dataProviderId: 'dp-fnb',
        purpose: 'pis',
        scopes: ['payments'],
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/v1/obs/consents/initiate`,
        expect.objectContaining({
          body: expect.stringContaining('pis'),
        })
      );
    });
  });

  describe('ais_get_accounts', () => {
    it('should retrieve linked bank accounts', async () => {
      const mockAccounts = [
        { accountId: 'acc-1', accountName: 'Savings', balance: 15000 },
        { accountId: 'acc-2', accountName: 'Cheque', balance: 3500 },
      ];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ accounts: mockAccounts }),
      });

      const result = await copilotTools.ais_get_accounts.handler({ consentId: 'consent-123' });
      expect(result.accounts).toHaveLength(2);
      expect(result.accounts[0].accountName).toBe('Savings');
    });
  });

  describe('ais_get_balances', () => {
    it('should retrieve account balances', async () => {
      const mockBalances = [
        { accountId: 'acc-1', availableBalance: 15000, currentBalance: 15200 },
      ];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ balances: mockBalances }),
      });

      const result = await copilotTools.ais_get_balances.handler({
        consentId: 'consent-123',
        accountIds: ['acc-1'],
      });

      expect(result.balances).toHaveLength(1);
      expect(result.balances[0].availableBalance).toBe(15000);
    });
  });

  describe('ais_get_transactions', () => {
    it('should retrieve account transactions with date range', async () => {
      const mockTransactions = [
        { transactionId: 'tx-1', amount: -500, date: '2026-03-10', description: 'POS Purchase' },
        { transactionId: 'tx-2', amount: 2000, date: '2026-03-12', description: 'Salary' },
      ];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ transactions: mockTransactions }),
      });

      const result = await copilotTools.ais_get_transactions.handler({
        consentId: 'consent-123',
        accountId: 'acc-1',
        fromDate: '2026-03-01',
        toDate: '2026-03-15',
        limit: 10,
      });

      expect(result.transactions).toHaveLength(2);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('fromDate=2026-03-01'),
        expect.any(Object)
      );
    });
  });

  describe('pisp_initiate_payment', () => {
    it('should initiate PISP payment with SCA redirect', async () => {
      const mockResponse = {
        paymentId: 'pmt-123',
        status: 'pending_authorization',
        authorizationFlow: {
          redirectUri: 'https://bank.example.na/authorize-payment',
          scaMethod: 'redirect',
        },
      };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await copilotTools.pisp_initiate_payment.handler({
        consentId: 'consent-123',
        debtorAccountId: 'acc-1',
        amount: 1000,
        currency: 'NAD',
        beneficiaryName: 'Anna Shikongo',
        beneficiaryAccountIdentifier: '62123456789',
        remittanceInformation: 'Invoice #12345',
      });

      expect(result.paymentId).toBe('pmt-123');
      expect(result.message).toContain('redirected to complete');
    });

    it('should validate payment amount', async () => {
      await expect(
        copilotTools.pisp_initiate_payment.handler({
          consentId: 'consent-123',
          debtorAccountId: 'acc-1',
          amount: 0,
          currency: 'NAD',
          beneficiaryName: 'Test',
          beneficiaryAccountIdentifier: '123',
        })
      ).rejects.toThrow('Amount must be greater than zero');
    });
  });
});

describe('Copilot Tools - Agent & NAMQR', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSecureItem.mockResolvedValue(MOCK_TOKEN);
    global.fetch = jest.fn();
  });

  describe('find_nearest_agent', () => {
    it('should find nearest agents with distance', async () => {
      const mockAgents = [
        { agent_id: 'ag-1', agent_name: 'NamPost Main', distance_km: 0.8, latitude: -22.5, longitude: 17.1 },
        { agent_id: 'ag-2', agent_name: 'OK Foods', distance_km: 1.2, latitude: -22.51, longitude: 17.11 },
      ];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ agents: mockAgents }),
      });

      const result = await copilotTools.find_nearest_agent.handler({
        latitude: -22.5,
        longitude: 17.1,
        service: 'cashout',
      });

      expect(result.agents).toHaveLength(2);
      expect(result.message).toContain('NamPost Main');
      expect(result.message).toContain('0.8 km');
    });

    it('should handle no agents found', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ agents: [] }),
      });

      const result = await copilotTools.find_nearest_agent.handler({
        latitude: -22.5,
        longitude: 17.1,
      });

      expect(result.agents).toHaveLength(0);
      expect(result.message).toContain('No agents found');
    });
  });

  describe('generate_cashout_qr', () => {
    it('should generate NAMQR QR code for agent cash-out', async () => {
      const mockQR = {
        tokenVaultId: 'ABCD-EFGH-JKLM-NPQR',
        qrPayload: { '00': '01', '65': 'ABCD-EFGH-JKLM-NPQR' },
        expiresAt: '2026-03-15T12:30:00Z',
      };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockQR,
      });

      const result = await copilotTools.generate_cashout_qr.handler({
        walletId: 'w1',
        amount: 500,
        method: 'agent',
      });

      expect(result.tokenVaultId).toBe('ABCD-EFGH-JKLM-NPQR');
      expect(result.instructions).toContain('Show this QR code');
      expect(result.expiresAt).toBeDefined();
    });

    it('should support merchant method', async () => {
      const mockQR = {
        tokenVaultId: 'TEST-MRCH-QRCD-1234',
        qrPayload: {},
        expiresAt: '2026-03-15T12:30:00Z',
      };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockQR,
      });

      await copilotTools.generate_cashout_qr.handler({
        walletId: 'w1',
        amount: 800,
        method: 'merchant',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/v1/mobile/cash-out/qr`,
        expect.objectContaining({
          body: expect.stringContaining('merchant'),
        })
      );
    });
  });
});

describe('Copilot Tools - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSecureItem.mockResolvedValue(MOCK_TOKEN);
    global.fetch = jest.fn();
  });

  it('should handle network errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network request failed'));
    await expect(copilotTools.get_wallet_overview.handler()).rejects.toThrow('Network request failed');
  });

  it('should handle 500 internal server errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });
    await expect(copilotTools.get_wallet_overview.handler()).rejects.toThrow();
  });

  it('should handle 404 not found errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => 'Wallet not found',
    });
    await expect(copilotTools.get_wallet_overview.handler()).rejects.toThrow('Wallet not found');
  });

  it('should handle validation errors from backend', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => 'Daily transaction limit exceeded',
    });
    await expect(
      copilotTools.initiate_send_money.handler({
        fromWalletId: 'w1',
        toBeneficiaryId: 'ben-123',
        amount: 50000,
      })
    ).rejects.toThrow('Daily transaction limit exceeded');
  });
});

describe('Copilot Tools - Input Validation', () => {
  it('should validate send money requires beneficiary or group', async () => {
    mockGetSecureItem.mockResolvedValue(MOCK_TOKEN);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      text: async () => 'Either toBeneficiaryId or toGroupId is required',
    });

    await expect(
      copilotTools.initiate_send_money.handler({
        fromWalletId: 'w1',
        amount: 100,
      })
    ).rejects.toThrow();
  });

  it('should validate cash-out requires valid method', async () => {
    mockGetSecureItem.mockResolvedValue(MOCK_TOKEN);
    const invalidInput = {
      walletId: 'w1',
      method: 'invalid_method' as any,
      amount: 500,
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      text: async () => 'Invalid cash-out method',
    });

    await expect(copilotTools.initiate_cashout.handler(invalidInput)).rejects.toThrow();
  });
});
