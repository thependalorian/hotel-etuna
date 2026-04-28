/**
 * Hotel Etuna - Drizzle ORM Schema
 * 
 * Complete database schema backing the generated Drizzle migrations in:
 * database/drizzle/
 * 
 * Technology: Drizzle ORM with Neon PostgreSQL
 * Features: Hub-and-spoke multi-tenancy, Partner network, Sofia AI (hub only), PSD-12 compliance
 * 
 * @version 2.0.0
 * @since April 28, 2026
 * @forked-from Buffr Host v1.0.0
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  date,
  time,
  jsonb,
  inet,
  bigint,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

export const roomStatusEnum = pgEnum('room_status', [
  'available',
  'occupied',
  'maintenance',
  'out_of_order',
]);

export const bookingStatusEnum = pgEnum('booking_status', [
  'pending',
  'confirmed',
  'checked_in',
  'checked_out',
  'cancelled',
  'no_show',
]);

export const employmentTypeEnum = pgEnum('employment_type', [
  'full_time',
  'part_time',
  'contract',
]);

export const staffStatusEnum = pgEnum('staff_status', [
  'active',
  'inactive',
  'terminated',
]);

/** For UI: Object.values(EmploymentType) for select options */
export const EmploymentType = {
  FULL_TIME: 'full_time',
  PART_TIME: 'part_time',
  CONTRACT: 'contract',
} as const;

/** For UI: Object.values(StaffStatus) for select options */
export const StaffStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  TERMINATED: 'terminated',
} as const;

export const loyaltyTierEnum = pgEnum('loyalty_tier', [
  'bronze',
  'silver',
  'gold',
  'platinum',
]);

export const tenantTypeEnum = pgEnum('tenant_type', [
  'hub',
  'partner',
]);

export const reviewCategoryEnum = pgEnum('review_category', [
  'stay',
  'food',
  'service',
  'amenities',
  'value',
  'other',
]);

export const orderTypeEnum = pgEnum('order_type', [
  'dine_in',
  'takeout',
  'delivery',
  'room_service',
]);

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'served',
  'cancelled',
]);

export const aiConversationChannelEnum = pgEnum('ai_conversation_channel', [
  'web',
  'whatsapp',
  'email',
  'phone',
]);

export const aiConversationStatusEnum = pgEnum('ai_conversation_status', [
  'active',
  'completed',
  'escalated',
  'closed',
]);

export const aiMessageSenderTypeEnum = pgEnum('ai_message_sender_type', [
  'user',
  'assistant',
  'system',
]);

// ============================================================================
// CORE TABLES (Multi-Tenancy & Auth)
// ============================================================================

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: tenantTypeEnum('type').default('hub').notNull(),
  parentTenantId: uuid('parent_tenant_id').references((): any => tenants.id, { onDelete: 'set null' }),
  commissionPercent: decimal('commission_percent', { precision: 5, scale: 2 }).default('10.00'),
  subdomain: varchar('subdomain', { length: 100 }).unique(),
  domain: varchar('domain', { length: 255 }),
  status: varchar('status', { length: 50 }).default('active'),
  subscriptionTier: varchar('subscription_tier', { length: 50 }).default('starter'),
  subscriptionStatus: varchar('subscription_status', { length: 50 }).default('trial'),
  monthlyPrice: decimal('monthly_price', { precision: 10, scale: 2 }),
  roomCount: integer('room_count').default(0),
  propertyType: varchar('property_type', { length: 50 }),
  hasRestaurantFeatures: boolean('has_restaurant_features').default(false),
  isEnterprise: boolean('is_enterprise').default(false),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  subscriptionEndsAt: timestamp('subscription_ends_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  typeIdx: index('idx_tenants_type').on(table.type),
  parentTenantIdx: index('idx_tenants_parent_tenant_id').on(table.parentTenantId),
}));

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).unique().notNull(),
  emailVerified: boolean('email_verified').default(false),
  emailVerificationOtp: varchar('email_verification_otp', { length: 6 }),
  emailVerificationOtpExpiresAt: timestamp('email_verification_otp_expires_at'),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  passwordResetToken: varchar('password_reset_token', { length: 255 }),
  passwordResetTokenExpiresAt: timestamp('password_reset_token_expires_at'),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  role: varchar('role', { length: 50 }).default('user'),
  isPlatformAdmin: boolean('is_platform_admin').default(false),
  status: varchar('status', { length: 50 }).default('active'),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  emailIdx: index('idx_users_tenant_email').on(table.tenantId, table.email),
  roleIdx: index('idx_users_role').on(table.role),
  otpIdx: index('idx_users_email_verification_otp').on(table.emailVerificationOtp),
}));

export const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  sessionToken: varchar('session_token', { length: 255 }).unique().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'), // Using text for INET type
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_user_sessions_user_id').on(table.userId),
  expiresAtIdx: index('idx_user_sessions_expires_at').on(table.expiresAt),
}));

// Two-Factor Authentication Table (PSD-12 Compliance)
export const twoFactorAuth = pgTable('two_factor_auth', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  method: varchar('method', { length: 50 }).notNull(), // 'totp', 'sms', 'biometric', 'backup_code'
  secret: text('secret').notNull(), // TOTP secret, hashed phone/device ID
  backupCodes: text('backup_codes'), // JSON array of hashed backup codes
  isEnabled: boolean('is_enabled').default(false),
  phoneNumber: varchar('phone_number', { length: 50 }),
  deviceId: varchar('device_id', { length: 255 }),
  lastOtpHash: varchar('last_otp_hash', { length: 255 }),
  lastOtpGeneratedAt: timestamp('last_otp_generated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userMethodIdx: uniqueIndex('idx_two_factor_auth_user_method').on(table.userId, table.method),
  enabledIdx: index('idx_two_factor_auth_enabled').on(table.isEnabled),
}));

export const systemSettings = pgTable('system_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  category: varchar('category', { length: 100 }).notNull(),
  settingKey: varchar('setting_key', { length: 255 }).notNull(),
  settingValue: jsonb('setting_value'),
  isSystem: boolean('is_system').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  uniqueSetting: uniqueIndex('unique_setting').on(table.tenantId, table.category, table.settingKey),
}));

// ============================================================================
// PARTNER INVITES (Hotel Etuna B2B Network)
// ============================================================================

export const partnerInvites = pgTable('partner_invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).unique().notNull(),
  propertyName: varchar('property_name', { length: 255 }).notNull(),
  claimed: boolean('claimed').default(false).notNull(),
  claimedAt: timestamp('claimed_at', { withTimezone: true }),
  claimedByUserId: uuid('claimed_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  metadata: jsonb('metadata').default({}),
}, (table) => ({
  emailIdx: index('idx_partner_invites_email').on(table.email),
  tokenIdx: index('idx_partner_invites_token').on(table.token),
  claimedIdx: index('idx_partner_invites_claimed').on(table.claimed),
  expiresAtIdx: index('idx_partner_invites_expires_at').on(table.expiresAt),
}));

// ============================================================================
// PROPERTY MANAGEMENT
// ============================================================================

export const properties = pgTable('properties', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  ownerId: uuid('owner_id').references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  description: text('description'),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  country: varchar('country', { length: 100 }).default('Namibia'),
  postalCode: varchar('postal_code', { length: 20 }),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  starRating: integer('star_rating'),
  roomCount: integer('room_count').default(0),
  subscriptionTier: varchar('subscription_tier', { length: 50 }),
  currency: varchar('currency', { length: 3 }).default('NAD'),
  timezone: varchar('timezone', { length: 100 }).default('Africa/Windhoek'),
  status: varchar('status', { length: 50 }).default('active'),
  amenities: text('amenities').array(),
  images: text('images').array(),
  checkInTime: time('check_in_time').default(sql`'14:00'`),
  checkOutTime: time('check_out_time').default(sql`'11:00'`),
  hasRestaurantFeatures: boolean('has_restaurant_features').default(false),
  isEnterprise: boolean('is_enterprise').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_properties_tenant_id').on(table.tenantId),
  slugIdx: index('idx_properties_slug').on(table.slug),
  typeIdx: index('idx_properties_type').on(table.type),
  statusIdx: index('idx_properties_status').on(table.status),
}));

/**
 * Maps Meta WhatsApp Cloud API phone_number_id (per business number) to a Buffr tenant.
 * Used by /api/webhooks/whatsapp to route inbound messages to Sofia.
 */
export const tenantWhatsappSettings = pgTable('tenant_whatsapp_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id, { onDelete: 'cascade' })
    .notNull(),
  phoneNumberId: varchar('phone_number_id', { length: 64 }).notNull().unique(),
  defaultPropertyId: uuid('default_property_id').references(() => properties.id, {
    onDelete: 'set null',
  }),
  /** Optional; falls back to WHATSAPP_ACCESS_TOKEN env when null */
  accessToken: text('access_token'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_tenant_whatsapp_settings_tenant_id').on(table.tenantId),
}));

export const propertySettings = pgTable('property_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }),
  settingKey: varchar('setting_key', { length: 100 }).notNull(),
  settingValue: jsonb('setting_value'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  uniquePropertySetting: uniqueIndex('unique_property_setting').on(table.propertyId, table.settingKey),
}));

export const rooms = pgTable('rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }),
  roomNumber: varchar('room_number', { length: 50 }).notNull(),
  roomType: varchar('room_type', { length: 100 }).notNull(),
  floor: integer('floor'),
  maxOccupancy: integer('max_occupancy').default(2),
  baseRate: decimal('base_rate', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('NAD'),
  amenities: text('amenities').array(),
  images: text('images').array(),
  status: varchar('status', { length: 50 }).default('available'),
  smokingAllowed: boolean('smoking_allowed').default(false),
  petFriendly: boolean('pet_friendly').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  propertyIdx: index('idx_rooms_property_id').on(table.propertyId),
  statusIdx: index('idx_rooms_status').on(table.status),
  uniqueRoomNumber: uniqueIndex('unique_room_number').on(table.propertyId, table.roomNumber),
}));

export const roomRates = pgTable('room_rates', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'cascade' }),
  rateName: varchar('rate_name', { length: 100 }).notNull(),
  rateAmount: decimal('rate_amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('NAD'),
  validFrom: date('valid_from').notNull(),
  validTo: date('valid_to').notNull(),
  minStayNights: integer('min_stay_nights').default(1),
  maxStayNights: integer('max_stay_nights'),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const roomQrCodes = pgTable('room_qr_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'cascade' }),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }),
  qrCode: varchar('qr_code', { length: 255 }).unique().notNull(),
  qrCodeUrl: text('qr_code_url').notNull(),
  qrCodeImageUrl: text('qr_code_image_url'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  roomIdx: index('idx_room_qr_codes_room_id').on(table.roomId),
  propertyIdx: index('idx_room_qr_codes_property_id').on(table.propertyId),
  qrCodeIdx: index('idx_room_qr_codes_qr_code').on(table.qrCode),
}));

// ============================================================================
// BOOKING SYSTEM
// ============================================================================

export const guests = pgTable('guests', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).unique().notNull(),
  phone: varchar('phone', { length: 50 }),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  dateOfBirth: date('date_of_birth'),
  nationality: varchar('nationality', { length: 100 }),
  passportNumber: varchar('passport_number', { length: 100 }),
  idNumber: varchar('id_number', { length: 100 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  country: varchar('country', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  preferences: jsonb('preferences'),
  marketingConsent: boolean('marketing_consent').default(false),
  isSignedUp: boolean('is_signed_up').default(false),
  signUpCompletedAt: timestamp('sign_up_completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_guests_tenant_id').on(table.tenantId),
  emailIdx: index('idx_guests_email').on(table.email),
}));

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'cascade' }),
  bookingReference: varchar('booking_reference', { length: 100 }).unique().notNull(),
  status: varchar('status', { length: 50 }).default('confirmed'),
  checkInDate: date('check_in_date').notNull(),
  checkOutDate: date('check_out_date').notNull(),
  actualCheckInDate: timestamp('actual_check_in_date', { withTimezone: true }),
  actualCheckOutDate: timestamp('actual_check_out_date', { withTimezone: true }),
  roomCount: integer('room_count').default(1),
  adultCount: integer('adult_count').default(1),
  childCount: integer('child_count').default(0),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  commissionAmount: decimal('commission_amount', { precision: 12, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('NAD'),
  paymentStatus: varchar('payment_status', { length: 50 }).default('pending'),
  specialRequests: text('special_requests'),
  cancellationPolicy: varchar('cancellation_policy', { length: 100 }),
  aiProcessed: boolean('ai_processed').default(false),
  aiConfidenceScore: decimal('ai_confidence_score', { precision: 3, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_bookings_tenant_id').on(table.tenantId),
  propertyIdx: index('idx_bookings_property_id').on(table.propertyId),
  guestIdx: index('idx_bookings_guest_id').on(table.guestId),
  statusIdx: index('idx_bookings_status').on(table.status),
  checkInIdx: index('idx_bookings_check_in_date').on(table.checkInDate),
}));

export const bookingRooms = pgTable('booking_rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'cascade' }),
  roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'cascade' }),
  guestCount: integer('guest_count').default(1),
  rateAmount: decimal('rate_amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('NAD'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  bookingIdx: index('idx_booking_rooms_booking_id').on(table.bookingId),
  roomIdx: index('idx_booking_rooms_room_id').on(table.roomId),
}));

