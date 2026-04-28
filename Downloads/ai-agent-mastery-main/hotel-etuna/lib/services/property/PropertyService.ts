import { db, properties as propertiesSchema } from '@/lib/db';
import { AppError, handleServiceError } from '@/lib/utils/errors';
import { eq, sql } from 'drizzle-orm';
import type { Property } from '@/lib/db/schema';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// A DTO for creating a property
export interface CreatePropertyDTO {
  name: string;
  type: 'hotel' | 'restaurant' | 'airbnb' | 'lodge' | 'both' | 'HOTEL' | 'RESTAURANT' | 'AIRBNB' | 'LODGE' | 'BOTH';
  description?: string;
  address: string;
  ownerId: string;
  tenantId: string;
  images?: string[]; // Optional images array
  amenities?: string[]; // Optional amenities array
}

// DTO for updating a property
export interface UpdatePropertyDTO {
  name: string;
  description?: string;
  address: string;
}

export class PropertyService {
  private readonly baseProjection = sql`
    id,
    tenant_id,
    owner_id,
    name,
    slug,
    type,
    description,
    address,
    city,
    country,
    status,
    created_at,
    updated_at
  `;
  /**
   * Get all properties for the current tenant.
   */
  async getProperties(tenantId: string): Promise<Property[]> {
    try {
      const properties = await db.execute(sql`
        SELECT ${this.baseProjection}
        FROM properties
        WHERE tenant_id = ${tenantId}
          AND (status IS NULL OR status <> 'inactive')
        ORDER BY created_at DESC
      `);
      return properties.rows as Property[];
    } catch (error) {
      throw handleServiceError(error, 'Error fetching properties');
    }
  }

  /**
   * Get properties by tenant (alias for getProperties for consistency).
   */
  async getPropertiesByTenant(tenantId: string): Promise<Property[]> {
    return this.getProperties(tenantId);
  }

  /**
   * Get a single property by its ID.
   */
  async getPropertyById(propertyId: string, tenantId: string): Promise<Property | null> {
    if (!UUID_PATTERN.test(propertyId)) return null;

    try {
      const result = await db.execute(sql`
        SELECT ${this.baseProjection}
        FROM properties
        WHERE id = ${propertyId}
          AND tenant_id = ${tenantId}
        LIMIT 1
      `);
      return (result.rows[0] as Property) || null;
    } catch (error) {
      throw handleServiceError(error, 'Error fetching property');
    }
  }

  /**
   * Create a new property.
   */
  async createProperty(data: CreatePropertyDTO): Promise<Property> {
    let slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    const normalizedType = data.type.toLowerCase();

    try {
      let isSlugUnique = false;
      let counter = 1;
      const originalSlug = slug;

      while (!isSlugUnique) {
        const result = await db
          .select({ id: propertiesSchema.id })
          .from(propertiesSchema)
          .where(eq(propertiesSchema.slug, slug))
          .limit(1);

        if (result.length === 0) {
          isSlugUnique = true;
        } else {
          slug = `${originalSlug}-${counter}`;
          counter++;
        }
      }

      const newProperties = await db.execute(sql`
        INSERT INTO properties (
          id, tenant_id, owner_id, name, slug, type, description, address, amenities, images, status, created_at, updated_at
        )
        VALUES (
          gen_random_uuid(),
          ${data.tenantId},
          ${data.ownerId},
          ${data.name},
          ${slug},
          ${normalizedType},
          ${data.description ?? null},
          ${data.address},
          ${data.amenities ?? null},
          ${data.images ?? null},
          'active',
          NOW(),
          NOW()
        )
        RETURNING ${this.baseProjection}
      `);

      if (!newProperties.rows || newProperties.rows.length === 0) {
        throw new Error('Property creation failed: No result returned from INSERT');
      }

      return newProperties.rows[0] as Property;
    } catch (error: any) {
      console.error('[PropertyService.createProperty] Database error:', {
        error: error.message,
        // Drizzle doesn't have error codes and meta in the same way as Prisma
      });
      throw handleServiceError(error, 'Error creating property');
    }
  }

  /**
   * Get a single property by its slug.
   */
  async getPropertyBySlug(slug: string): Promise<Property | null> {
    try {
      const result = await db.execute(sql`
        SELECT ${this.baseProjection}
        FROM properties
        WHERE slug = ${slug}
          AND (status IS NULL OR status <> 'inactive')
        LIMIT 1
      `);
      return (result.rows[0] as Property) || null;
    } catch (error) {
      throw handleServiceError(error, 'Error fetching property by slug');
    }
  }

  /**
   * Get all properties for a given owner.
   */
  async getPropertiesByOwner(ownerId: string): Promise<Property[]> {
    try {
      const properties = await db.execute(sql`
        SELECT ${this.baseProjection}
        FROM properties
        WHERE owner_id = ${ownerId}
          AND (status IS NULL OR status <> 'inactive')
        ORDER BY created_at DESC
      `);
      return properties.rows as Property[];
    } catch (error) {
      throw handleServiceError(error, 'Error fetching properties by owner');
    }
  }

  /**
   * Update a property.
   */
  async updateProperty(propertyId: string, tenantId: string, data: UpdatePropertyDTO): Promise<Property> {
    try {
      const updatedRow = await this.updatePropertyRow(propertyId, tenantId, {
          name: data.name,
          description: data.description,
          address: data.address,
      });
      if (!updatedRow) {
        throw new AppError(404, 'Property not found or you do not have permission to update it.');
      }
      return updatedRow;
    } catch (error) {
      throw handleServiceError(error, 'Error updating property');
    }
  }

  /** Internal update helper returning null if no row matched */
  private async updatePropertyRow(
    propertyId: string,
    tenantId: string,
    patch: Partial<Pick<Property, 'name' | 'description' | 'address' | 'status' | 'updatedAt'>>
  ): Promise<Property | null> {
    if (!UUID_PATTERN.test(propertyId)) return null;

    const updatedProperties = await db.execute(sql`
      UPDATE properties
      SET
        name = COALESCE(${patch.name ?? null}, name),
        description = COALESCE(${patch.description ?? null}, description),
        address = COALESCE(${patch.address ?? null}, address),
        status = COALESCE(${patch.status ?? null}, status),
        updated_at = NOW()
      WHERE id = ${propertyId}
        AND tenant_id = ${tenantId}
      RETURNING ${this.baseProjection}
    `);
    return (updatedProperties.rows[0] as Property) ?? null;
  }

  /**
   * Soft-delete: mark status inactive (excluded from default listings).
   */
  async archiveProperty(propertyId: string, tenantId: string): Promise<Property> {
    const updated = await this.updatePropertyRow(propertyId, tenantId, {
      status: 'inactive',
    });
    if (!updated) {
      throw new AppError(404, 'Property not found or you do not have permission to delete it.');
    }
    return updated;
  }
}
