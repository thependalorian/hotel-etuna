/**
 * Integration Tests for Copilot Flows
 * Tests end-to-end copilot conversation flows with multi-tool interactions
 * Location: fintech/smartpay/__tests__/integration/copilot-flows.test.ts
 */
import { copilotTools } from '../../services/copilotTools';
import * as SecureStorage from '../../services/secureStorage';
// Note: backend db import removed - tests need refactoring for mobile-only context

jest.mock('../../services/secureStorage');
// jest.mock('../../backend/src/lib/db');

const mockGetSecureItem = SecureStorage.getSecureItem as jest.MockedFunction<typeof SecureStorage.getSecureItem>;
// const mockPool = pool as jest.Mocked<typeof pool>;

const API_BASE = 'https://test-api.smartpay.na';
const MOCK_TOKEN = 'mock-jwt-token-integration';
const MOCK_USER_ID = 'user-integration-test';

describe('Integration: Send Money Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSecureItem.mockResolvedValue(MOCK_TOKEN);
    process.env.EXPO_PUBLIC_API_BASE_URL = API_BASE;
    global.fetch = jest.fn();
  });

  it('should complete full send money flow with confirmation', async () => {
    const mockWallets = [
      { id: 'w1', balance: 1500, currency: 'NAD', frozen: false },
    ];

    const mockSendResponse = {
      transactionId: 'tx-send-123',
      status: 'pending_2fa',
      fromWalletId: 'w1',
      toBeneficiaryId: 'ben-anna',
      amount: 200,
      fee: 5.75,
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ wallets: mockWallets }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSendResponse,
      });

    // mockPool.query.mockResolvedValueOnce({ rowCount: 1 } as any);

    const walletOverview = await copilotTools.get_wallet_overview.handler();
    expect(walletOverview.wallets[0].balance).toBe(1500);

    const sendResult = await copilotTools.initiate_send_money.handler({
      fromWalletId: 'w1',
      toBeneficiaryId: 'ben-anna',
      amount: 200,
      note: 'Lunch money',
    });

    expect(sendResult.transactionId).toBe('tx-send-123');
    expect(sendResult.status).toBe('pending_2fa');
    expect(sendResult.fee).toBe(5.75);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      `${API_BASE}/api/v1/mobile/wallets`,
      expect.any(Object)
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      `${API_BASE}/api/v1/mobile/send-money`,
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('should handle insufficient balance error', async () => {
    const mockWallets = [{ id: 'w1', balance: 50, currency: 'NAD', frozen: false }];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ wallets: mockWallets }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: async () => 'Insufficient balance. Available: N$50.00',
      });

    await copilotTools.get_wallet_overview.handler();

    await expect(
      copilotTools.initiate_send_money.handler({
        fromWalletId: 'w1',
        toBeneficiaryId: 'ben-anna',
        amount: 200,
      })
    ).rejects.toThrow('Insufficient balance');
  });
});

