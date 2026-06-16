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

/** For UI: Object.values(TenantType) for select options */
export const TenantType = {
  HUB: 'hub',
  PARTNER: 'partner',
} as const;

export type TenantTypeValue = typeof TenantType[keyof typeof TenantType];

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

export const bookingChargeTypeEnum = pgEnum('booking_charge_type', [
  'room',
  'fnb',
  'tax',
  'adjustment',
  'payment',
]);

export const bookingChargeStatusEnum = pgEnum('booking_charge_status', [
  'open',
  'settled',
  'refunded',
  'voided',
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

export const housekeepingTaskStatusEnum = pgEnum('housekeeping_task_status', [
  'dirty',
  'cleaning',
  'inspecting',
  'clean',
]);

export const housekeepingTaskPriorityEnum = pgEnum('housekeeping_task_priority', [
  'low',
  'normal',
  'high',
  'urgent',
]);

export const guestServiceRequestTypeEnum = pgEnum('guest_service_request_type', [
  'housekeeping',
  'maintenance',
  'amenity',
  'other',
]);

export const guestServiceRequestStatusEnum = pgEnum('guest_service_request_status', [
  'open',
  'acknowledged',
  'in_progress',
  'resolved',
  'cancelled',
]);

export const documentTypeEnum = pgEnum('document_type_enum', [
  'quotation',
  'invoice',
  'receipt',
  'payment_notification',
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
  notificationPreferences: jsonb('notification_preferences')
    .notNull()
    .default(sql`'{}'::jsonb`),
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
 * Maps WhatsApp provider credentials (Meta Cloud API or OpenWA session) to a tenant.
 * Used by /api/webhooks/whatsapp and /api/webhooks/openwa for Sofia routing.
 */
export const tenantWhatsappSettings = pgTable('tenant_whatsapp_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id, { onDelete: 'cascade' })
    .notNull(),
  /** meta | openwa — one active row per provider per tenant */
  provider: varchar('provider', { length: 16 }).notNull().default('meta'),
  /** Meta Cloud API phone_number_id (required when provider = meta) */
  phoneNumberId: varchar('phone_number_id', { length: 64 }),
  /** OpenWA session name/id (required when provider = openwa) */
  openwaSessionId: varchar('openwa_session_id', { length: 128 }),
  openwaWebhookSecret: text('openwa_webhook_secret'),
  openwaApiBaseUrl: text('openwa_api_base_url'),
  isActive: boolean('is_active').notNull().default(true),
  defaultPropertyId: uuid('default_property_id').references(() => properties.id, {
    onDelete: 'set null',
  }),
  /** Optional; falls back to WHATSAPP_ACCESS_TOKEN env when null (Meta only) */
  accessToken: text('access_token'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_tenant_whatsapp_settings_tenant_id').on(table.tenantId),
  providerIdx: index('idx_tenant_whatsapp_provider').on(table.provider),
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
  inventoryKind: varchar('inventory_kind', { length: 32 }).default('guest_room').notNull(),
  pricingMetadata: jsonb('pricing_metadata').default({}).notNull(),
  smokingAllowed: boolean('smoking_allowed').default(false),
  petFriendly: boolean('pet_friendly').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  propertyIdx: index('idx_rooms_property_id').on(table.propertyId),
  statusIdx: index('idx_rooms_status').on(table.status),
  inventoryKindIdx: index('idx_rooms_inventory_kind').on(table.inventoryKind),
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

/** Daily room inventory buckets (OSS W6 / innkeeper availability ledger). */
export const roomAvailabilityLedger = pgTable('room_availability_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'cascade' }).notNull(),
  businessDate: date('business_date').notNull(),
  sold: integer('sold').default(0).notNull(),
  blocked: integer('blocked').default(0).notNull(),
  outOfOrder: boolean('out_of_order').default(false).notNull(),
  stopSell: boolean('stop_sell').default(false).notNull(),
  cta: boolean('cta').default(false).notNull(),
  ctd: boolean('ctd').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  propertyDateIdx: index('idx_room_availability_ledger_property_date').on(table.propertyId, table.businessDate),
  roomDateIdx: index('idx_room_availability_ledger_room_date').on(table.roomId, table.businessDate),
  tenantIdx: index('idx_room_availability_ledger_tenant_id').on(table.tenantId),
  uniqueDay: uniqueIndex('room_availability_ledger_unique_day').on(
    table.propertyId,
    table.roomId,
    table.businessDate,
  ),
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
  introducerId: uuid('introducer_id').references(() => introducers.id, { onDelete: 'set null' }),
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
  depositPercent: decimal('deposit_percent', { precision: 5, scale: 2 }).default('30'),
  commissionAmount: decimal('commission_amount', { precision: 12, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('NAD'),
  paymentStatus: varchar('payment_status', { length: 50 }).default('pending'),
  paymentMethod: varchar('payment_method', { length: 50 }).default('card'),
  amountTendered: decimal('amount_tendered', { precision: 10, scale: 2 }),
  changeGiven: decimal('change_given', { precision: 10, scale: 2 }),
  receiptNumber: varchar('receipt_number', { length: 100 }),
  specialRequests: text('special_requests'),
  cancellationPolicy: varchar('cancellation_policy', { length: 100 }),
  aiProcessed: boolean('ai_processed').default(false),
  aiConfidenceScore: decimal('ai_confidence_score', { precision: 3, scale: 2 }),
  folioClosedAt: timestamp('folio_closed_at', { withTimezone: true }),
  bookingKind: varchar('booking_kind', { length: 32 }).default('accommodation'),
  pricingDetails: jsonb('pricing_details').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_bookings_tenant_id').on(table.tenantId),
  propertyIdx: index('idx_bookings_property_id').on(table.propertyId),
  guestIdx: index('idx_bookings_guest_id').on(table.guestId),
  introducerIdx: index('idx_bookings_introducer_id').on(table.introducerId),
  statusIdx: index('idx_bookings_status').on(table.status),
  checkInIdx: index('idx_bookings_check_in_date').on(table.checkInDate),
  paymentMethodIdx: index('idx_bookings_payment_method').on(table.paymentMethod),
  bookingKindIdx: index('idx_bookings_booking_kind').on(table.bookingKind),
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

export const housekeepingTasks = pgTable('housekeeping_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'cascade' }).notNull(),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  assignedTo: uuid('assigned_to').references(() => staff.id, { onDelete: 'set null' }),
  status: housekeepingTaskStatusEnum('status').default('dirty').notNull(),
  priority: housekeepingTaskPriorityEnum('priority').default('normal').notNull(),
  taskType: varchar('task_type', { length: 100 }).default('checkout_cleaning'),
  notes: text('notes'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  inspectionNotes: text('inspection_notes'),
  photos: text('photos').array().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
}, (table) => ({
  propertyIdx: index('idx_housekeeping_tasks_property_id').on(table.propertyId),
  roomIdx: index('idx_housekeeping_tasks_room_id').on(table.roomId),
  assignedToIdx: index('idx_housekeeping_tasks_assigned_to').on(table.assignedTo),
  statusIdx: index('idx_housekeeping_tasks_status').on(table.status),
  bookingIdx: index('idx_housekeeping_tasks_booking_id').on(table.bookingId),
  createdAtIdx: index('idx_housekeeping_tasks_created_at').on(table.createdAt),
}));

/**
 * Guest-raised service & maintenance requests (Phase 8 — Guest Command Centre).
 * Housekeeping/maintenance requests spawn a linked housekeeping_tasks row so they
 * surface on the staff board. See migration 0054_guest_service_requests.sql.
 */
export const guestServiceRequests = pgTable('guest_service_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'cascade' }).notNull(),
  roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'set null' }),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'set null' }),
  requestType: guestServiceRequestTypeEnum('request_type').notNull(),
  category: varchar('category', { length: 80 }),
  description: text('description'),
  photos: text('photos').array().default([]),
  status: guestServiceRequestStatusEnum('status').default('open').notNull(),
  priority: housekeepingTaskPriorityEnum('priority').default('normal').notNull(),
  housekeepingTaskId: uuid('housekeeping_task_id').references(() => housekeepingTasks.id, { onDelete: 'set null' }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolvedBy: uuid('resolved_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
}, (table) => ({
  tenantIdx: index('idx_guest_service_requests_tenant_id').on(table.tenantId),
  propertyIdx: index('idx_guest_service_requests_property_id').on(table.propertyId),
  bookingIdx: index('idx_guest_service_requests_booking_id').on(table.bookingId),
  statusIdx: index('idx_guest_service_requests_status').on(table.status),
  createdAtIdx: index('idx_guest_service_requests_created_at').on(table.createdAt),
}));

/** Per-stay folio lines (room rate, F&B, tax, payments) — not the same as guest_profiles (loyalty). */
export const bookingCharges = pgTable('booking_charges', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'cascade' }).notNull(),
  chargeType: bookingChargeTypeEnum('charge_type').notNull(),
  description: text('description').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('NAD'),
  status: bookingChargeStatusEnum('status').notNull().default('open'),
  referenceId: uuid('reference_id'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  settledAt: timestamp('settled_at', { withTimezone: true }),
}, (table) => ({
  bookingIdx: index('idx_booking_charges_booking_id').on(table.bookingId),
  statusIdx: index('idx_booking_charges_status').on(table.status),
  typeIdx: index('idx_booking_charges_type').on(table.chargeType),
  tenantIdx: index('idx_booking_charges_tenant_id').on(table.tenantId),
}));

export type BookingCharge = typeof bookingCharges.$inferSelect;
export type NewBookingCharge = typeof bookingCharges.$inferInsert;

/** Night audit run log — one row per property + business date (OSS W5 / pura-pms). */
export const nightAuditRuns = pgTable('night_audit_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  businessDate: date('business_date').notNull(),
  result: jsonb('result').notNull().default({}),
  status: varchar('status', { length: 50 }).notNull().default('completed'),
  runBy: uuid('run_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('idx_night_audit_runs_tenant_id').on(table.tenantId),
  propertyIdx: index('idx_night_audit_runs_property_id').on(table.propertyId),
  businessDateIdx: index('idx_night_audit_runs_business_date').on(table.businessDate),
  propertyDateUnique: uniqueIndex('night_audit_runs_property_date_unique').on(
    table.propertyId,
    table.businessDate
  ),
}));

export type NightAuditRun = typeof nightAuditRuns.$inferSelect;
export type NewNightAuditRun = typeof nightAuditRuns.$inferInsert;

/** GL period close locks — one active lock per property (OSS W4 / dubbl periodLock). */
export const accountingPeriodLocks = pgTable('accounting_period_locks', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  lockDate: date('lock_date').notNull(),
  lockedBy: uuid('locked_by').references(() => users.id, { onDelete: 'set null' }),
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantPropertyIdx: index('idx_accounting_period_locks_tenant_property').on(
    table.tenantId,
    table.propertyId
  ),
  lockDateIdx: index('idx_accounting_period_locks_lock_date').on(table.lockDate),
}));

export type AccountingPeriodLock = typeof accountingPeriodLocks.$inferSelect;
export type NewAccountingPeriodLock = typeof accountingPeriodLocks.$inferInsert;

export const cashReconciliations = pgTable('cash_reconciliations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }),
  reconciliationDate: date('reconciliation_date').notNull(),
  shift: varchar('shift', { length: 20 }),
  expectedAmount: decimal('expected_amount', { precision: 12, scale: 2 }).notNull(),
  actualAmount: decimal('actual_amount', { precision: 12, scale: 2 }).notNull(),
  discrepancy: decimal('discrepancy', { precision: 12, scale: 2 }),
  notes: text('notes'),
  staffId: uuid('staff_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tenantDateIdx: index('idx_cash_reconciliations_tenant_date').on(table.tenantId, table.reconciliationDate),
  propertyDateIdx: index('idx_cash_reconciliations_property_date').on(table.propertyId, table.reconciliationDate),
  staffIdx: index('idx_cash_reconciliations_staff').on(table.staffId),
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

/**
 * Payment disputes / chargebacks / reversals.
 * A gateway reversal or cardholder chargeback that reverses a previously-settled payment.
 * Opening a dispute reverses the folio (reversing transaction + booking charge) so the ledger
 * never silently desyncs. PSD-4 dispute participation (merchant side).
 */
export const paymentDisputes = pgTable('payment_disputes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  transactionId: uuid('transaction_id').references(() => transactions.id, { onDelete: 'set null' }),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'set null' }),
  merchantReference: varchar('merchant_reference', { length: 38 }),
  gatewayTransactionId: varchar('gateway_transaction_id', { length: 255 }),
  paymentGateway: varchar('payment_gateway', { length: 50 }).default('adumo_virtual'),
  /** chargeback | refund | reversal */
  kind: varchar('kind', { length: 20 }).notNull().default('chargeback'),
  /** opened | under_review | won | lost | refunded | reversed */
  status: varchar('status', { length: 20 }).notNull().default('opened'),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('NAD'),
  reasonCode: varchar('reason_code', { length: 50 }),
  reason: text('reason'),
  openedAt: timestamp('opened_at', { withTimezone: true }).defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolvedBy: uuid('resolved_by').references(() => users.id, { onDelete: 'set null' }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_payment_disputes_tenant_id').on(table.tenantId),
  bookingIdx: index('idx_payment_disputes_booking_id').on(table.bookingId),
  statusIdx: index('idx_payment_disputes_status').on(table.status),
  gatewayTxnIdx: index('idx_payment_disputes_gateway_txn').on(table.gatewayTransactionId),
}));

/** Audit log for on-demand guest financial PDFs (quotation, invoice, receipt, payment notification). */
export const generatedDocuments = pgTable('generated_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'cascade' }).notNull(),
  documentType: documentTypeEnum('document_type').notNull(),
  referenceNumber: text('reference_number').notNull().unique(),
  generatedBy: uuid('generated_by').references(() => users.id).notNull(),
  generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
  metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
  fileUrl: text('file_url'),
  checksum: text('checksum').notNull(),
}, (table) => ({
  bookingIdx: index('idx_generated_documents_booking').on(table.bookingId),
  tenantIdx: index('idx_generated_documents_tenant').on(table.tenantId),
  typeIdx: index('idx_generated_documents_type').on(table.documentType),
  referenceIdx: index('idx_generated_documents_reference').on(table.referenceNumber),
  generatedAtIdx: index('idx_generated_documents_generated_at').on(table.generatedAt),
}));

export type GeneratedDocument = typeof generatedDocuments.$inferSelect;
export type NewGeneratedDocument = typeof generatedDocuments.$inferInsert;
export type DocumentType = (typeof documentTypeEnum.enumValues)[number];

/** Adumo Virtual redirect sessions (merchant ref → booking or dining reservation) */
export const paymentSessions = pgTable('payment_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id, { onDelete: 'cascade' })
    .notNull(),
  merchantReference: varchar('merchant_reference', { length: 255 }).notNull().unique(),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'cascade' }),
  /** Set when purpose is dining_deposit (FK enforced in migration 0019) */
  diningReservationId: uuid('dining_reservation_id'),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  purpose: varchar('purpose', { length: 50 }).notNull(),
  beneficiary: varchar('beneficiary', { length: 20 }).default('property').notNull(),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  sessionData: jsonb('session_data'),
  adumoTransactionIndex: varchar('adumo_transaction_index', { length: 255 }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  bookingIdx: index('idx_payment_sessions_booking_id').on(table.bookingId),
  diningIdx: index('idx_payment_sessions_dining_reservation_id').on(table.diningReservationId),
  expiresIdx: index('idx_payment_sessions_expires_at').on(table.expiresAt),
}));

