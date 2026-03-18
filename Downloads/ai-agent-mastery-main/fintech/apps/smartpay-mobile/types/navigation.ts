/**
 * Navigation Types - Smartpay Mobile
 * Defines route parameter lists and navigation prop types
 * Location: types/navigation.ts
 */

import type { StackNavigationProp } from '@react-navigation/stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';

/**
 * Root Stack Parameter List - All app routes with their params
 */
export type RootStackParamList = {
  // ─── Auth/Onboarding ───────────────────────────────────────────────────
  'index': undefined;
  '(onboarding)/index': undefined;
  'onboarding/index': undefined;
  'onboarding/phone': undefined;
  'onboarding/otp': { phone: string };
  'onboarding/name': { phone: string };
  'onboarding/photo': undefined;
  'onboarding/pin': undefined;
  'onboarding/faceid': undefined;
  'onboarding/complete': undefined;

  // ─── Authenticated Root ─────────────────────────────────────────────────
  '(authenticated)/_layout': undefined;
  '(authenticated)/(tabs)/_layout': undefined;
  '(authenticated)/(tabs)/index': undefined;
  '(authenticated)/(tabs)/activity': undefined;
  '(authenticated)/(tabs)/copilot/index': undefined;

  // ─── Tabs ──────────────────────────────────────────────────────────────
  '(tabs)/_layout': undefined;
  '(tabs)/index': undefined;
  '(tabs)/home/index': undefined;
  '(tabs)/copilot/index': undefined;
  '(tabs)/copilot': undefined;
  '(tabs)/activity/index': undefined;
  '(tabs)/profile': undefined;
  '(tabs)/wallets': undefined;
  '(tabs)/transactions': undefined;

  // ─── Send Money Flow ────────────────────────────────────────────────────
  '/send-money/select-recipient': undefined;
  '/(authenticated)/send-money/select-recipient': undefined;
  '/(authenticated)/send-money/amount': {
    recipientId?: string;
    recipientName: string;
    recipientPhone: string;
    recipientSmartpayId?: string;
    recipientAvatar?: string;
  };
  'send-money/_layout': undefined;
  'send-money/index': undefined;
  'send-money/select-recipient': undefined;
  'send-money/scan-qr': undefined;
  'send-money/amount': {
    recipientId?: string;
    recipientName: string;
    recipientPhone: string;
    recipientSmartpayId?: string;
    recipientAvatar?: string;
  };
  'send-money/confirm': {
    recipientId?: string;
    recipientName: string;
    recipientPhone: string;
    recipientSmartpayId?: string;
    recipientAvatar?: string;
    amount: string;
    walletId: string;
    walletName: string;
  };
  'send-money/success': {
    amount: string;
    recipientName: string;
    transactionId?: string;
  };

  // ─── Receive Flow ──────────────────────────────────────────────────────
  '/(authenticated)/receive': undefined;
  '/(authenticated)/receive/index': undefined;
  '/(authenticated)/receive/qr': undefined;

  // ─── Wallets ───────────────────────────────────────────────────────────
  '/(authenticated)/wallets': undefined;
  '/(authenticated)/wallets/index': undefined;
  '/(authenticated)/wallets/add': undefined;
  '/(authenticated)/wallets/[id]/index': { id: string };
  '/(authenticated)/add-wallet': undefined;

  // ─── Banking ───────────────────────────────────────────────────────────
  '/(authenticated)/banking/link-bank': undefined;
  '/(authenticated)/banking/linked-accounts': undefined;
  '/(authenticated)/banking/oauth-callback': {
    code?: string;
    state?: string;
    error?: string;
  };
  '/(authenticated)/banking/account-details/[id]': { id: string };
  '/(authenticated)/obs-consent': undefined;

  // ─── Profile ───────────────────────────────────────────────────────────
  '/(authenticated)/profile': undefined;
  '/(authenticated)/profile/index': undefined;
  '/(authenticated)/profile/settings': undefined;
  '/(authenticated)/profile/edit-profile': undefined;
  '/(authenticated)/edit-profile': undefined;

  // ─── Proof of Life ─────────────────────────────────────────────────────
  '/(authenticated)/proof-of-life/intro': undefined;
  '/(authenticated)/proof-of-life/expired': undefined;
  'proof-of-life/index': undefined;

  // ─── Cash Out ──────────────────────────────────────────────────────────
  '/(authenticated)/cash-out': undefined;
  '/(authenticated)/cash-out/index': undefined;
  '/(authenticated)/cash-out/atm': undefined;
  '/(authenticated)/cash-out/till': undefined;
  '/(authenticated)/cash-out/bank': undefined;
  '/(authenticated)/cash-out/confirm': {
    amount?: string;
    method?: string;
    [key: string]: string | undefined;
  };
  '/(authenticated)/cash-out/success': {
    amount: string;
    method: string;
    transactionId?: string;
  };
  '/(authenticated)/pay-merchant/confirm': {
    merchantId?: string;
    amount?: string;
    [key: string]: string | undefined;
  };
  'cash-out/index': undefined;

  // ─── Groups ────────────────────────────────────────────────────────────
  '/(authenticated)/groups': undefined;
  '/(authenticated)/groups/index': undefined;
  '/(authenticated)/groups/create': undefined;
  '/(authenticated)/groups/[id]/index': { id: string };
  '/(authenticated)/groups/[id]/split': { id: string };

  // ─── QR & Scanning ─────────────────────────────────────────────────────
  '/(authenticated)/qr-code/index': undefined;
  '/(authenticated)/scan-qr/index': undefined;

  // ─── KYC ───────────────────────────────────────────────────────────────
  '/(authenticated)/kyc/intro': undefined;

  // ─── Invite ────────────────────────────────────────────────────────────
  '/(authenticated)/invite': undefined;
  '/(authenticated)/invite/index': undefined;

  // ─── Modals ────────────────────────────────────────────────────────────
  '/(authenticated)/(modals)/lock': undefined;
  '/(authenticated)/(modals)/biometric-settings': undefined;

  // ─── Other ─────────────────────────────────────────────────────────────
  '/notifications': undefined;
  'notifications': undefined;
  'notifications-settings': undefined;
  'lock': undefined;
  'voucher/index': undefined;
  'agents/index': undefined;
  'loans/index': undefined;
  '/bills': undefined;
  '/(authenticated)/bills': undefined;
  '/(authenticated)/proof-of-life/learn-more': undefined;
  '/transactions/[id]': { id: string };

  // ─── Generic Patterns ──────────────────────────────────────────────────
  [key: string]: undefined | Record<string, string | undefined>;
};

