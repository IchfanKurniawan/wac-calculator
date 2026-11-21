# DESIGN.md — GREENSHIP NB v1.3 WAC Calculator (Simplified & Polished)

## Design Vision
**Mode: Operate** — Precision over expression. The consultant completes a certification task; scanability, consistency, and native affordances outrank visual flair. Brand lives in precise details.

---

## 1. Visual Foundation (GBC Indonesia Aligned)

### Colors (CSS Variables in `:root`)
```css
--green: #43814E;         /* Primary brand, success states */
--green-dark: #295244;    /* Header bg, active states */
--green-deep: #2F6B3C;    /* Hover on green buttons */
--orange: #FFA24A;        /* Primary CTA (Lanjut, Calculate) */
--orange-hover: #FF9430;
--blue: #00B9F0;          /* Focus rings, info */
--heading: #354F45;       /* Primary text, headings */
--body: #354F45;          /* Body text */
--muted: #555;            /* Secondary text, placeholders */
--line: #E4E8E2;          /* Borders, dividers */
--lighter: #F6F8F4;       /* Page background */
--card: #F0F3EA;          /* Card background (subtle green tint) */
--dark: #183D32;          /* Header bg, dark accents */
--accent: #5FB25C;        /* Progress, accent green */
--accent-light: #ACEBB1;  /* Progress fill light */
--charcoal: #414042;      /* Secondary actions */
--warn-bg: #FFF4D6;       /* Warning bg */
--warn-line: #F0B73A;     /* Warning border */
--warn-ink: #8A4B00;      /* Warning text */
--danger: #B3261E;        /* Error states */
--danger-bg: #FEF2F2;
--danger-line: #FCA5A5;
--ok-bg: #EEF9F0;         /* Success bg */
--ok-line: #CFE9D3;       /* Success border */
--ok-ink: #1F6B2A;        /* Success text */
--info-bg: #D6F0F7;       /* Info bg */
```

### Typography
- **Display (Hero/Display Large):** `Parkinsans` variable 300–800 — used for Results hero score, step numbers
- **UI (Everything else):** `Onest` variable 100–900 — all UI, body, labels, inputs, tables
- **Scale (CSS variables):**
  - `--display`: Parkinsans stack
  - `--sans`: Onest stack
  - `h1`: clamp(32px, 4.6vw, 58px) / 400 / -0.5px
  - `h2`: clamp(24px, 3vw, 28px) / 600 / -0.3px
  - `h3`: 20px / 600 / 1.4
  - `h4`: 18px / 600 / 1.4
  - `body`: 16px / 400 / 1.6
  - `label`: 13px / 500
  - `caption`: 12px / 400 / muted
  - `eyebrow`: 13px / 600 / 0.14em / uppercase / brandLink

### Spacing & Layout Tokens
- `--wrap`: 1170px (max content width)
- `--hdr-h`: 72px (reduced from 84px)
- `--rail-w`: 250px (reduced from 270px)
- `--radius`: 8px, `--radius-sm`: 6px, `--radius-lg`: 12px, `--radius-full`: 999px
- `--shadow-soft`: 0 2px 6px rgba(17,17,17,0.12)
- `--shadow-card`: 0 12px 28px rgba(17,17,17,0.12)
- Space scale: 4/8/12/16/20/24/32/40/48 (use `var(--space-4)` etc. via tokens)

### Focus & Accessibility
- **Focus ring:** 3px solid `var(--blue)` / 2px offset (already in app.css)
- **Reduced motion:** Respect `prefers-reduced-motion`
- **Contrast:** All text ≥4.5:1; interactive ≥3:1

---

## 2. Simplified Layout Architecture

