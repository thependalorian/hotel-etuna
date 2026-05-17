import { z } from 'zod';
import { entityId, entityIdOptional, entityIdNullableOptional } from '@/lib/validation/entity-ids';

/** Review category values (from schema) */
const reviewCategoryValues = ['stay', 'food', 'service', 'amenities', 'value', 'other'] as const;
/** Order type values (from schema) */
const orderTypeValues = ['dine_in', 'takeout', 'delivery', 'room_service'] as const;

export const createPropertySchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long'),
  type: z.string().min(1), // PropertyType enum removed - using string
  description: z.string().optional(),
  address: z.string().min(5, 'Address must be at least 5 characters long'),
  city: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  roomCount: z.number().int().min(0).optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string().url()).optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
});

export const createBookingSchema = z.object({
  propertyId: entityId(),
  guestId: entityIdOptional(),
  checkInDate: z.string().transform((val) => new Date(val)),
  checkOutDate: z.string().transform((val) => new Date(val)),
  roomCount: z.number().int().min(1),
  adultCount: z.number().int().min(1),
  childCount: z.number().int().min(0),
  specialRequests: z.string().optional(),
  roomId: entityId(),
});

export const guestSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  idNumber: z.string().optional(),
});

export const createStaffSchema = z.object({
  propertyId: entityId(),
  userId: entityIdOptional(),
  employeeNumber: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().transform((val) => new Date(val)).optional(),
  hireDate: z.string().transform((val) => new Date(val)),
  terminationDate: z.string().transform((val) => new Date(val)).optional(),
  position: z.string().min(1),
  department: z.string().optional(),
  salary: z.number().min(0).optional(),
  currency: z.string().optional(),
  employmentType: z.string().optional(),
  status: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  /** When true, staff status defaults to pending_verification and a compliance case is opened */
  openComplianceCase: z.boolean().optional(),
  complianceSubjectParty: z.enum(['individual', 'business']).optional(),
  complianceKycTier: z.enum(['lite', 'full']).optional(),
});

// Payment schemas removed - free platform, no payment processing needed

export const createCmsContentSchema = z.object({
  propertyId: entityId(),
  contentType: z.string().min(1), // CmsContentType enum removed - using string
  title: z.string().min(1),
  content: z.string().min(1),
  metadata: z.record(z.string(), z.any()).optional(),
  status: z.string().optional(), // CmsContentStatus enum removed - using string
});

export const createGuestReviewSchema = z.object({
  bookingId: entityId(),
  guestId: entityId(),
  propertyId: entityId(),
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().max(2000).optional(),
  reviewCategory: z.enum(reviewCategoryValues).optional(),
  isPublic: z.boolean().optional(),
});

const CMS_MEDIA_MAX_BYTES = 5 * 1024 * 1024;
const CMS_ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;

