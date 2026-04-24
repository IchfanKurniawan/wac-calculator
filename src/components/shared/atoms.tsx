import React from 'react';

// ─── Design Tokens (design.md — Veridian Metric) ─────────────────────────────
export const C = {
  teal:   '#1B4E4D',
  teal2:  '#2A6665',
  mint:   '#D3FEAB',
  mintDim:'rgba(211,254,171,0.15)',
  amber:  '#FF9500',
  slate:  '#F8FAFC',
  s100:   '#F1F5F9',
  s200:   '#E2E8F0',
  s300:   '#CBD5E1',
  s400:   '#94A3B8',
  s500:   '#64748B',
  s700:   '#334155',
  s800:   '#1E293B',
  white:  '#FFFFFF',
  green:  '#16A34A',
  red:    '#DC2626',
  greenBg:'#F0FDF4',
  redBg:  '#FEF2F2',
  blueBg: '#EFF6FF',
  blue:   '#2563EB',
};

// ─── Formatting helpers ───────────────────────────────────────────────────────
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

// ─── Responsive breakpoint hook ───────────────────────────────────────────────
export function useBreakpoint() {
  const [w, setW] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );
  React.useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return {
    isMobile:  w < 640,
    isTablet:  w >= 640 && w < 1024,
    isDesktop: w >= 1024,
    w,
  };
}

// ─── Atoms ───────────────────────────────────────────────────────────────────

interface LabelProps { children: React.ReactNode; unit?: string }
export function Label({ children, unit }: LabelProps) {
  return (
    <div style={{ color: C.s500, fontSize: 12, fontWeight: 500, letterSpacing: '0.04em', marginBottom: 4 }}>
      {children}{unit && <span style={{ color: C.s300, fontWeight: 400 }}> ({unit})</span>}
    </div>
  );
}

interface InpProps {
  value: string | number;
  onChange: (v: number | string) => void;
  type?: 'number' | 'text';
  placeholder?: string;
  /** default 0.001 so all numeric inputs accept 3 decimal places */
  step?: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  style?: React.CSSProperties;
}
export function Inp({ value, onChange, type = 'number', placeholder, step = 0.001, min = 0, max, disabled, style }: InpProps) {
  return (
    <input
      type={type}
      value={value}
      disabled={disabled}
      onChange={e => onChange(type === 'number' ? parseFloat(e.target.value.replace(',', '.')) || 0 : e.target.value)}
      lang="id-ID"
      placeholder={placeholder}
      step={step}
      min={min}
      max={max}
      style={{
        width: '100%', boxSizing: 'border-box', padding: '7px 10px', fontSize: 13,
        border: `1px solid ${C.s200}`, borderRadius: 8,
        background: disabled ? C.s100 : C.white,
        color: C.s800, fontFamily: 'inherit', outline: 'none',
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    />
  );
}

interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
}
export function Sel({ value, onChange, options }: SelectProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', padding: '7px 10px', fontSize: 13,
        border: `1px solid ${C.s200}`, borderRadius: 8,
        color: C.s800, background: C.white, fontFamily: 'inherit', outline: 'none',
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
      ))}
    </select>
  );
}

interface CardProps { children: React.ReactNode; style?: React.CSSProperties }
export function Card({ children, style }: CardProps) {
  return (
    <div style={{
      background: C.white, borderRadius: 8, border: `1px solid ${C.s200}`,
      padding: 20, ...style,
    }}>
      {children}
    </div>
  );
}

interface SecTitleProps { icon?: React.ElementType; children: React.ReactNode }
export function SecTitle({ icon: Icon, children }: SecTitleProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      {Icon && <Icon size={14} style={{ color: C.teal }} />}
      <span style={{ fontSize: 12, fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {children}
      </span>
    </div>
  );
}

interface PillProps { val: string | number; label: string; unit?: string; accent?: string }
export function Pill({ val, label, unit, accent }: PillProps) {
  return (
    <div style={{ background: C.s100, borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: accent ?? C.teal, fontVariantNumeric: 'tabular-nums' }}>{val}</div>
      <div style={{ fontSize: 11, color: C.s500, marginTop: 2 }}>{label}</div>
      {unit && <div style={{ fontSize: 10, color: C.s300 }}>{unit}</div>}
    </div>
  );
}

interface TogProps { on: boolean; onChange: (v: boolean) => void; label: string }
export function Tog({ on, onChange, label }: TogProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => onChange(!on)}>
      <div style={{
        width: 36, height: 20, borderRadius: 10,
        background: on ? C.teal : C.s300, position: 'relative', transition: '0.2s', flexShrink: 0,
      }}>
        <div style={{
          width: 14, height: 14, borderRadius: 7, background: C.white,
          position: 'absolute', top: 3, left: on ? 19 : 3, transition: '0.2s',
        }} />
      </div>
      <span style={{ fontSize: 13, color: C.s700 }}>{label}</span>
    </div>
  );
}

interface CheckProps { checked: boolean; onChange: (v: boolean) => void; label: string }
export function Check({ checked, onChange, label }: CheckProps) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: C.s700 }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ width: 14, height: 14, accentColor: C.teal }}
      />
      {label}
    </label>
  );
}

/** Inline % input — stores as 0-1, displays as 0-100 with 3 decimal precision */
interface PctInpProps {
  value: number;          // 0–1 stored value
  onChange: (v: number) => void;
  label: string;
  unit?: string;
}
export function PctInp({ value, onChange, label, unit = '%' }: PctInpProps) {
  return (
    <div>
      <Label unit={unit}>{label}</Label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Inp
          value={parseFloat((value * 100).toFixed(3))}
          onChange={v => onChange(Math.min(100, Math.max(0, v as number)) / 100)}
          step={0.001}
          min={0}
          max={100}
        />
      </div>
    </div>
  );
}
