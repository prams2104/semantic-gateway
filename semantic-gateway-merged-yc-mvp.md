# Semantic Gateway
## YC MVP Execution Plan

## Hair on Fire Problem

AI assistants are already the new front door for restaurants — and they're getting it wrong.

When we ran AI Visibility Audits on 15 high-end San Diego restaurants, 80% had critical data (menus, hours, pricing) that ChatGPT and Perplexity could not read. One La Jolla restaurant had its entire menu locked in a PDF: when a customer asked ChatGPT "what's on the menu?", the answer was "I couldn't find menu details." That restaurant does 200+ covers a week at an $80 average check. Every wrong answer is a lost booking.

Restaurants lose bookings and take reputation damage because AI assistants publish wrong hours, wrong menu items, and wrong prices — then customers act on it. This isn't theoretical. It's happening now, and owners don't even know.

## The One-Sentence Pitch

We make sure AI tells the truth about your restaurant by giving assistants a verified, always-current menu and hours endpoint they can read instantly.

## What's Already Built

The core engine and two public tools are live:

- **Extraction Engine** (`lib/extract.ts`): DOM parsing + JSON-LD mining + Readability extraction. Processes any URL in <100ms. Benchmarked: Treehouse SM reduced from 106,000 tokens to 679 tokens (99.4% reduction).

- **AI Visibility Report** (`/report`): Enter any restaurant URL. Gets a 0–100 score across 13 checks (business identity, contact info, ratings, hours, menu accessibility). Per-field impact copy explains exactly what AI agents miss and why it costs bookings.

- **Token Savings Calculator** (`/calculator`): Shows exact token and dollar savings across GPT-4o, Claude, Gemini. Monthly/annual projections. Restaurant-specific insights when Schema.org data is detected.

These are the sales weapons for Week 2 outreach. The report is the walk-in pitch. The calculator proves the technical moat.

## Target User

Owner or GM of a fine-dining or upscale-casual restaurant ($50+ average check) in a competitive metro market. They don't yet know AI is getting them wrong — we show them with the Visibility Audit, and that becomes the sales trigger.

Initial beachhead: La Jolla and Del Mar, San Diego — 40+ qualifying venues within a 10-minute drive.

## Atomic Unit Feature Set

Only what is required to solve "AI is wrong about us" in 14 days.

### 1. AI Visibility Report (lead magnet plus proof)

Already built: `semanticgateway.com/report` runs a real-time audit of any URL — extracts JSON-LD, checks for Schema.org business types, detects PDF menus, validates contact info — and outputs a 0–100 AI Visibility Score with per-field pass/fail and specific impact copy ("When someone asks 'best Italian near me,' you won't appear").

For the pilot, we supplement the automated report with 2–3 manual ChatGPT/Perplexity screenshots showing the actual failure. This is the "before" artifact for the demo.

### 2. Truth Capture and Verification (manual, fast)

Restaurant provides authoritative sources (menu PDF/URL, reservation link, holiday exceptions). We ingest and structure these into our canonical schema.

Every field gets three metadata properties:
- **`provenance`**: where did this data come from? (`owner-submitted`, `json-ld-extracted`, `pdf-parsed`, `manual-entry`)
- **`confidence`**: 0.0–1.0 score. Owner-submitted + verified = 1.0. Extracted from JSON-LD = 0.9. Regex-parsed from body text = 0.5. PDF-inferred = 0.7.
- **`last_verified`**: ISO timestamp. Stale data (>7 days) triggers a refresh prompt.

This is the moat: we don't just scrape — we build a provenance chain that AI agents can trust more than any other source.

### 3. Canonical Publish (human plus machine)

- Human page: `semanticgateway.ai/r/{slug}`
- Machine endpoint: `api.semanticgateway.ai/v1/restaurants/{id}` returning deterministic JSON for hours, menu, and actions.

### 4. One-line Website Integration (discovery hook)

For MVP: we install the script tag ourselves during white-glove onboarding. Most pilot restaurants use WordPress, Squarespace, or agency-managed sites — we handle the integration directly via their CMS admin or by coordinating with their web agency. This is intentionally manual for the first 5–10 customers.

The script injects standard Schema.org JSON-LD (`Restaurant`, `Menu`, `OpeningHoursSpecification`) plus a canonical `<link>` pointing to our verified endpoint. We use existing, recognized markup — not a custom rel type — because AI agents already parse JSON-LD.

The `semantic-profile` link relation is a future standardization play once we have adoption. Not shipping in v0.

### 5. Minimum Monitoring

"Last verified" timestamp plus a manual refresh loop (weekly for MVP). Stale fields (>7 days since `last_verified`) are flagged for re-verification. This is an operational cost we accept at 5–10 customers; automation replaces it post-pilot.

## Conflict Resolution (Fastest Launch Wins)