// ============================================================================
// PAYMENT SYSTEM (PSD-1 Compliant)
// ============================================================================

export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  provider: varchar('provider', { length: 50 }),
  lastFour: varchar('last_four', { length: 4 }),
  expiryMonth: integer('expiry_month'),
  expiryYear: integer('expiry_year'),
  isDefault: boolean('is_default').default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'set null' }),
  paymentMethodId: uuid('payment_method_id').references(() => paymentMethods.id, { onDelete: 'set null' }),
  transactionReference: varchar('transaction_reference', { length: 100 }).unique().notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('NAD'),
  status: varchar('status', { length: 50 }).default('pending'),
  paymentGateway: varchar('payment_gateway', { length: 50 }),
  gatewayTransactionId: varchar('gateway_transaction_id', { length: 255 }),
  description: text('description'),
  metadata: jsonb('metadata'),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_transactions_tenant_id').on(table.tenantId),
  bookingIdx: index('idx_transactions_booking_id').on(table.bookingId),
  statusIdx: index('idx_transactions_status').on(table.status),
}));

export const trustAccounts = pgTable('trust_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  accountNumber: varchar('account_number', { length: 100 }).unique().notNull(),
  accountName: varchar('account_name', { length: 255 }).notNull(),
  bankName: varchar('bank_name', { length: 255 }).notNull(),
  branch: varchar('branch', { length: 255 }),
  accountType: varchar('account_type', { length: 50 }).default('trust_account'),
  balance: decimal('balance', { precision: 10, scale: 2 }).default('0'),
  reservedAmount: decimal('reserved_amount', { precision: 10, scale: 2 }).default('0'),
  currency: varchar('currency', { length: 3 }).default('NAD'),
  status: varchar('status', { length: 50 }).default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// STAFF MANAGEMENT
// ============================================================================

export const staff = pgTable('staff', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  employeeNumber: varchar('employee_number', { length: 50 }).unique().notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  position: varchar('position', { length: 100 }).notNull(),
  department: varchar('department', { length: 100 }),
  employmentType: varchar('employment_type', { length: 50 }).default('full_time'),
  status: varchar('status', { length: 50 }).default('active'),
  hireDate: date('hire_date').notNull(),
  terminationDate: date('termination_date'),
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 }),
  salary: decimal('salary', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('NAD'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_staff_tenant_id').on(table.tenantId),
  propertyIdx: index('idx_staff_property_id').on(table.propertyId),
  statusIdx: index('idx_staff_status').on(table.status),
}));

export const staffShifts = pgTable('staff_shifts', {
  id: uuid('id').primaryKey().defaultRandom(),
  staffId: uuid('staff_id').references(() => staff.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }),
  shiftDate: date('shift_date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  breakDurationMinutes: integer('break_duration_minutes').default(30),
  position: varchar('position', { length: 100 }),
  shiftType: varchar('shift_type', { length: 50 }),
  status: varchar('status', { length: 50 }).default('scheduled'),
  checkedInAt: timestamp('checked_in_at', { withTimezone: true }),
  checkedOutAt: timestamp('checked_out_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  staffIdx: index('idx_staff_shifts_staff_id').on(table.staffId),
  shiftDateIdx: index('idx_staff_shifts_shift_date').on(table.shiftDate),
}));

// ============================================================================
// COMPLIANCE — KYC / KYB (LangGraph-backed workflows, manual review queue)
// ============================================================================

/** Case lifecycle driven by lib/workflows/kycKybGraph.ts */
export const complianceVerificationCases = pgTable(
  'compliance_verification_cases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    /** user | staff | tenant_business */
    subjectType: varchar('subject_type', { length: 32 }).notNull(),
    /** Nullable until subject exists (e.g. draft before staff row) */
    subjectId: uuid('subject_id'),
    /** individual (KYC) | business (KYB-style checks) */
    subjectParty: varchar('subject_party', { length: 32 }).notNull().default('individual'),
    /** lite | full — aligns with NPS tiered KYC framing */
    kycTier: varchar('kyc_tier', { length: 16 }).notNull().default('lite'),
    profile: jsonb('profile').$type<Record<string, unknown>>().notNull().default({}),
    status: varchar('status', { length: 40 }).notNull().default('draft'),
    workflowStage: varchar('workflow_stage', { length: 64 }),
    /** Last LangGraph invoke output for audit/debug */
    workflowSnapshot: jsonb('workflow_snapshot').$type<Record<string, unknown>>(),
    reviewerUserId: uuid('reviewer_user_id').references(() => users.id, { onDelete: 'set null' }),
    reviewerNotes: text('reviewer_notes'),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    tenantIdx: index('idx_compliance_cases_tenant').on(table.tenantId),
    statusIdx: index('idx_compliance_cases_status').on(table.status),
    subjectIdx: index('idx_compliance_cases_subject').on(table.subjectType, table.subjectId),
  })
);

export const complianceVerificationDocuments = pgTable(
  'compliance_verification_documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    caseId: uuid('case_id')
      .references(() => complianceVerificationCases.id, { onDelete: 'cascade' })
      .notNull(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    documentType: varchar('document_type', { length: 64 }).notNull(),
    fileUrl: text('file_url').notNull(),
    fileName: varchar('file_name', { length: 512 }),
    uploadedByUserId: uuid('uploaded_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    caseIdx: index('idx_compliance_docs_case').on(table.caseId),
    tenantIdx: index('idx_compliance_docs_tenant').on(table.tenantId),
  })
);

// ============================================================================
// RESTAURANT SYSTEM
// ============================================================================

export const restaurants = pgTable('restaurants', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  cuisineType: varchar('cuisine_type', { length: 100 }),
  capacity: integer('capacity'),
  openingHours: jsonb('opening_hours'),
  contactPhone: varchar('contact_phone', { length: 50 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  images: text('images').array(),
  status: varchar('status', { length: 50 }).default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const menuCategories = pgTable('menu_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  restaurantId: uuid('restaurant_id').references(() => restaurants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const cmsMenuItems = pgTable('cms_menu_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  restaurantId: uuid('restaurant_id').references(() => restaurants.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => menuCategories.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('NAD'),
  ingredients: text('ingredients').array(),
  allergens: text('allergens').array(),
  dietaryTags: text('dietary_tags').array(),
  imageUrl: text('image_url'),
  isAvailable: boolean('is_available').default(true),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  restaurantIdx: index('idx_cms_menu_items_restaurant_id').on(table.restaurantId),
  categoryIdx: index('idx_cms_menu_items_category_id').on(table.categoryId),
}));

export type MenuCategory = typeof menuCategories.$inferSelect;
export type NewMenuCategory = typeof menuCategories.$inferInsert;
export type CmsMenuItem = typeof cmsMenuItems.$inferSelect;
export type NewCmsMenuItem = typeof cmsMenuItems.$inferInsert;

export const restaurantTables = pgTable('restaurant_tables', {
  id: uuid('id').primaryKey().defaultRandom(),
  restaurantId: uuid('restaurant_id').references(() => restaurants.id, { onDelete: 'cascade' }),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }),
  tableNumber: varchar('table_number', { length: 50 }).notNull(),
  tableName: varchar('table_name', { length: 100 }),
  capacity: integer('capacity').notNull(),
  location: varchar('location', { length: 100 }),
  qrCode: varchar('qr_code', { length: 255 }).unique().notNull(),
  qrCodeUrl: text('qr_code_url').notNull(),
  qrCodeImageUrl: text('qr_code_image_url'),
  isActive: boolean('is_active').default(true),
  status: varchar('status', { length: 50 }).default('available'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  restaurantIdx: index('idx_restaurant_tables_restaurant_id').on(table.restaurantId),
  qrCodeIdx: index('idx_restaurant_tables_qr_code').on(table.qrCode),
  uniqueTableNumber: uniqueIndex('unique_table_number').on(table.restaurantId, table.tableNumber),
}));

export type RestaurantTable = typeof restaurantTables.$inferSelect;
export type NewRestaurantTable = typeof restaurantTables.$inferInsert;

export const restaurantOrders = pgTable('restaurant_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  restaurantId: uuid('restaurant_id').references(() => restaurants.id, { onDelete: 'cascade' }),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'set null' }),
  cartId: varchar('cart_id', { length: 100 }),
  tableId: uuid('table_id').references(() => restaurantTables.id, { onDelete: 'set null' }),
  qrCode: varchar('qr_code', { length: 255 }),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  orderNumber: varchar('order_number', { length: 100 }).unique().notNull(),
  orderType: varchar('order_type', { length: 50 }).default('dine_in'),
  tableNumber: varchar('table_number', { length: 50 }),
  roomNumber: varchar('room_number', { length: 50 }),
  status: varchar('status', { length: 50 }).default('pending'),
  specialInstructions: text('special_instructions'),
  orderedAt: timestamp('ordered_at', { withTimezone: true }).defaultNow(),
  estimatedReadyAt: timestamp('estimated_ready_at', { withTimezone: true }),
  servedAt: timestamp('served_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  restaurantIdx: index('idx_restaurant_orders_restaurant_id').on(table.restaurantId),
  statusIdx: index('idx_restaurant_orders_status').on(table.status),
}));

export type RestaurantOrder = typeof restaurantOrders.$inferSelect;
export type NewRestaurantOrder = typeof restaurantOrders.$inferInsert;

export const restaurantOrderItems = pgTable('restaurant_order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .references(() => restaurantOrders.id, { onDelete: 'cascade' })
    .notNull(),
  menuItemId: uuid('menu_item_id').references(() => cmsMenuItems.id, { onDelete: 'set null' }),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  customizations: jsonb('customizations').$type<Record<string, unknown>>().default({}),
  specialInstructions: text('special_instructions'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  orderIdx: index('idx_restaurant_order_items_order_id').on(table.orderId),
  menuItemIdx: index('idx_restaurant_order_items_menu_item_id').on(table.menuItemId),
}));

export type RestaurantOrderItem = typeof restaurantOrderItems.$inferSelect;
export type NewRestaurantOrderItem = typeof restaurantOrderItems.$inferInsert;

// ============================================================================
// CRM SYSTEM
// ============================================================================

export const guestProfiles = pgTable('guest_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'cascade' }),
  loyaltyTier: varchar('loyalty_tier', { length: 50 }).default('bronze'),
  loyaltyPoints: integer('loyalty_points').default(0),
  totalSpent: decimal('total_spent', { precision: 10, scale: 2 }).default('0'),
  bookingCount: integer('booking_count').default(0),
  averageRating: decimal('average_rating', { precision: 3, scale: 2 }),
  preferredRoomType: varchar('preferred_room_type', { length: 100 }),
  dietaryRestrictions: text('dietary_restrictions').array(),
  accessibilityNeeds: text('accessibility_needs').array(),
  communicationPreferences: jsonb('communication_preferences'),
  marketingConsent: boolean('marketing_consent').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  guestIdx: index('idx_guest_profiles_guest_id').on(table.guestId),
}));

export const guestReviews = pgTable('guest_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'cascade' }),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'cascade' }),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }),
  rating: integer('rating'),
  reviewText: text('review_text'),
  reviewCategory: varchar('review_category', { length: 50 }),
  isPublic: boolean('is_public').default(true),
  responseText: text('response_text'),
  respondedAt: timestamp('responded_at', { withTimezone: true }),
  respondedBy: uuid('responded_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  propertyIdx: index('idx_guest_reviews_property_id').on(table.propertyId),
  ratingIdx: index('idx_guest_reviews_rating').on(table.rating),
}));

export type GuestProfile = typeof guestProfiles.$inferSelect;
export type NewGuestProfile = typeof guestProfiles.$inferInsert;
export type GuestReview = typeof guestReviews.$inferSelect;
export type NewGuestReview = typeof guestReviews.$inferInsert;

// ============================================================================
// AI & COMMUNICATIONS
// ============================================================================

export const aiConversations = pgTable('ai_conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'set null' }),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'set null' }),
  sessionId: varchar('session_id', { length: 255 }),
  channel: varchar('channel', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).default('active'),
  context: jsonb('context').default(sql`'{}'`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  guestIdx: index('idx_ai_conversations_guest_id').on(table.guestId),
  propertyIdx: index('idx_ai_conversations_property_id').on(table.propertyId),
  sessionIdx: index('idx_ai_conversations_session_id').on(table.sessionId),
}));

