# Hotel Etuna — Rebrand Strategy, Questionnaire, and Market Landscape

**Purpose.** This document serves three audiences at once. For **ownership and design**, it answers the full *Hotel Etuna Rebrand Questionnaire* in depth, locks creative direction where decisions have already been made (notably **wordmark-first identity**), and records the **Nude-based design system** (hex, surfaces, DaisyUI theme, typography) so print and digital stay aligned. For **strategy and operations**, it connects those answers to a **Roger Martin–style *Playing to Win*** cascade and to lessons from **MBA field work on Etuna itself**. For **product and engineering**, it stays aligned with the live platform specification in `docs/project/PRD.md` (Sofia, CRM, gated content, design tokens).

**Status.** Draft for sign-off.

> **Product scope (May 2026).** Curated **tours** are **not** offered on the public website or in Sofia’s knowledge base (see PRD v2.7.2). Historical MBA and competitor references to “& Tours” or excursions remain below for strategy context only.

> **Documentation:** Full brand narrative stays in this file. Product summary, word-copy module, and deployment checklists live in the canonical triad — `docs/project/PRD.md` (§7), `PLANNING.md`, `TASK.md`. Do not duplicate long checklists here. Statements that depend on private confirmation from founders or accountants are marked **(confirm)**.

**Primary sources.** Operational facts: `data/hotel-etuna-knowledge/hotel-etuna-facts.md`, `data/hotel-etuna-knowledge/local-area.md`. MBA primary sources used in this narrative: `/Users/georgenekwaya/crawl4ai/Clone/MBA/BD Project 9 (2).pdf` (course brief, Etuna Guesthouse case framing, causal-loop assignment structure, lessons learned); `/Users/georgenekwaya/Downloads/pdf_folder/Copy of Project 9-3.pdf` (team deck: overview, challenge, lessons). Additional MBA artefact referenced for **analytics literacy**: `233BUS-215F-1 - Python and Applications to Business Analytics/Ridge and Lasso Regressions.ipynb.txt` in the same MBA workspace (regularised regression / feature selection — relevant when Hotel Etuna builds **data-led pricing and demand models**).

**How to read.** The centre of gravity is **Part I (MBA and systems analysis)** and **Part II (strategy and Four Seasons)**. **Part III** walks through the questionnaire in prose. **Part IV** is market landscape. **Part V** consolidates execution, risks, and metrics. The closing **appendix** lists external URLs and a compact coverage checklist. **Colour and UI** are specified immediately below so print, signage, and digital stay aligned with the shipped product.

---

## Design system — Nude foundation and Hotel Etuna tokens

**Canonical sources.** All hex values and token names below are defined in **`tailwind.config.ts`** (comment: *Design System v1.0.0, January 2026* — “all color hex lives here”). Behavioural rules for components and tone live in **`docs/project/PRD.md`** §7. Rebrand work (wordmark, print, uniforms) should **sample from these ramps** so a guest who sees the building, the website, and a key card recognises **one** property.

**Design intent.** The **nude ramp** is the **structural spine**: warm, skin-adjacent neutrals that feel **calm and premium** without icy grey “tech hotel” coldness. **Khaki** carries **action** (primary buttons, DaisyUI `primary`). **Terracotta** carries **authority** in headings and deep text. **Sage** signals **nature and tours** as a secondary accent. **Luxury** tokens (charlotte, champagne, rose, bronze, gold) support **VIP moments** and soft highlights without replacing the nude base. **Rustic** is a **red / deep accent scale** for alerts or partner-neutral surfaces—use sparingly on the hub so the brand stays **restful**. **Semantic** colours follow conventional success / warning / error / info roles for forms and system feedback.

### Nude foundation (full scale)

The nude palette is the default **canvas, text ink, and brand ramp** (`brand` in Tailwind mirrors `nude` for shadcn-style aliases). Body text on warm surfaces maps through **`ink`**, which is explicitly tied to **nude** for **WCAG AA** contrast in the config comment.

| Token | Hex | Typical use |
|-------|-----|-------------|
| `nude-50` | `#fef7f0` | Page background, `surface.background`, DaisyUI `base-100` |
| `nude-100` | `#fceee0` | Cards, hover wash, sidebar wash, `surface.hover`, DaisyUI `base-200` |
| `nude-200` | `#f8dcc0` | Borders, dividers, muted bands, DaisyUI `base-300` |
| `nude-300` | `#f2c49f` | Inactive UI, scrollbar thumb (with transparency) |
| `nude-400` | `#e8a87a` | Secondary hover |
| `nude-500` | `#d18b5c` | “Base” nude emphasis, VIP CTA token |
| `nude-600` | `#b8704a` | Mid emphasis |
| `nude-700` | `#9d5a3a` | Strong emphasis |
| `nude-800` | `#7d452e` | Primary body / heading ink on light UI, `surface.foreground` |
| `nude-900` | `#5d3322` | Deepest warm ink, accent text on khaki |

