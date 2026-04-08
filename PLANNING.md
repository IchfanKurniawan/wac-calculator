# GREENSHIP Water Calculator — Planning Documentation
**Version:** 2.0 | **Standard:** GREENSHIP NB v1.2 | **Updated:** 2026

---

## 1. Typologies Supported

| Typology | Phase | Unit (WAC 1) | Normalization Formula |
|---|---|---|---|
| **KANTOR (Office)** | ✅ Phase 1 | L/pegawai/hari | `(total / occupant) × (opHours / 8)` |
| **PABRIK (Factory)** | ✅ Phase 1 | L/m²/hari | `(total / NLA) × (opHours / 8)` |
| Mall / Retail | 🔜 Phase 2 | L/m²/hari | `(total / NLA) × (opHours / 12)` |
| Apartemen / Hotel | 🔜 Phase 2 | L/penghuni/hari | `(total / occupant) × (opHours / 24)` |
| Airport | 🔜 Phase 2 | L/orang/hari | `total / occupantTotal` |
| Masjid | 🔜 Phase 3 | L/orang/hari | `total / occupantTotal` |
| Stadium | 🔜 Phase 3 | L/m²/hari | `total / NLA` |

---

## 2. NB 1.2 vs NB 2.0 — Key Differences

| Parameter | NB 1.2 (current) | NB 2.0 (previous) |
|---|---|---|
| WC Flush Valve baseline | **6 L/flush** | 4.4 L/flush |
| WC Flush Tank baseline | **6 L/flush** | 4.4 L/flush |
| Keran Wastafel baseline | **8 L/menit** | 6 L/menit |
| Keran Wudhu baseline | **8 L/menit** | 6 L/menit |
| Shower type | **Single: Shower Mandi 9 L/menit** | Hand + Fix Shower |
| WAC 1 Baseline | **Dynamic (calculated)** | Fixed 50 L/pegawai/hari |

---

## 3. Fixture Baseline Values (NB 1.2)

Source: GREENSHIP NB 1.2 Water Calculator v2.2

| Fixture | Baseline | Unit |
|---|---|---|
| WC Flush Valve | ≤ 6 | L/flush |
| WC Flush Tank | ≤ 6 | L/flush |
| Peturasan / Urinal | ≤ 4 | L/flush |
| Keran Tembok | ≤ 8 | L/menit |
| Keran Wastafel | ≤ 8 | L/menit |
| Keran Wudhu | ≤ 8 | L/menit |
| Shower Mandi | ≤ 9 | L/menit |

---

## 4. Behavioral Constants per Typology

### Office (Kantor)
| Constant | Value | Description |
|---|---|---|
| WC uses/day — male | 0.3 | Average times/day/person (50% male) |
| WC uses/day — female | 2.3 | Average times/day/person (50% female) |
| No-urinal WC uses — male | 2.3 | When no urinal installed |
| Urinal uses/day | 2.0 | Male only |
| Urinal auto-timer flushes | 48 | Every 30 min |
| Handwashing duration | 0.15 min | Per use |
| Tap usage/day | 2.5 | Times per day |
| Shower duration | 5 min | Per person/day |
| Shower % of occupants | 5% | |
| Female occupancy | 50% | |
| Male occupancy | 50% | |
| Moslem female % | 50% | Of female population |
| Moslem male % | 50% | Of male population |
| Wudhu duration | 0.5 min | Per use |
| Wudhu times/day | 2 | Times per day |
| Landscape irrigations/day | 2 | Times |
| Op hours standard | 8 | For normalization |

### Factory (Pabrik)
| Constant | Value | Description |
|---|---|---|
| Shifts | 3 | Shift 1, 2, 3 with individual occupant counts |
| WC uses/day — male | 0.42 | Average times/day/person |
| WC uses/day — female | 1.38 | Average times/day/person |
| No-urinal WC uses — male | 2.3 | |
| Urinal uses/day | 3.0 | |
| Urinal auto-timer flushes | 67.2 | Every ~21 min |
| Handwashing duration | 0.15 min | |
| Tap usage/day | 7.5 | (factory workers wash more) |
| Shower duration | 5 min | |
| Shower % of occupants | 5% | |
| Female/Male ratio | **Configurable** (default 10%/90%) | |
| Moslem % | configurable | |
| Wudhu duration | 0.5 min | |
| Wudhu times/day | 5 | |
| Landscape irrigations/day | 2 | |
| Op hours | 24 | 3 shifts × 8h |
| Op hours standard | 8 | For normalization factor |

---

## 5. Calculation Algorithms

### 5.1 Dynamic Baseline (NB 1.2 approach)

Unlike NB 2.0 (fixed 50 L/pegawai/hari), NB 1.2 computes a **dynamic baseline** from standard flow rates:

