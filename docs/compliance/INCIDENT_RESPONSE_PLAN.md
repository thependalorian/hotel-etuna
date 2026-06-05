# Incident Response Plan

**Effective Date:** May 16, 2026  
**Plan Owner:** CTO  
**Review Frequency:** Biannual  
**TSC Reference:** CC7.3, CC7.4, CC7.5  
**Last Tested:** [Date of tabletop exercise]

---

## 1. Executive Summary

This Incident Response Plan defines Hotel Etuna's procedures for detecting, responding to, and recovering from cybersecurity incidents. It aligns with Bank of Namibia (BoN) PSD-12 requirements and SOC 2 Trust Services Criteria.

**Key Objectives:**
- Minimize impact of security incidents on operations and customers
- Contain and eradicate threats quickly
- Comply with 72-hour BoN reporting requirement (PSD-12)
- Learn from incidents to prevent recurrence

---

## 2. Incident Classification

### 2.1 Priority Levels

| Priority | Definition | Response Time | Examples |
|----------|-----------|---------------|----------|
| **P1 — Critical** | Severe impact; business-critical systems down or data breach confirmed | **15 minutes** (24/7) | Ransomware, payment system breach, database compromise, major data leak |
| **P2 — High** | Major feature broken; suspected intrusion; compliance violation | **1 hour** (business hours) | Unauthorized access attempt, failed audit control, major vulnerability |
| **P3 — Medium** | Minor security issue; potential vulnerability; policy violation | **4 hours** (business hours) | Phishing attempt, failed login spike, outdated dependency |
| **P4 — Low** | Security scan finding; informational alert | **1 business day** | Non-critical `npm audit` warning, TLS config tuning |

### 2.2 Incident Types

| Type | Description | Typical Priority |
|------|-------------|-----------------|
| **Data Breach** | Unauthorized access to guest PII or confidential data | P1 |
| **Malware/Ransomware** | Malicious software detected or active | P1 |
| **Unauthorized Access** | Compromised credentials or privilege escalation | P1-P2 |
| **DDoS Attack** | Coordinated traffic overload | P1-P2 |
| **Insider Threat** | Malicious or negligent employee action | P2 |
| **Phishing/Social Engineering** | Attempted credential theft | P3 |
| **Vulnerability** | Unpatched security flaw | P3-P4 |
| **Policy Violation** | Staff non-compliance with security policy | P4 |

---

## 3. Incident Response Team (IRT)

### 3.1 Core Team

| Role | Name | Contact | Responsibilities |
|------|------|---------|-----------------|
| **Incident Commander** | CTO — George Nekwaya | pendanek@gmail.com | Overall incident leadership; communications; BoN notification |
| **Technical Lead** | Lead Developer (on-call) | support@hoteletuna.com | Investigation; containment; forensics; system recovery |
| **Communications Lead** | Hotel Manager | +264 65 231 177 | Internal comms; guest notification; front-desk coordination |
| **Legal Liaison** | External Counsel (TBC) | To be appointed before SOC 2 audit | Regulatory guidance; breach notification requirements |

> ⚠️ **Action required:** Appoint Legal Liaison before SOC 2 Type I assessment.

### 3.2 Extended Team (On-Call)

- **Vercel Support:** https://vercel.com/support (Enterprise SLA) — Platform issues
- **Neon Support:** https://neon.tech/support — Database issues
- **Adumo Support:** Contact Buffr Financial Services who holds the merchant agreement — Payment issues
- **Bank of Namibia Cybersecurity Unit:** BoN PSD-12 reporting channel — cybersecurity@bon.com.na (verify current address at bon.com.na)

---

## 4. Incident Response Workflow

### Phase 1: Detection (0-15 minutes)

**Goal:** Identify and confirm incident

**Activities:**
- [ ] Alert received (monitoring, staff report, vendor notification)
- [ ] Initial triage by on-call staff
- [ ] Confirm incident is real (not false positive)
- [ ] Classify priority (P1-P4) and type
- [ ] Notify Incident Commander if P1/P2