### Surface layer (Design System §2 in code)

| Token | Value | Role |
|-------|--------|------|
| `surface.background` | `nude-50` | App canvas |
| `surface.canvas` | `nude-50` | Alternate canvas label |
| `surface.foreground` | `nude-800` | Default text on surfaces |
| `surface.muted` | `nude-200` | Muted fills |
| `surface.elevated` / `card` / `input` | `#ffffff` | Cards and inputs |

### Hotel Etuna brand accents

| Token | Hex | Role |
|-------|-----|------|
| `khaki-sand` | `#c4a97d` | Badges, soft fills, DaisyUI `accent` |
| `khaki-600` | `#b8955a` | **Primary CTA**, DaisyUI `primary`, focus ring |
| `khaki-700` | `#9a7d43` | CTA hover, DaisyUI `secondary` |
| `terracotta-800` | `#8b4a2e` | Heading text |
| `terracotta-900` | `#6d3722` | Deep headings, DaisyUI `neutral` |
| `sage` (DEFAULT) | `#9bae8a` | Nature / tours accent |

### Luxury accents (spot highlights)

| Token | Hex |
|-------|-----|
| `luxury-charlotte` | `#d4a574` |
| `luxury-champagne` | `#f7e7ce` |
| `luxury-rose` | `#e8b4a0` |
| `luxury-bronze` | `#cd853f` |
| `luxury-gold` | `#d4af37` |

`cta.luxury` in theme uses `#d4af37` aligned with **gold** for premium actions where product specifies VIP styling.

### CTA mapping

| Token | Hex | Role |
|-------|-----|------|
| `cta.primary` | `khaki-600` | Default primary button fill |
| `cta.secondary` | `khaki-700` | Hover / pressed |
| `cta.vip` | `nude-500` | Alternate premium CTA |
| `cta.luxury` | `#d4af37` | Gold luxury CTA |

### Semantic UI (forms, alerts, status)

| Role | Key hex examples |
|------|------------------|
| Success | `#22c55e` (+ light / dark pair) |
| Warning | `#f59e0b` (+ light / dark) |
| Error | `#ef4444` (+ light / dark) |
| Info | `#0ea5e9` (+ light / dark) |

DaisyUI theme **`hoteletuna`** maps **primary/secondary** to khaki, **accent** to khaki sand, **neutral** to terracotta-900, **base-100/200/300** to nude surfaces, **base-content** to nude-900, and maps info/success/warning/error to the **semantic light** fills for component defaults—so **DaisyUI components** inherit Hotel Etuna without ad-hoc recolouring.

### Elevation and shadow (card “feel”)

Key custom shadows (warm-tinted, nude/luxury families): `nude-soft`, `nude-medium`, `nude-strong`, `nude-primary`, `luxury-soft`, `luxury-medium`, `luxury-strong`, plus aliases **`card`** and **`card-hover`**. PRD direction: cards use **soft nude-tinted elevation**; primary buttons lift with **khaki-tinted** hover shadow—see §7.3 in the PRD.

### Typography (aligned to wordmark system)

| Role | Font stack |
|------|------------|
| Display / logo-adjacent headlines | Playfair Display (`font-display`) |
| Body UI | Inter 16px base (`font-sans` / `font-body`) |
| Mono (invoice, code, analytics) | JetBrains Mono |
| Signature accent | Dancing Script — **rare** use only |

### Component and interaction rules (from PRD §7.3)

Primary button pattern: **khaki-600** background, **khaki-700** on hover, white text. Focus: **ring-2 ring-khaki-600** with offset. **Touch targets:** at least **44px** on mobile. Hub chrome carries Hotel Etuna **“HE”** badge patterns per product spec; **partner** dashboards stay **neutral** (no Sofia/CRM chrome) so the hub brand remains distinct.

**Rebrand execution note.** Exterior signage, menus, and uniforms should **not invent a parallel palette**. If print vendors need Pantone or CMYK matches, derive proofs from **these hex anchors** (especially **nude-50–200** for paper warmth and **khaki-600 / terracotta-900** for logo contrast on light backgrounds).

---

## Part I — The MBA lens: Project 9 and why it still matters for Hotel Etuna

