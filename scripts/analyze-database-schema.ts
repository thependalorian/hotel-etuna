/**
 * Database Schema Analysis Script
 * 
 * Purpose: Extract complete database structure including:
 * - All tables with columns, types, constraints, defaults
 * - All custom types (enums, composite types)
 * - All policies (RLS policies)
 * - All indexes
 * - All constraints (primary keys, foreign keys, unique, check)
 * - All triggers
 * - All functions
 * 
 * Location: /scripts/analyze-database-schema.ts
 */

import { sql } from '@/lib/db';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

interface TableInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
  numeric_precision: number | null;
  numeric_scale: number | null;
}

interface ConstraintInfo {
  constraint_name: string;
  constraint_type: string;
  table_name: string;
  column_name: string | null;
  foreign_table_name: string | null;
  foreign_column_name: string | null;
}

interface IndexInfo {
  indexname: string;
  tablename: string;
  indexdef: string;
}

interface PolicyInfo {
  schemaname: string;
  tablename: string;
  policyname: string;
  permissive: string;
  roles: string[];
  cmd: string;
  qual: string | null;
  with_check: string | null;
}

interface TypeInfo {
  typname: string;
  typtype: string;
  typcategory: string;
  typinput: string;
}

interface TriggerInfo {
  trigger_name: string;
  event_manipulation: string;
  event_object_table: string;
  action_statement: string;
  action_timing: string;
}

interface FunctionInfo {
  routine_name: string;
  routine_type: string;
  data_type: string;
  routine_definition: string;
}