### Single Source of Truth for Navigation
| Component | Responsibility | Removed Redundancy |
|-----------|----------------|-------------------|
| **Header** | Brand + Scheme selector + Mobile menu only | ❌ Step pills, ❌ Progress bar |
| **SideRail (Desktop)** | **Only** step navigation (6 steps grouped) | ❌ Scheme info, ❌ Version badge, ❌ Back link |
| **StepNav (Footer)** | Previous/Next/Undo + Issue count + Auto-save | ❌ Step label (rail shows it) |
| **MobileSummaryBar** | Progress % + Key metrics + Primary action | ❌ Step navigation (hamburger opens rail) |
| **SchemeSheet** | Typology selector (right drawer) | — |

### Responsive Behavior
- **Desktop (≥1024px):** Fixed header + permanent left rail + main content
- **Tablet (768–1023px):** Fixed header + hamburger → slide-in rail overlay + main content
- **Mobile (<768px):** Fixed header + hamburger → slide-in rail overlay + main content + bottom summary bar

---

## 3. Component Specifications

### 3.1 Header (Simplified)
```tsx
<header className="site-header" style={{height: 'var(--hdr-h)'}}>
  <div className="header-inner">
    {/* Brand lockup */}
    <a className="brand" href="https://gbcindonesia.org" target="_blank" rel="noopener">
      <span className="brand-wordmark">GBC Indonesia</span>
      <div className="brand-sub">
        <b>GREENSHIP NB v1.3</b>
        <small>Kalkulator Air</small>
      </div>
    </a>
    
    {/* Scheme selector — single source */}
    <SchemeTrigger schemeLabel={schemeLabel} onClick={onSchemeClick} />
    
    {/* Mobile hamburger */}
    {isMobile && <HamburgerButton onClick={onMenuClick} isOpen={sidebarOpen} />}
  </div>
</header>
```
- **Height:** 72px (was 84px)
- **No step pills, no progress bar** — rail owns navigation
- **Scheme trigger:** Orange pill button with Award icon, opens SchemeSheet (right drawer)

### 3.2 SideRail (Desktop Permanent, Mobile Drawer)
```tsx
<aside className="sidebar-wrap" role="navigation" aria-label="Navigasi langkah">
  <nav className="scheme-list">
    {SECTIONS.map(section => (
      <section>
        <h3>{section.title}</h3>  {/* BANGUNAN / AIR DALAM / LUAR & SISTEM / NERACA & HASIL */}
        {section.steps.map(stepId => (
          <StepButton
            step={step}
            isActive={stepId === currentStep}
            isCompleted={stepId < currentStep}
            isDisabled={stepId > currentStep && hasBlockingErrors(stepId - 1)}
            onClick={() => onStepChange(stepId)}
          />
        ))}
      </section>
    ))}
  </nav>
</aside>
```
- **Groups:** BANGUNAN (1) → AIR DALAM (2) → LUAR & SISTEM (3,4) → NERACA & HASIL (5,6)
- **Step button:** Icon + short label + full label; completed shows checkmark; active highlighted
- **Disabled:** Future steps with blocking errors on previous step
- **No scheme info, no version badge, no back link**

### 3.3 StepNav (Footer — Single Source for Actions)
```tsx
<nav className="step-nav" aria-label="Navigasi langkah">
  <div className="step-nav-start">
    <Button variant="ghost" size="sm" onClick={goBack} disabled={isFirst}>
      <ChevronLeft /> Kembali
    </Button>
    <Button variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo}>
      <RotateCcw /> Urungkan
    </Button>
  </div>
  
  <div className="step-nav-center">
    <span className="step-indicator">Langkah {currentStep} dari 6</span>
    <AutoSaveIndicator savedAt={savedAt} />
  </div>
  
  <div className="step-nav-end">
    {isLast ? (
      <StatusBadge issueCount={issueCount} />
    ) : (
      <Button variant="primary" size="sm" onClick={goNext} disabled={hasBlockingErrors(currentStep)}>
        Lanjut: {nextStepLabel} <ChevronRight />
      </Button>
    )}
  </div>
</nav>
```
- **Only place** for Previous/Next/Undo
- **Next disabled** when current step has blocking errors (validation gate)
- **Last step:** Shows status badge (✓ Data lengkap / ⚠ N hal perlu dilengkapi)

