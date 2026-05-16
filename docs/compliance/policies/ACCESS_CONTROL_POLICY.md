# Access Control Policy

**Effective Date:** May 16, 2026  
**Policy Owner:** CTO  
**Review Frequency:** Annual  
**TSC Reference:** CC6.1-6.3  
**Approval Required:** Executive Sponsor (CEO/Owner)

---

## 1. Purpose

This policy establishes requirements for controlling access to Hotel Etuna's information systems, ensuring that only authorized users can access resources appropriate to their role and responsibilities.

## 2. Scope

This policy applies to:
- All users (staff, partners, contractors, third-party service providers)
- All information systems (production, staging, development environments)
- All access methods (web, API, database, administrative)
- Physical and logical access controls

## 3. Policy Statements

### 3.1 Access Control Principles

**Least Privilege:**
- Users granted minimum access required for job function
- No blanket "admin" access; granular role-based permissions
- Access rights reviewed quarterly and recertified annually

**Separation of Duties:**
- Critical functions require multiple approvals (e.g., payment processing, partner invites)
- No single individual has end-to-end control over sensitive operations
- Developer access to production requires approval and logging

**Need-to-Know:**
- Access to confidential data limited to users with business justification
- Tenant isolation enforced via RLS (Row-Level Security)
- Partners cannot access hub tenant data

### 3.2 Role-Based Access Control (RBAC)

**Defined Roles:**
| Role | Permissions | Systems | Approval Required |
|------|-------------|---------|-------------------|
| **Guest** | View own bookings, submit orders, pay folio | Public + guest portal | Self-registration |
| **Staff** | Manage bookings, view guest data (own tenant) | Dashboard | Manager approval |
| **Manager** | All staff permissions + reports, staff management | Dashboard, reports | Owner approval |
| **Admin** | All manager permissions + system settings | Full system access | Owner approval |
| **Owner** | Full platform access, financial reports | All systems | Board approval |
| **Partner** | Manage own property, view own bookings | Partner portal | Hub admin approval |
| **Hub Admin** | Platform billing, partner management | Hub systems | CTO approval |

**Role Assignment:**
- New user accounts default to minimum privilege
- Role elevation requires manager approval + HR verification
- Role changes logged in `audit_trail` table

### 3.3 Account Provisioning & Deprovisioning

**Onboarding:**
- New staff accounts created within 24 hours of start date
- Initial password set via secure email link (expires in 24 hours)
- User must change password on first login
- Mandatory security awareness training within first week

**Offboarding:**
- Access revoked within 2 hours of termination notice (immediate for security incidents)
- Credentials disabled, not deleted (audit trail preservation)
- All owned resources (API keys, sessions) invalidated
- Exit interview includes equipment return and data access confirmation

**Transfers:**
- Role change requests approved by both old and new managers
- Access rights adjusted within 48 hours
- Quarterly access recertification for all users

### 3.4 Authentication Requirements

**Password Policy:**
- Minimum 12 characters (16 for admin accounts)
- Must include uppercase, lowercase, number, special character
- No reuse of last 5 passwords
- Passwords expire every 90 days (admin), 180 days (standard users)
- No password hints or security questions

**Multi-Factor Authentication (MFA):**
- **Required for:** Admin accounts, payment endpoints, production database access, API key generation
- **Recommended for:** All staff accounts
- **Methods:** TOTP (Google Authenticator, Authy), SMS backup
- **Enrollment:** Within 7 days of account creation
- **Recovery:** Backup codes (printed and secured), admin reset with identity verification

**Failed Login Protection:**
- Account lockout after 5 failed attempts
- 15-minute cooldown period
- Security team notified after 3 lockouts in 24 hours
- CAPTCHA after 3 failed attempts

### 3.5 Session Management

**Session Timeout:**
- Idle timeout: 30 minutes (no activity)
- Absolute timeout: 8 hours (regardless of activity)
- Explicit logout invalidates session server-side
- "Remember me" option extends to 30 days (requires MFA)

**Session Security:**
- Session tokens stored in httpOnly, secure, SameSite cookies
- Session binding to IP and user agent (with change notification)
- Concurrent session limit: 3 per user
- "Log out everywhere" feature available to users

### 3.6 Administrative Access

**Production Access:**
- Requires explicit approval for each access session
- All actions logged with user ID, timestamp, action, IP address
- Jump host/bastion required for database access (Neon console)
- Time-limited access (4-hour sessions)

**Emergency Access:**
- Break-glass procedure for outages (on-call CTO)
- Emergency access logged and reviewed within 24 hours
- Post-incident review required for all emergency access

**Third-Party Access:**
- Vendor access requires signed NDA + security questionnaire
- Limited to specific systems (no blanket access)
- Access expires automatically after 90 days
- Quarterly review of all third-party accounts