/** Transactional outbox for payment side effects (receipt email, notifications) */
export const paymentOutboxEvents = pgTable('payment_outbox_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id, { onDelete: 'cascade' })
    .notNull(),
  idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull().unique(),
  aggregateType: varchar('aggregate_type', { length: 50 }).default('payment_session').notNull(),
  aggregateId: uuid('aggregate_id').notNull(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  payload: jsonb('payload').notNull().default({}),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  maxAttempts: integer('max_attempts').default(10).notNull(),
  lastError: text('last_error'),
  nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  pendingDispatchIdx: index('idx_payment_outbox_pending_dispatch').on(
    table.status,
    table.nextAttemptAt,
    table.createdAt,
  ),
  aggregateIdx: index('idx_payment_outbox_aggregate').on(table.aggregateType, table.aggregateId),
  tenantIdx: index('idx_payment_outbox_tenant').on(table.tenantId),
}));

/** Property / platform bank profiles for guest settlement vs Buffr invoicing */
export const settlementAccounts = pgTable('settlement_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  party: varchar('party', { length: 20 }).notNull(),
  profileKey: varchar('profile_key', { length: 100 }).notNull().unique(),
  legalName: varchar('legal_name', { length: 255 }).notNull(),
  bankName: varchar('bank_name', { length: 255 }).notNull(),
  accountNumber: varchar('account_number', { length: 50 }).notNull(),
  branchCode: varchar('branch_code', { length: 20 }),
  swiftCode: varchar('swift_code', { length: 20 }),
  accountType: varchar('account_type', { length: 50 }),
  registrationRef: varchar('registration_ref', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_settlement_accounts_tenant').on(table.tenantId),
  partyIdx: index('idx_settlement_accounts_party').on(table.party),
}));

