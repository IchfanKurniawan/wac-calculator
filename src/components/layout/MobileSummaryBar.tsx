import React from 'react';

interface MobileSummaryBarProps {
  currentStep: number;
  totalSteps: number;
  wac1Result?: { savingsPct: number; pts: number } | null;
  wac2Result?: { pct: number; pts: number } | null;
  onCalculate: () => void;
  onNextStep: () => void;
  isLastStep: boolean;
}

export function MobileSummaryBar({
  currentStep,
  totalSteps,
  wac1Result,
  wac2Result,
  onCalculate,
  onNextStep,
  isLastStep,
}: MobileSummaryBarProps) {
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div
      className="mobile-summary"
      style={{
        position: 'fixed',
        zIndex: 12,
        left: 12,
        right: 12,
        bottom: 'max(12px, env(safe-area-inset-bottom))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '11px 12px 11px 15px',
        borderRadius: 13,
        background: '#102f27',
        color: '#fff',
        boxShadow: '0 10px 30px #081f1947',
      }}
      role="status"
      aria-live="polite"
      aria-label="Ringkasan kemajuan"
    >
      {/* Progress indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <div style={{ flex: 1, height: 4, background: '#45685c', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'var(--blue)',
              borderRadius: 2,
              transition: 'width 0.3s ease-out',
            }}
          />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#a9c0b5', whiteSpace: 'nowrap' }}>
          {Math.round(progress)}%
        </span>
      </div>

      {/* Key metrics preview */}
      {(wac1Result || wac2Result) && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {wac1Result && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <small style={{ color: '#a9c0b5', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Hemat WAC 1
              </small>
              <b style={{ fontSize: 14, marginTop: 2, fontFamily: 'var(--display)' }}>
                {wac1Result.savingsPct.toFixed(1)}%
              </b>
            </div>
          )}
          {wac2Result && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <small style={{ color: '#a9c0b5', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Poin WAC 2
              </small>
              <b style={{ fontSize: 14, marginTop: 2, fontFamily: 'var(--display)' }}>
                {wac2Result.pts}
              </b>
            </div>
          )}
        </div>
      )}

      {/* Primary action — always available; steps are never gated */}
      <button
        onClick={isLastStep ? onCalculate : onNextStep}
        style={{
          color: 'var(--dark)',
          background: '#fff',
          textDecoration: 'none',
          fontSize: 12,
          fontWeight: 750,
          fontFamily: 'var(--sans)',
          padding: '10px 12px',
          borderRadius: 9,
          border: 0,
          cursor: isLastStep ? 'default' : 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {isLastStep ? 'Lihat Hasil' : 'Lanjut'}
      </button>
    </div>
  );
}