export const aiMessages = pgTable('ai_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').references(() => aiConversations.id, { onDelete: 'cascade' }),
  senderType: varchar('sender_type', { length: 50 }).notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata').default(sql`'{}'`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  conversationIdx: index('idx_ai_messages_conversation_id').on(table.conversationId),
  createdAtIdx: index('idx_ai_messages_created_at').on(table.createdAt),
}));

export const sofiaEmailLogs = pgTable('sofia_email_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  templateId: uuid('template_id'),
  recipientEmail: varchar('recipient_email', { length: 255 }).notNull(),
  recipientName: varchar('recipient_name', { length: 255 }),
  subject: text('subject').notNull(),
  htmlContent: text('html_content'),
  textContent: text('text_content'),
  status: varchar('status', { length: 50 }).default('pending'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  openedAt: timestamp('opened_at', { withTimezone: true }),
  clickedAt: timestamp('clicked_at', { withTimezone: true }),
  bounceReason: text('bounce_reason'),
  errorMessage: text('error_message'),
  metadata: jsonb('metadata').default(sql`'{}'`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_sofia_email_logs_tenant_id').on(table.tenantId),
  statusIdx: index('idx_sofia_email_logs_status').on(table.status),
  recipientIdx: index('idx_sofia_email_logs_recipient_email').on(table.recipientEmail),
}));

export const sofiaIncomingEmails = pgTable('sofia_incoming_emails', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'set null' }),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'set null' }),
  conversationId: uuid('conversation_id').references(() => aiConversations.id, { onDelete: 'set null' }),
  messageId: varchar('message_id', { length: 500 }).notNull(),
  inReplyTo: varchar('in_reply_to', { length: 500 }),
  referencesHeader: text('references_header'),
  threadId: varchar('thread_id', { length: 500 }),
  fromEmail: varchar('from_email', { length: 255 }).notNull(),
  fromName: varchar('from_name', { length: 255 }),
  toEmail: varchar('to_email', { length: 255 }).notNull(),
  ccEmails: text('cc_emails').array(),
  bccEmails: text('bcc_emails').array(),
  subject: text('subject').notNull(),
  htmlBody: text('html_body'),
  textBody: text('text_body'),
  attachments: jsonb('attachments').default(sql`'[]'`),
  status: varchar('status', { length: 50 }).default('pending'),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  repliedAt: timestamp('replied_at', { withTimezone: true }),
  errorMessage: text('error_message'),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull(),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow(),
  metadata: jsonb('metadata').default(sql`'{}'`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_sofia_incoming_emails_tenant_id').on(table.tenantId),
  messageIdx: index('idx_sofia_incoming_emails_message_id').on(table.messageId),
  threadIdx: index('idx_sofia_incoming_emails_thread_id').on(table.threadId),
  fromIdx: index('idx_sofia_incoming_emails_from_email').on(table.fromEmail),
  statusIdx: index('idx_sofia_incoming_emails_status').on(table.status),
  uniqueTenantMessage: uniqueIndex('uq_sofia_incoming_emails_tenant_message_id').on(table.tenantId, table.messageId),
}));

export const sofiaEmailThreads = pgTable('sofia_email_threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'set null' }),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'set null' }),
  conversationId: uuid('conversation_id').references(() => aiConversations.id, { onDelete: 'set null' }),
  threadId: varchar('thread_id', { length: 500 }).notNull(),
  subject: text('subject').notNull(),
  initialMessageId: varchar('initial_message_id', { length: 500 }),
  emailCount: integer('email_count').default(1),
  lastEmailAt: timestamp('last_email_at', { withTimezone: true }),
  lastRepliedAt: timestamp('last_replied_at', { withTimezone: true }),
  status: varchar('status', { length: 50 }).default('active'),
  metadata: jsonb('metadata').default(sql`'{}'`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  uniqueTenantThread: uniqueIndex('uq_sofia_email_threads_tenant_thread_id').on(table.tenantId, table.threadId),
}));

export const sofiaEmailInboxConfig = pgTable('sofia_email_inbox_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'set null' }),
  emailAddress: varchar('email_address', { length: 255 }).notNull(),
  imapHost: varchar('imap_host', { length: 255 }).notNull(),
  imapPort: integer('imap_port').default(993),
  imapSecure: boolean('imap_secure').default(true),
  imapUsername: varchar('imap_username', { length: 255 }).notNull(),
  imapPassword: text('imap_password').notNull(),
  folderName: varchar('folder_name', { length: 100 }).default('INBOX'),
  checkIntervalMinutes: integer('check_interval_minutes').default(5),
  isActive: boolean('is_active').default(true),
  lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }),
  lastEmailUid: bigint('last_email_uid', { mode: 'number' }),
  autoReply: boolean('auto_reply').default(true),
  autoLinkConversation: boolean('auto_link_conversation').default(true),
  autoCreateGuest: boolean('auto_create_guest').default(true),
  metadata: jsonb('metadata').default(sql`'{}'`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_sofia_email_inbox_config_tenant_id').on(table.tenantId),
  isActiveIdx: index('idx_sofia_email_inbox_config_is_active').on(table.isActive),
}));

/** Telephony-linked Sofia sessions: transcript linkage, escalation, audit (gemini.md wire-up). */
export const sofiaVoiceSessions = pgTable('sofia_voice_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'set null' }),
  conversationId: uuid('conversation_id').references(() => aiConversations.id, { onDelete: 'set null' }),
  externalCallId: varchar('external_call_id', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 64 }).notNull().default('generic'),
  status: varchar('status', { length: 50 }).default('active'),
  handoffRequested: boolean('handoff_requested').default(false),
  metadata: jsonb('metadata').default(sql`'{}'`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
}, (table) => ({
  tenantIdx: index('idx_sofia_voice_sessions_tenant_id').on(table.tenantId),
  callIdx: index('idx_sofia_voice_sessions_external_call').on(table.externalCallId),
  uniqueTenantCall: uniqueIndex('uq_sofia_voice_sessions_tenant_external_call').on(
    table.tenantId,
    table.externalCallId
  ),
}));

export const cmsContent = pgTable('cms_content', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }),
  contentType: varchar('content_type', { length: 100 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  metadata: jsonb('metadata').default(sql`'{}'`),
  status: varchar('status', { length: 50 }).default('draft'),
  version: integer('version').default(1),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const cmsMedia = pgTable('cms_media', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }),
  contentId: uuid('content_id').references(() => cmsContent.id, { onDelete: 'set null' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: text('file_path').notNull(),
  fileType: varchar('file_type', { length: 50 }),
  fileSize: bigint('file_size', { mode: 'number' }),
  mimeType: varchar('mime_type', { length: 100 }),
  storageLocation: varchar('storage_location', { length: 255 }),
  altText: varchar('alt_text', { length: 255 }),
  caption: text('caption'),
  displayOrder: integer('display_order').default(0),
  metadata: jsonb('metadata').default(sql`'{}'`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  propertyIdx: index('idx_cms_media_property_id').on(table.propertyId),
}));

// ============================================================================
// SECURITY & COMPLIANCE
// ============================================================================

export const auditTrail = pgTable('audit_trail', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 50 }).notNull(),
  resourceId: uuid('resource_id'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: text('ip_address'), // INET type
  userAgent: text('user_agent'),
  sessionId: varchar('session_id', { length: 255 }),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tenantTimestampIdx: index('idx_audit_trail_tenant_timestamp').on(table.tenantId, table.timestamp),
  resourceIdx: index('idx_audit_trail_resource').on(table.resourceType, table.resourceId),
}));

export const systemLogs = pgTable('system_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  level: varchar('level', { length: 20 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  message: text('message').notNull(),
  metadata: jsonb('metadata'),
  userId: uuid('user_id').references(() => users.id),
  sessionId: varchar('session_id', { length: 255 }),
  ipAddress: text('ip_address'), // INET type
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tenantLevelIdx: index('idx_system_logs_tenant_level').on(table.tenantId, table.level, table.createdAt),
}));

/** Platform / tenant support tickets (Drizzle; replaces legacy Supabase support_tickets) */
export const supportTickets = pgTable(
  'support_tickets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    subject: varchar('subject', { length: 500 }).notNull(),
    description: text('description').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('open'),
    priority: varchar('priority', { length: 50 }).notNull().default('medium'),
    category: varchar('category', { length: 100 }).notNull().default('general'),
    assignedTo: uuid('assigned_to').references(() => users.id),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    /** Populated when ticket is escalated via Linear API (issue tracking) */
    linearIssueId: varchar('linear_issue_id', { length: 64 }),
    linearIssueUrl: text('linear_issue_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    tenantIdx: index('idx_support_tickets_tenant_id').on(table.tenantId),
    statusIdx: index('idx_support_tickets_status').on(table.status),
    userIdx: index('idx_support_tickets_user_id').on(table.userId),
  })
);

export const supportTicketReplies = pgTable(
  'support_ticket_replies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ticketId: uuid('ticket_id')
      .references(() => supportTickets.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    message: text('message').notNull(),
    isAdminReply: boolean('is_admin_reply').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    ticketIdx: index('idx_support_ticket_replies_ticket_id').on(table.ticketId),
  })
);

// ============================================================================
// CRM — GRAPH MEMORY & HOSPITALITY MARKETING (guest-centric)
// ============================================================================

/** Typed edges between CRM entities (guest, property, booking, outreach) for recall & analytics */
export const crmGraphEdges = pgTable(
  'crm_graph_edges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    srcEntityType: varchar('src_entity_type', { length: 50 }).notNull(),
    srcEntityId: varchar('src_entity_id', { length: 36 }).notNull(),
    dstEntityType: varchar('dst_entity_type', { length: 50 }).notNull(),
    dstEntityId: varchar('dst_entity_id', { length: 36 }).notNull(),
    relationType: varchar('relation_type', { length: 80 }).notNull(),
    weight: decimal('weight', { precision: 5, scale: 2 }).default('1'),
    metadata: jsonb('metadata').default(sql`'{}'`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    tenantIdx: index('idx_crm_graph_edges_tenant').on(table.tenantId),
    srcIdx: index('idx_crm_graph_edges_src').on(table.tenantId, table.srcEntityType, table.srcEntityId),
    dstIdx: index('idx_crm_graph_edges_dst').on(table.tenantId, table.dstEntityType, table.dstEntityId),
    naturalEdge: uniqueIndex('uq_crm_graph_edges_natural').on(
      table.tenantId,
      table.srcEntityType,
      table.srcEntityId,
      table.dstEntityType,
      table.dstEntityId,
      table.relationType
    ),
  })
);

/** Durable facts for Sofia / staff (Mem0 mirrors when enabled; local row optional) */
export const crmGuestMemoryFacts = pgTable(
  'crm_guest_memory_facts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    guestId: uuid('guest_id')
      .references(() => guests.id, { onDelete: 'cascade' })
      .notNull(),
    factText: text('fact_text').notNull(),
    source: varchar('source', { length: 32 }).notNull().default('sofia'),
    mem0MemoryId: varchar('mem0_memory_id', { length: 128 }),
    conversationSessionId: varchar('conversation_session_id', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    guestIdx: index('idx_crm_guest_memory_guest').on(table.tenantId, table.guestId),
  })
);

/** Sales / marketing touch — aligned with CRM_OUTREACH_TOUCH lifecycle in domainTransitions */
export const crmOutreachTouches = pgTable(
  'crm_outreach_touches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    guestId: uuid('guest_id')
      .references(() => guests.id, { onDelete: 'cascade' })
      .notNull(),
    propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'set null' }),
    channel: varchar('channel', { length: 32 }).notNull(),
    campaignKey: varchar('campaign_key', { length: 100 }),
    status: varchar('status', { length: 32 }).notNull().default('draft'),
    messageSubject: varchar('message_subject', { length: 500 }),
    messageBody: text('message_body'),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    workflowStage: varchar('workflow_stage', { length: 64 }),
    metadata: jsonb('metadata').default(sql`'{}'`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    tenantGuestIdx: index('idx_crm_outreach_tenant_guest').on(table.tenantId, table.guestId),
    statusIdx: index('idx_crm_outreach_status').on(table.status),
  })
);

/** Append-only marketing consent history for CRM/ETA evidence */
export const crmConsentEvents = pgTable(
  'crm_consent_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    guestId: uuid('guest_id')
      .references(() => guests.id, { onDelete: 'cascade' })
      .notNull(),
    previousMarketingConsent: boolean('previous_marketing_consent'),
    newMarketingConsent: boolean('new_marketing_consent').notNull(),
    source: varchar('source', { length: 64 }).notNull().default('dashboard'),
    reason: text('reason'),
    changedByUserId: uuid('changed_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    tenantIdx: index('idx_crm_consent_events_tenant_id').on(table.tenantId),
    guestIdx: index('idx_crm_consent_events_guest_id').on(table.guestId),
    createdIdx: index('idx_crm_consent_events_created_at').on(table.createdAt),
  })
);

