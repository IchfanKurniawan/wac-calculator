# GREENSHIP Water Calculator — Planning Documentation
**Version:** 3.0 | **Standard:** GREENSHIP NB v1.2 | **Phase 1 Pilot: KANTOR (Office)**

---

## 1. Active Typology

| Typology | Status | WAC 1 Unit | Normalization |
|---|---|---|---|
| **KANTOR (Office)** | ✅ Active — Phase 1 | L/pegawai/hari | `(total / occupant) × (opHours / 8)` |
| Pabrik (Factory) | 🔜 Phase 2 | L/m²/hari | `(total / NLA) × (opHours / 8)` |
| Mall / Retail | 🔜 Phase 2 | L/m²/hari | `(total / NLA) × (opHours / 12)` |
| Apartemen / Hotel | 🔜 Phase 2 | L/penghuni/hari | `(total / occupant) × (opHours / 24)` |
| Airport | 🔜 Phase 2 | L/orang/hari | `total / occupantTotal` |
| Masjid | 🔜 Phase 3 | L/orang/hari | `total / occupantTotal` |
| Stadium | 🔜 Phase 3 | L/m²/hari | `total / NLA` |

> All typology behavioral constants are pre-populated in `src/constants/typologies.ts` and ready to activate.

---

## 2. Fixture Baselines (NB 1.2)

| Fixture | Baseline | Unit |
|---|---|---|
| WC Flush Valve | ≤ 6 | L/flush |
| WC Flush Tank | ≤ 6 | L/flush |
| Peturasan / Urinal | ≤ 4 | L/flush |
| Keran Tembok | ≤ 8 | L/menit |
| Keran Wastafel | ≤ 8 | L/menit |
| Keran Wudhu | ≤ 8 | L/menit |
| Shower Mandi | ≤ 9 | L/menit |

**WAC 2 scoring (NB 1.3):** ≥25%→1pt · ≥50%→2pt · ≥75%→3pt (max 3 points)

---

## 3. Office Behavioral Constants

| Constant | Value | Source |
|---|---|---|
| WC uses/day — male | 0.3 | WAC v2.2 |
| WC uses/day — female | 2.3 | WAC v2.2 |
| WC uses (no urinal) | 2.3 | WAC v2.2 |
| Urinal uses/day | 2.0 | WAC v2.2 |
| Handwashing duration | 0.15 min/use | WAC v2.2 |
| Tap usage/day | 2.5 uses | WAC v2.2 |
| Shower duration | 5 min | WAC v2.2 |
| Shower % of occupants | 5% | WAC v2.2 |
| Female occupancy | 50% | WAC v2.2 |
| Male occupancy | 50% | WAC v2.2 |
| Moslem (male & female) | 50% each | WAC v2.2 |
| Wudhu duration | 0.5 min/use | WAC v2.2 |
| Wudhu times/day | 2 | WAC v2.2 |
| Landscape irrigations/day | 2 | WAC v2.2 |
| Normalization standard hours | 8 | WAC v2.2 |

---

## 4. Calculation Algorithms

### 4.1 Dynamic Baseline (NB 1.2)
Baseline is **computed** from standard flow rates, not a fixed constant.
```
baseline_total = flush_BL + tap_BL + landscape_BL + CT_BL
baseline_norm  = (baseline_total / occupant1) × (opHours / 8)
```

### 4.2 Flush Daily Consumption (L/day)
```
wc_flushes = occupant × (male% × wc_male + female% × wc_female)     [with urinal]
           = occupant × wcNoUrinal                                     [no urinal]
urinal_flushes = occupant × male% × urinalUses                        [if urinal]

valve_share = valve_qty / (valve_qty + tank_qty)  // from product quantities
tank_share  = 1 - valve_share

wc_BL  = wc_flushes × (valve_share × 6 + tank_share × 6)
wc_DSG = wc_flushes × (valve_share × wavg_valve + tank_share × wavg_tank)
urinal_BL  = urinal_flushes × 4
urinal_DSG = urinal_flushes × wavg_urinal
```

