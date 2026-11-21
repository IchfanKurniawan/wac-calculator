import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Building2, Droplets, Leaf, CloudRain, Scale,
  BarChart3, ChevronRight, ChevronLeft, Award,
  Download, Upload, AlertCircle, CheckCircle2, X,
  Plus, Trash2, Menu, Link2, Zap, AlertTriangle,
} from 'lucide-react';
// Charts are only used on the results step — keep recharts out of the first paint.
const WacComparisonChart = React.lazy(() => import('./components/shared/WacComparisonChart'));

import type {
  AppState, FixtureTypeId, TypologyId, WBSourceId, WBUseId,
  BuildingData, FixtureGroup, FixtureProduct, LandscapeZone,
} from './types';
import { WB_SOURCE_IDS, WB_USE_IDS } from './types';
import { TYPOLOGY_CONFIG } from './constants/typologies';
import { FIXTURE_BASELINES, FIXTURE_AVAILABILITY } from './constants/baselines';
import {
  LANDSCAPE_BASELINE_RATE, LANDSCAPE_MAX_ZONES,
  landscapeShareSum, landscapeSharePct, isLandscapeShareExact,
} from './constants/landscape';
import {
  calcAll, calcWAC2,
  calcRainwater, computeSourceAvailable, computeUseRequired,
} from './engine/calculations';
import { downloadJSON, pickJSONFile, parseAndValidate } from './utils/importExport';
import { createDefaultState, mkFixtureGroup, mkProd, mkWBScenario } from './utils/defaults';
import {
  fmt, fmtFixed, fmtPct,
  Label, Inp, Sel, Card, SecTitle, Pill, Tog, PctInp, Button, Badge, Table, Th, Td, Tr, Thead, Tbody, Progress, AutoPill, ReadOnly, IconGhost,
  eyebrowStyle,
  // Phase 2 new atoms
  NumberControl, NumField, SegmentedControl, RadioCard, DetailCard, MeasureTrack,
} from './components/shared/atoms';
import { C } from './components/shared/tokens';
import { FixtureSection } from './components/shared/FixtureSection';
import { AppShell } from './components/layout/AppShell';
// ProjectToolbar removed - single project mode
import { collectIssues } from './engine/validation';
import type { ValidationIssue } from './engine/validation';
import { buildWhatIf } from './engine/whatIf';
// Single project mode - no project management

// ─── Breakpoint Hook ───
function useBreakpoint() {
  const [width, setWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return {
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
  };
}

// ─── Step Definitions ───
export const STEPS = [
  { id: 1, label: 'Data Bangunan', short: 'Data', icon: Building2 },
  { id: 2, label: 'Fitur Air (WAC 2)', short: 'Fitur', icon: Droplets },
  { id: 3, label: 'Lansekap & CT', short: 'Lansekap', icon: Leaf },
  { id: 4, label: 'Air Hujan', short: 'Hujan', icon: CloudRain },
  { id: 5, label: 'Neraca Air', short: 'Neraca', icon: Scale },
  { id: 6, label: 'Hasil WAC', short: 'Hasil', icon: BarChart3 },
];

// ─── Helper Components ───
function StatusChip({ label, good }: { label: string; good: boolean }) {
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 700,
      padding: '2px 8px',
      borderRadius: 20,
      background: good ? C.successBg : C.dangerBg,
      color: good ? C.successInk : C.dangerInk,
      border: `1px solid ${good ? C.successLine : C.dangerLine}`,
    }}>
      {good ? '✓ ' : '✕ '}{label}
    </span>
  );
}

