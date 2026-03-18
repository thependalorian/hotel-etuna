/**
 * E2E Tests for Critical User Paths
 * Tests complete user journeys from login to transaction completion
 * Location: fintech/smartpay/e2e/critical-paths.test.ts
 * Framework: Detox + Jest
 */
import { device, element, by, expect as detoxExpect, waitFor } from 'detox';

describe('Critical Path: Login → Balance Check → Success', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { location: 'always', camera: 'YES', notifications: 'YES' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete login flow successfully', async () => {
    await detoxExpect(element(by.id('login-screen'))).toBeVisible();

    await element(by.id('phone-input')).typeText('+264811234567');
    await element(by.id('continue-button')).tap();

    await waitFor(element(by.id('verification-screen')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('otp-input-0')).typeText('1');
    await element(by.id('otp-input-1')).typeText('2');
    await element(by.id('otp-input-2')).typeText('3');
    await element(by.id('otp-input-3')).typeText('4');
    await element(by.id('otp-input-4')).typeText('5');
    await element(by.id('otp-input-5')).typeText('6');

    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(10000);

    await detoxExpect(element(by.id('home-screen'))).toBeVisible();
  });

  it('should navigate to Copilot and check balance', async () => {
    await element(by.id('tab-copilot')).tap();

    await waitFor(element(by.id('copilot-screen')))
      .toBeVisible()
      .withTimeout(3000);

    await element(by.id('suggestion-chip-balance')).tap();

    await waitFor(element(by.text('Wallet Overview')))
      .toBeVisible()
      .withTimeout(5000);

    await detoxExpect(element(by.id('wallet-balance-card'))).toBeVisible();
    await detoxExpect(element(by.id('wallet-balance-amount'))).toExist();
  });
});

describe('Critical Path: Login → Send Money → Confirm → Success', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete full send money flow with PIN confirmation', async () => {
    await detoxExpect(element(by.id('login-screen'))).toBeVisible();
    await element(by.id('phone-input')).typeText('+264811234567');
    await element(by.id('continue-button')).tap();

    await waitFor(element(by.id('verification-screen')))
      .toBeVisible()
      .withTimeout(5000);

    for (let i = 0; i < 6; i++) {
      await element(by.id(`otp-input-${i}`)).typeText(String(i + 1));
    }

    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.id('tab-copilot')).tap();

    await waitFor(element(by.id('copilot-screen')))
      .toBeVisible()
      .withTimeout(3000);

    await element(by.id('copilot-message-input')).typeText('Send N$100 to Anna');
    await element(by.id('copilot-send-button')).tap();

    await waitFor(element(by.id('copilot-confirmation-modal')))
      .toBeVisible()
      .withTimeout(8000);

    await detoxExpect(element(by.text('Confirm Transaction'))).toBeVisible();
    await detoxExpect(element(by.text('N$100.00'))).toBeVisible();

    await element(by.id('pin-input-0')).typeText('1');
    await element(by.id('pin-input-1')).typeText('2');
    await element(by.id('pin-input-2')).typeText('3');
    await element(by.id('pin-input-3')).typeText('4');

    await waitFor(element(by.text('Transaction Successful')))
      .toBeVisible()
      .withTimeout(10000);

    await detoxExpect(element(by.id('success-message'))).toBeVisible();
  });

  it('should show transaction in recent activity', async () => {
    await element(by.id('tab-copilot')).tap();
    await waitFor(element(by.id('copilot-screen'))).toBeVisible();

    await element(by.id('copilot-message-input')).typeText('Show my recent activity');
    await element(by.id('copilot-send-button')).tap();

    await waitFor(element(by.id('activity-summary-card')))
      .toBeVisible()
      .withTimeout(8000);

    await detoxExpect(element(by.id('recent-transaction-0'))).toBeVisible();
  });

  it('should reject incorrect PIN', async () => {
    await element(by.id('tab-copilot')).tap();
    await element(by.id('copilot-message-input')).typeText('Send N$50 to Ben');
    await element(by.id('copilot-send-button')).tap();

    await waitFor(element(by.id('copilot-confirmation-modal')))
      .toBeVisible()
      .withTimeout(8000);

    await element(by.id('pin-input-0')).typeText('9');
    await element(by.id('pin-input-1')).typeText('9');
    await element(by.id('pin-input-2')).typeText('9');
    await element(by.id('pin-input-3')).typeText('9');

    await waitFor(element(by.text('Incorrect PIN')))
      .toBeVisible()
      .withTimeout(5000);

    await detoxExpect(element(by.id('error-message'))).toBeVisible();
  });
});

