# Data Protection Policy (Namibia)

**Effective Date:** May 16, 2026  
**Policy Owner:** CTO  
**Review Frequency:** Annual (or upon enactment of Data Protection Act)  
**Legal Reference:** Namibia Data Protection Bill 2023 (pending), GDPR, POPIA  
**TSC Reference:** CC6.7, P1-P8  
**Approval Required:** Executive Sponsor (CEO/Owner)

---

## 1. Purpose

This policy establishes Hotel Etuna's framework for protecting personal data in anticipation of Namibia's Data Protection Act and in alignment with international best practices (GDPR, POPIA). It ensures lawful, fair, and transparent processing of guest and staff personal information.

## 2. Scope

This policy applies to:
- All personal data processed by Hotel Etuna (guests, staff, partners, vendors)
- All data processing activities (collection, storage, use, disclosure, deletion)
- All systems and services (Hotel Etuna platform, third-party processors)
- All jurisdictions where Hotel Etuna operates (Namibia, EU guests via GDPR)

## 3. Legal Framework

**Namibian Context:**
- **Data Protection Bill 2023:** Expected to pass Parliament in 2025-2026; establishes Data Protection Supervisory Authority, requires transparent and lawful processing based on consent
- **One-year compliance period** after Bill enactment
- **GDPR/POPIA alignment:** Businesses compliant with GDPR or South Africa's POPIA will find it "relatively straightforward to comply"

**International Standards:**
- **GDPR (EU):** Applies to Hotel Etuna if processing EU resident data
- **POPIA (South Africa):** Voluntary compliance as regional best practice

**Namibian Regulations:**
- **Electronic Transactions Act 2019:** Electronic signatures and secure data transmission
- **Labour Act 2007:** Employee personal data protection
- **Consumer Protection Bill 2024:** Consumer data rights

## 4. Definitions

**Personal Data:** Any information relating to an identified or identifiable individual, including:
- Name, email, phone number, physical address
- ID number, passport number, driver's license
- IP address, device identifiers, session tokens
- Booking history, payment information, preferences
- Biometric data (if collected for access control)

**Special Category Data (Sensitive):** 
- Health information (allergies, disabilities)
- Racial or ethnic origin
- Religious or philosophical beliefs
- Financial information beyond transaction records
- Namibian ID numbers (equivalent to EU "national identifier")

**Data Subject:** Individual to whom personal data relates (guest, staff member, partner)

**Data Controller:** Hotel Etuna (determines purposes and means of processing)

**Data Processor:** Third-party service providers (Vercel, Neon, Adumo, Voyage AI)

## 5. Data Protection Principles

### 5.1 Lawfulness, Fairness, Transparency

**Lawful Basis for Processing:**
Hotel Etuna processes personal data under these legal bases:
1. **Consent:** Guest booking agreement (explicit consent for marketing)
2. **Contract Performance:** Processing necessary to fulfill booking contract
3. **Legal Obligation:** Tax records, PSD-12 incident reporting, Labour Act compliance
4. **Legitimate Interest:** Fraud prevention, system security, business analytics

**Transparency:**
- Privacy Policy published at https://hoteletuna.com/legal/privacy
- Collection notice displayed at all data entry points
- Plain language explanations of data use
- Contact information for data protection inquiries

### 5.2 Purpose Limitation

**Defined Purposes:**
- **Booking Management:** Process reservations, check-in/out, folio settlement
- **Payment Processing:** Secure payment transactions via Adumo Virtual
- **Customer Service:** Handle inquiries, complaints, special requests
- **Sofia AI Concierge:** Provide personalized recommendations
- **Marketing:** Send promotional offers (opt-in only)
- **Legal Compliance:** Tax reporting, PSD-12 notifications, audit trails
- **Security:** Fraud detection, incident response, access control

**Prohibition on Incompatible Use:**
- Data collected for booking purposes not used for unrelated marketing
- Guest data not sold or shared with third parties (except processors)
- Purpose changes require new consent or legal basis

