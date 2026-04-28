#!/usr/bin/env node

/**
 * API Endpoints Verification Script
 * Purpose: Verify all API endpoints exist and have correct structure
 * Location: /scripts/verify-api-endpoints.js
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const APP_DIR = path.join(PROJECT_ROOT, 'app', 'api');

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Expected API routes based on project structure
const expectedRoutes = [
  // Auth routes
  { path: 'auth/register/route.ts', description: 'User registration' },
  { path: 'auth/[...nextauth]/route.ts', description: 'NextAuth handler' },
  
  // User routes
  { path: 'user/profile/route.ts', description: 'User profile management' },
  
  // Dashboard routes
  { path: 'dashboard/stats/route.ts', description: 'Dashboard statistics' },
  { path: 'dashboard/activity/route.ts', description: 'Dashboard activity feed' },
  
  // Properties routes
  { path: 'properties/route.ts', description: 'Properties list/create' },
  { path: 'properties/[id]/route.ts', description: 'Property details/update' },
  { path: 'properties/[id]/rooms/route.ts', description: 'Property rooms' },
  
  // Rooms routes
  { path: 'rooms/route.ts', description: 'Rooms management' },
  { path: 'rooms/available/route.ts', description: 'Available rooms' },
  
  // Bookings routes
  { path: 'bookings/route.ts', description: 'Bookings list/create' },
  { path: 'bookings/availability/route.ts', description: 'Booking availability' },
  
  // Restaurant routes
  { path: 'restaurant/menu/route.ts', description: 'Restaurant menu' },
  { path: 'restaurant/tables/route.ts', description: 'Restaurant tables' },
  { path: 'restaurant/orders/route.ts', description: 'Restaurant orders' },
  { path: 'restaurant/details/route.ts', description: 'Restaurant details' },
  
  // Public restaurant routes
  { path: 'public/restaurant/menu/[slug]/route.ts', description: 'Public restaurant menu' },
  { path: 'public/restaurant/orders/route.ts', description: 'Public restaurant orders' },
  { path: 'public/properties/[slug]/route.ts', description: 'Public property details' },
  
  // CRM routes
  { path: 'crm/guests/route.ts', description: 'CRM guests list' },
  { path: 'crm/guests/[id]/route.ts', description: 'CRM guest details' },
  { path: 'crm/reviews/route.ts', description: 'CRM reviews' },
  
  // Staff routes
  { path: 'staff/route.ts', description: 'Staff management' },
  { path: 'staff/stats/route.ts', description: 'Staff statistics' },
  
  // Sofia AI routes
  { path: 'sofia/chat/route.ts', description: 'Sofia chat' },
  { path: 'sofia/email/route.ts', description: 'Sofia email' },
  { path: 'ai/concierge/route.ts', description: 'AI concierge' },
  
  // CMS routes
  { path: 'cms/content/route.ts', description: 'CMS content' },
  { path: 'cms/media/route.ts', description: 'CMS media' },
  
  // QR routes
  { path: 'qr/route.ts', description: 'QR code generation' },
  { path: 'qr/scan/route.ts', description: 'QR code scanning' },
  { path: 'qr/[id]/route.ts', description: 'QR code details' },
  
  // Menu routes
  { path: 'menu/route.ts', description: 'Menu management' },
  
  // Analytics routes
  { path: 'analytics/route.ts', description: 'Analytics data' },
  
  // Settings routes
  { path: 'settings/route.ts', description: 'System settings' },
];

// Check if route file exists and has basic structure
function checkRoute(routePath, description) {
  const fullPath = path.join(APP_DIR, routePath);
  const exists = fs.existsSync(fullPath);
  
  if (!exists) {
    return { exists: false, error: 'File not found' };
  }
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Check for basic Next.js route structure
    const hasExport = content.includes('export') || content.includes('module.exports');
    const hasMethod = 
      content.includes('export async function GET') ||
      content.includes('export async function POST') ||
      content.includes('export async function PUT') ||
      content.includes('export async function DELETE') ||
      content.includes('export async function PATCH');
    
    // Check for Prisma usage (should use new schema)
    const usesPrisma = content.includes('prisma') || content.includes('PrismaClient');
    
    // Check for removed models (should not exist)
    // NOTE: CmsContent and CmsMedia are now included (27 tables)
    const removedModels = [
      'ShoppingCart',
      'StaffActivity',
      'StaffPerformance',
      'EmailServer',
      'PaymentMethod',
      'Transaction',
    ];
    
    const usesRemovedModel = removedModels.some(model => 
      content.includes(model) && !content.includes('// removed') && !content.includes('// TODO')
    );
    
    const warnings = [];
    if (!hasMethod) {
      warnings.push('No HTTP method exports found');
    }
    if (usesRemovedModel) {
      warnings.push(`Uses removed model: ${removedModels.find(m => content.includes(m))}`);
    }
    
    return {
      exists: true,
      hasExport,
      hasMethod,
      usesPrisma,
      usesRemovedModel,
      warnings,
    };
  } catch (error) {
    return { exists: true, error: error.message };
  }
}

// Main verification function
function verifyEndpoints() {
  log('\n🔍 Verifying API Endpoints...\n', 'cyan');
  
  let passed = 0;
  let failed = 0;
  let warnings = 0;
  const issues = [];
  
  expectedRoutes.forEach(({ path: routePath, description }) => {
    const result = checkRoute(routePath, description);
    
    if (!result.exists) {
      log(`❌ ${routePath}`, 'red');
      log(`   ${description} - FILE NOT FOUND`, 'red');
      failed++;
      issues.push({ route: routePath, issue: 'File not found' });
    } else if (result.error) {
      log(`⚠️  ${routePath}`, 'yellow');
      log(`   ${description} - ERROR: ${result.error}`, 'yellow');
      warnings++;
      issues.push({ route: routePath, issue: result.error });
    } else {
      const status = result.usesRemovedModel ? '⚠️' : '✅';
      const color = result.usesRemovedModel ? 'yellow' : 'green';
      
      log(`${status} ${routePath}`, color);
      log(`   ${description}`, color);
      
      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach(warning => {
          log(`   ⚠️  ${warning}`, 'yellow');
          warnings++;
        });
      }
      
      if (result.usesRemovedModel) {
        issues.push({ route: routePath, issue: 'Uses removed model' });
      } else {
        passed++;
      }
    }
  });
  
  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 Verification Summary', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`✅ Passed: ${passed}`, 'green');
  log(`⚠️  Warnings: ${warnings}`, 'yellow');
  log(`❌ Failed: ${failed}`, 'red');
  log(`📝 Total Routes: ${expectedRoutes.length}`, 'blue');
  
  if (issues.length > 0) {
    log('\n⚠️  Issues Found:', 'yellow');
    issues.forEach(({ route, issue }) => {
      log(`   - ${route}: ${issue}`, 'yellow');
    });
  }
  
  log('\n' + '='.repeat(60), 'cyan');
  
  if (failed === 0 && warnings === 0) {
    log('✅ All API endpoints verified successfully!', 'green');
    return 0;
  } else if (failed === 0) {
    log('⚠️  All endpoints exist but some have warnings', 'yellow');
    return 1;
  } else {
    log('❌ Some endpoints are missing or have errors', 'red');
    return 2;
  }
}

// Run verification
const exitCode = verifyEndpoints();
process.exit(exitCode);