export type CrmGraphEdge = typeof crmGraphEdges.$inferSelect;
export type NewCrmGraphEdge = typeof crmGraphEdges.$inferInsert;
export type CrmGuestMemoryFact = typeof crmGuestMemoryFacts.$inferSelect;
export type CrmOutreachTouch = typeof crmOutreachTouches.$inferSelect;
export type CrmConsentEvent = typeof crmConsentEvents.$inferSelect;
export type NewCrmConsentEvent = typeof crmConsentEvents.$inferInsert;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Infer types from tables for use in application
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type TwoFactorAuth = typeof twoFactorAuth.$inferSelect;
export type NewTwoFactorAuth = typeof twoFactorAuth.$inferInsert;

export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;

export type TenantWhatsappSetting = typeof tenantWhatsappSettings.$inferSelect;
export type NewTenantWhatsappSetting = typeof tenantWhatsappSettings.$inferInsert;

export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;

export type Guest = typeof guests.$inferSelect;
export type NewGuest = typeof guests.$inferInsert;

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;

export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;

export type CmsContent = typeof cmsContent.$inferSelect;
export type CmsMedia = typeof cmsMedia.$inferSelect;

export type Restaurant = typeof restaurants.$inferSelect;
export type NewRestaurant = typeof restaurants.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type AuditTrailEntry = typeof auditTrail.$inferSelect;
export type NewAuditTrailEntry = typeof auditTrail.$inferInsert;

// ============================================================================
// OPEN BANKING TABLES (Namibian Open Banking Standards v1.0)
// ============================================================================

// Open Banking Participants Table
export const obParticipants = pgTable('ob_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  participantId: varchar('participant_id', { length: 10 }).unique().notNull(), // APInnnnnn
  participantName: varchar('participant_name', { length: 255 }).notNull(),
  role: varchar('role', { length: 10 }).notNull(), // 'DP' or 'TPP'
  sectors: text('sectors').array().default(sql`ARRAY['banking']`),
  services: text('services').array().default(sql`ARRAY['AIS', 'PIS']`),
  operationTypes: text('operation_types').array().default(sql`ARRAY['Read', 'Write']`),
  status: varchar('status', { length: 50 }).default('active'),
  certificateSerial: varchar('certificate_serial', { length: 255 }).unique(),
  certificateValidFrom: timestamp('certificate_valid_from', { withTimezone: true }),
  certificateExpiresAt: timestamp('certificate_expires_at', { withTimezone: true }),
  contactEmail: varchar('contact_email', { length: 255 }).notNull(),
  contactUrl: text('contact_url'),
  developerPortalUrl: text('developer_portal_url'),
  sandboxUrl: text('sandbox_url'),
  productionUrl: text('production_url'),
  competentAuthorityName: varchar('competent_authority_name', { length: 255 }).default('Bank of Namibia'),
  competentAuthorityId: varchar('competent_authority_id', { length: 10 }).default('NA-BON'),
  metadata: jsonb('metadata').default(sql`'{}'`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  roleIdx: index('idx_ob_participants_role').on(table.role),
  statusIdx: index('idx_ob_participants_status').on(table.status),
}));

// OAuth 2.0 Consent Tokens Table
export const obConsentTokens = pgTable('ob_consent_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  consentId: varchar('consent_id', { length: 100 }).unique().notNull(),
  accountHolderId: uuid('account_holder_id').references(() => guests.id, { onDelete: 'cascade' }),
  tppParticipantId: varchar('tpp_participant_id', { length: 10 }).references(() => obParticipants.participantId),
  dpParticipantId: varchar('dp_participant_id', { length: 10 }).default('API000001'),
  scopes: text('scopes').array().notNull(),
  durationDays: integer('duration_days').default(180), // Max 180 days per BoN
  codeChallenge: varchar('code_challenge', { length: 255 }),
  codeChallengeMethod: varchar('code_challenge_method', { length: 10 }).default('S256'),
  authorizationCode: varchar('authorization_code', { length: 255 }).unique(),
  authorizationCodeExpiresAt: timestamp('authorization_code_expires_at', { withTimezone: true }),
  authorizationCodeUsed: boolean('authorization_code_used').default(false),
  accessToken: text('access_token').notNull(),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }).notNull(),
  refreshToken: text('refresh_token'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  requestUri: text('request_uri'),
  state: varchar('state', { length: 255 }),
  nonce: varchar('nonce', { length: 255 }),
  redirectUri: text('redirect_uri').notNull(),
  status: varchar('status', { length: 50 }).default('active'),
  revokedBy: varchar('revoked_by', { length: 50 }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  usageCount: integer('usage_count').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  accountHolderIdx: index('idx_ob_consent_tokens_account_holder').on(table.accountHolderId),
  tppIdx: index('idx_ob_consent_tokens_tpp').on(table.tppParticipantId),
  statusIdx: index('idx_ob_consent_tokens_status').on(table.status),
  expiresIdx: index('idx_ob_consent_tokens_expires').on(table.accessTokenExpiresAt),
}));

// Trust Accounts Table (PSD-3: 100% Reserve Requirement)
export const trustAccountsPsd3 = pgTable('trust_accounts_psd3', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  accountNumber: varchar('account_number', { length: 100 }).unique().notNull(),
  accountName: varchar('account_name', { length: 255 }).notNull(),
  bankName: varchar('bank_name', { length: 255 }).notNull(),
  bankCode: varchar('bank_code', { length: 10 }),
  branch: varchar('branch', { length: 255 }),
  balance: decimal('balance', { precision: 15, scale: 2 }).default('0'),
  outstandingLiabilities: decimal('outstanding_liabilities', { precision: 15, scale: 2 }).default('0'),
  reservePercentage: decimal('reserve_percentage', { precision: 5, scale: 2 }).default('100.00'),
  lastReconciliationAt: timestamp('last_reconciliation_at', { withTimezone: true }),
  reconciliationStatus: varchar('reconciliation_status', { length: 50 }).default('balanced'),
  deficiencyAmount: decimal('deficiency_amount', { precision: 15, scale: 2 }).default('0'),
  currency: varchar('currency', { length: 3 }).default('NAD'),
  status: varchar('status', { length: 50 }).default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_trust_accounts_psd3_tenant').on(table.tenantId),
  statusIdx: index('idx_trust_accounts_psd3_status').on(table.status),
}));

// NamQR Codes Table (NamQR v5.0)
export const namqrCodes = pgTable('namqr_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'set null' }),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'set null' }),
  qrReference: varchar('qr_reference', { length: 10 }).unique().notNull(), // NREF
  tokenVaultId: varchar('token_vault_id', { length: 50 }),
  qrType: varchar('qr_type', { length: 50 }).notNull(),
  presentationMode: varchar('presentation_mode', { length: 50 }).notNull(),
  qrPayload: text('qr_payload').notNull(),
  qrImageUrl: text('qr_image_url'),
  payeeIdentifier: varchar('payee_identifier', { length: 255 }),
  payeeName: varchar('payee_name', { length: 255 }),
  amount: decimal('amount', { precision: 15, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('NAD'),
  merchantCategoryCode: varchar('merchant_category_code', { length: 4 }),
  merchantId: varchar('merchant_id', { length: 50 }),
  isActive: boolean('is_active').default(true),
  scanCount: integer('scan_count').default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  signature: varchar('signature', { length: 512 }),
  isSigned: boolean('is_signed').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  qrRefIdx: index('idx_namqr_codes_qr_reference').on(table.qrReference),
  tokenVaultIdx: index('idx_namqr_codes_token_vault').on(table.tokenVaultId),
  activeIdx: index('idx_namqr_codes_is_active').on(table.isActive),
}));

// API Transaction Log
export const obApiTransactions = pgTable('ob_api_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: varchar('request_id', { length: 100 }).unique().notNull(),
  tppParticipantId: varchar('tpp_participant_id', { length: 10 }).references(() => obParticipants.participantId),
  endpoint: varchar('endpoint', { length: 255 }).notNull(),
  httpMethod: varchar('http_method', { length: 10 }).notNull(),
  httpStatusCode: integer('http_status_code').notNull(),
  responseTimeMs: integer('response_time_ms'),
  consentId: varchar('consent_id', { length: 100 }).references(() => obConsentTokens.consentId),
  accountHolderId: uuid('account_holder_id').references(() => guests.id),
  scopesUsed: text('scopes_used').array(),
  ipAddress: text('ip_address'),
  errorCode: varchar('error_code', { length: 50 }),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tppIdx: index('idx_ob_api_transactions_tpp').on(table.tppParticipantId),
  endpointIdx: index('idx_ob_api_transactions_endpoint').on(table.endpoint),
  createdAtIdx: index('idx_ob_api_transactions_created_at').on(table.createdAt),
}));

// Consumer Rights Requests Table (ETA 2019)
export const consumerRightsRequests = pgTable('consumer_rights_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  accountHolderId: uuid('account_holder_id').references(() => guests.id, { onDelete: 'cascade' }),
  transactionId: uuid('transaction_id').references(() => transactions.id),
  requestReference: varchar('request_reference', { length: 100 }).unique().notNull(),
  requestType: varchar('request_type', { length: 50 }).notNull(),
  requestDate: date('request_date').notNull(),
  requestDescription: text('request_description').notNull(),
  coolingOffDeadline: date('cooling_off_deadline'), // ETA Section 35: 7 days
  refundDeadline: date('refund_deadline'), // ETA Section 37: 30 days
  status: varchar('status', { length: 50 }).default('pending'),
  resolutionDate: date('resolution_date'),
  resolutionNotes: text('resolution_notes'),
  refundAmount: decimal('refund_amount', { precision: 15, scale: 2 }),
  assignedTo: uuid('assigned_to').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  accountHolderIdx: index('idx_consumer_rights_requests_account_holder').on(table.accountHolderId),
  typeIdx: index('idx_consumer_rights_requests_type').on(table.requestType),
  statusIdx: index('idx_consumer_rights_requests_status').on(table.status),
}));

// Cybersecurity Incidents Table (PSD-12)
export const cybersecurityIncidents = pgTable('cybersecurity_incidents', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  incidentReference: varchar('incident_reference', { length: 100 }).unique().notNull(),
  incidentType: varchar('incident_type', { length: 50 }).notNull(),
  severity: varchar('severity', { length: 50 }).notNull(),
  affectedSystems: text('affected_systems').array(),
  incidentDescription: text('incident_description').notNull(),
  financialLoss: decimal('financial_loss', { precision: 15, scale: 2 }),
  availabilityLossMinutes: integer('availability_loss_minutes'),
  detectedAt: timestamp('detected_at', { withTimezone: true }).notNull(),
  reportedToBonAt: timestamp('reported_to_bon_at', { withTimezone: true }),
  bonReportingDeadline: timestamp('bon_reporting_deadline', { withTimezone: true }),
  recoveryStartedAt: timestamp('recovery_started_at', { withTimezone: true }),
  recoveryCompletedAt: timestamp('recovery_completed_at', { withTimezone: true }),
  recoveryTimeMinutes: integer('recovery_time_minutes'), // Must be <= 120 (2 hours)
  status: varchar('status', { length: 50 }).default('open'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  severityIdx: index('idx_cybersecurity_incidents_severity').on(table.severity),
  statusIdx: index('idx_cybersecurity_incidents_status').on(table.status),
  detectedIdx: index('idx_cybersecurity_incidents_detected_at').on(table.detectedAt),
}));

// Type exports for Open Banking
export type ObParticipant = typeof obParticipants.$inferSelect;
export type NewObParticipant = typeof obParticipants.$inferInsert;

export type ObConsentToken = typeof obConsentTokens.$inferSelect;
export type NewObConsentToken = typeof obConsentTokens.$inferInsert;

export type TrustAccountPsd3 = typeof trustAccountsPsd3.$inferSelect;
export type NewTrustAccountPsd3 = typeof trustAccountsPsd3.$inferInsert;

export type NamqrCode = typeof namqrCodes.$inferSelect;
export type NewNamqrCode = typeof namqrCodes.$inferInsert;

export type ConsumerRightsRequest = typeof consumerRightsRequests.$inferSelect;
export type NewConsumerRightsRequest = typeof consumerRightsRequests.$inferInsert;

export type CybersecurityIncident = typeof cybersecurityIncidents.$inferSelect;
export type NewCybersecurityIncident = typeof cybersecurityIncidents.$inferInsert;

export type SupportTicketRow = typeof supportTickets.$inferSelect;
export type NewSupportTicketRow = typeof supportTickets.$inferInsert;
export type SupportTicketReplyRow = typeof supportTicketReplies.$inferSelect;
export type NewSupportTicketReplyRow = typeof supportTicketReplies.$inferInsert;

export type SofiaVoiceSession = typeof sofiaVoiceSessions.$inferSelect;
export type NewSofiaVoiceSession = typeof sofiaVoiceSessions.$inferInsert;

