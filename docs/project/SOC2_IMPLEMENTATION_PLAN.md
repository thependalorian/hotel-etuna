# SOC 2 Type II Implementation Plan — Hotel Etuna
**Effective Date:** May 16, 2026  
**Target Audit Date:** November 2026 (6-month observation period)  
**Framework:** AICPA Trust Services Criteria (TSC)  
**Scope:** Security (Mandatory) + Availability (Optional)

---

## Executive Summary

Hotel Etuna will pursue **SOC 2 Type II certification** for the hospitality platform to meet enterprise procurement requirements and demonstrate independent attestation of security controls. This plan leverages existing infrastructure and follows a 4-phase approach over 6 months.

**Current Compliance:** ~45% (Security baseline complete, evidence automation needed)  
**Target:** 95%+ by audit engagement  
**Budget Estimate:** N$238,500 - N$298,500 (CPA fees, tooling, staff time, penetration test — see §9 for full breakdown)

### Quick start (Week 1)

| Action | Owner | Artifact |
|--------|--------|----------|
| Kick-off + budget approval | CEO / CTO | This plan § Phase 1 |
| Run readiness agents | Technical lead | `/compliance/soc2` or `npx tsx scripts/soc2/collect-evidence.ts` |
| Security reviews on new code | All devs | `docs/SECURITY_PROMPT_PACK.md` §14; `npm run security:preflight` before deploy |
| CPA RFP (3 firms) | CTO | Quotes for Type I readiness + Type II |

**Automation (single code path):** `Soc2AuditOrchestrator` → `Soc2ComplianceService` (export only) → `/api/compliance/soc2` + `/api/compliance/soc2/audit`.

**Not audit-ready until:** 21 policies signed, vendor SOC packs on file, 6-month evidence window, CPA engagement.

---

## Table of Contents