### 5.3 Data Minimization

**Collection Limits:**
- Only collect data necessary for defined purpose
- Optional fields clearly marked (e.g., dietary preferences)
- No blanket collection of "nice to have" data

**Examples:**
- ✅ **Collect:** Guest name, email, phone (booking requires contact)
- ❌ **Don't Collect:** Social media profiles, mother's maiden name, biometric data (unless justified)

### 5.4 Accuracy

**Data Quality:**
- Guests can update their profile information
- Staff must correct inaccurate data upon notification
- Annual data accuracy review for active guests

**Verification:**
- Email verification required for guest accounts
- Phone verification for payment-enabled accounts
- ID verification for KYC compliance (partner properties)

### 5.5 Storage Limitation

**Retention Periods:**
| Data Type | Retention Period | Legal Basis |
|-----------|------------------|-------------|
| **Guest Bookings** | 7 years after checkout | Tax law (Namibia Income Tax Act) |
| **Guest Profiles** | Until account deletion request | Consent / Legitimate interest |
| **Payment Records** | 7 years | PSD-12 (Bank of Namibia) |
| **Audit Logs** | 7 years | Electronic Transactions Act 2019 |
| **Staff Records** | 5 years after termination | Labour Act 2007 |
| **Marketing Consents** | Until withdrawal | Consent |
| **Incident Reports** | 10 years | PSD-12, insurance requirements |

**Deletion Process:**
- Automated deletion after retention period expires
- Manual deletion for user requests (GDPR Article 17 equivalent)
- Soft delete (anonymization) for records with legal hold

### 5.6 Integrity and Confidentiality (Security)

**Technical Measures:**
- **Encryption in Transit:** TLS 1.3 for all HTTPS connections
- **Encryption at Rest:** AES-256 for Neon database, Vercel Blob storage
- **Access Controls:** Role-based access, MFA for admins, tenant isolation (RLS)
- **Audit Logging:** All access to personal data logged in `audit_trail` table
- **Secure Development:** Security Prompt Pack applied to all code changes

**Organizational Measures:**
- **Staff Training:** Annual data protection awareness training
- **Confidentiality Agreements:** All staff sign NDA on hire
- **Incident Response:** 72-hour breach notification (PSD-12 + GDPR)
- **Vendor Due Diligence:** SOC 2 attestations required for data processors

**Physical Security:**
- No on-premises servers (serverless architecture)
- Inherited controls from Vercel, Neon (SOC 2 certified)
- Staff workstations with full disk encryption

### 5.7 Accountability

**Demonstrable Compliance:**
- This policy document
- Privacy Policy (external-facing)
- Data processing records (GDPR Article 30 equivalent)
- Vendor Data Processing Agreements (DPAs)
- Data Protection Impact Assessments (DPIAs) for high-risk processing
- Audit trail of consent and data subject requests

## 6. Data Subject Rights

Hotel Etuna recognizes the following rights for data subjects:

### 6.1 Right to Access (Subject Access Request)

- **Process:** Submit request via email to privacy@hoteletuna.com
- **Response Time:** 30 days (free of charge)
- **Format:** JSON export of all personal data
- **Implementation:** `GET /api/guest/export` endpoint

### 6.2 Right to Rectification

- **Process:** Guests can update profile via account settings
- **Staff Requests:** Submit to HR manager
- **Response Time:** Within 48 hours

### 6.3 Right to Erasure ("Right to be Forgotten")

- **Process:** Submit deletion request via privacy@hoteletuna.com
- **Response Time:** 30 days
- **Exceptions:** Cannot delete if legal retention applies (tax, PSD-12)
- **Implementation:** `DELETE /api/guest/account` (soft delete/anonymization)

**Deletion Scope:**
- Remove from `guests`, `guest_profiles` tables
- Anonymize `bookings` (replace name/email with "Deleted User [UUID]")
- Remove from Vercel Blob, Qdrant vector store
- Retain aggregated/anonymized analytics

### 6.4 Right to Restriction of Processing

