import React, { useEffect, useRef } from 'react';
import { ChevronRight, Building2, Droplets, Leaf, CloudRain, Scale, BarChart3 } from 'lucide-react';
import { STEPS } from '../../App';
import { C } from '../../components/shared/tokens';

type StepDef = (typeof STEPS)[number];

interface SideRailProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  onClose: () => void;
  isOpen: boolean;
  /** Mobile drawer mode. On desktop the rail is permanent and must not render a click-blocking scrim. */
  overlay?: boolean;
}

const STEP_ICONS: Record<number, React.ReactNode> = {
  1: <Building2 size={16} />,
  2: <Droplets size={16} />,
  3: <Leaf size={16} />,
  4: <CloudRain size={16} />,
  5: <Scale size={16} />,
  6: <BarChart3 size={16} />,
};

const SECTIONS = [
  { title: 'BANGUNAN', steps: [1] },
  { title: 'AIR DALAM', steps: [2] },
  { title: 'LUAR & SISTEM', steps: [3, 4] },
  { title: 'NERACA & HASIL', steps: [5, 6] },
];

export function SideRail({
  currentStep,
  onStepChange,
  onClose,
  isOpen,
  overlay = false,
}: SideRailProps) {
  const railRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && overlay) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, overlay, onClose]);

  // Focus trap for mobile drawer
  useEffect(() => {
    if (!overlay || !isOpen) return;
    const el = railRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    function trap(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
    el.addEventListener('keydown', trap);
    return () => el.removeEventListener('keydown', trap);
  }, [isOpen, overlay]);

  const rail = (
    <nav ref={railRef} aria-label="Navigasi langkah kalkulasi" style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto' }}>
      {SECTIONS.map((section) => (
        <div key={section.title} style={{ marginBottom: section.steps[section.steps.length - 1] === 6 ? 0 : 16 }}>
          <div style={{
            fontFamily: 'var(--sans)',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: C.muted,
            padding: '0 4px',
            marginBottom: 8,
          }}>
            {section.title}
          </div>
          {section.steps.map((stepId) => {
            const step = STEPS.find(s => s.id === stepId);
            if (!step) return null;
            const active = currentStep === stepId;
            const done = currentStep > stepId;
            const Ic = step.icon;

            return (
              <button
                key={stepId}
                onClick={() => { onStepChange(stepId); if (overlay) onClose(); }}
                type="button"
                aria-current={active ? 'step' : undefined}
                aria-label={active ? `${step.label}, langkah aktif` : done ? `${step.label}, selesai` : step.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: 'none',
                  background: active ? C.brandBg : 'transparent',
                  color: active ? C.brand : done ? C.muted : C.body,
                  fontFamily: 'var(--sans)',
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = C.lighter;
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: active ? C.brand : done ? 'transparent' : C.line,
                  color: active ? '#fff' : done ? C.muted : C.muted,
                  fontFamily: 'var(--display)',
                  fontSize: 12,
                  fontWeight: 700,
                  border: done ? `1px solid ${C.line}` : 'none',
                }}>
                  {stepId}
                </div>
                <Ic size={16} style={{ color: active ? C.brand : done ? C.muted : C.muted, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{step.label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );

  if (overlay) {
    if (!isOpen) return null;
    return (
      <>
        <button
          aria-label="Tutup navigasi"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 35,
            border: 'none',
          }}
          onClick={onClose}
          type="button"
        />
        <div
          ref={railRef}
          style={{
            position: 'fixed',
            top: 'var(--hdr-h)',
            left: 0,
            bottom: 0,
            width: 280,
            background: C.card,
            borderRight: `1px solid ${C.line}`,
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column',
            padding: '20px 16px',
            boxShadow: '4px 0 24px rgba(17,17,17,0.12)',
          }}
        >
          {rail}
        </div>
      </>
    );
  }

  // Desktop: permanent rail
  return (
    <aside
      aria-label="Navigasi langkah"
      style={{
        position: 'fixed',
        top: 'var(--hdr-h)',
        left: 0,
        bottom: 0,
        width: 'var(--rail-w)',
        background: C.card,
        borderRight: `1px solid ${C.line}`,
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 16px',
      }}
    >
      {rail}
    </aside>
  );
}