// Replacement components using DetailCard (from atoms)
function StepCard({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <DetailCard title="" footer={null} className={className} style={{ ...style, border: `1px solid ${C.line}`, borderRadius: 12, boxShadow: '0 2px 6px rgba(17,17,17,0.12)', overflow: 'hidden' }}>{children}</DetailCard>;
}

function StepCardHeader({ title, icon, subtitle }: { title: string; icon?: React.ReactNode; subtitle?: string }) {
  return (
    <div style={{ padding: '18px 20px 12px', borderBottom: `1px solid ${C.line}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        {icon && <span style={{ display: 'flex', color: C.heading }}>{icon}</span>}
        <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 600, lineHeight: 1.4, color: C.heading }}>{title}</div>
      </div>
      {subtitle && <div style={{ marginTop: 4, fontSize: 13, color: C.muted }}>{subtitle}</div>}
    </div>
  );
}

function StepCardBody({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div className={className} style={{ padding: '18px 20px 22px', ...style }}>{children}</div>;
}

// ─── Step 1: Data Bangunan ───
function Step1({ state, set }: { state: AppState; set: React.Dispatch<React.SetStateAction<AppState>> }) {
  const updateBuilding = (field: keyof BuildingData, val: string | number) =>
    set(s => ({ ...s, building: { ...s.building, [field]: val } }));

  const tc = TYPOLOGY_CONFIG[state.building.typology];
  const isNameValid = state.building.name.trim().length > 0;
  const hasOccupants = (state.building.occupant1 || 0) + (state.building.occupant2 || 0) > 0;
  const hasNLA = (state.building.nla || 0) > 0;

  return (
    <div style={{ maxWidth: 760 }}>
      <DetailCard
        title="Identitas Proyek"
        icon={<Building2 size={20} />}
        style={{ marginBottom: 16 }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <div>
            <Label>Nama Bangunan <span style={{color: C.danger}}>*</span></Label>
            <Inp
              value={state.building.name}
              onChange={e => updateBuilding('name', e.target.value)}
              placeholder="Contoh: Gedung Menara Kuningan"
              aria-invalid={!isNameValid}
              aria-describedby={!isNameValid ? 'building-name-error' : undefined}
              style={{ borderColor: !isNameValid ? C.danger : undefined }}
            />
            {!isNameValid && (
              <span id="building-name-error" style={{ fontSize: 12, color: C.danger, marginTop: 4, display: 'block' }}>
                Nama bangunan wajib diisi
              </span>
            )}
          </div>
          <div>
            <Label>Tipologi</Label>
            <Sel
              value={state.building.typology}
              onChange={e => updateBuilding('typology', e.target.value as TypologyId)}
              options={[{ value: state.building.typology, label: tc.label }]}
              disabled
            />
            <span style={{ fontSize: 12, color: C.muted, display: 'block', marginTop: 4 }}>
              Tipologi ditentukan via tombol skema di Header
            </span>
          </div>
        </div>
      </DetailCard>

      <DetailCard
        title="Parameter Utama"
        icon={<Droplets size={20} />}
        subtitle={`Tipologi: ${tc.label} | Satuan: ${tc.occupant1Label} / ${tc.occupant2Label}`}
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <Label unit={`(${tc.occupant1Label})`}>Jumlah Penghuni Utama <span style={{color: C.danger}}>*</span></Label>
            <NumField
              value={state.building.occupant1 || 0}
              onChange={v => updateBuilding('occupant1', v)}
              min={0}
              max={100000}
              step={1}
              integer
              aria-label="Jumlah penghuni utama"
              aria-invalid={!hasOccupants}
              style={{ borderColor: !hasOccupants ? C.danger : undefined }}
            />
            {!hasOccupants && !hasNLA && (
              <span style={{ fontSize: 12, color: C.danger, marginTop: 4, display: 'block' }}>
                Minimal salah satu: penghuni atau NLA wajib diisi
              </span>
            )}
          </div>
          <div>
            <Label unit={`(${tc.occupant2Label})`}>Jumlah Penghuni Sekunder</Label>
            <NumField
              value={state.building.occupant2 || 0}
              onChange={v => updateBuilding('occupant2', v)}
              min={0}
              max={100000}
              step={1}
              integer
              aria-label="Jumlah penghuni sekunder"
            />
          </div>
          <div>
            <Label>Luas Lantai Nett (m²) <span style={{color: C.danger}}>*</span></Label>
            <NumField
              value={state.building.nla || 0}
              onChange={v => updateBuilding('nla', v)}
              min={0}
              max={1000000}
              step={0.001}
              aria-label="Luas lantai nett"
              aria-invalid={!hasNLA}
              style={{ borderColor: !hasNLA ? C.danger : undefined }}
            />
            {!hasNLA && !hasOccupants && (
              <span style={{ fontSize: 12, color: C.danger, marginTop: 4, display: 'block' }}>
                Minimal salah satu: penghuni atau NLA wajib diisi
              </span>
            )}
          </div>
          <div>
            <Label>Jam Operasional/hari</Label>
            <NumField
              value={state.building.opHours || 8}
              onChange={v => updateBuilding('opHours', v)}
              min={1}
              max={24}
              step={0.5}
              aria-label="Jam operasional per hari"
            />
          </div>
        </div>
      </DetailCard>
    </div>
  );
}

// ─── Step 2: Fitur Air (WAC 2) ───
function Step2({ state, set }: { state: AppState; set: React.Dispatch<React.SetStateAction<AppState>> }) {
  const updateFixtures = (type: FixtureTypeId, products: FixtureProduct[]) =>
    set(s => ({ ...s, fixtures: { ...s.fixtures, [type]: products } }));

  const toggleUrinal = () => set(s => ({ ...s, hasUrinal: !s.hasUrinal }));

  const wac2Live = calcWAC2(state.fixtures);
  const urinalQty = state.fixtures.URINAL.reduce((sum, p) => sum + (p.qty || 0), 0);
  const urinalConflict = state.hasUrinal !== urinalQty > 0;

  // Get available fixtures for current typology
  const availableFixtures = FIXTURE_AVAILABILITY[state.building.typology] || [];
  
  // Track open accordions
  const [openAccordions, setOpenAccordions] = useState<Set<FixtureTypeId>>(
    new Set(availableFixtures.filter(t => state.fixtures[t].length > 0))
  );

  const toggleAccordion = (type: FixtureTypeId) => {
    setOpenAccordions(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const isOpen = (type: FixtureTypeId) => openAccordions.has(type);

  const getFixtureStatus = (type: FixtureTypeId) => {
    const products = state.fixtures[type];
    const total = products.reduce((s, p) => s + (p.qty || 0), 0);
    const bl = FIXTURE_BASELINES[type]?.baseline ?? 0;
    const hemat = products.reduce((s, p) => s + ((p.qty > 0 && p.rate > 0 && p.rate <= bl) ? p.qty : 0), 0);
    if (total === 0) return { label: 'Belum diisi', color: C.muted };
    if (hemat === total) return { label: 'Semua Hemat', color: C.success };
    return { label: 'Ada Boros', color: C.danger };
  };

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Skor WAC 2 - Live Score Panel */}
      <DetailCard
        title="Skor WAC 2"
        icon={<Award size={20} />}
        subtitle={`Poin maksimum: 3 | Target: ≥25% (1 poin), ≥50% (2 poin), ≥75% (3 poin)`}
        style={{ marginBottom: 16 }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
          <Pill val={fmtFixed(wac2Live.pts, 0)} label="Skor WAC 2" unit="/3" accent={C.accent} />
          <Pill val={fmt(wac2Live.pct * 100, 1)} label="Persentase Hemat" unit="%" accent={C.accent} />
          <Pill val={fmtFixed(wac2Live.hemat, 0)} label="Produk Hemat" accent={C.heading} />
          <Pill val={fmtFixed(wac2Live.total, 0)} label="Total Produk" accent={C.heading} />
        </div>
      </DetailCard>

      {availableFixtures.map(type => {
        const baseline = FIXTURE_BASELINES[type];
        const products = state.fixtures[type];
        const total = products.reduce((s, p) => s + (p.qty || 0), 0);
        const status = getFixtureStatus(type);
        const open = isOpen(type);

        return (
          <DetailCard key={type} title={baseline?.labelId || type} style={{ marginBottom: 12 }}>
            <div
              style={{
                padding: '14px 20px',
                background: open ? C.lighter : 'transparent',
                borderBottom: `1px solid ${C.line}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
              onClick={() => toggleAccordion(type)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: open ? C.brand : C.line,
                  color: open ? '#fff' : C.muted,
                  fontSize: 14,
                  fontWeight: 600,
                  transition: 'all 0.15s',
                }}>
                  {open ? '−' : '+'}
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: C.heading }}>
                    {baseline?.labelId || type}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted }}>
                    Baseline: {baseline?.baseline ?? 0} {baseline?.unit || 'L'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 20,
                  background: status.color + '15',
                  color: status.color,
                  border: `1px solid ${status.color}40`,
                }}>
                  {status.label}
                </span>
                <span style={{
                  fontFamily: 'var(--display)',
                  fontSize: 18,
                  fontWeight: 700,
                  color: C.heading,
                }}>
                  {total}
                </span>
                <span style={{ fontSize: 13, color: C.muted }}>unit</span>
              </div>
            </div>

            {open && (
              <div style={{ padding: '16px 20px 20px' }}>
                <FixtureSection
                  type={type}
                  products={state.fixtures[type]}
                  onChange={p => updateFixtures(type, p)}
                />
              </div>
            )}
          </DetailCard>
        );
      })}

      <DetailCard title="Konfigurasi Urinal" style={{ marginTop: 16 }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Droplets size={20} style={{ color: C.heading }} />
            <div style={{ fontWeight: 600, fontSize: 15, color: C.heading }}>Konfigurasi Urinal</div>
          </div>
        </div>
        <div style={{ padding: '16px 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Tog
              on={state.hasUrinal}
              onChange={toggleUrinal}
              label="Bangunan memiliki urinal"
            />
            <span style={{ fontSize: 13, color: C.muted }}>
              {state.hasUrinal ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
            Toggle ini menentukan pola pemakaian flushing. Jumlah unit urinal diisi pada bagian "Peturasan / Urinal" di atas.
          </div>
          {urinalConflict && (
            <div style={{
              marginTop: 10, padding: '10px 12px', borderRadius: 8,
              background: C.warningBg, border: `1px solid ${C.warningLine}`, color: C.warningInk, fontSize: 13,
            }}>
              {state.hasUrinal
                ? 'Urinal ditandai tersedia tetapi jumlah unitnya masih 0 — pemakaian flushing dihitung seolah urinal terpasang. Isi jumlah urinal atau matikan toggle ini.'
                : 'Jumlah unit urinal sudah terisi tetapi toggle nonaktif — kebutuhan urinal akan diabaikan.'}
            </div>
          )}
        </div>
      </DetailCard>
    </div>
  );
}

// ─── Step 3: Lansekap & CT ───
function Step3({ state, set }: { state: AppState; set: React.Dispatch<React.SetStateAction<AppState>> }) {
  const updateLandscape = (field: keyof AppState['landscape'], val: string | number) =>
    set(s => ({ ...s, landscape: { ...s.landscape, [field]: val } }));

  const updateZone = (index: number, field: keyof LandscapeZone, val: string | number) =>
    set(s => {
      const zones = [...s.landscape.zones];
      zones[index] = { ...zones[index], [field]: val };
      return { ...s, landscape: { ...s.landscape, zones } };
    });

  const addZone = () =>
    set(s => ({
      ...s,
      landscape: { ...s.landscape, zones: [...s.landscape.zones, { label: `Area ${s.landscape.zones.length + 1}`, basRate: LANDSCAPE_BASELINE_RATE, dsgRate: 0, areaShare: 0 }] },
    }));

  const removeZone = (index: number) =>
    set(s => ({ ...s, landscape: { ...s.landscape, zones: s.landscape.zones.filter((_, i) => i !== index) } }));

  const updateCT = (field: keyof AppState['coolingTower'], val: string | number | boolean) =>
    set(s => ({ ...s, coolingTower: { ...s.coolingTower, [field]: val } }));

  const totalShare = landscapeShareSum(state.landscape.zones);
  const sharePct = landscapeSharePct(state.landscape.zones);
  const shareExact = isLandscapeShareExact(state.landscape.zones);

  return (
    <div style={{ maxWidth: 1100 }}>
      <DetailCard
        title="Lansekap & CT"
        icon={<Leaf size={20} />}
        subtitle={`Baseline irigasi: ≤ ${LANDSCAPE_BASELINE_RATE} L/m²/hari | Maks ${LANDSCAPE_MAX_ZONES} zona | CT COC baseline: 3`}
      >
        {/* Lansekap Section */}
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: C.heading, marginBottom: 16, paddingBottom: 8, borderBottom: `1px solid ${C.line}` }}>
            <Leaf size={16} style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: 8, color: C.brand }} />
            Area Lansekap
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
            <div>
              <Label>Total Area Irigasi (m²)</Label>
              <NumField
                value={state.landscape.area}
                onChange={v => updateLandscape('area', v)}
                step={0.001}
                min={0}
                max={100000000}
                placeholder="0"
                aria-label="Total area irigasi"
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Label style={{ marginBottom: 0 }}>Zona Irigasi (Maks {LANDSCAPE_MAX_ZONES})</Label>
              {state.landscape.zones.length < LANDSCAPE_MAX_ZONES && (
                <button type="button" onClick={addZone} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 8,
                  background: 'transparent', border: `1.5px solid ${C.heading}`,
                  color: C.heading, fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
                }} onMouseEnter={e => e.currentTarget.style.background = C.lighter} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Plus size={12} /> Tambah Zona
                </button>
              )}
            </div>

            <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, overflowX: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 1fr) 110px 110px 90px 64px', gap: 8, minWidth: 560, padding: '10px 12px', background: C.lighter, borderBottom: `1px solid ${C.line}`, fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--sans)' }}>
                <div>Nama Zona</div>
                <div style={{ textAlign: 'center' }}>Baseline (L/m²)</div>
                <div style={{ textAlign: 'center' }}>Desain (L/m²)</div>
                <div style={{ textAlign: 'center' }}>% Area</div>
                <div style={{ textAlign: 'center' }}>Aksi</div>
              </div>
              {state.landscape.zones.map((zone, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 1fr) 110px 110px 90px 64px', gap: 8, minWidth: 560, padding: '8px 12px', alignItems: 'center', borderBottom: i < state.landscape.zones.length - 1 ? `1px solid ${C.line}` : 'none', background: '#fff' }}>
                  <Inp
                    type="text"
                    value={zone.label}
                    onChange={e => updateZone(i, 'label', e.target.value)}
                    placeholder={`Zona ${i + 1}`}
                    style={{ fontSize: 13 }}
                  />
                  <Inp
                    type="number"
                    value={zone.basRate || ''}
                    onChange={e => updateZone(i, 'basRate', parseFloat(e.target.value.replace(',', '.')) || 0)}
                    step={0.001}
                    min={0}
                    readOnly
                    style={{ width: '100%', textAlign: 'center', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}
                  />
                  <NumField
                    value={zone.dsgRate}
                    onChange={v => updateZone(i, 'dsgRate', v)}
                    step={0.001}
                    min={0}
                    max={100000}
                    style={{ fontSize: 13 }}
                    aria-label={`Laju desain zona ${i + 1}`}
                  />
                  <NumField
                    value={zone.areaShare * 100}
                    onChange={v => updateZone(i, 'areaShare', v / 100)}
                    step={0.1}
                    min={0}
                    max={100}
                    style={{ fontSize: 13 }}
                    aria-label={`Persentase area zona ${i + 1}`}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                    {state.landscape.zones.length > 1 && (
                      <IconGhost onClick={() => removeZone(i)} aria-label={`Hapus zona ${i + 1}`}>
                        <Trash2 size={12} />
                      </IconGhost>
                    )}
                  </div>
                </div>
              ))}
              {state.landscape.zones.length === 0 && (
                <div style={{ padding: '20px 12px', textAlign: 'center', color: C.muted, fontSize: 13 }}>
                  Belum ada zona. Klik "Tambah Zona" untuk memulai.
                </div>
              )}
            </div>
          </div>

          {/* Zone Sum Validation - Prominent */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: 12,
            background: shareExact ? C.successBg : C.dangerBg,
            border: `1px solid ${shareExact ? C.successLine : C.dangerLine}`,
            borderRadius: 8,
            color: shareExact ? C.successInk : C.dangerInk,
            marginTop: 8
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>{shareExact ? '✓' : '✕'}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  Total Persentase Area: <strong>{fmtFixed(sharePct, 1)}%</strong>
                </div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {shareExact ? 'Valid — total 100%' : 'Harus total 100% untuk validasi WAC 1'}
                </div>
              </div>
            </div>
            {sharePct > 1 && (
              <span style={{ marginLeft: 'auto', fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.1)' }}>
                {fmtFixed((sharePct - 100), 1)}% kelebihan
              </span>
            )}
            {sharePct > 0 && sharePct < 1 && (
              <span style={{ marginLeft: 'auto', fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.1)' }}>
                {fmtFixed((100 - sharePct), 1)}% kekurangan
              </span>
            )}
          </div>
        </div>

        {/* Cooling Tower Section - Stacked vertical layout */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: C.heading, marginBottom: 16, paddingBottom: 8, borderBottom: `1px solid ${C.line}` }}>
            <Zap size={16} style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: 8, color: C.cta }} />
            Cooling Tower
          </h4>
          <div style={{ display: 'grid', gap: 16 }}>
            {/* Switch inline with label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Tog
                on={state.coolingTower.enabled}
                onChange={v => updateCT('enabled', v)}
                label="aktifkan cooling tower"
              />
            </div>
            
            {/* Fields stacked vertically - one row per parameter */}
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <Label>Beban Pendingin (TR)</Label>
                <NumField
                  value={state.coolingTower.load}
                  onChange={v => updateCT('load', v)}
                  step={0.001}
                  min={0}
                  max={1000000}
                  placeholder="0"
                  disabled={!state.coolingTower.enabled}
                  aria-label="Beban pendingin cooling tower"
                />
              </div>
              <div>
                <Label unit="(baseline 3 siklus)">Siklus Konsentrasi (COC)</Label>
                <NumField
                  value={state.coolingTower.coc ?? 3}
                  onChange={v => updateCT('coc', v)}
                  min={2}
                  max={10}
                  integer
                  placeholder="3"
                  disabled={!state.coolingTower.enabled}
                  aria-label="Siklus konsentrasi cooling tower"
                />
              </div>
            </div>

            <div style={{ marginTop: 8, padding: 12, background: C.lighter, borderRadius: 8, fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
              <strong style={{ color: C.heading }}>Rumus:</strong> Air make-up = evaporasi + blowdown (evaporasi ÷ (COC − 1)). 
              Nilai baseline sudah mencakup blowdown pada 3 siklus; menaikkan COC menurunkan porsi blowdown, sehingga penghematan cooling tower ikut terhitung.
            </div>

            {state.coolingTower.enabled && state.coolingTower.load > 0 && (
              <div style={{ padding: 12, background: C.infoBg, borderRadius: 8, fontSize: 12, color: C.infoInk, border: `1px solid ${C.info}` }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Estimasi Air Make-up</div>
                <div>Beban: <strong>{fmt(state.coolingTower.load, 0)} TR</strong> × 12 L/TR/jam × {fmt(state.building.opHours, 1)} jam = <strong>{fmt(state.coolingTower.load * 12 * state.building.opHours, 0)} L/hari</strong> (evaporasi)</div>
                <div>COC {state.coolingTower.coc}: Blowdown = {fmt(state.coolingTower.load * 12 * state.building.opHours / (state.coolingTower.coc - 1), 0)} L/hari</div>
                <div style={{ fontWeight: 600, marginTop: 4 }}>
                  Total Make-up: ~{fmt(state.coolingTower.load * 12 * state.building.opHours * (1 + 1 / (state.coolingTower.coc - 1)), 0)} L/hari
                </div>
              </div>
            )}
          </div>
        </div>
      </DetailCard>
    </div>
  );
}

// ─── Step 4: Air Hujan ───
function Step4({ state, set, R }: { state: AppState; set: React.Dispatch<React.SetStateAction<AppState>>; R: ReturnType<typeof calcAll> }) {
  const updateRainwater = (field: keyof AppState['rainwater'], val: string | number | boolean) =>
    set(s => ({ ...s, rainwater: { ...s.rainwater, [field]: val } }));

  const rw = calcRainwater(state);
  const p2Pass = rw.capRatio >= 0.1;
  const p2Unknown = !R?.wac1?.p2DataComplete;

  const prefillRoofArea = () => {
    const nla = state.building.nla || 0;
    if (nla > 0) {
      const suggested = nla * 0.8;
      updateRainwater('roofArea', suggested);
    }
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      <DetailCard
        title="Tanki Air Hujan"
        icon={<CloudRain size={20} />}
        subtitle="Air Alternatif Air Hujan"
      >
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Switch inline with label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Tog
              on={state.rainwater.hasTank}
              onChange={v => updateRainwater('hasTank', v)}
              label="aktifkan tanki air hujan"
            />
          </div>

          {!state.rainwater.hasTank && (
            <div style={{ padding: 24, textAlign: 'center', background: C.lighter, borderRadius: 8, border: `1px dashed ${C.line}` }}>
              <CloudRain size={32} style={{ color: C.muted, marginBottom: 8 }} />
              <div style={{ fontWeight: 600, color: C.heading, marginBottom: 4 }}>Aktifkan air hujan untuk melanjutkan</div>
              <div style={{ fontSize: 13, color: C.muted }}>
                Data bangunan dan peralatan (Langkah 1 & 2) harus lengkap agar potensi air hujan dapat dihitung.
              </div>
            </div>
          )}

          {state.rainwater.hasTank && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div>
                  <Label>Curah Hujan Rata-rata per Hujan (mm)</Label>
                  <NumField
                    value={state.rainwater.avgRainfall}
                    onChange={v => updateRainwater('avgRainfall', v)}
                    step={0.001}
                    min={0}
                    max={10000}
                    placeholder="50"
                    aria-label="Curah hujan rata-rata per hujan"
                  />
                </div>
                <div>
                  <Label>Persentase Hari Hujan (0-1)</Label>
                  <NumField
                    value={state.rainwater.rainyDayPct}
                    onChange={v => updateRainwater('rainyDayPct', v)}
                    step={0.001}
                    min={0}
                    max={1}
                    placeholder="0,55"
                    aria-label="Persentase hari hujan"
                  />
                </div>
                <div>
                  <Label>Koefisien Aliran (0-1)</Label>
                  <NumField
                    value={state.rainwater.runoffCoef}
                    onChange={v => updateRainwater('runoffCoef', v)}
                    step={0.001}
                    min={0}
                    max={1}
                    placeholder="0,78"
                    aria-label="Koefisien aliran"
                  />
                </div>
                <div>
                  <Label>Luas Atap Tangkapan (m²)</Label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <NumField
                      value={state.rainwater.roofArea}
                      onChange={v => updateRainwater('roofArea', v)}
                      step={0.001}
                      min={0}
                      max={100000000}
                      placeholder="0"
                      aria-label="Luas atap tangkapan"
                      style={{ flex: 1 }}
                    />
                    {state.building.nla > 0 && state.rainwater.roofArea === 0 && (
                      <button
                        type="button"
                        onClick={prefillRoofArea}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: `1px solid ${C.brand}`,
                          background: 'transparent',
                          color: C.brand,
                          fontFamily: 'var(--sans)',
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          height: '40px',
                        }}
                        title={`Isi otomatis: NLA (${fmt(state.building.nla, 0)} m²) × 0.8 = ${fmt(state.building.nla * 0.8, 0)} m²`}
                      >
                        Isi dari NLA
                      </button>
                    )}
                  </div>
                  {state.building.nla > 0 && state.rainwater.roofArea === 0 && (
                    <span style={{ fontSize: 11, color: C.muted, marginTop: 4, display: 'block' }}>
                      Saran: {fmt(state.building.nla * 0.8, 0)} m² (80% dari NLA {fmt(state.building.nla, 0)} m²)
                    </span>
                  )}
                </div>
                <div>
                  <Label>Kapasitas Tangki (L)</Label>
                  <NumField
                    value={state.rainwater.tankCapacity}
                    onChange={v => updateRainwater('tankCapacity', v)}
                    step={1}
                    min={0}
                    max={1000000000}
                    placeholder="0"
                    aria-label="Kapasitas tangki"
                  />
                </div>
              </div>

              {/* P2 Prerequisite Callout - Prominent */}
              <div style={{
                marginTop: 16,
                padding: 16,
                borderRadius: 8,
                background: p2Pass ? C.successBg : C.warningBg,
                border: `1px solid ${p2Pass ? C.successLine : C.warningLine}`,
                color: p2Pass ? C.successInk : C.warningInk,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ fontSize: 24, flexShrink: 0 }}>{p2Pass ? '✓' : '⚠'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>
                      {p2Pass ? 'Prasyarat WAC P2 Terpenuhi' : 'Prasyarat WAC P2 Belum Terpenuhi'}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 13, opacity: 0.9 }}>
                      Rasio penampungan: <strong>{fmtPct(rw.capRatio)}</strong> (minimum 10% dari volume ideal tahunan).
                      {state.rainwater.tankCapacity === 0 && ' Tangki belum diisi.'}
                    </div>
                    {!p2Pass && state.rainwater.tankCapacity > 0 && (
                      <div style={{ marginTop: 8, fontSize: 13 }}>
                        Kurang: <strong>{fmt((0.1 * rw.idealVolume) - state.rainwater.tankCapacity, 0)} L</strong> untuk mencapai 10% ({fmt(0.1 * rw.idealVolume, 0)} L).
                      </div>
                    )}
                  </div>
                  <Badge variant={p2Pass ? 'success' : 'warning'} size="sm">
                    {p2Pass ? 'LULUS P2' : 'PERLU PERBAIKAN'}
                  </Badge>
                </div>
              </div>
            </>
          )}
        </div>
      </DetailCard>

      {/* Tank Gauge Visual (Right - Sticky) */}
      <DetailCard
        title="Visualisasi Tangki"
        icon={<Droplets size={20} />}
        style={{ position: 'sticky', top: 'calc(var(--hdr-h) + 24px)', height: 'fit-content' }}
      >
        {!state.rainwater.hasTank ? (
          <div style={{ padding: 24, textAlign: 'center', color: C.muted }}>
            <CloudRain size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
            <div style={{ fontWeight: 600 }}>Aktifkan air hujan</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>untuk melihat visualisasi</div>
          </div>
        ) : (
          <>
            {/* Tank Gauge */}
            <div style={{ textAlign: 'center', padding: '20px 16px' }}>
              <div style={{ position: 'relative', width: 120, height: 200, margin: '0 auto 16px' }}>
                {/* Tank Outline */}
                <svg width="120" height="200" viewBox="0 0 120 200" style={{ overflow: 'visible' }}>
                  <rect x="10" y="10" width="100" height="180" rx="8" fill="none" stroke={C.line} strokeWidth="2" />
                    {/* Tank Fill */}
                    <rect
                      x="12"
                      y={12 + 176 * (1 - Math.min(rw.capRatio, 1))}
                      width="96"
                      height={176 * Math.min(rw.capRatio, 1)}
                      rx="6"
                      fill={p2Pass ? C.accent : C.warning}
                      style={{ transition: 'height 0.4s ease-out, y 0.4s ease-out' }}
                    />
                    {/* 10% P2 Line */}
                    <line
                      x1="8" y1={12 + 176 * (1 - 0.1)}
                      x2="112" y2={12 + 176 * (1 - 0.1)}
                      stroke={C.warning}
                      strokeWidth="1.5"
                      strokeDasharray="6 4"
                    />
                    <text x="115" y={12 + 176 * (1 - 0.1) + 4} textAnchor="end" fontSize="8" fill={C.warning} fontFamily="var(--sans)" fontWeight="600">
                      10% P2
                    </text>
                  </svg>
                </div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 700, color: C.heading }}>
                  {fmtPct(Math.min(rw.capRatio, 1))}
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                  Rasio Penampungan
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                  <div style={{ textAlign: 'center', padding: '8px 0', background: C.lighter, borderRadius: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Kapasitas</div>
                    <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, color: C.heading }}>{fmt(state.rainwater.tankCapacity, 0)} L</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '8px 0', background: C.lighter, borderRadius: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ideal Tahunan</div>
                    <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, color: C.accent }}>{fmt(rw.idealVolume, 0)} L</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '8px 0', background: C.lighter, borderRadius: 6, gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tersedia / Hari Basah</div>
                    <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, color: C.info }}>{fmt(rw.availWet, 0)} L</div>
                  </div>
                </div>

                {/* Quick Calculation Helper */}
                <div style={{ marginTop: 16, padding: 12, background: C.infoBg, borderRadius: 8, border: `1px solid ${C.info}` }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.infoInk, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    Estimasi Cepat
                  </div>
                  <div style={{ fontSize: 12, color: C.infoInk, lineHeight: 1.7 }}>
                    <div>Atap: {fmt(state.rainwater.roofArea, 0)} m² × {fmt(state.rainwater.avgRainfall, 0)} mm × {fmtFixed(state.rainwater.runoffCoef, 2)} = {fmt(state.rainwater.roofArea * state.rainwater.avgRainfall * state.rainwater.runoffCoef, 0)} L/hujan</div>
                    <div>Hujan/tahun: {fmt(state.rainwater.rainyDayPct * 365, 0)} hari × di atas = {fmt(state.rainwater.roofArea * state.rainwater.avgRainfall * state.rainwater.runoffCoef * state.rainwater.rainyDayPct * 365, 0)} L/tahun</div>
                    <div style={{ marginTop: 4, fontWeight: 600 }}>Ideal: {fmt(rw.idealVolume, 0)} L/tahun</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DetailCard>
    </div>
  );
}

