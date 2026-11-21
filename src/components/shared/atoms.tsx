import React from 'react';
import { C, fmt, fmtFixed, fmtPct } from './tokens';

// ─── Re-export formatting helpers ───
export { fmt, fmtFixed, fmtPct };

// ─── Base Style Objects (for inline styles in components) ───

// Layout
export const row = (gap = 12) => ({ display: 'flex', gap, flexWrap: 'wrap', alignItems: 'center' });
export const col = (gap = 12) => ({ display: 'flex', flexDirection: 'column' as const, gap });
export const center = () => ({ display: 'flex', alignItems: 'center', justifyContent: 'center' });
export const spaceBetween = () => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between' });

// Typography
export const headingStyle = (size: 'xl' | 'lg' | 'md' | 'sm' | 'xs' = 'md') => {
  const sizes: Record<'xl' | 'lg' | 'md' | 'sm' | 'xs', { fontSize: string; fontWeight: number; lineHeight: number; letterSpacing?: string }> = {
    xl: { fontSize: 'clamp(32px, 4.6vw, 58px)', fontWeight: 400, lineHeight: 1.15, letterSpacing: '-0.5px' },
    lg: { fontSize: 'clamp(24px, 3vw, 28px)', fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.3px' },
    md: { fontSize: '20px', fontWeight: 600, lineHeight: 1.4 },
    sm: { fontSize: '18px', fontWeight: 600, lineHeight: 1.4 },
    xs: { fontSize: '16px', fontWeight: 600, lineHeight: 1.4 },
  };
  return { fontFamily: 'var(--display)', color: C.heading, ...sizes[size] };
};

export const eyebrowStyle = () => ({
  fontFamily: 'var(--sans)',
  fontSize: '13px',
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: C.brandLink,
});

export const bodyStyle = () => ({
  fontFamily: 'var(--sans)',
  fontSize: '16px',
  fontWeight: 400,
  lineHeight: 1.6,
  color: C.body,
});

export const labelStyle = () => ({
  fontFamily: 'var(--sans)',
  fontSize: '13px',
  fontWeight: 500,
  color: C.body,
});

export const captionStyle = () => ({
  fontFamily: 'var(--sans)',
  fontSize: '12px',
  color: C.muted,
});

export const numericStyle = () => ({
  fontVariantNumeric: 'tabular-nums' as const,
  fontFamily: 'var(--sans)',
});

// ─── Label Component ───
export interface LabelProps {
  children: React.ReactNode;
  unit?: string;
  htmlFor?: string;
  className?: string;
  style?: React.CSSProperties;
}
export function Label({ children, unit, htmlFor, className, style }: LabelProps) {
  return (
    <label htmlFor={htmlFor} className={className} style={{ ...labelStyle(), ...style }}>
      {children}
      {unit && <span style={{ ...captionStyle(), marginLeft: 6 }}>{unit}</span>}
    </label>
  );
}

// ─── Input Component ───
export interface InpProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  readonly?: boolean;
}
export function Inp({ error, readonly, className, style, ...props }: InpProps) {
  return (
    <input
      className={className}
      style={{
        width: '100%',
        fontFamily: 'var(--sans)',
        fontSize: 14,
        fontWeight: 400,
        lineHeight: 1.5,
        color: C.body,
        background: readonly ? C.lighter : '#fff',
        border: `1px solid ${error ? C.danger : C.line}`,
        borderRadius: 8,
        padding: '10px 12px',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        ...style,
      }}
      readOnly={readonly}
      onFocus={(e) => {
        const target = e.currentTarget;
        if (!error && !readonly) {
          target.style.borderColor = C.info;
          target.style.boxShadow = '0 0 0 3px rgba(0,185,240,0.2)';
        }
      }}
      onBlur={(e) => {
        const target = e.currentTarget;
        if (!error && !readonly) {
          target.style.borderColor = C.line;
          target.style.boxShadow = 'none';
        }
      }}
      {...props}
    />
  );
}