1. [Current Compliance Assessment](#1-current-compliance-assessment)
2. [Scope Definition](#2-scope-definition)
3. [Gap Analysis](#3-gap-analysis)
4. [Phase 1: Preparation (Weeks 1-2)](#phase-1-preparation-weeks-1-2)
5. [Phase 2: Implementation (Weeks 3-8)](#phase-2-implementation-weeks-3-8)
6. [Phase 3: Evidence Collection (Weeks 9-24)](#phase-3-evidence-collection-weeks-9-24)
7. [Phase 4: Audit Engagement (Week 25)](#phase-4-audit-engagement-week-25)
8. [Mapping to Existing Systems](#mapping-to-existing-systems)
9. [Budget & Resources](#budget--resources)
10. [Risk Register](#risk-register)

---

## 1. Current Compliance Assessment

### What's Already Compliant ✅

| Control Area | Status | Evidence Location |
|--------------|--------|-------------------|
| **Access Control (CC6.1-6.3)** | ✅ 85% | `lib/auth/`, `proxy.ts`, RLS policies |
| **Logical Security (CC6.6-6.7)** | ✅ 90% | `SessionTimeoutWrapper`, 2FA on payments |
| **Change Management (CC8.1)** | ✅ 80% | Git commits, `database/drizzle/` migrations |
| **System Operations (CC7.1-7.2)** | ✅ 70% | Vercel monitoring, Neon backups |
| **Risk Assessment (CC3.1-3.4)** | 🟡 40% | Informal; needs documented process |
| **Monitoring (CC7.2-7.3)** | 🟡 50% | Vercel logs, no centralized SIEM |
| **Incident Response (CC7.3-7.5)** | 🟡 30% | `cybersecurity_incidents` table exists, no formal plan |
| **Data Classification (CC6.7)** | 🟡 35% | RLS enforces tenant isolation, no formal policy |

**Overall Score:** 58/100 (Good foundation, needs formalization + automation)

### What Needs Work 🚧

| Gap | Priority | Effort | Target Week |
|-----|----------|--------|-------------|
| Formal security policies (21 policies) | P0 | High | Week 4 |
| Centralized logging & monitoring | P0 | Medium | Week 6 |
| Incident response plan | P0 | Medium | Week 5 |
| Vendor risk assessments (Vercel, Neon, Adumo) | P1 | Low | Week 8 |
| Business continuity plan | P1 | Medium | Week 7 |
| Annual risk assessment process | P1 | Low | Week 3 |
| Evidence automation (Vanta/Drata) | P1 | Low | Week 10 |

---

## 2. Scope Definition

### In-Scope Systems

| System | Technology | Purpose | Data Classification |
|--------|-----------|---------|---------------------|
| **Hotel Etuna Platform** | Next.js 15 + Vercel | PMS, bookings, CRM, folio | Confidential (guest PII) |
| **Database** | Neon PostgreSQL | Transactional data | Confidential |
| **Vector Store** | Qdrant Cloud | Sofia AI knowledge | Public + Internal |
| **Payment Processing** | Adumo Virtual | Card payments (PCI out-of-scope) | Restricted (payment sessions) |
| **Authentication** | NextAuth.js | Session management | Restricted (credentials) |
| **Email** | SMTP (transactional) | Guest communications | Internal |

### Out-of-Scope

- **Development environments** (localhost, staging)
- **Adumo's PCI-DSS environment** (inherited control)
- **Third-party SaaS** (Vercel infra, Neon DB internals — vendor attestations cover these)
- **Property Wi-Fi and on-site hardware**

### Trust Services Criteria (TSC) Selection

**Mandatory:**
- ✅ **Security (CC6-CC7)** — Covers access control, encryption, monitoring, incident response

**Optional (Recommended):**
- ✅ **Availability (A1)** — System uptime, backup/recovery, DDoS mitigation
- ⚠️ **Confidentiality (C1)** — Data access restrictions, encryption, secure disposal (overlap with Security; may defer to Type II)
- ⚠️ **Processing Integrity (PI1)** — Transaction accuracy, folio calculations (hospitality-specific; consider for Type II)
- ❌ **Privacy (P1-P8)** — GDPR/POPIA compliance (defer until data protection framework enacted)

**Decision:** Start with **Security only** for Type I readiness assessment (6-8 weeks). Add **Availability** for Type II observation period (6 months).

---

## 3. Gap Analysis

### Critical Gaps (Block Audit)

| Control ID | TSC Reference | Gap | Remediation | Owner | Target |
|-----------|---------------|-----|-------------|-------|--------|
| **AC-1** | CC6.1 | No formal access control policy | Write policy, obtain executive sign-off | CTO | Week 4 |
| **IR-1** | CC7.3 | No documented incident response plan | Draft plan, conduct tabletop exercise | CTO | Week 5 |
| **LOG-1** | CC7.2 | Logs scattered (Vercel, Neon, app) | Implement centralized logging (Vercel Analytics + Neon export) | Dev | Week 6 |
| **RISK-1** | CC3.1 | No annual risk assessment | Document risk assessment process + run initial assessment | CTO | Week 3 |
| **BC-1** | CC7.1 | No business continuity plan | Draft BCP with RTO/RPO targets | CTO | Week 7 |

### Medium Gaps (Improve Score)

| Control ID | TSC Reference | Gap | Remediation | Owner | Target |
|-----------|---------------|-----|-------------|-------|--------|
| **VENDOR-1** | CC9.1 | No vendor risk assessments | Assess Vercel, Neon, Adumo; obtain SOC 2 reports | Ops | Week 8 |
| **DATA-1** | CC6.7 | No data classification policy | Classify data (public, internal, confidential, restricted) | CTO | Week 4 |
| **TRAIN-1** | CC2.2 | No security awareness training | Annual training program for staff | HR | Week 12 |
| **BG-1** | CC2.1 | No background checks | Implement background check policy for new hires | HR | Week 8 |

### Low Priority (Enhancement)

| Control ID | TSC Reference | Gap | Remediation | Owner | Target |
|-----------|---------------|-----|-------------|-------|--------|
| **SIEM-1** | CC7.2 | No SIEM/alerting | Implement real-time alerting (Vercel + email) | Dev | Week 16 |
| **PEN-1** | CC7.1 | No penetration testing | Annual pentest by 3rd party | CTO | Month 6 |
| **VULN-1** | CC7.1 | No vulnerability scanning | Automate `npm audit` in CI/CD | Dev | Week 10 |

---

## Phase 1: Preparation (Weeks 1-2)

### Objectives
- Formalize scope
- Conduct gap analysis
- Assemble cross-functional team
- Set timeline and budget

### Tasks

#### Week 1: Stakeholder Alignment
- [ ] **Executive briefing** — Present SOC 2 value proposition to Etuna leadership
- [ ] **Budget approval** — Secure N$50K-150K for CPA, tooling, staff time
- [ ] **Team formation** — Assign:
  - **Program Lead:** CTO (overall accountability)
  - **Technical Lead:** Senior Developer (evidence collection)
  - **Compliance Liaison:** Operations Manager (policies, vendor mgmt)
  - **Executive Sponsor:** CEO/Owner (policy sign-off)
- [ ] **Kick-off meeting** — Review timeline, assign responsibilities

#### Week 2: Scope & Gap Analysis
- [ ] **Finalize scope document** (this section) — Review with team
- [ ] **Run gap analysis workshop** — Use TSC Common Criteria checklist
- [ ] **Prioritize gaps** — Map to P0/P1/P2 based on audit readiness
- [ ] **Create Gantt chart** — Track milestones in project management tool
- [ ] **Review existing evidence** — Audit `lib/compliance/`, `docs/`, `database/drizzle/`

### Deliverables
- ✅ SOC 2 program charter (signed by Executive Sponsor)
- ✅ Scope document (this file)
- ✅ Gap analysis report with remediation roadmap
- ✅ Team RACI matrix

---

## Phase 2: Implementation (Weeks 3-8)

### Week 3: Risk Assessment Process

#### Task: Establish Annual Risk Assessment
- [ ] **Document risk assessment methodology** (NIST 800-30 lite)
  - Asset inventory (systems, data, personnel)
  - Threat modeling (internal, external, environmental)
  - Likelihood + impact scoring
  - Risk treatment (accept, mitigate, transfer, avoid)
- [ ] **Run initial risk assessment** — Identify top 10 risks
- [ ] **Create risk register** — Track in spreadsheet or tool
- [ ] **Executive review** — Present risk findings to leadership

**Evidence:** `docs/compliance/RISK_ASSESSMENT_2026.md`, risk register spreadsheet

---

### Week 4: Security Policies

#### Task: Write 21 Core Policies

Create policy library in `docs/compliance/policies/`:

**Mandatory Policies (SOC 2):**
1. ✅ **Access Control Policy** (CC6.1) — Password complexity, MFA, least privilege
2. ✅ **Acceptable Use Policy** (CC2.1) — Staff device usage, email guidelines
3. ✅ **Information Security Policy** (CC6.1) — Overarching security posture
4. ✅ **Incident Response Policy** (CC7.3) — Breach notification, containment
5. ✅ **Change Management Policy** (CC8.1) — Code deploy approval process
6. ✅ **Business Continuity Policy** (CC7.1) — Disaster recovery procedures
7. ✅ **Data Classification Policy** (CC6.7) — Public/Internal/Confidential/Restricted
8. ✅ **Data Retention Policy** (CC6.5) — Retention schedules, legal hold
9. ✅ **Vendor Management Policy** (CC9.1) — Due diligence, contract review
10. ✅ **Asset Management Policy** (CC6.2) — Hardware/software inventory
11. ✅ **Cryptography Policy** (CC6.7) — Encryption standards (TLS 1.2+, AES-256)
12. ✅ **Password Policy** (CC6.1) — 12+ chars, complexity, rotation
13. ✅ **Remote Access Policy** (CC6.6) — VPN, secure home networks
14. ✅ **Physical Security Policy** (CC6.4) — Office access, device locks
15. ✅ **Network Security Policy** (CC6.6) — Firewall rules, segmentation
16. ✅ **Logging & Monitoring Policy** (CC7.2) — What to log, retention
17. ✅ **Backup Policy** (CC7.1) — Daily backups, offsite storage, test restores
18. ✅ **Data Protection Policy** (CC6.7) — GDPR/POPIA alignment (when enacted)
19. ✅ **HR Security Policy** (CC2.1) — Background checks, offboarding
20. ✅ **Training Policy** (CC2.2) — Annual security awareness training
21. ✅ **Code of Conduct** (CC2.1) — Ethical standards, conflicts of interest

**Policy Template Structure:**
```markdown
# [Policy Name]

**Effective Date:** [Date]  
**Owner:** [Role]  
**Review Frequency:** Annual  
**TSC Reference:** [CC6.1, etc.]

## Purpose
[Why this policy exists]

## Scope
[Who/what it applies to]

## Policy Statement
[Specific requirements]

## Roles & Responsibilities
[Who does what]

## Enforcement
[Consequences of non-compliance]

## Related Documents
[Links to procedures, standards]

## Approval
- **Policy Owner:** [Name], [Date]
- **Executive Sponsor:** [Name], [Date]
```

**Deliverable:** `docs/compliance/policies/*.md` (21 policies)

---

### Week 5: Incident Response Plan

#### Task: Formalize Incident Response Playbook

**File:** `docs/compliance/INCIDENT_RESPONSE_PLAN.md`

**Contents:**
1. **Incident Classification**
   - **P1 — Critical:** Data breach, payment system down, ransomware
   - **P2 — High:** Major feature broken, suspected intrusion
   - **P3 — Medium:** Minor security issue, failed login spike
   - **P4 — Low:** Policy violation, security scan finding

2. **Response Team**
   - **Incident Commander:** CTO
   - **Technical Lead:** Senior Developer
   - **Communications Lead:** Operations Manager
   - **Legal Liaison:** External counsel (on retainer)

3. **Response Workflow**
   ```
   Detection → Triage → Containment → Eradication → Recovery → Lessons Learned
   ```

4. **Notification Timelines**
   - **Internal:** Notify CTO within 15 minutes of P1 detection
   - **Bank of Namibia (BoN):** Report cyber incidents within **72 hours** (PSD-12)
   - **Affected Guests:** Within **72 hours** if PII breach (GDPR/POPIA-style)
   - **CPA Auditor:** Within **24 hours** of material security event

5. **Incident Log Template**
   ```sql
   -- Leverage existing cybersecurity_incidents table
   INSERT INTO cybersecurity_incidents (
     tenant_id, incident_type, severity, description,
     detection_timestamp, bon_reported_at, resolution_notes
   ) VALUES (?, ?, ?, ?, ?, ?, ?);
   ```

6. **Tabletop Exercise**
   - **Scenario:** "Card payment breach — Adumo reports unauthorized access to payment sessions"
   - **Participants:** Response team + external counsel
   - **Frequency:** Biannual
   - **Evidence:** Meeting notes, action items

**Deliverable:** `docs/compliance/INCIDENT_RESPONSE_PLAN.md` + tabletop exercise report

---

### Week 6: Centralized Logging

#### Task: Implement Log Aggregation & Retention

**Current State:**
- Vercel function logs (7-day retention on free plan)
- Neon query logs (available via pgAudit extension)
- App audit trail in `audit_trail` table

**Target Architecture:**
```
Application → audit_trail table (Neon)
            → Vercel logs (7 days)
            → [Optional] Export to S3/GCS (90-day retention)
```

**Implementation Steps:**
1. **Enable Neon audit logs** — Configure pgAudit extension
   ```sql
   CREATE EXTENSION IF NOT EXISTS pgaudit;
   ALTER SYSTEM SET pgaudit.log = 'all';
   ```

2. **Extend audit_trail retention** — No changes needed (already persistent)

3. **Vercel log export** (Optional — paid plan)
   - Integrate with **Vercel Log Drains** → S3 bucket
   - Retention: 90 days (SOC 2 minimum)
   - Cost: ~$50/month for log storage

4. **Critical events to log** (verify in code):
   - ✅ Authentication (login, logout, failed attempts)
   - ✅ Authorization failures (403 errors)
   - ✅ Data access (guest PII queries)
   - ✅ Payment operations (Adumo initiate, confirm, webhook)
   - ✅ Admin actions (review approval, partner invite, reconciliation)
   - ✅ System changes (user role updates, property settings)
   - 🟡 **Add:** Configuration changes (env var updates via Vercel dashboard)

5. **Log review process**
   - **Owner:** CTO
   - **Frequency:** Weekly
   - **Focus:** Failed logins, 5xx errors, unusual activity
   - **Evidence:** Weekly review notes in `docs/compliance/log-reviews/YYYY-MM-DD.md`

**Deliverable:**
- ✅ pgAudit enabled on Neon
- ✅ Audit trail retention verified (no DELETE operations)
- 🟡 Vercel log export configured (if budget allows)
- ✅ Log review schedule documented

---

### Week 7: Business Continuity Plan

#### Task: Document BCP with RTO/RPO Targets

**File:** `docs/compliance/BUSINESS_CONTINUITY_PLAN.md`

**Contents:**
1. **Recovery Objectives**
   - **RTO (Recovery Time Objective):** 24 hours (full platform restore)
   - **RPO (Recovery Point Objective):** 24 hours max data loss (Neon daily backups)
   - **Critical Services:** Bookings, folio, payment processing

2. **Backup Strategy**
   - **Database:** Neon point-in-time recovery (PITR) + daily snapshots
   - **Application code:** Git repository (GitHub)
   - **Environment config:** Vercel settings (export monthly)
   - **Secrets:** 1Password team vault (encrypted)

3. **Disaster Scenarios**
   | Scenario | Likelihood | Impact | Response |
   |----------|-----------|--------|----------|
   | Neon outage | Low | High | Restore from backup to new Neon project |
   | Vercel outage | Low | High | Deploy to backup host (Railway, Render) |
   | Data corruption | Medium | Critical | Restore from PITR (Neon) |
   | Ransomware | Very Low | Critical | Wipe infected systems, restore from offline backup |
   | Key personnel unavailable | Medium | Medium | Cross-train staff, document runbooks |

4. **Recovery Procedures**
   - **Database restore:** `docs/compliance/runbooks/RESTORE_NEON_BACKUP.md`
   - **Vercel redeploy:** `docs/compliance/runbooks/DEPLOY_TO_BACKUP_HOST.md`
   - **Emergency contacts:** On-call rotation, vendor support numbers

5. **Testing Schedule**
   - **Backup restore test:** Quarterly (verify Neon PITR)
   - **Failover drill:** Biannual (deploy to backup host)
   - **BCP review:** Annual (update contact list, procedures)

**Deliverable:** `docs/compliance/BUSINESS_CONTINUITY_PLAN.md` + restore test reports

---

### Week 8: Vendor Risk Management

#### Task: Assess Third-Party Service Providers

**Critical Vendors:**

| Vendor | Service | Risk Level | Assessment Method | Evidence |
|--------|---------|-----------|-------------------|----------|
| **Vercel** | Hosting | High | Request SOC 2 Type II report | `docs/compliance/vendor-attestations/Vercel_SOC2_2026.pdf` |
| **Neon** | Database | High | Request SOC 2 Type II report | `docs/compliance/vendor-attestations/Neon_SOC2_2026.pdf` |
| **Adumo** | Payments | High | Request PCI-DSS AOC + SOC 2 | `docs/compliance/vendor-attestations/Adumo_PCI_2026.pdf` |
| **Qdrant Cloud** | Vector DB | Medium | Review security whitepaper | `docs/compliance/vendor-attestations/Qdrant_Security.pdf` |
| **Qdrant Cloud** | RAG vectors + inference | Low | Tenant-scoped KB chunks | Vendor agreement |
| **Anthropic/Groq** | LLM | Medium | Review data processing terms | Vendor agreements |

**Vendor Due Diligence Checklist:**
- [ ] Security certifications (SOC 2, ISO 27001, PCI-DSS)
- [ ] Data processing agreement (GDPR-style)
- [ ] Subprocessor list
- [ ] Incident notification terms
- [ ] Data residency (Namibia/EU/US)
- [ ] Insurance coverage (cyber liability)

**Process:**
1. **Request attestations** — Email vendor support for SOC 2 reports
2. **Review contracts** — Ensure security terms in MSA/TOS
3. **Document findings** — Create vendor risk profile for each
4. **Annual refresh** — Re-request reports every 12 months

**Deliverable:** `docs/compliance/VENDOR_RISK_ASSESSMENT_2026.md` + attestation PDFs

---

## Phase 3: Evidence Collection & Automation (Weeks 9-24)

### Week 9-10: Set Up Evidence Automation

**Option A: Manual Collection (Free)**
- Create `docs/compliance/evidence/` folder structure
- Monthly export of:
  - Vercel function logs → CSV
  - Neon audit logs → CSV
  - `audit_trail` table → CSV
  - Git commit history → CSV
  - User access list → CSV

**Option B: Automated Tool (Recommended)**
- **Vanta** (most popular) — ~$3,600/year
- **Drata** (alternative) — ~$4,800/year
- **Secureframe** (alternative) — ~$4,200/year

**Tool Benefits:**
- Auto-imports from GitHub, Vercel, Neon, Google Workspace
- Pre-mapped controls to TSC
- Continuous monitoring dashboard
- CPA audit portal (auditor can pull evidence directly)
- Saves ~80 hours of manual work over audit period

**Decision:** If budget allows, use **Vanta** (best for SaaS). Otherwise, manual collection.

**Setup Tasks:**
- [ ] Sign up for Vanta (or manual process)
- [ ] Connect integrations (GitHub, Vercel, Google Workspace)
- [ ] Configure evidence mappings
- [ ] Assign control owners in tool
- [ ] Set up continuous monitoring alerts

---

### Week 11-24: Continuous Evidence Collection (6-Month Observation Period)

**SOC 2 Type II requires demonstrating controls operate effectively over time.** Collect evidence monthly:

| Control Area | Evidence Type | Collection Method | Frequency |
|--------------|---------------|-------------------|-----------|
| **Access Control** | User access list, MFA enrollment | Vanta auto-import or CSV export | Monthly |
| **Change Management** | Git commits, PR reviews, migration files | GitHub API / manual export | Monthly |
| **Monitoring** | Weekly log review notes | Manual documentation | Weekly |
| **Incident Response** | Incident records (if any) | `cybersecurity_incidents` query | Ad-hoc |
| **Backups** | Backup logs, restore tests | Neon dashboard screenshots | Quarterly |
| **Training** | Staff training completion | Learning platform or sign-off sheet | Annual |
| **Vendor Management** | Vendor attestations, contract reviews | File storage | Annual |
| **Vulnerability Management** | `npm audit` reports, remediation timeline | CI/CD logs | Weekly |
| **Risk Assessment** | Updated risk register | Spreadsheet | Quarterly |

**Monthly Evidence Checklist:**
- [ ] Export user list (active, inactive, role assignments)
- [ ] Export audit logs (`audit_trail` table)
- [ ] Screenshot Vercel analytics (uptime, error rate)
- [ ] Export Git commits (with author, date, PR link)
- [ ] Run `npm audit` and document findings
- [ ] Review and update risk register
- [ ] Document any security incidents (even if none)
- [ ] Upload all evidence to `docs/compliance/evidence/YYYY-MM/`

**Owner:** Technical Lead (allocate 4 hours/month)

---

## Phase 4: Audit Engagement (Week 25)

### Task: Engage CPA Firm & Complete Audit

#### Step 1: Select SOC 2 Auditor (Week 21-22)

**Namibian CPA Firms with SOC 2 Capability:**
1. **Deloitte Namibia** (Windhoek) — Largest, international standards
2. **PwC Namibia** (Windhoek) — Strong tech audit practice
3. **KPMG Namibia** (Windhoek) — Mid-market focus
4. **Grant Thornton Namibia** (Windhoek) — Cost-effective, local

**Selection Criteria:**
- [ ] AICPA membership (licensed to issue SOC 2 opinions)
- [ ] Experience with SaaS/cloud platforms
- [ ] Cost (N$50K-150K for Type II)
- [ ] Timeline (can complete within 4-6 weeks)
- [ ] References (other Namibian tech companies)

**RFP Questions:**
1. How many SOC 2 audits have you performed for SaaS companies?
2. What's your typical audit timeline (Type I vs Type II)?
3. Do you offer readiness assessments? (Recommended before full audit)
4. What evidence format do you require?
5. Can you work with Vanta/Drata evidence portals?
6. What's your fee structure? (Fixed vs hourly)

**Recommendation:** Start with **Type I readiness assessment** (~N$25K, 2-3 weeks) before committing to full Type II audit.

---

#### Step 2: Readiness Assessment (Week 23-24)

**Deliverable:** CPA-issued readiness report identifying remaining gaps

**Process:**
1. **Kick-off call** — CPA reviews scope, TSC selection
2. **Evidence submission** — Share `docs/compliance/` folder + Vanta portal
3. **Control testing** — CPA spot-checks access controls, logs, policies
4. **Gap report** — CPA lists findings (major, minor, observations)
5. **Remediation** — Address critical gaps before Type II

**Timeline:** 2-3 weeks

---

#### Step 3: SOC 2 Type II Audit (Week 25-28)

**Observation Period:** 6 months (covers Weeks 3-24)

**Process:**
1. **Planning phase** (Week 25)
   - CPA finalizes audit plan
   - Control matrix mapping (TSC → Hotel Etuna controls)
   - Sample selection (e.g., 25 user access reviews, 50 change logs)

2. **Fieldwork phase** (Week 26-27)
   - CPA tests control design (are policies adequate?)
   - CPA tests operating effectiveness (do logs prove controls worked?)
   - CPA interviews staff (Technical Lead, CTO, Ops Manager)
   - CPA reviews evidence (logs, policies, vendor reports)

3. **Reporting phase** (Week 28)
   - CPA drafts SOC 2 Type II report
   - Hotel Etuna reviews draft, provides management responses
   - CPA issues final report (40-60 pages)

**Final SOC 2 Report Contents:**
- **Section 1:** Independent CPA opinion (unqualified = pass)
- **Section 2:** System description (how Hotel Etuna works)
- **Section 3:** Control objectives and related controls (TSC mapping)
- **Section 4:** Test of controls (CPA's detailed findings)
- **Section 5:** Other information (subservice organizations, complementary controls)

**Timeline:** 4 weeks

---

## 8. Mapping to Existing Systems

### Hotel Etuna → SOC 2 Control Mapping

| TSC ID | Control Title | Hotel Etuna Implementation | Evidence Location |
|--------|---------------|----------------------------|-------------------|
| **CC6.1** | Logical access controls | RLS policies, `proxy.ts`, NextAuth sessions | `lib/db/schema.ts` (RLS), `proxy.ts`, `SessionTimeoutWrapper` |
| **CC6.2** | Asset management | Property IDs, room inventory, staff records | `properties`, `rooms`, `staff_members` tables |
| **CC6.3** | MFA enforcement | 2FA on payment endpoints | `lib/compliance/with-admin-rate-limit.ts` |
| **CC6.6** | Network security | Vercel HTTPS, firewall (inherited) | Vercel platform attestation |
| **CC6.7** | Encryption | TLS 1.3 (Vercel), database at rest (Neon) | Vercel config, Neon security docs |
| **CC7.1** | System operations | Neon backups, Vercel monitoring | Neon dashboard, Vercel analytics |
| **CC7.2** | Monitoring & logging | `audit_trail`, Vercel logs, Neon pgAudit | `lib/compliance/record-audit.ts` |
| **CC7.3** | Incident response | `cybersecurity_incidents` table | `lib/db/schema.ts` (incidents table) |
| **CC8.1** | Change management | Git commits, Drizzle migrations | `database/drizzle/*.sql`, GitHub history |
| **CC9.1** | Vendor management | Vercel, Neon, Adumo contracts | `docs/BUFFR_FINANCIAL_SERVICES_PROPOSAL_AND_SLA.md` |
| **A1.1** | Availability monitoring | Vercel uptime, SLA 99.5% | `docs/BUFFR_FINANCIAL_SERVICES_PROPOSAL_AND_SLA.md` §6.2 |
| **A1.2** | Backup/recovery | Neon PITR, RTO 24h, RPO 24h | `docs/project/PLANNING.md` §6.5 |

---

## 9. Budget & Resources

### Cost Breakdown

| Item | Cost (NAD) | Notes |
|------|-----------|--------|
| **CPA Readiness Assessment** | 25,000 | Type I gap analysis (2-3 weeks) |
| **CPA Type II Audit** | 75,000 - 120,000 | 6-month observation period |
| **Vanta/Drata Subscription** | 30,000 - 40,000 | Annual (evidence automation) |
| **Staff Time (6 months)** | 50,000 | CTO (20h), Dev (40h), Ops (30h) @ blended rate |
| **Policy Templates** | 5,000 | Legal review of 21 policies |
| **Training Platform** | 10,000 | Security awareness (e.g., KnowBe4) |
| **Penetration Test** | 20,000 | Annual requirement |
| **Contingency (10%)** | 23,500 | Unexpected gaps, remediation |
| **Total** | **238,500 - 298,500** | ~N$250K-300K (US$13K-16K) |

### Staff Allocation

| Role | Effort (Hours) | Timeline |
|------|---------------|----------|
| **CTO** (Program Lead) | 80 hours | Weeks 1-28 (policies, auditor liaison, reviews) |
| **Senior Developer** (Technical Lead) | 120 hours | Weeks 3-24 (evidence collection, logging setup, testing) |
| **Operations Manager** (Compliance Liaison) | 60 hours | Weeks 4-24 (vendor mgmt, training, log reviews) |
| **CEO/Owner** (Executive Sponsor) | 20 hours | Weeks 1, 4, 8, 28 (policy sign-off, auditor meetings) |

---

## 10. Risk Register

### Top Risks to SOC 2 Readiness

| Risk | Likelihood | Impact | Mitigation | Owner |
|------|-----------|--------|------------|-------|
| **CPA unavailable until Q1 2027** | Medium | High | Start RFP now; book audit slot early | CTO |
| **Vanta integration issues** | Low | Medium | Allocate 2 weeks for troubleshooting | Dev |
| **Staff turnover during audit** | Low | High | Cross-train team, document runbooks | CTO |
| **Critical vendor lacks SOC 2** | Low | Critical | Escalate to vendor; consider alternatives | Ops |
| **Major security incident during observation** | Very Low | Critical | Robust incident response plan (Week 5) | CTO |
| **Budget overrun** | Medium | Medium | Negotiate fixed-fee audit; defer Vanta if needed | CEO |
| **Scope creep (Confidentiality, PI added)** | Medium | Medium | Freeze scope; defer to Type II refresh | CTO |

---

## Timeline Gantt Chart

```
Week 1-2   │ ████ Preparation (scope, gap analysis, team)
Week 3     │   ██ Risk assessment
Week 4     │   ████ Security policies (21 docs)
Week 5     │     ██ Incident response plan
Week 6     │     ██ Centralized logging
Week 7     │       ██ Business continuity plan
Week 8     │       ██ Vendor risk assessments
Week 9-10  │         ████ Vanta setup / evidence automation
Week 11-24 │           ████████████████████ Evidence collection (6 months)
Week 21-22 │                               ████ Select CPA auditor
Week 23-24 │                                 ████ Readiness assessment
Week 25-28 │                                     ████████ SOC 2 Type II audit
```

---

## Next Steps (Week 1)

### Immediate Actions

1. **Schedule kick-off meeting** — CTO + CEO + Senior Dev + Ops Manager
2. **Review this plan** — Adjust timeline/budget based on team capacity
3. **Approve budget** — Secure N$250K-300K commitment from ownership
4. **Assign roles** — Confirm RACI matrix
5. **Set up project tracker** — Use Notion, Asana, or Google Sheets
6. **Book CPA consultations** — Get quotes from 3 firms for readiness assessment

### Week 1 Checklist

- [ ] Read this plan (all stakeholders)
- [ ] Schedule kick-off meeting (60 mins)
- [ ] Confirm budget availability
- [ ] Assign Program Lead (CTO)
- [ ] Create Slack/Teams channel (#soc2-audit)
- [ ] Set up shared drive for evidence (`docs/compliance/`)
- [ ] Reach out to 3 CPA firms for RFP

---

## Appendices

### A. SOC 2 Resources

- **AICPA Trust Services Criteria:** https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/trustdataintegritytaskforce
- **SOC 2 Readiness Checklist:** https://www.vanta.com/resources/soc-2-checklist
- **Deloitte Namibia Contact:** https://www2.deloitte.com/na/en.html
- **PwC Namibia Contact:** https://www.pwc.com/na/en.html

### B. Policy Template Library

See `docs/compliance/policy-templates/` for 21 policy templates aligned with TSC.

### C. Evidence Collection Calendar

Import into Google Calendar: `docs/compliance/EVIDENCE_COLLECTION_CALENDAR.ics`

---

**Document Control:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 16, 2026 | AI Assistant + Etuna CTO | Initial implementation plan |

**Approval:**

- [ ] **CTO (Program Lead):** _________________________ Date: _______
- [ ] **CEO (Executive Sponsor):** _________________________ Date: _______

---

**Next Review:** After CPA readiness assessment (Week 23-24)