/**
 * Tab Parameter List - Bottom tab navigation routes
 */
export type TabParamList = {
  home: undefined;
  copilot: undefined;
  activity: undefined;
  profile: undefined;
  wallets: undefined;
  transactions: undefined;
  index: undefined;
};

/**
 * Send Money Stack Parameter List
 */
export type SendMoneyParamList = {
  'send-money/index': undefined;
  'send-money/select-recipient': undefined;
  'send-money/scan-qr': undefined;
  'send-money/amount': {
    recipientId?: string;
    recipientName: string;
    recipientPhone: string;
    recipientSmartpayId?: string;
    recipientAvatar?: string;
  };
  'send-money/confirm': {
    recipientId?: string;
    recipientName: string;
    recipientPhone: string;
    recipientSmartpayId?: string;
    recipientAvatar?: string;
    amount: string;
    walletId: string;
    walletName: string;
  };
  'send-money/success': {
    amount: string;
    recipientName: string;
    transactionId?: string;
  };
};

/**
 * Stack Navigation Prop Type
 */
export type StackNavProp<T extends keyof RootStackParamList> = StackNavigationProp<
  RootStackParamList,
  T
>;

/**
 * Tab Navigation Prop Type
 */
export type TabNavProp<T extends keyof TabParamList> = BottomTabNavigationProp<
  TabParamList,
  T
>;

/**
 * Composite Navigation Prop Type - For screens in nested navigators
 */
export type CompositeNavProp<T extends keyof RootStackParamList> = CompositeNavigationProp<
  StackNavigationProp<RootStackParamList, T>,
  BottomTabNavigationProp<TabParamList>
>;

/**
 * Route Parameter Helper Types
 */
export type RouteParams<T extends keyof RootStackParamList> = RootStackParamList[T];

/**
 * Navigation Helper Type
 */
export type NavigationProp = StackNavigationProp<RootStackParamList>;

/**
 * Common Navigation Props for Components
 */
export interface NavigationComponentProps {
  navigation?: NavigationProp;
  route?: {
    params?: Record<string, unknown>;
  };
}
