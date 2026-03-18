/**
 * Component Types - Smartpay Mobile
 * Common component prop types and shared type definitions
 * Location: types/components.ts
 */

import type { ReactNode } from 'react';
import type { ViewStyle, TextStyle, ImageStyle } from 'react-native';

/**
 * Common Props
 */
export interface BaseComponentProps {
  /** Child components */
  children?: ReactNode;
  /** Custom styles */
  style?: ViewStyle | TextStyle | ImageStyle | Array<ViewStyle | TextStyle | ImageStyle>;
  /** Test ID for testing */
  testID?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Accessibility hint */
  accessibilityHint?: string;
}

/**
 * Button Props
 */
export interface ButtonProps extends BaseComponentProps {
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Press handler */
  onPress?: () => void;
  /** Icon name (Ionicons) */
  icon?: string;
  /** Icon position */
  iconPosition?: 'left' | 'right';
  /** Full width */
  fullWidth?: boolean;
}

/**
 * Input Props
 */
export interface InputProps extends BaseComponentProps {
  /** Input value */
  value?: string;
  /** Change handler */
  onChangeText?: (text: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Input type */
  type?: 'text' | 'email' | 'phone' | 'password' | 'number';
  /** Error message */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Auto focus */
  autoFocus?: boolean;
  /** Keyboard type */
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  /** Secure text entry (for passwords) */
  secureTextEntry?: boolean;
  /** Max length */
  maxLength?: number;
  /** Auto capitalize */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  /** Label */
  label?: string;
}

/**
 * Card Props
 */
export interface CardProps extends BaseComponentProps {
  /** Press handler */
  onPress?: () => void;
  /** Card variant */
  variant?: 'default' | 'outlined' | 'elevated';
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Avatar Props
 */
export interface AvatarProps extends BaseComponentProps {
  /** Image URI */
  uri?: string | null;
  /** Fallback initials */
  initials?: string | null;
  /** Avatar size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | number;
  /** Background color */
  backgroundColor?: string;
  /** Text color */
  textColor?: string;
  /** Press handler */
  onPress?: () => void;
}

/**
 * Modal Props
 */
export interface ModalProps extends BaseComponentProps {
  /** Modal visibility */
  visible: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Show close button */
  showCloseButton?: boolean;
  /** Animation type */
  animationType?: 'none' | 'slide' | 'fade';
  /** Transparent background */
  transparent?: boolean;
}

/**
 * Bottom Sheet Props
 */
export interface BottomSheetProps extends BaseComponentProps {
  /** Sheet visibility */
  visible: boolean;
  /** Close handler */
  onClose: () => void;
  /** Max height */
  maxHeight?: string | number;
  /** Show handle */
  showHandle?: boolean;
}

/**
 * Header Props
 */
export interface HeaderProps extends BaseComponentProps {
  /** Header title */
  title?: string;
  /** Show back button */
  showBackButton?: boolean;
  /** Back button press handler */
  onBackPress?: () => void;
  /** Show search */
  showSearch?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Search value */
  searchValue?: string;
  /** Search change handler */
  onSearchChange?: (text: string) => void;
  /** Notification press handler */
  onNotificationPress?: () => void;
  /** Avatar press handler */
  onAvatarPress?: () => void;
  /** Avatar URI */
  avatarUri?: string | null;
  /** Avatar initials */
  avatarInitials?: string | null;
  /** Show notification badge */
  notificationBadge?: boolean;
  /** Right action component */
  rightAction?: ReactNode;
}

/**
 * List Item Props
 */
export interface ListItemProps extends BaseComponentProps {
  /** Item title */
  title: string;
  /** Item subtitle */
  subtitle?: string;
  /** Left icon */
  leftIcon?: string;
  /** Right icon */
  rightIcon?: string;
  /** Press handler */
  onPress?: () => void;
  /** Show chevron */
  showChevron?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Badge Props
 */
export interface BadgeProps extends BaseComponentProps {
  /** Badge variant */
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  /** Badge size */
  size?: 'sm' | 'md' | 'lg';
  /** Badge text */
  text?: string;
  /** Show dot only */
  dot?: boolean;
}

/**
 * Loading State Props
 */
export interface LoadingStateProps extends BaseComponentProps {
  /** Loading message */
  message?: string;
  /** Show spinner */
  showSpinner?: boolean;
}

/**
 * Error State Props
 */
export interface ErrorStateProps extends BaseComponentProps {
  /** Error message */
  message: string;
  /** Retry handler */
  onRetry?: () => void;
  /** Retry button text */
  retryText?: string;
  /** Show icon */
  showIcon?: boolean;
}

/**
 * Empty State Props
 */
export interface EmptyStateProps extends BaseComponentProps {
  /** Empty message */
  message: string;
  /** Empty description */
  description?: string;
  /** Action button text */
  actionText?: string;
  /** Action handler */
  onAction?: () => void;
  /** Icon name */
  icon?: string;
}

/**
 * Transaction Item
 */
export interface TransactionItem {
  id: string;
  type: 'send' | 'receive' | 'cashout' | 'deposit' | 'loan' | 'bill';
  amount: number;
  currency: string;
  description: string;
  recipient?: string;
  sender?: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  icon?: string;
  color?: string;
}

/**
 * Contact Item
 */
export interface ContactItem {
  id: string;
  name: string;
  phone?: string;
  smartpayId?: string;
  avatarUri?: string;
  isFavorite?: boolean;
}

/**
 * Wallet Display Info
 */
export interface WalletDisplayInfo {
  id: string;
  name: string;
  balance: number;
  currency: string;
  color?: string;
  icon?: string;
  type?: string;
  isPrimary?: boolean;
}

/**
 * Notification Item
 */
export interface NotificationItem {
  id: string;
  type: 'transaction' | 'system' | 'promotion' | 'security';
  title: string;
  body: string;
  timestamp: Date | string;
  read: boolean;
  icon?: string;
  data?: Record<string, unknown>;
}

/**
 * Form Field Props
 */
export interface FormFieldProps extends InputProps {
  /** Field name */
  name: string;
  /** Field label */
  label?: string;
  /** Required field */
  required?: boolean;
  /** Help text */
  helpText?: string;
}

/**
 * Picker Props
 */
export interface PickerProps<T = unknown> extends BaseComponentProps {
  /** Selected value */
  value?: T;
  /** Change handler */
  onChange: (value: T) => void;
  /** Picker options */
  options: Array<{ label: string; value: T }>;
  /** Placeholder */
  placeholder?: string;
  /** Label */
  label?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Success Screen Props
 */
export interface SuccessScreenProps extends BaseComponentProps {
  /** Success title */
  title: string;
  /** Success message */
  message?: string;
  /** Primary action text */
  primaryActionText?: string;
  /** Primary action handler */
  onPrimaryAction?: () => void;
  /** Secondary action text */
  secondaryActionText?: string;
  /** Secondary action handler */
  onSecondaryAction?: () => void;
  /** Show icon */
  showIcon?: boolean;
  /** Custom icon */
  icon?: string;
}

/**
 * QR Code Props
 */
export interface QRCodeProps extends BaseComponentProps {
  /** QR code data */
  value: string;
  /** QR code size */
  size?: number;
  /** Logo in center */
  logo?: string;
  /** Background color */
  backgroundColor?: string;
  /** Foreground color */
  foregroundColor?: string;
}

/**
 * Scanner Props
 */
export interface ScannerProps extends BaseComponentProps {
  /** Scan success handler */
  onScan: (data: string) => void;
  /** Scan error handler */
  onError?: (error: Error) => void;
  /** Scanner message */
  message?: string;
  /** Show scanner frame */
  showFrame?: boolean;
}