export type ComplianceVerificationCaseRow = typeof complianceVerificationCases.$inferSelect;
export type NewComplianceVerificationCaseRow = typeof complianceVerificationCases.$inferInsert;
export type ComplianceVerificationDocumentRow = typeof complianceVerificationDocuments.$inferSelect;
export type NewComplianceVerificationDocumentRow = typeof complianceVerificationDocuments.$inferInsert;

// ============================================================================
// AML/CFT COMPLIANCE (Anti-Money Laundering & Counter-Financing of Terrorism)
// ============================================================================

export const amlRiskLevelEnum = pgEnum('aml_risk_level', [
  'low',
  'medium',
  'high',
  'critical',
]);

export const amlAlertStatusEnum = pgEnum('aml_alert_status', [
  'pending',
  'investigating',
  'cleared',
  'escalated',
  'reported',
]);

export const strStatusEnum = pgEnum('str_status', [
  'draft',
  'submitted',
  'acknowledged',
  'under_review',
  'closed',
]);

export const pepCategoryEnum = pgEnum('pep_category', [
  'head_of_state',
  'government_official',
  'senior_politician',
  'judicial_official',
  'military_official',
  'state_owned_enterprise',
  'political_party_official',
  'close_associate',
  'family_member',
]);

export const amlPepDatabase = pgTable('aml_pep_database', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  
  fullName: varchar('full_name', { length: 255 }).notNull(),
  dateOfBirth: date('date_of_birth'),
  nationality: varchar('nationality', { length: 100 }),
  idNumber: varchar('id_number', { length: 100 }),
  passportNumber: varchar('passport_number', { length: 100 }),
  
  pepCategory: varchar('pep_category', { length: 50 }).notNull(),
  positionTitle: varchar('position_title', { length: 255 }),
  organization: varchar('organization', { length: 255 }),
  countryOfOffice: varchar('country_of_office', { length: 100 }),
  isDomesticPep: boolean('is_domestic_pep').default(false),
  isForeignPep: boolean('is_foreign_pep').default(false),
  
  riskLevel: varchar('risk_level', { length: 20 }).default('high'),
  riskFactors: jsonb('risk_factors').$type<string[]>().default(sql`'[]'`),
  
  associatedPeps: uuid('associated_peps').array(),
  beneficialOwners: jsonb('beneficial_owners').default(sql`'[]'`),
  
  source: varchar('source', { length: 100 }).notNull(),
  verificationDate: date('verification_date'),
  verifiedBy: uuid('verified_by').references(() => users.id),
  
  isActive: boolean('is_active').default(true),
  positionStartDate: date('position_start_date'),
  positionEndDate: date('position_end_date'),
  exitInterviewCompleted: boolean('exit_interview_completed').default(false),
  coolingOffPeriodEnd: date('cooling_off_period_end'),
  
  notes: text('notes'),
  metadata: jsonb('metadata').default(sql`'{}'`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_aml_pep_database_tenant_id').on(table.tenantId),
  nameIdx: index('idx_aml_pep_database_full_name').on(table.fullName),
  idNumberIdx: index('idx_aml_pep_database_id_number').on(table.idNumber),
  passportIdx: index('idx_aml_pep_database_passport_number').on(table.passportNumber),
  riskIdx: index('idx_aml_pep_database_risk_level').on(table.riskLevel),
  activeIdx: index('idx_aml_pep_database_is_active').on(table.isActive),
}));

export const amlGuestPepFlags = pgTable('aml_guest_pep_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'cascade' }),
  pepId: uuid('pep_id').references(() => amlPepDatabase.id, { onDelete: 'set null' }),
  
  flagType: varchar('flag_type', { length: 50 }).notNull(),
  matchConfidence: decimal('match_confidence', { precision: 5, scale: 2 }),
  matchCriteria: jsonb('match_criteria').default(sql`'{}'`),
  
  eddCompleted: boolean('edd_completed').default(false),
  eddCompletedAt: timestamp('edd_completed_at', { withTimezone: true }),
  eddCompletedBy: uuid('edd_completed_by').references(() => users.id),
  sourceOfWealthVerified: boolean('source_of_wealth_verified').default(false),
  sourceOfFundsVerified: boolean('source_of_funds_verified').default(false),
  
  relationshipApproved: boolean('relationship_approved').default(false),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  ongoingMonitoringLevel: varchar('ongoing_monitoring_level', { length: 50 }).default('enhanced'),
  
  isActive: boolean('is_active').default(true),
  flaggedAt: timestamp('flagged_at', { withTimezone: true }).defaultNow(),
  clearedAt: timestamp('cleared_at', { withTimezone: true }),
  clearedBy: uuid('cleared_by').references(() => users.id),
  clearanceReason: text('clearance_reason'),
  
  notes: text('notes'),
  metadata: jsonb('metadata').default(sql`'{}'`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  guestIdx: index('idx_aml_guest_pep_flags_guest_id').on(table.guestId),
  pepIdx: index('idx_aml_guest_pep_flags_pep_id').on(table.pepId),
  activeIdx: index('idx_aml_guest_pep_flags_is_active').on(table.isActive),
  tenantIdx: index('idx_aml_guest_pep_flags_tenant_id').on(table.tenantId),
}));

export const amlTransactionAlerts = pgTable('aml_transaction_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  
  transactionId: uuid('transaction_id').references(() => transactions.id, { onDelete: 'set null' }),
  transactionReference: varchar('transaction_reference', { length: 100 }),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'set null' }),
  
  alertType: varchar('alert_type', { length: 100 }).notNull(),
  alertCategory: varchar('alert_category', { length: 50 }).notNull(),
  riskLevel: varchar('risk_level', { length: 20 }).default('medium'),
  riskScore: decimal('risk_score', { precision: 5, scale: 2 }),
  
  triggerRules: jsonb('trigger_rules').default(sql`'[]'`),
  detectionTimestamp: timestamp('detection_timestamp', { withTimezone: true }).defaultNow(),
  patternDetails: jsonb('pattern_details').default(sql`'{}'`),
  
  amount: decimal('amount', { precision: 15, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('NAD'),
  transactionCount: integer('transaction_count'),
  timeWindowHours: integer('time_window_hours'),
  geographicPattern: jsonb('geographic_pattern'),
  
  status: varchar('status', { length: 50 }).default('pending'),
  assignedTo: uuid('assigned_to').references(() => users.id),
  assignedAt: timestamp('assigned_at', { withTimezone: true }),
  investigationNotes: text('investigation_notes'),
  resolutionNotes: text('resolution_notes'),
  
  escalated: boolean('escalated').default(false),
  escalatedAt: timestamp('escalated_at', { withTimezone: true }),
  escalatedTo: uuid('escalated_to').references(() => users.id),
  requiresStr: boolean('requires_str').default(false),
  strId: uuid('str_id'),
  
  investigatedAt: timestamp('investigated_at', { withTimezone: true }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  
  metadata: jsonb('metadata').default(sql`'{}'`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_aml_transaction_alerts_tenant_id').on(table.tenantId),
  transactionIdx: index('idx_aml_transaction_alerts_transaction_id').on(table.transactionId),
  guestIdx: index('idx_aml_transaction_alerts_guest_id').on(table.guestId),
  statusIdx: index('idx_aml_transaction_alerts_status').on(table.status),
  riskIdx: index('idx_aml_transaction_alerts_risk_level').on(table.riskLevel),
  createdIdx: index('idx_aml_transaction_alerts_created_at').on(table.createdAt),
}));

export const amlMonitoringRules = pgTable('aml_monitoring_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  
  ruleCode: varchar('rule_code', { length: 50 }).unique().notNull(),
  ruleName: varchar('rule_name', { length: 255 }).notNull(),
  ruleCategory: varchar('rule_category', { length: 50 }).notNull(),
  description: text('description'),
  
  thresholdValue: decimal('threshold_value', { precision: 15, scale: 2 }),
  thresholdCount: integer('threshold_count'),
  timeWindowHours: integer('time_window_hours'),
  riskLevel: varchar('risk_level', { length: 20 }).default('medium'),
  
  isActive: boolean('is_active').default(true),
  autoEscalate: boolean('auto_escalate').default(false),
  requiresImmediateReview: boolean('requires_immediate_review').default(false),
  
  conditions: jsonb('conditions').notNull().default(sql`'{}'`),
  actions: jsonb('actions').default(sql`'[]'`),
  
  createdBy: uuid('created_by').references(() => users.id),
  lastModifiedBy: uuid('last_modified_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_aml_monitoring_rules_tenant_id').on(table.tenantId),
  ruleCodeIdx: index('idx_aml_monitoring_rules_rule_code').on(table.ruleCode),
  activeIdx: index('idx_aml_monitoring_rules_is_active').on(table.isActive),
}));

export const amlSuspiciousTransactionReports = pgTable('aml_suspicious_transaction_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  
  strReference: varchar('str_reference', { length: 100 }).unique().notNull(),
  strType: varchar('str_type', { length: 50 }).notNull(),
  
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'set null' }),
  subjectName: varchar('subject_name', { length: 255 }).notNull(),
  subjectIdNumber: varchar('subject_id_number', { length: 100 }),
  subjectPassport: varchar('subject_passport', { length: 100 }),
  subjectAddress: text('subject_address'),
  subjectNationality: varchar('subject_nationality', { length: 100 }),
  
  transactionIds: uuid('transaction_ids').array(),
  alertIds: uuid('alert_ids').array(),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('NAD'),
  transactionCount: integer('transaction_count'),
  
  suspicionCategory: varchar('suspicion_category', { length: 100 }).notNull(),
  suspicionIndicators: jsonb('suspicion_indicators').default(sql`'[]'`),
  suspicionDescription: text('suspicion_description').notNull(),
  supportingEvidence: jsonb('supporting_evidence').default(sql`'[]'`),
  
  riskLevel: varchar('risk_level', { length: 20 }).default('high'),
  riskScore: decimal('risk_score', { precision: 5, scale: 2 }),
  riskAnalysis: text('risk_analysis'),
  
  detectionDate: date('detection_date').notNull(),
  reportDeadline: date('report_deadline').notNull(),
  draftedAt: timestamp('drafted_at', { withTimezone: true }),
  draftedBy: uuid('drafted_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  submittedBy: uuid('submitted_by').references(() => users.id),
  
  ficSubmissionReference: varchar('fic_submission_reference', { length: 100 }),
  ficAcknowledgmentDate: date('fic_acknowledgment_date'),
  ficResponseDate: date('fic_response_date'),
  ficFeedback: text('fic_feedback'),
  
  status: varchar('status', { length: 50 }).default('draft'),
  actionTaken: varchar('action_taken', { length: 255 }),
  followUpRequired: boolean('follow_up_required').default(false),
  followUpNotes: text('follow_up_notes'),
  
  tippingOffRiskAssessed: boolean('tipping_off_risk_assessed').default(false),
  customerNotified: boolean('customer_notified').default(false),
  
  retentionUntil: date('retention_until').notNull(),
  archived: boolean('archived').default(false),
  
  metadata: jsonb('metadata').default(sql`'{}'`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_aml_str_tenant_id').on(table.tenantId),
  guestIdx: index('idx_aml_str_guest_id').on(table.guestId),
  statusIdx: index('idx_aml_str_status').on(table.status),
  deadlineIdx: index('idx_aml_str_report_deadline').on(table.reportDeadline),
  createdIdx: index('idx_aml_str_created_at').on(table.createdAt),
  retentionIdx: index('idx_aml_str_retention_until').on(table.retentionUntil),
}));

export const amlDueDiligenceRecords = pgTable('aml_due_diligence_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'cascade' }),
  
  ddLevel: varchar('dd_level', { length: 50 }).notNull().default('standard'),
  riskLevel: varchar('risk_level', { length: 20 }).default('low'),
  riskAssessmentDate: date('risk_assessment_date').notNull(),
  riskAssessmentBy: uuid('risk_assessment_by').references(() => users.id),
  
  identityVerified: boolean('identity_verified').default(false),
  identityVerificationMethod: varchar('identity_verification_method', { length: 100 }),
  identityVerificationDate: date('identity_verification_date'),
  identityDocuments: jsonb('identity_documents').default(sql`'[]'`),
  
  sourceOfWealthDeclared: varchar('source_of_wealth_declared', { length: 255 }),
  sourceOfWealthVerified: boolean('source_of_wealth_verified').default(false),
  sourceOfWealthDocuments: jsonb('source_of_wealth_documents').default(sql`'[]'`),
  
  sourceOfFundsDeclared: varchar('source_of_funds_declared', { length: 255 }),
  sourceOfFundsVerified: boolean('source_of_funds_verified').default(false),
  sourceOfFundsDocuments: jsonb('source_of_funds_documents').default(sql`'[]'`),
  
  beneficialOwners: jsonb('beneficial_owners').default(sql`'[]'`),
  beneficialOwnershipVerified: boolean('beneficial_ownership_verified').default(false),
  
  purposeOfRelationship: text('purpose_of_relationship'),
  expectedTransactionVolume: varchar('expected_transaction_volume', { length: 100 }),
  expectedTransactionTypes: text('expected_transaction_types').array(),
  
  lastReviewDate: date('last_review_date'),
  nextReviewDate: date('next_review_date'),
  reviewFrequencyDays: integer('review_frequency_days').default(365),
  
  isPep: boolean('is_pep').default(false),
  pepFlagId: uuid('pep_flag_id').references(() => amlGuestPepFlags.id),
  
  approved: boolean('approved').default(false),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  
  notes: text('notes'),
  attachments: jsonb('attachments').default(sql`'[]'`),
  
  metadata: jsonb('metadata').default(sql`'{}'`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_aml_dd_records_tenant_id').on(table.tenantId),
  guestIdx: index('idx_aml_dd_records_guest_id').on(table.guestId),
  riskIdx: index('idx_aml_dd_records_risk_level').on(table.riskLevel),
  reviewIdx: index('idx_aml_dd_records_next_review_date').on(table.nextReviewDate),
}));