```
baseline_total = flush_baseline + tap_baseline + landscape_baseline + CT_baseline
baseline_normalized = (baseline_total / occupant) × (opHours / 8)
```

WAC 1 scores compare design to this dynamic baseline.

### 5.2 WC Flush Daily Consumption

**Step A — Flushes per day:**
```
// If urinal installed:
wc_flushes_per_day = occupant × (male_pct × wc_uses_male + female_pct × wc_uses_female)

// If no urinal:
wc_flushes_per_day = occupant × no_urinal_rate

urinal_flushes_per_day = occupant × male_pct × urinal_uses
```

**Factory — per shift:**
```
for each shift s:
  wc_flushes[s] = shift_occ[s] × (male_pct × wc_uses_male + female_pct × wc_uses_female)
  urinal_flushes[s] = shift_occ[s] × male_pct × urinal_uses

total_wc_flushes = sum(wc_flushes)
total_urinal_flushes = sum(urinal_flushes)
```

**Step B — Daily water (L/day) per product:**
```
valve_share = valve_qty / (valve_qty + tank_qty)
tank_share  = 1 - valve_share

// For each WC product i:
product_contribution_baseline = flushes × baseline_rate × share_i
product_contribution_design   = flushes × design_rate_i × share_i

total_wc_baseline = Σ(product_contribution_baseline)
total_wc_design   = Σ(product_contribution_design)

urinal_baseline = urinal_flushes × Σ(share_i × baseline_rate)
urinal_design   = urinal_flushes × Σ(share_i × design_rate_i)
```

**Step C — Recycle reduction:**
```
flush_design_from_primary = (wc_design + urinal_design) × (1 - recycle_pct)
```
If `wc_disiram_dengan_recycle = Yes` and `recycle_pct = 1.0`, then flush from primary = 0.

### 5.3 Tap/Shower Daily Consumption

**Tap duration (minutes/day):**
```
keran_minutes = occupant × handwashing_duration × tap_usage   // = occupant × 0.15 × 2.5
wudhu_minutes = occupant × (female_pct × moslem_f × wudhu_times × wudhu_dur
                           + male_pct × moslem_m × wudhu_times × wudhu_dur)
shower_minutes = occupant × shower_pct × shower_duration
```

**Daily water = minutes × weighted_avg_flow_rate × area_share:**
```
keran_tembok_baseline = keran_minutes × Σ(share_i × 8) × tembok_share
keran_wastafel_baseline = keran_minutes × Σ(share_i × 8) × wastafel_share
wudhu_baseline = wudhu_minutes × Σ(share_i × 8)
shower_baseline = shower_minutes × Σ(share_i × 9)

// tembok_share + wastafel_share = 1 (from product quantities)
```

**Shower recycle reduction:**
```
tap_design_from_primary = total_tap_design × (1 - shower_recycle_pct)
```

### 5.4 Landscaping

```
irrigation_frequency = 2    // times per day (all typologies)
landscape_baseline = Σ(zone_baseline_rate × area_share) × total_area × irrigation_frequency
landscape_design   = Σ(zone_design_rate  × area_share) × total_area × irrigation_frequency

landscape_from_primary = landscape_design × (1 - pct_from_non_primary)
```

### 5.5 Cooling Tower

```
CT_total = (load_TR × 3) × 0.01 × 3.78541 × 60 × op_hours
CT_from_primary = CT_total × (1 - pct_from_non_primary)
// or 0 if CT uses only non-primary water
```

### 5.6 Rainwater Harvesting (WAC 6)

```
ideal_volume = roof_area × avg_rainfall × runoff_coef    // NOTE: uses average rainfall
capture_ratio = tank_capacity / ideal_volume

// Rainwater availability:
available_wet_day = min(tank_capacity, ideal_volume)
available_dry_day = 0

// Allocation to uses:
reduction_flush = if(use_for_flush, min(available, flush_design), 0)
reduction_irrigation = if(use_for_irrigation, min(remaining, irrigation_design), 0)
reduction_CT = if(use_for_CT, min(remaining, CT_design), 0)
```

### 5.7 Water Recycle

```
recycle_capacity = user_input (L/day)
recycle_sources = {
  tap_water: design_keran,
  wudhu_water: design_wudhu,
  shower_water: design_shower,
  rainwater: from_rainwater,
  AHU_condensate: user_input,
  others: user_input,
}
total_recycle_available = min(recycle_capacity, sum(recycle_sources))

recycle_for_flushing = if(selected, pro_rata_share × total_recycle)
recycle_for_irrigation = if(selected, pro_rata_share × total_recycle)
recycle_for_CT = if(selected, pro_rata_share × total_recycle)
```

