# Buffr Financial Services — Platform Proposal & Service Level Agreement

**Document type:** Commercial proposal + SLA (draft for signature)  
**Version:** 1.5  
**Date:** 16 May 2026  
**Governing product:** Hotel Etuna hospitality platform (`hoteletuna.com`)  
**Technical canon:** `docs/project/PRD.md` §3.5.3, `docs/project/PLANNING.md` § Payment strategy  

> **Important:** This document is a **business and technical draft** prepared from product requirements and publicly available Namibian legislation. It is **not legal advice**. Both parties should have it reviewed by a Namibian attorney before signing. Fee amounts marked **[TBD]** must be completed in Schedule A.

---

## Table of contents

1. [Parties and definitions](#1-parties-and-definitions)  
2. [Executive summary (proposal)](#2-executive-summary-proposal)  
3. [Scope of platform services](#3-scope-of-platform-services)  
4. [Commercial model and fees](#4-commercial-model-and-fees)  
5. [Payment processing and settlement](#5-payment-processing-and-settlement)  
6. [Service Level Agreement (SLA)](#6-service-level-agreement-sla)  
7. [Data protection, security, and compliance](#7-data-protection-security-and-compliance)  
8. [Namibian legal framework (reference)](#8-namibian-legal-framework-reference)  
9. [Term, termination, and disputes](#9-term-termination-and-disputes)  
10. [Schedules and signatures](#10-schedules-and-signatures)  
11. [Tax & NamRA reference sources](#11-tax--namra-reference-sources)  

---

## 1. Parties and definitions

### 1.1 Parties

| Role | Legal name | Registration | Principal place of business |
|------|------------|--------------|----------------------------|
| **Service Provider** | **Buffr Financial Services CC** | CC/2024/09322 | Ongwediva, Namibia (operations) |
| **Client** | **Etuna Guesthouse and Tours CC** | **CC/2011/3890** | Ongwediva, Namibia |

**Client tax identifiers (NamRA Tax Good Standing Certificate, issued 15 Jan 2026, valid to 15 May 2026):**

| Field | Value | Source |
|-------|--------|--------|
| BIPA / close corporation | **CC/2011/3890** | Client / BIPA |
| NamRA registered name | **Etuna Guesthouse And Tours CC** | NamRA good standing certificate |
| Trade / platform brand | **Hotel Etuna** | Marketing UI only |
| Folio / tax invoice supplier name | **Etuna Guesthouse And Tours CC** | `HOTEL_ETUNA_LEGAL_NAME` (default; NamRA registered name) |
| Postal address | P.O. Box 90022, Ongwediva | NamRA certificate |
| Taxpayer ID (TIN) | **05517026** | NamRA certificate |
| Income tax (ITX) | **05517026-011** | NamRA certificate |
| Employee tax | **05517026-014** | NamRA certificate |
| **VAT** | **05517026-015** | NamRA certificate — use on guest folios / tax invoices |
| Withholding tax on services | **05517026-018** | NamRA certificate |
| Bank (guest collections) | Nedbank 11000481744 (461089, NEDSNANX) | Nedbank confirmation |

**Buffr tax identifiers on file (verify against NamRA certificate):**

| Field | Value | Source |
|-------|--------|--------|
| Close corporation | CC/2024/09322 | Bank Windhoek letter; BIPA |
| **VAT registration no.** | **0031148015** | Bank Windhoek letter footer (29 Aug 2025) — **must match NamRA certificate** |
| Income tax reference (ITX) | **15560644-011** | NamRA Taxpayer Registration Certificate (`NamRA.pdf`, OCR verified May 2026) |
| Taxpayer ID (TIN) | **15560644** | Same certificate |
| Registered name (NamRA certificate) | **Buffr Financial Services CC** | **CC/2024/09322** — matches Agreement and bank letter |
| Postal address (certificate) | P.O. Box 90022, Ondangwa | NamRA certificate |
| Bank (billing only) | Bank Windhoek 8050377860, BWLINANX | Bank confirmation |

Collectively the **Parties**; individually a **Party**.

### 1.2 Definitions

| Term | Meaning |
|------|---------|
| **Platform** | The Hotel Etuna web application, APIs, admin dashboards, guest portal, and related infrastructure operated by Buffr for the Client. |
| **Guest** | End user booking accommodation, dining, or services at the Client’s property. |
| **Guest revenue** | Amounts paid by Guests for rooms, F&B, incidentals, and deposits — **property income**, not Buffr income. |
| **Platform fees** | Subscription, card processing fees, and agreed service charges invoiced by Buffr to the Client. |
| **Adumo** | Adumo Online (Namibia card acquirer / hosted payment page provider). |
| **Merchant of record** | Buffr Financial Services CC, as the entity contracting with Adumo for card acceptance on the Platform. |
| **Settlement account** | Bank account to which card acquirer settlements are paid (target: Client Nedbank account). |
| **Billing account** | Buffr Bank Windhoek account used **only** for payment of Platform fees by the Client. |

### 1.3 Relationship to product documentation

Implementation behaviour (ledger rules, APIs, fee accrual) is defined in:

- `docs/project/PRD.md` — §3.5 Payment rails, §3.5.3 Platform commercial model, §6.4 Performance  
- `docs/project/PLANNING.md` — Payment strategy, Platform commercial model  
- `lib/platform/settlement-accounts.ts` — registered bank profiles (admin reference)  

This Agreement controls the **commercial and legal** relationship; the PRD controls **product behaviour** where not inconsistent with a signed Agreement.

---

## 2. Executive summary (proposal)

Buffr Financial Services CC proposes to **host, operate, and support** the Hotel Etuna digital platform for Etuna Guesthouse and Tours CC, including:

- Property management (PMS), bookings, guest CRM, staff dashboards  
- Etuna Restaurant menu, orders, folio, and F&B inventory foundations  
- Guest-facing website (`hoteletuna.com`) with gated pricing and online booking  
- Card payments via **Adumo Virtual** (hosted PCI page) with settlement directed to the **Client’s bank account**  
- Optional AI concierge (Sofia), email automation, and partner referral network (as enabled in PRD)  

Buffr **does not** take ownership of Guest revenue. Buffr earns **Platform fees** (monthly subscription + processing/service fees) invoiced separately and paid by EFT to Buffr’s billing account.

**VAT — two separate NamRA obligations:** **Hotel Etuna** registers, files, and pays VAT on **guest** hospitality (rooms, restaurant, folio). **Buffr** registers, files, and pays VAT on **platform** fees invoiced to Etuna only. See §4.5 and §8.7.6.

---

## 3. Scope of platform services

### 3.1 Included in standard subscription **[TBD tier]**

| Module | Description |
|--------|-------------|
| **Hosting** | Production deployment on Vercel; domain support for `hoteletuna.com` |
| **Database** | Neon PostgreSQL; tenant-scoped data for Hotel Etuna hub |
| **PMS** | Room types, rates, availability, booking lifecycle, hub admin |
| **Guest CRM** | Profiles, preferences, loyalty points on folio settlement |
| **Folio & F&B** | Stay folio, room service, cash settlement, card via Adumo Virtual |
| **Cash reconciliation** | Front-desk cash tracking and reconciliation UI |
| **Public website** | Rooms, dining, partners, gated rates, reviews (approved) |
| **Staff access** | Role-based dashboards (owner, manager, front desk, etc.) |
| **Support channel** | Platform support tickets (hub admin) |
| **Maintenance** | Security patches, dependency updates, planned maintenance windows |

### 3.2 Optional / phased (subject to separate quote or schedule)

| Module | Notes |
|--------|--------|
| **Sofia AI / RAG** | Hub-only; requires Qdrant + embedding API keys |
| **WhatsApp / voice** | Integration-dependent |
| **NamQR / open banking** | Per PRD rail priority P1–P3 |
| **Partner network** | JayLa, Aquarius-style partner tenants |
| **Automated platform invoicing** | P2 — PDF invoices, mark-paid dashboard |
| **Custom development** | Quoted separately; not part of standard SLA |

### 3.3 Excluded

- On-site IT, hardware, or property Wi-Fi  
- Adumo acquirer fees (paid by Buffr to Adumo; may be reflected in processing fee markup)  
- Nedbank / Bank Windhoek transaction charges on Client or Buffr accounts  
- Legal, tax, or audit services  
- **RealPay** or other payout / debit-order products (out of product scope per PRD)  
- Buffr netting Platform fees from Guest card settlements **without** written consent and audit trail  

---

## 4. Commercial model and fees

### 4.1 Fee structure (Schedule A)

| Fee type | Basis | Amount |
|----------|--------|--------|
| **Monthly platform subscription** | Per calendar month, in advance or arrears *[TBD]* | **N$ [TBD] / month** |
| **Card processing fee** | % of successful Adumo Virtual volume + optional fixed per transaction | **[TBD]% + N$ [TBD]** per tx |
| **Onboarding / setup** | One-time (optional) | **N$ [TBD]** |
| **Additional users / properties** | Beyond included limits | **N$ [TBD]** |
| **Custom development** | Time & materials or fixed quote | As quoted |

**VAT (15% standard rate — no change announced Budget 2025/2026):** There are **two independent VAT registrations and return streams**:

| Stream | Who files with NamRA | What is taxed |
|--------|----------------------|---------------|
| **Property (hospitality)** | **Hotel Etuna (Client)** | Room nights, restaurant, folio charges to guests |
| **Platform (B2B)** | **Buffr** | Monthly subscription + card processing fees invoiced to Client |

Buffr does **not** include Guest hospitality turnover on Buffr’s VAT return. The Client does **not** remit VAT on Buffr’s platform invoice to NamRA as output tax — the Client may treat valid Buffr tax invoices as **input VAT** (if registered), subject to adviser confirmation.

**Example (Buffr invoice to Client, when VAT-registered):** Platform fee N$1,000 ex VAT + N$150 VAT (15%) = **N$1,150** payable to Buffr billing account. Implemented in code: `lib/platform/namibia-tax.ts` → `computeVatOnTaxableSupply()`.

### 4.2 Invoicing and payment terms

1. Buffr issues a **tax invoice** monthly (or as agreed) to the Client.  
2. Invoice lines: subscription + aggregated card processing fees (+ any agreed line items).  
3. Processing fees are **accrued** from Platform transaction records (`transactions.metadata.platformFee`); they are **not** deducted at Guest checkout.  
4. Client pays by **EFT** to Buffr billing account within **14 days** of invoice date unless otherwise agreed **[TBD: 7 / 30 days]**.  
5. Late payment: interest at **[TBD]%** per month or maximum permitted under Namibian law.  
6. Buffr may suspend non-critical features after **30 days** overdue; critical guest safety data export offered on request.

### 4.3 Bank accounts (confirmed references)

| Purpose | Account name | Bank | Account no. | Branch / Swift |
|---------|--------------|------|-------------|----------------|
| **Client — guest collections** | ETUNA GUESTHOUSE AND TOURS CC | Nedbank Namibia | 11000481744 | 461089 / NEDSNANX |
| **Buffr — platform fee remittance** | BUFFR FINANCIAL SERVICES CC | Bank Windhoek | 8050377860 | 485-673 / BWLINANX |

The Client’s Nedbank account is the **target** for Adumo card settlement. The Buffr account is **only** for Platform fee payment — it must not appear on Guest checkout pages as the payee for room or F&B charges.

### 4.4 Tax registration summary (both parties)

| Party | VAT (15%) | Corporate income tax | NamRA filing |
|-------|-----------|----------------------|--------------|
| **Buffr** | Reg. **0031148015** (on file); compulsory registration if taxable supplies exceed **N$500,000** / 12 months (VAT Act threshold — confirm with adviser) | **30%** non-mining rate from **1 Jan 2025** (Budget 2025/2026) | Monthly/quarterly VAT + annual income tax via **ITAS** |
| **Hotel Etuna** | VAT **05517026-015**; CC **CC/2011/3890**; ITX **05517026-011**; **mandatory own NamRA VAT returns** on guest supplies; prices **VAT-inclusive** | Same **30%** CC rate (non-mining) | **Monthly/bi-monthly VAT return (ITAS)** on output VAT from room/F&B; income tax on property profit |

**Client bank (guest revenue only):** ETUNA GUESTHOUSE AND TOURS CC, Nedbank **11000481744**, branch **461089**, SWIFT **NEDSNANX** (Nedbank confirmation, May 2026).

**Buffr env vars (production invoices):**

```bash
BUFFR_VAT_REGISTERED=true
BUFFR_VAT_NUMBER=0031148015
BUFFR_INCOME_TAX_REF=15560644-011
BUFFR_VAT_RATE_PERCENT=15
# Client (property guest VAT on folios — separate from Buffr invoice)
HOTEL_ETUNA_VAT_REGISTERED=true
HOTEL_ETUNA_CC_NUMBER=CC/2011/3890
HOTEL_ETUNA_VAT_NUMBER=05517026-015
HOTEL_ETUNA_INCOME_TAX_REF=05517026-011
HOTEL_ETUNA_LEGAL_NAME=Hotel Etuna CC
HOTEL_ETUNA_PRICES_VAT_INCLUSIVE=true
```

### 4.5 Dual VAT reporting — Hotel Etuna vs Buffr

```text
Guest pays N$1,150 (room + F&B, VAT-inclusive)
        │
        ▼
Adumo settles ──► Etuna Nedbank (Client revenue)
        │
        ├──► Client NamRA: output VAT on hospitality (e.g. N$150 of N$1,150)
        │
        └──► Buffr monthly invoice N$100 platform + N$15 VAT
                    │
                    └──► Buffr NamRA: output VAT on platform fees only
                         Client may claim N$15 input VAT (if registered)
```

**Hotel Etuna (Client) must:**

1. Register for VAT with NamRA when compulsory threshold is met (typically **N$500,000** taxable supplies per 12 months — confirm).  
2. File **property VAT returns** on schedule (monthly or bi-monthly per NamRA allocation).  
3. Issue or display **tax-compliant** guest folios/receipts with Etuna legal name and **Client VAT number**.  
4. Use Platform **Property VAT report** (`/reports/property-vat`) and folio VAT breakdowns for return preparation — not for Buffr fees.  
5. Retain Buffr **tax invoices** for platform fees as potential **input tax** evidence.

**Buffr must:**

1. File VAT returns only on **Buffr’s** taxable supplies (platform fees to Client).  
2. **Not** report Guest card settlements as Buffr turnover.  
3. Issue monthly **tax invoices** to Client when VAT-registered.

---

## 5. Payment processing and settlement

### 5.1 Roles

| Activity | Responsible party |
|----------|-------------------|
| Adumo merchant application & contract | **Buffr Financial Services CC** |
| Adumo monthly acquirer charges | **Buffr** (may include markup in processing fee) |
| Guest card checkout (hosted page) | **Adumo** (Buffr-integrated Platform) |
| Guest receipt / folio wording | **Client** brand; “secure card payment” |
| Card settlement to bank | **Adumo → Client Nedbank** (target configuration) |
| Platform fee invoicing | **Buffr → Client** (EFT to Buffr) |
| Cash at front desk | **Client** (Platform records only) |

### 5.2 Card flow (technical summary)

1. Guest initiates pay on Platform → `payment_sessions` created.  
2. Browser form POST to Adumo Virtual with JWT (`mref`, `amount`, `cuid`, `auid`).  
3. Guest completes payment on Adumo; redirect with `_RESPONSE_TOKEN`.  
4. Platform confirms JWT; updates booking/folio and `transactions` with `beneficiary: property`.  
5. Adumo settles per acquirer cycle to **Client settlement account** (subject to Adumo approval).  
6. Buffr accrues processing fee for monthly invoice — **separate** from settlement.

### 5.3 Client obligations (payments)

- Provide accurate settlement bank confirmation and notify Buffr of changes within **5 business days**.  
- Reconcile Adumo settlement reports and Nedbank statements with Platform `transactions`.  
- Report suspected card fraud or duplicate charges within **48 hours**.  
- Do not request Guests to pay Platform fees or Buffr invoices as part of room rates without clear disclosure.

### 5.4 Buffr obligations (payments)

- Maintain Adumo integration in good working order (excluding Adumo or bank outages).  
- Configure Adumo settlement to Client account when Adumo permits.  
- Provide monthly processing fee breakdown with invoice.  
- Not apply Guest card proceeds to Buffr invoices without **written consent** and itemised reconciliation.

### 5.5 Pass-through (if Adumo settles to Buffr temporarily)

If acquirer settlement lands on Buffr’s account before Client account is configured:

1. Buffr holds amounts as **agent / trust-style pass-through** for Client Guest revenue only.  
2. Buffr transfers to Client Nedbank within **T+2 business days** of receipt (or as agreed).  
3. Separate ledger and monthly statement provided.  
4. This arrangement ends when direct settlement to Client is live.

---

## 6. Service Level Agreement (SLA)

### 6.1 Service hours

| Item | Standard |
|------|----------|
| **Platform availability monitoring** | 24×7 automated |
| **Support desk** | Monday–Friday, 08:00–17:00 Namibia (GMT+2), excluding public holidays **[TBD]** |
| **Emergency (P1) contact** | **[TBD phone / email]** — production down or payment failure |

### 6.2 Availability target

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Monthly uptime** | **99.5%** (aligned with PRD aspiration 99.9%; contractual 99.5% unless upgraded) | Vercel / synthetic checks; excludes scheduled maintenance |
| **Scheduled maintenance** | Max **4 hours/month**; **72 hours** notice where practicable | Email to Client admin |
| **Excluded downtime** | Adumo, Neon, Vercel, DNS, Client ISP, force majeure | Not counted against Buffr |

**Service credits (optional):** If monthly uptime &lt; 99.5%, credit **5%** of that month’s subscription fee per full 0.5% below target, capped at **25%** of monthly subscription. Credits do not apply to processing fees or third-party outages.

### 6.3 Incident priority and response

| Priority | Example | Initial response | Target resolution |
|----------|---------|------------------|-------------------|
| **P1 — Critical** | Platform down; no bookings; card pay broken | **2 hours** (business hours); **4 hours** (outside) | **8 hours** workaround or fix plan |
| **P2 — High** | Major feature broken (folio, admin login) | **4 hours** | **2 business days** |
| **P3 — Medium** | Non-critical bug, cosmetic | **1 business day** | Next scheduled release |
| **P4 — Low** | Feature request, documentation | **3 business days** | Roadmap / quote |

### 6.4 Support channels

- In-app **support tickets** (hub admin)  
- Email: **[TBD support@buffr / hoteletuna]**  
- Critical escalation: **[TBD]**  

Client provides one **primary** and one **backup** technical contact.

### 6.5 Backups and recovery

| Item | Target |
|------|--------|
| **Database backups** | Neon point-in-time / daily (per Neon plan) |
| **RTO (recovery time objective)** | **24 hours** for full platform restore |
| **RPO (recovery point objective)** | **24 hours** maximum data loss (standard tier) |

Enterprise tier **[TBD]** may improve RTO/RPO.

### 6.6 Client responsibilities (SLA)

- Maintain valid domain DNS and provide timely approval for Vercel/SSL changes.  
- Protect staff credentials; notify Buffr of suspected compromise immediately.  
- Keep Client contact and settlement bank details current.  
- Not overload APIs or scrape Platform in violation of fair use.  

---

## 7. Data protection, security, and compliance

### 7.1 Roles

| Data | Controller / owner | Processor |
|------|-------------------|-----------|
| **Guest PII** (names, email, stay history) | **Client** (hospitality operator) | **Buffr** (Platform host) |
| **Staff / admin accounts** | **Client** | **Buffr** |
| **Platform logs & audit trail** | **Buffr** | Sub-processors (Vercel, Neon, etc.) |
| **Card data** | **Adumo** (PCI). Buffr and Client do **not** store PAN/CVV | Adumo |

### 7.2 Security measures (Buffr)

- TLS in transit; secrets in Vercel environment variables.  
- Row-level security (`tenant_id`) on database tables.  
- Session timeout (30 min inactivity; 8 h absolute max per PRD).  
- Audit trail on sensitive operations.  
- Rate limiting on auth and payment endpoints.  

### 7.3 Data processing terms

Until a dedicated Data Processing Agreement is signed, the Parties agree:

1. Buffr processes personal data **only** to provide the Platform and support.  
2. Buffr uses sub-processors (Vercel, Neon, email, AI providers) disclosed on request.  
3. On termination, Buffr provides **export** of Client tenant data within **30 days** (standard format).  
4. Buffr deletes or anonymises Client data within **90 days** after export, except legal retention.  

### 7.4 Marketing and communications

Email automation and Sofia must respect **marketing consent** flags in CRM. Client is responsible for lawful basis to contact Guests under applicable law.

---

## 8. Namibian legal framework (reference)

This section summarises **relevant Namibian law** for the Parties’ review. It does not replace legal counsel.

### 8.1 Entity law — Close Corporations

Both Parties operate as **close corporations** under the **Close Corporations Act 26 of 1988** (as amended, including Amendment Act 5 of 2023). Key points:

- A CC is a separate **juristic person** with members (not shareholders).  
- **Association agreements** (s 44) may govern internal relations; external contracts bind the CC if within its business or authorised.  
- Registration and beneficial ownership obligations are administered by **BIPA** (Business and Intellectual Property Authority).  
- **Source:** [NamibLII — Close Corporations Act](https://namiblii.org/akn/na/act/1988/26/eng@2023-07-21/source)

### 8.2 Contracts and commercial law

Namibian contracts are generally governed by:

- **Common law** principles (offer, acceptance, consideration, lawful object).  
- **Contractual Terms Act** and related consumer legislation where applicable.  
- Specific statutes depending on transaction type (sale of services, electronic commerce).  

Commercial agreements between two CCs are typically **B2B**; consumer cooling-off under e-commerce rules primarily protect **consumers**, not the Client as enterprise — but **Guests** remain consumers of the Client.

**Reference:** [Commercial law overview — Mondaq Namibia](https://mondaq.com/contracts-and-commercial-law/765644/commercial-law-in-namibia)

### 8.3 Electronic transactions and e-commerce

The **Electronic Transactions Act 4 of 2019** (partially commenced March 2020):

- Recognises **electronic signatures** and **data messages** as valid evidence.  
- Supports **electronic contracts** and automated booking systems.  
- Includes **e-commerce consumer protections** (information, secure payment, cooling-off in defined cases).  
- **Chapters on payment services** in the same Act were **not fully commenced** at last public update — do not assume full PSP licensing framework under ETA alone.  

**Sources:**  
- [NamibLII — Electronic Transactions Act 2019](https://namiblii.org/akn/na/act/2019/4)  
- [Commencement GN 2020/75](https://namiblii.org/akn/na/act/gn/2020/75)

**Platform implication:** Booking confirmations and electronic invoices sent by the Platform should meet transparency requirements (price, property identity, contact details).

### 8.4 Payment system regulation

The **Payment System Management Act 14 of 2023** empowers the **Bank of Namibia (BoN)** to license and supervise **payment service providers**. Determinations (e.g. licensing, fees) apply to licensed PSPs — not necessarily to a hospitality operator or a software host **unless** Buffr activities constitute regulated payment services.

**Current product posture (PRD):**

- Buffr is **merchant of record** with **Adumo** (licensed acquirer).  
- Buffr does **not** hold Guest funds as a licensed e-money issuer on Platform.  
- Card acceptance is **Adumo’s** regulated activity; settlement goes to **Client bank**.  

**Action:** Buffr should confirm with Namibian counsel whether Platform fee collection or temporary pass-through settlement triggers any **PSP or intermediary** licensing duty under BoN.

**Sources:**  
- [BoN — Payment System Management Act](https://www.bon.com.na/Bank/Payments-and-Settlements/Legal-Framework/Payment-System-Management-Act.aspx)  
- [BoN — licensing PSPs (media release)](https://www.bon.com.na/Informations/Media/Media-Releases/2023-Media-Releases/Articles/BoN-Takes-on-Role-of-Licensing-Payment-Service-Pro.aspx)

### 8.5 Data protection and privacy

- **Article 13** of the **Namibian Constitution** protects privacy.  
- Comprehensive **data protection legislation** was pending as the **Draft Data Protection Bill, 2021** (supervisory authority, processing principles). **Verify enactment status** before relying on specific obligations.  
- Until enacted, Parties should apply **reasonable security**, purpose limitation, and Guest transparency consistent with constitution and international best practice (e.g. alignment with POPIA-style principles where practical).  

**Reference:** [DLA Piper — Namibia data protection](https://www.dlapiperdataprotection.com/?c=NA&t=law)

### 8.6 Anti-money laundering

If Guest volumes or pass-through settlements are material, consider **Financial Intelligence Act** obligations and **Know-Your-Customer** policies for B2B relationship. Hospitality card payments via licensed acquirer typically shift AML burden to acquirer — **confirm with counsel**.

### 8.7 Tax (Namibia — Budget 2025/2026 and NamRA)

> **Sources used for this section:**  
> - **Deloitte** — *Commentary on the Namibian Budget 2025/2026* (Minister Hon. Ericah B. Shafudah, **27 March 2025**). User file: `deloitte-tax-commentary-namibian-budget-2025-2026.pdf`.  
> - **NamRA** — registration certificate (`NamRA.pdf`, scanned image; **transcribe** VAT/TIN into Schedule A). Official portal: [namra.org.na](https://www.namra.org.na).  
> - **Bank confirmations** — Buffr VAT on Bank Windhoek letter; Etuna Nedbank account (separate PDF).  
> **Not tax advice.** Each Party must use its own accountant and confirm effective dates when laws are gazetted.

#### 8.7.1 Roles — who taxes what

| Activity | Taxable entity | Typical taxes |
|----------|----------------|---------------|
| Guest room, F&B, incidentals | **Client** (Etuna) | VAT on taxable supplies; income tax on property profit |
| Platform subscription & processing fees | **Buffr** invoices **Client** | VAT on Buffr’s invoice if Buffr is VAT-registered; income tax on Buffr profit |
| Card settlements to Client Nedbank | **Client** revenue (not Buffr income) | Client reconciles to NamRA; Buffr does not report Guest revenue as own turnover |
| Adumo acquirer fees | **Buffr** cost of sales | Buffr may claim input VAT on valid tax invoices from Adumo if registered — **confirm** |
| SaaS / cloud sub-processors (Vercel, Neon, AI) | **Buffr** | Possible **imported digital services VAT** rules for foreign vendors — legislation reported finalised in budget; place-of-supply and registration thresholds apply |

#### 8.7.2 Corporate income tax (relevant to both CCs)

Per **Budget 2025/2026** proposals and confirmations (subject to gazetting):

| Item | Detail | Relevance |
|------|--------|-----------|
| **Non-mining company rate** | **31% → 30%** from **1 January 2025**; further reduction to **28%** targeted **FY2026/2027** | Buffr and Client projected tax on respective profits |
| **Mining companies** | Not applicable to hospitality platform | — |
| **OECD Pillar Two (15% global minimum)** | Still under debate for Namibia | Monitor if Buffr group structure triggers rules |
| **Tax amnesty** | Programme continues until **31 October 2026** | Historical compliance only — not a substitute for current filing |
| **Preference share anti-avoidance** | Dividends on substance-loan arrangements taxed as income | Unlikely for CC structure; note if restructuring |

#### 8.7.3 VAT (hospitality + platform)

| Item | Detail | Platform / commercial impact |
|------|--------|------------------------------|
| **VAT rate** | **No change** announced to standard rate | Continue 15% on standard-rated supplies unless law changes |
| **E-invoicing** | NamRA **e-invoicing** for VAT-registered persons; rollout anticipated **April 2026** (ITAS integration, unique invoice IDs, real-time reporting) | **P2 backlog:** Platform-generated tax invoices and export must align with NamRA e-invoice rules when live |
| **Imported digital services** | VAT on foreign digital services (streaming, cloud, hosting, SaaS, etc.) — drafting reported **finalised** | Buffr’s foreign cloud/AI costs may attract VAT mechanics; Buffr’s **Namibian B2B platform fees** to Client are domestic supplies if Buffr is established in Namibia — **confirm with adviser** |
| **Zero-rating** | Govt purchase of commercial property zero-rating clarified | Not core to this Agreement |
| **Fuel / sin taxes** | Excise adjustments (Mar 2025) | Client operational cost only |

#### 8.7.4 Withholding and payroll (awareness)

| Item | Status (budget commentary) | Notes |
|------|---------------------------|--------|
| **Local dividend WHT** | Proposed; timing indicated **FY2026/2027** | If either CC pays dividends to members |
| **Foreign dividends / interest** | Existing WHT rules apply | Confirm on any cross-border flows |
| **PAYE** | Client and Buffr each employ staff | Outside Platform scope; Client runs property payroll |

#### 8.7.5 NamRA compliance — Buffr invoices to Client

When Buffr is **VAT-registered**, each **tax invoice** to the Client should include (verify against current NamRA / VAT Act requirements and future e-invoice schema):

1. Words **“Tax invoice”** (or as prescribed).  
2. Buffr **name**, address, and **VAT registration number**.  
3. Client **name**, address, and VAT number (if registered).  
4. Unique **invoice number** and date.  
5. Description of supply (e.g. “Hotel Etuna platform subscription — [month]”, “Card processing service fees — [period]”).  
6. **Exclusive** amount, **VAT** amount, **inclusive** total (NAD).  
7. Brief reference to Agreement / purchase order if required internally.

**Platform P1 (live):** `platform_invoices` stores `vat_rate_percent`, `vat_amount`, `document_type` (`tax_invoice` when `BUFFR_VAT_REGISTERED=true`); logic in `lib/platform/namibia-tax.ts`. **P2:** PDF export + NamRA ITAS e-invoice upload (Apr 2026 target).

#### 8.7.6 Client obligations — Hotel Etuna property VAT (NamRA reporting)

The Client is the **supplier** for all Guest hospitality. Buffr is **not** the Client’s tax agent for property VAT. The Client remains solely responsible for:

| Obligation | Detail |
|------------|--------|
| **Registration** | NamRA VAT registration when required; maintain **Client VAT number** in Schedule A and env |
| **Output VAT** | 15% on standard-rated room, F&B, and taxable folio lines (inclusive or exclusive per policy) |
| **VAT returns** | File and pay on NamRA schedule via **ITAS**; amounts are **not** included on Buffr’s return |
| **Tax invoices / receipts** | Guest folios and receipts show **Etuna** legal name + VAT no.; “Tax invoice” wording per NamRA rules when registered |
| **Input VAT** | Valid tax invoices from suppliers (including Buffr platform fees, utilities, F&B suppliers) — Client’s claim, not Buffr’s |
| **E-invoicing (Apr 2026)** | Client hospitality documents must comply when NamRA mandates e-invoicing for registered persons |
| **Records** | Retain folio, POS, and bank records for **5 years** (typical — confirm with adviser) |

**Suggested Client workflow (each VAT period):**

1. Run **Property VAT report** for period start–end (`/reports/property-vat`).  
2. Reconcile totals to Nedbank + Adumo settlement and cash reconciliation.  
3. Add adjustments not in Platform (manual deposits, exempt supplies) per accountant.  
4. Submit VAT return in **ITAS**; pay NamRA by due date.  
5. File Buffr platform tax invoice under **input VAT** if allowable.

**Platform support (property VAT only — not Buffr invoicing):**

| Capability | Detail |
|------------|--------|
| Folio VAT breakdown | Guest/staff folios: **ex VAT**, **VAT @ 15%**, **incl. VAT** when `HOTEL_ETUNA_VAT_REGISTERED=true` |
| Staff UI | `/reports/property-vat` — period totals for NamRA return prep |
| API | `GET /api/reports/property-vat?from=&to=` — settled room/fnb/adjustment lines |
| Code | `PropertyVatService`, `computeHospitalityVatBreakdown()`, `PROPERTY_GUEST_TAX_INVOICE_CHECKLIST` |
| **Excluded** | `platform_invoices`, Buffr subscription/processing — **Buffr’s** VAT return only |

#### 8.7.7 Contractual tax clause

1. Each Party is responsible for its **own** tax registrations, returns, and payments.  
2. Fees in Schedule A are **exclusive of VAT** unless stated otherwise; VAT is added when Buffr is VAT-registered.  
3. Neither Party provides tax advice to the other.  
4. Parties will cooperate on reasonable information requests for VAT audits (redacted Guest PII).  

#### 8.7.8 Platform implementation — tax (code)

| Capability | Status | Location |
|------------|--------|----------|
| Standard VAT 15%, corporate rate constants | Done | `lib/platform/namibia-tax.ts` |
| Buffr B2B VAT on platform fees | Done | `computeVatOnTaxableSupply()` |
| Property hospitality VAT (inclusive/exclusive) | Done | `computeHospitalityVatBreakdown()` |
| NamRA tax invoice checklists | Done | `NAMRA_TAX_INVOICE_CHECKLIST`, `PROPERTY_GUEST_TAX_INVOICE_CHECKLIST` |
| PDF platform invoices with VAT lines | Backlog P2 | `platform_invoices` + NamRA e-invoicing Apr 2026 |
| Folio VAT line display | Done | `FolioVatBreakdown`, guest + booking folio |
| Property VAT staff report UI | Done | `/reports/property-vat` |

---

## 9. Term, termination, and disputes

### 9.1 Term

- **Initial term:** **12 months** from signature.  
- **Renewal:** Automatic **12-month** renewal unless either Party gives **90 days** written notice of non-renewal.  

### 9.2 Termination for convenience

Either Party may terminate on **90 days** written notice. Client pays subscription and accrued processing fees through effective date.

### 9.3 Termination for breach

Immediate termination if:

- Material breach not cured within **30 days** of written notice; or  
- Insolvency, deregistration, or criminal conduct affecting the Platform; or  
- Repeated SLA failures (3+ P1 incidents in 30 days uncured).  

### 9.4 Effect of termination

1. Buffr provides data export within **30 days**.  
2. Client pays outstanding invoices.  
3. Adumo merchant configuration: Parties cooperate to migrate or close; Client may need independent acquirer for card acceptance.  
4. Confidentiality survives **3 years**.  

### 9.5 Limitation of liability

To the maximum extent permitted by Namibian law:

- Neither Party is liable for **indirect, consequential, or loss of profit** except fraud or wilful misconduct.  
- Buffr’s aggregate liability cap: **fees paid by Client in the 12 months** preceding the claim (excluding Guest revenue).  
- Buffr is not liable for Adumo, bank, or internet outages beyond SLA credits.  

### 9.6 Indemnity

Client indemnifies Buffr against claims arising from Client’s Guest services, property safety, or misrepresentation to Guests. Buffr indemnifies Client against claims arising from Buffr’s gross negligence in Platform security or unlawful data use.

### 9.7 Governing law and disputes

- **Governing law:** Republic of Namibia.  
- **Jurisdiction:** Courts of Namibia; Parties submit to **Oshakati / Windhoek** jurisdiction **[TBD]**.  
- **Mediation:** Good-faith negotiation **30 days** before litigation.  

---

## 10. Schedules and signatures

### Schedule A — Fees and tax registration (complete before execution)

| Item | Value |
|------|--------|
| Monthly subscription (N$) | |
| Card processing % | |
| Card processing fixed (N$ per tx) | |
| Invoice payment terms (days) | |
| Prices exclusive or inclusive of VAT | **Exclusive** (recommended) |
| **Buffr** — Income tax reference (NamRA ITX) | **15560644-011** (TIN **15560644**) |
| **Buffr** — VAT registration no. | **0031148015** (confirm vs NamRA cert) |
| **Buffr** — BIPA / CC registration | **CC/2024/09322** |
| **Buffr** — VAT registered (Y/N) | **Y** (recommended if issuing tax invoices) |
| **Client** — Income tax reference (NamRA ITX) | **05517026-011** (TIN **05517026**) |
| **Client** — VAT registration (NamRA) | **05517026-015** |
| **Client** — Employee tax | **05517026-014** |
| **Client** — WHT on services | **05517026-018** |
| **Client** — VAT registered (Y/N) | **Y** |
| **Client** — Prices VAT-inclusive for guests | **Y** (recommended B2C) |
| **Client** — BIPA / CC registration | **CC/2011/3890** |
| Tax adviser (Buffr) | Name / firm / contact |
| Tax adviser (Client) | Name / firm / contact |

### Schedule B — Authorised signatories

| Party | Name | Title | Signature | Date |
|-------|------|-------|-----------|------|
| Buffr Financial Services CC | | | | |
| Etuna Guesthouse and Tours CC | | | | |

### Schedule C — Technical contacts

| Role | Name | Email | Phone |
|------|------|-------|-------|
| Client primary | | | |
| Client backup | | | |
| Buffr support | | | |

---

## 11. Tax & NamRA reference sources

| Document | Use in this Agreement |
|----------|---------------------|
| **Deloitte — Namibian Budget 2025/2026** (`deloitte-tax-commentary-namibian-budget-2025-2026.pdf`) | §8.7.2–8.7.4: corporate tax 30% (from 1 Jan 2025); VAT rate unchanged; e-invoicing **Apr 2026**; imported digital services VAT; amnesty to **31 Oct 2026** |
| **NamRA Taxpayer Registration Certificate** (`NamRA.pdf`) | Buffr: ITX **15560644-011**, **Buffr Financial Services CC**, CC **CC/2024/09322** |
| **NamRA Tax Good Standing Certificate** (Client, 15 Jan 2026) | Etuna: CC **CC/2011/3890**, ITX **05517026-011**, VAT **05517026-015**, employee **05517026-014**, WHT **05517026-018**; valid **15 Jan – 15 May 2026** |
| **Bank Windhoek — Buffr account letter** (Aug 2025) | CC/2024/09322, VAT 0031148015, account 8050377860 |
| **Nedbank — Etuna account confirmation** (May 2026) | Client settlement account 11000481744 |
| **Namibian VAT Act 10 of 2000** (as amended) | Registration thresholds; invoice content §8.7.5 |
| **Income Tax Act** (as amended) | Corporate rates §8.7.2 |
| **`lib/platform/namibia-tax.ts`** | Code defaults: VAT 15%, `BUFFR_DOCUMENTED_VAT_NUMBER`, `computeVatOnTaxableSupply()` |

**Official contacts:** [Namibia Revenue Agency](https://www.namra.org.na) — registration, ITAS, e-invoicing updates.

**Budget caveat (Deloitte):** Tax **proposals** in the budget speech must be passed and **gazetted** before they are law; effective dates appear in gazetted Acts.

### Deloitte Budget 2025/2026 — quick reference for Buffr

| Topic | What was announced | Action for Buffr |
|-------|-------------------|----------------|
| **VAT rate** | No change (15% standard) | Use 15% on B2B platform invoices if registered |
| **E-invoicing** | NamRA system, target **April 2026**, ITAS integration | Plan Platform billing P2; unique invoice IDs |
| **Digital services VAT** | Legislation drafting **finalised** (foreign cloud/SaaS) | Review Vercel/Neon/OpenAI charges; may affect Buffr cost base |
| **Corporate tax** | **31% → 30%** from 1 Jan 2025; **28%** proposed later | Buffr CC provisional tax / returns |
| **Tax amnesty** | Until **31 October 2026** | Historical compliance only |
| **Pillar Two 15%** | Still under debate | Monitor if applicable to group |
| **Dividend WHT (local)** | Proposed; timing ~FY2026/2027 | If members take dividends from CC profits |

---

## Document control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-05-16 | Product / Buffr | Initial draft from PRD §3.5.3, PLANNING, bank confirmations |
| 1.1 | 2026-05-16 | Product / Buffr | §8.7 tax (Deloitte Budget 2025/2026, NamRA); Schedule A; `namibia-tax.ts` + invoice VAT columns |
| 1.2 | 2026-05-16 | Product / Buffr | Buffr VAT **0031148015** + CC on file; §4.4 registration summary; Deloitte/NamRA source index; NamRA.pdf transcription note |
| 1.3 | 2026-05-16 | Product / Buffr | §4.5 dual VAT (Etuna property vs Buffr platform); §8.7.6 NamRA filing for Client; `/payments/property-vat` UI |
| 1.4 | 2026-05-16 | Product / Buffr | NamRA.pdf transcribed (Buffr ITX **15560644-011**); property VAT UI |
| 1.5 | 2026-05-16 | Product / Buffr | Client NamRA good standing cert. **0002280115-0036**: **CC/2011/3890**, VAT **05517026-015**, ITX **05517026-011**, employee **05517026-014**, WHT **05517026-018** |

**Next review:** Renew Client tax good standing before **15 May 2026**; confirm Buffr VAT **0031148015** vs NamRA VAT cert; tax adviser sign-off; e-invoicing (Apr 2026).
