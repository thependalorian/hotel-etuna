/**
 * BoN Financial Inclusion Design Principles mapped to copilot feature requirements.
 * Source: BoN Value Proposition Enhancement Report (PwC, 2023).
 * Location: fintech/smartpay/lib/designPrincipleChecks.ts
 */
export const BON_DESIGN_PRINCIPLES = {
  1: {
    name: 'Cost Effective',
    copilotFeatures: [
      'Fee display before every transaction (PSD-10)',
      'USSD alternative shown when cheaper',
      'Zero-fee actions highlighted',
    ],
    validate: (feeAmount: number, transactionAmount: number): boolean =>
      transactionAmount <= 0 || feeAmount / transactionAmount <= 0.05,
  },
  2: {
    name: 'Easy to Use',
    copilotFeatures: [
      'Max 3 steps for any transaction via copilot',
      'Plain language confirmations',
      'Phone number as proxy (no account number required)',
    ],
    validate: (stepCount: number): boolean => stepCount <= 3,
  },
  3: {
    name: 'Interoperable',
    copilotFeatures: [
      'OBS 2025 AIS/PISP integration',
      'NAMQR v5.0 for cross-bank QR',
      'NamPay integration',
    ],
  },
  4: {
    name: 'Always On',
    copilotFeatures: [
      '99.9% API uptime SLA',
      'Offline NAMQR token for zero-connectivity',
      'USSD fallback on 2G',
    ],
  },
  5: {
    name: 'Secure',
    copilotFeatures: [
      '2FA for all financial actions',
      'PSD-12 cybersecurity controls',
      'NAMQR signed QR verification',
      'ETA 2019 audit trail',
    ],
  },
  6: {
    name: 'Accessible',
    copilotFeatures: [
      'USSD (*140# codes) for 2G/feature phones',
      'Oshiwambo, Afrikaans, English support',
      'Screen reader compatibility (WCAG AA)',
      'Agent-assisted enrollment',
    ],
  },
  7: {
    name: 'Future-Proof',
    copilotFeatures: [
      'ISO 20022 ready data model',
      'NAMQR v5.0 extensible tags',
      'OBS open banking expansion path',
    ],
  },
  8: {
    name: 'Proven',
    copilotFeatures: [
      'Based on established G2P models (NamPost, SSC)',
      'NAMQR EMVCo compliant',
      'OBS 2025 aligned with international FAPI 1.0 standards',
    ],
  },
  9: {
    name: 'Transparent',
    copilotFeatures: [
      'Fee shown before confirmation',
      'Plain-language consent text (OBS §9.6.3)',
      'Audit log accessible by user',
      'ETA 2019 §24-25 legal admissibility',
    ],
  },
} as const;
