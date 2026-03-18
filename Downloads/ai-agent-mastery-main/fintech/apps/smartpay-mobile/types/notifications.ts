export type NotificationType = 
  | 'payment_received'
  | 'payment_sent'
  | 'kyc_status_update'
  | 'proof_of_life_reminder'
  | 'voucher_received'
  | 'group_invitation'
  | 'loan_status_update'
  | 'transaction_failed'
  | 'wallet_low_balance'
  | 'payment_request_received'
  | 'payment_request_paid'
  | 'system_announcement';

export interface NotificationData {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  timestamp: number;
  read: boolean;
  id: string;
}

export interface PushNotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  metadata?: {
    transactionId?: string;
    userId?: string;
    groupId?: string;
    loanId?: string;
    kycStatus?: string;
    amount?: number;
    currency?: string;
    deepLink?: string;
  };
}

export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  ios?: {
    status: number;
    allowsAlert: boolean;
    allowsBadge: boolean;
    allowsSound: boolean;
  };
  android?: {
    importance: number;
  };
}

export interface LocalNotificationSchedule {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  trigger: {
    seconds?: number;
    repeats?: boolean;
    date?: Date;
  };
}

export interface NotificationChannel {
  id: string;
  name: string;
  description?: string;
  importance: number;
  sound?: string;
  vibrationPattern?: number[];
  lightColor?: string;
  lockscreenVisibility?: number;
  bypassDnd?: boolean;
  showBadge?: boolean;
}