### 5.8 Factory Equipment Water

Additional category unique to Factory typology:
```
equipment_list = [{ name, qty, output_per_unit_L_per_day }]
total_equipment_water = Σ(qty × output)  // L/day
```
Added to total design consumption but NOT to fixture/tap calculations.

### 5.9 Final Results & WAC 1 Scoring

**Total consumption:**
```
baseline_total = flush_BL + tap_BL + landscape_BL + CT_total (+ equipment_BL for factory)
design_total   = flush_primary + tap_primary + landscape_primary + CT_primary + equipment_design

// Normalization:
baseline_norm = (baseline_total / occupant) × (opHours / 8)   // Office
design_norm   = (design_total / occupant) × (opHours / 8)     // Office
// or
baseline_norm = (baseline_total / NLA) × (opHours / 8)        // Factory/Mall
design_norm   = (design_total / NLA) × (opHours / 8)
```

**WAC P2:** `PASS if design_norm / baseline_norm ≤ 0.80`

**WAC 1 Points (0–8):**
```
pct_ratio = design_norm / baseline_norm
savings   = 1 - pct_ratio

if pct_ratio > 0.80  → 0 pts (fails WAC P2)
if pct_ratio ≤ 0.80  → 1 pt
if pct_ratio ≤ 0.75  → 2 pts
if pct_ratio ≤ 0.70  → 3 pts
if pct_ratio ≤ 0.65  → 4 pts
if pct_ratio ≤ 0.60  → 5 pts
if pct_ratio ≤ 0.55  → 6 pts
if pct_ratio ≤ 0.50  → 7 pts
if pct_ratio ≤ 0.45  → 8 pts
```

---

## 6. Import / Export Schema (JSON)

```json
{
  "version": "2.0",
  "exportedAt": "ISO-8601 timestamp",
  "building": {
    "name": "string",
    "typology": "KANTOR | PABRIK | ...",
    "nla": "number (m²)",
    "occupant1": "number",
    "occupant2": "number | null",
    "opHours": "number"
  },
  "fixtures": {
    "WC_FLUSH_VALVE": [{ "name": "string", "qty": "number", "rate": "number" }],
    "WC_FLUSH_TANK": [...],
    "URINAL": [...],
    "KERAN_TEMBOK": [...],
    "KERAN_WASTAFEL": [...],
    "KERAN_WUDHU": [...],
    "SHOWER": [...]
  },
  "hasUrinal": "boolean",
  "wcRecyclePct": "number (0–1)",
  "showerRecyclePct": "number (0–1)",
  "landscape": {
    "area": "number (m²)",
    "pctFromNonPrimary": "number (0–1)",
    "zones": [{ "label": "string", "basRate": "number", "dsgRate": "number", "areaShare": "number (0–1)" }]
  },
  "coolingTower": {
    "enabled": "boolean",
    "load": "number (TR)",
    "pctFromNonPrimary": "number (0–1)"
  },
  "rainwater": {
    "hasTank": "boolean",
    "tankCapacity": "number (L)",
    "avgRainfall": "number (mm)",
    "runoffCoef": "number (0–1)",
    "roofArea": "number (m²)",
    "useForFlush": "boolean",
    "useForIrrigation": "boolean",
    "useForCT": "boolean"
  },
  "waterRecycle": {
    "hasSystem": "boolean",
    "capacity": "number (L/day)",
    "sourcesTap": "boolean",
    "sourcesWudhu": "boolean",
    "sourcesShower": "boolean",
    "sourcesRainwater": "boolean",
    "sourcesAHU": "number (L/day)",
    "sourcesOthers": "number (L/day)",
    "useForFlush": "boolean",
    "useForIrrigation": "boolean",
    "useForCT": "boolean"
  },
  "factory": {
    "shift1": "number",
    "shift2": "number",
    "shift3": "number",
    "malePct": "number (0–1)",
    "equipment": [{ "name": "string", "qty": "number", "outputPerUnit": "number" }]
  }
}
```

---

## 7. Security Architecture

- **Client-side only** — no backend, no database, no user PII transmitted
- **Input sanitization** — all text fields strip HTML/script tags before use
- **JSON import validation** — strict schema check; malformed or unexpected keys rejected
- **Number bounds validation** — all numeric inputs validated against reasonable ranges
- **Content Security Policy** — set via Netlify headers to prevent XSS
- **localStorage** — only draft project data stored; no auth tokens or sensitive data
- **No eval()** — no dynamic code execution
- **Dependency audit** — minimal dependencies (React, Recharts, Lucide)

---

## 8. Deployment (Netlify)

```
Build command: npm run build
Publish directory: dist
Node version: 20
```

Security headers configured in `netlify.toml`:
- `Content-Security-Policy`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