export const platformFeeSchedules = pgTable('platform_fee_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  cardProcessingPercent: decimal('card_processing_percent', { precision: 6, scale: 3 })
    .default('2.500')
    .notNull(),
  cardProcessingFixedNad: decimal('card_processing_fixed_nad', { precision: 10, scale: 2 })
    .default('0')
    .notNull(),
  monthlySubscriptionNad: decimal('monthly_subscription_nad', { precision: 10, scale: 2 })
    .default('0')
    .notNull(),
  effectiveFrom: date('effective_from').defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const platformInvoices = pgTable('platform_invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id, { onDelete: 'cascade' })
    .notNull(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  status: varchar('status', { length: 20 }).default('draft').notNull(),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).default('0').notNull(),
  vatRatePercent: decimal('vat_rate_percent', { precision: 5, scale: 2 }).default('0'),
  vatAmount: decimal('vat_amount', { precision: 12, scale: 2 }).default('0'),
  total: decimal('total', { precision: 12, scale: 2 }).default('0').notNull(),
  currency: varchar('currency', { length: 3 }).default('NAD').notNull(),
  supplierVatNumber: varchar('supplier_vat_number', { length: 50 }),
  documentType: varchar('document_type', { length: 30 }).default('invoice'),
  issuedAt: timestamp('issued_at', { withTimezone: true }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  paymentReference: varchar('payment_reference', { length: 255 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tenantStatusIdx: index('idx_platform_invoices_tenant_status').on(table.tenantId, table.status),
  tenantInvoiceUnique: uniqueIndex('platform_invoices_tenant_number').on(
    table.tenantId,
    table.invoiceNumber
  ),
}));

export const platformInvoiceLines = pgTable('platform_invoice_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id')
    .references(() => platformInvoices.id, { onDelete: 'cascade' })
    .notNull(),
  lineType: varchar('line_type', { length: 30 }).notNull(),
  description: text('description').notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).default('1').notNull(),
  unitAmount: decimal('unit_amount', { precision: 12, scale: 2 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  invoiceIdx: index('idx_platform_invoice_lines_invoice').on(table.invoiceId),
}));

