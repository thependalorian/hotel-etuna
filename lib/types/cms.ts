/** JSON value type for metadata (replaces Prisma.JsonValue). Use unknown for nested structures to avoid circular type. */
export type JsonValue = string | number | boolean | null | unknown[] | Record<string, unknown>;

export interface CmsContentData {
  propertyId: string;
  contentType: string; // e.g., 'room_description', 'amenity_details', 'service_info'
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  status?: string; // 'draft', 'published', 'archived'
}

export interface CmsMediaData {
  propertyId: string;
  fileName: string;
  filePath: string;
  fileType?: string;
  fileSize?: bigint;
  mimeType?: string;
  storageLocation?: string;
  metadata?: Record<string, unknown>;
}

