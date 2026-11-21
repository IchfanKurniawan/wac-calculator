import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { Header } from './Header';
import { SideRail } from './SideRail';
import { MobileSummaryBar } from './MobileSummaryBar';
import { STEPS } from '../../App';
import { Button } from '../shared/atoms';

interface AppShellProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  children: React.ReactNode;
  wac1Result?: { savingsPct: number; pts: number } | null;
  wac2Result?: { pct: number; pts: number } | null;
  issueCount: number;
  schemeId: string;
  schemeLabel: string;
  onSchemeChange: (scheme: string) => void;
  onUndo: () => void;
  canUndo: boolean;
  savedAt: number | null;
  onImport: () => void;
  onExport: () => void;
}

// ─── Explicit Kembali / Lanjut navigation (all breakpoints) ───
function StepNav({
  currentStep,
  onStepChange,
  issueCount,
  canUndo,
  onUndo,
  savedAt,
}: {
  currentStep: number;
  onStepChange: (step: number) => void;
  issueCount: number;
  canUndo: boolean;
  onUndo: () => void;
  savedAt: number | null;
}) {
  const isFirst = currentStep <= 1;
  const isLast = currentStep >= STEPS.length;

  return (
    <nav
      className="step-nav"
      aria-label="Navigasi langkah"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 32,
        paddingTop: 20,
        borderTop: '1px solid var(--line)',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onStepChange(currentStep - 1)}
          disabled={isFirst}
          aria-label="Langkah sebelumnya"
        >
          <ChevronLeft size={15} /> Kembali
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Urungkan perubahan terakhir"
          title={canUndo ? 'Urungkan perubahan terakhir' : 'Belum ada perubahan untuk diurungkan'}
        >
          <RotateCcw size={14} /> Urungkan
        </Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <span style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--muted)' }}>
          Langkah {currentStep} dari {STEPS.length}
        </span>
        {savedAt !== null && (
          <span
            style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--muted)', opacity: 0.8 }}
            title={`Terakhir disimpan ${new Date(savedAt).toLocaleString('id-ID')}`}
          >
            Tersimpan otomatis
          </span>
        )}
      </div>

      {isLast ? (
        <span
          style={{
            fontFamily: 'var(--sans)',
            fontSize: 12,
            fontWeight: 600,
            color: issueCount === 0 ? 'var(--green)' : '#8A4B00',
          }}
        >
          {issueCount === 0 ? '✓ Data lengkap' : `⚠ ${issueCount} hal perlu dilengkapi`}
        </span>
      ) : (
        <Button
          variant="primary"
          size="sm"
          onClick={() => onStepChange(currentStep + 1)}
          aria-label={`Lanjut ke ${STEPS[currentStep].label}`}
        >
          Lanjut: {STEPS[currentStep].label} <ChevronRight size={15} />
        </Button>
      )}
    </nav>
  );
}

export function AppShell({
  currentStep,
  onStepChange,
  children,
  wac1Result,
  wac2Result,
  issueCount,
  schemeId,
  schemeLabel,
  onSchemeChange,
  onUndo,
  canUndo,
  savedAt,
  onImport,
  onExport,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Track mobile breakpoint
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleStepChange = useCallback((step: number) => {
    const next = Math.max(1, Math.min(STEPS.length, step));
    onStepChange(next);
    if (isMobile) setSidebarOpen(false);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [onStepChange, isMobile]);

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const isLastStep = currentStep === STEPS.length;

  return (
    <div
      className="calculator-shell"
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'var(--rail-w) 1fr',
        minHeight: 'calc(100vh - var(--hdr-h))',
      }}
    >
      {/* Fixed Header — simplified: brand + scheme selector + hamburger only */}
      <Header
        onMenuClick={handleSidebarToggle}
        schemeLabel={schemeLabel}
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        onSidebarToggle={handleSidebarToggle}
        currentScheme={schemeId}
        onSchemeChange={onSchemeChange}
        onImport={onImport}
        onExport={onExport}
      />

      {/* Side Rail (Desktop) — permanent, navigation only */}
      {!isMobile && (
        <SideRail
          currentStep={currentStep}
          onStepChange={handleStepChange}
          onClose={() => {}}
          isOpen={true}
          overlay={false}
        />
      )}

      {/* Mobile Side Rail — drawer overlay */}
      {isMobile && (
        <SideRail
          currentStep={currentStep}
          onStepChange={handleStepChange}
          onClose={() => setSidebarOpen(false)}
          isOpen={sidebarOpen}
          overlay={true}
        />
      )}

      {/* Main Content Area — always the content column, never the rail column */}
      <main
        className="calculator-main"
        role="main"
        style={{
          gridColumn: isMobile ? '1 / -1' : '2 / 3',
          minWidth: 0,
          padding: isMobile ? '20px 16px 150px' : '48px 50px 96px',
          paddingTop: isMobile ? 'calc(var(--hdr-h) + 20px)' : 'calc(var(--hdr-h) + 48px)',
        }}
      >
        {children}
        <StepNav
          currentStep={currentStep}
          onStepChange={handleStepChange}
          issueCount={issueCount}
          canUndo={canUndo}
          onUndo={onUndo}
          savedAt={savedAt}
        />
      </main>

      {/* Mobile Summary Bar — progress + metrics + primary action */}
      {isMobile && (
        <MobileSummaryBar
          currentStep={currentStep}
          totalSteps={STEPS.length}
          wac1Result={wac1Result}
          wac2Result={wac2Result}
          onCalculate={() => handleStepChange(STEPS.length)}
          onNextStep={() => handleStepChange(currentStep + 1)}
          isLastStep={isLastStep}
        />
      )}
    </div>
  );
}