**Detection Sources:**
- Vercel error rate alerts (>5% 5xx errors)
- Failed login spike (>50 attempts/hour from same IP)
- Neon query anomaly (unusual data access patterns)
- Adumo webhook failures or payment discrepancies
- Staff report via support ticket or emergency phone
- Third-party security researcher disclosure

**Evidence Collection:**
- Screenshot alerts
- Copy log entries (Vercel, Neon, `audit_trail`)
- Record detection timestamp (UTC)

---

### Phase 2: Triage & Analysis (15-60 minutes)

**Goal:** Understand scope and impact

**Activities:**
- [ ] Assemble IRT (Incident Commander, Technical Lead, Communications Lead)
- [ ] Create incident record in `cybersecurity_incidents` table
- [ ] Investigate root cause (logs, system access, user activity)
- [ ] Determine affected systems and data
- [ ] Estimate impact (number of guests, financial loss, downtime)
- [ ] Document findings in incident log

**Key Questions:**
1. What systems are affected?
2. Is customer data compromised? (PII, payment data, credentials?)
3. Is the threat still active?
4. How did the attacker gain access?
5. Are there other compromised accounts/systems?

**Tools:**
- Vercel logs (last 7 days)
- Neon query logs (pgAudit)
- `audit_trail` table queries
- GitHub commit history (unexpected code changes)
- Adumo transaction logs

---

### Phase 3: Containment (1-4 hours)

**Goal:** Stop the incident from spreading

**Activities:**
- [ ] **Short-term containment** (immediate isolation)
  - Disable compromised user accounts
  - Revoke API keys if exposed
  - Block malicious IPs at Vercel firewall (if applicable)
  - Isolate affected tenant (if multi-tenant breach)
  - Enable maintenance mode if needed
- [ ] **Long-term containment** (prepare for eradication)
  - Patch vulnerable systems
  - Rotate all secrets (Vercel env vars, database passwords, API keys)
  - Backup affected data for forensics
  - Monitor for reinfection attempts

**Communication:**
- Internal: Notify all IRT members + executive team
- External: No guest notification until eradication complete (legal guidance)

---

### Phase 4: Eradication (4-24 hours)

**Goal:** Remove threat completely

**Activities:**
- [ ] Remove malware/unauthorized access tools
- [ ] Delete malicious code or configurations
- [ ] Apply security patches (dependencies, platform updates)
- [ ] Rebuild compromised systems from clean backups (if needed)
- [ ] Verify all attack vectors closed
- [ ] Confirm no backdoors remain (code review, log analysis)

**Verification:**
- Run `npm audit` (no critical/high vulnerabilities)
- Review all user accounts (no unauthorized accounts)
- Check Vercel/Neon access logs (no suspicious activity)
- Test authentication flows (MFA working, no bypass)

---

### Phase 5: Recovery (24-48 hours)

**Goal:** Restore normal operations

**Activities:**
- [ ] Restore systems from backup (if needed)
- [ ] Re-enable disabled accounts (after password reset)
- [ ] Restore services to full availability
- [ ] Monitor closely for 48 hours (watch for reinfection)
- [ ] Update monitoring rules (prevent similar incidents)

**Validation:**
- Run smoke test (§0 in TASK.md)
- Verify uptime restored (Vercel analytics)
- Check for error rate spikes (should return to <1%)
- Confirm payment processing working (test Adumo transaction)

---

### Phase 6: Post-Incident (7 days)

**Goal:** Learn and improve

**Activities:**
- [ ] Conduct post-incident review meeting (IRT + Executive Sponsor)
- [ ] Document lessons learned:
  - What went well?
  - What went poorly?
  - What should be changed?
- [ ] Update incident response plan (if needed)
- [ ] Implement remediation actions (close gaps)
- [ ] Update risk register (new threats identified)
- [ ] Communicate outcome to staff (without blame)