### 4.3 Tap & Shower Daily Consumption (L/day)
```
tap_minutes    = occupant × 0.15 × 2.5
wudhu_minutes  = occupant × (female% × mos_f × 2 × 0.5 + male% × mos_m × 2 × 0.5)
shower_minutes = occupant × 5% × 5

tembok_share   = tembok_qty / (tembok_qty + wastafel_qty)

tembok_BL   = tap_minutes × tembok_share × 8
wastafel_BL = tap_minutes × wastafel_share × 8
wudhu_BL    = wudhu_minutes × 8
shower_BL   = shower_minutes × 9
```

### 4.4 Landscaping (L/day)
```
landscape_BL  = Σ(basRate_i × areaShare_i) × totalArea × 2  // 2 = irrigations/day
landscape_DSG = Σ(dsgRate_i × areaShare_i) × totalArea × 2
```

### 4.5 Cooling Tower (L/day)
```
CT = (load_TR × 3) × 0.01 × 3.78541 × 60 × opHours
```

### 4.6 Rainwater Harvesting (WAC 6)
```
idealVolume = roofArea × avgRainfall × runoffCoef
capRatio    = tankCapacity / idealVolume
availWet    = min(tankCapacity, idealVolume)
availDry    = 0
```
Note: Uses **average rainfall** (not 75th percentile).

### 4.7 Neraca Air (Water Balance) — NB 2.0 Approach
Two manual matrices — **Hari Basah (wet)** and **Hari Kering (dry)**.

**Side A — Sources:**
| ID | Sumber | Tag | Volume Tersedia (auto-computed) | Volume Diolah (manual) |
|---|---|---|---|---|
| flush | Flushing WC | R | = flushDsg | user |
| urinal | Peturasan | R | = urinalDsg | user |
| tap | Keran Tembok/Wastafel | R | = tembokDsg + wastafelDsg | user |
| wudhu | Keran Wudhu | A | = wudhuDsg | user |
| shower | Shower Mandi | R | = showerDsg | user |
| ct_condensate | Air Kondensasi CT | A | user input | user |
| rainwater | Air Hujan | A | wet=availWet / dry=0 | user |
| others | Lainnya | - | user input | user |

**Side B — Uses:**
| ID | Penggunaan | Kebutuhan (auto) | Dari Alt. (manual) | Dari Recycle (manual) | % Terpenuhi |
|---|---|---|---|---|---|
| flush | Flushing WC | = flushDsg | user | user | computed |
| urinal | Peturasan | = urinalDsg | user | user | computed |
| tap | Keran Tembok/Wastafel | = tapDsg | user | user | computed |
| wudhu | Keran Wudhu | = wudhuDsg | user | user | computed |
| shower | Shower | = showerDsg | user | user | computed |
| ct_makeup | Make-up Water CT | = ctDsg | user | user | computed |
| irrigation | Irigasi Lansekap | = lsDsg | user | user | computed |

**Validation rules:**
- `volumeDiolah ≤ volumeTersedia` per source row (warning if violated)
- `(dariAlt + dariRecycle) ≤ kebutuhan` per use row (error if > 100%)
- `Σ(volumeDiolah) ≥ Σ(dariAlt + dariRecycle)` → "NERACA AIR SEIMBANG"

**Final reduction (weighted):**
```
rainyDayPct from rainwater section (user input)
wet_reduction = Σ(dariAlt + dariRecycle) — wet scenario
dry_reduction = Σ(dariAlt + dariRecycle) — dry scenario
totalReduction = rainyDayPct × wet_reduction + (1 − rainyDayPct) × dry_reduction
totalFromPrimary = totalDsg − totalReduction
```

### 4.8 WAC 1 Scoring
```
baseline_norm = (baseline_total / occupant1) × (opHours / 8)
design_norm   = (totalFromPrimary / occupant1) × (opHours / 8)
ratio         = design_norm / baseline_norm

WAC P2: PASS if ratio ≤ 0.80

Points (0–8):
≤ 0.80 → 1 pt   ≤ 0.75 → 2 pt   ≤ 0.70 → 3 pt   ≤ 0.65 → 4 pt
≤ 0.60 → 5 pt   ≤ 0.55 → 6 pt   ≤ 0.50 → 7 pt   ≤ 0.45 → 8 pt
```

---

## 5. Wizard Steps