export const createCmsMediaSchema = z.object({
  propertyId: entityId(),
  fileName: z
    .string()
    .min(1)
    .max(255)
    .refine((n) => !n.includes('..') && !n.includes('/') && !n.includes('\\'), {
      message: 'Invalid file name',
    }),
  filePath: z.string().url(),
  fileType: z.string().min(1).max(64),
  fileSize: z
    .bigint()
    .optional()
    .refine((s) => s === undefined || s <= BigInt(CMS_MEDIA_MAX_BYTES), {
      message: 'File exceeds 5MB limit',
    }),
  mimeType: z.enum(CMS_ALLOWED_MIME).optional(),
  storageLocation: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const createMenuItemSchema = z.object({
  restaurantId: entityId(),
  categoryId: entityId(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  image_url: z.string().url().optional(),
  dietary_info: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  preparation_time: z.number().int().min(0).optional(),
  is_available: z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),
});

export const createMenuCategorySchema = z.object({
  restaurantId: entityId(),
  name: z.string().min(1),
  description: z.string().optional(),
  display_order: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

export const createTableSchema = z.object({
  restaurantId: entityId(),
  propertyId: entityId(),
  tableNumber: z.string().min(1),
  tableName: z.string().optional(),
  capacity: z.number().int().min(1),
  location: z.string().optional(),
});

export const createOrderItemSchema = z.object({
  menuItemId: entityId(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
  customizations: z.any().optional(),
  specialInstructions: z.string().optional(),
});

export const guestRoomServiceOrderSchema = z.object({
  items: z.array(createOrderItemSchema).min(1),
  roomNumber: z.string().optional(),
  specialInstructions: z.string().optional(),
});

export const guestFolioSettleSchema = z.object({
  paymentMethod: z.enum(['cash', 'card']),
  amountPaid: z.number().positive().optional(),
  gatewayTransactionId: z.string().optional(),
});

export const guestLoyaltyRedeemSchema = z.object({
  bookingId: entityId(),
  pointsToRedeem: z.number().int().min(100),
});

export const createOrderSchema = z.object({
  restaurantId: entityId(),
  propertyId: entityId(),
  guestId: entityId(),
  cartId: entityIdOptional(),
  tableId: entityIdOptional(),
  qrCode: z.string().optional(),
  bookingId: entityIdOptional(),
  orderType: z.enum(orderTypeValues).optional(),
  tableNumber: z.string().optional(),
  roomNumber: z.string().optional(),
  specialInstructions: z.string().optional(),
  items: z.array(createOrderItemSchema).min(1),
});

/** Sofia concierge POST body — aligned with `AIRequest` / `ConversationContext` in lib/types/ai.ts */
export const processAiMessageSchema = z.object({
  message: z.string().min(1).max(4000),
  sessionId: z.string().min(1).max(255),
  propertyId: entityIdOptional(),
  guestId: entityIdOptional(),
  bookingId: entityIdOptional(),
  language: z.string().max(10).optional(),
  channel: z.enum(['WEB', 'EMAIL', 'WHATSAPP', 'PHONE']).optional(),
});

/** Alias for dashboard / legacy route names */
export const sofiaConciergeChatSchema = processAiMessageSchema;

export const createCustomReportSchema = z.object({
  metrics: z.array(z.string()).min(1),
  filters: z.object({
    propertyId: entityIdOptional(),
    dateFrom: z.string().transform((val) => new Date(val)).optional(),
    dateTo: z.string().transform((val) => new Date(val)).optional(),
    groupBy: z.enum(['day', 'week', 'month', 'year']).optional(),
  }),
  format: z.enum(['json', 'csv', 'pdf']).optional(),
});

const complianceSubjectTypes = ['user', 'staff', 'tenant_business'] as const;
const complianceParty = ['individual', 'business'] as const;
const complianceTier = ['lite', 'full'] as const;

/** KYC/KYB case creation — profile keys align with NPS lite/full checklist */
export const createComplianceCaseSchema = z.object({
  subjectType: z.enum(complianceSubjectTypes),
  subjectId: entityIdOptional(),
  subjectParty: z.enum(complianceParty).default('individual'),
  kycTier: z.enum(complianceTier).default('lite'),
  profile: z.record(z.string(), z.unknown()).default({}),
  runWorkflow: z.boolean().optional(),
  allowAutoApproveLite: z.boolean().optional(),
});

export const addComplianceDocumentSchema = z.object({
  documentType: z.string().min(1).max(64),
  fileUrl: z.string().url(),
  fileName: z.string().max(512).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const runComplianceWorkflowSchema = z.object({
  allowAutoApproveLite: z.boolean().optional(),
});

export const complianceDecisionSchema = z.object({
  decision: z.enum(['approve', 'reject', 'needs_info']),
  notes: z.string().max(4000).optional(),
});

/** Generic PATCH body for LangGraph-backed lifecycle APIs */
export const entityStatusTransitionSchema = z.object({
  status: z.string().min(1).max(64),
});

/** CRM marketing/outreach touch — created as `draft`; transition via PATCH */
export const createCrmOutreachTouchSchema = z.object({
  guestId: entityId(),
  propertyId: entityIdOptional(),
  channel: z.string().min(1).max(32),
  campaignKey: z.string().max(100).optional(),
  messageSubject: z.string().max(500).optional(),
  messageBody: z.string().max(20000).optional(),
  scheduledAt: z.string().datetime().optional(),
});

/** CRM RAG ingest — raw text (chunked server-side) or explicit chunk strings */
export const ragIngestBodySchema = z
  .object({
    source: z.string().min(1).max(500),
    propertyId: entityIdNullableOptional(),
    text: z.string().max(500_000).optional(),
    chunks: z.array(z.string().max(12_000)).max(200).optional(),
    chunkMaxChars: z.number().int().min(300).max(8000).optional(),
    chunkOverlap: z.number().int().min(0).max(800).optional(),
  })
  .refine((d) => (d.text?.trim().length ?? 0) > 0 || (d.chunks?.length ?? 0) > 0, {
    message: 'Provide non-empty text or at least one chunk',
    path: ['text'],
  });