async function analyzeDatabaseSchema() {
  console.log('🔍 Analyzing Database Schema...\n');
  console.log('='.repeat(80));

  try {
    // 1. Get all tables
    console.log('\n📊 TABLES');
    console.log('-'.repeat(80));
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    ` as Array<{ table_name: string }>;
    console.log(`Total Tables: ${tables.length}\n`);
    tables.forEach((t, i) => console.log(`${i + 1}. ${t.table_name}`));

    // 2. Get all columns with details
    console.log('\n\n📋 COLUMNS (Detailed)');
    console.log('='.repeat(80));
    const columns = await sql`
      SELECT 
        t.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale
      FROM information_schema.tables t
      JOIN information_schema.columns c ON t.table_name = c.table_name
      WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        AND c.table_schema = 'public'
      ORDER BY t.table_name, c.ordinal_position
    ` as TableInfo[];

    let currentTable = '';
    for (const col of columns) {
      if (col.table_name !== currentTable) {
        currentTable = col.table_name;
        console.log(`\n\n📦 Table: ${currentTable}`);
        console.log('-'.repeat(80));
      }
      
      let typeDef = col.data_type;
      if (col.character_maximum_length) {
        typeDef += `(${col.character_maximum_length})`;
      } else if (col.numeric_precision && col.numeric_scale) {
        typeDef += `(${col.numeric_precision},${col.numeric_scale})`;
      } else if (col.numeric_precision) {
        typeDef += `(${col.numeric_precision})`;
      }
      
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      
      console.log(`  • ${col.column_name.padEnd(30)} ${typeDef.padEnd(25)} ${nullable}${defaultVal}`);
    }

    // 3. Get all constraints
    console.log('\n\n🔒 CONSTRAINTS');
    console.log('='.repeat(80));
    const constraints = await sql`
      SELECT
        tc.constraint_name,
        tc.constraint_type,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.table_schema = 'public'
      ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name
    ` as ConstraintInfo[];

    const constraintsByType: Record<string, ConstraintInfo[]> = {};
    constraints.forEach(c => {
      if (!constraintsByType[c.constraint_type]) {
        constraintsByType[c.constraint_type] = [];
      }
      constraintsByType[c.constraint_type].push(c);
    });

    Object.entries(constraintsByType).forEach(([type, cons]) => {
      console.log(`\n${type}:`);
      cons.forEach(c => {
        if (c.constraint_type === 'FOREIGN KEY') {
          console.log(`  • ${c.table_name}.${c.column_name} → ${c.foreign_table_name}.${c.foreign_column_name} (${c.constraint_name})`);
        } else if (c.constraint_type === 'PRIMARY KEY') {
          console.log(`  • ${c.table_name}.${c.column_name} (${c.constraint_name})`);
        } else if (c.constraint_type === 'UNIQUE') {
          console.log(`  • ${c.table_name}.${c.column_name} (${c.constraint_name})`);
        } else {
          console.log(`  • ${c.table_name}: ${c.constraint_name}`);
        }
      });
    });

    // 4. Get all indexes
    console.log('\n\n📇 INDEXES');
    console.log('='.repeat(80));
    const indexes = await sql`
      SELECT
        indexname,
        tablename,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname NOT LIKE '%_pkey'
      ORDER BY tablename, indexname
    ` as IndexInfo[];
    console.log(`Total Indexes: ${indexes.length}\n`);
    indexes.forEach(idx => {
      console.log(`  • ${idx.tablename}.${idx.indexname}`);
      console.log(`    ${idx.indexdef}`);
    });

    // 5. Get all custom types (enums, etc.)
    console.log('\n\n🏷️  CUSTOM TYPES');
    console.log('='.repeat(80));
    const types = await sql`
      SELECT
        t.typname,
        t.typtype,
        t.typcategory,
        t.typinput
      FROM pg_type t
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public'
        AND t.typtype IN ('e', 'c', 'd')
        AND t.typname NOT LIKE 'pg_%'
        AND t.typname NOT LIKE '_%'
      ORDER BY t.typname
    ` as TypeInfo[];

    for (const type of types) {
      if (type.typtype === 'e') {
        // Enum type - get values
        const enumValues = await sql`
          SELECT enumlabel
          FROM pg_enum
          WHERE enumtypid = (
            SELECT oid FROM pg_type WHERE typname = ${type.typname}
          )
          ORDER BY enumsortorder
        ` as Array<{ enumlabel: string }>;
        console.log(`\n  • ${type.typname} (ENUM):`);
        enumValues.forEach(v => console.log(`    - ${v.enumlabel}`));
      } else {
        console.log(`  • ${type.typname} (${type.typtype === 'c' ? 'COMPOSITE' : 'DOMAIN'})`);
      }
    }

    // 6. Get all RLS policies
    console.log('\n\n🛡️  ROW LEVEL SECURITY POLICIES');
    console.log('='.repeat(80));
    const policies = await sql`
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname
    ` as PolicyInfo[];
    
    if (policies.length === 0) {
      console.log('No RLS policies found.');
    } else {
      let currentTable = '';
      for (const policy of policies) {
        if (policy.tablename !== currentTable) {
          currentTable = policy.tablename;
          console.log(`\n  📦 Table: ${currentTable}`);
        }
        console.log(`    • ${policy.policyname}`);
        console.log(`      Command: ${policy.cmd}`);
        console.log(`      Roles: ${policy.roles.join(', ')}`);
        if (policy.qual) {
          console.log(`      Using: ${policy.qual.substring(0, 100)}${policy.qual.length > 100 ? '...' : ''}`);
        }
        if (policy.with_check) {
          console.log(`      With Check: ${policy.with_check.substring(0, 100)}${policy.with_check.length > 100 ? '...' : ''}`);
        }
      }
    }

    // 7. Get all triggers
    console.log('\n\n⚡ TRIGGERS');
    console.log('='.repeat(80));
    const triggers = await sql`
      SELECT
        trigger_name,
        event_manipulation,
        event_object_table,
        action_statement,
        action_timing
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name
    ` as TriggerInfo[];
    
    if (triggers.length === 0) {
      console.log('No triggers found.');
    } else {
      let currentTable = '';
      for (const trigger of triggers) {
        if (trigger.event_object_table !== currentTable) {
          currentTable = trigger.event_object_table;
          console.log(`\n  📦 Table: ${currentTable}`);
        }
        console.log(`    • ${trigger.trigger_name}`);
        console.log(`      Event: ${trigger.action_timing} ${trigger.event_manipulation}`);
        console.log(`      Action: ${trigger.action_statement.substring(0, 100)}${trigger.action_statement.length > 100 ? '...' : ''}`);
      }
    }

    // 8. Get all functions
    console.log('\n\n⚙️  FUNCTIONS');
    console.log('='.repeat(80));
    const functions = await sql`
      SELECT
        routine_name,
        routine_type,
        data_type,
        routine_definition
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_type = 'FUNCTION'
      ORDER BY routine_name
    ` as FunctionInfo[];
    
    if (functions.length === 0) {
      console.log('No custom functions found.');
    } else {
      functions.forEach(func => {
        console.log(`\n  • ${func.routine_name}() → ${func.data_type}`);
        if (func.routine_definition) {
          const def = func.routine_definition.substring(0, 200);
          console.log(`    ${def}${func.routine_definition.length > 200 ? '...' : ''}`);
        }
      });
    }

    // Summary
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`Tables: ${tables.length}`);
    console.log(`Columns: ${columns.length}`);
    console.log(`Constraints: ${constraints.length}`);
    console.log(`Indexes: ${indexes.length}`);
    console.log(`Custom Types: ${types.length}`);
    console.log(`RLS Policies: ${policies.length}`);
    console.log(`Triggers: ${triggers.length}`);
    console.log(`Functions: ${functions.length}`);
    console.log('='.repeat(80));

  } catch (error: any) {
    console.error('❌ Error analyzing database schema:', error);
    throw error;
  } finally {
    // Neon serverless - no explicit disconnect
  }
}

// Run the analysis
analyzeDatabaseSchema()
  .then(() => {
    console.log('\n✅ Database schema analysis complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Analysis failed:', error);
    process.exit(1);
  });
