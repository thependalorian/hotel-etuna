#!/bin/bash

# Reset Database Schema Script
# Purpose: Drop ALL existing tables and recreate with 25 essential tables

set -e

# Get DATABASE_URL from .env
if [ -f .env ]; then
    export DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
elif [ -f .env.local ]; then
    export DATABASE_URL=$(grep "^DATABASE_URL=" .env.local | cut -d '=' -f2- | tr -d '"' | tr -d "'")
else
    echo "❌ Error: No .env or .env.local file found"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not found in .env file"
    exit 1
fi

echo "🚀 Resetting database schema..."
echo "📊 Database: $(echo $DATABASE_URL | sed 's/:[^:]*@/:***@/g')"
echo ""

# Step 1: Drop ALL existing tables
echo "Step 1: Dropping all existing tables..."
psql "$DATABASE_URL" <<EOF
-- Drop all tables in public schema
DO \$\$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all views first
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        BEGIN
            EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop table %: %', r.tablename, SQLERRM;
        END;
    END LOOP;
    
    -- Drop all views
    FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') 
    LOOP
        BEGIN
            EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.viewname) || ' CASCADE';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop view %: %', r.viewname, SQLERRM;
        END;
    END LOOP;
END \$\$;
EOF

# Step 2: Drop all types
echo "Step 2: Dropping all existing types..."
psql "$DATABASE_URL" <<EOF
DO \$\$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'e') 
    LOOP
        BEGIN
            EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop type %: %', r.typname, SQLERRM;
        END;
    END LOOP;
END \$\$;
EOF

# Step 3: Drop all functions
echo "Step 3: Dropping all existing functions..."
psql "$DATABASE_URL" <<EOF
DO \$\$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT proname, oidvectortypes(proargtypes) as argtypes 
              FROM pg_proc 
              WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) 
    LOOP
        BEGIN
            EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.proname) || '(' || r.argtypes || ') CASCADE';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop function %: %', r.proname, SQLERRM;
        END;
    END LOOP;
END \$\$;
EOF

# Step 4: Apply new schema
echo "Step 4: Applying new schema (25 essential tables)..."
psql "$DATABASE_URL" -f init_schema.sql

# Step 5: Verify
echo ""
echo "Step 5: Verifying schema..."
TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name NOT LIKE '_prisma%' AND table_name NOT LIKE 'alembic%' AND table_name NOT LIKE 'schema_migrations%' AND table_name NOT LIKE 'payload_migrations%' AND table_name NOT LIKE 'migration_log%';")

echo "✅ Schema reset complete!"
echo "📊 Total tables created: $TABLE_COUNT"
echo ""
echo "Verifying essential tables..."
psql "$DATABASE_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name IN ('tenants', 'users', 'properties', 'bookings', 'guests', 'rooms', 'staff', 'analytics_events', 'system_logs') ORDER BY table_name;"

echo ""
echo "✅ Done! Database schema has been reset to 25 essential tables."
