# Semantic Gateway

**The verified data layer that makes restaurants visible, readable, and bookable for AI agents.**

---

## The Hook

AI assistants are replacing Google as the front door for local discovery — and they are getting restaurants catastrophically wrong. Semantic Gateway is the infrastructure layer that fixes this: a sub-100ms extraction engine paired with a confidence-scored registry of truth that gives ChatGPT, Perplexity, and Apple Intelligence verified menus, hours, and booking data they can trust.

---

## The Problem

**80% of high-value restaurant data is invisible to AI agents.**

When a customer asks ChatGPT *"What's on the menu at [restaurant]?"*, the answer is often *"I couldn't find menu details."* The data exists — it's just trapped in formats AI can't read: PDF menus, JavaScript reservation widgets, unstructured HTML, and behind client-side rendering.

This is not an edge case. We audited 15 high-end San Diego restaurants and found:

| Failure Mode | Prevalence | Revenue Impact |
|---|---|---|
| Menu locked in PDF | 60% | Agent cannot recommend dishes or price points |
| Hours missing or stale | 47% | Customers arrive to closed doors; trust erodes |
| No structured data (JSON-LD) | 73% | Business is invisible to agent ranking |
| Reservation link undetectable | 53% | Agent cannot complete booking — conversion dies |

A single La Jolla restaurant doing **200 covers/week at $80 avg check** (~$830K/year) had its entire menu in an unreadable PDF. Every failed AI answer is a lost booking. At 2% attribution to AI-driven discovery, that's **$16.6K/year in leaked revenue** — per location.

Restaurants don't know this is happening. There is no Google Analytics for AI visibility. **We built one.**

---

## The Solution

Semantic Gateway solves this with three interlocking components:

### 1. Diagnose — AI Visibility Report
Enter any restaurant URL. Get a **0–100 AI Visibility Score** across 15 checks: business identity, contact info, hours, menu accessibility, structured data presence, reservation widgets, and online ordering. Each failing check includes specific impact copy explaining what AI agents miss and why it costs bookings.

**This is the sales weapon.** We walk into a restaurant with a one-page printout showing what ChatGPT says about them — and what it's getting wrong.

### 2. Capture — Registry of Truth
We ingest the restaurant's authoritative data (menu, hours, reservation links) and structure it into a canonical schema. Every field carries three metadata properties:

- **Provenance** — where did this data come from? (`owner-submitted`, `json-ld-extracted`, `heuristic-parsed`, `manual-entry`)
- **Confidence** — 0.0 to 1.0. Owner-verified = 1.0. Extracted from JSON-LD = 0.9. Heuristic-parsed from HTML = 0.5–0.7.
- **Freshness** — ISO timestamp. Fields older than 7 days trigger a re-verification prompt.

This provenance chain is the moat. We don't just scrape — we build a trust layer that AI agents can rank higher than any other source.

### 3. Publish — Agent-Ready Endpoints
- **Human profile**: `semanticgateway.com/r/{slug}` — verified restaurant page with embedded Schema.org JSON-LD
- **Machine endpoint**: `/api/v1/restaurants/{id}` — deterministic JSON-LD with `_semanticGateway` confidence metadata
- **One-line embed**: A JavaScript tag injecting verified Schema.org markup directly into the restaurant's existing website

When an AI agent hits the restaurant's site, it finds clean, verified, confidence-scored structured data. **Discovery gap closed.**

---

## Why Now

Three forces are converging:

1. **AI agents are the new front door.** ChatGPT has 200M+ weekly users. Perplexity processes 100M+ queries/month. Apple Intelligence is shipping to every iPhone. Consumers are shifting from "search and click" to "ask and act." Restaurants that aren't agent-readable are invisible.

2. **No one owns the structured data layer for local business.** Google has Knowledge Graph but it's read-only and stale. Yelp has reviews but not verified operational data. OpenTable has reservations but not menus. There is no canonical, real-time, machine-readable source of truth for "what's on the menu, what are the hours, can I book a table" — the three questions AI agents ask most.

3. **Schema.org adoption is abysmal in hospitality.** 73% of the restaurants we audited have zero JSON-LD. The restaurants that need structured data most — independent, high-check-average venues in competitive markets — are the ones least likely to have it. This is a distribution problem, not a technology problem. We solve distribution through white-glove onboarding and one-line integration.

---

## Technical Approach

### Architecture

```
URL → Fetch → DOM Parse (Cheerio) → Readability Extract → JSON-LD Mine → Heuristic Parse → Quality Score
                                                                              ↓
                                                          Prisma/PostgreSQL Registry of Truth
                                                                              ↓
                                           Schema.org JSON-LD → Public Profile / API / Embed Script
```

### Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Single repo, edge-compatible, SSR for public profiles |
| **Extraction** | Cheerio + Readability + LinkedOM | DOM parsing without headless browser overhead — sub-100ms |
| **Heuristic Engine** | Custom rule-based parser | Extracts menus, hours, addresses, phones from unstructured HTML when JSON-LD is absent |
| **Database** | PostgreSQL via Prisma ORM | Relational schema for Restaurant → Hours → MenuSections → Items → VerifiedFields |
| **Runtime** | Prisma Accelerate | Connection pooling for serverless/edge deployment |
| **Output** | Schema.org JSON-LD | Industry-standard markup that every major AI agent already parses |
| **Hosting** | Vercel | Edge functions, instant deploys, global CDN |

