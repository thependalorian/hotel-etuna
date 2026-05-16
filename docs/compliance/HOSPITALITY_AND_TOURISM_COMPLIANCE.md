# Hospitality & Tourism Compliance — Hotel Etuna

**Effective Date:** May 16, 2026  
**Document Owner:** Operations Manager  
**Entity:** Etuna Guesthouse And Tours CC (trading as Hotel Etuna)  
**Review Frequency:** Annual  
**Status:** Operations checklist — **not legal advice**

---

## 1. Purpose

Hotel Etuna operates as a **registered accommodation establishment** in Namibia. This document records statutory obligations under tourism legislation and how they map to property operations and the digital platform.

**Parent index:** [`NAMIBIA_REGULATORY_FRAMEWORK.md`](NAMIBIA_REGULATORY_FRAMEWORK.md)

---

## 2. Applicable legislation

| Instrument | Summary | Source |
|------------|---------|--------|
| **Namibia Tourism Board Act 21 of 2000** | Establishes NTB; registration and grading of accommodation | [NamibLII Act 21/2000](https://namiblii.org/akn/na/act/2000/21) |
| **Regulations: Registration of Accommodation Establishments (GN 139/2004)** | Registration procedure, categories, renewal | [NamibLII GN 139/2004](https://namiblii.org/akn/na/act/gn/2004/139/eng@2004-07-14) |
| **Regulations: Levy Payable by Accommodation Establishments (GN 137/2004)** | Tourism levy on guest charges | [NamibLII GN 137/2004](https://namiblii.org/akn/na/act/gn/2004/137/eng@2017-11-15) |
| **National Star Grading Regulations (GN 204/2012)** | Optional star grading and quality standards | [NamibLII GN 204/2012](https://namiblii.org/akn/na/act/gn/2012/204/eng@2017-11-15) |
| **Accommodation Establishments Ordinance 17 of 1974** | Historical framework (superseded in part by 2000 Act) | NamibLII |

---

## 3. Registration & grading

### 3.1 NTB registration (mandatory)

**Obligation:** Operate only if registered with NTB in the correct category (e.g. guest house, lodge, hotel).

| Task | Frequency | Owner | Evidence location |
|------|-----------|-------|-------------------|
| Maintain valid NTB registration certificate | Annual renewal | Operations | Physical + scanned copy in ops vault |
| Update registration if capacity/category changes | As needed | Operations | NTB correspondence |
| Display registration number on premises (if required) | Ongoing | Front desk | Property signage |

**Platform:** Marketing site may reference NTB registration number once confirmed by counsel/NTB — do not publish unverified claims.

### 3.2 Star grading (optional)

If the property pursues star grading:

- Apply via NTB grading process (quality inspection).
- Use graded status only in marketing after written award.
- Align room descriptions in RAG knowledge base (`data/hotel-etuna-knowledge/`) with actual graded standard.

---

## 4. Tourism levy

Per **GN 137/2004** (verify current rates with NTB/accountant):

| Establishment type | Typical levy base |
|--------------------|-------------------|
| Bed & breakfast / bed-night tariff | **2%** of total guest charges (excl. VAT treatment per accountant) |
| Single inclusive tariff | **1%** of inclusive charge |
| Campsites / caravan parks | Exempt categories per regulations |

| Task | Frequency | Owner |
|------|-----------|-------|
| Calculate levy on qualifying guest revenue | Monthly | Finance |
| Remit levy to NTB | Per NTB schedule | Finance |
| Retain remittance proof | 5+ years | Finance |

**Product note:** Folio and VAT logic (`lib/services/folio/FolioService.ts`, `namibia-tax.ts`) handle **VAT**; tourism levy is a **separate statutory charge** — confirm whether levy is included in published room rates or added at checkout (document in guest Terms).

---

## 5. Guest-facing obligations

| Obligation | Practice | Digital alignment |
|------------|----------|-------------------|
| Accurate description of services | Match website/RAG to physical property | Knowledge ingest scripts |
| Check-in identification | Terms: ID may be required | Front desk SOP (not in app v1) |
| Price display in NAD | Dining + booking where shown | `app/dining`, folio NAD |
| Complaints handling | Respond within reasonable time | Support tickets + `consumer_rights_requests` |
| Safety & security | Physical security, fire exits | `app/legal/security` |

---

## 6. Food & beverage (restaurant)

If the property serves meals (Etuna restaurant):

| Area | Consideration |
|------|----------------|
| **Health inspection** | Municipal / health authority fitness certificate (NamRA VAT registration often references fitness cert) |
| **Liquor licence** | If alcohol served — separate licence; age verification at bar |
| **Menu accuracy** | `lib/data/etuna-restaurant-menu-catalog.ts` must match kitchen |

---

## 7. Insurance & liability

| Coverage | Purpose |
|----------|---------|
| Public liability | Guest injury on premises |
| Property / business interruption | Fire, theft, operational loss |
| Professional indemnity (platform) | Buffr separate from property — see Buffr SLA |

Guest **Terms of Service** (`app/legal/terms/page.tsx`) must align with actual insurance limits — counsel review annually.

---

## 8. Evidence checklist

- [ ] NTB registration certificate (current year)
- [ ] Tourism levy returns (last 12 months)
- [ ] Star grading certificate (if applicable)
- [ ] Health/fitness certificate (if applicable)
- [ ] Liquor licence (if applicable)
- [ ] Guest complaint log (support + consumer rights exports)

Store copies under `docs/compliance/evidence/YYYY-MM/hospitality/` (create folder on first export).

---

## 9. Revision history

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 16, 2026 | Operations | Initial hospitality compliance checklist |