// ─── Select Component ───
export interface SelProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string; disabled?: boolean }[];
  error?: boolean;
}
export function Sel({ options, error, className, style, ...props }: SelProps) {
  return (
    <select
      className={className}
      style={{
        width: '100%',
        fontFamily: 'var(--sans)',
        fontSize: 14,
        fontWeight: 400,
        lineHeight: 1.5,
        color: C.body,
        background: '#fff',
        border: `1px solid ${error ? C.danger : C.line}`,
        borderRadius: 8,
        padding: '10px 12px',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        appearance: 'none',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23555' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        paddingRight: 40,
        ...style,
      }}
      onFocus={(e) => {
        if (!error) {
          e.currentTarget.style.borderColor = C.info;
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,185,240,0.2)';
        }
      }}
      onBlur={(e) => {
        if (!error) {
          e.currentTarget.style.borderColor = C.line;
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
      {...props}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} disabled={o.disabled}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ─── Card Component ───
export interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
export function Card({ children, className, style }: CardProps) {
  return (
    <div
      className={className}
      style={{
        background: '#fff',
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        boxShadow: '0 2px 6px rgba(17,17,17,0.12)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Section Title with Icon ───
export interface SecTitleProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
export function SecTitle({ children, icon, className, style }: SecTitleProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 10,
        marginBottom: 16,
        ...style,
      }}
    >
      {icon && <span style={{ display: 'flex', color: C.heading }}>{icon}</span>}
      <div
        style={{
          fontFamily: 'var(--display)',
          fontSize: 20,
          fontWeight: 600,
          lineHeight: 1.4,
          color: C.heading,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Pill (Metric Display) ───
export interface PillProps {
  val: string | number;
  label: string;
  unit?: string;
  accent?: string;
  className?: string;
  style?: React.CSSProperties;
}
export function Pill({ val, label, unit, accent, className, style }: PillProps) {
  const isAccent = !!accent;
  return (
    <div
      className={className}
      style={{
        background: C.lighter,
        border: `1px solid ${isAccent ? accent : C.line}`,
        borderRadius: 8,
        padding: '10px 14px',
        textAlign: 'center',
        minWidth: 80,
        ...style,
      }}
    >
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: isAccent ? accent : C.heading,
          fontVariantNumeric: 'tabular-nums',
          fontFamily: 'var(--sans)',
        }}
      >
        {val}{unit && <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 2 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}

// ─── Toggle Component ───
export interface TogProps {
  on: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}
export function Tog({ on, onChange, label, disabled, className, style, id }: TogProps) {
  const switchId = id || `tog-${React.useId()}`;
  const labelId = label ? `${switchId}-label` : undefined;
  return (
    <label
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={labelId}
        disabled={disabled}
        onClick={() => !disabled && onChange(!on)}
        style={{
          position: 'relative',
          width: 44,
          height: 24,
          borderRadius: 999,
          border: `1px solid ${on ? C.accent : C.line}`,
          background: on ? C.accent : C.lighter,
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s, border-color 0.15s',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 1,
            left: on ? 21 : 1,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transition: 'transform 0.15s, left 0.15s',
          }}
        />
      </button>
      {label && <span id={labelId} style={{ fontFamily: 'var(--sans)', fontSize: 14, color: C.body }}>{label}</span>}
    </label>
  );
}

// ─── Percentage Input (PctInp) ───
export interface PctInpProps {
  value: number;
  onChange: (v: number) => void;
  label: string;
  className?: string;
  style?: React.CSSProperties;
}
export function PctInp({ value, onChange, label, className, style }: PctInpProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = parseFloat(e.target.value.replace(',', '.'));
    if (isNaN(v)) v = 0;
    v = Math.max(0, Math.min(100, v));
    onChange(v / 100);
  };
  const displayValue = (value * 100).toFixed(1).replace('.', ',');
  return (
    <div className={className} style={style}>
      <Label>{label}</Label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Inp
          type="text"
          value={displayValue}
          onChange={handleChange}
          style={{ width: 100, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
          inputMode="decimal"
        />
        <span style={{ fontSize: 14, color: C.muted }}>%</span>
      </div>
    </div>
  );
}

// ─── Button Variants ───
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gradient' | 'dark' | 'ghost' | 'ghost-filled';
  size?: 'default' | 'sm';
  loading?: boolean;
}
export function Button({
  children,
  variant = 'primary',
  size = 'default',
  loading,
  disabled,
  className,
  style,
  ...props
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontFamily: 'var(--sans)',
    fontWeight: 600,
    lineHeight: 1.2,
    border: 0,
    borderRadius: 15,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.18s, transform 0.1s',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    opacity: disabled || loading ? 0.6 : 1,
    ...style,
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      fontSize: size === 'sm' ? 13 : 14,
      padding: size === 'sm' ? '8px 16px' : '13px 30px',
      borderRadius: size === 'sm' ? 10 : 15,
      background: C.cta,
      color: C.ctaText,
    },
    secondary: {
      fontSize: size === 'sm' ? 13 : 14,
      padding: size === 'sm' ? '8px 16px' : '13px 30px',
      borderRadius: size === 'sm' ? 10 : 15,
      background: C.success,
      color: '#fff',
    },
    gradient: {
      fontSize: size === 'sm' ? 14 : 15,
      padding: size === 'sm' ? '10px 20px' : '13px 28px',
      borderRadius: 12,
      background: 'linear-gradient(90deg, var(--heading), var(--accent))',
      color: '#fff',
      boxShadow: '0 2px 6px rgba(17,17,17,0.12)',
    },
    dark: {
      fontSize: size === 'sm' ? 13 : 14,
      padding: size === 'sm' ? '7px 16px' : '9px 20px',
      borderRadius: 10,
      background: C.charcoal,
      color: '#fff',
    },
    ghost: {
      fontSize: size === 'sm' ? 13 : 17,
      padding: size === 'sm' ? '6px 16px' : '7px 26px',
      borderRadius: 999,
      background: 'transparent',
      color: C.heading,
      border: '1.5px solid var(--heading)',
    },
    'ghost-filled': {
      fontSize: size === 'sm' ? 13 : 17,
      padding: size === 'sm' ? '6px 16px' : '7px 26px',
      borderRadius: 999,
      background: 'var(--heading)',
      color: '#fff',
      border: '1.5px solid var(--heading)',
    },
  };

  const hoverStyles: Record<string, React.CSSProperties> = {
    primary: { background: C.ctaHover },
    secondary: { background: C.brandDeep },
    gradient: { filter: 'brightness(1.07)' },
    dark: { filter: 'brightness(1.25)' },
    ghost: { background: C.lighter },
    'ghost-filled': { background: C.brandDark },
  };

  const mergedStyle = { ...baseStyle, ...variants[variant] };

  return (
    <button
      className={className}
      style={mergedStyle}
      disabled={disabled || loading}
      onMouseEnter={(e) => {
        if (!disabled && !loading) Object.assign(e.currentTarget.style, hoverStyles[variant]);
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) Object.assign(e.currentTarget.style, variants[variant]);
      }}
      onMouseDown={(e) => {
        if (!disabled && !loading) e.currentTarget.style.transform = 'translateY(1px)';
      }}
      onMouseUp={(e) => {
        if (!disabled && !loading) e.currentTarget.style.transform = 'translateY(0)';
      }}
      {...props}
    >
      {loading && <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>}
      {children}
    </button>
  );
}

// ─── Badge Component ───
export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'danger' | 'dark';
  size?: 'default' | 'sm';
  className?: string;
  style?: React.CSSProperties;
}
export function Badge({ children, variant = 'info', size = 'default', className, style }: BadgeProps) {
  const variants: Record<string, React.CSSProperties> = {
    info: { background: C.info, color: C.inkKontras },
    success: { background: 'linear-gradient(90deg, var(--accent), var(--accent-light))', color: C.onAccent, fontWeight: 600 },
    warning: { background: C.warningBg, border: `1px solid ${C.warningLine}`, color: C.warningInk },
    danger: { background: C.lighter, border: `1px solid ${C.danger}`, color: C.danger },
    dark: { background: C.charcoal, color: '#fff', fontWeight: 600 },
  };
  const sizes = {
    default: { fontSize: 14, padding: '8px 12px', borderRadius: 10 },
    sm: { fontSize: 12, padding: '4px 10px', borderRadius: 8 },
  };
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: 'var(--sans)',
        fontWeight: 500,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        ...sizes[size],
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// Need to export inkKontras for Badge
const C_with_ink = C as typeof C & { inkKontras: string };
(C_with_ink as any).inkKontras = '#111';

// ─── Table Components ───
export interface TableProps {
  children: React.ReactNode;
  caption?: string;
  className?: string;
  style?: React.CSSProperties;
}
export function Table({ children, caption, className, style }: TableProps) {
  return (
    <div className={className} style={{ overflowX: 'auto', ...style }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, color: C.body }}>
        {caption && <caption style={{ ...captionStyle(), textAlign: 'left', paddingBottom: 8 }}>{caption}</caption>}
        {children}
      </table>
    </div>
  );
}

export function Thead({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <thead className={className} style={style}>{children}</thead>;
}

export function Tbody({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <tbody className={className} style={style}>{children}</tbody>;
}

export function Tr({ children, className, style, hover = true }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; hover?: boolean }) {
  return (
    <tr
      className={className}
      style={{
        ...style,
        ...(hover && { '&:hover td': { background: C.lighter } }),
      }}
    >
      {children}
    </tr>
  );
}

export function Th({ children, className, style, numeric = false, scope = 'col' }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; numeric?: boolean; scope?: 'col' | 'row' | 'colgroup' | 'rowgroup' }) {
  return (
    <th
      scope={scope}
      className={className}
      style={{
        fontFamily: 'var(--sans)',
        fontWeight: 600,
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: C.muted,
        textAlign: numeric ? 'right' : 'left',
        padding: '10px 12px',
        borderBottom: `1.5px solid ${C.heading}`,
        ...style,
      }}
    >
      {children}
    </th>
  );
}

export function Td({ children, className, style, numeric = false, readonly = false }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; numeric?: boolean; readonly?: boolean }) {
  return (
    <td
      className={className}
      style={{
        padding: '10px 12px',
        borderBottom: `1px solid ${C.line}`,
        verticalAlign: 'middle',
        textAlign: numeric ? 'right' : 'left',
        fontVariantNumeric: numeric ? 'tabular-nums' : 'normal',
        background: readonly ? C.lighter : 'transparent',
        color: readonly ? C.muted : C.body,
        ...style,
      }}
    >
      {children}
    </td>
  );
}

// ─── Progress Bar ───
export interface ProgressProps {
  value: number; // 0-100
  variant?: 'primary' | 'teal' | 'blue' | 'orange';
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}
export function Progress({ value, variant = 'primary', height = 8, className, style }: ProgressProps) {
  const variants = {
    primary: C.accent,
    teal: C.heading,
    blue: C.info,
    orange: C.cta,
  };
  return (
    <div
      className={className}
      style={{
        height,
        background: C.lighter,
        borderRadius: 6,
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: variants[variant],
          borderRadius: 6,
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  );
}

// ─── AutoPill (Auto-fill toggle) ───
export interface AutoPillProps {
  on: boolean;
  onToggle: () => void;
  title: string;
  className?: string;
  style?: React.CSSProperties;
}
export function AutoPill({ on, onToggle, title, className, style }: AutoPillProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={title}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: '2px 7px',
        borderRadius: 20,
        border: `1px solid ${on ? C.heading : C.line}`,
        background: on ? 'rgba(53,79,69,0.08)' : 'transparent',
        color: on ? C.heading : C.muted,
        fontSize: 9,
        fontWeight: 700,
        fontFamily: 'inherit',
        cursor: 'pointer',
        transition: '0.15s',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <span style={{ display: 'inline-block' }}>⚡</span> Auto
    </button>
  );
}

// ─── ReadOnly Display (for computed values in tables) ───
export interface ReadOnlyProps {
  val: number;
  decimals?: number;
  className?: string;
  style?: React.CSSProperties;
}
export function ReadOnly({ val, decimals = 3, className, style }: ReadOnlyProps) {
  return (
    <div
      className={className}
      style={{
        padding: '7px 10px',
        background: C.lighter,
        borderRadius: 8,
        fontSize: 13,
        color: C.muted,
        fontVariantNumeric: 'tabular-nums',
        fontFamily: 'var(--sans)',
        ...style,
      }}
    >
      {fmtFixed(val, decimals)}
    </div>
  );
}

// ─── Icon Ghost Button (for delete actions) ───
export interface IconGhostProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}
export function IconGhost({ children, className, style, ...props }: IconGhostProps) {
  return (
    <button
      type="button"
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: 8,
        background: 'transparent',
        border: 'none',
        color: C.muted,
        cursor: 'pointer',
        transition: 'background 0.15s, color 0.15s',
        ...style,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = C.lighter; e.currentTarget.style.color = C.danger; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted; }}
      {...props}
    >
      {children}
    </button>
  );
}

// ============================================================================
// PHASE 2: NEW ATOM COMPONENTS
// ============================================================================

// ─── NumberControl (with +/- buttons, step=0.001) ───
export interface NumberControlProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
  id?: string;
}
export function NumberControl({
  value,
  onChange,
  min = 0,
  max = 1000000,
  step = 0.001,
  decimals = 3,
  disabled = false,
  className,
  style,
  label,
  id,
}: NumberControlProps) {
  const inputId = id || `numctrl-${React.useId()}`;
  const labelId = label ? `${inputId}-label` : undefined;
  const [draft, setDraft] = React.useState<string | null>(null);

  const format = (v: number) => (Number.isFinite(v) ? v.toFixed(decimals).replace('.', ',') : '');

  const commit = (raw: string) => {
    const parsed = parseFloat(raw.replace(',', '.'));
    if (!Number.isFinite(parsed)) return;
    onChange(parseFloat(Math.max(min, Math.min(max, parsed)).toFixed(decimals)));
  };

  const handleDecrement = () => {
    if (disabled) return;
    setDraft(null);
    onChange(Math.max(min, parseFloat((value - step).toFixed(decimals))));
  };
  const handleIncrement = () => {
    if (disabled) return;
    setDraft(null);
    onChange(Math.min(max, parseFloat((value + step).toFixed(decimals))));
  };
  
  return (
    <div
      className={`number-control ${className || ''}`}
      style={{ ...style }}
      role="group"
      aria-labelledby={labelId}
    >
      {label && (
        <label id={labelId} htmlFor={inputId} style={{ ...labelStyle(), marginBottom: 0, marginRight: 8, whiteSpace: 'nowrap' }}>
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        aria-label="Kurangi"
        aria-disabled={disabled || value <= min}
      >
        −
      </button>
      <input
        id={inputId}
        type="text"
        value={draft ?? format(value)}
        onFocus={() => setDraft(value === 0 ? '' : format(value))}
        onChange={(e) => {
          const raw = e.currentTarget.value;
          setDraft(raw);
          commit(raw);
        }}
        onBlur={(e) => {
          commit(e.currentTarget.value);
          setDraft(null);
        }}
        disabled={disabled}
        inputMode="decimal"
        style={{ width: 100, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        aria-label="Tambah"
        aria-disabled={disabled || value >= max}
      >
        +
      </button>
    </div>
  );
}

// ─── NumField (free-typing numeric input, optional display scale) ───
export interface NumFieldProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Display multiplier, e.g. 100 to edit a 0–1 fraction as a percentage. */
  scale?: number;
  integer?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
}

/**
 * Keeps whatever the user types on screen until blur, instead of re-formatting
 * on every keystroke (which made values like 0,55 or 1500 impossible to enter).
 */
export function NumField({
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  scale = 1,
  integer = false,
  disabled,
  readOnly,
  placeholder,
  className,
  style,
  'aria-label': ariaLabel,
}: NumFieldProps) {
  const [draft, setDraft] = React.useState<string | null>(null);

  const format = (v: number) =>
    v === 0 ? '' : String(Number((v * scale).toFixed(6))).replace('.', ',');

  const commit = (raw: string) => {
    const parsed = parseFloat(raw.replace(',', '.').trim());
    if (!Number.isFinite(parsed)) return;
    let next = parsed / scale;
    next = Math.max(min, Math.min(max, next));
    onChange(integer ? Math.round(next) : next);
  };

  return (
    <Inp
      type="text"
      inputMode="decimal"
      value={draft ?? format(value)}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      className={className}
      style={{ width: '100%', textAlign: 'center', fontVariantNumeric: 'tabular-nums', ...style }}
      aria-label={ariaLabel}
      onFocus={() => setDraft(format(value))}
      onChange={(e) => {
        const raw = e.currentTarget.value;
        setDraft(raw);
        commit(raw);
      }}
      onBlur={(e) => {
        commit(e.currentTarget.value);
        setDraft(null);
      }}
    />
  );
}

// ─── SegmentedControl ───
export interface SegmentedControlProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
}
export function SegmentedControl({
  value,
  onChange,
  options,
  className,
  style,
  'aria-label': ariaLabel,
}: SegmentedControlProps) {
  return (
    <div
      className={`segmented-control ${className || ''}`}
      style={style}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '8px 16px',
            border: 'none',
            background: 'transparent',
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--sans)',
            fontSize: 13,
            fontWeight: 500,
            color: value === opt.value ? 'var(--heading)' : 'var(--muted)',
            cursor: 'pointer',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
            boxShadow: value === opt.value ? 'var(--shadow-soft)' : 'none',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── RadioCard ───
export interface RadioCardOption {
  value: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}
export interface RadioCardProps {
  value: string;
  onChange: (v: string) => void;
  options: RadioCardOption[];
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
}
export function RadioCard({
  value,
  onChange,
  options,
  className,
  style,
  'aria-label': ariaLabel,
}: RadioCardProps) {
  return (
    <div
      className={className}
      style={style}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {options.map(opt => (
        <label
          key={opt.value}
          className="radio-card"
          style={{ display: 'block', marginBottom: 8 }}
        >
          <input
            type="radio"
            name={ariaLabel || 'radio-card-group'}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          <span className="radio-card-label" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            padding: '16px',
            border: `1px solid ${value === opt.value ? 'var(--green)' : 'var(--line)'}`,
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
            transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
            background: value === opt.value ? '#f0f5f0' : '#fff',
            boxShadow: value === opt.value ? '0 0 0 1px var(--green)' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="radio-dot" style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 20,
                height: 20,
                border: `2px solid ${value === opt.value ? 'var(--green)' : 'var(--line)'}`,
                borderRadius: '50%',
                background: '#fff',
                transition: 'all 0.15s',
                position: 'relative',
              }}>
                {value === opt.value && (
                  <span style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: 'var(--green)',
                    display: 'block',
                  }} />
                )}
              </span>
              <div style={{ flex: 1 }}>
                <div className="radio-card-title" style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: 'var(--heading)',
                }}>
                  {opt.title}
                </div>
                {opt.subtitle && (
                  <div className="radio-card-subtitle" style={{
                    fontSize: 12,
                    color: 'var(--muted)',
                  }}>
                    {opt.subtitle}
                  </div>
                )}
              </div>
              {opt.icon && <span style={{ color: 'var(--green)' }}>{opt.icon}</span>}
            </div>
          </span>
        </label>
      ))}
    </div>
  );
}

