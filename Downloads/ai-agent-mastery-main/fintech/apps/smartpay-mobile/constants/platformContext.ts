/**
 * Paolo Sironi: Banking Reinvention Quadrant positioning for Smartpay copilot.
 * Location: fintech/smartpay/constants/platformContext.ts
 */
export const PLATFORM_POSITIONING = {
  quadrant: 'Contextual Banking',
  description: 'Smartpay copilot embeds financial services into daily life outcomes',

  valueProposition: {
    traditional: 'Menu-driven screens (output: user navigates to service)',
    copilot: 'Intent-driven conversations (outcome: user achieves financial goal)',
  },

  ecosystemRoles: {
    dataProvider: 'Banks (FNB, Bank Windhoek, Nedbank, Standard Bank)',
    tpp: 'Smartpay (AIS + PISP via OBS 2025)',
    accountHolder: 'Grant recipients, informal sector workers, G2P beneficiaries',
    complementors: 'NamPost agents, retail merchants, mobile network operators',
  },

  trustMechanisms: [
    'NAMFISA TPSP license (regulatory trust)',
    'OBS 2025 compliance (technical trust)',
    'ETA 2019 audit trail (legal trust)',
    'PSD-12 cybersecurity (security trust)',
    'Plain-language consent (consumer trust)',
  ],

  communicationPrinciples: [
    'Always show wallet used',
    'Always show fee before confirmation',
    'Always show balance after transaction',
    'Always explain regulatory limits in plain language',
  ],
} as const;
