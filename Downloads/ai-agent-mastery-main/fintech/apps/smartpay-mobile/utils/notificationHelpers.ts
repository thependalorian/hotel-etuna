import { notificationService } from '@/services/notifications';
import type { NotificationType } from '@/types/notifications';

export function formatCurrency(amount: number, currency: string = 'NAD'): string {
  return `${currency === 'NAD' ? 'N$' : currency}${amount.toFixed(2)}`;
}

export function getNotificationTitle(type: NotificationType): string {
  const titles: Record<NotificationType, string> = {
    payment_received: 'Payment Received',
    payment_sent: 'Payment Sent',
    kyc_status_update: 'KYC Update',
    proof_of_life_reminder: 'Proof-of-Life Reminder',
    voucher_received: 'Voucher Received',
    group_invitation: 'Group Invitation',
    loan_status_update: 'Loan Update',
    transaction_failed: 'Transaction Failed',
    wallet_low_balance: 'Low Balance',
    payment_request_received: 'Payment Request',
    payment_request_paid: 'Request Paid',
    system_announcement: 'SmartPay',
  };
  return titles[type] || 'Notification';
}

export async function notifyPaymentReceived(
  amount: number,
  senderName: string,
  transactionId: string
): Promise<void> {
  await notificationService.scheduleLocal({
    type: 'payment_received',
    title: getNotificationTitle('payment_received'),
    body: `You received ${formatCurrency(amount)} from ${senderName}`,
    data: {
      transactionId,
      amount,
      senderName,
      deepLink: `/transactions/${transactionId}`,
    },
    trigger: { seconds: 1 },
  });
}

export async function notifyPaymentSent(
  amount: number,
  recipientName: string,
  transactionId: string
): Promise<void> {
  await notificationService.scheduleLocal({
    type: 'payment_sent',
    title: getNotificationTitle('payment_sent'),
    body: `Successfully sent ${formatCurrency(amount)} to ${recipientName}`,
    data: {
      transactionId,
      amount,
      recipientName,
      deepLink: `/transactions/${transactionId}`,
    },
    trigger: { seconds: 1 },
  });
}

export async function notifyKYCStatusUpdate(
  status: 'approved' | 'rejected' | 'pending' | 'requires_documents',
  message?: string
): Promise<void> {
  const statusMessages: Record<string, string> = {
    approved: 'Your identity has been verified! You can now access all SmartPay features.',
    rejected: 'Your KYC verification was not successful. Please contact support.',
    pending: 'Your KYC documents are being reviewed. This may take 1-2 business days.',
    requires_documents: message || 'Additional documents required to complete verification.',
  };

  await notificationService.scheduleLocal({
    type: 'kyc_status_update',
    title: getNotificationTitle('kyc_status_update'),
    body: statusMessages[status] || message || 'Your KYC status has been updated',
    data: {
      kycStatus: status,
      deepLink: '/kyc',
    },
    trigger: { seconds: 1 },
  });
}

export async function notifyProofOfLifeDue(daysRemaining: number): Promise<void> {
  const messages: Record<number, string> = {
    7: 'Your proof-of-life expires in 7 days. Please verify to continue receiving grants.',
    3: 'Your proof-of-life expires in 3 days. Verify now to avoid service interruption.',
    1: 'Your proof-of-life expires tomorrow! Please verify immediately.',
  };

  await notificationService.scheduleLocal({
    type: 'proof_of_life_reminder',
    title: 'Proof-of-Life Reminder',
    body: messages[daysRemaining] || `Your proof-of-life expires in ${daysRemaining} days`,
    data: {
      daysRemaining,
      deepLink: '/proof-of-life',
    },
    trigger: { seconds: 1 },
  });
}

export async function notifyVoucherReceived(
  voucherCode: string,
  amount: number,
  expiryDate: Date
): Promise<void> {
  await notificationService.scheduleLocal({
    type: 'voucher_received',
    title: getNotificationTitle('voucher_received'),
    body: `You received a ${formatCurrency(amount)} voucher! Use code: ${voucherCode}`,
    data: {
      voucherCode,
      amount,
      expiryDate: expiryDate.toISOString(),
      deepLink: '/vouchers',
    },
    trigger: { seconds: 1 },
  });
}