- **Process:** Guest can request temporary processing restriction
- **Use Cases:** Dispute over data accuracy, legal hold
- **Implementation:** Flag account as `processing_restricted` in database

### 6.5 Right to Data Portability

- **Process:** Request structured data export
- **Format:** JSON or CSV
- **Scope:** Booking history, profile data, reviews
- **Implementation:** Same as Right to Access (`GET /api/guest/export`)

### 6.6 Right to Object

- **Marketing:** One-click unsubscribe in all emails
- **Profiling:** Opt-out of Sofia AI personalization (use generic responses)
- **Legitimate Interest:** Object to fraud detection (may result in service denial)

### 6.7 Right to Withdraw Consent

- **Process:** Withdraw consent via account settings or email
- **Effect:** Future processing stops; historical data retained per legal basis
- **Marketing:** Immediate unsubscribe

### 6.8 Right to Complain

- **Internal:** Contact privacy@hoteletuna.com or CTO
- **Supervisory Authority:** Namibia Data Protection Supervisory Authority (once established)
- **Alternative:** South African Information Regulator (POPIA) for cross-border complaints

## 7. Data Processing Activities

### 7.1 Data Processing Register

Hotel Etuna maintains a register of all processing activities:

| Processing Activity | Data Types | Purpose | Legal Basis | Retention | Processor |
|---------------------|------------|---------|-------------|-----------|-----------|
| **Booking Management** | Name, email, phone, dates, room type | Contract performance | Contract | 7 years | Neon, Vercel |
| **Payment Processing** | Payment session ID (no card data) | Contract performance | Contract | 7 years | Adumo Virtual |
| **Sofia AI Concierge** | Inquiry history, preferences | Service delivery | Legitimate interest | Until deletion | Qdrant, Anthropic/Groq |
| **Marketing Emails** | Email, name, preferences | Marketing | Consent | Until withdrawal | SMTP provider |
| **Staff HR** | Name, email, ID number, salary | Employment | Contract + Legal obligation | 5 years post-termination | Neon |
| **Audit Logs** | User ID, IP, actions | Security | Legal obligation (PSD-12) | 7 years | Neon, Vercel |

### 7.2 International Data Transfers

**Current Transfers:**
- **Vercel (US):** Hosting infrastructure (SOC 2 certified)
- **Neon (US/EU):** Database storage (SOC 2 certified, EU regions available)
- **Anthropic (US):** LLM API (SOC 2 certified)
- **Voyage AI (US):** Embeddings API
- **Qdrant (EU/Cloud):** Vector database

**GDPR Compliance Mechanisms:**
- **Adequacy Decision:** None for Namibia yet; use Standard Contractual Clauses (SCCs)
- **Data Processing Agreements:** Signed with all processors
- **SCCs:** EU Commission SCCs for Vercel, Neon, Anthropic
- **Encryption:** Data encrypted in transit and at rest

**Namibian Law (Future):**
- Anticipated requirement for international transfer safeguards
- Hotel Etuna prepared with existing SCCs and DPAs

### 7.3 Data Processing Agreements (DPAs)

**Requirements for Processors:**
- Signed DPA before any data processing
- Processor obligations: confidentiality, security, sub-processor management
- Auditable controls (SOC 2 attestation or equivalent)
- Breach notification within 24 hours
- Assistance with data subject requests

**Current DPAs:**
- ✅ Vercel: Standard DPA (SOC 2 certified)
- ✅ Neon: Standard DPA (SOC 2 certified)
- ✅ Adumo: PCI-DSS certified, DPA for payment data
- 🟡 Anthropic: API Terms (SOC 2 certified)
- 🟡 Voyage AI: API Terms
- 🟡 Qdrant Cloud: API Terms

**Action:** Formal DPAs to be signed with all API providers by Week 8.

### 7.4 Data Protection Impact Assessment (DPIA)

**When Required:**
- New technology or processing method
- Large-scale profiling (Sofia AI)
- Systematic monitoring of public areas (CCTV, if deployed)
- Processing special category data (health info for accessibility)