export const amlTransactionVelocity = pgTable('aml_transaction_velocity', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'cascade' }),
  
  windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
  windowEnd: timestamp('window_end', { withTimezone: true }).notNull(),
  windowHours: integer('window_hours').notNull(),
  
  transactionCount: integer('transaction_count').notNull(),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }),
  averageAmount: decimal('average_amount', { precision: 15, scale: 2 }),
  maxAmount: decimal('max_amount', { precision: 15, scale: 2 }),
  minAmount: decimal('min_amount', { precision: 15, scale: 2 }),
  
  isSuspicious: boolean('is_suspicious').default(false),
  suspicionReason: varchar('suspicion_reason', { length: 255 }),
  riskScore: decimal('risk_score', { precision: 5, scale: 2 }),
  
  uniqueLocations: integer('unique_locations'),
  locationDetails: jsonb('location_details').default(sql`'[]'`),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  guestIdx: index('idx_aml_velocity_guest_id').on(table.guestId),
  windowIdx: index('idx_aml_velocity_window_start').on(table.windowStart),
  suspiciousIdx: index('idx_aml_velocity_is_suspicious').on(table.isSuspicious),
}));

export const amlGeographicPatterns = pgTable('aml_geographic_patterns', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'cascade' }),
  transactionId: uuid('transaction_id').references(() => transactions.id, { onDelete: 'cascade' }),
  
  ipAddress: text('ip_address'),
  countryCode: varchar('country_code', { length: 2 }),
  city: varchar('city', { length: 100 }),
  region: varchar('region', { length: 100 }),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  
  isHighRiskJurisdiction: boolean('is_high_risk_jurisdiction').default(false),
  isUnusualLocation: boolean('is_unusual_location').default(false),
  distanceFromUsualKm: integer('distance_from_usual_km'),
  
  riskLevel: varchar('risk_level', { length: 20 }).default('low'),
  riskFactors: jsonb('risk_factors').default(sql`'[]'`),
  
  transactionTimestamp: timestamp('transaction_timestamp', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  guestIdx: index('idx_aml_geo_patterns_guest_id').on(table.guestId),
  countryIdx: index('idx_aml_geo_patterns_country_code').on(table.countryCode),
  highRiskIdx: index('idx_aml_geo_patterns_is_high_risk').on(table.isHighRiskJurisdiction),
}));

export type AmlPepDatabase = typeof amlPepDatabase.$inferSelect;
export type NewAmlPepDatabase = typeof amlPepDatabase.$inferInsert;
export type AmlGuestPepFlag = typeof amlGuestPepFlags.$inferSelect;
export type NewAmlGuestPepFlag = typeof amlGuestPepFlags.$inferInsert;
export type AmlTransactionAlert = typeof amlTransactionAlerts.$inferSelect;
export type NewAmlTransactionAlert = typeof amlTransactionAlerts.$inferInsert;
export type AmlMonitoringRule = typeof amlMonitoringRules.$inferSelect;
export type NewAmlMonitoringRule = typeof amlMonitoringRules.$inferInsert;
export type AmlSuspiciousTransactionReport = typeof amlSuspiciousTransactionReports.$inferSelect;
export type NewAmlSuspiciousTransactionReport = typeof amlSuspiciousTransactionReports.$inferInsert;
export type AmlDueDiligenceRecord = typeof amlDueDiligenceRecords.$inferSelect;
export type NewAmlDueDiligenceRecord = typeof amlDueDiligenceRecords.$inferInsert;
export type AmlTransactionVelocity = typeof amlTransactionVelocity.$inferSelect;
export type NewAmlTransactionVelocity = typeof amlTransactionVelocity.$inferInsert;
export type AmlGeographicPattern = typeof amlGeographicPatterns.$inferSelect;
export type NewAmlGeographicPattern = typeof amlGeographicPatterns.$inferInsert;

// ============================================================================
// FRAUD DETECTION TABLES (Namibian Fraud Prevention)
// ============================================================================

export const fraudRiskProfiles = pgTable('fraud_risk_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  transactionId: uuid('transaction_id').references(() => transactions.id, { onDelete: 'cascade' }),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'cascade' }),
  
  riskScore: decimal('risk_score', { precision: 5, scale: 2 }).notNull().default('0'),
  riskLevel: varchar('risk_level', { length: 20 }).notNull().default('low'),
  fraudType: varchar('fraud_type', { length: 50 }),
  
  velocityScore: decimal('velocity_score', { precision: 5, scale: 2 }).default('0'),
  geographicScore: decimal('geographic_score', { precision: 5, scale: 2 }).default('0'),
  deviceScore: decimal('device_score', { precision: 5, scale: 2 }).default('0'),
  behavioralScore: decimal('behavioral_score', { precision: 5, scale: 2 }).default('0'),
  amountScore: decimal('amount_score', { precision: 5, scale: 2 }).default('0'),
  
  decision: varchar('decision', { length: 20 }).notNull().default('pending'),
  decisionReason: text('decision_reason'),
  requires3ds: boolean('requires_3ds').default(false),
  requiresOtp: boolean('requires_otp').default(false),
  requiresManualReview: boolean('requires_manual_review').default(false),
  
  detectionRules: jsonb('detection_rules').default(sql`'[]'`),
  deviceFingerprint: jsonb('device_fingerprint'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  
  detectedAt: timestamp('detected_at', { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_fraud_risk_profiles_tenant').on(table.tenantId),
  transactionIdx: index('idx_fraud_risk_profiles_transaction').on(table.transactionId),
  guestIdx: index('idx_fraud_risk_profiles_guest').on(table.guestId),
  riskLevelIdx: index('idx_fraud_risk_profiles_risk_level').on(table.riskLevel),
  decisionIdx: index('idx_fraud_risk_profiles_decision').on(table.decision),
  detectedAtIdx: index('idx_fraud_risk_profiles_detected_at').on(table.detectedAt),
}));

export const fraudDeviceFingerprints = pgTable('fraud_device_fingerprints', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'cascade' }),
  
  deviceId: varchar('device_id', { length: 255 }).notNull().unique(),
  deviceHash: varchar('device_hash', { length: 255 }).notNull(),
  
  browserName: varchar('browser_name', { length: 100 }),
  browserVersion: varchar('browser_version', { length: 50 }),
  osName: varchar('os_name', { length: 100 }),
  osVersion: varchar('os_version', { length: 50 }),
  deviceType: varchar('device_type', { length: 50 }),
  screenResolution: varchar('screen_resolution', { length: 50 }),
  timezone: varchar('timezone', { length: 100 }),
  language: varchar('language', { length: 10 }),
  
  isTrusted: boolean('is_trusted').default(false),
  trustScore: decimal('trust_score', { precision: 5, scale: 2 }).default('0'),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  transactionCount: integer('transaction_count').default(0),
  fraudCount: integer('fraud_count').default(0),
  
  ipAddresses: text('ip_addresses').array().default(sql`ARRAY[]::TEXT[]`),
  countries: text('countries').array().default(sql`ARRAY[]::TEXT[]`),
  cities: text('cities').array().default(sql`ARRAY[]::TEXT[]`),
  
  isVpn: boolean('is_vpn').default(false),
  isProxy: boolean('is_proxy').default(false),
  isTor: boolean('is_tor').default(false),
  isEmulator: boolean('is_emulator').default(false),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_fraud_device_fingerprints_tenant').on(table.tenantId),
  guestIdx: index('idx_fraud_device_fingerprints_guest').on(table.guestId),
  deviceIdIdx: index('idx_fraud_device_fingerprints_device_id').on(table.deviceId),
  trustScoreIdx: index('idx_fraud_device_fingerprints_trust_score').on(table.trustScore),
}));

export const fraudAlerts = pgTable('fraud_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  riskProfileId: uuid('risk_profile_id').references(() => fraudRiskProfiles.id, { onDelete: 'cascade' }),
  transactionId: uuid('transaction_id').references(() => transactions.id, { onDelete: 'cascade' }),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'cascade' }),
  
  alertType: varchar('alert_type', { length: 50 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  
  status: varchar('status', { length: 20 }).notNull().default('open'),
  priority: integer('priority').default(5),
  
  assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }),
  
  resolvedBy: uuid('resolved_by').references(() => users.id, { onDelete: 'set null' }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolutionNotes: text('resolution_notes'),
  isFalsePositive: boolean('is_false_positive').default(false),
  
  emailSent: boolean('email_sent').default(false),
  smsSent: boolean('sms_sent').default(false),
  webhookSent: boolean('webhook_sent').default(false),
  notificationSentAt: timestamp('notification_sent_at', { withTimezone: true }),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_fraud_alerts_tenant').on(table.tenantId),
  riskProfileIdx: index('idx_fraud_alerts_risk_profile').on(table.riskProfileId),
  statusIdx: index('idx_fraud_alerts_status').on(table.status),
  severityIdx: index('idx_fraud_alerts_severity').on(table.severity),
  assignedIdx: index('idx_fraud_alerts_assigned').on(table.assignedTo),
  createdIdx: index('idx_fraud_alerts_created').on(table.createdAt),
}));

export const fraudDetectionRules = pgTable('fraud_detection_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  
  ruleName: varchar('rule_name', { length: 255 }).notNull(),
  ruleType: varchar('rule_type', { length: 50 }).notNull(),
  description: text('description'),
  
  conditions: jsonb('conditions').notNull(),
  thresholdValue: decimal('threshold_value', { precision: 15, scale: 2 }),
  thresholdOperator: varchar('threshold_operator', { length: 10 }),
  
  action: varchar('action', { length: 50 }).notNull(),
  riskScoreImpact: decimal('risk_score_impact', { precision: 5, scale: 2 }).default('0'),
  
  isActive: boolean('is_active').default(true),
  priority: integer('priority').default(5),
  
  triggerCount: integer('trigger_count').default(0),
  truePositiveCount: integer('true_positive_count').default(0),
  falsePositiveCount: integer('false_positive_count').default(0),
  accuracyRate: decimal('accuracy_rate', { precision: 5, scale: 2 }),
  
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_fraud_rules_tenant').on(table.tenantId),
  typeIdx: index('idx_fraud_rules_type').on(table.ruleType),
  activeIdx: index('idx_fraud_rules_active').on(table.isActive),
  priorityIdx: index('idx_fraud_rules_priority').on(table.priority),
}));

export const fraudCases = pgTable('fraud_cases', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  caseReference: varchar('case_reference', { length: 100 }).unique().notNull(),
  
  caseType: varchar('case_type', { length: 50 }).notNull(),
  fraudType: varchar('fraud_type', { length: 50 }),
  severity: varchar('severity', { length: 20 }).notNull(),
  
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'set null' }),
  transactionIds: uuid('transaction_ids').array().default(sql`ARRAY[]::UUID[]`),
  alertIds: uuid('alert_ids').array().default(sql`ARRAY[]::UUID[]`),
  
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).default('0'),
  recoveredAmount: decimal('recovered_amount', { precision: 15, scale: 2 }).default('0'),
  currency: varchar('currency', { length: 3 }).default('NAD'),
  
  status: varchar('status', { length: 20 }).notNull().default('open'),
  assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  priority: integer('priority').default(5),
  
  description: text('description'),
  investigationNotes: text('investigation_notes'),
  evidenceUrls: text('evidence_urls').array().default(sql`ARRAY[]::TEXT[]`),
  
  resolution: varchar('resolution', { length: 50 }),
  resolutionNotes: text('resolution_notes'),
  policeReportFiled: boolean('police_report_filed').default(false),
  policeCaseNumber: varchar('police_case_number', { length: 100 }),
  
  openedAt: timestamp('opened_at', { withTimezone: true }).notNull().defaultNow(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_fraud_cases_tenant').on(table.tenantId),
  referenceIdx: index('idx_fraud_cases_reference').on(table.caseReference),
  statusIdx: index('idx_fraud_cases_status').on(table.status),
  severityIdx: index('idx_fraud_cases_severity').on(table.severity),
  guestIdx: index('idx_fraud_cases_guest').on(table.guestId),
}));