**Deliverable:** Lessons Learned Report (`docs/compliance/incidents/YYYY-MM-DD-postmortem.md`)

---

## 5. Notification Requirements

### 5.1 Internal Notification

| Audience | Timing | Method | Content |
|----------|--------|--------|---------|
| **IRT (P1)** | 15 minutes | Phone + Slack | Incident type, priority, systems affected |
| **Executive Team (P1/P2)** | 1 hour | Email + meeting | Impact assessment, containment status |
| **All Staff (P1 if downtime)** | 2 hours | Email | Service interruption notice, estimated recovery time |

### 5.2 External Notification

| Recipient | Trigger | Timing | Method | Content |
|-----------|---------|--------|--------|---------|
| **Bank of Namibia (BoN)** | Any cybersecurity incident (PSD-12) | **72 hours** | Email + formal report | Incident type, systems affected, customer impact, remediation |
| **Affected Guests** | PII breach confirmed | **72 hours** | Email | What data compromised, steps taken, recommended actions |
| **CPA Auditor** | Material security event | **24 hours** | Email | Incident summary, control failures, remediation plan |
| **Vendors (Vercel, Neon)** | If vendor system involved | **4 hours** | Support ticket | Request assistance, escalate if needed |

### 5.3 BoN Reporting Template (PSD-12)

**Subject:** Cybersecurity Incident Notification — Hotel Etuna Platform

**Body:**
```
Bank of Namibia
Cybersecurity Unit
[Email address from PSD-12 guidance]

Date: [Date]
Reference: Hotel Etuna Incident [YYYY-MM-DD-XXX]

Dear BoN Cybersecurity Unit,

Pursuant to PSD-12 requirements, Buffr Financial Services CC (operating Hotel Etuna platform) 
reports the following cybersecurity incident:

1. Incident Type: [Data Breach | Unauthorized Access | DDoS | Malware | Other]
2. Detection Timestamp: [UTC]
3. Systems Affected: [Hotel Etuna booking platform, database, payment processing, etc.]
4. Customer Impact: [X guests affected; PII exposed: name, email, booking history]
5. Containment Status: [Contained | In Progress | Ongoing]
6. Eradication Status: [Complete | In Progress | Planned]
7. Root Cause: [Initial findings]
8. Remediation Plan: [Summary of actions taken and planned]
9. Estimated Recovery Date: [Date]

We will provide follow-up reports as investigation continues. For questions, contact:
- Incident Commander: [Name], [Email], [Phone]

Sincerely,
[Incident Commander Name]
[Title]
Buffr Financial Services CC
```

---

## 6. Incident Log Template

All incidents must be recorded in `cybersecurity_incidents` table:

```sql
INSERT INTO cybersecurity_incidents (
  id,
  tenant_id,
  incident_type,
  severity,
  description,
  detection_timestamp,
  containment_timestamp,
  eradication_timestamp,
  recovery_timestamp,
  affected_systems,
  affected_records_count,
  bon_reported_at,
  resolution_notes,
  root_cause_analysis,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '[HUB_TENANT_ID]',
  'unauthorized_access',
  'high',
  'Suspicious login attempts from foreign IP; compromised staff credentials',
  '2026-05-16T14:23:00Z',
  '2026-05-16T15:45:00Z',
  '2026-05-16T18:00:00Z',
  '2026-05-17T09:00:00Z',
  ARRAY['authentication', 'user_accounts'],
  1,
  '2026-05-18T10:00:00Z',
  'Account disabled; password reset; MFA enforced; IP blocked',
  'Phishing email led to credential theft; staff trained on email security',
  NOW(),
  NOW()
);
```

---

## 7. Communication Templates

### 7.1 Guest Notification (Data Breach)

**Subject:** Important Security Notice — Hotel Etuna