export const platformFeeAccruals = pgTable('platform_fee_accruals', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id, { onDelete: 'cascade' })
    .notNull(),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  transactionId: uuid('transaction_id').references(() => transactions.id, { onDelete: 'set null' }),
  merchantReference: varchar('merchant_reference', { length: 255 }),
  gatewayTransactionId: varchar('gateway_transaction_id', { length: 255 }),
  purpose: varchar('purpose', { length: 50 }).notNull(),
  grossAmount: decimal('gross_amount', { precision: 12, scale: 2 }).notNull(),
  feeAmount: decimal('fee_amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('NAD').notNull(),
  periodMonth: varchar('period_month', { length: 7 }).notNull(),
  status: varchar('status', { length: 20 }).default('accrued').notNull(),
  invoiceId: uuid('invoice_id').references(() => platformInvoices.id, { onDelete: 'set null' }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tenantPeriodIdx: index('idx_platform_fee_accruals_tenant_period').on(
    table.tenantId,
    table.periodMonth,
    table.status
  ),
  invoiceIdx: index('idx_platform_fee_accruals_invoice').on(table.invoiceId),
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

/** Table reservations with deposit + booking code (Sofia / Enish-style flow) */
export const diningReservations = pgTable(
  'dining_reservations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    restaurantId: uuid('restaurant_id')
      .references(() => restaurants.id, { onDelete: 'cascade' })
      .notNull(),
    guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'set null' }),
    sessionId: varchar('session_id', { length: 255 }),
    partySize: integer('party_size').notNull(),
    reservationDate: varchar('reservation_date', { length: 10 }).notNull(),
    reservationTime: varchar('reservation_time', { length: 8 }).notNull(),
    depositCents: integer('deposit_cents').notNull(),
    currency: varchar('currency', { length: 3 }).default('NAD').notNull(),
    paymentSessionId: uuid('payment_session_id').references(() => paymentSessions.id, {
      onDelete: 'set null',
    }),
    bookingCode: varchar('booking_code', { length: 12 }).notNull(),
    otpHash: varchar('otp_hash', { length: 64 }),
    otpExpiresAt: timestamp('otp_expires_at', { withTimezone: true }),
    status: varchar('status', { length: 32 }).notNull().default('awaiting_deposit'),
    metadata: jsonb('metadata').default(sql`'{}'`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    tenantBookingCodeIdx: uniqueIndex('uq_dining_reservations_tenant_booking_code').on(
      table.tenantId,
      table.bookingCode
    ),
    guestIdx: index('idx_dining_reservations_guest').on(table.tenantId, table.guestId),
    sessionIdx: index('idx_dining_reservations_session').on(table.tenantId, table.sessionId),
  })
);