| Step | Name | Key Inputs | Key Outputs |
|---|---|---|---|
| 1 | Data Bangunan | Name, typology, NLA, occupants, op hours | Baseline constants preview |
| 2 | Fitur Air (WAC 2) | Products per fixture type, quantity, design rate | WAC 2 score (0–3 pts), % hemat |
| 3 | Lansekap & CT | Landscape zones, CT load | Landscape BL/DSG, CT water |
| 4 | Air Hujan (WAC 6) | Tank capacity, rainfall, roof area | Capture ratio, availWet |
| 5 | Neraca Air | Volume Diolah per source; Dari Alt/Recycle per use; wet + dry | Balance check, totalReduction |
| 6 | Hasil WAC | — (read-only) | WAC P2, WAC 1 pts, consumption chart |

---

## 6. Import / Export JSON Schema (v2.0)

```json
{
  "version": "2.0",
  "exportedAt": "ISO-8601",
  "state": {
    "building": { "name", "typology", "nla", "occupant1", "occupant2", "opHours" },
    "fixtures": {
      "WC_FLUSH_VALVE":  [{ "name", "qty", "rate" }],
      "WC_FLUSH_TANK":   [...],
      "URINAL":          [...],
      "KERAN_TEMBOK":    [...],
      "KERAN_WASTAFEL":  [...],
      "KERAN_WUDHU":     [...],
      "SHOWER":          [...]
    },
    "hasUrinal": true,
    "landscape": {
      "area": "number (m²)",
      "zones": [{ "label", "basRate", "dsgRate", "areaShare" }]
    },
    "coolingTower": { "enabled": false, "load": 0 },
    "rainwater": {
      "hasTank": false, "rainyDayPct": 0.55,
      "tankCapacity": 0, "avgRainfall": 50,
      "runoffCoef": 0.78, "roofArea": 0
    },
    "waterBalance": {
      "wet": {
        "sources": [{ "id", "availableManual", "volumeDiolah" }],
        "uses":    [{ "id", "dariAlt", "dariRecycle" }]
      },
      "dry": { "sources": [...], "uses": [...] }
    }
  }
}
```

---

## 7. Responsiveness

| Breakpoint | Behaviour |
|---|---|
| Desktop ≥ 1024px | Permanent sidebar (230px), 2-col Step 2 layout, 4-col result stats |
| Tablet 640–1023px | Hamburger → overlay sidebar, step tab bar below topbar, 3-col stats |
| Mobile < 640px | Hamburger → overlay sidebar, step dot indicators, single-column |

Hook: `useBreakpoint()` in `src/components/shared/atoms.tsx` — reactive via `resize` listener.

---

## 8. Security

- **Client-side only** — no backend, no PII transmitted
- **Input sanitization** — XSS/script/SQL patterns stripped (`src/utils/sanitize.ts`)
- **JSON import** — strict schema validation; malformed keys and out-of-range values rejected
- **Number precision** — all numeric inputs allow 3 decimal places (step=0.001)
- **CSP + security headers** — configured in `netlify.toml`

---

## 9. Deployment (Netlify)

```
Build: npm run build
Publish: dist/
Node: 20
```

`netlify.toml` includes: X-Frame-Options, X-Content-Type-Options, CSP, HSTS, Referrer-Policy, Permissions-Policy.

---

## 10. File Structure

```
src/
├── types/index.ts              TypeScript interfaces (AppState, WaterBalance, etc.)
├── constants/
│   ├── baselines.ts            NB 1.2 fixture baselines
│   └── typologies.ts           All 7 typology constants (Office active, others ready)
├── engine/
│   └── calculations.ts         Pure calculation engine — WAC 1/2, flush/tap/LS/CT/neraca
├── utils/
│   ├── sanitize.ts             XSS / injection sanitization
│   ├── importExport.ts         JSON export + import with schema validation
│   └── defaults.ts             DEFAULT_STATE, mkWBScenario helpers
└── components/
    ├── shared/
    │   ├── atoms.tsx           Design tokens, Label/Inp/Card/Tog/PctInp/useBreakpoint
    │   └── FixtureSection.tsx  Reusable fixture product row table
    └── App.tsx                 6-step wizard + all step components + Sidebar
```