**Body:**
```
Dear [Guest Name],

We are writing to inform you of a security incident involving Hotel Etuna's booking platform 
that may have affected your personal information.

**What Happened:**
On [Date], we discovered that [brief description, e.g., "unauthorized access to our customer 
database occurred between [dates]"].

**What Information Was Involved:**
The following information may have been accessed:
- Name
- Email address
- Phone number
- Booking dates
- [Other specific fields]

**What We Are Doing:**
- We have contained the incident and secured our systems
- We have notified the Bank of Namibia as required
- We are working with cybersecurity experts to investigate
- We have implemented additional security measures

**What You Can Do:**
- Monitor your email for suspicious activity
- Change your Hotel Etuna password immediately (if applicable)
- Be cautious of phishing emails claiming to be from Hotel Etuna
- Contact us if you notice any unusual activity

**More Information:**
For questions, please contact:
- Email: [Email]
- Phone: [Phone]
- Reference: Incident [ID]

We sincerely apologize for this incident and any inconvenience it may cause. The security of 
your information is our top priority.

Sincerely,
[Name]
[Title]
Hotel Etuna / Buffr Financial Services CC
```

---

## 8. Tabletop Exercise Schedule

**Purpose:** Test incident response procedures without actual incident

**Frequency:** Biannual (every 6 months)

**Participants:**
- IRT core team (Incident Commander, Technical Lead, Communications Lead)
- Executive Sponsor
- External counsel (optional)

**Scenario Examples:**
1. **Payment Breach:** Adumo reports unauthorized access to payment sessions; 500 card tokens exposed
2. **Ransomware:** Staff laptop infected; threat actor demands N$50,000 Bitcoin ransom
3. **Insider Threat:** Fired staff member deletes guest records before account disabled
4. **DDoS Attack:** Platform traffic spikes 100x; Vercel auto-scaling hits cost limits

**Exercise Format:**
- 90-minute facilitated workshop
- Walk through incident response workflow
- Identify gaps in plan or team preparedness
- Document action items for plan improvements

**Evidence:** Meeting notes saved to `docs/compliance/incidents/tabletop-YYYY-MM-DD.md`

---

## 9. Tooling & Resources

### 9.1 Investigation Tools

- **Vercel Logs:** https://vercel.com/[team]/[project]/logs
- **Neon Query Logs:** `SELECT * FROM pg_stat_statements;` (if pgAudit enabled)
- **Audit Trail:** `SELECT * FROM audit_trail WHERE created_at >= '[timestamp]' ORDER BY created_at DESC;`
- **GitHub Audit Log:** https://github.com/[org]/[repo]/settings/audit-log

### 9.2 Forensics Evidence

- **Network Logs:** Vercel edge logs (7-day retention; export ASAP)
- **Database Snapshots:** Neon PITR (point-in-time recovery)
- **Code State:** Git commit hash at incident time
- **Environment Config:** Vercel env var history (export before incident)

### 9.3 External Resources

- **BoN Cybersecurity Guidance:** [PSD-12 incident reporting requirements]
- **NIST Incident Handling Guide:** https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r2.pdf
- **SANS Incident Handler's Handbook:** https://www.sans.org/white-papers/33901/

---

## 10. Plan Maintenance

**Review Schedule:**
- **Biannual:** Formal plan review + tabletop exercise
- **Post-Incident:** Update within 7 days of any P1/P2 incident
- **Annual:** Full plan refresh + approval renewal

**Version Control:**
- Plan stored in `docs/compliance/INCIDENT_RESPONSE_PLAN.md`
- All changes committed to git with justification
- Notify all IRT members of plan updates

---

## 11. Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Plan Owner (CTO)** | ______________ | _________________ | _______ |
| **Executive Sponsor (CEO)** | ______________ | _________________ | _______ |

---

**Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 16, 2026 | CTO | Initial plan aligned with SOC 2 TSC + PSD-12 |

**Next Review Date:** November 16, 2026 (or after next P1/P2 incident)  
**Last Tabletop Exercise:** [Date] (conduct within 30 days of plan approval)