export type DiningReservation = typeof diningReservations.$inferSelect;
export type NewDiningReservation = typeof diningReservations.$inferInsert;

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
// F&B INVENTORY (stock control — one SKU per sellable menu line where linked)
// ============================================================================

export const inventoryItems = pgTable(
  'inventory_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }),
    restaurantId: uuid('restaurant_id').references(() => restaurants.id, { onDelete: 'cascade' }),
    sku: varchar('sku', { length: 64 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    unit: varchar('unit', { length: 32 }).default('each').notNull(),
    category: varchar('category', { length: 64 }),
    quantityOnHand: decimal('quantity_on_hand', { precision: 12, scale: 3 }).default('0').notNull(),
    reorderPoint: decimal('reorder_point', { precision: 12, scale: 3 }).default('12').notNull(),
    reorderQuantity: decimal('reorder_quantity', { precision: 12, scale: 3 }).default('24'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    tenantSkuIdx: uniqueIndex('idx_inventory_items_tenant_sku').on(table.tenantId, table.sku),
    restaurantIdx: index('idx_inventory_items_restaurant_id').on(table.restaurantId),
  }),
);

export const menuItemInventoryLinks = pgTable(
  'menu_item_inventory_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    menuItemId: uuid('menu_item_id')
      .references(() => cmsMenuItems.id, { onDelete: 'cascade' })
      .notNull(),
    inventoryItemId: uuid('inventory_item_id')
      .references(() => inventoryItems.id, { onDelete: 'cascade' })
      .notNull(),
    quantityPerSale: decimal('quantity_per_sale', { precision: 12, scale: 3 }).default('1').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    menuItemIdx: uniqueIndex('idx_menu_item_inventory_links_menu_item').on(table.menuItemId),
    inventoryIdx: index('idx_menu_item_inventory_links_inventory').on(table.inventoryItemId),
  }),
);

export const stockMovements = pgTable(
  'stock_movements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    inventoryItemId: uuid('inventory_item_id')
      .references(() => inventoryItems.id, { onDelete: 'cascade' })
      .notNull(),
    movementType: varchar('movement_type', { length: 32 }).notNull(),
    quantityDelta: decimal('quantity_delta', { precision: 12, scale: 3 }).notNull(),
    quantityAfter: decimal('quantity_after', { precision: 12, scale: 3 }).notNull(),
    referenceType: varchar('reference_type', { length: 64 }),
    referenceId: uuid('reference_id'),
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    inventoryIdx: index('idx_stock_movements_inventory_item_id').on(table.inventoryItemId),
    createdAtIdx: index('idx_stock_movements_created_at').on(table.createdAt),
  }),
);

export const stockAlerts = pgTable(
  'stock_alerts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    inventoryItemId: uuid('inventory_item_id')
      .references(() => inventoryItems.id, { onDelete: 'cascade' })
      .notNull(),
    alertType: varchar('alert_type', { length: 32 }).notNull(),
    status: varchar('status', { length: 32 }).default('open').notNull(),
    quantityAtAlert: decimal('quantity_at_alert', { precision: 12, scale: 3 }).notNull(),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
    acknowledgedBy: uuid('acknowledged_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    inventoryStatusIdx: index('idx_stock_alerts_inventory_status').on(table.inventoryItemId, table.status),
  }),
);

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type NewInventoryItem = typeof inventoryItems.$inferInsert;
export type MenuItemInventoryLink = typeof menuItemInventoryLinks.$inferSelect;
export type StockMovement = typeof stockMovements.$inferSelect;
export type StockAlert = typeof stockAlerts.$inferSelect;

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
// LOYALTY SYSTEM
// ============================================================================

