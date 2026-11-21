// GBCI-Aligned Design Tokens
// Single source of truth for all design tokens — mirrors gbcindonesia.org CSS variables

export const Tokens = {
  // ─── Brand ───
  brand: '#43814E',           // --green
  brandDark: '#295244',       // --green-dark
  brandDeep: '#2F6B3C',       // --green-deep
  brandLink: '#3D7647',       // --link

  // ─── Primary CTA (Orange) ───
  cta: '#FFA24A',             // --orange
  ctaHover: '#FF9430',        // --orange-hover
  ctaText: '#1D2B1F',         // --on-accent (text on orange CTA)

  // ─── Secondary / Dark Actions (Charcoal) ───
  charcoal: '#414042',        // --charcoal
  charcoalHover: '#5A595B',   // lighter charcoal for hover

  // ─── Accent / Progress (Green) ───
  accent: '#5FB25C',          // --accent
  accentLight: '#ACEBB1',     // --accent-light
  accentStrong: '#43914A',    // --accent-strong
  onAccent: '#1F3329',        // --on-accent (text on accent gradients)

  // ─── Info (Blue) ───
  info: '#00B9F0',            // --blue
  infoInk: '#0B6A99',         // --teks-biru
  infoBg: '#D6F0F7',          // --tint-biru

  // ─── Neutral ───
  heading: '#354F45',         // --heading (primary text, headings)
  body: '#354F45',            // --body (body text)
  muted: '#555',              // --muted
  line: '#E4E8E2',            // --line (borders, dividers)
  lighter: '#F6F8F4',         // --lighter (page background)
  card: '#F0F3EA',            // --card (card background)
  white: '#FFFFFF',

  // ─── Status ───
  success: '#43814E',         // --green
  successBg: '#EEF9F0',       // --ok-bg
  successLine: '#CFE9D3',     // --ok-line
  successInk: '#1F6B2A',      // --ok-ink
  warning: '#FFA24A',         // --orange (repurposed from amber)
  warningBg: '#FFF4D6',       // --warn-bg
  warningLine: '#F0B73A',     // --warn-line
  warningInk: '#8A4B00',      // --warn-ink
  danger: '#B3261E',          // --danger
  dangerBg: '#FEF2F2',        // (kept from existing redBg)
  dangerLine: '#FCA5A5',
  dangerInk: '#B3261E',

  // ─── Gradients ───
  gradientCTA: 'linear-gradient(90deg, var(--heading), var(--accent))',
  gradientOrange: 'linear-gradient(90deg, var(--accent), var(--accent-light))',

  // ─── Radius & Shadows ───
  radius: '8px',
  radiusSm: '6px',
  radiusLg: '12px',
  radiusFull: '999px',
  shadowSoft: '0 2px 6px rgba(17,17,17,0.12)',
  shadowCard: '0 12px 28px rgba(17,17,17,0.12)',
  shadowHeader: '0 2px 14px rgba(17,17,17,0.18)',

  // ─── Spacing Scale ───
  space1: '4px',
  space2: '8px',
  space3: '12px',
  space4: '16px',
  space5: '20px',
  space6: '24px',
  space8: '32px',
  space10: '40px',
  space12: '48px',

  // ─── Typography (CSS variable names for reference) ───
  // --sans: Onest, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif
  // --display: Parkinsans, Onest, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif
};

// Semantic aliases for easier migration from old C.* tokens
// This object is the single export used by all components
export const C = {
  // Core GBCI colors (from Tokens)
  heading: Tokens.heading,
  body: Tokens.body,
  muted: Tokens.muted,
  line: Tokens.line,
  lighter: Tokens.lighter,
  card: Tokens.card,
  white: Tokens.white,
  
  // Brand colors
  brand: Tokens.brand,
  brandDark: Tokens.brandDark,
  brandDeep: Tokens.brandDeep,
  brandLink: Tokens.brandLink,
  
  // Primary CTA (Orange)
  cta: Tokens.cta,
  ctaHover: Tokens.ctaHover,
  ctaText: Tokens.ctaText,
  
  // Secondary / Dark Actions (Charcoal)
  charcoal: Tokens.charcoal,
  charcoalHover: Tokens.charcoalHover,
  
  // Accent / Progress (Green)
  accent: Tokens.accent,
  accentLight: Tokens.accentLight,
  accentStrong: Tokens.accentStrong,
  onAccent: Tokens.onAccent,
  
  // Info (Blue)
  info: Tokens.info,
  infoInk: Tokens.infoInk,
  infoBg: Tokens.infoBg,
  
  // Status colors
  success: Tokens.success,
  successBg: Tokens.successBg,
  successLine: Tokens.successLine,
  successInk: Tokens.successInk,
  warning: Tokens.warning,
  warningBg: Tokens.warningBg,
  warningLine: Tokens.warningLine,
  warningInk: Tokens.warningInk,
  danger: Tokens.danger,
  dangerBg: Tokens.dangerBg,
  dangerLine: Tokens.dangerLine,
  dangerInk: Tokens.dangerInk,
  
  // Brand background (light)
  brandBg: 'rgba(67, 129, 78, 0.1)',
  
  // Dark
  dark: Tokens.brandDark,
  
  // Text on accent/cta
  inkKontras: '#111',
} as const;

// Formatting helpers (unchanged — preserve Indonesian locale)
export const fmt = (v: number, d = 1) =>
  typeof v === 'number' && isFinite(v)
    ? v.toLocaleString('id-ID', { maximumFractionDigits: d })
    : '—';

export const fmtFixed = (v: number, d = 1) =>
  typeof v === 'number' && isFinite(v)
    ? v.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d })
    : '—';

export const fmtPct = (v: number, d = 1) =>
  typeof v === 'number' && isFinite(v)
    ? `${(v * 100).toLocaleString('id-ID', { maximumFractionDigits: d })}%`
    : '—';