// ─── Step 5: Neraca Air ───
function Step5({ state, set, R }: { state: AppState; set: React.Dispatch<React.SetStateAction<AppState>>; R: ReturnType<typeof calcAll> }) {
  const [activeScenario, setActiveScenario] = useState<'wet' | 'dry'>('wet');
  const [syncScenarios, setSyncScenarios] = useState(true);
  const { isMobile } = useBreakpoint();

  const scenario = state.waterBalance[activeScenario];
  const daily = R.daily;
  const rw = calcRainwater(state);

  const handleSourceChange = (id: WBSourceId, field: keyof typeof scenario.sources[0], val: string | number | boolean) => {
    set(s => ({
      ...s,
      waterBalance: {
        ...s.waterBalance,
        [activeScenario]: {
          ...s.waterBalance[activeScenario],
          sources: s.waterBalance[activeScenario].sources.map(r => r.id === id ? { ...r, [field]: val } : r),
        },
      },
    }));
    if (syncScenarios) {
      const otherKey = activeScenario === 'wet' ? 'dry' : 'wet';
      set(s => ({
        ...s,
        waterBalance: {
          ...s.waterBalance,
          [otherKey]: {
            ...s.waterBalance[otherKey],
            sources: s.waterBalance[otherKey].sources.map(r => r.id === id ? { ...r, [field]: val } : r),
          },
        },
      }));
    }
  };

  const handleUseChange = (id: WBUseId, field: keyof typeof scenario.uses[0], val: string | number | boolean) => {
    set(s => ({
      ...s,
      waterBalance: {
        ...s.waterBalance,
        [activeScenario]: {
          ...s.waterBalance[activeScenario],
          uses: s.waterBalance[activeScenario].uses.map(r => r.id === id ? { ...r, [field]: val } : r),
        },
      },
    }));
    if (syncScenarios) {
      const otherKey = activeScenario === 'wet' ? 'dry' : 'wet';
      set(s => ({
        ...s,
        waterBalance: {
          ...s.waterBalance,
          [otherKey]: {
            ...s.waterBalance[otherKey],
            uses: s.waterBalance[otherKey].uses.map(r => r.id === id ? { ...r, [field]: val } : r),
          },
        },
      }));
    }
  };

  const sourceLabels: Record<WBSourceId, string> = {
    'flush': 'Flushing WC',
    'urinal': 'Peturasan / Urinal',
    'tap': 'Keran Tembok + Wastafel',
    'wudhu': 'Keran Wudhu',
    'shower': 'Shower Mandi',
    'ct_condensate': 'Air Kondensasi CT',
    'rainwater': 'Air Hujan',
    'others': 'Lainnya',
  };

  const useLabels: Record<WBUseId, string> = {
    'flush': 'Flushing WC',
    'urinal': 'Peturasan / Urinal',
    'tap': 'Keran Tembok + Wastafel',
    'wudhu': 'Keran Wudhu',
    'shower': 'Shower Mandi',
    'ct_makeup': 'Make-up Water CT',
    'irrigation': 'Irigasi Lansekap',
  };

  const sourceRows = scenario.sources.map(src => {
    const available = computeSourceAvailable(src.id as WBSourceId, daily, rw.availWet, activeScenario === 'dry', src.availableManual);
    return { ...src, autoValue: available };
  });

  const useRows = scenario.uses.map(use => ({
    ...use,
    required: computeUseRequired(use.id as WBUseId, daily),
  }));

  const sourceTotal = sourceRows.reduce((sum, s) => sum + (s.auto ? s.autoValue : s.volumeDiolah), 0);
  const useTotal = useRows.reduce((sum, u) => sum + (u.dariAlt + u.dariRecycle), 0);
  const balance = sourceTotal - useTotal;
  const reductionPct = sourceTotal > 0 ? 1 - (useTotal / sourceTotal) : 0;

  // Responsive render: Mobile = stacked cards, Desktop = tables
  const renderSources = () => {
    if (isMobile) {
      return (
        <div style={{ display: 'grid', gap: 12 }}>
          {sourceRows.map(src => {
            const sourceId = src.id as WBSourceId;
            const isAuto = src.auto || false;
            const available = src.autoValue;
            const processed = isAuto ? available : src.volumeDiolah;
            const manualInput = sourceId === 'ct_condensate' || sourceId === 'others';

            return (
              <DetailCard key={src.id} title={sourceLabels[sourceId]} style={{ padding: 0 }}>
                <div style={{ padding: '14px 16px', background: C.lighter, borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <strong style={{ color: C.heading, fontSize: 14 }}>{sourceLabels[sourceId]}</strong>
                    <AutoPill
                      on={isAuto}
                      onToggle={() => handleSourceChange(sourceId, 'auto', !isAuto)}
                      title={isAuto ? 'Klik untuk input manual' : 'Klik untuk hitung otomatis'}
                    />
                  </div>
                  <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, color: C.heading }}>
                    {fmt(processed, 0)} L/hari
                  </div>
                </div>
                <div style={{ padding: '12px 16px', display: 'grid', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 500 }}>Tersedia (Auto)</label>
                      <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 600, color: C.info }}>{fmt(available, 0)} L/hari</div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 500 }}>Diolah</label>
                      {isAuto ? (
                        <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 600, color: C.heading }}>{fmt(available, 0)} L/hari</div>
                      ) : (
                        <NumField
                          value={src.volumeDiolah}
                          onChange={v => handleSourceChange(sourceId, 'volumeDiolah', v)}
                          step={0.001}
                          min={0}
                          max={Math.max(0, available)}
                          style={{ width: '100%', textAlign: 'right' }}
                          aria-label={`Volume diolah ${sourceLabels[sourceId]}`}
                        />
                      )}
                    </div>
                  </div>
                  {manualInput && (
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 500 }}>Input Manual (L/hari)</label>
                      <NumField
                        value={src.availableManual}
                        onChange={v => handleSourceChange(sourceId, 'availableManual', v)}
                        step={0.001}
                        min={0}
                        max={1000000000}
                        style={{ width: '100%', textAlign: 'right' }}
                        aria-label={`Input manual ${sourceLabels[sourceId]}`}
                      />
                    </div>
                  )}
                </div>
              </DetailCard>
            );
          })}
        </div>
      );
    }

    return (
      <Table caption="Sumber air: volume tersedia dan diolah per hari">
        <Thead>
          <Tr hover={false}>
            <Th>Sumber</Th>
            <Th numeric>Auto</Th>
            <Th numeric>Tersedia (L/hari)</Th>
            <Th numeric>Diolah (L/hari)</Th>
            <Th>Input Manual (L/hari)</Th>
          </Tr>
        </Thead>
        <Tbody>
          {sourceRows.map(src => {
            const sourceId = src.id as WBSourceId;
            return (
            <Tr key={src.id}>
              <Td>
                <strong style={{ color: C.heading }}>{sourceLabels[sourceId]}</strong>
              </Td>
              <Td numeric>
                <AutoPill
                  on={src.auto || false}
                  onToggle={() => handleSourceChange(sourceId, 'auto', !src.auto)}
                  title={src.auto ? 'Klik untuk input manual' : 'Klik untuk hitung otomatis'}
                />
              </Td>
              <Td numeric>
                {src.auto ? (
                  <ReadOnly val={src.autoValue} decimals={0} />
                ) : (
                  <ReadOnly val={src.autoValue} decimals={0} />
                )}
              </Td>
              <Td numeric>
                {src.auto ? (
                  <ReadOnly val={src.autoValue} decimals={0} />
                ) : (
                  <NumField
                    value={src.volumeDiolah}
                    onChange={v => handleSourceChange(sourceId, 'volumeDiolah', v)}
                    step={0.001}
                    min={0}
                    max={Math.max(0, src.autoValue)}
                    style={{ width: 120, textAlign: 'right' }}
                    aria-label={`Volume diolah ${sourceLabels[sourceId]}`}
                  />
                )}
              </Td>
              <Td>
                {sourceId === 'ct_condensate' || sourceId === 'others' ? (
                  <NumField
                    value={src.availableManual}
                    onChange={v => handleSourceChange(sourceId, 'availableManual', v)}
                    step={0.001}
                    min={0}
                    max={1000000000}
                    style={{ width: 120, textAlign: 'right' }}
                    aria-label={`Input manual ${sourceLabels[sourceId]}`}
                  />
                ) : (
                  <span style={{ color: C.muted, fontSize: 13 }}>—</span>
                )}
              </Td>
            </Tr>
            );
          })}
        </Tbody>
      </Table>
    );
  };

  const renderUses = () => {
    if (isMobile) {
      return (
        <div style={{ display: 'grid', gap: 12 }}>
          {useRows.map(use => {
            const useId = use.id as WBUseId;
            return (
              <DetailCard key={use.id} title={useLabels[useId]} style={{ padding: 0 }}>
                <div style={{ padding: '14px 16px', background: C.lighter, borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <strong style={{ color: C.heading, fontSize: 14 }}>{useLabels[useId]}</strong>
                  <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, color: C.heading }}>
                    {fmt(use.required, 0)} L/hari
                  </div>
                </div>
                <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 500 }}>Dari Alternatif (L/hari)</label>
                    <NumField
                      value={use.dariAlt}
                      onChange={v => handleUseChange(useId, 'dariAlt', v)}
                      step={0.001}
                      min={0}
                      max={Math.max(0, use.required)}
                      style={{ width: '100%', textAlign: 'right' }}
                      aria-label={`Dari alternatif ${useLabels[useId]}`}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 500 }}>Dari Resirkulasi (L/hari)</label>
                    <NumField
                      value={use.dariRecycle}
                      onChange={v => handleUseChange(useId, 'dariRecycle', v)}
                      step={0.001}
                      min={0}
                      max={Math.max(0, use.required - (use.dariAlt || 0))}
                      style={{ width: '100%', textAlign: 'right' }}
                      aria-label={`Dari resirkulasi ${useLabels[useId]}`}
                    />
                  </div>
                </div>
              </DetailCard>
            );
          })}
        </div>
      );
    }

    return (
      <Table caption="Kebutuhan air: volume kebutuhan dan pemenuhan per hari">
        <Thead>
          <Tr hover={false}>
            <Th>Kebutuhan</Th>
            <Th numeric>Kebutuhan (L/hari)</Th>
            <Th numeric>Dari Alternatif (L/hari)</Th>
            <Th numeric>Dari Resirkulasi (L/hari)</Th>
          </Tr>
        </Thead>
        <Tbody>
          {useRows.map(use => {
            const useId = use.id as WBUseId;
            return (
            <Tr key={use.id}>
              <Td>
                <strong style={{ color: C.heading }}>{useLabels[useId]}</strong>
              </Td>
              <Td numeric>
                <ReadOnly val={use.required} decimals={0} />
              </Td>
              <Td numeric>
                <NumField
                  value={use.dariAlt}
                  onChange={v => handleUseChange(useId, 'dariAlt', v)}
                  step={0.001}
                  min={0}
                  max={Math.max(0, use.required)}
                  style={{ width: 120, textAlign: 'right' }}
                  aria-label={`Dari alternatif ${useLabels[useId]}`}
                />
              </Td>
              <Td numeric>
                <NumField
                  value={use.dariRecycle}
                  onChange={v => handleUseChange(useId, 'dariRecycle', v)}
                  step={0.001}
                  min={0}
                  max={Math.max(0, use.required - (use.dariAlt || 0))}
                  style={{ width: 120, textAlign: 'right' }}
                  aria-label={`Dari resirkulasi ${useLabels[useId]}`}
                />
              </Td>
            </Tr>
            );
          })}
        </Tbody>
      </Table>
    );
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Scenario Selector & Sync */}
      <DetailCard title="Pilih Skenario" style={{ marginBottom: 16 }}>
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 4, background: C.lighter, borderRadius: 8, padding: 4 }}>
              {(['wet', 'dry'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setActiveScenario(s)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: activeScenario === s ? '#fff' : 'transparent',
                    color: activeScenario === s ? C.heading : C.muted,
                    fontFamily: 'var(--sans)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: activeScenario === s ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {s === 'wet' ? '💧 Hari Basah' : '☀️ Hari Kering'}
                </button>
              ))}
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tog
                on={syncScenarios}
                onChange={setSyncScenarios}
                label="Sinkronkan ke skenario lain"
              />
            </div>
          </div>
        </div>
      </DetailCard>

      {/* Reduction % Highlight - Prominent */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--card) 0%, var(--lighter) 100%)',
          border: `1px solid ${C.line}`,
          borderRadius: 12,
          padding: '20px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 24,
          alignItems: 'center',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>
              Reduksi Konsumsi Primer
            </div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 700, color: C.accent, lineHeight: 1.1 }}>
              {fmtPct(reductionPct)}
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
              dari total suplai {fmt(sourceTotal, 0)} L/hari
            </div>
          </div>
          
          <div style={{ borderLeft: `1px solid ${C.line}`, paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', border: '4px solid', borderColor: balance >= 0 ? C.accent : C.danger, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: balance >= 0 ? C.accent : C.danger, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 700, color: '#fff' }}>
                    {fmtFixed(reductionPct * 100, 0)}%
                  </span>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: balance >= 0 ? C.successInk : C.dangerInk }}>
                {balance >= 0 ? '✓ Surplus Air' : '✕ Defisit Air'}
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                {balance >= 0 ? '+' : ''}{fmt(balance, 0)} L/hari
              </div>
            </div>
          </div>

          <div style={{ borderLeft: `1px solid ${C.line}`, paddingLeft: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 700, color: C.info }}>{fmt(sourceTotal, 0)}</div>
              <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Sumber</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 700, color: C.accent }}>{fmt(useTotal, 0)}</div>
              <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Kebutuhan</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 700, color: balance >= 0 ? C.success : C.danger }}>{fmt(balance, 0)}</div>
              <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Saldo</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sources */}
      <DetailCard
        title="Sumber Air (Supply)"
        icon={<Droplets size={20} />}
        subtitle={`Total: ${fmt(sourceTotal, 0)} L/hari | Skenario: ${activeScenario === 'wet' ? '💧 Hari Basah' : '☀️ Hari Kering'}`}
        style={{ marginBottom: 16 }}
      >
        {renderSources()}
      </DetailCard>

      {/* Uses */}
      <DetailCard
        title="Kebutuhan Air (Demand)"
        icon={<Droplets size={20} />}
        subtitle={`Total: ${fmt(useTotal, 0)} L/hari`}
      >
        {renderUses()}
      </DetailCard>

      {/* Balance Status - Condensed since we have the highlight above */}
      <DetailCard title="Status Neraca" style={{ marginTop: 16 }}>
        <div style={{ padding: '16px 20px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: 16, borderRadius: 8,
            background: balance >= 0 ? C.successBg : C.dangerBg,
            border: `1px solid ${balance >= 0 ? C.successLine : C.dangerLine}`,
            color: balance >= 0 ? C.successInk : C.dangerInk,
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--display)' }}>
              {balance >= 0 ? '+' : ''}{fmt(balance, 0)} L/hari
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>
                {balance >= 0 ? '✓ Surplus Air — Neraca Seimbang' : '✕ Defisit Air — Perlu Tindakan'}
              </div>
              <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>
                Total Sumber: {fmt(sourceTotal, 0)} L/hari | Total Kebutuhan: {fmt(useTotal, 0)} L/hari
              </div>
            </div>
            <Badge variant={balance >= 0 ? 'success' : 'danger'} size="sm">
              {balance >= 0 ? 'SEIMBANG' : 'PERLU TINDAKAN'}
            </Badge>
          </div>
        </div>
      </DetailCard>
    </div>
  );
}