### I.1 What Project 9 was, academically and personally

During the Brandeis MBA, **Project 9** was not a generic hospitality report. It followed a **system dynamics** pedagogy: students chose a **real case from their own or their team’s experience** in which management had pursued a sensible change yet **outcomes fell short of intent**. The deliverable combined a tight **fact pattern**, **reference modes** (graphs or sketches of how key variables behaved over time), a **causal loop diagram** exposing the feedback structure behind that behaviour, reflection on **mental models** of the actors, and **lessons learned**—all in a short classroom presentation. That method matters because it refuses the shallow fix (“post more on Facebook”) until it names the **loops** that keep the system stuck.

The team included **George Nekwaya**, **Andrew Mukurazita**, and **Sofiia Tarasiuk**. The focal organisation was **Etuna Guesthouse** in Ongwediva—**the same commercial lineage** this document now treats as **Hotel Etuna**. That continuity is unusual: most strategy decks for African guesthouses are written by consultants who have never lived inside the case. Here, the analysis was anchored in **first-hand access to how decisions actually felt on the ground**—managerial frustration with cyclical revenue, uneven awareness, and competitors who seemed to fill rooms more easily.

### I.2 The fact pattern the case described

The written case portrayed Etuna Guesthouse as a **substantial accommodation business** in the heart of Ongwediva (the MBA brief used a **35-room** scale **(confirm)** against today’s public “five room types” language on the digital product—inventory and copy should be reconciled so every channel states the same physical capacity). The manager’s concern was **low and cyclical weekly turnover** in rooms. **Awareness** spiked around **annual trade shows and tourism expos**, then fell away. Between those peaks the property relied heavily on **word of mouth**, **personal networks**, and **organic search**, with **little or no dedicated marketing budget**. Social media was treated as a **seasonal** activity rather than a core operating rhythm. When marketing did run and occupancy ticked up, **a small burst of funds** might be released for a **short campaign**—after which effort often tapered again.

Operationally, **bookings were taken at the front desk**. That is not a weakness in itself—many strong hotels are desk-led—but in the case narrative it sat beside **limited digital capture**, meaning the business under-invested in **repeatable pipelines** (corporate rate cards, CRM, retargeting, structured partnerships). Guests who did arrive frequently said they had been **referred** and **had not known** such a quality property existed; they often **returned** on later visits. **Cancellations post-reservation were rare**, which is an important quality signal: the product was **sticky once discovered**, but **discovery** was the bottleneck. Competitors in the same geography were described as running **higher occupancy**. The stated managerial challenge was therefore not “fix housekeeping” but **raise sustainable awareness and convert it into steadier weekly performance**.

### I.3 Systems reading: what was really broken

From a systems perspective, the case is less about “bad marketing” than about a **misaligned reinforcement structure**. When cash flow tightens, marketing is cut first because it is classified as **discretionary**. That reduces impressions and qualified leads just as the low season deepens, which **increases** pressure on cash flow—a **vicious cycle**. Conversely, when a short campaign works, the relief is interpreted as proof that “marketing works,” but without institutionalising **baseline spend** or **content cadence**, the loop **resets**. Word of mouth and returns are valuable, but as the team noted they are **volatile**: guests face **low switching costs** to another property for the next trip unless **relationship memory** (CRM, loyalty, corporate contracting) **binds** the next booking to Etuna.

The assignment also asked participants to examine **mental models**: from the manager’s seat, it can feel **rational** to fund marketing only when occupancy visibly drops, because that is when pain is highest. From the **system** seat, that same behaviour **guarantees** the oscillation the manager hates. **Trade fairs** functioned as an **exogenous shock** that temporarily lifted awareness—useful, but **not a substitute** for a **year-round demand system**. The lessons the team surfaced—**sustainable smoothing** of bookings, **low-season campaigns**, **influencer reach** where ROI is measured, and a **loyalty or referral scheme**—are exactly the levers that belong not in a slide footer but in **management systems** (budget rules, weekly metrics, owner approval thresholds) so they survive the next busy month.

### I.4 Translation to Hotel Etuna in 2026: product and brand together

The **Hotel Etuna** platform described in the PRD is, in part, an **engineering response** to the same structural gap. A **hub property** with **CRM memory**, **Sofia** for consistent guest interaction (within hub-only AI boundaries), **gated content** to build a qualified guest database, and **direct booking paths** attacks the **“nobody knew you existed”** problem through **always-on digital real estate**, not only through episodic posts. None of that removes the need for **marketing minimums** in cash and time; software without **baseline spend and content** still loses to competitors who show up every week on search and social. The rebrand to **Hotel** supports **corporate trust** and OTA parity, but **trust without discoverability** repeats the Project 9 pattern. **Strategy integration** (Martin’s test) therefore demands: if *How to win* includes **continuous awareness**, then *Management systems* must include a **non-optional monthly marketing floor** and a named owner of the calendar—otherwise the cascade breaks at its weakest link.

