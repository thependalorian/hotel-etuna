/**
 * Open Banking guest UI flags.
 * Location: lib/payments/open-banking-ui.ts
 *
 * Manual token fields are sandbox-only; production guests use NamQR/card until bank OAuth ships.
 */

export function isOpenBankingSandboxUi(): boolean {
  return process.env.NEXT_PUBLIC_OPEN_BANKING_SANDBOX_UI === 'true';
}