export async function notifyGroupInvitation(
  groupName: string,
  inviterName: string,
  groupId: string
): Promise<void> {
  await notificationService.scheduleLocal({
    type: 'group_invitation',
    title: getNotificationTitle('group_invitation'),
    body: `${inviterName} invited you to join ${groupName}`,
    data: {
      groupId,
      groupName,
      inviterName,
      deepLink: `/groups/${groupId}`,
    },
    trigger: { seconds: 1 },
  });
}

export async function notifyLoanStatusUpdate(
  status: 'approved' | 'rejected' | 'pending',
  amount: number,
  loanId: string
): Promise<void> {
  const statusMessages: Record<string, string> = {
    approved: `Your loan application for ${formatCurrency(amount)} has been approved!`,
    rejected: `Your loan application for ${formatCurrency(amount)} was not approved.`,
    pending: `Your loan application for ${formatCurrency(amount)} is being reviewed.`,
  };

  await notificationService.scheduleLocal({
    type: 'loan_status_update',
    title: getNotificationTitle('loan_status_update'),
    body: statusMessages[status],
    data: {
      loanId,
      status,
      amount,
      deepLink: `/loans/${loanId}`,
    },
    trigger: { seconds: 1 },
  });
}

export async function notifyTransactionFailed(
  amount: number,
  recipientName: string,
  errorMessage: string
): Promise<void> {
  await notificationService.scheduleLocal({
    type: 'transaction_failed',
    title: getNotificationTitle('transaction_failed'),
    body: `Failed to send ${formatCurrency(amount)} to ${recipientName}. ${errorMessage}`,
    data: {
      amount,
      recipientName,
      errorMessage,
      deepLink: '/transactions',
    },
    trigger: { seconds: 1 },
  });
}

export async function notifyLowBalance(
  balance: number,
  threshold: number = 50,
  walletId?: string
): Promise<void> {
  if (balance >= threshold) return;

  await notificationService.scheduleLocal({
    type: 'wallet_low_balance',
    title: getNotificationTitle('wallet_low_balance'),
    body: `Your wallet balance is ${formatCurrency(balance)}. Top up to continue making payments.`,
    data: {
      balance,
      threshold,
      walletId,
      deepLink: walletId ? `/wallets/${walletId}` : '/wallets',
    },
    trigger: { seconds: 1 },
  });
}

export async function notifyPaymentRequest(
  amount: number,
  requesterName: string,
  requestId: string
): Promise<void> {
  await notificationService.scheduleLocal({
    type: 'payment_request_received',
    title: getNotificationTitle('payment_request_received'),
    body: `${requesterName} requested ${formatCurrency(amount)}`,
    data: {
      amount,
      requesterName,
      requestId,
      deepLink: `/requests/${requestId}`,
    },
    trigger: { seconds: 1 },
  });
}

export async function notifyPaymentRequestPaid(
  amount: number,
  payerName: string,
  requestId: string
): Promise<void> {
  await notificationService.scheduleLocal({
    type: 'payment_request_paid',
    title: getNotificationTitle('payment_request_paid'),
    body: `${payerName} paid your request of ${formatCurrency(amount)}`,
    data: {
      amount,
      payerName,
      requestId,
      deepLink: `/requests/${requestId}`,
    },
    trigger: { seconds: 1 },
  });
}

export async function notifySystemAnnouncement(
  title: string,
  message: string
): Promise<void> {
  await notificationService.scheduleLocal({
    type: 'system_announcement',
    title: title || getNotificationTitle('system_announcement'),
    body: message,
    data: {
      deepLink: '/notifications',
    },
    trigger: { seconds: 1 },
  });
}

export const notificationHelpers = {
  formatCurrency,
  getNotificationTitle,
  notifyPaymentReceived,
  notifyPaymentSent,
  notifyKYCStatusUpdate,
  notifyProofOfLifeDue,
  notifyVoucherReceived,
  notifyGroupInvitation,
  notifyLoanStatusUpdate,
  notifyTransactionFailed,
  notifyLowBalance,
  notifyPaymentRequest,
  notifyPaymentRequestPaid,
  notifySystemAnnouncement,
};