### I.5 Other MBA coursework that informs this document

Beyond Project 9, the MBA workspace includes **Business Analytics** work on **Ridge and Lasso regression**—regularised linear models used when many candidate predictors risk **overfitting** or when the analyst wants **parsimony** (Lasso can shrink coefficients to zero, effectively selecting features). For Hotel Etuna, that line of study is not decorative. Once the property accumulates **clean historical data** (occupancy by segment, ADR, fair weeks, channel mix, F&B attach, weather proxies, competitor rate scrapes where legal), the same discipline supports **evidence-based pricing** and **promotional lift measurement** rather than guessing whether a campaign “worked.” The connection to Project 9 is direct: **feedback diagrams** tell you *where* the business oscillates; **regression and experimentation** tell you *which levers* actually move outcomes when you intervene.

---

## Part II — Playing to Win, Four Seasons, and the Hotel Etuna cascade

### II.1 Why Roger Martin’s cascade is the right frame here

*Playing to Win* (Roger Martin and A.G. Lafley) treats strategy as an **integrated set of choices**, not a slogan. The five links—**Winning Aspiration**, **Where to Play**, **How to Win**, **Capabilities**, and **Management Systems**—must **fit one another**. A beautiful aspiration fails if “where to play” is vague. A sharp segment fails if “how to win” is generic. Capabilities without budgets and rituals become **PowerPoint**. For Hotel Etuna, this framework is especially apt because Project 9 already showed how **management systems** (when marketing is funded) can contradict **stated goals** (smooth occupancy)—the cascade was **broken in practice** even when intentions were good.

### II.2 Four Seasons: investigation summary (analogy, not imitation)

Four Seasons is analysed here as a **global reference for service economics and brand discipline**, not as a **competitive set** for Ongwediva. Public strategy communications describe an aspiration to remain among the world’s most **aspirational luxury** hospitality and residential brands, with growth across hotels, residences, and **experiential** journeys, while insisting that **personalised service delivered with warmth** remains the **enduring advantage**. The CEO narrative in trade press stresses **people and culture**, **empathy**, and **anticipation**—guest needs met before they become complaints. Operationally, that implies **heavy investment in hiring, training, standards, and quality assurance**, plus a **single unified brand** so that every touchpoint reinforces the same promise.

For Hotel Etuna, the **transferable insight** is not marble lobbies or global scale. It is that **where** Four Seasons plays (ultra-luxury nodes where rate and reputation reward perfection) **matches how** they win (service and culture as the product). **Mismatch**—for example, ultra-luxury words with midscale staffing reality—is instantly punished by reviews. Etuna’s honest **where to play** is **regional premium** in northern Oshana, not global ultra-luxury; therefore **how to win** must be **credible care, culinary identity, reliability, and event proximity**, not imported glitz. Four Seasons also tends toward **wordmark-led** visual discipline; that aligns with Hotel Etuna’s decision to lead with **typography**, not a safari icon, while keeping **warmth** distinct from cold international minimalism.