**Process:**
1. Identify processing activity and data types
2. Assess necessity and proportionality
3. Identify risks to data subjects
4. Propose mitigation measures
5. CTO approval required; DPO review if appointed
6. Document in `docs/compliance/dpia/`

**Current DPIAs:**
- 🟡 Sofia AI Concierge (pending - Week 9)
- 🟡 Payment Processing (Adumo Virtual - inherited DPIA from PCI-DSS)

## 8. Data Breach Notification

### 8.1 Incident Response

- **Detection:** Security monitoring, user reports, audit log anomalies
- **Assessment:** Determine if personal data involved
- **Containment:** Follow Incident Response Plan (IRP)
- **Notification:** See timelines below

### 8.2 Notification Timelines

**To Supervisory Authority:**
- **PSD-12 (Bank of Namibia):** 72 hours for payment system breaches
- **GDPR (if EU data):** 72 hours
- **Namibia Data Protection Act (future):** Anticipated 72 hours

**To Data Subjects:**
- **High Risk of Harm:** Without undue delay
- **Low Risk:** Not required (document justification)
- **Method:** Email, website notice, media (for large-scale breaches)

**Documentation:**
- All breaches logged in `cybersecurity_incidents` table
- Post-incident review within 5 business days
- Lessons learned incorporated into IRP updates

## 9. Roles and Responsibilities

**CTO (Data Protection Officer - Designate):**
- Overall policy compliance
- Data protection strategy
- Vendor due diligence
- Breach notification to authorities

**Technical Lead:**
- Implement technical controls (encryption, access controls, audit logging)
- Respond to data subject requests (access, deletion)
- Security Prompt Pack enforcement

**HR Manager:**
- Staff data protection training
- Employee data processing compliance
- Termination data handling

**Legal Counsel (External):**
- Review privacy policy and terms
- Draft DPAs with processors
- Advise on Namibian Data Protection Act compliance

**All Staff:**
- Protect data entrusted to them
- Report suspected breaches immediately
- Complete annual data protection training

## 10. Third-Party Data Processors

### 10.1 Vendor Selection Criteria

- SOC 2 Type II certification (preferred)
- ISO 27001 or equivalent
- Signed DPA with privacy commitments
- Sub-processor transparency
- Breach notification within 24 hours

### 10.2 Current Processors

| Vendor | Service | SOC 2 | DPA | Data Types | Location |
|--------|---------|-------|-----|------------|----------|
| **Vercel** | Hosting | ✅ Yes | ✅ Yes | All system data | US (multi-region) |
| **Neon** | Database | ✅ Yes | ✅ Yes | All structured data | US/EU |
| **Adumo** | Payments | 🟡 PCI-DSS | ✅ Yes | Payment sessions (no card data) | Namibia/South Africa |
| **Anthropic** | LLM API | ✅ Yes | 🟡 API Terms | Conversation context (ephemeral) | US |
| **Voyage AI** | Embeddings | ❌ N/A | 🟡 API Terms | Knowledge base text | US |
| **Qdrant Cloud** | Vector DB | 🟡 ISO 27001 | 🟡 API Terms | Embeddings (no PII) | EU |

### 10.3 Annual Vendor Review

- Review SOC 2 attestations (renewed annually)
- Verify DPA compliance
- Assess new security controls
- Re-evaluate data flows
- Document in `docs/compliance/VENDOR_RISK_ASSESSMENT_YYYY.md`

## 11. Privacy by Design

**System Development:**
- Run Security Prompt Pack (§ 10 - Data Privacy & PII Handling) on all features
- Default to minimal data collection
- Privacy settings default to "most protective"
- Encryption by default (not optional)

**Examples:**
- Guest booking form only asks for required fields (name, email, phone, dates)
- Marketing consent opt-in checkbox (not pre-checked)
- Sofia AI conversations not stored indefinitely (7-day retention)
- Payment card data never stored (Adumo Virtual handles via iframe)