### Extraction Engine — Benchmarked Performance

| Metric | Result |
|---|---|
| **Token Reduction** | Up to 99.4% (106,000 tokens → 679 tokens on Treehouse SM) |
| **Latency** | < 100ms processing time |
| **Structured Data** | JSON-LD mining + OG metadata + contact extraction + reservation detection |
| **Heuristic Fallback** | Menu items, hours, addresses, phone numbers from raw HTML with confidence scoring |

### Data Model (Prisma)

```
User ─── ApiKey ─── ApiUsage
  └── Subscription

Restaurant ─── OperatingHours (7 days + holiday exceptions)
    ├── MenuSection ─── MenuItem (name, price, dietary flags)
    └── VerifiedField (fieldName, provenance, confidence, lastVerified)
```

Every `VerifiedField` record creates an auditable provenance chain. When an AI agent queries our endpoint, it receives not just the data but a confidence signal for each field — enabling agents to weight our data higher than unverified sources.

---

## What's Already Built and Live

This is not a pitch deck — the core product is deployed:

| Component | Status | Location |
|---|---|---|
| Extraction Engine | **Live** | `lib/extract.ts` — DOM + JSON-LD + Readability + reservation detection |
| Heuristic Parser | **Live** | `lib/heuristics.ts` — menu/hours/address/phone from raw HTML |
| AI Visibility Report | **Live** | `/report` — 15-check, 0–100 score, printable |
| Token Savings Calculator | **Live** | `/calculator` — cost projections across GPT-4o, Claude, Gemini |
| Restaurant Registry Schema | **Live** | Prisma schema with full relational model + confidence metadata |
| Admin Dashboard | **Live** | `/admin` — CRUD, import-from-URL, publish, hours/menu editor |
| Public Profiles | **Live** | `/r/{slug}` — SSR page with embedded JSON-LD |
| Machine Endpoint | **Live** | `/api/v1/restaurants/{id}` — JSON-LD + `_semanticGateway` metadata |
| Embed Script | **Live** | `/api/embed/{id}` — one-line JS tag for restaurant websites |
| Schema.org Builder | **Live** | `lib/schema.ts` — deterministic JSON-LD from verified data |
| API Auth + Quotas | **Live** | Key-based auth, usage tracking, rate limiting |

---

## Go-to-Market

### Beachhead: La Jolla & Del Mar, San Diego
40+ qualifying fine-dining and upscale-casual restaurants ($50+ avg check) within a 10-minute drive. Dense, high-competition market where AI visibility directly impacts covers.

### Sales Motion
1. **Automate the hook.** Run the AI Visibility Report on their site (30 seconds). Generate a one-page printout.
2. **Walk in with proof.** Show the owner what ChatGPT says about them — side by side with what it's getting wrong.
3. **Close on ROI.** $500 setup + $299/mo. At 2% AI attribution on $830K annual revenue, that's a **4.6x ROI**.

### Pricing
| | Setup | Monthly | Annual Value |
|---|---|---|---|
| **Per location** | $500 | $299/mo | $4,088 |
| **ROI at 2% AI attribution** | — | — | $16,600 |
| **Payback period** | — | — | < 3 months |

---

## Impact & Vision

**Near-term (90 days):** 5–10 paying restaurant customers in San Diego. Validated before/after proof that verified data improves AI agent accuracy. Revenue: $15K–$40K ARR.

**Mid-term (12 months):** Expand to 3–5 metro markets. Automate data capture with POS integrations (Toast, Square). Launch self-serve portal. Target: 200+ locations, $800K ARR.

**At scale:** Semantic Gateway becomes the **canonical structured data layer for local business.** Every restaurant, hotel, salon, and medical practice has a verified, confidence-scored data profile that AI agents query in real time. We are the DNS of the agentic web — the lookup layer between "what does the AI need to know?" and "what is actually true?"

The $100B+ local services market is being re-intermediated by AI agents right now. The businesses that are machine-readable win. **We make them machine-readable.**

---

## The Team

**Pramesh Singhavi** — Founder & CEO

- **BS Electrical Engineering (ML focus), UC San Diego** — high-performance system design
- **Former Strategy Consultant, Monitor Deloitte** — market entry, quantitative filtering, client advisory
- **Former Army Intelligence Platoon Leader (SAF)** — real-time terrain analysis, high-pressure decision-making under incomplete information

A unique intersection of engineering depth, strategic rigor, and operational intensity — built for a product that requires all three.

---

## Quick Start

```bash
git clone https://github.com/your-org/semantic-gateway.git
cd semantic-gateway
npm install
cp .env.example .env   # Configure DATABASE_URL, ADMIN_SECRET
npx prisma db push
npm run dev
```

- **AI Visibility Report:** `http://localhost:3000/report`
- **Token Calculator:** `http://localhost:3000/calculator`
- **Admin Dashboard:** `http://localhost:3000/admin`
- **API Docs:** `http://localhost:3000/docs`