describe('Critical Path: Cash-Out with QR', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete ATM cash-out with QR generation', async () => {
    await detoxExpect(element(by.id('login-screen'))).toBeVisible();
    await element(by.id('phone-input')).typeText('+264811234567');
    await element(by.id('continue-button')).tap();

    await waitFor(element(by.id('verification-screen')))
      .toBeVisible()
      .withTimeout(5000);

    for (let i = 0; i < 6; i++) {
      await element(by.id(`otp-input-${i}`)).typeText(String(i + 1));
    }

    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.id('tab-copilot')).tap();

    await element(by.id('copilot-message-input')).typeText('Withdraw N$500 at ATM');
    await element(by.id('copilot-send-button')).tap();

    await waitFor(element(by.id('copilot-confirmation-modal')))
      .toBeVisible()
      .withTimeout(8000);

    await element(by.id('pin-input-0')).typeText('1');
    await element(by.id('pin-input-1')).typeText('2');
    await element(by.id('pin-input-2')).typeText('3');
    await element(by.id('pin-input-3')).typeText('4');

    await waitFor(element(by.id('qr-code-display')))
      .toBeVisible()
      .withTimeout(10000);

    await detoxExpect(element(by.id('qr-code-image'))).toBeVisible();
    await detoxExpect(element(by.id('token-vault-id'))).toBeVisible();
    await detoxExpect(element(by.id('qr-expiry-time'))).toBeVisible();

    await element(by.id('save-qr-button')).tap();
    await detoxExpect(element(by.text('QR code saved'))).toBeVisible();
  });

  it('should find nearest agent before cash-out', async () => {
    await element(by.id('tab-copilot')).tap();

    await element(by.id('copilot-message-input')).typeText('Where is the nearest agent?');
    await element(by.id('copilot-send-button')).tap();

    await waitFor(element(by.id('agent-location-card')))
      .toBeVisible()
      .withTimeout(8000);

    await detoxExpect(element(by.id('agent-0'))).toBeVisible();
    await detoxExpect(element(by.id('agent-distance-0'))).toBeVisible();

    await element(by.id('agent-0')).tap();
    await detoxExpect(element(by.id('agent-detail-modal'))).toBeVisible();
  });
});

describe('Critical Path: OBS Bank Linking', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should initiate OBS consent flow', async () => {
    await detoxExpect(element(by.id('login-screen'))).toBeVisible();
    await element(by.id('phone-input')).typeText('+264811234567');
    await element(by.id('continue-button')).tap();

    await waitFor(element(by.id('verification-screen')))
      .toBeVisible()
      .withTimeout(5000);

    for (let i = 0; i < 6; i++) {
      await element(by.id(`otp-input-${i}`)).typeText(String(i + 1));
    }

    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.id('tab-copilot')).tap();

    await element(by.id('copilot-message-input')).typeText('Link my FNB bank account');
    await element(by.id('copilot-send-button')).tap();

    await waitFor(element(by.id('obs-consent-screen')))
      .toBeVisible()
      .withTimeout(8000);

    await detoxExpect(element(by.id('consent-provider-name'))).toBeVisible();
    await detoxExpect(element(by.id('consent-scopes-list'))).toBeVisible();
    await detoxExpect(element(by.text('accounts'))).toBeVisible();
    await detoxExpect(element(by.text('balances'))).toBeVisible();

    await element(by.id('consent-authorize-button')).tap();

    await waitFor(element(by.id('consent-pending-message')))
      .toBeVisible()
      .withTimeout(5000);
  });
});

describe('Critical Path: Loan Application', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should check loan eligibility and apply', async () => {
    await detoxExpect(element(by.id('login-screen'))).toBeVisible();
    await element(by.id('phone-input')).typeText('+264811234567');
    await element(by.id('continue-button')).tap();

    await waitFor(element(by.id('verification-screen')))
      .toBeVisible()
      .withTimeout(5000);

    for (let i = 0; i < 6; i++) {
      await element(by.id(`otp-input-${i}`)).typeText(String(i + 1));
    }

    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.id('tab-copilot')).tap();

    await element(by.id('copilot-message-input')).typeText('How much can I borrow?');
    await element(by.id('copilot-send-button')).tap();

    await waitFor(element(by.id('loan-offer-card')))
      .toBeVisible()
      .withTimeout(8000);

    await detoxExpect(element(by.id('max-loan-amount'))).toBeVisible();
    await detoxExpect(element(by.id('interest-rate'))).toBeVisible();

    await element(by.id('apply-loan-button')).tap();

    await waitFor(element(by.id('copilot-confirmation-modal')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('pin-input-0')).typeText('1');
    await element(by.id('pin-input-1')).typeText('2');
    await element(by.id('pin-input-2')).typeText('3');
    await element(by.id('pin-input-3')).typeText('4');

    await waitFor(element(by.text('Loan Approved')))
      .toBeVisible()
      .withTimeout(10000);

    await detoxExpect(element(by.id('loan-id'))).toBeVisible();
  });
});