Public references for Four Seasons themes: [Four Seasons press releases on strategic growth and vision](https://press.fourseasons.com/news-releases/2026/strategic-growth-and-expansion/); [Hotel Management Network on guest-centric strategy](https://www.hotelmanagement-network.com/news/four-seasons-strategy-2024/).

### II.3 What Hotel Etuna must refuse to imitate

Four Seasons optimises for **global RevPAR**, **loyalty among ultra-high-net-worth travellers**, and **capital partnerships** at a scale irrelevant to a single Namibian property. Imitating their **visual language** or **service theatre** without their **cost structure and talent depth** would read as **pretentious** and would collide with **Owambo-rooted authenticity**, which is the actual soul of *Etuna*. Similarly, **unlimited “yes” service** without margin discipline would erode F&B and room profitability. The right borrowing is **rigour**: standards, anticipation, and **one coherent brand story**.

### II.4 The proposed cascade for Hotel Etuna (integrated choices)

**Winning aspiration.** To become the **most trusted premium host in northern Oshana**—the default first choice for corporate, trade-fair, and discerning leisure travellers who prioritise **consistent care, a memorable table, and reliable sleep**, and who describe the property through the **Etuna** promise rather than through empty “luxury” adjectives. A measurable variant of the same aspiration would be to lead **guest-rated quality** on Google and major OTAs within the Ongwediva catchment **(confirm)** target year.

**Where to play.** **Geographically**, the core is **Ongwediva**, with a realistic booking **radius** that includes **Oshakati, Ondangwa, and the B1 corridor**, because digital bookers compare listings in that band regardless of municipal pride. **Segmentally**, the lead segments are **government and corporate**, **trade-fair and conference-adjacent demand** (the property sits roughly **five hundred metres** from the Ongwediva Trade Fair Centre), **regional business travel**, and **families**; **international** leisure is important but often **seasonal** and channel-dependent. **Product-wise**, the play is **tiered rooms**, **Etuna Restaurant as attach revenue and brand proof**, and **tours and excursions** as **margin and storytelling**, not as a fragmented side brand unless ownership explicitly chooses that path.

**How to win.** One sentence that can be trained into staff: **unscripted care rooted in the meaning of Etuna, plus hotel-grade reliability, plus a distinctive northern Namibian table, plus event-ready hosting.** Proof points should be **observable**: airport shuttle and fair packages for stress reduction; **named dishes** and consistent dinner quality so the restaurant is a **reason to return**, not a checkbox; **security, NFC payments, and housekeeping standards** that match photography; and **always-on awareness** so the Project 9 **discovery gap** does not reopen.

**Capabilities.** These must be **funded and staffed**, not declared. They include **service design** (scripts, recovery, check-in, wake-up, invoicing for corporates); **kitchen and bar operations** capable of **consistent** execution under peak load; **B2B sales** with published rate cards and proactive outreach to repeat bookers; **marketing and content** as a **year-round function**; **digital and data hygiene** (Google Business Profile, OTA parity, CRM tags, referral codes); and **employer brand** so turnover does not destroy service consistency.

**Management systems.** These are the **hard rules** that prevent backsliding: a **minimum monthly marketing and content budget** approved annually and adjusted only on a schedule; a **weekly revenue huddle** reviewing occupancy, ADR, **F&B covers per room night**, **direct share**, and new reviews; **investment rules** that forbid “half-launched” influencer experiments without a **hypothesis and measurement plan**; and **one reconciled public room count** across MBA-era case studies, OTAs, and the website **(confirm)**.

---

## Part III — Rebrand questionnaire: narrative responses

### III.1 Brand background (Sections 1.1–1.4)

The name **Etuna** carries a **linguistic and ethical load** that most competitors cannot copy: in Oshiwambo it means **“He takes care of us,”** evoking **protection, stewardship, and communal well-being**. Strategically, that is stronger than another animal silhouette or another founder’s surname because it **tells staff how to behave** and tells guests **what to expect emotionally**. The rebrand to **Hotel Etuna** adds **category credibility** for corporates and OTAs but risks diluting intimacy if “Hotel” is shouted louder than “Etuna.” The north star should remain: **Etuna is the brand; Hotel is the category.**

Ownership should still document the **founder story** in one honest page—why this name, whether faith or family lineage matters publicly, and what boundaries exist on **sacred language** in marketing **(confirm)**. Guests increasingly read **authenticity**; they punish **performed** culture.

Today’s shorthand description might still feel like: **warm, guesthouse-and-tours, Namibian, comfortable, local**. After the rebrand, the desired **post-stay vocabulary** should shift toward **cared-for, refined, memorable dining, confidently hosted, rooted in northern Namibia**—still warm, but **less accidental**, more **intentional**.

### III.2 Target audience (Sections 2.1–2.3)

**Corporate and government** guests should lead because Ongwediva functions as an **administrative and commercial node**, and because the Trade Fair creates **predictable spikes** where **pre-sold packages** and **repeat room blocks** outperform last-minute retail rates. **Business travellers** follow naturally: they need **predictable Wi-Fi**, **breakfast windows**, and **invoice hygiene**. **Families** benefit from pool, family room typology, and security messaging. **International** visitors need **payment clarity** (NAD and Rand acceptance, NFC on property per facts file), **airport shuttle transparency**, and **clear English** in digital touchpoints. **Couples** elevate **Executive and Premier** tiers and dinner occasions. **Tourists** remain vital for **tours**, but the **logo** need not perpetually advertise “& Tours” if the product still sells excursions well on site and online.

The **arrival experience** should feel **expected and safe** before it feels “luxurious.” Luxury that arrives as **cold grandeur** contradicts *Etuna*. Better: **“We have been waiting for you”**—use of name, eye contact, **quiet efficiency**, and **no chaos at the desk**. Sensory cues (palette, temperature, subtle music) should support **calm**, not spectacle.

Differentiation against the **parity stack**—air conditioning, Wi-Fi, TV, pool, parking, restaurant—is **necessary but insufficient**. Hotel Etuna’s **differentiated story** is the **meaning of the name**, the **clarity of five room tiers**, the **specificity of cuisine** (oshifima with spinach, Zambezi bream, potjie, buffet and dinner windows per facts), **Trade Fair adjacency**, and, on the digital side, **Sofia and CRM** as **memory** of guest preference where policy allows (per PRD). Claims such as “the only luxury in the north” should be avoided unless **evidence-backed**; instead, claim **what you can prove every night**.

### III.3 Visual identity, logo, colour, and type (Sections 3–5)

The ownership direction for this programme is clear: the **primary mark must be a wordmark**—**Hotel Etuna**—optionally with the subline **He takes care of us** in subordinate typography. **Cultural depth** should be expressed through **type design, colour, interior materials, photography, and restrained pattern**, not through a **literal leopard or safari crest** competing with the name. A derived **“E”** monogram may serve **favicon, embroidery, and app icon** only if it inherits the **same type DNA** as the wordmark.

The implemented digital system already encodes **rustic and modern luxury**, **warm earth**, and **boutique** restraint in the **Nude-based design system** above: **nude** surfaces and ink, **khaki** for primary action, **terracotta** for heading authority, **sage** for nature and tours, **luxury** tokens for highlights, with **Playfair Display** for display type and **Inter** for UI body **(PRD §7; `tailwind.config.ts`)**. **Dancing Script** should remain a **rare** accent—never the logo core—because overuse cheapens signature typography.

Colours to **avoid as dominance** include **cold corporate blue-greys** that read like banking software, **neon saturation** that fights quiet premium positioning, and **large pure-black outdoor fields** that can fail under **sun and dust** in northern Namibia. Interior paint decisions remain **(confirm)** with the interior designer.

### III.4 Inspiration and anti-patterns (Section 6)

**Four Seasons** remains a **strategic** reference—service anticipation, single-brand discipline—not a **visual** stencil. Additional inspiration should be drawn from **African boutiques** and **European town hotels** that win on **wordmark, restraint, and human photography**. Anti-patterns include **OTA stock sameness**, **Las Vegas gold**, **chain-generic coldness**, and any identity that **mimics** global luxury marks while **lacking** their underlying service depth.

### III.5 Applications and photography (Sections 7–8)

The brand must read strongest where **trust is formed or broken at speed**: **exterior fascia** legible from a moving vehicle, **Google Business Profile** hero imagery consistent with that fascia, **website hero** using the same typographic system, then **reception wall and key cards** as repetition mechanics. **Uniforms, menus, QR collateral, invoices, tour vehicles, and stationery** follow once the core is stable.

Photography should communicate **calm, premium, family-safe, and culinary confidence**, with **culture shown through food and craft** and **consenting participants**, not poverty tourism. **Nature and adventure** belong in the **tour layer** of the site and brochures so the **hotel** identity stays **sleek and restful**. The worst failure mode is **aspirational imagery** that guests contradict on arrival; that mismatch is a **review bomb** in waiting.

---

## Part IV — Market landscape and competitive analysis

### IV.1 Geography and booking behaviour

Ongwediva sits in **Oshana Region** as a **service and retail town** with strong links to **Oshakati** (roughly fifteen kilometres) and to **Ondangwa**, where **larger chain hotels** anchor corporate and transit traffic. The **Oshakati airport** connection (order-of-magnitude **thirty kilometres** per local-area knowledge) matters for **shuttle positioning** and for **international** guest expectations. The **B1 corridor** pulls self-drive itineraries. Practically, a corporate travel booker often searches **“near Ongwediva”** or filters a **radius** on an OTA; competitors are therefore **every visible alternative in that mental map**, not only neighbours on the same street.

### IV.2 Competitive set and roles (indicative)

Within **Ongwediva**, properties such as **Hotel Prestige** and **Hotel Destiny** behave as **direct “hotel” peers** with restaurants and bars. **Ongwediva Town Lodge** competes on **convenience** near retail. **Mango Guesthouse** combines **volume and F&B**, which can pressure **rate** on price-sensitive weeks. **Elem Properties** and **Edo Home** illustrate **homestay and apartment** substitutes that steal **long-stay** nights even when they do not compete on full-service dining. **Legacy listings** for **Etuna Guesthouse & Tours** still fragment **search equity**; the rebrand must enforce **one canonical name, URL, and map listing** so the property does not compete with itself.

In **Oshakati and Ondangwa**, **Protea Hotel Ondangwa** brings **Marriott-scale** distribution, loyalty, and meeting product. **Oshakati Guesthouse**, **Oshakati Country Hotel**, **Fantasia Guest House**, and **Oniipa Guesthouse** illustrate the **regional template**: pool, bar, conference vocabulary, sometimes **cultural experience** marketing that overlaps Etuna’s historical **“& Tours”** equity. Hotel Etuna should not win a **loyalty programme arms race** against Marriott; it should win **relationship, cuisine story, fair proximity, and remembered care**—exactly the **how to win** that fits **where Etuna actually plays**.

### IV.3 Market dynamics, risks, and opportunities

**Parity amenities** are table stakes; **rate wars** with volume guesthouses erode margin without building brand. **OTA dependence** taxes margin but is often **unavoidable** early in the direct channel journey—mitigation is **CRM, repeat corporate, and F&B attach**, not denial. **Reputation risk** is concentrated in **kitchen variability** and **front-desk inconsistency** because digital amplification is permanent.

**Opportunities** align with both **Part II** and **Part I**: **fair packages**, **government rate cards**, **named culinary identity**, **always-on marketing**, **referral and loyalty mechanics**, and **excellent photography of real rooms**. The Project 9 diagnosis that **latent demand exceeded realised demand** is, in commercial language, an **under-leveraged brand asset**—the rebrand plus disciplined demand generation is how that latent curve shifts.

---

## Part V — Positioning lines, execution checklist, metrics, and open decisions

### V.1 Positioning lines (choose one lead externally)

Three coherent options emerged earlier and remain valid. **Care-led:** *Hotel Etuna — where “He takes care of us” is how we host you.* **Place and table:** *Ongwediva’s table — sleep, meet, dine at Hotel Etuna.* **Category clarity:** *Luxury guesthouse. Hotel service.* Ownership should pick **one lead line** and use the others as **supporting copy**, not competing slogans.

### V.2 Execution checklist (digital, brand, and operations)

Canonical **name and address** must match across **Google Business Profile**, **Apple Maps**, **Booking.com and other OTAs**, **social profiles**, **vehicle signage**, and **email footers** (5544 Valley Street; +264 65 231 177; info@hoteletuna.com per facts file). If domains or slugs change, implement **301 redirects** and a **ninety-day pinned explainer** post on social. Add structured data for **Hotel** and **Restaurant** on the website. Institute the **monthly marketing floor** discussed in Part I and Part II. Reconcile **room inventory numbers** across historical MBA case text, OTAs, and the live site **(confirm)**.

### V.3 Metrics for twelve months

Ownership should set numeric targets, but the **metric menu** should include **RevPAR and ADR**, **occupancy by segment**, **direct booking percentage**, **F&B revenue per occupied room**, **repeat corporate nights**, **review velocity and score**, and **branded search volume** for “Hotel Etuna” and “Etuna Ongwediva.” Over time, add **modelled promotional lift** using analytics coursework principles—**simple, transparent models first**; regularised regression when feature sets grow.

### V.4 Open questions for ownership

Whether **“& Tours”** survives in **legal** or **vehicle** branding only; **public boundaries** for faith-linked language around *Etuna*; **target ADR by tier** versus named competitors; **conference specifications** (square metres, capacities, AV); **photography budget**; and the **exact NAD marketing floor** and **who owns the calendar** each week.

---

## Appendix — Coverage, sources, and document control

**Questionnaire coverage.** Sections 1 through 8 of the rebrand questionnaire are addressed in **Part III** and supported by **Parts II, IV, and V**. **Part I** grounds recommendations in **MBA Project 9** and related analytics coursework. The **Design system** section documents **nude foundation**, accents, DaisyUI **`hoteletuna`** theme, typography, and PRD component rules for cross-channel consistency. **External URLs** cited in Part II: [Four Seasons strategic growth press](https://press.fourseasons.com/news-releases/2026/strategic-growth-and-expansion/); [Hotel Management Network — Four Seasons strategy commentary](https://www.hotelmanagement-network.com/news/four-seasons-strategy-2024/).

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-05-13 | Initial questionnaire and landscape |
| 1.1 | 2026-05-13 | Playing to Win, Four Seasons, wordmark lock, Project 9 tables |
| 1.2 | 2026-05-13 | Full narrative rewrite; deep Project 9 systems analysis; MBA analytics tie-in; paragraph-led document |
| **1.3** | **2026-05-13** | **Nude design system: full colour tables, surfaces, CTA, DaisyUI theme, shadows, typography, PRD component rules** |
| **1.4** | **2026-05-16** | **Approved geometric mark (roof + E monogram); Playing to Win N$ brief; loyalty 100 pts = N$50** |
| **1.5** | **2026-05-16** | **Word copy module `lib/copy/`; removed “Free Forever” / SaaS onboarding from guest-facing UI; PRD §7.6** |

**Next steps.** Founders complete **(confirm)** items; design delivers **wordmark system** and signage; marketing publishes **calendar and budget**; product ensures **CRM and GBP** reflect the single canonical story. Engineering: wire remaining pages to `lib/copy/` (room detail, dining hours, CMS) per PRD §7.6.

---

## Part VI — Playing to Win operational brief (N$, May 2026)

**Purpose.** Locks the **management systems** and **N$ guardrails** from the Etuna Enterprises strategy memo (Roger Martin cascade + Four Seasons discipline, not imitation). Engineering and CRM should reflect these numbers until ownership revises them.

### VI.1 Winning aspiration and where to play

Become the **most trusted premium host in northern Oshana** — default for corporate, trade-fair, and discerning leisure. Targets: **4.8+ Google rating**, **≥65% occupancy** in low season. Geography: **Ongwediva + B1 corridor** (Oshakati, Ondangwa). Segments: government/corporate (~40%), trade-fair (~20%), families (~20%), international leisure (~20%). Product tiers (per night, confirm): Standard **N$850**, Luxury **N$1,200**, Family **N$1,500**, Executive **N$1,800**, Premier **N$2,200**.

### VI.2 How to win (proof points)

**Unscripted care + hotel-grade reliability + northern Namibian table + event-ready hosting.** Operational proofs: airport shuttle **N$250 flat**; fair packages (3-night min); named dishes; **30-minute room service** target; **folio settlement** at checkout (cash/card); Sofia + guest profiles for **anticipation** (Four Seasons gear, Etuna margin).

### VI.3 Management systems (N$)

| Rule | Commitment |
|------|------------|
| Marketing floor | **N$5,000/month** always-on (Meta, Google Local, content) — breaks Project 9 vicious cycle |
| Revenue huddle | Weekly: occupancy, ADR, F&B per room night, direct share, reviews |
| Q3 campaign | **N$15,000** (Jul–Sep) incl. Ongwediva Trade Fair (15–20 Aug) |
| Low season | May–Jun “Winter Warmth”: 15% off + free dinner (2 nights); **N$3,000** ad budget, code `WINTERWARM` |
| Referral | **N$200** credit per referred booking (max 5/year) |
| Room count | **One reconciled inventory: 35 rooms** across OTAs, MBA case, and website **(confirm)** |

### VI.4 Loyalty (product-aligned)

- **Earn:** 1 point per **N$10** spent on folio settlement (implemented in `FolioService`).
- **Redeem:** **100 points = N$50** folio adjustment (`CustomerService.redeemLoyaltyPoints`).
- **Brand:** Single wordmark **Hotel Etuna** — tours are a product line, not logo suffix.

### VI.5 Logo mark (implemented)

Approved **geometric monogram**: isosceles **roof** + **stylised E** base (three negative spaces). **Canonical spec (geometry, frame dimensions, verification):** **`docs/project/PRD.md` §9.7**. Assets: `public/brand/hotel-etuna-mark.svg`, `public/brand/hotel-etuna-mark-reference.png`, `components/brand/HotelEtunaMarkIcon.tsx`, `HotelEtunaLogo.tsx`.

**Usage:** Mark in **terracotta-900** (`#6d3722`) on **nude-50** backgrounds; pair with **Playfair Display** wordmark “Hotel Etuna”; optional subline *He takes care of us* in **nude-700**. Do not add “& Tours” to the lockup.

### VI.6 Financial guardrails (targets)

| Metric | Target | Baseline (est.) |
|--------|--------|-----------------|
| Occupancy (annual) | 70% | ~45% |
| ADR | N$1,200 | N$900 |
| RevPAR | N$840 | N$405 |
| F&B / occupied room | N$250 | N$120 |
| Direct booking share | 50% | &lt;20% |
| Marketing % of revenue | 4% | &lt;0.5% |

### VI.7 What we refuse from Four Seasons

Doormen theatre, global ad spend, complex sub-brands. We keep **rigour**: checklists, folio in real time, CRM memory, one brand.