// ─── Step 6: Hasil WAC ───
function Step6({ state }: { state: AppState }) {
  const R = calcAll(state);
  const tc = TYPOLOGY_CONFIG[state.building.typology];
  const whatIf = useMemo(() => buildWhatIf(state), [state]);
  const p2Status: 'pass' | 'fail' | 'unknown' = !R.wac1.p2DataComplete
    ? 'unknown'
    : R.wac1.p2Pass ? 'pass' : 'fail';

  const wac2Max = 3;
  const wac1Max = 8;
  const wac2Score = R.wac2.pts;
  const wac1Score = R.wac1.pts;
  const wac2Pct = wac2Score / wac2Max;
  const wac1Pct = wac1Score / wac1Max;
  const totalScore = wac2Score + wac1Score;
  const totalMax = wac2Max + wac1Max;
  const totalPct = totalScore / totalMax;

  // Tabs state
  const [activeTab, setActiveTab] = useState<'wac1' | 'wac2' | 'p2' | 'summary'>('wac1');
  const [whatIfOpen, setWhatIfOpen] = useState<'wac1' | 'wac2' | null>(null);

  return (
    <div style={{ maxWidth: 1100 }}>
      <div className="print-only" style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 24, margin: 0 }}>Laporan Kalkulator Air GREENSHIP NB v1.3</h1>
        <div style={{ fontSize: 13, marginTop: 4 }}>
          {state.building.name || 'Tanpa nama'} · {tc.label} · dicetak{' '}
          {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Hero Card - Animated Progress Ring + Large Score (Parkinsans) */}
      <div style={{ background: C.heading, borderRadius: 16, padding: '32px 24px', marginBottom: 24, color: '#fff', overflow: 'hidden', position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.accentLight, marginBottom: 8 }}>
              SKOR WAC TOTAL
            </div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 'clamp(56px, 7vw, 88px)', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-1px', marginBottom: 4 }}>
              {fmtFixed(totalScore, 1)}
            </div>
            <div style={{ fontSize: 14, color: C.accentLight }}>
              dari {totalMax} poin maksimum
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              <Badge variant="success" size="sm">WAC 2: {fmtFixed(wac2Score, 1)}/{wac2Max}</Badge>
              <Badge variant="info" size="sm">WAC 1: {fmtFixed(wac1Score, 1)}/{wac1Max}</Badge>
              <Badge variant={p2Status === 'pass' ? 'success' : p2Status === 'fail' ? 'warning' : 'info'} size="sm">
                WAC P2: {p2Status === 'pass' ? 'LULUS' : p2Status === 'fail' ? 'BELUM TERPENUHI' : 'DATA BELUM LENGKAP'}
              </Badge>
            </div>
          </div>

          {/* Progress Ring - Hero Visual */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end', justifyContent: 'center', minHeight: 180 }}>
            <div style={{ position: 'relative', width: 160, height: 160 }}>
              <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background ring */}
                <circle
                  cx="80" cy="80" r="70"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="12"
                />
                {/* Progress ring */}
                <circle
                  cx="80" cy="80" r="70"
                  fill="none"
                  stroke={C.accent}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 70}
                  strokeDashoffset={2 * Math.PI * 70 * (1 - totalPct)}
                  style={{ transition: 'stroke-dashoffset 1s ease-out', filter: 'drop-shadow(0 4px 12px rgba(95,178,92,0.4))' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: 'var(--display)', fontSize: 36, fontWeight: 600, color: C.accent }}>
                  {fmtPct(totalPct)}
                </div>
                <div style={{ fontSize: 11, color: C.accentLight, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Pencapaian
                </div>
              </div>
            </div>
            <Progress value={totalPct * 100} variant="primary" height={10} style={{ width: '100%', maxWidth: 300 }} />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <DetailCard title="Navigasi Hasil" style={{ marginBottom: 16, padding: 0 }}>
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.line}`, overflowX: 'auto' }}>
          {[
            { id: 'wac1', label: 'WAC 1: Konsumsi', icon: <BarChart3 size={16} /> },
            { id: 'wac2', label: 'WAC 2: Efisiensi', icon: <Award size={16} /> },
            { id: 'p2', label: 'Prasyarat P2', icon: <CloudRain size={16} /> },
            { id: 'summary', label: 'Ringkasan Eksekutif', icon: <Link2 size={16} /> },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              style={{
                padding: '14px 20px',
                border: 'none',
                background: activeTab === tab.id ? '#fff' : 'transparent',
                color: activeTab === tab.id ? C.heading : C.muted,
                fontFamily: 'var(--sans)',
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 600 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                borderBottom: activeTab === tab.id ? `3px solid ${C.cta}` : 'none',
                marginBottom: '-1px',
                transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = C.heading}
              onMouseLeave={e => e.currentTarget.style.color = activeTab === tab.id ? C.heading : C.muted}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </DetailCard>

      {/* Tab Panels */}
      {activeTab === 'wac1' && (
        <DetailCard
          title="WAC 1: Konsumsi Air Bangunan"
          icon={<BarChart3 size={20} />}
          subtitle={`Poin: ${fmtFixed(wac1Score, 1)} / ${wac1Max} | Unit: ${tc.resultUnit}`}
          style={{ marginBottom: 16 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div style={{ background: C.lighter, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>Skor WAC 1</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 32, fontWeight: 700, color: C.heading, fontVariantNumeric: 'tabular-nums' }}>{fmtFixed(wac1Score, 1)}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>dari {wac1Max}</div>
            </div>
            <div style={{ background: C.lighter, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>Persentase</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 32, fontWeight: 700, color: C.accent, fontVariantNumeric: 'tabular-nums' }}>{fmtPct(wac1Pct)}</div>
            </div>
            <div style={{ background: C.lighter, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>Baseline</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 700, color: C.heading, fontVariantNumeric: 'tabular-nums' }}>{fmtFixed(R.wac1.baselineNorm, 3)} {tc.resultUnit}</div>
            </div>
            <div style={{ background: C.lighter, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>Desain</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 700, color: C.accent, fontVariantNumeric: 'tabular-nums' }}>{fmtFixed(R.wac1.designNorm, 3)} {tc.resultUnit}</div>
            </div>
            <div style={{ background: C.lighter, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>Pengurangan</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 700, color: C.success, fontVariantNumeric: 'tabular-nums' }}>{fmtPct(R.wac1.savingsPct)}</div>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <Label>Perbandingan Konsumsi (Baseline vs Desain)</Label>
            <div style={{ height: 280, marginTop: 16 }}>
              <React.Suspense fallback={<div style={{ height: '100%', display: 'grid', placeItems: 'center', color: C.muted, fontSize: 13 }}>Memuat grafik…</div>}>
                <WacComparisonChart
                  data={[
                    { name: 'Flush', baseline: R.daily.flushBL, design: R.daily.flushDsg },
                    { name: 'Tap', baseline: R.daily.tapBL, design: R.daily.tapDsg },
                    { name: 'Lansekap', baseline: R.daily.lsBL, design: R.daily.lsDsg },
                    { name: 'Cooling Tower', baseline: R.daily.ctBL, design: R.daily.ctDsg },
                    { name: 'Total', baseline: R.daily.totalBL, design: R.daily.totalDsg },
                  ]}
                  unit={tc.resultUnit}
                />
              </React.Suspense>
            </div>
          </div>
        </DetailCard>
      )}

      {activeTab === 'wac2' && (
        <DetailCard
          title="WAC 2: Efisiensi Peralatan"
          icon={<Award size={20} />}
          subtitle={`Poin: ${fmtFixed(wac2Score, 1)} / ${wac2Max}`}
          style={{ marginBottom: 16 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div style={{ background: C.lighter, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>Skor WAC 2</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 32, fontWeight: 700, color: C.heading, fontVariantNumeric: 'tabular-nums' }}>{fmtFixed(wac2Score, 1)}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>dari {wac2Max}</div>
            </div>
            <div style={{ background: C.lighter, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>Persentase</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 32, fontWeight: 700, color: C.accent, fontVariantNumeric: 'tabular-nums' }}>{fmtPct(wac2Pct)}</div>
            </div>
            <div style={{ background: C.lighter, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>Produk Hemat</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 32, fontWeight: 700, color: C.success, fontVariantNumeric: 'tabular-nums' }}>{R.wac2.hemat}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>dari {R.wac2.total} produk</div>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <Label>Detail Per Jenis Peralatan</Label>
            <Table caption="Detail WAC 2 per jenis peralatan">
              <Thead>
                <Tr hover={false}>
                  <Th>Jenis</Th>
                  <Th numeric>Baseline</Th>
                  <Th numeric>Desain (Rata-rata)</Th>
                  <Th numeric>Produk Hemat</Th>
                  <Th numeric>Total Produk</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {(Object.keys(state.fixtures) as FixtureTypeId[]).map(type => {
                  const bl = FIXTURE_BASELINES[type]?.baseline ?? 0;
                  const products = state.fixtures[type];
                  const total = products.reduce((s, p) => s + (p.qty || 0), 0);
                  const hemat = products.reduce((s, p) => s + ((p.qty > 0 && p.rate > 0 && p.rate <= bl) ? p.qty : 0), 0);
                  const avgDesign = total > 0 ? products.reduce((s, p) => s + (p.qty || 0) * (p.rate || 0), 0) / total : 0;
                  const allEfficient = total > 0 && hemat === total;
                  return (
                    <Tr key={type}>
                      <Td><strong style={{ color: C.heading }}>{FIXTURE_BASELINES[type]?.labelId || type}</strong></Td>
                      <Td numeric><ReadOnly val={bl} decimals={3} /></Td>
                      <Td numeric><ReadOnly val={avgDesign} decimals={3} /></Td>
                      <Td numeric><ReadOnly val={hemat} decimals={0} /></Td>
                      <Td numeric><ReadOnly val={total} decimals={0} /></Td>
                      <Td>
                        {total === 0
                          ? <span style={{ fontSize: 12, color: C.muted }}>Tidak terpasang</span>
                          : <StatusChip label={allEfficient ? 'Semua Hemat' : 'Ada Boros'} good={allEfficient} />}
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </div>
        </DetailCard>
      )}

      {activeTab === 'p2' && (
        <DetailCard
          title="WAC P2: Prasyarat Air Hujan"
          icon={<CloudRain size={20} />}
          style={{ marginBottom: 16 }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: 16, borderRadius: 8,
            background: p2Status === 'pass' ? C.successBg : p2Status === 'unknown' ? C.lighter : C.warningBg,
            border: `1px solid ${p2Status === 'pass' ? C.successLine : p2Status === 'unknown' ? C.line : C.warningLine}`,
            color: p2Status === 'pass' ? C.successInk : p2Status === 'unknown' ? C.body : C.warningInk,
          }}>
            <div style={{ fontSize: 32 }}>{p2Status === 'pass' ? '✓' : p2Status === 'unknown' ? '?' : '⚠'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>
                {p2Status === 'pass' ? 'Prasyarat Terpenuhi' : p2Status === 'unknown' ? 'Belum bisa dinilai' : 'Prasyarat Belum Terpenuhi'}
              </div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 2 }}>
                Rasio penampungan air hujan: <strong>{fmtPct(R.rainwater.capRatio)}</strong> (minimum 10% dari volume ideal).
                {p2Status === 'unknown' && ' Lengkapi data bangunan dan peralatan terlebih dahulu.'}
              </div>
            </div>
            <Badge variant={p2Status === 'pass' ? 'success' : p2Status === 'fail' ? 'warning' : 'info'} size="sm">
              {p2Status === 'pass' ? 'LULUS' : p2Status === 'fail' ? 'PERLU PERBAIKAN' : 'DATA BELUM LENGKAP'}
            </Badge>
          </div>

          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <Pill val={fmt(R.rainwater.idealVolume, 0)} label="Potensial Tahunan" unit="L/tahun" accent={C.info} />
            <Pill val={fmt(R.rainwater.availWet, 0)} label="Volume Disuplai" unit="L/hari" accent={C.accent} />
            <Pill val={fmtPct(R.rainwater.capRatio)} label="Rasio Penampungan" accent={R.rainwater.capRatio >= 0.1 ? C.accent : C.warning} />
            <Pill val={fmt(whatIf.tankTargetL, 0)} label="Tangki Minimal (10%)" unit="L" accent={C.heading} />
          </div>

          {p2Status === 'fail' && whatIf.tankMissingL > 0 && (
            <div style={{ marginTop: 12, fontSize: 13, color: C.warningInk, lineHeight: 1.6 }}>
              Tambahkan kapasitas tangki <strong>{fmt(whatIf.tankMissingL, 0)} L</strong> (dari{' '}
              {fmt(state.rainwater.tankCapacity, 0)} L menjadi minimal {fmt(whatIf.tankTargetL, 0)} L) di Langkah 4.
            </div>
          )}
        </DetailCard>
      )}

      {activeTab === 'summary' && (
        <DetailCard
          title="Ringkasan Eksekutif"
          icon={<Link2 size={20} />}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            <div style={{ background: C.lighter, borderRadius: 8, padding: 16 }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: C.heading }}>Informasi Bangunan</h4>
              <div style={{ fontSize: 13, lineHeight: 1.8, color: C.body }}>
                <div><strong>Nama:</strong> {state.building.name || '—'}</div>
                <div><strong>Tipologi:</strong> {TYPOLOGY_CONFIG[state.building.typology].label}</div>
                <div><strong>Luas Lantai Nett:</strong> {fmt(state.building.nla, 0)} m²</div>
                <div><strong>Penghuni Utama:</strong> {fmt(state.building.occupant1, 0)} orang</div>
                <div><strong>Penghuni Sekunder:</strong> {fmt(state.building.occupant2, 0)} orang</div>
                <div><strong>Jam Operasional:</strong> {fmt(state.building.opHours, 1)} jam/hari</div>
              </div>
            </div>
            <div style={{ background: C.lighter, borderRadius: 8, padding: 16 }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: C.heading }}>Hasil Akhir</h4>
              <div style={{ fontSize: 13, lineHeight: 1.8, color: C.body }}>
                <div><strong>Total Skor WAC:</strong> <span style={{ color: C.heading, fontWeight: 700 }}>{fmtFixed(totalScore, 1)} / {totalMax}</span></div>
                <div><strong>Persentase:</strong> <span style={{ color: C.accent, fontWeight: 700 }}>{fmtPct(totalPct)}</span></div>
                <div><strong>WAC 2 (Efisiensi):</strong> {fmtFixed(wac2Score, 1)} / {wac2Max}</div>
                <div><strong>WAC 1 (Konsumsi):</strong> {fmtFixed(wac1Score, 1)} / {wac1Max}</div>
                <div><strong>WAC P2 (Air Hujan):</strong> {p2Status === 'pass' ? 'LULUS' : p2Status === 'fail' ? 'BELUM TERPENUHI' : 'DATA BELUM LENGKAP'}</div>
                <div><strong>Unit Normalisasi:</strong> {tc.resultUnit}</div>
              </div>
            </div>
          </div>
        </DetailCard>
      )}

      {/* What-if Suggestions - Accordion Cards */}
      <DetailCard
        title="Peluang Perbaikan"
        icon={<Zap size={20} />}
        subtitle="Perubahan terkecil yang menaikkan poin"
        style={{ marginBottom: 16 }}
      >
        {/* WAC 1 What-if */}
        <details style={{ border: `1px solid ${C.line}`, borderRadius: 8, overflow: 'hidden', marginBottom: 12 }} open={whatIfOpen === 'wac1'} onToggle={() => setWhatIfOpen(whatIfOpen === 'wac1' ? null : 'wac1')}>
          <summary style={{
            padding: '14px 16px',
            background: C.lighter,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontWeight: 600,
            fontSize: 14,
            color: C.heading,
            listStyle: 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <BarChart3 size={18} style={{ color: C.brand }} />
              <span>WAC 1: Konsumsi Air Bangunan</span>
            </div>
            <span style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, color: whatIf.wac1.targetRatio === null ? C.success : C.accent }}>
              {whatIf.wac1.targetRatio === null ? 'Maksimum (8 poin)' : `Target: ${fmtFixed(whatIf.wac1.targetRatio, 2)} untuk ${whatIf.wac1.targetPts} poin`}
            </span>
          </summary>
          <div style={{ padding: '16px', background: '#fff' }}>
            {whatIf.wac1.targetRatio === null ? (
              <div style={{ fontSize: 13, color: C.successInk }}>Sudah di skor maksimum (8 poin).</div>
            ) : (
              <div style={{ fontSize: 13, lineHeight: 1.7, color: C.body }}>
                <div>
                  Rasio desain saat ini: <strong>{fmtFixed(whatIf.wac1.currentRatio, 3)}</strong> → perlu{' '}
                  <strong>{fmtFixed(whatIf.wac1.targetRatio, 2)}</strong> untuk {whatIf.wac1.targetPts} poin.
                </div>
                <div style={{ marginTop: 6 }}>
                  Kurangi <strong>{fmt(whatIf.wac1.reductionLpd, 0)} L/hari</strong> ({fmtPct(whatIf.wac1.reductionPct)} dari suplai primer).
                </div>
                <div style={{ marginTop: 12, padding: 12, background: C.infoBg, borderRadius: 8, border: `1px solid ${C.info}`, fontSize: 12, color: C.infoInk }}>
                  <strong>Saran:</strong> Fokus pada peralatan dengan konsumsi tertinggi (biasanya Flushing WC & Keran). 
                  Pertimbangkan ganti ke peralatan dengan rating WELS lebih tinggi atau kurangi frekuensi penggunaan melalui sensor/otomatisasi.
                </div>
              </div>
            )}
          </div>
        </details>

        {/* WAC 2 What-if */}
        <details style={{ border: `1px solid ${C.line}`, borderRadius: 8, overflow: 'hidden' }} open={whatIfOpen === 'wac2'} onToggle={() => setWhatIfOpen(whatIfOpen === 'wac2' ? null : 'wac2')}>
          <summary style={{
            padding: '14px 16px',
            background: C.lighter,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontWeight: 600,
            fontSize: 14,
            color: C.heading,
            listStyle: 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Award size={18} style={{ color: C.cta }} />
              <span>WAC 2: Efisiensi Peralatan</span>
            </div>
            <span style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, color: whatIf.wac2.length === 0 ? C.success : C.warning }}>
              {whatIf.wac2.length === 0 ? 'Semua Efisien' : `${whatIf.wac2.length} tipe di atas baseline`}
            </span>
          </summary>
          <div style={{ padding: '16px', background: '#fff' }}>
            {whatIf.wac2.length === 0 ? (
              <div style={{ fontSize: 13, color: C.successInk }}>Semua peralatan sudah pada atau di bawah baseline.</div>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6, color: C.body }}>
                {whatIf.wac2.map(o => (
                  <li key={o.type} style={{ marginBottom: 8 }}>
                    <strong>{o.label}</strong>: rata-rata <strong>{fmtFixed(o.avgRate, 1)}</strong> → baseline <strong>{fmtFixed(o.baseline, 1)}</strong> {o.unit}
                    {' '}pada <strong>{fmt(o.unitsAbove, 0)}</strong> unit
                    {o.ptsGain > 0 ? ` → <strong style={{color: C.success}}>+${o.ptsGain} poin WAC 2</strong>` : ' (perbaikan tidak menambah poin langsung)'}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>
      </DetailCard>
    </div>
  );
}

// ─── Notification Component ───
function Notif({ type, msgs, onClose }: { type: 'ok' | 'err' | 'warn'; msgs: string[]; onClose: () => void }) {
  return (
    <div className={`notif notif-${type === 'ok' ? 'success' : type === 'err' ? 'error' : 'warning'}`} role="alert">
      <div style={{ flex: 1 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ marginBottom: i < msgs.length - 1 ? 6 : 0 }}>{m}</div>
        ))}
      </div>
      <button onClick={onClose} type="button" style={{
        background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer',
        fontSize: 18, lineHeight: 1, padding: 0, opacity: 0.7,
      }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}>
        ×
      </button>
    </div>
  );
}

// ─── Completeness banner ───
function IssueBanner({ issues, onJump }: { issues: ValidationIssue[]; onJump: (step: number) => void }) {
  if (issues.length === 0) return null;
  const errors = issues.filter(i => i.level === 'error');
  const shown = issues.slice(0, 4);
  const tone = errors.length > 0
    ? { bg: C.dangerBg, line: C.dangerLine, ink: C.dangerInk }
    : { bg: C.warningBg, line: C.warningLine, ink: C.warningInk };

  return (
    <div
      className="no-print"
      style={{ background: tone.bg, border: `1px solid ${tone.line}`, color: tone.ink, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, marginBottom: 6 }}>
        <AlertTriangle size={15} />
        {errors.length > 0 ? `${errors.length} hal wajib dilengkapi` : 'Beberapa data belum lengkap'}
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.55 }}>
        {shown.map((issue, i) => (
          <li key={i}>
            {issue.message}{' '}
            <button
              type="button"
              onClick={() => onJump(issue.step)}
              style={{ background: 'none', border: 0, padding: 0, color: 'inherit', textDecoration: 'underline', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
            >
              Langkah {issue.step}
            </button>
          </li>
        ))}
        {issues.length > shown.length && (
          <li style={{ listStyle: 'none', opacity: 0.8 }}>+{issues.length - shown.length} lainnya</li>
        )}
      </ul>
    </div>
  );
}

// ─── Sidebar ───
function Sidebar({ step, setStep, R, state,
  onImportJSON, onExportJSON, onResetAll,
  open, onClose }:
  { step: number; setStep: (n: number) => void; R: ReturnType<typeof calcAll>;
    state: AppState; onImportJSON: () => void;
    onExportJSON: () => void; onResetAll: () => void;
    open: boolean; onClose: () => void }) {
  const { isDesktop } = useBreakpoint();

  const inner = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 20px', overflowY: 'auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.accentLight, marginBottom: 4 }}>
          GREENSHIP NB v1.3
        </div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 400, lineHeight: 1.2, color: '#fff' }}>
          Kalkulator Air
        </div>
        {state.building.name && (
          <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: C.accentLight, marginTop: 8, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            {state.building.name}
          </div>
        )}
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 24 }}>
        {STEPS.map(s => {
          const active = step === s.id, done = step > s.id, Ic = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => { setStep(s.id); if (!isDesktop) onClose(); }}
              type="button"
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', padding: '12px 14px',
                borderRadius: 8, border: 0,
                background: active ? '#fff' : done ? 'transparent' : 'transparent',
                color: active ? C.heading : done ? C.accentLight : '#fff',
                fontFamily: 'var(--sans)', fontSize: 14, fontWeight: active ? 600 : 500,
                textAlign: 'left', cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              }}
              onMouseLeave={e => {
                if (!active) e.currentTarget.style.background = done ? 'transparent' : 'transparent';
              }}
            >
              <Ic size={15} style={{ color: active ? C.heading : done ? C.accent : '#fff' }} />
              <span>{s.label}</span>
              {done && <CheckCircle2 size={12} style={{ color: C.accent }} />}
            </button>
          );
        })}
      </nav>
      <div style={{
        background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, marginBottom: 24
      }}>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.accentLight, marginBottom: 12 }}>
          Nilai Sementara
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { l: 'WAC 2', v: R.wac2.pts, mx: '/3' },
            { l: 'WAC 1', v: R.wac1.pts, mx: '/8' },
            { l: 'WAC P2', v: R.wac1.p2Pass ? '✓' : '—', mx: '' },
          ].map(({ l, v, mx }) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 600, color: '#fff', lineHeight: 1 }}>{v}</div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 11, color: C.accentLight, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}{mx}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.accentLight, marginBottom: 12 }}>
          Data Proyek
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          <button type="button" onClick={onImportJSON} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '10px 14px', borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.2)', background: 'transparent',
            color: '#fff', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s',
          }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}>
            <Upload size={12} /> Impor JSON
          </button>
          <button type="button" onClick={onExportJSON} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '10px 14px', borderRadius: 8,
            background: C.cta, border: `1px solid ${C.cta}`,
            color: C.ctaText, fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'background 0.15s',
          }} onMouseEnter={e => e.currentTarget.style.background = C.ctaHover} onMouseLeave={e => e.currentTarget.style.background = C.cta}>
            <Download size={12} /> Ekspor JSON
          </button>
          <button type="button" onClick={onResetAll} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '10px 14px', borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.2)', background: 'transparent',
            color: '#fff', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s',
          }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}>
            <Trash2 size={12} /> Reset Data
          </button>
        </div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 11, color: C.accentLight, marginTop: 12, opacity: 0.7 }}>
          Format data proyek yang didukung: JSON
        </div>
      </div>
      <div style={{ fontFamily: 'var(--sans)', fontSize: 11, color: C.accentLight, opacity: 0.5, marginTop: 'auto' }}>
        Pilot: KANTOR · Phase 1
      </div>
    </div>
  );

  if (isDesktop) return <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 280, background: C.heading, color: '#fff', zIndex: 40, display: 'flex', flexDirection: 'column' }}>{inner}</div>;
  if (!open) return null;
  return (
    <>
      <button aria-label="Tutup menu" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 35, border: 'none' }} onClick={onClose} type="button" />
      <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 280, background: C.heading, color: '#fff', zIndex: 40, display: 'flex', flexDirection: 'column' }}>{inner}</div>
    </>
  );
}

// ─── Main App ───
// Tipologi selector is driven by the engine config, so the label can never
// disagree with the constants actually used in the calculation.
const SCHEME_STEPS = [1, 2, 3, 4, 5, 6];
function buildSchemes() {
  return (Object.keys(TYPOLOGY_CONFIG) as TypologyId[]).map(id => {
    const cfg = TYPOLOGY_CONFIG[id];
    return {
      id,
      label: cfg.label,
      icon: <Building2 size={18} />,
      steps: SCHEME_STEPS,
      disabled: !cfg.active,
      note: cfg.active ? 'Aktif — Phase 1' : (cfg.note ?? `Phase ${cfg.phase}`),
    };
  });
}

export default function App() {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<AppState>(createDefaultState());
  const [notif, setNotif] = useState<{ type: 'ok' | 'err' | 'warn'; msgs: string[] } | null>(null);

  const R = useMemo(() => calcAll(state), [state]);
  const issues = useMemo(() => collectIssues(state), [state]);
  const schemes = useMemo(buildSchemes, []);

  // ── Undo history — throttled so a burst of typing is one step, not one per key ──
  const historyRef = useRef<AppState[]>([]);
  const lastStateRef = useRef<AppState>(state);
  const lastPushRef = useRef(0);
  const undoingRef = useRef(false);
  const [historyDepth, setHistoryDepth] = useState(0);

  useEffect(() => {
    if (undoingRef.current) {
      undoingRef.current = false;
      lastStateRef.current = state;
      return;
    }
    const prev = lastStateRef.current;
    if (prev !== state) {
      const now = Date.now();
      if (historyRef.current.length === 0 || now - lastPushRef.current > 400) {
        historyRef.current.push(prev);
        if (historyRef.current.length > 30) historyRef.current.shift();
        lastPushRef.current = now;
        setHistoryDepth(historyRef.current.length);
      }
    }
    lastStateRef.current = state;
  }, [state]);

  const handleUndo = useCallback(() => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    undoingRef.current = true;
    setState(prev);
    setHistoryDepth(historyRef.current.length);
  }, []);

  const resetHistory = useCallback(() => {
    historyRef.current = [];
    setHistoryDepth(0);
  }, []);

  const showNotif = useCallback((type: 'ok' | 'err' | 'warn', msgs: string[]) => {
    setNotif({ type, msgs });
    window.setTimeout(() => setNotif(null), 6000);
  }, []);

  const handleSchemeChange = useCallback((id: string) => {
    const cfg = TYPOLOGY_CONFIG[id as TypologyId];
    if (!cfg) return;
    if (!cfg.active) {
      showNotif('warn', [`Tipologi ${cfg.label} belum aktif (${cfg.note ?? `Phase ${cfg.phase}`}).`]);
      return;
    }
    setState(s => ({ ...s, building: { ...s.building, typology: id as TypologyId } }));
  }, [showNotif]);

  const handleImport = useCallback(async () => {
    try {
      const raw = await pickJSONFile();
      const res = parseAndValidate(raw);
      if (res.ok) {
        setState(res.state);
        setStep(1);
        showNotif('ok', ['Data JSON berhasil diimpor.']);
      } else {
        showNotif('err', res.errors);
      }
    } catch (e: unknown) {
      showNotif('err', [e instanceof Error ? e.message : 'Gagal membaca file JSON.']);
    }
  }, [showNotif]);

  const handleExport = useCallback(() => {
    downloadJSON(state);
    showNotif('ok', ['Data JSON berhasil diekspor.']);
  }, [state, showNotif]);

  // Step components
  const stepContent = useMemo(() => [
    <Step1 key={1} state={state} set={setState} />,
    <Step2 key={2} state={state} set={setState} />,
    <Step3 key={3} state={state} set={setState} />,
    <Step4 key={4} state={state} set={setState} R={R} />,
    <Step5 key={5} state={state} set={setState} R={R} />,
    <Step6 key={6} state={state} />,
  ], [state]);

  const wac2Max = 3;
  const wac1Result = { savingsPct: R.wac1.savingsPct * 100, pts: R.wac1.pts };
  const wac2Result = { pct: (R.wac2.pts / wac2Max) * 100, pts: R.wac2.pts };

  return (
    <AppShell
      currentStep={step}
      onStepChange={setStep}
      schemeId={state.building.typology}
      schemeLabel={TYPOLOGY_CONFIG[state.building.typology].label}
      onSchemeChange={handleSchemeChange}
      issueCount={issues.length}
      onUndo={handleUndo}
      canUndo={historyDepth > 0}
      savedAt={null}
      wac1Result={wac1Result}
      wac2Result={wac2Result}
      onImport={handleImport}
      onExport={handleExport}
    >
      {notif && <Notif type={notif.type} msgs={notif.msgs} onClose={() => setNotif(null)} />}
      <div style={{ maxWidth: 1170, margin: '0 auto' }}>
        <IssueBanner issues={issues} onJump={setStep} />
        {stepContent[step - 1]}
      </div>
    </AppShell>
  );
}