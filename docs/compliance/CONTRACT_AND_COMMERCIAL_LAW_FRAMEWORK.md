# Contract & Commercial Law Framework

**Effective Date:** May 16, 2026  
**Document Owner:** Legal Liaison / CEO  
**Review Frequency:** Annual  
**Status:** Framework summary — **not legal advice**

---

## 1. Purpose

Describe how **Namibian contract and commercial law** applies to Hotel Etuna guest relationships, Buffr platform services, and electronic contracting via the website — for alignment between legal pages, SLAs, and engineering.

**Parent index:** [`NAMIBIA_REGULATORY_FRAMEWORK.md`](NAMIBIA_REGULATORY_FRAMEWORK.md)

---

## 2. Sources of law

| Area | Primary sources |
|------|-----------------|
| **General contract** | Common law (Roman-Dutch tradition); case law on offer, acceptance, consideration, breach |
| **Electronic contracts** | Electronic Transactions Act 4 of 2019 — validity of data messages, electronic signatures, time/place of formation |
| **Companies** | Companies Act 28 of 2004 — CC/company capacity, directors |
| **Consumer protection** | National Consumer Protection Policy 2020–2025; Consumer Protection Bill 2024 (pending) |
| **Specific performance** | Guest accommodation = services contract; limitation clauses in Terms must be counsel-approved |

---

## 3. Contract map

| Relationship | Document | Parties | Formation |
|--------------|----------|---------|-----------|
| Guest stay | Terms of Service + booking confirmation | Etuna Guesthouse And Tours CC ↔ guest | Click-wrap at booking; ETA electronic record |
| Platform services | Buffr Proposal & SLA | Buffr Financial Services CC ↔ Etuna CC | Signed commercial agreement |
| Card payment | Adumo hosted terms + merchant agreement | Guest ↔ acquirer; Etuna as merchant of record for stay | Redirect to Adumo |
| Desk QR / EFT | Folio + payment confirmation | Guest ↔ Etuna | Staff confirms `namqr/confirm` or manual |
| Staff / partners | Employment / partnership agreements | Off-platform HR | Physical or e-sign |
| AI (Sofia) | Terms + Privacy (no separate AI contract v1) | Guest ↔ Etuna | Use of chat feature |

---

## 4. Electronic Transactions Act (ETA 2019) — engineering checklist

| ETA theme | Product control |
|-----------|-----------------|
| Legal recognition of electronic records | `audit_trail`, booking records |
| Electronic signatures | Admin actions logged; future e-sign for contracts |
| Contract formation online | Booking flow timestamps; Terms acceptance flag |
| Consumer information | Legal pages linked from checkout |
| Integrity of records | Immutable-style audit; DB backups |

**Code:** `consumer_rights_requests`, `RegulatoryLifecycleService`.

---

## 5. Key contract terms (guest)

Maintain consistency between `app/legal/terms/page.tsx` and operations:

| Topic | Should address |
|-------|----------------|
| Booking confirmation | Deposit, cancellation, no-show |
| Pricing | NAD, VAT inclusive/exclusive statement |
| ID & check-in | Government ID requirement |
| Liability cap | Counsel-drafted limits |
| Force majeure | Pandemic, utilities, Etosha access roads |
| Governing law | Laws of Namibia |
| Dispute resolution | Courts / arbitration as advised |
| Buffr role | Platform only; not seller of room nights |

---

## 6. Buffr commercial contract

Buffr ↔ Etuna platform-fee / dual-VAT / SLA terms are handled with counsel out-of-band (no in-repo proposal doc). Technical canon: `docs/project/PLANNING.md` § Payment strategy.

| Clause theme | Why it matters |
|--------------|----------------|
| Dual VAT | Separate NamRA returns |
| Settlement accounts | Nedbank (Etuna) vs Bank Windhoek (Buffr) |
| Processing fees | Adumo cost allocation |
| Data processing | Buffr as processor for platform data |
| Liability & indemnity | Payment incidents, regulatory fines |
| Termination | Data export, guest continuity |

**Do not sign without qualified Namibian counsel.**

---

## 7. Unfair terms & consumer rights

Pending Consumer Protection Bill may restrict:

- Unilateral change of price after booking
- Excessive cancellation penalties
- Misleading marketing (Sofia and website must match property)

Track complaints via support + `consumer_rights_requests` API.

---

## 8. Record retention for contracts

| Record | Retention | Policy |
|--------|-----------|--------|
| Signed Buffr SLA | Life + 7 years | Legal vault |
| Guest booking terms acceptance | 7 years post-stay | [`DATA_RETENTION_POLICY.md`](policies/DATA_RETENTION_POLICY.md) |
| Invoices / folios | Per NamRA | Tax doc |
| Audit trail | 7 years | SOC 2 / ETA |

---

## 9. Revision history

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 16, 2026 | Legal liaison | Initial commercial law framework |
