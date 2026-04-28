/**
 * Seed partner network data for Hotel Etuna.
 *
 * Purpose: Idempotently create JayLa and Aquarius partner tenants, properties, rooms, and partner admins.
 * Location: /scripts/seed-partners.ts
 *
 * Usage:
 *   npx tsx scripts/seed-partners.ts --dry
 *   npx tsx scripts/seed-partners.ts
 */

import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

type PartnerRoomSeed = {
  roomNumber: string;
  roomType: string;
  maxOccupancy: number;
  description: string;
  amenities: string[];
  status: 'available';
  baseRate: number;
};

type PartnerSeed = {
  name: string;
  slug: string;
  email: string;
  description: string;
  address: string;
  city: string;
  state: string | null;
  country: string;
  propertyType: string;
  amenities: string[];
  checkInTime: string;
  checkOutTime: string;
  starRating: number;
  images: string[];
  status: 'active';
  commissionPercent: string;
  rooms: PartnerRoomSeed[];
};

function loadEnv(): void {
  const root = resolve(process.cwd());
  for (const file of ['.env.local', '.env']) {
    const path = resolve(root, file);
    if (!existsSync(path)) continue;
    const content = readFileSync(path, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx <= 0) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

function logStep(message: string): void {
  console.log(`- ${message}`);
}

async function main() {
  loadEnv();

  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry');
  const force = args.has('--force');

  const databaseUrl = process.env.DATABASE_URL;
  const hubTenantIdRaw = process.env.HUB_TENANT_ID;

  if (!databaseUrl) throw new Error('DATABASE_URL is required.');
  if (!hubTenantIdRaw) throw new Error('HUB_TENANT_ID is required.');

  const pool = new Pool({ connectionString: databaseUrl });
  const defaultPassword = process.env.PARTNER_SEED_PASSWORD || 'Test1234!';
  const defaultPasswordHash = await bcrypt.hash(defaultPassword, 10);

  const partners: PartnerSeed[] = [
    {
      name: 'JayLa Self Catering Accommodation',
      slug: 'jayla',
      email: 'owner@jayla.nam',
      description:
        'Ideally located in the Suiderhof neighborhood of Windhoek, JayLa offers four beautifully furnished self-catering rooms perfect for business travellers, families, and groups. Each unit includes a kitchenette, air conditioning, and free WiFi. The property features a braai area, outdoor seating, and secure parking, with Eros Airport only 1.2 miles away.',
      address: '39 Andimba Toivo ya Toivo Street, Suiderhof, Windhoek, Namibia',
      city: 'Windhoek',
      state: 'Khomas',
      country: 'Namibia',
      propertyType: 'self_catering',
      amenities: [
        'Free WiFi',
        'Air conditioning',
        'Free parking',
        'Braai/BBQ area',
        'Kitchenette',
        'Airport shuttle (paid)',
        'Non-smoking rooms',
      ],
      checkInTime: '14:00',
      checkOutTime: '10:00',
      starRating: 3,
      images: ['/images/hospitality/partner_jayla.jpeg'],
      status: 'active',
      commissionPercent: '10.00',
      rooms: [
        {
          roomType: 'Standard Studio',
          roomNumber: 'JS-101',
          maxOccupancy: 2,
          description: 'Cozy studio with kitchenette, air conditioning, and en-suite bathroom',
          amenities: ['WiFi', 'Aircon', 'Kitchenette', 'TV', 'Desk'],
          status: 'available',
          baseRate: 800,
        },
        {
          roomType: 'Family Unit',
          roomNumber: 'JS-102',
          maxOccupancy: 4,
          description: 'Spacious family unit with two single beds and a double bed, plus full kitchenette',
          amenities: ['WiFi', 'Aircon', 'Kitchenette', 'TV', 'Desk', 'Extra bedding'],
          status: 'available',
          baseRate: 1200,
        },
        {
          roomType: 'Deluxe Suite',
          roomNumber: 'JS-103',
          maxOccupancy: 3,
          description: 'Modern suite with king-size bed and sofa bed, premium furnishings',
          amenities: ['WiFi', 'Aircon', 'Kitchenette', 'TV', 'Desk', 'Lounge area'],
          status: 'available',
          baseRate: 1400,
        },
        {
          roomType: 'Twin Room',
          roomNumber: 'JS-104',
          maxOccupancy: 2,
          description: 'Comfortable twin room with two three-quarter beds, ideal for colleagues',
          amenities: ['WiFi', 'Aircon', 'Kitchenette', 'TV', 'Desk'],
          status: 'available',
          baseRate: 900,
        },
      ],
    },
    {
      name: 'Aquarius Luxurious Penthouse',
      slug: 'aquarius',
      email: 'owner@aquarius.nam',
      description:
        'A budget-friendly homestay penthouse in central Windhoek, offering a double room with private bathroom, city views, and free WiFi. Perfect for solo travellers or couples looking for a simple, affordable base in the capital.',
      address: 'Kingfisher Street, Fisher Court, Unit 51, Windhoek, Namibia',
      city: 'Windhoek',
      state: null,
      country: 'Namibia',
      propertyType: 'homestay',
      amenities: ['Free WiFi', 'Free parking', 'Non-smoking', 'City view'],
      checkInTime: '14:00',
      checkOutTime: '10:00',
      starRating: 2,
      images: ['/images/hospitality/partner_aquarius.jpeg'],
      status: 'active',
      commissionPercent: '10.00',
      rooms: [
        {
          roomType: 'Double Room',
          roomNumber: 'AQ-101',
          maxOccupancy: 2,
          description: 'Compact double room with private bathroom, fridge, microwave, and city view',
          amenities: ['WiFi', 'Fridge', 'Microwave', 'TV', 'Desk'],
          status: 'available',
          baseRate: 700,
        },
      ],
    },
  ];

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      hubTenantIdRaw
    );

    let hubTenantId = hubTenantIdRaw;
    let hub:
      | {
          id: string;
          type: string;
        }
      | undefined;

    if (isUuid) {
      [hub] = (
        await pool.query<{ id: string; type: string }>(
          `SELECT id, type FROM tenants WHERE id = $1 LIMIT 1`,
          [hubTenantId]
        )
      ).rows;
    } else {
      const [fallbackHub] = (
        await pool.query<{ id: string; type: string }>(
          `SELECT id, type FROM tenants WHERE type = 'hub' ORDER BY created_at ASC LIMIT 1`
        )
      ).rows;
      if (fallbackHub) {
        hubTenantId = fallbackHub.id;
        hub = fallbackHub;
        logStep(`HUB_TENANT_ID is placeholder; using detected hub tenant ${hubTenantId}`);
      }
    }

    if (!hub) {
      if (dryRun) {
        logStep(`[DRY] Would insert hub tenant ${hubTenantId}`);
      } else {
        await pool.query(
          `
            INSERT INTO tenants (id, name, type, status, subscription_tier, subscription_status, created_at, updated_at)
            VALUES ($1, 'Hotel Etuna', 'hub', 'active', 'starter', 'active', NOW(), NOW())
          `,
          [hubTenantId]
        );
        logStep(`Inserted missing hub tenant ${hubTenantId}`);
      }
    } else if (hub.type !== 'hub') {
      throw new Error(`HUB_TENANT_ID ${hubTenantId} exists but is type "${hub.type}", expected "hub".`);
    } else {
      logStep(`Hub tenant exists (${hubTenantId})`);
    }

    for (const partner of partners) {
      const existingTenant = (
        await pool.query<{ id: string }>(
          `SELECT id FROM tenants WHERE subdomain = $1 OR name = $2 LIMIT 1`,
          [partner.slug, partner.name]
        )
      ).rows[0];

      if (existingTenant && !force) {
        logStep(`Partner "${partner.slug}" already exists (tenant ${existingTenant.id}) — skipping.`);
        continue;
      }

      if (dryRun) {
        logStep(`[DRY] Would upsert partner "${partner.slug}" tenant/property/rooms/user`);
        continue;
      }

      await pool.query('BEGIN');
      try {
        const tenantId = existingTenant?.id ?? randomUUID();
        if (!existingTenant) {
          await pool.query(
            `
              INSERT INTO tenants (
                id, name, type, parent_tenant_id, commission_percent, subdomain, status,
                subscription_tier, subscription_status, property_type, room_count, created_at, updated_at
              )
              VALUES ($1, $2, 'partner', $3, $4, $5, $6, 'starter', 'active', $7, $8, NOW(), NOW())
            `,
            [
              tenantId,
              partner.name,
              hubTenantId,
              partner.commissionPercent,
              partner.slug,
              partner.status,
              partner.propertyType,
              partner.rooms.length,
            ]
          );
        } else if (force) {
          await pool.query(
            `
              UPDATE tenants
              SET parent_tenant_id = $2,
                  commission_percent = $3,
                  type = 'partner',
                  property_type = $4,
                  room_count = $5,
                  status = 'active',
                  updated_at = NOW()
              WHERE id = $1
            `,
            [tenantId, hubTenantId, partner.commissionPercent, partner.propertyType, partner.rooms.length]
          );
        }

        const existingProperty = (
          await pool.query<{ id: string }>(`SELECT id FROM properties WHERE slug = $1 LIMIT 1`, [partner.slug])
        ).rows[0];

        const propertyId = existingProperty?.id ?? randomUUID();
        if (!existingProperty) {
          await pool.query(
            `
              INSERT INTO properties (
                id, tenant_id, name, slug, type, description, address, city, state, country,
                star_rating, room_count, currency, status, amenities, images, check_in_time, check_out_time, created_at, updated_at
              )
              VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'NAD',$13,$14,$15,$16,$17,NOW(),NOW())
            `,
            [
              propertyId,
              tenantId,
              partner.name,
              partner.slug,
              partner.propertyType,
              partner.description,
              partner.address,
              partner.city,
              partner.state,
              partner.country,
              partner.starRating,
              partner.rooms.length,
              partner.status,
              partner.amenities,
              partner.images,
              partner.checkInTime,
              partner.checkOutTime,
            ]
          );
        } else if (force) {
          await pool.query(
            `
              UPDATE properties
              SET tenant_id = $2, name = $3, type = $4, description = $5, address = $6, city = $7, state = $8, country = $9,
                  star_rating = $10, room_count = $11, status = $12, amenities = $13, images = $14, check_in_time = $15, check_out_time = $16, updated_at = NOW()
              WHERE id = $1
            `,
            [
              propertyId,
              tenantId,
              partner.name,
              partner.propertyType,
              partner.description,
              partner.address,
              partner.city,
              partner.state,
              partner.country,
              partner.starRating,
              partner.rooms.length,
              partner.status,
              partner.amenities,
              partner.images,
              partner.checkInTime,
              partner.checkOutTime,
            ]
          );
        }

        for (const room of partner.rooms) {
          const existingRoom = (
            await pool.query<{ id: string }>(
              `SELECT id FROM rooms WHERE property_id = $1 AND room_number = $2 LIMIT 1`,
              [propertyId, room.roomNumber]
            )
          ).rows[0];

          if (!existingRoom) {
            await pool.query(
              `
                INSERT INTO rooms (
                  id, property_id, room_number, room_type, max_occupancy, base_rate, currency,
                  amenities, status, images, created_at, updated_at
                )
                VALUES ($1,$2,$3,$4,$5,$6,'NAD',$7,$8,$9,NOW(),NOW())
              `,
              [
                randomUUID(),
                propertyId,
                room.roomNumber,
                room.roomType,
                room.maxOccupancy,
                room.baseRate,
                room.amenities,
                room.status,
                [],
              ]
            );
          } else if (force) {
            await pool.query(
              `
                UPDATE rooms
                SET room_type = $2, max_occupancy = $3, base_rate = $4, amenities = $5, status = $6, updated_at = NOW()
                WHERE id = $1
              `,
              [existingRoom.id, room.roomType, room.maxOccupancy, room.baseRate, room.amenities, room.status]
            );
          }
        }

        const existingUser = (
          await pool.query<{ id: string }>(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [partner.email])
        ).rows[0];

        if (!existingUser) {
          await pool.query(
            `
              INSERT INTO users (
                id, tenant_id, email, password_hash, first_name, last_name, role, status, email_verified, created_at, updated_at
              )
              VALUES ($1,$2,$3,$4,$5,$6,'partner_admin','active',true,NOW(),NOW())
            `,
            [randomUUID(), tenantId, partner.email, defaultPasswordHash, 'Partner', 'Owner']
          );
        } else if (force) {
          await pool.query(
            `
              UPDATE users
              SET tenant_id = $2, role = 'partner_admin', status = 'active', updated_at = NOW()
              WHERE id = $1
            `,
            [existingUser.id, tenantId]
          );
        }

        await pool.query('COMMIT');
        logStep(`Seeded partner "${partner.slug}" successfully.`);
      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }
    }

    if (dryRun) {
      console.log('Dry-run complete. No database changes were made.');
    } else {
      console.log('Partner seed complete.');
      console.log(`Default partner seed password: ${defaultPassword}`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