describe('Integration: Cash-Out Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSecureItem.mockResolvedValue(MOCK_TOKEN);
    global.fetch = jest.fn();
  });

  it('should complete ATM cash-out with QR generation', async () => {
    const mockWallets = [{ id: 'w1', balance: 2000, currency: 'NAD', frozen: false }];
    const mockCashoutResponse = {
      cashoutId: 'co-atm-123',
      status: 'pending_qr',
      message: 'Generate QR code for ATM withdrawal',
    };
    const mockQRResponse = {
      tokenVaultId: 'ABCD-EFGH-JKLM-NPQR',
      qrPayload: { '00': '01', '54': '500.00', '65': 'ABCD-EFGH-JKLM-NPQR', '63': 'A1B2' },
      expiresAt: '2026-03-15T12:30:00Z',
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ wallets: mockWallets }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCashoutResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQRResponse,
      });

    const walletOverview = await copilotTools.get_wallet_overview.handler();
    expect(walletOverview.wallets[0].balance).toBe(2000);

    const cashoutResult = await copilotTools.initiate_cashout.handler({
      walletId: 'w1',
      method: 'atm',
      amount: 500,
    });
    expect(cashoutResult.cashoutId).toBe('co-atm-123');

    const qrResult = await copilotTools.generate_cashout_qr.handler({
      walletId: 'w1',
      amount: 500,
      method: 'agent',
    });

    expect(qrResult.tokenVaultId).toBe('ABCD-EFGH-JKLM-NPQR');
    expect(qrResult.instructions).toContain('Show this QR code');
    expect(qrResult.qrPayload['63']).toBe('A1B2'); // CRC-16
  });

  it('should complete bank cash-out flow', async () => {
    const mockCashoutResponse = {
      cashoutId: 'co-bank-456',
      status: 'processing',
      estimatedCompletion: '2026-03-16T10:00:00Z',
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ wallets: [{ id: 'w1', balance: 5000 }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCashoutResponse,
      });

    await copilotTools.get_wallet_overview.handler();

    const result = await copilotTools.initiate_cashout.handler({
      walletId: 'w1',
      method: 'bank',
      amount: 1000,
      destinationBankDetails: {
        accountNumber: '62123456789',
        bankCode: 'FNB_NA',
        accountHolder: 'John Doe',
      },
    });

    expect(result.status).toBe('processing');
    expect(result.estimatedCompletion).toBeDefined();
  });
});

describe('Integration: OBS Flow (AIS)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSecureItem.mockResolvedValue(MOCK_TOKEN);
    global.fetch = jest.fn();

    // mockPool.query
    //   .mockResolvedValueOnce({
    //     rows: [{
    //       id: 'dp-fnb',
    //       providerCode: 'FNB',
    //       authorizationEndpoint: 'https://fnb.na/authorize',
    //       tokenEndpoint: 'https://fnb.na/token',
    //       parEndpoint: null,
    //       accountsEndpoint: 'https://fnb.na/api/accounts',
    //       balancesEndpoint: 'https://fnb.na/api/balances',
    //       transactionsEndpoint: 'https://fnb.na/api/transactions',
    //       isActive: true,
    //     }],
    //     rowCount: 1,
    //   } as any)
    //   .mockResolvedValueOnce({ rows: [{ id: 'consent-obs-123' }], rowCount: 1 } as any)
    //   .mockResolvedValueOnce({ rowCount: 1 } as any);
  });

  it('should complete full OBS consent and data retrieval flow', async () => {
    const mockConsentResponse = {
      consentId: 'consent-obs-123',
      authorizationUrl: 'https://fnb.na/authorize?state=xyz123&code_challenge=abc',
    };

    const mockAccounts = [
      { accountId: 'acc-1', accountName: 'Savings Account', currency: 'NAD' },
      { accountId: 'acc-2', accountName: 'Current Account', currency: 'NAD' },
    ];

    const mockBalances = [
      { accountId: 'acc-1', availableBalance: 15000, currentBalance: 15200 },
      { accountId: 'acc-2', availableBalance: 3500, currentBalance: 3500 },
    ];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockConsentResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ accounts: mockAccounts }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ balances: mockBalances }),
      });

    const consentResult = await copilotTools.initiate_obs_consent.handler({
      dataProviderId: 'dp-fnb',
      purpose: 'ais',
      scopes: ['accounts', 'balances', 'transactions'],
    });

    expect(consentResult.consentId).toBe('consent-obs-123');
    expect(consentResult.authorizationUrl).toContain('authorize');

    const accountsResult = await copilotTools.ais_get_accounts.handler({
      consentId: 'consent-obs-123',
    });

    expect(accountsResult.accounts).toHaveLength(2);
    expect(accountsResult.accounts[0].accountName).toBe('Savings Account');

    const balancesResult = await copilotTools.ais_get_balances.handler({
      consentId: 'consent-obs-123',
      accountIds: ['acc-1', 'acc-2'],
    });

    expect(balancesResult.balances).toHaveLength(2);
    expect(balancesResult.balances[0].availableBalance).toBe(15000);

    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('should retrieve transactions after account linking', async () => {
    const mockTransactions = [
      {
        transactionId: 'tx-1',
        amount: -250,
        date: '2026-03-10',
        description: 'Woolworths POS',
        balance: 14750,
      },
      {
        transactionId: 'tx-2',
        amount: 5000,
        date: '2026-03-01',
        description: 'Salary deposit',
        balance: 15000,
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ transactions: mockTransactions }),
    });

    const result = await copilotTools.ais_get_transactions.handler({
      consentId: 'consent-obs-123',
      accountId: 'acc-1',
      fromDate: '2026-03-01',
      toDate: '2026-03-15',
      limit: 10,
    });

    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0].description).toContain('Woolworths');
  });
});