### 3.4 MobileSummaryBar (Bottom, Mobile Only)
```tsx
<div className="mobile-summary" role="status" aria-live="polite">
  <ProgressBar value={progress} />
  <MetricsPreview wac1Result={wac1Result} wac2Result={wac2Result} />
  <Button variant="primary" onClick={isLast ? onCalculate : onNextStep}>
    {isLast ? 'Lihat Hasil' : 'Lanjut'}
  </Button>
</div>
```
- **Progress bar** (0–100%) + **Key metrics** (WAC 1 % / WAC 2 pts)
- **Primary action** always available (never gated — validation happens on step change)

### 3.5 SchemeSheet (Right Drawer)
- Opens from Header scheme trigger
- Radio cards for each typology (KANTOR active, others disabled with "Phase 2" badge)
- Shows step preview for selected typology

---

## 4. Step Content Patterns (Consistency)

### Card Structure (All Steps)
```tsx
<DetailCard
  title={stepTitle}
  subtitle={stepSubtitle}
  icon={stepIcon}
  className="step-card"
>
  <div className="step-body">{content}</div>
  <div className="step-footer">{validationHints}</div>
</DetailCard>
```

### Step 1: Building Data
- **Fields:** Nama Bangunan (required), Tipologi (read-only, from scheme), NLA, Occupants (Pegawai/Pengunjung), Jam Operasional
- **Layout:** 2-col grid (NLA | Occupants), full-width for name
- **Validation inline:** Red border + helper text on required fields

### Step 2: Fixtures (WAC 2)
- **Accordion per fixture type** (7 types) — collapses to reduce vertical fatigue
- **Each accordion:** Header shows fixture name + baseline badge + WAC 2 contribution
- **Inside:** Product table (Add row → product name, rate, qty); inline status chip (Efisien/Boros)
- **Live WAC 2 badge** in step header: `WAC 2: X/3 poin (Y%)`

### Step 3: Landscape & Cooling Tower
- **Two columns desktop:** Landscape zones (left) | Cooling Tower (right)
- **Landscape:** Zone cards with areaShare % inputs; sum validation (must = 100%); plant type selector; irrigation efficiency
- **CT:** Toggle to enable; COC input (2–10); water source selector

### Step 4: Rainwater
- **Visual tank gauge** (capacity vs ideal volume)
- **Roof area** (prefill from NLA × 0.8 helper)
- **Daily rainfall input** (table or single value)
- **P2 Prerequisite callout:** Tank ≥ 10% ideal annual volume → ✓/✗

### Step 5: Water Balance
- **Responsive table:** Desktop = sticky first column; Mobile = stacked cards per source/use
- **Sources:** PDAM, Air Tanah, Air Hujan, Resirkulasi
- **Uses:** WC, Wastafel, Urinal, Shower, Lansekap, CT, Lainnya
- **Reduction %** prominent: `Reduksi: X%` with progress ring

### Step 6: Results
- **Hero:** Animated progress ring (WAC 1 score / 8) + large score number (Parkinsans)
- **Tabs:** WAC 1 | WAC 2 | Prasyarat | Ringkasan Eksekutif
- **What-if suggestions** as accordion cards
- **Print button** (generates PDF via browser print)

---

## 5. Interaction & Motion

### View Transitions (Step Changes)
```css
@view-transition {
  navigation: auto;
}
main { view-transition-name: step-content; }
```
- Fade + slide (150ms) on step change
- Respects `prefers-reduced-motion`

### Micro-interactions
- **Button press:** `transform: translateY(1px)` (100ms)
- **Focus ring:** 3px blue (instant)
- **Accordion:** Height animation (200ms ease-out)
- **Progress bars:** Width transition (400ms ease-out)
- **Toggle switch:** Transform + bg (150ms)