export const loyaltyTransactions = pgTable('loyalty_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'cascade' }).notNull(),
  guestProfileId: uuid('guest_profile_id').references(() => guestProfiles.id, { onDelete: 'set null' }),
  transactionType: varchar('transaction_type', { length: 20 }).notNull(),
  pointsDelta: integer('points_delta').notNull(),
  pointsBefore: integer('points_before').default(0).notNull(),
  pointsAfter: integer('points_after').notNull(),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  rewardId: uuid('reward_id'),
  description: text('description').notNull(),
  staffUserId: uuid('staff_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantGuestIdx: index('idx_loyalty_tx_tenant_guest').on(table.tenantId, table.guestId),
  guestCreatedIdx: index('idx_loyalty_tx_guest_created').on(table.guestId, table.createdAt),
  typeCreatedIdx: index('idx_loyalty_tx_type_created').on(table.transactionType, table.createdAt),
}));

export const loyaltyRewards = pgTable('loyalty_rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  pointsCost: integer('points_cost').notNull(),
  valueNad: decimal('value_nad', { precision: 12, scale: 2 }),
  available: boolean('available').default(true).notNull(),
  maxRedemptionsPerGuest: integer('max_redemptions_per_guest'),
  validFrom: timestamp('valid_from', { withTimezone: true }),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  minTier: varchar('min_tier', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantAvailableIdx: index('idx_loyalty_rewards_tenant_available').on(table.tenantId, table.available),
}));

export const loyaltyRedemptions = pgTable('loyalty_redemptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'cascade' }).notNull(),
  rewardId: uuid('reward_id').references(() => loyaltyRewards.id, { onDelete: 'cascade' }).notNull(),
  transactionId: uuid('transaction_id').references(() => loyaltyTransactions.id, { onDelete: 'cascade' }).notNull(),
  pointsSpent: integer('points_spent').notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  fulfilledByUserId: uuid('fulfilled_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  fulfilledAt: timestamp('fulfilled_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  guestIdx: index('idx_loyalty_redemptions_guest').on(table.guestId, table.createdAt),
  statusIdx: index('idx_loyalty_redemptions_status').on(table.status, table.createdAt),
  tenantIdx: index('idx_loyalty_redemptions_tenant').on(table.tenantId, table.createdAt),
}));

export const loyaltyTiers = pgTable('loyalty_tiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  tierName: varchar('tier_name', { length: 50 }).notNull(),
  tierOrder: integer('tier_order').notNull(),
  pointsThreshold: integer('points_threshold').default(0).notNull(),
  earnRateMultiplier: decimal('earn_rate_multiplier', { precision: 3, scale: 2 }).default('1.00').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('idx_loyalty_tiers_tenant').on(table.tenantId, table.tierOrder),
}));

export const loyaltyTierBenefits = pgTable('loyalty_tier_benefits', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  tierId: uuid('tier_id').references(() => loyaltyTiers.id, { onDelete: 'cascade' }).notNull(),
  benefitType: varchar('benefit_type', { length: 50 }).notNull(),
  benefitName: varchar('benefit_name', { length: 255 }).notNull(),
  benefitDescription: text('benefit_description'),
  benefitValue: varchar('benefit_value', { length: 100 }),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tierIdx: index('idx_tier_benefits_tier').on(table.tierId, table.active),
  tenantIdx: index('idx_tier_benefits_tenant').on(table.tenantId, table.tierId),
}));

export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;
export type NewLoyaltyTransaction = typeof loyaltyTransactions.$inferInsert;
export type LoyaltyReward = typeof loyaltyRewards.$inferSelect;
export type NewLoyaltyReward = typeof loyaltyRewards.$inferInsert;
export type LoyaltyRedemption = typeof loyaltyRedemptions.$inferSelect;
export type NewLoyaltyRedemption = typeof loyaltyRedemptions.$inferInsert;
export type LoyaltyTier = typeof loyaltyTiers.$inferSelect;
export type NewLoyaltyTier = typeof loyaltyTiers.$inferInsert;
export type LoyaltyTierBenefit = typeof loyaltyTierBenefits.$inferSelect;
export type NewLoyaltyTierBenefit = typeof loyaltyTierBenefits.$inferInsert;

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
  tenantSessionIdx: index('idx_ai_conversations_tenant_session').on(
    table.tenantId,
    table.sessionId
  ),
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

export type AiConversation = typeof aiConversations.$inferSelect;
export type NewAiConversation = typeof aiConversations.$inferInsert;
export type AiMessage = typeof aiMessages.$inferSelect;
export type NewAiMessage = typeof aiMessages.$inferInsert;

/** Wave 7 — Sofia multi-stage pipeline + tool-graph run telemetry (best-effort). */
export const sofiaPipelineRuns = pgTable('sofia_pipeline_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: varchar('session_id', { length: 255 }).notNull(),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id, { onDelete: 'cascade' })
    .notNull(),
  stages: jsonb('stages').notNull().default(sql`'{}'`),
  totalMs: bigint('total_ms', { mode: 'number' }).notNull().default(0),
  status: varchar('status', { length: 50 }).notNull().default('completed'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  sessionIdx: index('idx_sofia_pipeline_runs_session_id').on(table.sessionId),
  tenantIdx: index('idx_sofia_pipeline_runs_tenant_id').on(table.tenantId),
  createdAtIdx: index('idx_sofia_pipeline_runs_created_at').on(table.createdAt),
}));