// ─── DetailCard (structured card with header/body/footer) ───
export interface DetailCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
export function DetailCard({
  title,
  subtitle,
  icon,
  children,
  footer,
  className,
  style,
}: DetailCardProps) {
  return (
    <div className={`detail-card ${className || ''}`} style={style}>
      <div className="detail-card-header">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          {icon && <span style={{ display: 'flex', color: 'var(--heading)' }}>{icon}</span>}
          <div>
            <h3 style={{ margin: 0, fontFamily: 'var(--display)', fontSize: 20, fontWeight: 600, lineHeight: 1.4, color: 'var(--heading)' }}>
              {title}
            </h3>
            {subtitle && <div className="subtitle" style={{ marginTop: 4, fontSize: 13, color: 'var(--muted)' }}>{subtitle}</div>}
          </div>
        </div>
      </div>
      <div className="detail-card-body">{children}</div>
      {footer && <div className="detail-card-footer">{footer}</div>}
    </div>
  );
}

// ─── MeasureTrack (slider-like track with thumb for visual input) ───
export interface MeasureTrackProps {
  value: number; // 0-100
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  variant?: 'primary' | 'teal' | 'blue' | 'orange';
  showValue?: boolean;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
}
export function MeasureTrack({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  variant = 'primary',
  showValue = true,
  className,
  style,
  'aria-label': ariaLabel,
}: MeasureTrackProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const variants = {
    primary: 'var(--accent)',
    teal: 'var(--heading)',
    blue: 'var(--blue)',
    orange: 'var(--orange)',
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    const track = trackRef.current;
    if (!track) return;
    
    const updateValue = (clientX: number) => {
      const rect = track.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newValue = Math.round(min + percent * (max - min));
      const steppedValue = Math.round(newValue / step) * step;
      onChange(Math.max(min, Math.min(max, steppedValue)));
    };
    
    updateValue(e.clientX);
    
    const handleMove = (moveEvent: MouseEvent) => {
      updateValue(moveEvent.clientX);
    };
    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    let newValue = value;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      newValue = Math.min(max, value + step);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      newValue = Math.max(min, value - step);
    } else if (e.key === 'Home') {
      e.preventDefault();
      newValue = min;
    } else if (e.key === 'End') {
      e.preventDefault();
      newValue = max;
    }
    if (newValue !== value) onChange(newValue);
  };
  
  const percent = ((value - min) / (max - min)) * 100;
  
  return (
    <div
      ref={trackRef}
      className={`measure-track ${className || ''}`}
      style={style}
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      tabIndex={0}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
    >
      <div
        className="measure-track-fill"
        style={{
          width: `${percent}%`,
          background: variants[variant],
        }}
      />
      <div className="measure-track-thumb" style={{ left: `${percent}%` }} />
      {showValue && (
        <div className="measure-track-value" style={{ left: `${percent}%` }}>
          {value.toFixed(1).replace('.', ',')}
        </div>
      )}
    </div>
  );
}

// ─── AutoPill re-export from above (already exists) ───

// ─── ReadOnly re-export from above (already exists) ───