### Performance
- `content-visibility: auto` on off-screen step content
- Lazy-load recharts on Results step
- Fonts: `font-display: optional` + preload

---

## 6. Print / PDF Report (Results Page)
- `@media print` hides: header, rail, footer, summary bar, no-print
- A4 margins: 14mm
- Charts rasterized via `recharts` SVG → canvas → image
- Page breaks: `break-inside: avoid` on DetailCard
- Typography: Onest only (Parkinsans may not embed)

---

## 7. Accessibility Checklist
- [ ] All inputs have `<label for>` or `aria-label`
- [ ] Tables have `<caption>`, `<thead>`, `<tbody>`, `scope="col"`
- [ ] Toggles: `role="switch"` + `aria-checked` + `aria-labelledby`
- [ ] Step nav: `aria-current="step"` on active
- [ ] Progress bars: `role="progressbar"` + `aria-valuenow`
- [ ] Error messages: `role="alert"` + linked via `aria-describedby`
- [ ] Focus order logical (header → rail → main → footer)
- [ ] Skip link in header (to main)
- [ ] Color not sole conveyor of meaning (icons + text)

---

## 8. Token Reference (Export from tokens.ts)
```ts
export const C = {
  // Core
  heading: '#354F45', body: '#354F45', muted: '#555', line: '#E4E8E2',
  lighter: '#F6F8F4', card: '#F0F3EA', white: '#FFFFFF',
  // Brand
  brand: '#43814E', brandDark: '#295244', brandDeep: '#2F6B3C',
  // CTA
  cta: '#FFA24A', ctaHover: '#FF9430', ctaText: '#1D2B1F',
  // Accent
  accent: '#5FB25C', accentLight: '#ACEBB1', accentStrong: '#43914A',
  // Status
  success: '#43814E', successBg: '#EEF9F0', successLine: '#CFE9D3', successInk: '#1F6B2A',
  warning: '#FFA24A', warningBg: '#FFF4D6', warningLine: '#F0B73A', warningInk: '#8A4B00',
  danger: '#B3261E', dangerBg: '#FEF2F2', dangerLine: '#FCA5A5', dangerInk: '#B3261E',
  // Info
  info: '#00B9F0', infoInk: '#0B6A99', infoBg: '#D6F0F7',
  // Dark
  charcoal: '#414042', charcoalHover: '#5A595B', dark: '#183D32',
  // Legacy
  green: '#43814E', red: '#B3261E', blue: '#00B9F0',
  greenBg: '#EEF9F0', redBg: '#FEF2F2', blueBg: '#D6F0F7',
} as const;
```

---

## 9. Implementation Priority

### Phase 1: Foundations (No Visual Regression Risk)
1. Update `tokens.ts` with semantic aliases above
2. Update `app.css` CSS variables to match
3. Fix `atoms.tsx` accessibility (NumberControl label, Toggle aria, Table semantics)

### Phase 2: Layout Simplification
1. **Header** — Remove step pills, progress bar; keep brand + scheme + hamburger
2. **SideRail** — Remove scheme info, version badge, back link; keep grouped steps only
3. **StepNav** — Ensure Next disabled on validation errors; unify styling
4. **MobileSummaryBar** — Keep, verify metrics preview works
5. **SchemeSheet** — Verify right-drawer behavior

### Phase 3: Step Content Polish
1. **Step 1** — Compact 2-col grid, inline validation
2. **Step 2** — Accordion fixture groups, live WAC 2 badge
3. **Step 3** — Two-col layout, zone sum validation
4. **Step 4** — Tank gauge, P2 callout
5. **Step 5** — Responsive table/cards, reduction highlight
6. **Step 6** — Hero ring, tabs, what-if accordions

### Phase 4: Polish & Harden
1. View transitions on step change
2. Print stylesheet verification
3. Accessibility audit (axe + manual)
4. Reduced motion testing
5. Mobile/tablet/desktop breakpoint testing