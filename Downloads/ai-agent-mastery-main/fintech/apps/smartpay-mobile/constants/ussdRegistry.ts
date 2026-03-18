/**
 * Interim USSD channels using bank-owned codes while CRAN shortcode pending.
 * BoN Research 2023; NPS Legal Framework — PSD-3, PSD-9.
 * Location: fintech/smartpay/constants/ussdRegistry.ts
 */
export const BANK_USSD_REGISTRY = {
  fnb: {
    name: 'FNB Namibia',
    ussd: '*140*321#',
    services: ['balance', 'send_money', 'ewallet', 'airtime', 'electricity'],
    requiresBankAccount: true,
    network: ['MTC', 'TN Mobile'],
  },
  bank_windhoek: {
    name: 'Bank Windhoek',
    ussd: '*140*295#',
    services: ['balance', 'easywallet', 'send_money'],
    requiresBankAccount: false,
    network: ['MTC', 'TN Mobile'],
  },
  nedbank: {
    name: 'Nedbank Namibia',
    ussd_banking: '*140*001#',
    ussd_mobimoney: '*140*002#',
    services: ['balance', 'send_money', 'mobimoney'],
    requiresBankAccount: false,
    network: ['MTC', 'TN Mobile'],
  },
  standard_bank: {
    name: 'Standard Bank Namibia',
    ussd: '*140*6626#',
    services: ['paypulse', 'balance', 'send_money'],
    requiresBankAccount: false,
    network: ['MTC', 'TN Mobile'],
  },
} as const;

export type BankCode = keyof typeof BANK_USSD_REGISTRY;

/**
 * Copilot tool helper: suggest USSD channel based on user's bank.
 */
export function getUSSDInstructions(
  bankCode: BankCode,
  action: string
): string {
  const bank = BANK_USSD_REGISTRY[bankCode];
  if (!bank) return `Dial *140# on your phone to access banking services.`;

  const ussd =
    'ussd' in bank
      ? bank.ussd
      : bankCode === 'nedbank'
        ? (bank as (typeof BANK_USSD_REGISTRY)['nedbank']).ussd_banking
        : '*140#';

  const instructions: Record<string, string> = {
    balance: `Dial ${ussd} on your phone → Select "Balance" to check your balance.`,
    send_money: `Dial ${ussd} on your phone → Select "Send Money" → Enter amount and recipient number.`,
    cashout: `Dial ${ussd} on your phone → Select "Cash Out" → Follow the prompts.`,
  };

  return (
    instructions[action] ??
    `Dial ${ussd} on your phone to access ${bank.name} banking services.`
  );
}
