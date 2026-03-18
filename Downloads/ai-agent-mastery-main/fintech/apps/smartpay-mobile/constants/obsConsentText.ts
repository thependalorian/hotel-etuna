/**
 * OBS 2025 §9.6.3: Mandatory text for all consent and transaction screens.
 * Location: fintech/smartpay/constants/obsConsentText.ts
 */
export const OBS_MANDATORY_TEXT = {
  schemeStatement: (schemeName: string) =>
    `This service is provided within the rules of the ${schemeName}.`,

  tppParticipationStatement: (tppName: string, participantId: string, schemeName: string) =>
    `${tppName} is a registered Third Party Provider under the ${schemeName}, Participant ID ${participantId}.`,

  schemeWebpageLink: (url: string) =>
    `More information about the scheme, registered providers and banks can be found at ${url}.`,

  consentSummary: (who: string, what: string, duration: string) =>
    `You are granting ${who} permission to ${what} for ${duration}.`,

  consentRevokeNote: () =>
    `You can revoke this access at any time from your Smartpay app settings.`,

  dataProviderStatement: (dpName: string, schemeName: string) =>
    `${dpName} is a registered participant of the ${schemeName}.`,

  scaNotice: () =>
    `You will be redirected to your bank to confirm your identity before this action is completed.`,

  dataUseStatement: () =>
    `Your data will only be used for the purpose you have authorised and will not be shared with third parties.`,
};

export const OBS_SCOPES_PLAIN_LANGUAGE: Record<string, string> = {
  'banking:accounts.basic.read': 'View your bank account list and details',
  'banking:payments.write': 'Initiate payments from your bank account',
  'banking:payments.read': 'View the status of payments initiated through this app',
  'consent:authorisationcode.write': 'Authorise your consent',
};
