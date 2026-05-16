# Information Security Policy

**Effective Date:** May 16, 2026  
**Policy Owner:** CTO  
**Review Frequency:** Annual  
**TSC Reference:** CC6.1  
**Approval Required:** Executive Sponsor (CEO/Owner)

---

## 1. Purpose

This Information Security Policy establishes the framework for protecting Hotel Etuna's information assets, systems, and customer data. It defines security requirements, roles and responsibilities, and compliance obligations aligned with SOC 2 Trust Services Criteria.

## 2. Scope

This policy applies to:
- All Hotel Etuna staff members (permanent, contract, temporary)
- All information systems and data assets (production, staging, development)
- All third-party service providers with access to Hotel Etuna systems or data
- Physical and virtual infrastructure (Vercel, Neon, Qdrant, etc.)

## 3. Information Security Objectives

Hotel Etuna commits to:
1. **Confidentiality:** Protect guest PII, payment data, and business information from unauthorized disclosure
2. **Integrity:** Ensure data accuracy and prevent unauthorized modification
3. **Availability:** Maintain 99.5%+ uptime for booking and payment systems (per SLA)
4. **Compliance:** Meet Namibian regulatory requirements (PSD-12, ETA, PSMA) and SOC 2 standards

## 4. Policy Statements

### 4.1 Data Classification

All data shall be classified into one of four categories:

| Classification | Definition | Examples | Handling |
|----------------|------------|----------|----------|
| **Restricted** | Highly sensitive; breach would cause severe harm | Payment credentials, API keys, database passwords | Encrypted at rest & transit; access logged; MFA required |
| **Confidential** | Sensitive business/customer data | Guest PII, booking details, folio records, financial reports | Encrypted at rest & transit; role-based access |
| **Internal** | Non-public business information | Policies, procedures, internal communications | Access restricted to staff; no public sharing |
| **Public** | Approved for public disclosure | Marketing materials, room descriptions, pricing (gated) | No restrictions (after approval) |

### 4.2 Access Control

- **Least Privilege:** Users granted minimum access required for job function
- **Role-Based Access (RBAC):** Access via predefined roles (owner, manager, admin, staff, partner)
- **MFA Enforcement:** Multi-factor authentication required for admin accounts and payment endpoints
- **Access Reviews:** Quarterly review of user access rights; annual recertification
- **Account Provisioning:** New accounts approved by manager; deprovisioning within 24 hours of termination

### 4.3 Authentication

- **Password Requirements:** Minimum 12 characters, complexity, no reuse of last 5 passwords
- **Password Storage:** Bcrypt hashing (cost factor 12+)
- **Session Management:** 30-minute idle timeout, 8-hour absolute timeout
- **Failed Login Attempts:** Account lockout after 5 failed attempts; 15-minute cooldown

### 4.4 Encryption

- **Data in Transit:** TLS 1.3 for all HTTPS connections (Vercel enforced)
- **Data at Rest:** AES-256 encryption for database (Neon default), secrets stored in Vercel environment (encrypted)
- **Secure Key Management:** Secrets never committed to git; stored in 1Password team vault + Vercel env vars

### 4.5 Network Security

- **Firewall:** Vercel-managed WAF (inherited control)
- **Segmentation:** Tenant isolation via RLS policies; partners cannot access hub data
- **VPN:** Not currently required (serverless architecture); review annually
- **Monitoring:** Vercel logs + Neon pgAudit; weekly log reviews

### 4.6 Vulnerability Management

- **Dependency Scanning:** Weekly `npm audit`; critical vulnerabilities patched within 7 days
- **Code Reviews:** All code changes require pull request approval
- **Penetration Testing:** Annual third-party pentest
- **Security Updates:** Apply security patches monthly (Vercel/Neon auto-updates; Node.js/Next.js manual)

### 4.7 Incident Response

- **Detection:** Automated alerts for suspicious activity (failed logins, 5xx errors, rate limits)
- **Response Team:** CTO (Incident Commander), Senior Developer (Technical Lead), Ops Manager (Communications)
- **Notification Timelines:**
  - Internal: CTO within 15 minutes of P1 incident
  - Bank of Namibia (BoN): Within 72 hours (PSD-12)
  - Affected Guests: Within 72 hours if PII breach
- **Documentation:** All incidents logged in `cybersecurity_incidents` table
- **Post-Incident:** Lessons learned report within 7 days; remediation plan within 30 days

### 4.8 Backup & Recovery

- **Database Backups:** Neon PITR + daily snapshots (inherited control)
- **Application Code:** Git repository on GitHub (version controlled)
- **Configuration:** Vercel settings exported monthly
- **Recovery Objectives:**
  - RTO (Recovery Time Objective): 24 hours
  - RPO (Recovery Point Objective): 24 hours max data loss
- **Testing:** Quarterly restore tests; annual failover drill

### 4.9 Third-Party Risk Management

- **Vendor Due Diligence:** SOC 2 / ISO 27001 / PCI-DSS attestations required for critical vendors
- **Critical Vendors:** Vercel (hosting), Neon (database), Adumo (payments), Qdrant (vector DB)
- **Contracts:** Data processing agreements (DPA) required; security terms in MSA
- **Annual Review:** Re-assess vendor risks annually; request updated attestations

### 4.10 Data Retention & Disposal

- **Retention Schedule:**
  - Audit logs: 7 years (PSD-12 + tax compliance)
  - Guest bookings: 7 years (VAT records)
  - Cybersecurity incidents: 7 years
  - Support tickets: 3 years
  - Marketing consent: Until withdrawal
- **Secure Disposal:** Database DELETE operations logged; physical media shredded

## 5. Roles & Responsibilities

| Role | Responsibilities |
|------|-----------------|
| **Executive Sponsor (CEO/Owner)** | Approve policy; allocate budget; champion security culture |
| **CTO (Policy Owner)** | Implement and enforce policy; manage risk; oversee incident response |
| **Senior Developer (Technical Lead)** | Configure security controls; conduct log reviews; evidence collection |
| **Operations Manager** | Vendor management; staff training; policy communication |
| **All Staff** | Follow policy; report incidents; complete annual security training |

## 6. Compliance & Enforcement

- **Training:** Annual security awareness training (mandatory for all staff)
- **Policy Acknowledgment:** All staff must sign policy acknowledgment form annually
- **Violations:** Security violations escalated to CTO; may result in disciplinary action up to termination
- **Monitoring:** Quarterly compliance audits; annual SOC 2 assessment

## 7. Related Documents

- Access Control Policy (CC6.1)
- Incident Response Plan
- Business Continuity Plan
- Data Classification Policy (CC6.7)
- Password Policy (CC6.1)
- Vendor Management Policy (CC9.1)
- Change Management Policy (CC8.1)

## 8. Policy Review & Updates

This policy shall be reviewed annually and updated as needed to reflect:
- Changes in business operations
- New regulatory requirements
- Lessons learned from incidents
- SOC 2 audit findings

## 9. Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Policy Owner (CTO)** | ______________ | _________________ | _______ |
| **Executive Sponsor (CEO)** | ______________ | _________________ | _______ |

---

**Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 16, 2026 | CTO | Initial policy aligned with SOC 2 TSC |

**Next Review Date:** May 16, 2027