export const fraudStatistics = pgTable('fraud_statistics', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  
  periodType: varchar('period_type', { length: 20 }).notNull(),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  
  totalTransactions: integer('total_transactions').default(0),
  flaggedTransactions: integer('flagged_transactions').default(0),
  declinedTransactions: integer('declined_transactions').default(0),
  fraudRate: decimal('fraud_rate', { precision: 5, scale: 2 }).default('0'),
  
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).default('0'),
  fraudAmount: decimal('fraud_amount', { precision: 15, scale: 2 }).default('0'),
  preventedAmount: decimal('prevented_amount', { precision: 15, scale: 2 }).default('0'),
  currency: varchar('currency', { length: 3 }).default('NAD'),
  
  cnpFraudCount: integer('cnp_fraud_count').default(0),
  phishingCount: integer('phishing_count').default(0),
  simSwapCount: integer('sim_swap_count').default(0),
  phoneScamCount: integer('phone_scam_count').default(0),
  counterfeitCount: integer('counterfeit_count').default(0),
  
  truePositives: integer('true_positives').default(0),
  falsePositives: integer('false_positives').default(0),
  falseNegatives: integer('false_negatives').default(0),
  accuracyRate: decimal('accuracy_rate', { precision: 5, scale: 2 }),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_fraud_statistics_tenant').on(table.tenantId),
  periodIdx: index('idx_fraud_statistics_period').on(table.periodType, table.periodStart, table.periodEnd),
}));

export type FraudRiskProfile = typeof fraudRiskProfiles.$inferSelect;
export type NewFraudRiskProfile = typeof fraudRiskProfiles.$inferInsert;
export type FraudDeviceFingerprint = typeof fraudDeviceFingerprints.$inferSelect;
export type NewFraudDeviceFingerprint = typeof fraudDeviceFingerprints.$inferInsert;
export type FraudAlert = typeof fraudAlerts.$inferSelect;
export type NewFraudAlert = typeof fraudAlerts.$inferInsert;
export type FraudDetectionRule = typeof fraudDetectionRules.$inferSelect;
export type NewFraudDetectionRule = typeof fraudDetectionRules.$inferInsert;
export type FraudCase = typeof fraudCases.$inferSelect;
export type NewFraudCase = typeof fraudCases.$inferInsert;
export type FraudStatistics = typeof fraudStatistics.$inferSelect;
export type NewFraudStatistics = typeof fraudStatistics.$inferInsert;

// ============================================================================
// KYC COMPLIANCE (Bank of Namibia PSDs)
// ============================================================================

export const kycTierEnum = pgEnum('kyc_tier', [
  'lite_kyc_individual',
  'lite_kyc_business',
  'full_kyc_individual',
  'full_kyc_business',
  'none',
]);

export const kycStatusEnum = pgEnum('kyc_status', [
  'pending',
  'in_review',
  'approved',
  'rejected',
  'expired',
  'suspended',
]);

export const kycDocumentTypeEnum = pgEnum('kyc_document_type', [
  'national_id',
  'passport',
  'drivers_license',
  'proof_of_address',
  'business_registration',
  'tax_certificate',
  'bank_statement',
  'other',
]);

export const transactionLimitTypeEnum = pgEnum('transaction_limit_type', [
  'daily',
  'monthly',
  'per_transaction',
]);

export const kycProfiles = pgTable('kyc_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'cascade' }).notNull(),
  
  kycTier: kycTierEnum('kyc_tier').default('none'),
  kycStatus: kycStatusEnum('kyc_status').default('pending'),
  
  isBusiness: boolean('is_business').default(false),
  businessName: varchar('business_name', { length: 255 }),
  businessRegistrationNumber: varchar('business_registration_number', { length: 100 }),
  businessTaxNumber: varchar('business_tax_number', { length: 100 }),
  
  idNumber: varchar('id_number', { length: 100 }),
  idType: varchar('id_type', { length: 50 }),
  idExpiryDate: date('id_expiry_date'),
  passportNumber: varchar('passport_number', { length: 100 }),
  passportExpiryDate: date('passport_expiry_date'),
  
  proofOfAddressVerified: boolean('proof_of_address_verified').default(false),
  addressVerificationDate: timestamp('address_verification_date', { withTimezone: true }),
  
  kycSubmittedAt: timestamp('kyc_submitted_at', { withTimezone: true }),
  kycApprovedAt: timestamp('kyc_approved_at', { withTimezone: true }),
  kycExpiresAt: timestamp('kyc_expires_at', { withTimezone: true }),
  kycReviewedBy: uuid('kyc_reviewed_by').references(() => users.id),
  
  rejectionReason: text('rejection_reason'),
  suspensionReason: text('suspension_reason'),
  
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantGuestUnique: uniqueIndex('kyc_profiles_tenant_guest_unique').on(table.tenantId, table.guestId),
  tenantIdx: index('idx_kyc_profiles_tenant_id').on(table.tenantId),
  guestIdx: index('idx_kyc_profiles_guest_id').on(table.guestId),
  tierIdx: index('idx_kyc_profiles_kyc_tier').on(table.kycTier),
  statusIdx: index('idx_kyc_profiles_kyc_status').on(table.kycStatus),
}));

export const kycDocuments = pgTable('kyc_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  kycProfileId: uuid('kyc_profile_id').references(() => kycProfiles.id, { onDelete: 'cascade' }).notNull(),
  
  documentType: kycDocumentTypeEnum('document_type').notNull(),
  documentNumber: varchar('document_number', { length: 100 }),
  documentName: varchar('document_name', { length: 255 }).notNull(),
  
  fileUrl: text('file_url').notNull(),
  fileType: varchar('file_type', { length: 50 }),
  fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }),
  
  isVerified: boolean('is_verified').default(false),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  verifiedBy: uuid('verified_by').references(() => users.id),
  verificationNotes: text('verification_notes'),
  
  expiresAt: date('expires_at'),
  
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  profileIdx: index('idx_kyc_documents_kyc_profile_id').on(table.kycProfileId),
  typeIdx: index('idx_kyc_documents_document_type').on(table.documentType),
  verifiedIdx: index('idx_kyc_documents_is_verified').on(table.isVerified),
}));

export const transactionLimits = pgTable('transaction_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  
  kycTier: kycTierEnum('kyc_tier').notNull(),
  limitType: transactionLimitTypeEnum('limit_type').notNull(),
  limitAmount: decimal('limit_amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('NAD'),
  
  effectiveFrom: date('effective_from').notNull().default(sql`CURRENT_DATE`),
  effectiveTo: date('effective_to'),
  
  isActive: boolean('is_active').default(true),
  description: text('description'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantTierLimitUnique: uniqueIndex('transaction_limits_tenant_tier_limit_unique').on(
    table.tenantId, 
    table.kycTier, 
    table.limitType, 
    table.effectiveFrom
  ),
  tenantIdx: index('idx_transaction_limits_tenant_id').on(table.tenantId),
  tierIdx: index('idx_transaction_limits_kyc_tier').on(table.kycTier),
  activeIdx: index('idx_transaction_limits_is_active').on(table.isActive),
}));

export const dailyTransactionTracking = pgTable('daily_transaction_tracking', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'cascade' }).notNull(),
  
  trackingDate: date('tracking_date').notNull().default(sql`CURRENT_DATE`),
  transactionCount: integer('transaction_count').default(0),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).default('0'),
  currency: varchar('currency', { length: 3 }).default('NAD'),
  
  dailyLimit: decimal('daily_limit', { precision: 10, scale: 2 }),
  limitExceeded: boolean('limit_exceeded').default(false),
  limitExceededAt: timestamp('limit_exceeded_at', { withTimezone: true }),
  
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantGuestDateUnique: uniqueIndex('daily_tracking_tenant_guest_date_unique').on(
    table.tenantId, 
    table.guestId, 
    table.trackingDate
  ),
  tenantIdx: index('idx_daily_tracking_tenant_id').on(table.tenantId),
  guestIdx: index('idx_daily_tracking_guest_id').on(table.guestId),
  dateIdx: index('idx_daily_tracking_date').on(table.trackingDate),
  exceededIdx: index('idx_daily_tracking_limit_exceeded').on(table.limitExceeded),
}));

export const monthlyBalanceTracking = pgTable('monthly_balance_tracking', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'cascade' }).notNull(),
  
  trackingMonth: varchar('tracking_month', { length: 7 }).notNull(),
  currentBalance: decimal('current_balance', { precision: 10, scale: 2 }).default('0'),
  peakBalance: decimal('peak_balance', { precision: 10, scale: 2 }).default('0'),
  currency: varchar('currency', { length: 3 }).default('NAD'),
  
  monthlyBalanceLimit: decimal('monthly_balance_limit', { precision: 10, scale: 2 }),
  limitExceeded: boolean('limit_exceeded').default(false),
  limitExceededAt: timestamp('limit_exceeded_at', { withTimezone: true }),
  
  totalCredits: decimal('total_credits', { precision: 10, scale: 2 }).default('0'),
  totalDebits: decimal('total_debits', { precision: 10, scale: 2 }).default('0'),
  transactionCount: integer('transaction_count').default(0),
  
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantGuestMonthUnique: uniqueIndex('monthly_tracking_tenant_guest_month_unique').on(
    table.tenantId, 
    table.guestId, 
    table.trackingMonth
  ),
  tenantIdx: index('idx_monthly_tracking_tenant_id').on(table.tenantId),
  guestIdx: index('idx_monthly_tracking_guest_id').on(table.guestId),
  monthIdx: index('idx_monthly_tracking_month').on(table.trackingMonth),
  exceededIdx: index('idx_monthly_tracking_limit_exceeded').on(table.limitExceeded),
}));

export const kycUpgradePrompts = pgTable('kyc_upgrade_prompts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'cascade' }).notNull(),
  
  currentKycTier: kycTierEnum('current_kyc_tier').notNull(),
  suggestedKycTier: kycTierEnum('suggested_kyc_tier').notNull(),
  
  triggerReason: varchar('trigger_reason', { length: 255 }).notNull(),
  triggerTransactionId: uuid('trigger_transaction_id').references(() => transactions.id),
  
  isShown: boolean('is_shown').default(false),
  shownAt: timestamp('shown_at', { withTimezone: true }),
  isDismissed: boolean('is_dismissed').default(false),
  dismissedAt: timestamp('dismissed_at', { withTimezone: true }),
  isAccepted: boolean('is_accepted').default(false),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_kyc_upgrade_prompts_tenant_id').on(table.tenantId),
  guestIdx: index('idx_kyc_upgrade_prompts_guest_id').on(table.guestId),
  shownIdx: index('idx_kyc_upgrade_prompts_is_shown').on(table.isShown),
  createdIdx: index('idx_kyc_upgrade_prompts_created_at').on(table.createdAt),
}));

// ============================================================================
// PSD COMPLIANCE TABLES (Bank of Namibia Payment System Determinations)
// ============================================================================

/**
 * Payment Security Audit Log
 * Compliance: PSD-12 Section 12.2 (2FA), PSD-4 Section 10 (CNP fraud)
 * Retention: 7 years
 */