export type SofiaPipelineRun = typeof sofiaPipelineRuns.$inferSelect;
export type NewSofiaPipelineRun = typeof sofiaPipelineRuns.$inferInsert;

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

export const cmsPages = pgTable('cms_pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  title: varchar('title', { length: 500 }).notNull(),
  metaDescription: text('meta_description'),
  status: varchar('status', { length: 50 }).notNull().default('draft'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('idx_cms_pages_tenant_id').on(table.tenantId),
  slugIdx: index('idx_cms_pages_slug').on(table.slug),
  statusIdx: index('idx_cms_pages_status').on(table.status),
}));

export const cmsBlocks = pgTable('cms_blocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  pageId: uuid('page_id').notNull().references(() => cmsPages.id, { onDelete: 'cascade' }),
  blockType: varchar('block_type', { length: 100 }).notNull(),
  blockOrder: integer('block_order').notNull().default(0),
  content: jsonb('content').notNull().default(sql`'{}'`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pageIdx: index('idx_cms_blocks_page_id').on(table.pageId),
  orderIdx: index('idx_cms_blocks_order').on(table.pageId, table.blockOrder),
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
  previousHash: varchar('previous_hash', { length: 64 }),
  eventHash: varchar('event_hash', { length: 64 }),
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
export type RoomAvailabilityLedger = typeof roomAvailabilityLedger.$inferSelect;
export type NewRoomAvailabilityLedger = typeof roomAvailabilityLedger.$inferInsert;
export type NewRoom = typeof rooms.$inferInsert;

export type Guest = typeof guests.$inferSelect;
export type NewGuest = typeof guests.$inferInsert;

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;

export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;

export type GuestServiceRequest = typeof guestServiceRequests.$inferSelect;
export type NewGuestServiceRequest = typeof guestServiceRequests.$inferInsert;

export type CmsContent = typeof cmsContent.$inferSelect;
export type CmsMedia = typeof cmsMedia.$inferSelect;

export type Restaurant = typeof restaurants.$inferSelect;
export type NewRestaurant = typeof restaurants.$inferInsert;

export type PaymentSession = typeof paymentSessions.$inferSelect;
export type NewPaymentSession = typeof paymentSessions.$inferInsert;
export type PaymentOutboxEvent = typeof paymentOutboxEvents.$inferSelect;
export type NewPaymentOutboxEvent = typeof paymentOutboxEvents.$inferInsert;
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

/** Guest bank-app payment claims awaiting staff NamQR confirm (Option B). */
export const namqrPendingConfirmations = pgTable('namqr_pending_confirmations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id, { onDelete: 'cascade' })
    .notNull(),
  bookingId: uuid('booking_id')
    .references(() => bookings.id, { onDelete: 'cascade' })
    .notNull(),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'set null' }),
  qrReference: varchar('qr_reference', { length: 10 }),
  amountClaimed: decimal('amount_claimed', { precision: 12, scale: 2 }).notNull(),
  bankReference: varchar('bank_reference', { length: 64 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  submittedByUserId: uuid('submitted_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  reviewedByUserId: uuid('reviewed_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tenantStatusIdx: index('idx_namqr_pending_tenant_status').on(table.tenantId, table.status),
  bookingStatusIdx: index('idx_namqr_pending_booking_status').on(table.bookingId, table.status),
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
export type NamqrPendingConfirmation = typeof namqrPendingConfirmations.$inferSelect;
export type NewNamqrPendingConfirmation = typeof namqrPendingConfirmations.$inferInsert;

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

/** DORMANT (B1): Buffr PEP port — not populated; PEP screening out of Namibia OS scope. See AML_FICA_COMPLIANCE_PROGRAM.md §8. */
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

/** DORMANT (B1): companion to aml_pep_database — no API/UI; do not seed without counsel + data provider. */
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
// INTRODUCER PARTNERS
// ============================================================================

export const introducers = pgTable('introducers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }),
  
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).unique().notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }).default('10.00').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  showInPublicDirectory: boolean('show_in_public_directory').default(false).notNull(),
  
  bio: text('bio'),
  website: varchar('website', { length: 500 }),
  logoUrl: varchar('logo_url', { length: 500 }),
  
  totalBookings: integer('total_bookings').default(0).notNull(),
  totalCommissionEarned: decimal('total_commission_earned', { precision: 12, scale: 2 }).default('0.00').notNull(),
  
  metadata: jsonb('metadata').default({}),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_introducers_tenant').on(table.tenantId),
  codeIdx: uniqueIndex('idx_introducers_code').on(table.code),
  activeIdx: index('idx_introducers_active').on(table.isActive),
  publicIdx: index('idx_introducers_public').on(table.showInPublicDirectory),
}));

export const introducerRelations = relations(introducers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [introducers.tenantId],
    references: [tenants.id],
  }),
  property: one(properties, {
    fields: [introducers.propertyId],
    references: [properties.id],
  }),
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