## 12. Training and Awareness

**Annual Training (Mandatory):**
- All staff complete data protection training within 30 days of hire
- Refresher training annually
- Specific training for roles handling sensitive data (finance, HR)

**Training Content:**
- Data protection principles
- Data subject rights
- Secure data handling
- Breach reporting procedures
- Social engineering awareness

**Documentation:**
- Training completion tracked in HR system
- Certificates issued to staff
- Training materials in `docs/compliance/training/`

## 13. Enforcement

**Non-Compliance Consequences:**
- First violation: Written warning + mandatory retraining
- Second violation: Suspension pending investigation
- Third violation: Termination (staff) or contract cancellation (vendor)
- Willful misconduct: Immediate termination + potential legal action

**Auditing:**
- Quarterly access log reviews
- Annual policy compliance audit
- External audit as part of SOC 2 Type II

## 14. Policy Review

- **Review Frequency:** Annual, or upon enactment of Namibia Data Protection Act
- **Next Review:** May 16, 2027 (or within 30 days of Act passage)
- **Triggers for Ad-Hoc Review:**
  - New data processing activity
  - Data breach
  - Regulatory change
  - Material change to business operations

## 15. Related Policies

- Information Security Policy
- Access Control Policy
- Incident Response Plan
- Vendor Management Policy
- Acceptable Use Policy
- Privacy Policy (external-facing)

## 16. References

**Legal:**
- Namibia Data Protection Bill 2023 (pending)
- Electronic Transactions Act 2019
- Labour Act 2007
- Consumer Protection Bill 2024
- Bank of Namibia PSD-12

**International Standards:**
- EU General Data Protection Regulation (GDPR)
- South Africa Protection of Personal Information Act (POPIA)
- ISO/IEC 27701:2019 (Privacy Information Management)

**Industry:**
- SOC 2 Trust Services Criteria (C1, P1-P8)
- NIST Privacy Framework

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
Chief Technology Officer (Data Protection Officer - Designate)  
Date: _______________

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 16, 2026 | CTO | Initial policy aligned with Namibia Data Protection Bill 2023 (pending), GDPR, POPIA |

---

## Appendix A: Data Subject Request Form

**Request Type:** ☐ Access ☐ Rectification ☐ Erasure ☐ Restriction ☐ Portability ☐ Objection

**Requestor Information:**
- Full Name: _________________________
- Email: _________________________
- Phone: _________________________
- Booking Reference (if guest): _________________________

**Request Details:**
[Description of request]

**Verification:**
To verify your identity, please provide:
- Copy of ID or passport
- Last booking confirmation email

**Submission:**
- Email: privacy@hoteletuna.com
- Subject: "Data Subject Request - [Request Type]"

**Response Timeline:** 30 days from verified submission

---

## Appendix B: Data Breach Notification Template

**To: Bank of Namibia Cybersecurity Unit / Namibia Data Protection Supervisory Authority**

**Subject:** Data Breach Notification - Hotel Etuna [Incident ID]

**Date:** [Notification date - within 72 hours of discovery]

**Incident Details:**
- **Discovery Date:** [Date]
- **Incident Type:** [Unauthorized access / Data loss / Ransomware / Other]
- **Affected Systems:** [System names]
- **Data Types Affected:** [Personal data categories]
- **Number of Individuals:** [Approximate count]
- **Incident Summary:** [Brief description]

**Impact Assessment:**
- **Risk to Data Subjects:** [High / Medium / Low]
- **Potential Harm:** [Identity theft / Financial loss / Reputational damage / Other]

**Containment Measures:**
- [Actions taken to contain breach]
- [Date containment confirmed]

**Notification to Data Subjects:**
- **Planned:** [Yes / No]
- **Method:** [Email / Website notice / Media]
- **Timeline:** [Date]

**Remediation:**
- [Steps taken to prevent recurrence]
- [Security controls enhanced]

**Contact:**
[CTO Name]  
[Phone]  
[Email]

---

**END OF POLICY**
