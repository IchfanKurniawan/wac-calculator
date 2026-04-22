# Product Requirements Document (PRD)
## GREENSHIP NB 1.2 — Water Calculator Web Application

| | |
|---|---|
| **Product Name** | Kalkulator Air GREENSHIP NB 1.2 |
| **Document Version** | 1.0 |
| **Status** | Active Development |
| **Phase** | Phase 1 — Pilot (Kantor / Office) |
| **Standard** | GREENSHIP New Building v1.2, GBC Indonesia |
| **Prepared By** | Product & Engineering Team |
| **Last Updated** | April 2026 |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [Target Users & Personas](#4-target-users--personas)
5. [Scope & Phasing](#5-scope--phasing)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [User Flows & Wireframe Descriptions](#8-user-flows--wireframe-descriptions)
9. [WAC Credit Coverage](#9-wac-credit-coverage)
10. [Data Requirements](#10-data-requirements)
11. [Import / Export Requirements](#11-import--export-requirements)
12. [Constraints & Business Rules](#12-constraints--business-rules)
13. [Design System](#13-design-system)
14. [Technical Architecture](#14-technical-architecture)
15. [Security & Compliance](#15-security--compliance)
16. [Deployment & Infrastructure](#16-deployment--infrastructure)
17. [Out of Scope (Current Phase)](#17-out-of-scope-current-phase)
18. [Risks & Mitigations](#18-risks--mitigations)
19. [Roadmap & Future Phases](#19-roadmap--future-phases)
20. [Glossary](#20-glossary)

---

## 1. Executive Summary

The GREENSHIP NB 1.2 Water Calculator is a web-based tool that digitizes GBC Indonesia's official Excel-based water consumption assessment tool for GREENSHIP New Building certification. It enables architects, MEP engineers, and green building consultants to calculate a building's Water Consumption Index (WCI), evaluate compliance against GREENSHIP water credits (WAC P2, WAC 1, WAC 2, WAC 5, WAC 6), and produce a traceable calculation record.

The application replaces a complex, multi-sheet Excel workbook with a guided 6-step wizard that provides real-time feedback, structured data entry, validation, import/export capabilities, and a responsive interface accessible from desktop, tablet, and mobile devices.

**Phase 1 covers the Office (Kantor) building typology only.** All remaining typologies have baseline constants prepared in code, but still require typology-specific UI, validation, and workbook verification before they can be unlocked.

---

## 2. Problem Statement

### Current State
GBC Indonesia provides water consumption assessment as a multi-sheet Microsoft Excel file. Users must:
- Understand a complex, undocumented formula chain across hidden sheets
- Manually enter data across 4+ sheets with no guided flow
- Interpret error states (`#REF!`, `"Error"`) that appear when inputs are incomplete or incorrect
- Share files by email with no version control
- Re-calculate from scratch when building parameters change

### Pain Points

| Pain Point | Impact |
|---|---|
| No input guidance — users don't know what to fill or in what order | High error rate; incorrect WAC scores submitted to GBC |
| Hidden backend sheets contain all formulas — opaque to users | Consultants cannot verify or explain calculations |
| Excel formatting breaks on older/different versions | Data loss; wasted time |
| No mobile access — Excel unusable on phones/tablets | Consultants cannot work on-site |
| No data persistence between sessions | Lost work on browser close |
| No import/export standard format | Each project is siloed; no reuse |
| Sliders for percentage inputs cause precision loss | Incorrect calculation inputs |

### Opportunity
A purpose-built web application with built-in formula transparency, step-by-step guidance, and real-time calculation addresses all pain points while maintaining full fidelity to the official GREENSHIP standard.

---

## 3. Goals & Success Metrics

### Product Goals

| Goal | Metric | Target |
|---|---|---|
| Eliminate input errors | % of users completing Step 6 without validation errors | ≥ 85% |
| Reduce time-to-result | Minutes from first input to final WAC score | ≤ 30 min (vs. ~90 min in Excel) |
| Increase formula transparency | User survey: "I understand how the score was calculated" | ≥ 4.0 / 5.0 |
| Enable mobile use | % of sessions from mobile/tablet | ≥ 20% |
| Enable data reuse | % of users who import/export data | ≥ 40% |
| Achieve certification accuracy | WAC scores match official Excel output | 100% |

### Technical Goals
- Zero backend infrastructure (fully client-side)
- TypeScript coverage: 100% of business logic files
- All numeric inputs: 3 decimal place precision
- Lighthouse performance score ≥ 90
- Accessible on all major browsers (Chrome, Firefox, Safari, Edge)

---

## 4. Target Users & Personas

### Primary Users

**1. MEP Engineer / Green Building Consultant**
- Uses the tool professionally for multiple projects per month
- Needs accurate WAC scoring to submit to GBC Indonesia
- Expects to import/export project data for record-keeping
- Works on desktop primarily; occasional tablet on-site
- Pain: Wastes time debugging Excel formula errors

**2. Architect (Project Lead)**
- Reviews WAC scores during design development
- Does not need to fill in all fields — mostly views results
- Mobile or tablet likely
- Pain: Cannot access Excel on-site; cannot explain score to clients

**3. Building Owner / Developer Representative**
- Wants to understand savings potential and certification status
- Non-technical; needs clear visual summary
- Mobile likely
- Pain: Results page of Excel is unreadable

### Secondary Users

**4. GBC Indonesia Technical Advisor**
- Verifies submitted calculations for correctness
- Needs to audit the formula logic
- Desktop only

**5. University Researcher / Student**
- Learning GREENSHIP methodology
- May use template to practice calculations

---

## 5. Scope & Phasing

### Phase 1 — Current (Pilot: Kantor)

**In scope:**
- KANTOR (Office) typology — full calculation engine
- 6-step wizard UI with full responsive support
- All WAC credits: P2, 1, 2, 5, 6
- Import / Export: JSON
- Neraca Air (water balance) table — NB 2.0 structure
- Auto-fill and sync toggles in Neraca Air
- Real-time WAC 2 live scoring panel
- Results dashboard with consumption chart
- Netlify deployment

**Not in scope (Phase 1):**
- User accounts / authentication
- Server-side storage
- Multi-project management
- All typologies except Kantor
- PDF export of results
- WAC 3 / WAC 4 dedicated UI (covered via Neraca Air)
- Dishwasher, bathtub calculations
- HVAC condensate sub-calculator

### Phase 2 — Next

- Pabrik (Factory) — 3-shift model, equipment water
- Mall / Pertokoan / Retail
- Apartemen / Hotel / Rusun
- Airport

### Phase 3 — Future

- Masjid (pilot, with caveat)
- Stadium
- PDF export (official calculation report)
- Multi-project dashboard with localStorage
- HVAC condensate sub-calculator (Sheet 4)

**Readiness checklist before activating a future typology:**
- Typology-specific inputs are available in the UI
- Normalization and daily formulas are verified against the source workbook
- Fixture availability and Neraca Air mappings are validated
- JSON import/export supports the typology fields without data loss
- Result copy, units, and edge cases are tested end-to-end

---

## 6. Functional Requirements

### FR-01: Building Data Entry
- User must enter: Project name, typology, NLA (m²), occupant count, operational hours per day
- System must display: Relevant behavioral constants for the selected typology
- System must validate: NLA ≥ 250 m² (inline error, non-blocking)
- Changing typology resets the entire form to defaults with a clear state change

### FR-02: Water Fixture Entry (WAC 2)
- User can enter up to **4 product rows** per fixture type
- Each row: product name (text), quantity (integer), design flow rate (decimal)
- System auto-computes: weighted average rate, product share %, "Hemat" or "Tidak Hemat" badge
- System displays live WAC 2 score (0–3 pts) updating in real time
- Toggle for "Ada Urinal" switches male WC calculation between urinal and no-urinal mode
- WAC 2 scoring per NB 1.3: ≥25%→1, ≥50%→2, ≥75%→3

### FR-03: Landscape & Cooling Tower Entry
- Landscape: up to 5 area zones; each with design rate (L/m²) and area share (%)
- Landscape baseline rate = 5 L/m² (locked, non-editable, per SNI standard)
- Area share sum must equal 100.000% — live validation indicator
- Cooling Tower: toggle (enabled/disabled), load input (TR)
- CT baseline = CT design (no savings modeled for CT fixture efficiency)

### FR-04: Rainwater Harvesting Entry (WAC 6)
- Toggle: tank present yes/no
- Inputs: % rainy days (min 10-year basis), tank capacity (L), average rainfall (mm), runoff coefficient (0–1), roof catchment area (m²)
- System computes: ideal tank volume, capture ratio, daily available volume (wet day)
- Dry day available = 0 (automatic)

### FR-05: Neraca Air (Water Balance)
- Two independent scenarios: **Hari Basah** (wet) and **Hari Kering** (dry)
- **Side A (Sources):** 8 rows; "Volume Tersedia" auto-computed; "Volume Diolah" user-entered
  - `ct_condensate` and `others` rows: user inputs both available and processed volumes
- **Side B (Uses):** 7 rows; "Kebutuhan" auto-computed; "Dari Alt." and "Dari Recycle" user-entered
- Live "% Terpenuhi" per use row (computed)
- Live balance status: SEIMBANG / TIDAK SEIMBANG / ERROR
- **Auto-fill feature (Source):** ⚡ Auto button per row — locks "Diolah" = "Tersedia", reactive to design changes
- **Auto-fill feature (Use):** ⚡ Alt and ⚡ Rec buttons per row (mutually exclusive) — locks the respective column = kebutuhan
- **Sync toggle:** "Samakan Basah & Kering" — propagates all changes to both scenarios simultaneously
- Reset button per scenario

### FR-06: Results Dashboard (WAC Scores)
- Display: Baseline (computed), Design (from primary), % Savings — all in typology-specific unit
- WAC P2 status: LULUS whenever `baselineNorm > 0` (data is filled)
- WAC 1 score (0–8 pts) with progress bar
- WAC 2 score (0–3 pts) with progress bar
- Bar chart: Baseline vs. Design per category (WC+Urinal, Tap+Shower, Landscaping, CT)
- 8-cell stat grid: total BL, total DSG, reduction, from primary, capture ratio, WAC P2, BL/DSG normalized
- All normalized values shown to 3 decimal places

### FR-07: Import / Export — JSON
- Export: current AppState → JSON file download (`WAC_{name}_{timestamp}.json`)
- Import: select `.json` file → validate schema → load state → jump to Step 1
- Validation errors shown in notification banner with specific error messages
- Landscape area share must total exactly 100.000% or the import is rejected
- Incomplete imports (missing required fields) rejected with explanation

### FR-08: Notifications
- Toast notification appears in top-right corner
- Types: OK (green), Error (red), Warning (amber)
- Auto-dismiss after 6 seconds; manual close button
- Multiple messages can stack in a single notification

### FR-09: Sidebar
- Always visible on desktop (230px fixed)
- Hamburger menu on mobile/tablet → overlay drawer
- Shows: project name, step navigation, live WAC score summary, import/export buttons
- Step navigation: clicking any step jumps directly to it

### FR-10: Responsiveness
- Desktop (≥ 1024px): full sidebar, 2-col fixture layout
- Tablet (640–1023px): hamburger drawer + step tab bar below topbar
- Mobile (< 640px): hamburger drawer + dot progress indicators, all layouts single-column

---

## 7. Non-Functional Requirements

### NFR-01: Performance
- Initial page load (FCP): ≤ 2 seconds on standard broadband
- Real-time calculation: ≤ 50ms response to any input change
- Bundle size: < 500KB gzipped total

### NFR-02: Accuracy
- All WAC scores must match the official GREENSHIP Excel calculator to within 0.001 L/day
- Numeric precision: 3 decimal places displayed; JavaScript float arithmetic (64-bit IEEE 754)
- No rounding errors in intermediate steps — all intermediate values preserved as full floats

### NFR-03: Reliability
- Works fully offline after initial page load (no API dependencies)
- No data lost on page refresh (localStorage draft persistence — Phase 2)
- All browser tabs independent (no cross-tab state conflicts)

### NFR-04: Browser Support
- Chrome ≥ 90, Firefox ≥ 88, Safari ≥ 14, Edge ≥ 90
- No IE11 support required

### NFR-05: Accessibility
- All form inputs have associated labels
- Color is never the sole indicator of status (icons + text accompany all colored elements)
- Keyboard-navigable
- Minimum contrast ratio: 4.5:1 for body text (WCAG AA)

### NFR-06: Maintainability
- Calculation engine (`src/engine/calculations.ts`) contains zero UI code — pure functions only
- Constants database (`src/constants/`) separated from business logic
- Adding a new typology requires passing the readiness checklist and then enabling `active: true` in config
- All TypeScript; `strict: true`

### NFR-07: Internationalization
- Language: Indonesian (Bahasa Indonesia) for all user-facing labels
- Number formatting: Indonesian locale (`id-ID`) — period as thousands separator, comma as decimal... but inputs use standard period decimal (HTML `input[type=number]`)
- Date formatting: ISO 8601 in export metadata

---

## 8. User Flows & Wireframe Descriptions

### Flow A — New Project (Primary Flow)

```
[Land on App]
     │
     ▼
[Step 1: Data Bangunan]
  → Enter building name
  → Select typology (KANTOR)
  → Enter NLA (m²) — error shown if < 250
  → Enter number of employees
  → Enter operational hours
  → See constant preview card (WC rate, tap usage, result unit)
     │
     ▼
[Step 2: Fitur Air]
  → Toggle urinal (yes/no)
  → For each fixture type: add products with qty + design rate
  → See WAC 2 live panel update (right column on desktop, top on mobile)
  → WAC 2 score updates with every keystroke
     │
     ▼
[Step 3: Lansekap & CT]
  → Enter irrigated area (m²)
  → Add up to 5 landscape zones (design rate + area share %)
  → See share sum validator (must = 100%)
  → Toggle CT on/off; enter load (TR)
     │
     ▼
[Step 4: Air Hujan]
  → Enter % rainy days (min 10-year basis)
  → Toggle tank (yes/no)
  → Enter tank capacity, rainfall, runoff, roof area
  → See capture ratio + available volume
     │
     ▼
[Step 5: Neraca Air]
  → Default: Hari Basah tab
  → Fill Side A: Volume Diolah per source row
    (or use ⚡ Auto to auto-fill from computed available)
  → Fill Side B: Dari Alt / Dari Recycle per use row
    (or use ⚡ Alt / ⚡ Rec auto-fill per row)
  → Watch balance status indicator update
  → Switch to Hari Kering tab; repeat
    (or enable 🔗 Sync to mirror inputs from Basah)
     │
     ▼
[Step 6: Hasil WAC]
  → See baseline + design values (L/pegawai/hari)
  → See WAC P2 LULUS status
  → See WAC 1 (0–8 pts) + WAC 2 (0–3 pts) with bars
  → Review bar chart (baseline vs design per category)
  → Review 8-cell stat summary
```

### Flow B — Import Existing Project

```
[Open App] → [Click "Impor JSON" in sidebar]
     │
     ▼
[File picker opens]
     │
     ├── Valid file → State loaded → Jump to Step 1
     │               Notification: "Data berhasil diimpor"
     │
     └── Invalid file → Stay on current step
                        Notification (red): list of errors
```

### Flow C — Export + Re-import (Round Trip)

```
[Complete Steps 1–5] → [Click "Ekspor JSON"] → [File downloaded]
       │
       ▼ (later session)
[Click "Impor JSON"] → [Select file] → [Exact state restored] → [Continue from Step 1]
```

---

## 9. WAC Credit Coverage

| Credit | Mechanism | How It Works in the App |
|---|---|---|
| **WAC P2** (Prerequisite) | Pass/Fail | Passes whenever `baselineNorm > 0` — i.e., user has filled enough building data for a baseline calculation |
| **WAC 1** (Consumption Reduction, 0–8 pts) | Computed | Score derived from `design_norm / baseline_norm` after Neraca Air reduction |
| **WAC 2** (Fixture Efficiency, 0–3 pts) | Computed (live) | % of fixture units with design rate ≤ baseline; NB 1.3 scoring |
| **WAC 3** (Water Recycling) | Manual input | Via "Dari Recycle" columns in Neraca Air — system computes total recycle reduction |
| **WAC 5** (Alternative Water Sources) | Manual input | Via "Dari Alt." columns in Neraca Air — system computes total alternative reduction |
| **WAC 6** (Rainwater Harvesting) | Computed | Capture ratio from Step 4; rainwater available feeds into Neraca Air source row |

### WAC 1 Scoring Table (Office)

Scoring is based on percentage savings relative to the **dynamically computed baseline**:

| Savings | Design/Baseline Ratio | WAC 1 Points |
|---|---|---|
| ≥ 55% | ≤ 45% | **8 pts** |
| ≥ 50% | ≤ 50% | 7 pts |
| ≥ 45% | ≤ 55% | 6 pts |
| ≥ 40% | ≤ 60% | 5 pts |
| ≥ 35% | ≤ 65% | 4 pts |
| ≥ 30% | ≤ 70% | 3 pts |
| ≥ 25% | ≤ 75% | 2 pts |
| ≥ 20% | ≤ 80% | 1 pt |
| < 20% | > 80% | 0 pts |

---

## 10. Data Requirements

### Input Data — Per Building Project

**Section 1: Building**

| Field | Type | Required | Constraint |
|---|---|---|---|
| Project Name | Text (max 200 chars) | Yes | Non-empty |
| Typology | Enum | Yes | `KANTOR` (Phase 1) |
| NLA | Number (m²) | Yes | ≥ 250 |
| Occupant Count | Integer | Yes | ≥ 1 |
| Operational Hours | Number | Yes | 1–24 |

**Section 2: Fixtures** (per fixture type, up to 4 products each)

| Field | Type | Required | Constraint |
|---|---|---|---|
| Product Name | Text | No | |
| Quantity | Integer | No | ≥ 0 |
| Design Flow Rate | Number | No | ≥ 0, ≤ 1000 |

**Section 3: Landscape** (up to 5 zones)

| Field | Type | Required | Constraint |
|---|---|---|---|
| Total Irrigated Area | Number (m²) | No | ≥ 0 |
| Zone Label | Text | No | |
| Zone Baseline Rate | Number (L/m²) | Auto-set | Locked = 5 |
| Zone Design Rate | Number (L/m²) | No | ≥ 0 |
| Zone Area Share | Number (%) | No | 0–100; sum must = 100 |

**Section 4: Cooling Tower**

| Field | Type | Required | Constraint |
|---|---|---|---|
| CT Enabled | Boolean | Yes | |
| CT Load | Number (TR) | If enabled | ≥ 0 |

**Section 5: Rainwater**

| Field | Type | Required | Constraint |
|---|---|---|---|
| Tank Present | Boolean | Yes | |
| % Rainy Days (10-yr) | Number (%) | Yes | 0–100 |
| Tank Capacity | Number (L) | If tank | ≥ 0 |
| Average Rainfall | Number (mm) | If tank | ≥ 0 |
| Runoff Coefficient | Number | If tank | 0–1 |
| Roof Area | Number (m²) | If tank | ≥ 0 |

**Section 6: Neraca Air** (per scenario: wet + dry)

| Field | Type | Constraint |
|---|---|---|
| Volume Diolah (per source) | Number (L/day) | ≥ 0; ≤ volumeTersedia |
| Available Manual (CT condensate, others) | Number (L/day) | ≥ 0 |
| Dari Alt (per use) | Number (L/day) | ≥ 0 |
| Dari Recycle (per use) | Number (L/day) | ≥ 0 |
| Combined fulfillment | Auto-validated | ≤ kebutuhan per row |

### Computed Outputs

| Output | Unit | Where Shown |
|---|---|---|
| WAC P2 | Pass/Fail | Step 6, Sidebar |
| WAC 1 Points | 0–8 | Step 6, Sidebar |
| WAC 2 Points | 0–3 | Step 2 (live), Step 6, Sidebar |
| Baseline Consumption | L/pegawai/hari | Step 6 |
| Design Consumption (primary) | L/pegawai/hari | Step 6 |
| Water Savings % | % | Step 6 |
| Total Reduction from Neraca | L/day | Step 6 |
| Rainwater Capture Ratio | % | Step 4, Step 6 |
| Landscape Baseline / Design | L/day | Step 3 |
| CT Water Consumption | L/day | Step 3 |

---

## 11. Import / Export Requirements

### IR-01: JSON Export
- Format: UTF-8 JSON, pretty-printed (2-space indent)
- Schema version: `"2.0"`
- Filename: `WAC_{projectName}_{timestamp}.json`
- All AppState fields included
- Auto-fill toggle states NOT included (session-only UI state)

### IR-02: JSON Import
- File picker limited to `.json` files
- Max file size: 5 MB
- Schema version must match `"2.0"`
- Required fields: `state.building.name`, `state.building.typology`
- Either `occupant1 > 0` or `nla > 0` must be true
- Landscape area share sum must equal exactly `100.000%`; otherwise import is rejected
- Validation errors shown as a list; import rejected on any error
- On success: state loaded, user redirected to Step 1

---

## 12. Constraints & Business Rules

| Rule | Specification |
|---|---|
| **NLA minimum** | 250 m² — inline UI warning (non-blocking; import allowed below 250) |
| **Landscape baseline** | Fixed at 5 L/m² per irrigation cycle; cannot be user-edited (SNI standard) |
| **Landscape irrigations** | 2 times per day (Office constant; not user-configurable) |
| **WAC P2 pass condition** | `baselineNorm > 0` — passes as soon as enough data is filled |
| **WAC 2 max points** | 3 points (NB 1.3 criteria) |
| **Fixture products per type** | Maximum 4 products per fixture type |
| **Landscape zones** | Maximum 5 zones |
| **Area share sum** | Must equal exactly 100.000% to avoid calculation error |
| **Urinal auto-timer** | Handled as a behavioral constant (not user-configurable) |
| **Rainy day % label** | Must read "Persentase Hari Hujan minimal 10 Tahun (%)" per client requirement |
| **Neraca Air source — flush** | Maps to `wcDsg` ONLY (WC valve+tank) — NOT `flushDsg` (which also includes urinal) |
| **Number input precision** | All numeric inputs accept 3 decimal places (`step=0.001`) |
| **Sync toggle** | Session-only; not persisted in export/import |
| **Auto-fill toggles** | Session-only; not persisted in export/import |
| **File import size** | Maximum 5 MB per file |
| **Future typologies** | Baseline constants may exist in codebase, but activation requires the typology readiness checklist; UI remains locked until then |

---

## 13. Design System

Based on `design.md` — **"Veridian Metric"** palette.

### Color Tokens

| Token | Hex | Usage |
|---|---|---|
| Deep Teal (`C.teal`) | `#1B4E4D` | Sidebar background, primary brand, section headers |
| Mint Glow (`C.mint`) | `#D3FEAB` | Active states, progress bars, sidebar text, success highlights |
| Amber Orange (`C.amber`) | `#FF9500` | Warnings, in-progress states |
| Slate 50 (`C.slate`) | `#F8FAFC` | Page background |
| Slate 100 (`C.s100`) | `#F1F5F9` | Card inner backgrounds, read-only fields |
| Slate 200 (`C.s200`) | `#E2E8F0` | Borders, dividers |
| Slate 500 (`C.s500`) | `#64748B` | Secondary text, labels |
| Slate 800 (`C.s800`) | `#1E293B` | Primary text |
| Green | `#16A34A` | Success badges, "Hemat" status |
| Red | `#DC2626` | Error badges, "Tidak Hemat" status, validation errors |
| Blue | `#2563EB` | Rainwater results accent |

### Typography

- **Primary font:** Inter (Variable) — loaded from Google Fonts
- **Display large:** 52px, weight 800 — WAC score numbers
- **Headline:** 26px, weight 800 — hero result values
- **Section title:** 12px, weight 700, uppercase, letter-spacing 0.07em — card headers
- **Body:** 13–14px, weight 400 — form labels and content
- **Label:** 12px, weight 500, letter-spacing 0.04em — input labels
- **Micro:** 9–11px — metadata, badges, sidebar footnotes
- **Tabular numbers:** `font-variant-numeric: tabular-nums` on all data values

### Component Library

| Component | Description |
|---|---|
| `Label` | Field label with optional unit in parentheses |
| `Inp` | Number or text input; step=0.001 default; disabled state with opacity |
| `Sel` | Dropdown select |
| `Card` | White card with 1px border, 8px radius, 20px padding |
| `SecTitle` | Section header with optional Lucide icon |
| `Pill` | Stat display: large value + small label + optional unit |
| `Tog` | iOS-style toggle switch |
| `Check` | Styled checkbox with label |
| `PctInp` | Percentage input (stores 0–1, displays 0–100 with 3dp) |
| `AutoPill` | Small ⚡ Auto pill button for Neraca Air auto-fill |
| `FixtureSection` | Fixture product table (up to 4 rows per type) |
| `Notif` | Toast notification (ok/err/warn) with icon and close button |

### Iconography
- Library: **Lucide React** (`@0.383.0`)
- Size: 14px for nav icons, 11–16px for action icons
- Style: outlined

### Favicon
- Inline SVG (base64 data URI in index.html)
- Design: water faucet with green drops on deep teal background
- Shape: rounded square (8px radius)

---

## 14. Technical Architecture

### Stack

| Layer | Technology | Reason |
|---|---|---|
| Framework | React 18 + TypeScript | Component model; strict typing for formula engine |
| Build tool | Vite 5 | Fast HMR; efficient production bundling |
| Charts | Recharts | React-native bar chart for results |
| Icons | Lucide React | Consistent outlined icon set |
| Styling | Inline styles with CSS token objects | Zero runtime CSS dependency; easy theming |
| State | React `useState` + `useMemo` | No external state library needed at current scale |
| Import/Export | Browser File API + Blob URL | No server required |
| Deployment | Netlify | Free tier; CDN; custom headers via `netlify.toml` |

### Architecture Principles

**1. Pure Calculation Engine**
`src/engine/calculations.ts` contains zero UI imports. All functions are pure: `(inputs) → output`. This means:
- Engine is fully unit-testable without a browser
- Formula changes do not require touching any UI component
- Adding a typology requires only updating `src/constants/typologies.ts`

**2. Constants Database Separation**
`src/constants/` holds all values that may change per standard version or typology update — baselines, behavioral constants, normalization formulas. Changing a standard requires editing only this folder.

**3. Reactive Calculation**
Every UI change triggers `useMemo(() => calcAll(state), [state])` — the entire result set recomputes in < 50ms and is available to all steps simultaneously (including the sidebar live score).

**4. Type Safety**
`src/types/index.ts` defines all data shapes. The TypeScript compiler enforces that every part of AppState is handled in calculations, import/export, and UI. No `any` types in business logic.

### Component Hierarchy

```
App
├── Notif (toast)
├── Sidebar (nav + scores + import/export)
└── Main
    ├── TopBar (step indicator + navigation)
    ├── TabletTabBar (conditional)
    └── StepContent
        ├── Step1: Data Bangunan
        ├── Step2: Fitur Air (WAC 2)
        ├── Step3: Lansekap & CT
        ├── Step4: Air Hujan (WAC 6)
        ├── Step5: Neraca Air (with Auto-fill + Sync)
        └── Step6: Hasil WAC
```

### Data Flow

```
User Input
    │
    ▼
setState(newAppState)
    │
    ▼
useMemo: calcAll(state) → CalcResults
    │
    ├── Step 2: wac2 (live)
    ├── Step 5: daily values → neraca available/required
    ├── Step 6: wac1, wac2, chart data, stats
    └── Sidebar: wac1.pts, wac2.pts, wac1.p2Pass
```

---

## 15. Security & Compliance

### Security Measures

| Measure | Implementation |
|---|---|
| No backend | Fully client-side; zero server attack surface |
| Input sanitization | `sanitize.ts` strips XSS, script injection, SQL patterns from all text inputs |
| Import validation | JSON parsed then schema-validated; unknown keys ignored; values range-clamped |
| File size limit | 5 MB max on import to prevent memory DoS |
| No `eval()` | React virtual DOM; no dynamic code execution |
| No external API calls | Zero outbound data except Google Fonts CDN on load |
| Content Security Policy | Strict CSP via Netlify headers prevents XSS and unauthorized resource loading |
| X-Frame-Options: DENY | Prevents clickjacking |
| HSTS | Forces HTTPS with 2-year max-age |
| No analytics trackers | No user behavior tracking embedded |

### Data Privacy
- No user data is transmitted to any server
- All calculation data stays in the browser memory/localStorage
- Export files contain only project calculation data — no PII unless user enters names
- No cookies set; no session tokens

---

## 16. Deployment & Infrastructure

### Netlify Configuration

```
Build command:     npm run build
Publish directory: dist/
Node version:      20
```

### Security Headers (`netlify.toml`)

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline';
                         style-src 'self' 'unsafe-inline'; img-src 'self' data:;
                         connect-src 'self'; font-src 'self' fonts.gstatic.com;
                         object-src 'none'; frame-ancestors 'none'
X-Frame-Options:          DENY
X-Content-Type-Options:   nosniff
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Referrer-Policy:          strict-origin-when-cross-origin
Permissions-Policy:       camera=(), microphone=(), geolocation=()
```

### SPA Routing
```
[[redirects]]
  from = "/*"
  to   = "/index.html"
  status = 200
```

### CI/CD
- Connect GitHub/GitLab repo to Netlify
- Auto-deploy on push to `main`
- Preview deploys on pull requests

---

## 17. Out of Scope (Current Phase)

| Item | Notes |
|---|---|
| User accounts / login | No auth; project data is local |
| Server-side storage | Everything stays in browser |
| Multi-project management | Single project per session |
| PDF report export | Planned Phase 3 |
| Factory / Mall / Apartemen / Airport typologies | Phase 2 |
| Masjid / Stadium | Phase 3 |
| Dishwasher calculation | Noted in Excel "FurtherDevelopment" sheet |
| Bathtub calculation | Noted in Excel "FurtherDevelopment" sheet |
| HVAC condensate sub-calculator | Phase 3 (separate Sheet 4 logic) |
| WAC 4 (non-portable water) | Not in current calculator scope |
| Washing machine calculation | Apartemen/Hotel only — Phase 2 |
| Mobile app (native) | Web app with responsive design is sufficient |
| Localization beyond Indonesian | Not required |
| Dark mode | Not in scope |

---

## 18. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| GREENSHIP standard updates (NB 1.3 → NB 2.0) invalidate baselines | Medium | High | All constants isolated in `src/constants/` — update requires only one file |
| Formula discrepancy with official Excel | Low | Critical | Formula cross-verification against both xlsx files done and documented in PLANNING.md §18 |
| Browser precision issues (float arithmetic) | Low | Medium | All displayed values rounded to 3dp; intermediate values kept as full float64 |
| User imports invalid/corrupted file | High | Low | Strict schema validation with user-friendly error messages; original state unchanged on failed import |
| Large import file causes browser hang | Low | Medium | 5MB file size limit on import |
| Future typology adds break existing data | Medium | Medium | AppState version field (`"2.0"`) allows migration logic in future importExport.ts updates |
| Netlify free tier limits exceeded | Low | Medium | App is static; no server-side compute; free tier is sufficient for 100k+ page views/month |
| Google Fonts CDN unavailable | Low | Low | Font falls back to system sans-serif; layout intact |

---

## 19. Roadmap & Future Phases

### Phase 2 — Additional Typologies (Q3 2026 target)

| Feature | Details |
|---|---|
| Pabrik (Factory) | 3-shift occupancy model, configurable gender ratio, equipment/process water category |
| Mall / Pertokoan | Dual occupancy (employees + visitors), 12-hour op hours |
| Apartemen / Hotel | 24-hour residential model, washing machine, per-unit normalization |
| Airport | Dual occupancy, high tap usage constants |

### Phase 3 — Platform Features (Q4 2026 target)

| Feature | Details |
|---|---|
| PDF Report Export | Official-format calculation report suitable for GBC submission |
| Multi-project dashboard | LocalStorage project list; CRUD operations |
| Masjid typology | With pilot caveat note |
| Stadium typology | |
| HVAC condensate calculator | Standalone sub-calculator (Sheet 4 equivalent) |
| Dishwasher + bathtub | Apartemen/Hotel additions |

### Phase 4 — Cloud & Collaboration (2027)

| Feature | Details |
|---|---|
| User accounts | Optional login; cloud sync |
| Team collaboration | Share project link; multiple editors |
| GBC submission integration | Direct digital submission to GBC Indonesia portal |
| Audit trail | Timestamped change log per project |
| Benchmark database | Anonymized consumption data across building types |

---

## 20. Glossary

| Term | Definition |
|---|---|
| **WAC** | Water and Waste Conservation — the water efficiency category in GREENSHIP |
| **WAC P2** | Prerequisite: building must show primary source consumption data |
| **WAC 1** | Water consumption reduction credit (0–8 pts) |
| **WAC 2** | Water fixture reduction credit — % of installed fixtures meeting baseline (0–3 pts, NB 1.3) |
| **WAC 3** | Water recycling credit — addressed via Neraca Air "Dari Recycle" column |
| **WAC 5** | Alternative water source credit — addressed via Neraca Air "Dari Alt" column |
| **WAC 6** | Rainwater harvesting credit |
| **WCI** | Water Consumption Index — normalized daily consumption per typology unit |
| **Baseline** | Dynamic standard consumption computed from SNI-standard flow rates |
| **Design** | Actual proposed consumption using specified fixture design rates |
| **NLA** | Net Lettable Area (m²) — usable floor area of the building |
| **TR** | Ton Refrigeration — unit of cooling load |
| **Neraca Air** | Water Balance — table matching available sources vs. end uses |
| **Hari Basah** | Wet day scenario in Neraca Air |
| **Hari Kering** | Dry day scenario in Neraca Air |
| **Diolah** | Processed volume — user-entered portion of available source water |
| **Pemenuhan** | Fulfillment — Alt + Recycle volume applied to a use category |
| **Kebutuhan** | Required volume — computed design consumption for each use |
| **GBC Indonesia** | Green Building Council Indonesia — issuing body for GREENSHIP |
| **SNI** | Standar Nasional Indonesia — Indonesian national standards |
| **WF** | Water Fixture |
| **Hemat** | Efficient (fixture rate ≤ baseline) |
| **Tidak Hemat** | Inefficient (fixture rate > baseline) |
| **wavg** | Weighted average — quantity-weighted mean of fixture flow rates |
| **AppState** | Complete data structure representing one project in the app |
| **Pure function** | Function with no side effects — same input always returns same output |
