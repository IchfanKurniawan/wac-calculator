# PRODUCT.md — GREENSHIP NB v1.3 WAC Calculator

## Product Identity
**Name:** GREENSHIP NB v1.3 Water Efficiency Calculator (WAC Calculator)
**Tagline:** Kalkulator Efisiensi Air GREENSHIP NB v1.3
**Version:** 1.3 (NB 1.3 specification)
**Owner:** Green Building Council Indonesia (GBCI)
**Reference URL:** gbcindonesia.org

## Core Purpose
A 6-step wizard that guides building project teams through water efficiency calculations for GREENSHIP New Building v1.3 certification. Calculates WAC 1 (Water Performance), WAC 2 (Water Fixtures), WAC P2 (Rainwater Prerequisite), and Cooling Tower credits. Produces a printable PDF report for certification submission.

## Target Users
- **Primary:** Green building consultants, MEP engineers, sustainability coordinators preparing GREENSHIP submissions
- **Secondary:** Architects, developers, facility managers reviewing water strategy
- **Context:** Professional desktop use during design/development phases; Indonesian locale; offline-capable after first load

## Key User Flows (Happy Path)
1. **New Project** → Enter building data (name, typology, occupants, NLA, hours) → **Step 1**
2. **Fixtures** → Add/replace fixture products per type (WC, urinal, taps, shower) → See live WAC 2 score → **Step 2**
3. **Landscape & CT** → Define irrigation zones (sum to 100%), cooling tower specs → **Step 3**
4. **Rainwater** → Roof area, tank capacity, rainfall data → P2 prerequisite check → **Step 4**
5. **Water Balance** → Review auto-calculated source/use balance, reduction % → **Step 5**
6. **Results** → View WAC 1/WAC 2/P2 scores, download PDF report → **Step 6**

## Functional Scope (Phase 1)
- **Active Typology:** KANTOR (Office) only — others phased for v2+
- **Fixtures:** 7 types (WC flush valve/tank, urinal, wall tap, basin tap, wudhu tap, shower)
- **Landscape:** Up to 5 zones, baseline 5 L/m²/day
- **Cooling Tower:** Optional, COC 2–10, baseline COC 3
- **Rainwater:** Daily rainfall input, tank sizing, P2 prerequisite (≥10% ideal annual volume)
- **Scoring:** WAC 1 ladder (ratio ≤0.45→8pts … ≤0.80→1pt), WAC 2 (≥25%→1, ≥50%→2, ≥75%→3), max 6+3+1=10 pts
- **Export:** Print-optimized Results page → PDF (browser print)

## Non-Functional Requirements
- **Locale:** Indonesian (id-ID) number formatting, Indonesian UI copy
- **Fonts:** Self-hosted variable fonts — Onest (UI), Parkinsans (display)
- **Design System:** GBC Indonesia visual language (from gbcindonesia.org) — green brand, clean cards, data-dense tables
- **Accessibility:** WCAG 2.1 AA — keyboard nav, screen reader labels, focus visible, color contrast
- **Responsive:** Desktop ≥1024px primary; tablet 768px functional; mobile 375px readable (horizontal scroll on tables acceptable)
- **Performance:** <2s TTI on 3G; no heavy deps (lucide-react, recharts only)
- **Offline:** Service worker caches app shell + fonts; calculations run client-side

## Constraints & Invariants
- **6-step wizard** — fixed sequence, no skip, progress persists in localStorage
- **Validation gates** — "Lanjut" disabled when current step has errors
- **Landscape zones** — areaShare must sum to exactly 100%
- **Urinal logic** — toggle ON requires qty > 0; baseline 4 L/flush
- **WAC 2** — only counts fixtures with product rate ≤ baseline
- **Rainwater P2** — tank capacity ≥ 10% of ideal annual volume (prerequisite, not scored)
- **Print** — Results page must render cleanly on A4 (charts as images, no UI chrome)

## Current Stack
- React 18 + Vite + TypeScript
- lucide-react (icons), recharts (charts)
- CSS variables design system in `app.css` + `tokens.ts`
- No UI library (radix, shadcn, etc.) — custom atoms in `atoms.tsx`
- Calculation engine: pure functions in `engine/calculations.ts`, `validation.ts`, `whatIf.ts`

## Success Metrics
- **Task completion:** ≥90% of consultants finish all 6 steps without support
- **Error rate:** <5% validation errors on final submission
- **Time-to-result:** <15 min for typical office project (10 fixture products, 3 landscape zones)
- **PDF fidelity:** Printed report matches on-screen Results 1:1

## Out of Scope (Phase 1)
- Multi-typology selector (only KANTOR)
- Project save/load (localStorage only)
- User accounts, cloud sync
- Historical comparison, versioning
- English locale