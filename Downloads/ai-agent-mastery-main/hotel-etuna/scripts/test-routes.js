#!/usr/bin/env node

/**
 * Route Testing Script
 * 
 * Purpose: Test all routes in the application to ensure they exist and are properly structured
 * 
 * Tests:
 * 1. Dashboard routes existence
 * 2. API routes existence
 * 3. Route file structure validation
 * 4. Import validation (basic check)
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(PROJECT_ROOT, 'app');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: [],
};

function test(name, condition, message) {
  if (condition) {
    results.passed++;
    results.tests.push({ name, status: 'PASS', message });
    log(`✓ ${name}`, 'green');
  } else {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', message });
    log(`✗ ${name}: ${message}`, 'red');
  }
}

function warn(name, message) {
  results.warnings++;
  results.tests.push({ name, status: 'WARN', message });
  log(`⚠ ${name}: ${message}`, 'yellow');
}

// Expected dashboard routes
const expectedDashboardRoutes = [
  'admin/page.tsx',
  'ai/page.tsx',
  'analytics/page.tsx',
  'bookings/page.tsx',
  'bookings/[id]/page.tsx',
  'bookings/new/page.tsx',
  'cms/page.tsx',
  'crm/page.tsx',
  'crm/guests/[id]/page.tsx',
  'menu/page.tsx',
  'menu/new/page.tsx',
  'profile/page.tsx',
  'properties/page.tsx',
  'properties/[slug]/page.tsx',
  'properties/new/page.tsx',
  'restaurant/menu/page.tsx',
  'restaurant/orders/page.tsx',
  'restaurant/tables/page.tsx',
  'rooms/page.tsx',
  'settings/page.tsx',
  'sofia/email/page.tsx',
  'staff/page.tsx',
  'staff/new/page.tsx',
  'page.tsx', // Dashboard home
  'layout.tsx', // Dashboard layout
];

// Expected API routes
const expectedAPIRoutes = [
  'ai/concierge/route.ts',
  'analytics/route.ts',
  'auth/[...nextauth]/route.ts',
  'auth/register/route.ts',
  'bookings/route.ts',
  'bookings/availability/route.ts',
  'cms/content/route.ts',
  'cms/media/route.ts',
  'crm/guests/route.ts',
  'crm/guests/[id]/route.ts',
  'crm/reviews/route.ts',
  'dashboard/activity/route.ts',
  'dashboard/stats/route.ts',
  'menu/route.ts',
  'properties/route.ts',
  'properties/[id]/route.ts',
  'properties/[id]/rooms/route.ts',
  'public/properties/[slug]/route.ts',
  'public/restaurant/menu/[slug]/route.ts',
  'public/restaurant/orders/route.ts',
  'qr/route.ts',
  'qr/[id]/route.ts',
  'qr/scan/route.ts',
  'restaurant/details/route.ts',
  'restaurant/menu/route.ts',
  'restaurant/orders/route.ts',
  'restaurant/tables/route.ts',
  'rooms/route.ts',
  'rooms/available/route.ts',
  'settings/route.ts',
  'sofia/chat/route.ts',
  'sofia/email/route.ts',
  'staff/route.ts',
  'staff/stats/route.ts',
  'user/profile/route.ts',
];

// Expected auth routes
const expectedAuthRoutes = [
  '(auth)/login/page.tsx',
  '(auth)/register/page.tsx',
];

// Expected public routes
const expectedPublicRoutes = [
  'public-properties/[slug]/page.tsx',
  'public-properties/[slug]/book/page.tsx',
  'public-properties/[slug]/menu/page.tsx',
];

function checkRoute(routePath, routeType) {
  const fullPath = path.join(APP_DIR, routePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    // Check if file has content
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.trim().length === 0) {
        warn(`${routeType}: ${routePath}`, 'File is empty');
        return false;
      }
      
      // Basic syntax check for React/TypeScript files
      if (routePath.endsWith('.tsx') || routePath.endsWith('.ts')) {
        // Check for basic export
        if (!content.includes('export') && !content.includes('export default')) {
          warn(`${routeType}: ${routePath}`, 'No export found');
        }
      }
      
      return true;
    } catch (error) {
      warn(`${routeType}: ${routePath}`, `Error reading file: ${error.message}`);
      return false;
    }
  }
  
  return false;
}

function testDashboardRoutes() {
  log('\n📱 Testing Dashboard Routes...', 'cyan');
  const dashboardDir = path.join(APP_DIR, '(dashboard)');
  
  if (!fs.existsSync(dashboardDir)) {
    test('Dashboard route group exists', false, 'app/(dashboard)/ directory not found');
    return;
  }
  
  test('Dashboard route group exists', true, '');
  
  expectedDashboardRoutes.forEach(route => {
    const routePath = `(dashboard)/${route}`;
    const exists = checkRoute(routePath, 'Dashboard');
    test(`Dashboard: ${route}`, exists, exists ? '' : 'Route file missing');
  });
}

function testAPIRoutes() {
  log('\n🔌 Testing API Routes...', 'cyan');
  const apiDir = path.join(APP_DIR, 'api');
  
  if (!fs.existsSync(apiDir)) {
    test('API directory exists', false, 'app/api/ directory not found');
    return;
  }
  
  test('API directory exists', true, '');
  
  expectedAPIRoutes.forEach(route => {
    const routePath = `api/${route}`;
    const exists = checkRoute(routePath, 'API');
    test(`API: ${route}`, exists, exists ? '' : 'Route file missing');
  });
}

function testAuthRoutes() {
  log('\n🔐 Testing Auth Routes...', 'cyan');
  
  expectedAuthRoutes.forEach(route => {
    const exists = checkRoute(route, 'Auth');
    test(`Auth: ${route}`, exists, exists ? '' : 'Route file missing');
  });
}

function testPublicRoutes() {
  log('\n🌐 Testing Public Routes...', 'cyan');
  
  expectedPublicRoutes.forEach(route => {
    const exists = checkRoute(route, 'Public');
    test(`Public: ${route}`, exists, exists ? '' : 'Route file missing');
  });
}

function testRouteStructure() {
  log('\n🏗️  Testing Route Structure...', 'cyan');
  
  // Check dashboard layout exists
  const dashboardLayout = path.join(APP_DIR, '(dashboard)', 'layout.tsx');
  test('Dashboard layout exists', fs.existsSync(dashboardLayout), '');
  
  // Check root layout exists
  const rootLayout = path.join(APP_DIR, 'layout.tsx');
  test('Root layout exists', fs.existsSync(rootLayout), '');
  
  // Check root page exists
  const rootPage = path.join(APP_DIR, 'page.tsx');
  test('Root page exists', fs.existsSync(rootPage), '');
  
  // Check globals.css exists
  const globalsCSS = path.join(APP_DIR, 'globals.css');
  test('Global styles exist', fs.existsSync(globalsCSS), '');
  
  // Verify no duplicate dashboard directory
  const duplicateDashboard = path.join(APP_DIR, 'dashboard');
  if (fs.existsSync(duplicateDashboard)) {
    const entries = fs.readdirSync(duplicateDashboard);
    if (entries.length > 0) {
      warn('Duplicate dashboard directory', `app/dashboard/ still exists with: ${entries.join(', ')}`);
    } else {
      test('No duplicate dashboard directory', true, '');
    }
  } else {
    test('No duplicate dashboard directory', true, '');
  }
}

function testImports() {
  log('\n📦 Testing Critical Imports...', 'cyan');
  
  // Test a few key files for import issues
  const criticalFiles = [
    'app/(dashboard)/layout.tsx',
    'app/(dashboard)/properties/page.tsx',
    'app/(dashboard)/admin/page.tsx',
    'app/(dashboard)/ai/page.tsx',
    'app/api/properties/route.ts',
    'app/api/bookings/route.ts',
  ];
  
  criticalFiles.forEach(filePath => {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Check for common import patterns
        const hasImports = content.includes('import ') || content.includes('from ');
        const hasReact = content.includes('react') || content.includes('React');
        
        if (filePath.endsWith('.tsx')) {
          test(`Imports in ${filePath}`, hasImports, hasImports ? '' : 'No imports found');
        }
      } catch (error) {
        warn(`Reading ${filePath}`, error.message);
      }
    }
  });
}

function generateReport() {
  log('\n' + '='.repeat(60), 'blue');
  log('📊 Test Results Summary', 'blue');
  log('='.repeat(60), 'blue');
  
  log(`\n✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`⚠️  Warnings: ${results.warnings}`, results.warnings > 0 ? 'yellow' : 'green');
  
  const total = results.passed + results.failed;
  const successRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
  
  log(`\n📈 Success Rate: ${successRate}%`, successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red');
  
  if (results.failed > 0) {
    log('\n❌ Failed Tests:', 'red');
    results.tests
      .filter(t => t.status === 'FAIL')
      .forEach(t => log(`   - ${t.name}: ${t.message}`, 'red'));
  }
  
  if (results.warnings > 0) {
    log('\n⚠️  Warnings:', 'yellow');
    results.tests
      .filter(t => t.status === 'WARN')
      .forEach(t => log(`   - ${t.name}: ${t.message}`, 'yellow'));
  }
  
  log('\n' + '='.repeat(60), 'blue');
  
  // Overall status
  if (results.failed === 0 && results.warnings === 0) {
    log('🎉 All tests passed!', 'green');
    return 0;
  } else if (results.failed === 0) {
    log('✅ All critical tests passed (some warnings)', 'green');
    return 0;
  } else {
    log('❌ Some tests failed', 'red');
    return 1;
  }
}

// Main execution
function main() {
  log('\n🚀 Starting Route Tests...\n', 'blue');
  
  try {
    testRouteStructure();
    testDashboardRoutes();
    testAPIRoutes();
    testAuthRoutes();
    testPublicRoutes();
    testImports();
    
    const exitCode = generateReport();
    process.exit(exitCode);
  } catch (error) {
    log(`\n❌ Fatal Error: ${error.message}`, 'red');
    log(error.stack, 'red');
    process.exit(1);
  }
}

main();
