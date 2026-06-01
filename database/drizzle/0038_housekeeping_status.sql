-- Migration: Add housekeeping_status enum for room cleaning flow
-- Agent: A8 Housekeeping
-- Status: dirty → cleaning → inspecting → clean

CREATE TYPE "public"."housekeeping_status" AS ENUM('dirty', 'cleaning', 'inspecting', 'clean');--> statement-breakpoint

-- Add housekeeping_status column to rooms table
ALTER TABLE "public"."rooms" ADD COLUMN IF NOT EXISTS "housekeeping_status" "public"."housekeeping_status" DEFAULT 'clean';--> statement-breakpoint

-- Create index for housekeeping queries
CREATE INDEX IF NOT EXISTS "idx_rooms_housekeeping_status" ON "public"."rooms" ("housekeeping_status");--> statement-breakpoint

-- Add housekeeping status to housekeeping_tasks
ALTER TABLE "public"."housekeeping_tasks" ADD COLUMN IF NOT EXISTS "room_housekeeping_status" "public"."housekeeping_status";--> statement-breakpoint