describe('Integration: Loan Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSecureItem.mockResolvedValue(MOCK_TOKEN);
    global.fetch = jest.fn();
  });

  it('should complete loan eligibility check and application', async () => {
    const mockOffer = {
      eligible: true,
      maxLoanAmount: 5000,
      interestRate: 0.15,
      repaymentPeriod: 30,
      backingVouchers: [
        { voucherId: 'vch-1', amount: 3000 },
        { voucherId: 'vch-2', amount: 2500 },
      ],
    };

    const mockLoanResponse = {
      loanId: 'ln-flow-123',
      status: 'approved',
      amountApproved: 3000,
      disbursementWalletId: 'w1',
      repaymentDue: '2026-04-14',
      totalRepayment: 3450,
    };

    const mockWalletAfterLoan = [
      { id: 'w1', balance: 4500, currency: 'NAD', frozen: false },
    ];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockOffer,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoanResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ wallets: mockWalletAfterLoan }),
      });

    const offerResult = await copilotTools.get_loan_offer.handler();
    expect(offerResult.eligible).toBe(true);
    expect(offerResult.maxLoanAmount).toBe(5000);

    const loanResult = await copilotTools.apply_for_loan.handler({ amount: 3000 });
    expect(loanResult.loanId).toBe('ln-flow-123');
    expect(loanResult.status).toBe('approved');

    const walletCheck = await copilotTools.get_wallet_overview.handler();
    expect(walletCheck.wallets[0].balance).toBe(4500); // Original 1500 + loan 3000
  });

  it('should handle loan rejection due to ineligibility', async () => {
    const mockOffer = {
      eligible: false,
      reason: 'No eligible vouchers found',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockOffer,
    });

    const offerResult = await copilotTools.get_loan_offer.handler();
    expect(offerResult.eligible).toBe(false);
    expect(offerResult.reason).toContain('No eligible vouchers');
  });
});

describe('Integration: Group Wallet Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSecureItem.mockResolvedValue(MOCK_TOKEN);
    global.fetch = jest.fn();
  });

  it('should complete group contribution flow', async () => {
    const mockGroupWallet = {
      groupId: 'grp-savings-123',
      balance: 8500,
      members: 12,
      contributionsThisMonth: 2500,
    };

    const mockContributeResponse = {
      contributed: true,
      newBalance: 9000,
      contribution: 500,
    };

    const mockUpdatedWallet = {
      groupId: 'grp-savings-123',
      balance: 9000,
      members: 12,
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockGroupWallet,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockContributeResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdatedWallet,
      });

    const initialBalance = await copilotTools.group_wallet_actions.handler({
      groupId: 'grp-savings-123',
      action: 'balance',
    });
    expect(initialBalance.balance).toBe(8500);

    const contributeResult = await copilotTools.group_wallet_actions.handler({
      groupId: 'grp-savings-123',
      action: 'contribute',
      payload: { amount: 500, fromWalletId: 'w1' },
    });
    expect(contributeResult.contributed).toBe(true);

    const finalBalance = await copilotTools.group_wallet_actions.handler({
      groupId: 'grp-savings-123',
      action: 'balance',
    });
    expect(finalBalance.balance).toBe(9000);
  });
});