// Cash Reconciliation Types
export type CashReconciliation = typeof cashReconciliations.$inferSelect;
export type NewCashReconciliation = typeof cashReconciliations.$inferInsert;

// Introducer Types
export type Introducer = typeof introducers.$inferSelect;
export type NewIntroducer = typeof introducers.$inferInsert;

// ============================================================================
// F&B PRINT JOBS
// ============================================================================

export const printJobStatusEnum = pgEnum('print_job_status', [
  'pending',
  'printing',
  'printed',
  'failed',
  'cancelled',
]);

export const printStationTypeEnum = pgEnum('print_station_type', [
  'kitchen',
  'bar',
  'pastry',
  'front_desk',
  'back_office',
]);

export const fnbPrintJobs = pgTable('fnb_print_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  orderId: uuid('order_id').references(() => restaurantOrders.id, { onDelete: 'set null' }),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  station: printStationTypeEnum('station').notNull(),
  status: printJobStatusEnum('status').default('pending').notNull(),
  printerId: varchar('printer_id', { length: 100 }),
  ticketType: varchar('ticket_type', { length: 50 }).default('order_ticket').notNull(),
  ticketData: jsonb('ticket_data').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
  errorMessage: text('error_message'),
  printedAt: timestamp('printed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
}, (table) => ({
  propertyIdx: index('idx_fnb_print_jobs_property_id').on(table.propertyId),
  orderIdx: index('idx_fnb_print_jobs_order_id').on(table.orderId),
  stationIdx: index('idx_fnb_print_jobs_station').on(table.station),
  statusIdx: index('idx_fnb_print_jobs_status').on(table.status),
  createdAtIdx: index('idx_fnb_print_jobs_created_at').on(table.createdAt),
  stationStatusIdx: index('idx_fnb_print_jobs_station_status').on(table.station, table.status),
}));

export const fnbPrintJobsRelations = relations(fnbPrintJobs, ({ one }) => ({
  property: one(properties, {
    fields: [fnbPrintJobs.propertyId],
    references: [properties.id],
  }),
  order: one(restaurantOrders, {
    fields: [fnbPrintJobs.orderId],
    references: [restaurantOrders.id],
  }),
  booking: one(bookings, {
    fields: [fnbPrintJobs.bookingId],
    references: [bookings.id],
  }),
  creator: one(users, {
    fields: [fnbPrintJobs.createdBy],
    references: [users.id],
  }),
}));

// F&B Print Job Types
export type FnbPrintJob = typeof fnbPrintJobs.$inferSelect;
export type NewFnbPrintJob = typeof fnbPrintJobs.$inferInsert;

// ============================================================================
// DURABLE SCHEDULING & NOTIFICATIONS (Wave 8)
// ============================================================================

export const schedulerJobs = pgTable('scheduler_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: varchar('tenant_id', { length: 255 }).notNull(),
  jobType: varchar('job_type', { length: 100 }).notNull(),
  idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull().unique(),
  payload: jsonb('payload').notNull().default(sql`'{}'::jsonb`),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  attempts: integer('attempts').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(10),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
  nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }),
  lastError: text('last_error'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  executionTimeMs: bigint('execution_time_ms', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  statusScheduledIdx: index('idx_scheduler_jobs_status_scheduled').on(table.status, table.scheduledFor),
  tenantJobTypeIdx: index('idx_scheduler_jobs_tenant_job_type').on(table.tenantId, table.jobType),
  nextAttemptIdx: index('idx_scheduler_jobs_next_attempt').on(table.nextAttemptAt),
}));

export const notificationHistory = pgTable('notification_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: varchar('tenant_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  notificationType: varchar('notification_type', { length: 100 }).notNull(),
  channel: varchar('channel', { length: 50 }).notNull(),
  recipient: varchar('recipient', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 500 }),
  content: text('content'),
  metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  failedAt: timestamp('failed_at', { withTimezone: true }),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userHistoryIdx: index('idx_notification_history_user').on(
    table.tenantId,
    table.userId,
    table.createdAt,
  ),
  typeStatusIdx: index('idx_notification_history_type_status').on(
    table.notificationType,
    table.status,
  ),
}));

export const calBookingMirrors = pgTable('cal_booking_mirrors', {
  id: uuid('id').primaryKey().defaultRandom(),
  calUid: varchar('cal_uid', { length: 255 }).notNull().unique(),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'set null' }),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  payload: jsonb('payload').notNull().default(sql`'{}'::jsonb`),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  webhookReceivedAt: timestamp('webhook_received_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  propertyIdx: index('idx_cal_booking_mirrors_property').on(table.propertyId),
  bookingIdx: index('idx_cal_booking_mirrors_booking').on(table.bookingId),
  statusIdx: index('idx_cal_booking_mirrors_status').on(table.status),
}));

export type SchedulerJob = typeof schedulerJobs.$inferSelect;
export type NewSchedulerJob = typeof schedulerJobs.$inferInsert;
export type NotificationHistory = typeof notificationHistory.$inferSelect;
export type NewNotificationHistory = typeof notificationHistory.$inferInsert;
export type CalBookingMirror = typeof calBookingMirrors.$inferSelect;
export type NewCalBookingMirror = typeof calBookingMirrors.$inferInsert;
