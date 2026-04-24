# GREENSHIP NB v1.3 Kalkulator Air — Technical Documentation
**Version:** 4.0 | **Standard:** GREENSHIP NB v1.2 | **Last Updated:** April 2026  
**Pilot Typology:** KANTOR (Office) — Phase 1

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Standards Reference](#2-standards-reference)
3. [Supported Typologies](#3-supported-typologies)
4. [Fixture Baselines — NB 1.2](#4-fixture-baselines--nb-12)
5. [WAC Credit Scoring Framework](#5-wac-credit-scoring-framework)
6. [Behavioral Constants — All Typologies](#6-behavioral-constants--all-typologies)
7. [Calculation Algorithms — Full Detail](#7-calculation-algorithms--full-detail)
8. [Neraca Air (Water Balance)](#8-neraca-air-water-balance)
9. [Wizard Steps & UX Flow](#9-wizard-steps--ux-flow)
10. [Input Constraints & Validation](#10-input-constraints--validation)
11. [Neraca Air Auto-Fill & Sync Features](#11-neraca-air-auto-fill--sync-features)
12. [Import / Export — JSON](#12-import--export--json)
13. [Responsiveness & Device Support](#13-responsiveness--device-support)
14. [Security Architecture](#14-security-architecture)
15. [Codebase File Structure](#15-codebase-file-structure)
16. [Data Model — TypeScript Interfaces](#16-data-model--typescript-interfaces)
17. [Deployment — Netlify](#17-deployment--netlify)
18. [Formula Verification Notes](#18-formula-verification-notes)
19. [Version & Change History](#19-version--change-history)

---

## 1. Project Overview

The **GREENSHIP NB v1.3 Kalkulator Air** is a fully client-side web application that digitizes the GBC Indonesia water consumption calculation workflow for GREENSHIP New Building certification. It replaces the multi-sheet Excel calculator with a responsive, guided 6-step wizard.

### Key Facts

| Item | Detail |
|---|---|
| Standard | GREENSHIP NB v1.2 (GBC Indonesia) |
| App display title | GREENSHIP NB v1.3 Kalkulator Air |
| WAC credits covered | WAC P2, WAC 1, WAC 2, WAC 5, WAC 6 |
| Phase 1 typology | KANTOR (Office) |
| Source Excel | Water Calculator v2.2 (Office), Water Calculator v2.0 (Factory, NB 1.2) |
| WAC 2 scoring standard | NB 1.3 |
| Technology | React + TypeScript + Vite |
| Deployment | Netlify (client-side only, no backend) |
| Number precision | 3 decimal places (step = 0.001) throughout |
| Number display locale | Indonesian format: comma decimal separator, period thousands separator |
| Browser persistence | Current AppState auto-saved to localStorage draft |

---

## 2. Standards Reference

| Reference | Used For |
|---|---|
| GREENSHIP NB v1.2 Water Calculator v2.2 (Office) | Primary formulas, constants, baselines |
| GREENSHIP NB v1.2 Water Calculator v2.0 (Factory) | Factory typology constants (Phase 2 data) |
| GREENSHIP NB 2.0 Kalkulator Air (oldest xlsx) | Neraca Air table structure (NB 2.0 approach) |
| GREENSHIP NB 1.3 | WAC 2 scoring criteria (max 3 pts) |
| SNI 03-8153-2015 | Fixture baseline flow rate standards |
| WAC Manual PDF | Formula cross-verification |

### NB 1.2 vs NB 2.0 Key Differences

| Parameter | NB 1.2 (current) | NB 2.0 (previous) |
|---|---|---|
| WC Flush Valve baseline | **6 L/flush** | 4.4 L/flush |
| WC Flush Tank baseline | **6 L/flush** | 4.4 L/flush |
| Keran Wastafel baseline | **8 L/menit** | 6 L/menit |
| Keran Wudhu baseline | **8 L/menit** | 6 L/menit |
| Shower type | **Single: Shower Mandi (9 L/menit)** | Hand + Fix Shower |
| WAC 1 baseline value | **Dynamic (computed from flow rates)** | Fixed constant |
| WAC 2 max points | **3 pts (NB 1.3)** | 4 pts |

---

## 3. Supported Typologies

### Phase 1 — Active

| Typology | Status | Result Unit | Normalization Formula |
|---|---|---|---|
| **KANTOR (Office)** | ✅ Active | L/pegawai/hari | `(total / occupant1) × (opHours / 8)` |

### Phase 2 — Constants Ready, UI Inactive

| Typology | Result Unit | Normalization Formula |
|---|---|---|
| Pabrik (Factory) | L/m²/hari | `(total / NLA) × (opHours / 8)` |
| Mall / Pertokoan / Retail | L/m²/hari | `(total / NLA) × (opHours / 12)` |
| Apartemen / Hotel / Rusun | L/penghuni/hari | `(total / occupant1) × (opHours / 24)` |
| Airport | L/orang/hari | `total / occupant1` *(current placeholder in code; dual-occupancy support is not unlocked yet)* |

### Phase 3 — Planned

| Typology | Notes |
|---|---|
| Masjid | Flagged as pilot project in source data |
| Stadium | Partial constants available |

> All typology behavioral constants are pre-populated in `src/constants/typologies.ts`, but a future typology is only unlocked after this checklist is complete:
> 1. Typology-specific inputs exist in the UI
> 2. Normalization and daily formulas are verified against the source workbook
> 3. Fixture availability and Neraca Air mappings are validated
> 4. JSON import/export supports the typology fields without data loss
> 5. Result copy, units, and edge cases are tested end-to-end

---

## 4. Fixture Baselines — NB 1.2

Source: GREENSHIP Water Calculator v2.2, confirmed against SNI 03-8153-2015

| Fixture ID | Label | Baseline | Unit |
|---|---|---|---|
| `WC_FLUSH_VALVE` | WC Flush Valve | ≤ 6 | L/flush |
| `WC_FLUSH_TANK` | WC Flush Tank | ≤ 6 | L/flush |
| `URINAL` | Peturasan / Urinal | ≤ 4 | L/flush |
| `KERAN_TEMBOK` | Keran Tembok | ≤ 8 | L/menit |
| `KERAN_WASTAFEL` | Keran Wastafel | ≤ 8 | L/menit |
| `KERAN_WUDHU` | Keran Wudhu | ≤ 8 | L/menit |
| `SHOWER` | Shower Mandi | ≤ 9 | L/menit |

---

## 5. WAC Credit Scoring Framework

### WAC P2 — Prerequisite

**Rule:** Passes as long as `baselineNorm > 0` (i.e., the user has filled enough data to compute a baseline). WAC P2 is a data-completeness gate, not a threshold comparison.

```
p2Pass = (baselineNorm > 0)
```

### WAC 2 — Water Fixture Reduction (NB 1.3, max 3 pts)

A fixture unit is classified as **"Hemat"** if its design flow rate ≤ baseline.

```
% Hemat = Σ(qty of hemat fixtures) / Σ(all fixtures with data entered)

Points:
  ≥ 75% → 3 pts
  ≥ 50% → 2 pts
  ≥ 25% → 1 pt
  < 25% → 0 pts
```

### WAC 1 — Water Consumption Reduction (max 8 pts)

```
savings_ratio = 1 - (design_norm / baseline_norm)

Points:
  savings ≥ 55% → 8 pts   (design_norm / baseline_norm ≤ 0.45)
  savings ≥ 50% → 7 pts   (≤ 0.50)
  savings ≥ 45% → 6 pts   (≤ 0.55)
  savings ≥ 40% → 5 pts   (≤ 0.60)
  savings ≥ 35% → 4 pts   (≤ 0.65)
  savings ≥ 30% → 3 pts   (≤ 0.70)
  savings ≥ 25% → 2 pts   (≤ 0.75)
  savings ≥ 20% → 1 pt    (≤ 0.80)
  savings < 20% → 0 pts
```

---

## 6. Behavioral Constants — All Typologies

Source: Water Calculator v2.2 (Office), v2.0 (Factory), NB 2.0 backend sheet

### 6.1 Office (KANTOR) — Active

| Constant | Value | Description |
|---|---|---|
| WC uses/day — male | 0.3 | Average flushes per day per male occupant |
| WC uses/day — female | 2.3 | Average flushes per day per female occupant |
| WC uses/day (no urinal) | 2.3 | Male rate when no urinal installed |
| Urinal uses/day | 2.0 | Per male occupant |
| Handwashing duration | 0.15 min | Per use |
| Tap usage/day | 2.5 | Times per day (all occupants) |
| Shower duration | 5.0 min | Per person per day |
| Shower % of occupants | 5% | Fraction of occupants who shower |
| Female occupancy | 50% | |
| Male occupancy | 50% | |
| Moslem female % | 50% | Of female occupants |
| Moslem male % | 50% | Of male occupants |
| Wudhu duration | 0.5 min | Per wudhu session |
| Wudhu times/day | 2 | Per Moslem occupant |
| Landscape irrigation frequency | 2 | Times per day |
| Standard op hours (normalization) | 8 | Denominator for normalization |

### 6.2 Factory (PABRIK) — Phase 2 Constants

| Constant | Value |
|---|---|
| Shifts | 3 (independent occupant counts) |
| WC uses/day — male | 0.42 |
| WC uses/day — female | 1.38 |
| Urinal uses/day | 3.0 |
| Tap usage/day | 7.5 |
| Default male/female ratio | 90% / 10% (configurable) |
| Wudhu times/day | 5 |
| Op hours | 24 (3 × 8h shifts) |

### 6.3 Other Typologies (Phase 2/3 — stored in typologies.ts)

| Constant | Mall | Apartemen | Airport | Masjid |
|---|---|---|---|---|
| WC male/flush | 0.3 | 2.0 | 2.5 | 0.3 |
| WC female/flush | 3.3 | 7.0 | 3.5 | 1.5 |
| Tap usage/day | 2.5 | 7.0 | 2.5 | 1.25 |
| Shower pct | 5% | 100% | 5% | 5% |
| Op hours | 12 | 24 | 24 | 10 |

---

## 7. Calculation Algorithms — Full Detail

All formulas are implemented as pure TypeScript functions in `src/engine/calculations.ts`.

### 7.1 Dynamic Baseline Calculation

The baseline is **computed from standard flow rates**, not a fixed constant per typology:

```
baseline_flush   = wc_flushes × (valve_share × 6 + tank_share × 6)
                 + urinal_flushes × 4

baseline_tap     = tap_minutes × tembok_share × 8
                 + tap_minutes × wastafel_share × 8
                 + wudhu_minutes × 8
                 + shower_minutes × 9

baseline_landscape = Σ(5 × areaShare_i) × totalArea × 2   // 5 L/m² locked
baseline_CT        = CT_total (same as design — no baseline reduction)

baseline_total   = baseline_flush + baseline_tap + baseline_landscape + baseline_CT

// Office normalization:
baseline_norm    = (baseline_total / occupant1) × (opHours / 8)   [L/pegawai/hari]
```

### 7.2 Flush Consumption (L/day)

**Step A — Flushes per day:**

```
// With urinal:
wc_flushes     = occupant1 × (0.5 × 0.3 + 0.5 × 2.3)   = occupant1 × 1.3
urinal_flushes = occupant1 × 0.5 × 2.0                  = occupant1 × 1.0

// Without urinal:
wc_flushes     = occupant1 × 2.3
urinal_flushes = 0
```

**Step B — Valve / Tank split (from product quantities):**

```
valve_qty   = Σ(qty of WC_FLUSH_VALVE products)
tank_qty    = Σ(qty of WC_FLUSH_TANK products)
valve_share = valve_qty / (valve_qty + tank_qty)
tank_share  = 1 - valve_share
```

**Step C — Daily water (L/day):**

```
wcDsg   = wc_flushes × (valve_share × wavg_valve + tank_share × wavg_tank)
wcBL    = wc_flushes × (valve_share × 6          + tank_share × 6        )

urinalDsg = urinal_flushes × wavg_urinal
urinalBL  = urinal_flushes × 4

// Note: flushDsg = wcDsg + urinalDsg
// In Neraca Air: "flush" row = wcDsg ONLY (urinal has its own separate row)
```

> **Important (verified):** `wcDsg` (WC valve+tank) and `urinalDsg` are always kept separate. The Neraca Air "Flushing WC" row maps to `wcDsg`, NOT `flushDsg`.

> **Installed-fixture rule:** A fixture type with total quantity `0` is treated as not installed. It contributes `0` to design, baseline, Neraca Air "Tersedia", and Neraca Air "Kebutuhan". If quantity is entered but rate is left blank, the design rate falls back to that fixture's baseline value.

### 7.3 Tap & Shower Consumption (L/day)

**Minutes of use per day:**

```
tap_minutes    = occupant1 × 0.15 × 2.5      // handwashing_duration × tap_usage
wudhu_minutes  = occupant1 × (0.5 × 0.5 × 2 × 0.5 + 0.5 × 0.5 × 2 × 0.5)
               = occupant1 × 0.5             // femalePct × mosMale × wudhuTimes × wudhuDur (×2 for both genders)
shower_minutes = occupant1 × 0.05 × 5.0      // showerPct × showerDuration
```

> **Formula cross-check:** Identical to NB 1.2 v2.2 Excel cell `L40 = ((S19*S14))*I3` = `(2.5 × 0.15) × occupant`. Formula did not change between NB 2.0 and NB 1.2. Only the baseline value for Keran Wastafel changed (6 → 8 L/menit).

**Keran Tembok / Wastafel split:**

```
tembok_qty    = Σ(qty of KERAN_TEMBOK products)
wastafel_qty  = Σ(qty of KERAN_WASTAFEL products)
tembok_share  = tembok_qty / (tembok_qty + wastafel_qty)
wastafel_share = 1 - tembok_share
```

**Daily water (L/day):**

```
tembokBL    = tap_minutes × tembok_share × 8
tembokDsg   = tap_minutes × tembok_share × wavg_tembok

wastafelBL  = tap_minutes × wastafel_share × 8
wastafelDsg = tap_minutes × wastafel_share × wavg_wastafel

wudhuBL     = wudhu_minutes × 8
wudhuDsg    = wudhu_minutes × wavg_wudhu

showerBL    = shower_minutes × 9
showerDsg   = shower_minutes × wavg_shower

tapBL       = tembokBL  + wastafelBL  + wudhuBL  + showerBL
tapDsg      = tembokDsg + wastafelDsg + wudhuDsg + showerDsg
```

### 7.4 Landscaping Irrigation (L/day)

Landscape baseline is locked at **5 L/m²** per irrigation cycle (SNI standard, read-only).  
Irrigation frequency: **2 times/day** (Office constant).

```
lsBL  = Σ(5 × areaShare_i) × totalArea × 2
lsDsg = Σ(dsgRate_i × areaShare_i) × totalArea × 2

// areaShare validation: Σ(areaShare_i) must equal 1.000 (100%)
```

### 7.5 Cooling Tower Make-up Water (L/day)

Formula from Water Calculator v2.2, cell `L75`:

```
CT_total = (load_TR × 3) × 0.01 × 3.78541 × 60 × opHours

// Breakdown:
// load_TR × 3          = recirculation rate (gal/min)
// × 0.01               = 1% evaporation rate per 10°F delta
// × 3.78541            = gallons to liters
// × 60                 = per-minute to per-hour
// × opHours            = per-hour to per-day
```

CT baseline = CT design (no efficiency improvement modeled for CT itself).

### 7.6 Rainwater Harvesting (WAC 6)

```
idealVolume = roofArea × avgRainfall × runoffCoef

// Note: uses AVERAGE rainfall (not 75th percentile)
// The label reads "Persentase Hari Hujan minimal 10 Tahun" for the rainy day %

capRatio    = tankCapacity / idealVolume        // clamped to max 1.0
availWet    = min(tankCapacity, idealVolume)    // L/day available on rainy days
availDry    = 0                                 // no rainwater on dry days
```

### 7.7 Weighted Average Rate Function

Used throughout for product-weighted flow rates:

```
weightedAvgRate(products) = Σ(qty_i × rate_i) / Σ(qty_i)

// If no products with qty > 0: returns 0
// Engine then falls back to baseline rate if wavg returns 0
```

The fallback only applies after the fixture type has at least one installed unit. Empty fixture groups remain zero and do not create default baseline demand.

### 7.8 Total Consumption Summary

```
totalBL  = wcBL + urinalBL + tapBL + lsBL + ctBL
totalDsg = wcDsg + urinalDsg + tapDsg + lsDsg + ctDsg

// After Neraca Air:
totalReduction    = rainyDayPct × Σ(wet_uses.dariAlt + wet_uses.dariRecycle)
                  + (1 − rainyDayPct) × Σ(dry_uses.dariAlt + dry_uses.dariRecycle)

totalFromPrimary  = max(0, totalDsg − totalReduction)

// WAC 1 normalization (Office):
baselineNorm = (totalBL / occupant1) × (opHours / 8)
designNorm   = (totalFromPrimary / occupant1) × (opHours / 8)
```

---

## 8. Neraca Air (Water Balance)

Follows **NB 2.0 two-scenario matrix structure** (Hari Basah / Hari Kering).

### 8.1 Source IDs and Auto-Computed Availability

| Source ID | Label | Tag | Auto Available Formula |
|---|---|---|---|
| `flush` | Flushing WC (Flush Valve + Tank) | R | `wcDsg` (NOT `flushDsg`) |
| `urinal` | Peturasan / Urinal | R | `urinalDsg` |
| `tap` | Keran Tembok / Wastafel | R | `tembokDsg + wastafelDsg` |
| `wudhu` | Keran Wudhu | A | `wudhuDsg` |
| `shower` | Shower Mandi | R | `showerDsg` |
| `ct_condensate` | Air Kondensasi Cooling Tower | A | **User input** (`availableManual`) |
| `rainwater` | Air Hujan | A | `availWet` (wet) / `0` (dry) |
| `others` | Lainnya | - | **User input** (`availableManual`) |

Tags: R = Recycle, A = Alternatif

### 8.2 Use IDs and Kebutuhan

| Use ID | Label | Kebutuhan Formula |
|---|---|---|
| `flush` | Flushing WC (Flush Valve + Tank) | `wcDsg` |
| `urinal` | Peturasan / Urinal | `urinalDsg` |
| `tap` | Keran Tembok / Wastafel | `tembokDsg + wastafelDsg` |
| `wudhu` | Keran Wudhu | `wudhuDsg` |
| `shower` | Shower Mandi | `showerDsg` |
| `ct_makeup` | Make-up Water Cooling Tower | `ctDsg` |
| `irrigation` | Irigasi Lansekap | `lsDsg` |

### 8.3 Validation Logic

```
// Per source row:
WARN if: volumeDiolah > volumeTersedia (over-processed)

// Per use row:
ERROR if: (dariAlt + dariRecycle) > kebutuhan (over-fulfilled, > 100%)
PCT if:   (dariAlt + dariRecycle) / kebutuhan × 100

// Overall balance:
SEIMBANG if: Σ(volumeDiolah) ≥ Σ(dariAlt + dariRecycle)
TIDAK SEIMBANG if: Σ(volumeDiolah) < Σ(dariAlt + dariRecycle)
```

### 8.4 Final Reduction Computation

```
rainyDayPct   = user input (0–1)  // "Persentase Hari Hujan minimal 10 Tahun"
wet_reduction = Σ(wet.uses.dariAlt + wet.uses.dariRecycle)
dry_reduction = Σ(dry.uses.dariAlt + dry.uses.dariRecycle)

totalReduction   = rainyDayPct × wet_reduction + (1 − rainyDayPct) × dry_reduction
totalFromPrimary = max(0, totalDsg − totalReduction)
```

---

## 9. Wizard Steps & UX Flow

```
Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → Step 6
Data      Fitur    Lansekap  Air       Neraca   Hasil
Bangunan  Air      & CT      Hujan     Air      WAC
```

### Step-by-Step Details

| Step | Name | User Inputs | Live Outputs |
|---|---|---|---|
| 1 | Data Bangunan | Name, typology, NLA (min 250 m²), occupants, op hours | Behavioral constants preview, NLA error if < 250 |
| 2 | Fitur Air (WAC 2) | Product name, qty, design rate per fixture type; urinal toggle | WAC 2 score (live), % hemat, valve/tank split |
| 3 | Lansekap & CT | Landscape zones (baseline=5 locked), design rate, area %, CT toggle + load | Zone share sum validation, CT water L/day |
| 4 | Air Hujan (WAC 6) | Rainy day % (min 10yr), tank capacity, rainfall, runoff, roof area | Ideal volume, capture ratio, availWet |
| 5 | Neraca Air | Volume Diolah (sources), Dari Alt + Dari Recycle (uses), both wet & dry | Balance status, % terpenuhi per row, totalReduction |
| 6 | Hasil WAC | — (read-only results) | WAC P2, WAC 1 pts, WAC 2 pts, consumption chart, reduction summary |

### Navigation
- **Sidebar nav:** click any step (desktop = always visible; mobile/tablet = hamburger drawer)
- **Kembali / Lanjut buttons:** linear prev/next in topbar
- **Tablet:** secondary step tab bar below topbar
- **Mobile:** step dot indicators in topbar

---

## 10. Input Constraints & Validation

| Field | Rule | Behavior |
|---|---|---|
| NLA | Minimum 250 m² | Red inline error if 0 < NLA < 250; `min={250}` on input |
| Typology selector | Only `active: true` typologies selectable | Others shown with "(segera hadir)" label |
| Landscape basRate | Locked at 5 L/m² | Read-only display box; cannot be edited |
| Landscape areaShare sum | Must total 100,000% | Live color-coded sum indicator (red if off) |
| All number inputs | 3 decimal precision | `step={0.001}` on all numeric `<Inp>` components |
| WAC P2 | Passes when `baselineNorm > 0` | Result step shows "LULUS" as soon as data fills |
| Rainfall label | "Persentase Hari Hujan minimal 10 Tahun (%)" | Label updated to reflect 10-year minimum |
| Neraca volumeDiolah | Must not exceed volumeTersedia | Inline warning per row |
| Neraca pemenuhan | Must not exceed kebutuhan | Inline error + overall balance status |
| Text inputs | Max 200 chars, HTML/script stripped | Via `sanitize.ts` |
| JSON import | Schema validated; landscape share must equal exactly 100,000% | Error list displayed; import rejected on mismatch |
| Browser draft | AppState is auto-saved in localStorage | Reload restores the latest browser draft |
| Reset Data | Clears all user-entered fields | Returns to default state and removes the saved draft |

---

## 11. Neraca Air Auto-Fill & Sync Features

### ⚡ Auto-Fill — Side A (Sources)

Each source row has an **Auto** pill button. When toggled ON:
- `volumeDiolah` is immediately set to `computeSourceAvailable(id, daily, rw, isDry, manualAvail)`
- The input becomes a read-only display
- Value **re-syncs reactively** via `useEffect` whenever upstream design values change
- Toggling OFF restores manual entry

**Mutual compatibility:** Multiple sources can be Auto simultaneously.

### ⚡ Auto-Fill — Side B (Uses)

Each use row has two **Auto** buttons — **Alt** and **Rec** — which are **mutually exclusive per row**:

| Button | Effect | Clears |
|---|---|---|
| Auto Alt | `dariAlt = computeUseRequired(id, daily)`; `dariRecycle = 0` | Rec Auto for same row |
| Auto Rec | `dariRecycle = computeUseRequired(id, daily)`; `dariAlt = 0` | Alt Auto for same row |

Values re-sync reactively when design daily values change.

### 🔗 Sync Wet ↔ Dry Toggle

The **"Samakan Basah & Kering"** toggle at the top of Step 5:
- When **ON:** any change to either scenario (source or use row) is simultaneously applied to both `wet` and `dry` scenarios
- Useful when the user wants identical inputs for both scenarios
- Works with both manual entry and Auto-fill
- **Not persisted** in export/import (session-only UI state)

### Persistence Note

Auto-fill toggle states and the sync toggle are **local session state only** — they are not included in JSON exports or browser draft persistence. On import or reload, all values are loaded as-is from the file/draft; the user can re-enable Auto-fill if desired.

---

## 12. Import / Export — JSON

### 12.1 JSON Format (v2.0)

JSON is the only supported project import/export format in the current application.

Full round-trip fidelity. Schema:

```json
{
  "version": "2.0",
  "exportedAt": "2026-04-21T08:00:00.000Z",
  "state": {
    "building": {
      "name": "Gedung A",
      "typology": "KANTOR",
      "nla": 5000.000,
      "occupant1": 500,
      "occupant2": 0,
      "opHours": 8
    },
    "fixtures": {
      "WC_FLUSH_VALVE":  [{ "name": "Produk A", "qty": 20, "rate": 4.500 }],
      "WC_FLUSH_TANK":   [{ "name": "", "qty": 0, "rate": 0 }],
      "URINAL":          [{ "name": "Produk B", "qty": 10, "rate": 2.000 }],
      "KERAN_TEMBOK":    [{ "name": "", "qty": 0, "rate": 0 }],
      "KERAN_WASTAFEL":  [{ "name": "Produk C", "qty": 50, "rate": 6.000 }],
      "KERAN_WUDHU":     [{ "name": "", "qty": 0, "rate": 0 }],
      "SHOWER":          [{ "name": "", "qty": 0, "rate": 0 }]
    },
    "hasUrinal": true,
    "landscape": {
      "area": 1200.000,
      "zones": [{ "label": "Area 1", "basRate": 5, "dsgRate": 2.500, "areaShare": 1 }]
    },
    "coolingTower": { "enabled": true, "load": 200.000 },
    "rainwater": {
      "hasTank": true,
      "rainyDayPct": 0.550,
      "tankCapacity": 50000,
      "avgRainfall": 47.800,
      "runoffCoef": 0.780,
      "roofArea": 1500.000
    },
    "waterBalance": {
      "wet": {
        "sources": [
          { "id": "flush",         "availableManual": 0,    "volumeDiolah": 1200.000 },
          { "id": "urinal",        "availableManual": 0,    "volumeDiolah": 400.000  },
          { "id": "ct_condensate", "availableManual": 800,  "volumeDiolah": 800.000  },
          { "id": "rainwater",     "availableManual": 0,    "volumeDiolah": 2000.000 }
        ],
        "uses": [
          { "id": "flush",      "dariAlt": 0,      "dariRecycle": 1200.000 },
          { "id": "ct_makeup",  "dariAlt": 800.000,"dariRecycle": 0        }
        ]
      },
      "dry": { "sources": [...], "uses": [...] }
    }
  }
}
```

### 12.2 Import Validation Rules

| Check | Behavior |
|---|---|
| JSON version mismatch | Error listed; import rejected |
| Missing `building.name` | Error; import rejected |
| Missing `building.typology` | Error; import rejected |
| Both `occupant1=0` and `nla=0` | Error; import rejected |
| `nla > 0 && nla < 250` | Allowed in import (constraint shown in UI only) |
| Landscape areaShare sum ≠ 100,000% | Error listed; import rejected |
| Values out of range (negative, > max) | Clamped to valid range silently |
| HTML/script in text fields | Stripped via `sanitize.ts` |
| File > 5 MB | Rejected with error message |
| Malformed JSON | Error; import rejected |

---

## 13. Responsiveness & Device Support

### Breakpoints

| Breakpoint | Width | Sidebar | Step 2 Layout | Stats Grid |
|---|---|---|---|---|
| Desktop | ≥ 1024px | Permanent 230px fixed | 2-col (fixtures + WAC 2 panel) | 4-col |
| Tablet | 640–1023px | Hamburger → overlay drawer + step tab bar | Stacked | 3-col |
| Mobile | < 640px | Hamburger → overlay drawer + step dots in topbar | Stacked | 2-col |

### `useBreakpoint()` Hook

Located in `src/components/shared/atoms.tsx`:
```typescript
export function useBreakpoint() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return { isMobile: w < 640, isTablet: w >= 640 && w < 1024, isDesktop: w >= 1024, w };
}
```

### Responsive Behaviors by Step

| Step | Mobile | Tablet | Desktop |
|---|---|---|---|
| 1 | 1-col inputs | 2-col inputs | 2-col inputs |
| 2 (Fitur Air) | WAC 2 panel above fixtures | WAC 2 panel above fixtures | WAC 2 panel sticky right |
| 3 (Lansekap) | Zone cards stacked | Zone table | Zone table |
| 5 (Neraca) | Source/use cards | Table layout (with % pills) | Table layout (with % pills) |
| 6 (Hasil) | 2-col stats | 3-col stats | 4-col stats |

---

## 14. Security Architecture

| Layer | Implementation |
|---|---|
| No backend / no PII | 100% client-side; no API calls, no accounts, no cookies |
| Input sanitization | `src/utils/sanitize.ts` strips HTML tags, script, `javascript:`, SQL keywords |
| JSON import validation | Strict schema check before any state update; unknown keys ignored |
| JSON import validation | Strict schema check; landscape share must equal exactly 100,000%; out-of-range values clamped |
| Number bounds | All numeric fields clamped to `[min, max]` via `sanitizeNumber()` |
| File size limit | Max 5 MB for any import file |
| Content Security Policy | Set via `netlify.toml` headers |
| X-Frame-Options | `DENY` — prevents clickjacking |
| HSTS | `max-age=63072000; includeSubDomains; preload` |
| X-Content-Type-Options | `nosniff` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| No `eval()` / no `innerHTML` | All rendering via React virtual DOM |
| localStorage | Draft data only; no sensitive content stored |

---

## 15. Codebase File Structure

```
wac-calculator/
├── index.html                  Entry HTML — Inter font, inline SVG favicon (water faucet)
├── package.json                Dependencies: React 18, Recharts, Lucide
├── vite.config.ts              Vite build config — manual chunk split (vendor / charts)
├── tsconfig.json               Strict TypeScript
├── netlify.toml                Build config + full security headers
├── PLANNING.md                 This document
├── README.md                   Developer setup & deployment guide
│
└── src/
    ├── main.tsx                React entry point (StrictMode)
    ├── App.tsx                 Main application — Sidebar + 6-step wizard
    │
    ├── types/
    │   └── index.ts            All TypeScript interfaces & const arrays
    │                           (AppState, FixtureGroup, WaterBalanceData,
    │                            WB_SOURCE_IDS, WB_USE_IDS, CalcResults, etc.)
    │
    ├── constants/
│   ├── baselines.ts        NB 1.2 fixture baselines + FIXTURE_AVAILABILITY map
│   ├── landscape.ts        Shared landscape constants + exact-share helpers
│   └── typologies.ts       All 7 typology configs (TypologyConfig interface):
    │                           label, active, phase, opHours, wcMale/Female,
    │                           tapUsage, wudhuDur, showerPct, normFn, etc.
    │
    ├── engine/
    │   └── calculations.ts     Pure calculation functions (no side effects):
    │                           calcWAC2(), calcFlush(), calcTap(),
    │                           calcLandscape(), calcCT(), calcRainwater(),
    │                           calcAll(), calcWAC1(),
    │                           computeSourceAvailable(), computeUseRequired(),
    │                           weightedAvgRate(), lsShareSum()
    │
    ├── utils/
    │   ├── sanitize.ts         Input sanitization — sanitizeText(), sanitizeNumber(),
    │   │                       sanitizeRatio(), sanitizeBool(), sanitizeEnum()
│   ├── defaults.ts         DEFAULT_STATE, mkProd(), mkFixtureGroup(), mkWBScenario()
│   └── importExport.ts     JSON export/import + schema validation
    │
    └── components/
        └── shared/
            ├── atoms.tsx       Design tokens (C), formatting helpers (fmt, fmtPct),
            │                   useBreakpoint(), UI atoms:
            │                   Label, Inp, Sel, Card, SecTitle, Pill,
            │                   Tog, Check, PctInp
            └── FixtureSection.tsx  Reusable fixture product row table (up to 4 products)
```

---

## 16. Data Model — TypeScript Interfaces

### Core AppState

```typescript
interface AppState {
  building: BuildingData;           // Step 1
  fixtures: FixtureGroup;           // Step 2
  hasUrinal: boolean;               // Step 2
  landscape: LandscapeData;         // Step 3
  coolingTower: CoolingTowerData;   // Step 3
  rainwater: RainwaterData;         // Step 4
  waterBalance: WaterBalanceData;   // Step 5
}
```

### BuildingData

```typescript
interface BuildingData {
  name: string;       // Project name
  typology: TypologyId;
  nla: number;        // m² — min 250 enforced in UI
  occupant1: number;  // Primary occupants (employees for Office)
  occupant2: number;  // Secondary (future typologies)
  opHours: number;    // Operational hours/day
}
```

### FixtureGroup

```typescript
type FixtureTypeId = 'WC_FLUSH_VALVE'|'WC_FLUSH_TANK'|'URINAL'|
                    'KERAN_TEMBOK'|'KERAN_WASTAFEL'|'KERAN_WUDHU'|'SHOWER';

type FixtureGroup = Record<FixtureTypeId, FixtureProduct[]>;

interface FixtureProduct {
  name: string;   // Product label
  qty: number;    // Unit count installed
  rate: number;   // Design flow rate (L/flush or L/menit)
}
```

### LandscapeData

```typescript
interface LandscapeData {
  area: number;           // m² total irrigated area
  zones: LandscapeZone[]; // max 5
}
interface LandscapeZone {
  label: string;
  basRate: number;    // Locked at 5 (not editable in UI)
  dsgRate: number;    // User's design rate L/m²
  areaShare: number;  // 0–1, all zones must sum to 1.000
}
```

### RainwaterData

```typescript
interface RainwaterData {
  hasTank: boolean;
  rainyDayPct: number;  // 0–1  (label: "minimal 10 Tahun")
  tankCapacity: number; // Liters
  avgRainfall: number;  // mm (average per event)
  runoffCoef: number;   // 0–1
  roofArea: number;     // m²
}
```

### WaterBalanceData

```typescript
// Source constant arrays (in types/index.ts):
const WB_SOURCE_IDS = ['flush','urinal','tap','wudhu','shower',
                        'ct_condensate','rainwater','others'] as const;
const WB_USE_IDS    = ['flush','urinal','tap','wudhu','shower',
                        'ct_makeup','irrigation'] as const;

interface WBSourceRow { id: WBSourceId; availableManual: number; volumeDiolah: number; }
interface WBUseRow    { id: WBUseId;    dariAlt: number; dariRecycle: number; }
interface WBScenario  { sources: WBSourceRow[]; uses: WBUseRow[]; }

interface WaterBalanceData { wet: WBScenario; dry: WBScenario; }
```

### CalcResults

```typescript
interface CalcResults {
  daily: DailyConsumption;
  wac2: WAC2Result;
  wac1: WAC1Result;
  rainwater: RainwaterResult;
  unit: string;
}

interface DailyConsumption {
  wcBL: number;       wcDsg: number;       // WC (valve+tank) only
  urinalBL: number;   urinalDsg: number;
  tembokBL: number;   tembokDsg: number;
  wastafelBL: number; wastafelDsg: number;
  wudhuBL: number;    wudhuDsg: number;
  showerBL: number;   showerDsg: number;
  tapBL: number;      tapDsg: number;
  lsBL: number;       lsDsg: number;
  ctBL: number;       ctDsg: number;
  totalBL: number;    totalDsg: number;
  totalReduction: number;   // from Neraca Air
  totalFromPrimary: number; // after reduction
}
```

---

## 17. Deployment — Netlify

### Build Configuration (`netlify.toml`)

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    Content-Security-Policy = "..."
    Strict-Transport-Security = "max-age=63072000; includeSubDomains; preload"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200     # SPA fallback for client-side routing
```

### Local Development

```bash
npm install
npm run dev       # Vite dev server (HMR)
npm run build     # TypeScript compile + Vite bundle → dist/
npm run preview   # Preview production build locally
```

### Vite Bundle Strategy

Manual chunks configured in `vite.config.ts`:
- `vendor` chunk: `react`, `react-dom`
- `charts` chunk: `recharts`

---

## 18. Formula Verification Notes

### Flushing WC vs Urinal Separation

**Critical:** `flushDsg = wcDsg + urinalDsg` — these must always be tracked separately.

The Neraca Air "Flushing WC (Flush Valve + Tank)" row maps to `wcDsg` **only**, not `flushDsg`. Urinal has its dedicated "Peturasan / Urinal" row with `urinalDsg`. This was verified and corrected in the codebase; both `computeSourceAvailable` and `computeUseRequired` for ID `'flush'` return `daily.wcDsg`.

### Keran Tembok Formula — NB 2.0 vs NB 1.2 v2.2

| Version | Excel Cell | Formula |
|---|---|---|
| NB 2.0 (oldest) | `D72` | `= Occupant1 × J17(2.5) × J12(0.15)` |
| NB 1.2 v2.2 | `L40` | `= ((S19×S14)) × I3` = `(2.5 × 0.15) × occupant` |

**Conclusion: Identical formula.** Only the Keran Wastafel baseline value changed (6 → 8 L/menit between NB 2.0 and NB 1.2). No formula restructuring.

### Landscape Baseline Lock

The SNI standard baseline for landscape irrigation is fixed at **5 L/m² per irrigation cycle**. This value is not configurable by users. It is set as `basRate: 5` in the default zone and rendered as a read-only display in Step 3. The locked value is documented with the note "Standar SNI — tidak dapat diubah."

---

## 19. Version & Change History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-03 | Initial codebase — Office typology, NB 2.0 engine |
| 2.0 | 2026-03 | NB 1.2 baselines, Factory typology constants, dynamic baseline, Neraca Air table |
| 2.1 | 2026-03 | Import/export module introduced, responsive layout, PctInp, 3-decimal precision |
| 3.0 | 2026-04 | Factory removed from active UI; Neraca Air restored to NB 2.0 structure; wcRecyclePct/showerRecyclePct moved to Neraca Air table; PLANNING updated |
| 4.0 | 2026-04 | Flush formula bug fix (wcDsg vs flushDsg); WAC P2 always-pass logic; SVG favicon; NLA min 250 constraint; landscape baseline locked; rainfall label updated; Auto-fill toggles; Sync Wet↔Dry toggle; PRD created |
| 4.1 | 2026-04 | App title updated to GREENSHIP NB v1.3; missing fixture types treated as not installed; Indonesian display formatting; browser draft persistence; global Reset Data action |
