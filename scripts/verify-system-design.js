#!/usr/bin/env node

/**
 * System Design Verification Script
 * Purpose: Verify all system design implementations are in place
 * Location: /scripts/verify-system-design.js
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');

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

const checks = [
  {
    name: 'Middleware with System Design',
    file: 'proxy.ts',
    checks: [
      { pattern: /withAuth/, desc: 'Uses NextAuth middleware' },
      { pattern: /hasRouteAccess/, desc: 'Role-based access control' },
      { pattern: /checkRateLimit/, desc: 'Rate limiting integration' },
      { pattern: /addSecurityHeaders/, desc: 'Security headers' },
      { pattern: /extractSubdomain/, desc: 'Subdomain routing' },
    ],
  },
  {
    name: 'Rate Limiting Utility',
    file: 'lib/utils/rate-limit.ts',
    checks: [
      { pattern: /checkRateLimit/, desc: 'Rate limit check function' },
      { pattern: /RATE_LIMITS/, desc: 'Rate limit configuration' },
      { pattern: /memoryStore/, desc: 'In-memory fallback' },
    ],
  },
  {
    name: 'Tenant Validation Utility',
    file: 'lib/utils/tenant-validation.ts',
    checks: [
      { pattern: /extractSubdomain/, desc: 'Subdomain extraction' },
      { pattern: /validateTenant/, desc: 'Tenant validation' },
      { pattern: /getTenantContext/, desc: 'Tenant context helper' },
    ],
  },
  {
    name: 'Security Logger Utility',
    file: 'lib/utils/security-logger.ts',
    checks: [
      { pattern: /logSecurityEvent/, desc: 'Security event logging' },
      { pattern: /logUnauthorizedAccess/, desc: 'Unauthorized access logging' },
      { pattern: /logRateLimitExceeded/, desc: 'Rate limit logging' },
    ],
  },
  {
    name: 'API Helpers Utility',
    file: 'lib/utils/api-helpers.ts',
    checks: [
      { pattern: /withApiAuth/, desc: 'API auth wrapper' },
      { pattern: /requireAuth/, desc: 'Auth requirement helper' },
      { pattern: /errorResponse/, desc: 'Standardized error response' },
      { pattern: /successResponse/, desc: 'Standardized success response' },
    ],
  },
  {
    name: 'NextAuth Type Definitions',
    file: 'next-auth.d.ts',
    checks: [
      { pattern: /tenantId/, desc: 'Tenant ID in types' },
      { pattern: /propertyId/, desc: 'Property ID in types' },
      { pattern: /role/, desc: 'Role in types' },
    ],
  },
  {
    name: 'Auth Configuration',
    file: 'lib/auth/config.ts',
    checks: [
      { pattern: /propertyId/, desc: 'Property ID fetching' },
      { pattern: /tenantId/, desc: 'Tenant ID in JWT' },
      { pattern: /CredentialsProvider/, desc: 'Credentials provider' },
    ],
  },
  {
    name: 'Updated API Routes',
    files: [
      'app/api/properties/route.ts',
      'app/api/dashboard/stats/route.ts',
    ],
    checks: [
      { pattern: /withApiAuth/, desc: 'Uses API auth wrapper' },
      { pattern: /requireRole/, desc: 'Role-based protection' },
      { pattern: /rateLimit/, desc: 'Rate limiting enabled' },
    ],
  },
];

function checkFile(filePath, checks) {
  const fullPath = path.join(PROJECT_ROOT, filePath);
  
  if (!fs.existsSync(fullPath)) {
    return { exists: false, passed: 0, total: checks.length };
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  let passed = 0;
  
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      passed++;
    }
  });
  
  return { exists: true, passed, total: checks.length };
}

function verifySystemDesign() {
  log('\n🔍 Verifying System Design Implementation...\n', 'cyan');
  
  let totalPassed = 0;
  let totalChecks = 0;
  const issues = [];
  
  checks.forEach(({ name, file, files, checks: fileChecks }) => {
    const filesToCheck = files || [file];
    
    filesToCheck.forEach(filePath => {
      const result = checkFile(filePath, fileChecks);
      totalChecks += result.total;
      
      if (!result.exists) {
        log(`❌ ${name}`, 'red');
        log(`   File not found: ${filePath}`, 'red');
        issues.push({ component: name, issue: `File missing: ${filePath}` });
      } else {
        const status = result.passed === result.total ? '✅' : '⚠️';
        const color = result.passed === result.total ? 'green' : 'yellow';
        
        log(`${status} ${name}`, color);
        log(`   ${result.passed}/${result.total} checks passed`, color);
        
        if (result.passed < result.total) {
          const failed = fileChecks.filter(check => {
            const content = fs.readFileSync(path.join(PROJECT_ROOT, filePath), 'utf8');
            return !check.pattern.test(content);
          });
          failed.forEach(check => {
            log(`   ⚠️  Missing: ${check.desc}`, 'yellow');
            issues.push({ component: name, issue: `Missing: ${check.desc}` });
          });
        }
        
        totalPassed += result.passed;
      }
    });
  });
  
  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 System Design Verification Summary', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`✅ Passed: ${totalPassed}/${totalChecks}`, 'green');
  log(`📝 Total Components: ${checks.length}`, 'blue');
  
  if (issues.length > 0) {
    log('\n⚠️  Issues Found:', 'yellow');
    issues.forEach(({ component, issue }) => {
      log(`   - ${component}: ${issue}`, 'yellow');
    });
  }
  
  log('\n' + '='.repeat(60), 'cyan');
  
  const percentage = Math.round((totalPassed / totalChecks) * 100);
  if (percentage === 100) {
    log('✅ All system design components verified!', 'green');
    return 0;
  } else if (percentage >= 80) {
    log('⚠️  Most components verified, some improvements needed', 'yellow');
    return 1;
  } else {
    log('❌ Several components need attention', 'red');
    return 2;
  }
}

const exitCode = verifySystemDesign();
process.exit(exitCode);