export const paymentSecurityAudit = pgTable('payment_security_audit', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  
  // Transaction identification
  paymentId: varchar('payment_id', { length: 255 }).notNull(),
  paymentReference: varchar('payment_reference', { length: 255 }),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('NAD'),
  
  // Two-Factor Authentication (PSD-12 mandatory)
  twoFaMethod: varchar('two_fa_method', { length: 50 }),
  twoFaVerified: boolean('two_fa_verified').default(false).notNull(),
  twoFaAttempts: integer('two_fa_attempts').default(0),
  twoFaVerifiedAt: timestamp('two_fa_verified_at', { withTimezone: true }),
  
  // Device & Network Information (PSD-4 CNP fraud detection)
  deviceFingerprint: varchar('device_fingerprint', { length: 255 }),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  geoCountry: varchar('geo_country', { length: 2 }),
  geoCity: varchar('geo_city', { length: 100 }),
  
  // Fraud Detection Results
  fraudScore: decimal('fraud_score', { precision: 5, scale: 2 }),
  fraudChecksPassed: boolean('fraud_checks_passed').default(false),
  velocityCheckResult: varchar('velocity_check_result', { length: 50 }),
  geoCheckResult: varchar('geo_check_result', { length: 50 }),
  deviceCheckResult: varchar('device_check_result', { length: 50 }),
  
  // Card Validation
  cvvVerified: boolean('cvv_verified'),
  avsVerified: boolean('avs_verified'),
  threeDSecureVerified: boolean('three_d_secure_verified'),
  cardTokenized: boolean('card_tokenized').default(true),
  
  // Payment Gateway
  gatewayName: varchar('gateway_name', { length: 50 }),
  gatewayStatus: varchar('gateway_status', { length: 50 }),
  gatewayResponseCode: varchar('gateway_response_code', { length: 50 }),
  gatewayResponseTimeMs: integer('gateway_response_time_ms'),
  
  // Compliance Flags
  psd12Compliant: boolean('psd12_compliant').default(false).notNull(),
  psd4Compliant: boolean('psd4_compliant').default(false).notNull(),
  overallSecurityPassed: boolean('overall_security_passed').default(false).notNull(),
  riskLevel: varchar('risk_level', { length: 20 }),
  riskFactors: jsonb('risk_factors').default({}),
  blocked: boolean('blocked').default(false),
  blockReason: text('block_reason'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
}, (table) => ({
  tenantIdx: index('idx_payment_security_tenant').on(table.tenantId),
  bookingIdx: index('idx_payment_security_booking').on(table.bookingId),
  paymentIdx: index('idx_payment_security_payment_id').on(table.paymentId),
  createdIdx: index('idx_payment_security_created').on(table.createdAt),
  fraudScoreIdx: index('idx_payment_security_fraud_score').on(table.fraudScore),
  blockedIdx: index('idx_payment_security_blocked').on(table.blocked),
  complianceIdx: index('idx_payment_security_compliance').on(table.psd12Compliant, table.psd4Compliant),
}));

/**
 * Bank of Namibia Incident Reports
 * Compliance: PSD-12 Section 11.13-11.15
 * Requirements: 24-hour preliminary, 30-day impact assessment
 */
export const bonIncidentReports = pgTable('bon_incident_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  incidentId: uuid('incident_id').references(() => cybersecurityIncidents.id, { onDelete: 'cascade' }).notNull(),
  
  reportType: varchar('report_type', { length: 50 }).notNull(),
  incidentCategory: varchar('incident_category', { length: 100 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull(),
  
  submissionDate: timestamp('submission_date', { withTimezone: true }).notNull(),
  submissionMethod: varchar('submission_method', { length: 50 }).default('api'),
  submittedBy: uuid('submitted_by').references(() => users.id, { onDelete: 'set null' }),
  
  // Impact assessment
  financialLoss: decimal('financial_loss', { precision: 15, scale: 2 }).default('0'),
  dataLossRecords: integer('data_loss_records').default(0),
  availabilityLossMinutes: integer('availability_loss_minutes').default(0),
  affectedUsersCount: integer('affected_users_count').default(0),
  
  incidentSummary: text('incident_summary').notNull(),
  impactDetails: text('impact_details'),
  mitigationActions: text('mitigation_actions'),
  recoveryActions: text('recovery_actions'),
  lessonsLearned: text('lessons_learned'),
  
  // BoN response
  bonReference: varchar('bon_reference', { length: 255 }),
  bonAcknowledgedAt: timestamp('bon_acknowledged_at', { withTimezone: true }),
  bonStatus: varchar('bon_status', { length: 50 }).default('submitted'),
  bonComments: text('bon_comments'),
  bonFollowUpRequired: boolean('bon_follow_up_required').default(false),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_bon_reports_tenant').on(table.tenantId),
  incidentIdx: index('idx_bon_reports_incident').on(table.incidentId),
  submissionIdx: index('idx_bon_reports_submission_date').on(table.submissionDate),
  statusIdx: index('idx_bon_reports_bon_status').on(table.bonStatus),
  referenceIdx: index('idx_bon_reports_reference').on(table.bonReference),
}));

/**
 * Electronic Signatures
 * Compliance: ETA 2019 Section 20 (Advanced Electronic Signatures)
 * Legal Effect: Legally binding per ETA Section 17
 */
export const electronicSignatures = pgTable('electronic_signatures', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  
  // Document identification
  documentType: varchar('document_type', { length: 100 }).notNull(),
  documentId: uuid('document_id').notNull(),
  documentName: varchar('document_name', { length: 500 }),
  documentHash: varchar('document_hash', { length: 64 }).notNull(),
  
  // Signer details
  signerId: uuid('signer_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  signerName: varchar('signer_name', { length: 255 }).notNull(),
  signerEmail: varchar('signer_email', { length: 255 }).notNull(),
  signerPhone: varchar('signer_phone', { length: 50 }),
  signerIp: inet('signer_ip'),
  signerLocation: varchar('signer_location', { length: 255 }),
  
  // Signature details
  signatureMethod: varchar('signature_method', { length: 50 }).notNull(),
  signatureData: text('signature_data').notNull(),
  signatureTimestamp: timestamp('signature_timestamp', { withTimezone: true }).notNull(),
  signatureProvider: varchar('signature_provider', { length: 100 }),
  
  // Verification
  verified: boolean('verified').default(false).notNull(),
  verificationTimestamp: timestamp('verification_timestamp', { withTimezone: true }),
  verificationMethod: varchar('verification_method', { length: 50 }),
  certificateIssuer: varchar('certificate_issuer', { length: 255 }),
  certificateSerial: varchar('certificate_serial', { length: 255 }),
  certificateValidFrom: timestamp('certificate_valid_from', { withTimezone: true }),
  certificateValidUntil: timestamp('certificate_valid_until', { withTimezone: true }),
  
  // Legal compliance
  etaCompliant: boolean('eta_compliant').default(true).notNull(),
  legallyBinding: boolean('legally_binding').default(true).notNull(),
  signatureUniqueToSigner: boolean('signature_unique_to_signer').default(true),
  signerIdentifiable: boolean('signer_identifiable').default(true),
  underSignerControl: boolean('under_signer_control').default(true),
  detectsChanges: boolean('detects_changes').default(true),
  
  // Witness/Notary
  witnessed: boolean('witnessed').default(false),
  witnessName: varchar('witness_name', { length: 255 }),
  witnessEmail: varchar('witness_email', { length: 255 }),
  witnessTimestamp: timestamp('witness_timestamp', { withTimezone: true }),
  
  // Lifecycle
  status: varchar('status', { length: 50 }).default('active'),
  voidedAt: timestamp('voided_at', { withTimezone: true }),
  voidedBy: uuid('voided_by').references(() => users.id, { onDelete: 'set null' }),
  voidReason: text('void_reason'),
  
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_electronic_signatures_tenant').on(table.tenantId),
  signerIdx: index('idx_electronic_signatures_signer').on(table.signerId),
  documentIdx: index('idx_electronic_signatures_document').on(table.documentId),
  documentTypeIdx: index('idx_electronic_signatures_document_type').on(table.documentType),
  timestampIdx: index('idx_electronic_signatures_timestamp').on(table.signatureTimestamp),
  statusIdx: index('idx_electronic_signatures_status').on(table.status),
}));

/**
 * Payment Performance Metrics
 * Compliance: PSD-7 (Efficiency), PSD-12 (Uptime)
 * Targets: <3s processing, 99.9% success rate
 */
export const paymentPerformanceMetrics = pgTable('payment_performance_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  
  measuredAt: timestamp('measured_at', { withTimezone: true }).notNull().defaultNow(),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  
  // Volume metrics
  totalPaymentsAttempted: integer('total_payments_attempted').default(0),
  totalPaymentsSuccessful: integer('total_payments_successful').default(0),
  totalPaymentsFailed: integer('total_payments_failed').default(0),
  totalPaymentsBlocked: integer('total_payments_blocked').default(0),
  
  // Performance metrics
  avgProcessingTimeMs: integer('avg_processing_time_ms'),
  p50ProcessingTimeMs: integer('p50_processing_time_ms'),
  p95ProcessingTimeMs: integer('p95_processing_time_ms'),
  p99ProcessingTimeMs: integer('p99_processing_time_ms'),
  maxProcessingTimeMs: integer('max_processing_time_ms'),
  
  // Reliability metrics
  successRate: decimal('success_rate', { precision: 5, scale: 2 }),
  failureRate: decimal('failure_rate', { precision: 5, scale: 2 }),
  timeoutCount: integer('timeout_count').default(0),
  
  // Security metrics
  twoFaSuccessRate: decimal('two_fa_success_rate', { precision: 5, scale: 2 }),
  fraudBlockedCount: integer('fraud_blocked_count').default(0),
  fraudBlockedAmount: decimal('fraud_blocked_amount', { precision: 15, scale: 2 }).default('0'),
  
  // Financial metrics
  totalAmountProcessed: decimal('total_amount_processed', { precision: 15, scale: 2 }).default('0'),
  totalAmountBlocked: decimal('total_amount_blocked', { precision: 15, scale: 2 }).default('0'),
  averageTransactionAmount: decimal('average_transaction_amount', { precision: 12, scale: 2 }),
  
  // Gateway metrics
  gatewayName: varchar('gateway_name', { length: 50 }),
  gatewayUptimePercent: decimal('gateway_uptime_percent', { precision: 5, scale: 2 }),
  gatewaySuccessRate: decimal('gateway_success_rate', { precision: 5, scale: 2 }),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_payment_metrics_tenant').on(table.tenantId),
  measuredIdx: index('idx_payment_metrics_measured').on(table.measuredAt),
  gatewayIdx: index('idx_payment_metrics_gateway').on(table.gatewayName),
}));

/**
 * Record Retention Audit
 * Compliance: ETA 2019 Section 24
 * Retention: 7y (bookings/payments), 3y (communications)
 */
export const recordRetentionAudit = pgTable('record_retention_audit', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  
  recordType: varchar('record_type', { length: 100 }).notNull(),
  recordId: uuid('record_id').notNull(),
  recordCreatedAt: timestamp('record_created_at', { withTimezone: true }).notNull(),
  
  retentionPeriodYears: integer('retention_period_years').notNull(),
  retentionPolicyReason: varchar('retention_policy_reason', { length: 255 }).notNull(),
  retentionExpiresAt: timestamp('retention_expires_at', { withTimezone: true }).notNull(),
  
  status: varchar('status', { length: 50 }).default('active').notNull(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  archivedLocation: text('archived_location'),
  archivedBy: uuid('archived_by').references(() => users.id, { onDelete: 'set null' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletionApprovedBy: uuid('deletion_approved_by').references(() => users.id, { onDelete: 'set null' }),
  deletionApprovalReason: text('deletion_approval_reason'),
  
  etaRetentionCompliant: boolean('eta_retention_compliant').default(true).notNull(),
  taxRetentionCompliant: boolean('tax_retention_compliant').default(true).notNull(),
  
  recordSizeBytes: bigint('record_size_bytes', { mode: 'number' }),
  recordChecksum: varchar('record_checksum', { length: 64 }),
  metadata: jsonb('metadata').default({}),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_retention_tenant').on(table.tenantId),
  recordTypeIdx: index('idx_retention_record_type').on(table.recordType),
  statusIdx: index('idx_retention_status').on(table.status),
  expiresIdx: index('idx_retention_expires').on(table.retentionExpiresAt),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type KYCProfile = typeof kycProfiles.$inferSelect;
export type NewKYCProfile = typeof kycProfiles.$inferInsert;
export type KYCDocument = typeof kycDocuments.$inferSelect;
export type NewKYCDocument = typeof kycDocuments.$inferInsert;
export type TransactionLimit = typeof transactionLimits.$inferSelect;
export type NewTransactionLimit = typeof transactionLimits.$inferInsert;
export type DailyTransactionTracking = typeof dailyTransactionTracking.$inferSelect;
export type NewDailyTransactionTracking = typeof dailyTransactionTracking.$inferInsert;
export type MonthlyBalanceTracking = typeof monthlyBalanceTracking.$inferSelect;
export type NewMonthlyBalanceTracking = typeof monthlyBalanceTracking.$inferInsert;
export type KYCUpgradePrompt = typeof kycUpgradePrompts.$inferSelect;
export type NewKYCUpgradePrompt = typeof kycUpgradePrompts.$inferInsert;

// PSD Compliance Types
export type PaymentSecurityAudit = typeof paymentSecurityAudit.$inferSelect;
export type NewPaymentSecurityAudit = typeof paymentSecurityAudit.$inferInsert;
export type BonIncidentReport = typeof bonIncidentReports.$inferSelect;
export type NewBonIncidentReport = typeof bonIncidentReports.$inferInsert;
export type ElectronicSignature = typeof electronicSignatures.$inferSelect;
export type NewElectronicSignature = typeof electronicSignatures.$inferInsert;
export type PaymentPerformanceMetrics = typeof paymentPerformanceMetrics.$inferSelect;
export type NewPaymentPerformanceMetrics = typeof paymentPerformanceMetrics.$inferInsert;
export type RecordRetentionAudit = typeof recordRetentionAudit.$inferSelect;
export type NewRecordRetentionAudit = typeof recordRetentionAudit.$inferInsert;