describe('Critical Path: Voucher Redemption', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should redeem voucher to wallet', async () => {
    await detoxExpect(element(by.id('login-screen'))).toBeVisible();
    await element(by.id('phone-input')).typeText('+264811234567');
    await element(by.id('continue-button')).tap();

    await waitFor(element(by.id('verification-screen')))
      .toBeVisible()
      .withTimeout(5000);

    for (let i = 0; i < 6; i++) {
      await element(by.id(`otp-input-${i}`)).typeText(String(i + 1));
    }

    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.id('tab-copilot')).tap();

    await element(by.id('copilot-message-input')).typeText('Redeem voucher VCH-123 to my wallet');
    await element(by.id('copilot-send-button')).tap();

    await waitFor(element(by.text('Voucher Redeemed')))
      .toBeVisible()
      .withTimeout(8000);

    await detoxExpect(element(by.id('redemption-amount'))).toBeVisible();
    await detoxExpect(element(by.id('wallet-updated'))).toBeVisible();
  });
});

describe('Critical Path: User Inactivity Lock', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should lock app after inactivity and require unlock', async () => {
    await detoxExpect(element(by.id('login-screen'))).toBeVisible();
    await element(by.id('phone-input')).typeText('+264811234567');
    await element(by.id('continue-button')).tap();

    await waitFor(element(by.id('verification-screen')))
      .toBeVisible()
      .withTimeout(5000);

    for (let i = 0; i < 6; i++) {
      await element(by.id(`otp-input-${i}`)).typeText(String(i + 1));
    }

    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(10000);

    await device.sendToHome();
    await device.launchApp({ newInstance: false });

    await waitFor(element(by.id('lock-screen')))
      .toBeVisible()
      .withTimeout(3000);

    await detoxExpect(element(by.id('unlock-pin-input'))).toBeVisible();

    await element(by.id('pin-input-0')).typeText('1');
    await element(by.id('pin-input-1')).typeText('2');
    await element(by.id('pin-input-2')).typeText('3');
    await element(by.id('pin-input-3')).typeText('4');

    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });
});

describe('Critical Path: Group Wallet Contribution', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should contribute to group wallet', async () => {
    await detoxExpect(element(by.id('login-screen'))).toBeVisible();
    await element(by.id('phone-input')).typeText('+264811234567');
    await element(by.id('continue-button')).tap();

    await waitFor(element(by.id('verification-screen')))
      .toBeVisible()
      .withTimeout(5000);

    for (let i = 0; i < 6; i++) {
      await element(by.id(`otp-input-${i}`)).typeText(String(i + 1));
    }

    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.id('tab-copilot')).tap();

    await element(by.id('copilot-message-input')).typeText('Add N$200 to my savings group');
    await element(by.id('copilot-send-button')).tap();

    await waitFor(element(by.id('copilot-confirmation-modal')))
      .toBeVisible()
      .withTimeout(8000);

    await element(by.id('pin-input-0')).typeText('1');
    await element(by.id('pin-input-1')).typeText('2');
    await element(by.id('pin-input-2')).typeText('3');
    await element(by.id('pin-input-3')).typeText('4');

    await waitFor(element(by.text('Contribution Successful')))
      .toBeVisible()
      .withTimeout(10000);

    await detoxExpect(element(by.id('group-balance-updated'))).toBeVisible();
  });
});

describe('Critical Path: Incident Reporting', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should create incident report for failed transaction', async () => {
    await detoxExpect(element(by.id('login-screen'))).toBeVisible();
    await element(by.id('phone-input')).typeText('+264811234567');
    await element(by.id('continue-button')).tap();

    await waitFor(element(by.id('verification-screen')))
      .toBeVisible()
      .withTimeout(5000);

    for (let i = 0; i < 6; i++) {
      await element(by.id(`otp-input-${i}`)).typeText(String(i + 1));
    }

    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.id('tab-copilot')).tap();

    await element(by.id('copilot-message-input')).typeText(
      'Report issue: My payment to merchant failed without confirmation'
    );
    await element(by.id('copilot-send-button')).tap();

    await waitFor(element(by.text('Incident Reported')))
      .toBeVisible()
      .withTimeout(8000);

    await detoxExpect(element(by.id('incident-ticket-number'))).toBeVisible();
    await detoxExpect(element(by.id('incident-status'))).toHaveText('submitted');
  });
});

describe('Accessibility: Screen Reader Support', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should have proper accessibility labels', async () => {
    await detoxExpect(element(by.id('login-screen'))).toBeVisible();

    await detoxExpect(element(by.id('phone-input'))).toHaveLabel('Phone number input');
    await detoxExpect(element(by.id('continue-button'))).toHaveLabel('Continue to verification');
  });
});

describe('Performance: Response Times', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should load copilot screen within 3 seconds', async () => {
    const startTime = Date.now();

    await element(by.id('tab-copilot')).tap();

    await waitFor(element(by.id('copilot-screen')))
      .toBeVisible()
      .withTimeout(3000);

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });

  it('should display wallet balance within 2 seconds', async () => {
    await element(by.id('tab-copilot')).tap();

    const startTime = Date.now();
    await element(by.id('suggestion-chip-balance')).tap();

    await waitFor(element(by.id('wallet-balance-card')))
      .toBeVisible()
      .withTimeout(2000);

    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(2000);
  });
});