### 3.7 Remote Access

**Allowed Methods:**
- Web-based admin dashboard (HTTPS only)
- Vercel CLI (authenticated via OAuth)
- Neon console (MFA required)
- GitHub (SSH keys + MFA)

**Prohibited:**
- VPN not required (serverless architecture)
- Direct database connections from personal devices
- Unencrypted protocols (FTP, Telnet, HTTP)

**Device Requirements:**
- Company-issued or BYOD with endpoint protection
- Full disk encryption required
- Up-to-date OS and antivirus
- Screen lock after 5 minutes of inactivity

### 3.8 API Access Control

**API Key Management:**
- API keys generated via admin dashboard only
- Keys tied to specific permissions (read-only, write, admin)
- Keys rotated every 90 days (automated expiration)
- Keys never logged in plaintext

**Rate Limiting:**
- Authentication endpoints: 10 requests/minute/IP
- Read endpoints: 100 requests/minute/user
- Write endpoints: 30 requests/minute/user
- Payment initiation: 5 requests/minute/user

**API Authentication:**
- Bearer token (JWT) for all API requests
- Token expiration: 15 minutes (access), 7 days (refresh)
- OAuth 2.0 for third-party integrations

### 3.9 Tenant Isolation

**Row-Level Security (RLS):**
- All database tables enforce `tenant_id` filtering
- Partner queries cannot access hub or other partner data
- RLS policies verified via `scripts/db/verify-tenant-rls.ts`
- Monthly RLS audit logs reviewed by CTO

**Data Segregation:**
- Separate Qdrant collections per tenant for Sofia AI
- File storage namespaced by tenant (Vercel Blob)
- Logs include tenant context for all operations

### 3.10 Access Reviews

**Quarterly Review:**
- CTO reviews all admin and manager accounts
- HR confirms employment status for all accounts
- Unused accounts (90+ days inactive) flagged for removal
- Report submitted to executive team

**Annual Recertification:**
- All users recertify access requirements
- Managers approve direct report access rights
- Third-party access re-authorized
- Documentation updated with current role definitions

## 4. Roles and Responsibilities

**CTO (Policy Owner):**
- Overall access control framework
- Approve admin and owner role assignments
- Quarterly access reviews
- Exception approvals

**HR Manager:**
- Employee onboarding/offboarding coordination
- Background checks for staff with data access
- Termination notifications to IT

**Managers:**
- Approve access for direct reports
- Annual access recertification
- Report suspicious access attempts

**Users:**
- Protect credentials (no sharing)
- Report lost/compromised credentials immediately
- Lock workstations when unattended
- Comply with acceptable use policy

**IT/Technical Lead:**
- Implement technical access controls
- User provisioning/deprovisioning
- Monitor access logs for anomalies
- Respond to access-related incidents

## 5. Enforcement

**Non-Compliance:**
- First violation: Written warning + mandatory retraining
- Second violation: Suspension of access + review with manager
- Third violation: Termination (staff) or contract cancellation (vendor)
- Immediate termination for willful circumvention of controls

**Audit Trail:**
- All access control events logged in `audit_trail` table
- Logs retained for 7 years (Namibian ETA requirement)
- Weekly log reviews by technical lead
- Monthly reports to CTO

## 6. Exceptions

**Requesting an Exception:**
- Submit written justification to CTO
- Business need documented
- Compensating controls identified
- Time-limited (max 90 days)
- Re-approved quarterly if extended

**Approved Exceptions:**
- Documented in `docs/compliance/exceptions/`
- Reviewed monthly by CTO
- Automatically expire unless renewed

## 7. Related Policies

- Information Security Policy
- Password Policy
- Incident Response Plan
- Acceptable Use Policy
- Remote Access Policy

## 8. Compliance & Legal

**Namibian Regulations:**
- Bank of Namibia PSD-12: Operational and cybersecurity standards for payment systems
- Electronic Transactions Act 2019: Secure electronic authentication
- Labour Act 2007: Employee data protection

**International Standards:**
- SOC 2 Trust Services Criteria (CC6.1-6.3)
- ISO 27001:2013 (A.9 Access Control)
- NIST Cybersecurity Framework (PR.AC, PR.PT)

## 9. Review and Updates

- **Review Frequency:** Annual (or after significant incidents)
- **Next Review Date:** May 16, 2027
- **Version Control:** All changes tracked in Git
- **Approval:** Executive Sponsor signature required

---

## Approval

**Policy Approved By:**

_________________________  
[Executive Sponsor Name]  
CEO / Owner  
Date: _______________

**Policy Reviewed By:**

_________________________  
[CTO Name]  
Chief Technology Officer  
Date: _______________

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 16, 2026 | CTO | Initial policy for SOC 2 Type II compliance |