describe('Integration: Voucher Redemption Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSecureItem.mockResolvedValue(MOCK_TOKEN);
    global.fetch = jest.fn();
  });

  it('should redeem voucher and update wallet balance', async () => {
    const mockWalletBefore = [{ id: 'w1', balance: 500, currency: 'NAD', frozen: false }];
    const mockRedemptionResponse = {
      redeemed: true,
      amount: 1000,
      walletId: 'w1',
      voucherId: 'vch-123',
      transactionId: 'tx-voucher-789',
    };
    const mockWalletAfter = [{ id: 'w1', balance: 1500, currency: 'NAD', frozen: false }];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ wallets: mockWalletBefore }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRedemptionResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ wallets: mockWalletAfter }),
      });

    const initialWallet = await copilotTools.get_wallet_overview.handler();
    expect(initialWallet.wallets[0].balance).toBe(500);

    const redemptionResult = await copilotTools.redeem_voucher.handler({
      voucherId: 'vch-123',
      method: 'wallet',
      walletId: 'w1',
    });
    expect(redemptionResult.redeemed).toBe(true);
    expect(redemptionResult.amount).toBe(1000);

    const finalWallet = await copilotTools.get_wallet_overview.handler();
    expect(finalWallet.wallets[0].balance).toBe(1500);
  });
});

describe('Integration: Incident Reporting with Context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSecureItem.mockResolvedValue(MOCK_TOKEN);
    global.fetch = jest.fn();
  });

  it('should create incident with transaction context', async () => {
    const mockActivity = {
      totalCredits: 5000,
      totalDebits: 3500,
      recentTransactions: [
        { transactionId: 'tx-failed-999', status: 'failed', amount: 500 },
      ],
    };

    const mockIncidentResponse = {
      incidentId: 'inc-flow-123',
      ticketNumber: 'SP-2026-001',
      status: 'submitted',
      estimatedResolution: '2026-03-18',
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockActivity,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockIncidentResponse,
      });

    const activity = await copilotTools.get_recent_activity.handler({ days: 7 });
    const failedTx = activity.recentTransactions[0];

    const incidentResult = await copilotTools.create_incident_report.handler({
      category: 'transaction_failed',
      description: 'Payment to merchant failed without error message',
      relatedTransactionId: failedTx.transactionId,
    });

    expect(incidentResult.ticketNumber).toBe('SP-2026-001');
    expect(incidentResult.status).toBe('submitted');
  });
});

describe('Integration: Agent Location & Cash-Out', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSecureItem.mockResolvedValue(MOCK_TOKEN);
    global.fetch = jest.fn();
  });

  it('should find agent and complete cash-out', async () => {
    const mockAgents = [
      {
        agent_id: 'ag-nampost-1',
        agent_name: 'NamPost Main Street',
        distance_km: 0.5,
        latitude: -22.5707,
        longitude: 17.0837,
        services: ['cashout', 'voucher_redemption'],
      },
    ];

    const mockCashoutResponse = {
      cashoutId: 'co-agent-789',
      status: 'pending_agent_scan',
      agentId: 'ag-nampost-1',
    };

    const mockQR = {
      tokenVaultId: 'XYZ9-8765-4321-ABCD',
      qrPayload: {},
      expiresAt: '2026-03-15T12:00:00Z',
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ agents: mockAgents }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCashoutResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQR,
      });

    const agentsResult = await copilotTools.find_nearest_agent.handler({
      latitude: -22.5707,
      longitude: 17.0837,
      service: 'cashout',
    });

    expect(agentsResult.agents).toHaveLength(1);
    expect(agentsResult.agents[0].agent_name).toBe('NamPost Main Street');

    const cashoutResult = await copilotTools.initiate_cashout.handler({
      walletId: 'w1',
      method: 'agent',
      amount: 800,
    });

    expect(cashoutResult.cashoutId).toBe('co-agent-789');

    const qrResult = await copilotTools.generate_cashout_qr.handler({
      walletId: 'w1',
      amount: 800,
      method: 'agent',
    });

    expect(qrResult.tokenVaultId).toBe('XYZ9-8765-4321-ABCD');
  });
});