### Integration choice
- Ship the script tag first.
- We install it ourselves — no self-serve CMS plugin needed for v0.
- The script injects standard JSON-LD automatically.

### Pricing choice for MVP
- $500 setup (covers audit + data capture + script installation) plus $299/month per location.
- Value anchor: a single-location fine-dining restaurant doing 200 covers/week at $80 average check generates ~$830K/year. If AI-driven discovery influences even 2% of new customer acquisition, that's $16.6K/year. We're charging $3,588/year — a 4.6x ROI even at conservative assumptions.
- White-glove onboarding for the first 10 pilots. We do the install and handle the first verification cycle personally.

## Core Workflow (3 Steps)

1. **Diagnose.** Run the AI Visibility Report and show the owner exactly what AI is getting wrong about their restaurant.
2. **Capture.** Collect source of truth (menu, hours, reservation link) and verify it into a structured profile with provenance and confidence scores.
3. **Publish.** Deploy the verified endpoint and install one line on the website so assistants discover it.

## 2-Week Roadmap

### Week 1: Build the smallest shippable product

**Already done:**
- Extraction engine (`lib/extract.ts`) — live, benchmarked, sub-100ms
- AI Visibility Report (`/report`) — 13-check, 0–100 score
- Token Savings Calculator (`/calculator`) — cost projections across models
- Database schema (User, ApiKey, ApiUsage, Subscription models in Prisma)
- API endpoints (`/api/v1/extract`, `/api/v1/calculator`) — authenticated + free tiers

**Build this week:**
- Data model (v0)
  - Restaurant (name, slug, verified status)
  - Hours (plus holiday exceptions)
  - Menu (sections, items, prices, dietary flags)
  - Actions (reserve, order, call, directions)
  - Metadata (`last_verified`, `confidence`, `provenance` per field)
- Publish surfaces
  - `/r/{slug}` human-readable profile page
  - `/v1/restaurants/{id}` deterministic JSON endpoint
- Embed snippet
  - `https://semanticgateway.ai/embed/{id}.js` injects JSON-LD into the restaurant's site
- Operator tooling (no product polish)
  - Internal admin page to create, edit, and publish a profile
- Sales assets
  - AI Visibility Report printout template (one-page, for walk-in pitches)
  - Before/after demo script

### Week 2: Onboard paying pilots and prove the loop

**Pipeline:** We've identified 40+ qualifying restaurants in La Jolla/Del Mar. Outreach sequence:
1. Run the AI Visibility Report on their site (automated, takes 30 seconds).
2. Walk in or email the owner/GM with a one-page printout: "Here's what ChatGPT says about your restaurant — and here's what it's getting wrong."
3. Offer: "We'll fix this in 48 hours. $500 to start, $299/mo to keep it current."

**Target:** 3–5 signed pilots by end of Week 2. Minimum viable proof: 1 paying customer.

- White-glove install the script tag on their site
- Validation tests
  - Run identical prompts across ChatGPT, Perplexity, and Google Gemini before and after
  - Record side-by-side artifacts for the YC demo video
- Monitoring MVP
  - Weekly re-verify menu and hours, update `last_verified` timestamp

## Cut List (Not Doing Yet)

Valuable, but slows launch and does not change day-one value for the pilot.

- CMS plugins (WordPress, Squarespace, Wix) — manual install for MVP
- POS auto-sync (Toast, Square) — manual data capture for MVP
- Agent-side monetization and per-query pricing — post-revenue
- Multi-assistant dashboards and competitor tracking — post-pilot
- Badge directory and agency partnerships — post-traction
- W3C standardization — post-adoption

## Tech Stack and Readiness

**Already built and running:**
- Framework: Next.js 16 (App Router, single repo)
- Database: PostgreSQL via Prisma ORM (User, ApiKey, ApiUsage, Subscription models live)
- Core engine: `lib/extract.ts` — DOM parsing + JSON-LD mining + Readability extraction. Benchmarked at sub-100ms, up to 99% token reduction.
- Live tools: `/report` (AI Visibility Audit), `/calculator` (Token Savings Calculator)
- Hosting: Vercel (edge-compatible)
- Auth: API key system with usage tracking and quota enforcement

**Still needed for MVP:**
- Restaurant and Menu data models in Prisma (Week 1, Day 1–2)
- `/r/{slug}` public profile page and `/v1/restaurants/{id}` JSON endpoint (Week 1, Day 3–4)
- Embed script generator (Week 1, Day 5)
- Internal admin for profile creation (Week 1, Day 5–7)

## Future Plans (Post-MVP Expansion)

Week 4–12, after pilots are live:

- Self-serve restaurant portal for updates and approvals (reduce ops burden)
- WordPress plugin first, then Squarespace and Wix
- Automated change detection (menu page diffs, PDF diffs), then POS sync
- Schema versioning and open-source spec after live usage validates the model
- Partnerships with web agencies, POS platforms, and reservation platforms