describe('Integration: Proof-of-Life Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSecureItem.mockResolvedValue(MOCK_TOKEN);
    global.fetch = jest.fn();
  });

  it('should check status and initiate verification', async () => {
    const mockStatus = {
      lastProofOfLife: '2025-09-15T10:00:00Z',
      proofOfLifeDueDate: '2026-03-15T23:59:59Z',
      status: 'due_soon',
    };

    const mockVerificationResponse = {
      sessionId: 'pol-session-123',
      verificationUrl: 'https://verify.smartpay.na/pol/abc123',
      methods: ['facial_recognition', 'geolocation'],
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockVerificationResponse,
      });

    const statusResult = await copilotTools.get_proof_of_life_status.handler();
    expect(statusResult.status).toBe('due_soon');

    const verificationResult = await copilotTools.start_proof_of_life.handler();
    expect(verificationResult.sessionId).toBe('pol-session-123');
    expect(verificationResult.verificationUrl).toContain('verify.smartpay.na');
  });
});

describe('Integration: Error Recovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSecureItem.mockResolvedValue(MOCK_TOKEN);
    global.fetch = jest.fn();
  });

  it('should handle partial flow failure gracefully', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ wallets: [{ id: 'w1', balance: 100 }] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: async () => 'Insufficient balance',
      });

    const wallets = await copilotTools.get_wallet_overview.handler();
    expect(wallets.wallets[0].balance).toBe(100);

    await expect(
      copilotTools.initiate_send_money.handler({
        fromWalletId: 'w1',
        toBeneficiaryId: 'ben-123',
        amount: 500,
      })
    ).rejects.toThrow('Insufficient balance');
  });

  it('should retry on network failure', async () => {
    (global.fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('Network timeout'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ wallets: [{ id: 'w1', balance: 1000 }] }),
      });

    await expect(copilotTools.get_wallet_overview.handler()).rejects.toThrow('Network timeout');

    const retryResult = await copilotTools.get_wallet_overview.handler();
    expect(retryResult.wallets).toBeDefined();
  });
});

describe('Integration: Audit Trail Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSecureItem.mockResolvedValue(MOCK_TOKEN);
    // mockPool.query.mockResolvedValue({ rowCount: 1 } as any);
  });

  it.skip('should log all critical operations to audit trail', async () => {
    // Note: This test requires backend context - skipped for mobile-only tests
    // const { logWithAttribution } = require('../../backend/src/lib/etaAttribution');

    const operations = [
      {
        userId: MOCK_USER_ID,
        toolName: 'initiate_send_money',
        action: 'send',
        input: { amount: 100 },
        result: 'success' as const,
        isAutomated: false,
        createdAt: new Date(),
      },
      {
        userId: MOCK_USER_ID,
        toolName: 'initiate_cashout',
        action: 'cashout',
        input: { amount: 500, method: 'atm' },
        result: 'success' as const,
        isAutomated: false,
        createdAt: new Date(),
      },
      {
        userId: MOCK_USER_ID,
        toolName: 'apply_for_loan',
        action: 'loan_application',
        input: { amount: 3000 },
        result: 'success' as const,
        isAutomated: false,
        createdAt: new Date(),
      },
    ];

    // for (const op of operations) {
    //   await logWithAttribution(op);
    // }

    // expect(mockPool.query).toHaveBeenCalledTimes(3);
    // expect(mockPool.query).toHaveBeenCalledWith(
    //   expect.stringContaining('copilot_audit_log'),
    //   expect.any(Array)
    // );
  });
});
