import React, { useState, useMemo, useCallback } from 'react';
import {
  Building2, Droplets, Leaf, CloudRain, Recycle,
  BarChart3, ChevronRight, ChevronLeft, Award,
  Download, Upload, AlertCircle, CheckCircle2, X,
  Plus, Trash2, Menu,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import type { AppState, FixtureTypeId } from './types';
import { TYPOLOGY_CONFIG } from './constants/typologies';
import { FIXTURE_AVAILABILITY } from './constants/baselines';
import { calcAll, calcWAC2, lsShareSum } from './engine/calculations';
import { downloadJSON, pickJSONFile, parseAndValidate } from './utils/importExport';
import { DEFAULT_STATE } from './utils/defaults';
import {
  C, fmt, fmtPct, useBreakpoint,
  Label, Inp, Sel, Card, SecTitle, Pill, Tog, Check, PctInp,
} from './components/shared/atoms';
import { FixtureSection } from './components/shared/FixtureSection';

// ─── Wizard steps config ──────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Data Bangunan',     short: 'Bangunan',  icon: Building2 },
  { id: 2, label: 'Fitur Air (WAC 2)', short: 'WF',        icon: Droplets  },
  { id: 3, label: 'Lansekap & CT',     short: 'Lansekap',  icon: Leaf      },
  { id: 4, label: 'Air Hujan (WAC 6)', short: 'Air Hujan', icon: CloudRain },
  { id: 5, label: 'Daur Ulang Air',    short: 'Recycle',   icon: Recycle   },
  { id: 6, label: 'Hasil WAC',         short: 'Hasil',     icon: BarChart3 },
];

// ─── Notification banner ──────────────────────────────────────────────────────
function Notif({ type, msgs, onClose }: { type: 'ok' | 'err' | 'warn'; msgs: string[]; onClose: () => void }) {
  const colors = {
    ok:   { bg: '#F0FDF4', border: '#86EFAC', text: '#15803D', Icon: CheckCircle2 },
    err:  { bg: '#FEF2F2', border: '#FCA5A5', text: C.red,     Icon: AlertCircle  },
    warn: { bg: '#FFF7ED', border: '#FCD34D', text: '#D97706', Icon: AlertCircle  },
  }[type];
  const { Icon } = colors;
  return (
    <div style={{
      position: 'fixed', top: 16, right: 16, zIndex: 9999, maxWidth: 400,
      background: colors.bg, border: `1px solid ${colors.border}`,
      borderRadius: 10, padding: '12px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <Icon size={16} style={{ color: colors.text, flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ fontSize: 13, color: colors.text, marginBottom: i < msgs.length - 1 ? 4 : 0 }}>{m}</div>
          ))}
        </div>
        <button onClick={onClose} style={{ color: C.s400, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Step 1: Building Data ────────────────────────────────────────────────────
function Step1({ state, set }: { state: AppState; set: (s: AppState) => void }) {
  const upd = (k: keyof AppState['building'], v: string | number) =>
    set({ ...state, building: { ...state.building, [k]: v } });
  const tc = TYPOLOGY_CONFIG[state.building.typology];
  const { isMobile } = useBreakpoint();

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'grid', gap: 16 }}>
      <Card>
        <SecTitle icon={Building2}>Data Dasar Bangunan</SecTitle>
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <Label>Nama Bangunan / Proyek</Label>
            <Inp type="text" value={state.building.name} onChange={v => upd('name', v)} placeholder="Contoh: Gedung Kantor A" />
          </div>
          <div>
            <Label>Tipologi Bangunan</Label>
            <Sel
              value={state.building.typology}
              onChange={v => set({ ...DEFAULT_STATE, building: { ...DEFAULT_STATE.building, typology: v as AppState['building']['typology'], name: state.building.name } })}
              options={Object.entries(TYPOLOGY_CONFIG).map(([k, v]) => ({
                value: k,
                label: v.label + (v.note ? ` — ${v.note}` : '') + (!v.active ? ' (segera hadir)' : ''),
                disabled: !v.active,
              }))}
            />
            {tc.note && <div style={{ fontSize: 11, color: C.amber, marginTop: 4 }}>⚠ {tc.note}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
            <div>
              <Label unit="m²">Net Lettable Area (NLA)</Label>
              <Inp value={state.building.nla || ''} onChange={v => upd('nla', v)} step={0.001} />
            </div>
            <div>
              <Label unit="orang">{tc.occupant1Label}</Label>
              <Inp value={state.building.occupant1 || ''} onChange={v => upd('occupant1', v)} step={1} />
            </div>
          </div>

          {tc.isFactory && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3,1fr)', gap: 10 }}>
              {([1, 2, 3] as const).map(s => (
                <div key={s}>
                  <Label unit="orang">Shift {s}</Label>
                  <Inp
                    value={state.factory[`shift${s}` as 'shift1' | 'shift2' | 'shift3'] || ''}
                    onChange={v => set({ ...state, factory: { ...state.factory, [`shift${s}`]: v as number } })}
                    step={1}
                  />
                </div>
              ))}
            </div>
          )}

          {tc.isFactory && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
              <div>
                <Label unit="%">Porsi Laki-laki</Label>
                <Inp
                  value={parseFloat((state.factory.malePct * 100).toFixed(3))}
                  onChange={v => set({ ...state, factory: { ...state.factory, malePct: Math.min(100, Math.max(0, v as number)) / 100 } })}
                  step={0.001} min={0} max={100}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 1 }}>
                <div style={{ padding: '7px 12px', background: C.s100, borderRadius: 8, fontSize: 13, color: C.s500 }}>
                  ♀ Perempuan: <strong style={{ color: C.teal }}>{(100 - state.factory.malePct * 100).toFixed(3)}%</strong>
                </div>
              </div>
            </div>
          )}

          <div>
            <Label unit="jam/hari">Jam Operasional</Label>
            <Inp value={state.building.opHours || ''} onChange={v => upd('opHours', v)} step={0.001} min={1} max={24} />
          </div>
        </div>
      </Card>

      {state.building.occupant1 > 0 && (
        <Card style={{ background: '#F0FDF4', borderColor: '#86EFAC' }}>
          <SecTitle>Parameter Konstanta — {tc.label}</SecTitle>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3,1fr)', gap: 10 }}>
            <Pill val={`${tc.wcMale} / ${tc.wcFemale}`} label="WC pakai/hari ♂/♀" />
            <Pill val={tc.tapUsage} label="Tap pakai/hari" />
            <Pill val={tc.resultUnit} label="Satuan Hasil WAC 1" />
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Step 2: Water Fixtures (WAC 2) ──────────────────────────────────────────
function Step2({ state, set }: { state: AppState; set: (s: AppState) => void }) {
  const typology = state.building.typology;
  const available = FIXTURE_AVAILABILITY[typology] ?? FIXTURE_AVAILABILITY.KANTOR;
  const wac2 = useMemo(() => calcWAC2(state.fixtures), [state.fixtures]);
  const { isMobile, isTablet } = useBreakpoint();
  const stacked = isMobile || isTablet;

  const updFixture = (type: FixtureTypeId, products: AppState['fixtures'][typeof type]) =>
    set({ ...state, fixtures: { ...state.fixtures, [type]: products } });

  const WAC2Panel = (
    <Card style={stacked ? {} : { position: 'sticky', top: 72 }}>
      <SecTitle icon={Award}>Nilai WAC 2 (Live)</SecTitle>
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: C.teal, lineHeight: 1 }}>{wac2.pts}</div>
        <div style={{ fontSize: 13, color: C.s500 }}>dari 3 poin (NB 1.3)</div>
      </div>
      <div style={{ background: C.s100, borderRadius: 6, height: 8, overflow: 'hidden', margin: '8px 0 16px' }}>
        <div style={{ height: '100%', background: C.teal, borderRadius: 6, width: `${(wac2.pts / 3) * 100}%`, transition: '0.4s' }} />
      </div>
      {[
        ['Total WF terdaftar', wac2.total, C.s800],
        ['WF Hemat (≤ baseline)', wac2.hemat, C.green],
        ['% WF Hemat', fmtPct(wac2.pct), C.teal],
      ].map(([label, val, color]) => (
        <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${C.s100}` }}>
          <span style={{ fontSize: 12, color: C.s500 }}>{label}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: color as string }}>{val}</span>
        </div>
      ))}
      <div style={{ marginTop: 12, padding: 10, background: C.s100, borderRadius: 8 }}>
        <div style={{ fontSize: 10, color: C.s500, lineHeight: 1.8 }}>
          ≥ 25% → 1 poin<br />≥ 50% → 2 poin<br />≥ 75% → 3 poin<br />
          <span style={{ color: C.s300 }}>Standar: GREENSHIP NB 1.3</span>
        </div>
      </div>
    </Card>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: stacked ? '1fr' : '1fr 260px', gap: 18, alignItems: 'start' }}>
      <div>
        {stacked && <div style={{ marginBottom: 16 }}>{WAC2Panel}</div>}

        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <SecTitle icon={Droplets}>WF Flush</SecTitle>
            <Tog on={state.hasUrinal} onChange={v => set({ ...state, hasUrinal: v })} label="Ada Urinal" />
          </div>
          {(['WC_FLUSH_VALVE', 'WC_FLUSH_TANK', ...(state.hasUrinal ? ['URINAL'] : [])] as FixtureTypeId[])
            .filter(t => available.includes(t))
            .map(t => (
              <FixtureSection key={t} type={t} products={state.fixtures[t]} onChange={p => updFixture(t, p)} />
            ))}
          <div style={{ borderTop: `1px solid ${C.s200}`, paddingTop: 12, marginTop: 4 }}>
            <PctInp
              value={state.wcRecyclePct}
              onChange={v => set({ ...state, wcRecyclePct: v })}
              label="% Flush WC dari air daur ulang / alternatif"
            />
          </div>
        </Card>

        <Card>
          <SecTitle icon={Droplets}>WF Tap &amp; Shower</SecTitle>
          {(['KERAN_TEMBOK', 'KERAN_WASTAFEL', 'KERAN_WUDHU', 'SHOWER'] as FixtureTypeId[])
            .filter(t => available.includes(t))
            .map(t => (
              <FixtureSection key={t} type={t} products={state.fixtures[t]} onChange={p => updFixture(t, p)} />
            ))}
          <div style={{ borderTop: `1px solid ${C.s200}`, paddingTop: 12, marginTop: 4 }}>
            <PctInp
              value={state.showerRecyclePct}
              onChange={v => set({ ...state, showerRecyclePct: v })}
              label="% Shower dari air daur ulang / alternatif"
            />
          </div>
        </Card>
      </div>

      {!stacked && WAC2Panel}
    </div>
  );
}

// ─── Step 3: Landscape & CT ───────────────────────────────────────────────────
function Step3({ state, set }: { state: AppState; set: (s: AppState) => void }) {
  const ls = state.landscape;
  const ct = state.coolingTower;
  const shareSum = lsShareSum(ls.zones);
  const shareOk = Math.abs(shareSum - 1) < 0.001;
  const isFactory = TYPOLOGY_CONFIG[state.building.typology].isFactory;
  const { isMobile } = useBreakpoint();

  const updZone = (i: number, field: string, val: string | number) => {
    const zones = ls.zones.map((z, j) => j === i ? { ...z, [field]: val } : z);
    set({ ...state, landscape: { ...ls, zones } });
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', display: 'grid', gap: 16 }}>
      <Card>
        <SecTitle icon={Leaf}>Lansekap / Irigasi</SecTitle>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <Label unit="m²">Luas lansekap dengan irigasi</Label>
            <Inp value={ls.area || ''} onChange={v => set({ ...state, landscape: { ...ls, area: v as number } })} step={0.001} />
          </div>
          <PctInp
            value={ls.pctFromNonPrimary}
            onChange={v => set({ ...state, landscape: { ...ls, pctFromNonPrimary: v } })}
            label="% Kebutuhan dari non-sumber utama"
          />
        </div>

        {/* Zone table — responsive */}
        {isMobile ? (
          ls.zones.map((z, i) => (
            <div key={i} style={{ border: `1px solid ${C.s200}`, borderRadius: 8, padding: 12, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Inp type="text" value={z.label} onChange={v => updZone(i, 'label', v)} placeholder={`Area ${i + 1}`} style={{ flex: 1, marginRight: 8 }} />
                {i > 0 && <button onClick={() => set({ ...state, landscape: { ...ls, zones: ls.zones.filter((_, j) => j !== i) } })}
                  style={{ color: C.s300, background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={13} /></button>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div><Label>Baseline (L/m²)</Label><Inp value={z.basRate || ''} onChange={v => updZone(i, 'basRate', v)} step={0.001} /></div>
                <div><Label>Desain (L/m²)</Label><Inp value={z.dsgRate || ''} onChange={v => updZone(i, 'dsgRate', v)} step={0.001} /></div>
                <div><Label>% Area</Label><Inp value={parseFloat(((z.areaShare || 0) * 100).toFixed(3)) || ''} onChange={v => updZone(i, 'areaShare', Math.min(1, (v as number) / 100))} step={0.001} /></div>
              </div>
            </div>
          ))
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 90px 32px', gap: 5, marginBottom: 5 }}>
              {['Zona', 'Baseline (L/m²)', 'Desain (L/m²)', '% Area', ''].map(h => (
                <div key={h} style={{ fontSize: 10, color: C.s300 }}>{h}</div>
              ))}
            </div>
            {ls.zones.map((z, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 90px 32px', gap: 5, marginBottom: 6, alignItems: 'center' }}>
                <Inp type="text" value={z.label} onChange={v => updZone(i, 'label', v)} placeholder={`Area ${i + 1}`} />
                <Inp value={z.basRate || ''} onChange={v => updZone(i, 'basRate', v)} step={0.001} />
                <Inp value={z.dsgRate || ''} onChange={v => updZone(i, 'dsgRate', v)} step={0.001} />
                <Inp value={parseFloat(((z.areaShare || 0) * 100).toFixed(3)) || ''} onChange={v => updZone(i, 'areaShare', Math.min(1, (v as number) / 100))} step={0.001} />
                {i > 0
                  ? <button onClick={() => set({ ...state, landscape: { ...ls, zones: ls.zones.filter((_, j) => j !== i) } })}
                      style={{ color: C.s300, background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={13} /></button>
                  : <div />}
              </div>
            ))}
          </>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
          {ls.zones.length < 5 && (
            <button
              onClick={() => set({ ...state, landscape: { ...ls, zones: [...ls.zones, { label: `Area ${ls.zones.length + 1}`, basRate: 5, dsgRate: 0, areaShare: 0 }] } })}
              style={{ fontSize: 12, color: C.teal, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Plus size={11} /> Tambah Zona
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ color: C.s500 }}>Total area share:</span>
            <span style={{ fontWeight: 700, color: shareOk ? C.green : C.red }}>{(shareSum * 100).toFixed(3)}%</span>
            {!shareOk && <span style={{ color: C.red }}>— harus tepat 100%</span>}
          </div>
        </div>
      </Card>

      <Card>
        <SecTitle>Cooling Tower</SecTitle>
        <div style={{ marginBottom: 14 }}>
          <Tog on={ct.enabled} onChange={v => set({ ...state, coolingTower: { ...ct, enabled: v } })} label="Menggunakan Cooling Tower (make-up water)" />
        </div>
        {ct.enabled && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
            <div>
              <Label unit="TR">Beban Pendinginan</Label>
              <Inp value={ct.load || ''} onChange={v => set({ ...state, coolingTower: { ...ct, load: v as number } })} step={0.001} />
            </div>
            <PctInp
              value={ct.pctFromNonPrimary}
              onChange={v => set({ ...state, coolingTower: { ...ct, pctFromNonPrimary: v } })}
              label="% dari non-sumber utama"
            />
          </div>
        )}
      </Card>

      {isFactory && (
        <Card>
          <SecTitle>Peralatan Proses (Factory Only)</SecTitle>
          {isMobile ? (
            state.factory.equipment.map((e, i) => (
              <div key={i} style={{ border: `1px solid ${C.s200}`, borderRadius: 8, padding: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.s700 }}>Peralatan {i + 1}</span>
                  <button onClick={() => set({ ...state, factory: { ...state.factory, equipment: state.factory.equipment.filter((_, j) => j !== i) } })}
                    style={{ color: C.s300, background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={13} /></button>
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div><Label>Nama</Label><Inp type="text" value={e.name} onChange={v => { const eq = [...state.factory.equipment]; eq[i] = { ...e, name: v as string }; set({ ...state, factory: { ...state.factory, equipment: eq } }); }} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div><Label>Qty</Label><Inp value={e.qty || ''} step={1} onChange={v => { const eq = [...state.factory.equipment]; eq[i] = { ...e, qty: v as number }; set({ ...state, factory: { ...state.factory, equipment: eq } }); }} /></div>
                    <div><Label unit="L/hari">Keluaran/Unit</Label><Inp value={e.outputPerUnit || ''} step={0.001} onChange={v => { const eq = [...state.factory.equipment]; eq[i] = { ...e, outputPerUnit: v as number }; set({ ...state, factory: { ...state.factory, equipment: eq } }); }} /></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 130px 32px', gap: 5, marginBottom: 5 }}>
                {['Nama Beban Air', 'Qty', 'Keluaran/Unit (L/hari)', ''].map(h => (
                  <div key={h} style={{ fontSize: 10, color: C.s300 }}>{h}</div>
                ))}
              </div>
              {state.factory.equipment.map((e, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 130px 32px', gap: 5, marginBottom: 6, alignItems: 'center' }}>
                  <Inp type="text" value={e.name} onChange={v => { const eq = [...state.factory.equipment]; eq[i] = { ...e, name: v as string }; set({ ...state, factory: { ...state.factory, equipment: eq } }); }} />
                  <Inp value={e.qty || ''} step={1} onChange={v => { const eq = [...state.factory.equipment]; eq[i] = { ...e, qty: v as number }; set({ ...state, factory: { ...state.factory, equipment: eq } }); }} />
                  <Inp value={e.outputPerUnit || ''} step={0.001} onChange={v => { const eq = [...state.factory.equipment]; eq[i] = { ...e, outputPerUnit: v as number }; set({ ...state, factory: { ...state.factory, equipment: eq } }); }} />
                  <button onClick={() => set({ ...state, factory: { ...state.factory, equipment: state.factory.equipment.filter((_, j) => j !== i) } })}
                    style={{ color: C.s300, background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={13} /></button>
                </div>
              ))}
            </>
          )}
          <button
            onClick={() => set({ ...state, factory: { ...state.factory, equipment: [...state.factory.equipment, { name: '', qty: 1, outputPerUnit: 0 }] } })}
            style={{ fontSize: 12, color: C.teal, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Plus size={11} /> Tambah Peralatan
          </button>
        </Card>
      )}
    </div>
  );
}

// ─── Step 4: Rainwater Harvesting ─────────────────────────────────────────────
function Step4({ state, set }: { state: AppState; set: (s: AppState) => void }) {
  const rw = state.rainwater;
  const updRW = (k: keyof typeof rw, v: boolean | number) =>
    set({ ...state, rainwater: { ...rw, [k]: v } });
  const results = useMemo(() => calcAll(state), [state]);
  const { isMobile } = useBreakpoint();

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'grid', gap: 16 }}>
      <Card>
        <SecTitle icon={CloudRain}>Pemanenan Air Hujan (WAC 6)</SecTitle>
        <div style={{ marginBottom: 14 }}>
          <Tog on={rw.hasTank} onChange={v => updRW('hasTank', v)} label="Terdapat tanki penyimpanan air hujan" />
        </div>
        {rw.hasTank && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
            <div>
              <Label unit="Liter">Kapasitas tanki direncanakan</Label>
              <Inp value={rw.tankCapacity || ''} onChange={v => updRW('tankCapacity', v as number)} step={0.001} />
            </div>
            <div>
              <Label unit="mm">Rata-rata Curah Hujan</Label>
              <Inp value={rw.avgRainfall || ''} onChange={v => updRW('avgRainfall', v as number)} step={0.001} />
            </div>
            <div>
              <Label>Koefisien Limpasan (C)</Label>
              <Inp value={rw.runoffCoef || ''} onChange={v => updRW('runoffCoef', v as number)} step={0.001} min={0} max={1} />
            </div>
            <div>
              <Label unit="m²">Luas Atap Penampungan</Label>
              <Inp value={rw.roofArea || ''} onChange={v => updRW('roofArea', v as number)} step={0.001} />
            </div>
            <div style={{ gridColumn: isMobile ? '1' : '1/-1' }}>
              <div style={{ fontWeight: 600, fontSize: 12, color: C.s500, marginBottom: 8 }}>Penyaluran Air Hujan Untuk:</div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <Check checked={rw.useForFlush} onChange={v => updRW('useForFlush', v)} label="Flushing WC" />
                <Check checked={rw.useForIrrigation} onChange={v => updRW('useForIrrigation', v)} label="Irigasi Lansekap" />
                <Check checked={rw.useForCT} onChange={v => updRW('useForCT', v)} label="Cooling Tower" />
              </div>
            </div>
          </div>
        )}
      </Card>

      {rw.hasTank && rw.tankCapacity > 0 && (
        <Card style={{ background: C.blueBg, borderColor: '#BFDBFE' }}>
          <SecTitle>Hasil Kalkulasi Air Hujan</SecTitle>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
            <Pill val={fmt(results.rainwater.idealVolume, 0)} label="Volume Ideal Tanki" unit="Liter" accent={C.blue} />
            <Pill val={fmtPct(results.rainwater.capRatio)} label="Rasio Penampungan" accent={C.blue} />
            <Pill val={fmt(results.rainwater.availWet, 0)} label="Tersedia (hari hujan)" unit="L/hari" accent={C.blue} />
          </div>
          <div style={{ background: '#DBEAFE', borderRadius: 6, height: 10, overflow: 'hidden' }}>
            <div style={{ background: C.blue, height: '100%', borderRadius: 6, width: `${Math.min(100, results.rainwater.capRatio * 100)}%`, transition: '0.4s' }} />
          </div>
          <div style={{ fontSize: 11, color: C.blue, marginTop: 6 }}>
            Volume ideal = Luas Atap × Rata-rata Curah Hujan × Koefisien Limpasan
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Step 5: Water Recycle + Neraca Air Validation ────────────────────────────
function Step5({ state, set }: { state: AppState; set: (s: AppState) => void }) {
  const rc = state.waterRecycle;
  const upd = (k: keyof typeof rc, v: boolean | number) =>
    set({ ...state, waterRecycle: { ...rc, [k]: v } });
  const R = useMemo(() => calcAll(state), [state]);
  const d = R.daily;
  const { isMobile } = useBreakpoint();

  // ── Neraca Air validation ────────────────────────────────────────────────
  type Flag = { type: 'ok' | 'err' | 'warn'; msg: string };
  const flags: Flag[] = useMemo(() => {
    if (!rc.hasSystem) return [];
    const out: Flag[] = [];

    // 1. Capacity check
    if (!rc.capacity || rc.capacity <= 0) {
      out.push({ type: 'err', msg: 'Kapasitas sistem daur ulang belum diisi (harus > 0).' });
    }

    // 2. Source selection
    const totalSourcesRaw =
      (rc.sourcesTap ? d.tembokDsg + d.wastafelDsg : 0) +
      (rc.sourcesWudhu ? d.wudhuDsg : 0) +
      (rc.sourcesShower ? d.showerDsg : 0) +
      (rc.sourcesRainwater ? R.rainwater.availWet : 0) +
      (rc.sourcesAHU || 0) +
      (rc.sourcesOthers || 0);

    if (totalSourcesRaw <= 0) {
      out.push({ type: 'err', msg: 'Tidak ada sumber air recycle yang dipilih atau tersedia.' });
    }

    // 3. Usage selection
    const totalNeed =
      (rc.useForFlush ? d.flushDsg : 0) +
      (rc.useForIrrigation ? d.lsDsg : 0) +
      (rc.useForCT ? d.ctDsg : 0);

    if (totalNeed <= 0 && rc.capacity > 0) {
      out.push({ type: 'warn', msg: 'Tidak ada penggunaan air recycle yang dipilih.' });
    }

    // 4. Supply vs demand
    const effectiveAvail = Math.min(rc.capacity || 0, totalSourcesRaw);
    if (totalSourcesRaw > 0 && rc.capacity > 0 && totalNeed > 0) {
      if (rc.capacity < totalSourcesRaw) {
        out.push({
          type: 'warn',
          msg: `Kapasitas sistem (${fmt(rc.capacity, 0)} L/hari) < total sumber tersedia (${fmt(totalSourcesRaw, 0)} L/hari). Kapasitas menjadi batas efektif.`,
        });
      }
      if (effectiveAvail < totalNeed) {
        out.push({
          type: 'err',
          msg: `Neraca TIDAK SEIMBANG — Tersedia: ${fmt(effectiveAvail, 0)} L/hari, Kebutuhan: ${fmt(totalNeed, 0)} L/hari. Selisih: ${fmt(totalNeed - effectiveAvail, 0)} L/hari.`,
        });
      } else {
        out.push({
          type: 'ok',
          msg: `Neraca SEIMBANG — ${fmt(effectiveAvail, 0)} L/hari tersedia ≥ ${fmt(totalNeed, 0)} L/hari kebutuhan. Surplus: ${fmt(effectiveAvail - totalNeed, 0)} L/hari.`,
        });
      }
    }

    // 5. Individual use exceeds available
    if (rc.useForFlush && d.flushDsg > effectiveAvail) {
      out.push({ type: 'warn', msg: `Flush WC (${fmt(d.flushDsg, 0)} L/hari) melebihi kapasitas efektif sistem.` });
    }

    return out;
  }, [rc, d, R.rainwater.availWet]);

  const flagColors = { ok: C.green, err: C.red, warn: '#D97706' };
  const flagBg = { ok: '#F0FDF4', err: '#FEF2F2', warn: '#FFF7ED' };
  const flagBorder = { ok: '#86EFAC', err: '#FCA5A5', warn: '#FCD34D' };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', display: 'grid', gap: 16 }}>
      <Card>
        <SecTitle icon={Recycle}>Sistem Daur Ulang Air (Water Recycle)</SecTitle>
        <div style={{ marginBottom: 14 }}>
          <Tog on={rc.hasSystem} onChange={v => upd('hasSystem', v)} label="Terdapat instalasi daur ulang air" />
        </div>
        {rc.hasSystem && (
          <>
            <div style={{ marginBottom: 14 }}>
              <Label unit="L/hari">Kapasitas maksimal sistem daur ulang</Label>
              <Inp value={rc.capacity || ''} onChange={v => upd('capacity', v as number)} step={0.001} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 12, color: C.s500, marginBottom: 10 }}>Sumber Air Recycle:</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  <Check checked={rc.sourcesTap} onChange={v => upd('sourcesTap', v)}
                    label={`Air Keran (${fmt(d.tembokDsg + d.wastafelDsg, 0)} L/hari)`} />
                  <Check checked={rc.sourcesWudhu} onChange={v => upd('sourcesWudhu', v)}
                    label={`Air Wudhu (${fmt(d.wudhuDsg, 0)} L/hari)`} />
                  <Check checked={rc.sourcesShower} onChange={v => upd('sourcesShower', v)}
                    label={`Air Shower (${fmt(d.showerDsg, 0)} L/hari)`} />
                  <Check checked={rc.sourcesRainwater} onChange={v => upd('sourcesRainwater', v)}
                    label={`Air Hujan (${fmt(R.rainwater.availWet, 0)} L/hari)`} />
                  <div>
                    <Label unit="L/hari">Air Kondensasi AHU</Label>
                    <Inp value={rc.sourcesAHU || ''} onChange={v => upd('sourcesAHU', v as number)} step={0.001} />
                  </div>
                  <div>
                    <Label unit="L/hari">Sumber Lainnya</Label>
                    <Inp value={rc.sourcesOthers || ''} onChange={v => upd('sourcesOthers', v as number)} step={0.001} />
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 600, fontSize: 12, color: C.s500, marginBottom: 10 }}>Digunakan Untuk:</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  <Check checked={rc.useForFlush} onChange={v => upd('useForFlush', v)}
                    label={`Flushing WC (${fmt(d.flushDsg, 0)} L/hari)`} />
                  <Check checked={rc.useForIrrigation} onChange={v => upd('useForIrrigation', v)}
                    label={`Irigasi Lansekap (${fmt(d.lsDsg, 0)} L/hari)`} />
                  <Check checked={rc.useForCT} onChange={v => upd('useForCT', v)}
                    label={`Cooling Tower (${fmt(d.ctDsg, 0)} L/hari)`} />
                </div>

                <div style={{ marginTop: 16, padding: 12, background: C.s100, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: C.s500, marginBottom: 4 }}>Estimasi Reduksi dari Sumber Primer:</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.teal }}>
                    {fmt(d.recycleFlushRed + d.recycleIrrigRed + d.recycleCTRed, 0)} L/hari
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* ── Neraca Air Validation Panel ─────────────────────────────────── */}
      {rc.hasSystem && flags.length > 0 && (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.s500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Validasi Neraca Air
          </div>
          {flags.map((f, i) => {
            const FlagIcon = f.type === 'ok' ? CheckCircle2 : AlertCircle;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 14px', borderRadius: 8,
                background: flagBg[f.type], border: `1px solid ${flagBorder[f.type]}`,
              }}>
                <FlagIcon size={15} style={{ color: flagColors[f.type], flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: flagColors[f.type], lineHeight: 1.5 }}>{f.msg}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Step 6: Results ──────────────────────────────────────────────────────────
function Step6({ state }: { state: AppState }) {
  const R = useMemo(() => calcAll(state), [state]);
  const d = R.daily;
  const tc = TYPOLOGY_CONFIG[state.building.typology];
  const { isMobile, isTablet } = useBreakpoint();

  const chartData = [
    { name: 'WC + Urinal', baseline: Math.round(d.flushBL), design: Math.round(d.flushDsg) },
    { name: 'Tap + Shower', baseline: Math.round(d.tapBL), design: Math.round(d.tapDsg) },
    { name: 'Lansekap', baseline: Math.round(d.lsBL), design: Math.round(d.lsDsg) },
    { name: 'Cooling Tower', baseline: Math.round(d.ctBL), design: Math.round(d.ctDsg) },
    ...(tc.isFactory && d.equipDsg > 0 ? [{ name: 'Peralatan', baseline: Math.round(d.equipBL), design: Math.round(d.equipDsg) }] : []),
  ];

  const statCols = isMobile ? '1fr 1fr' : isTablet ? 'repeat(3,1fr)' : 'repeat(4,1fr)';
  const heroCols = isMobile ? '1fr' : 'repeat(3,1fr)';

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Hero */}
      <div style={{ background: C.teal, borderRadius: 12, padding: isMobile ? 16 : 24, marginBottom: 18 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(211,254,171,0.6)', marginBottom: 8 }}>
          {state.building.name || 'Proyek'} · {tc.label}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: heroCols, gap: isMobile ? 12 : 24 }}>
          {[
            ['Baseline (Dihitung)', fmt(R.wac1.baselineNorm), tc.resultUnit],
            ['Konsumsi Desain (Primer)', fmt(R.wac1.designNorm), tc.resultUnit],
            ['Penghematan', fmtPct(R.wac1.savingsPct), 'dari baseline'],
          ].map(([label, val, unit]) => (
            <div key={label}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, color: C.mint, fontVariantNumeric: 'tabular-nums' }}>{val}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{unit}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
          {R.wac1.p2Pass
            ? <><CheckCircle2 size={15} style={{ color: C.mint, flexShrink: 0 }} /><span style={{ fontSize: 13, fontWeight: 600, color: C.mint }}>WAC P2 LULUS — Konsumsi primer ≤ 80% dari baseline standar</span></>
            : <><AlertCircle  size={15} style={{ color: C.amber, flexShrink: 0 }} /><span style={{ fontSize: 13, fontWeight: 600, color: C.amber }}>WAC P2 TIDAK LULUS — Konsumsi primer melebihi 80% dari baseline</span></>
          }
        </div>
      </div>

      {/* Score cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 18 }}>
        {[
          { label: 'WAC 1 — Pengurangan Konsumsi Air', pts: R.wac1.pts, max: 8, sub: `${fmtPct(R.wac1.savingsPct)} penghematan · Rasio: ${fmtPct(R.wac1.ratio)}` },
          { label: 'WAC 2 — Efisiensi Fitur Air (NB 1.3)', pts: R.wac2.pts, max: 3, sub: `${fmtPct(R.wac2.pct)} WF hemat (${R.wac2.hemat} dari ${R.wac2.total} unit)` },
        ].map(({ label, pts, max, sub }) => (
          <Card key={label}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.s500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <div style={{ fontSize: 44, fontWeight: 800, color: C.teal, lineHeight: 1 }}>{pts}</div>
              <div style={{ fontSize: 15, color: C.s300 }}>/ {max} poin</div>
            </div>
            <div style={{ margin: '10px 0', background: C.s100, borderRadius: 6, height: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: C.mint, borderRadius: 6, width: `${(pts / max) * 100}%`, transition: '0.5s' }} />
            </div>
            <div style={{ fontSize: 12, color: C.s500 }}>{sub}</div>
          </Card>
        ))}
      </div>

      {/* Breakdown chart */}
      <Card style={{ marginBottom: 16 }}>
        <SecTitle icon={BarChart3}>Konsumsi Air: Baseline vs. Desain (L/hari)</SecTitle>
        <div style={{ display: 'flex', gap: 16, fontSize: 11, marginBottom: 10, flexWrap: 'wrap' }}>
          {[['#CBD5E1', 'Baseline'], [C.teal, 'Desain (total)']].map(([bg, lbl]) => (
            <span key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 5, color: C.s500 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: bg, display: 'inline-block' }} />
              {lbl}
            </span>
          ))}
        </div>
        <div style={{ height: isMobile ? 200 : 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: isMobile ? 0 : 10, bottom: 4 }}>
              <XAxis dataKey="name" tick={{ fontSize: isMobile ? 9 : 11, fill: C.s500 }} />
              <YAxis tick={{ fontSize: 10, fill: C.s500 }} tickFormatter={v => v.toLocaleString('id-ID')} width={isMobile ? 40 : 55} />
              <Tooltip formatter={(v: number) => [v.toLocaleString('id-ID') + ' L/hari']} />
              <Bar dataKey="baseline" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="design" fill={C.teal} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Detail stats */}
      <div style={{ display: 'grid', gridTemplateColumns: statCols, gap: 12 }}>
        {[
          ['Total Baseline', fmt(d.totalBL, 0), 'L/hari'],
          ['Total Desain', fmt(d.totalDsg, 0), 'L/hari'],
          ['Dari Sumber Primer', fmt(d.totalFromPrimary, 0), 'L/hari'],
          ['Reduksi Air Hujan', fmt(d.rwFlushRed + d.rwIrrigRed + d.rwCTRed, 0), 'L/hari'],
          ['Reduksi Recycle', fmt(d.recycleFlushRed + d.recycleIrrigRed + d.recycleCTRed, 0), 'L/hari'],
          ['Rasio Penampungan Hujan', fmtPct(R.rainwater.capRatio), ''],
          ['Baseline ' + tc.resultUnit, fmt(R.wac1.baselineNorm, 3), tc.resultUnit],
          ['Desain ' + tc.resultUnit, fmt(R.wac1.designNorm, 3), tc.resultUnit],
        ].map(([label, val, unit]) => (
          <div key={label} style={{ background: C.s100, borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: C.s400, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.teal, fontVariantNumeric: 'tabular-nums' }}>{val}</div>
            {unit && <div style={{ fontSize: 10, color: C.s300 }}>{unit}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({
  step, setStep, R, state, onImport, onExport, open, onClose,
}: {
  step: number;
  setStep: (n: number) => void;
  R: ReturnType<typeof calcAll>;
  state: AppState;
  onImport: () => void;
  onExport: () => void;
  open: boolean;
  onClose: () => void;
}) {
  const { isDesktop } = useBreakpoint();

  const inner = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.teal }}>
      <div style={{ padding: '22px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 9, color: C.mint, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
          GREENSHIP NB v1.2
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.white, lineHeight: 1.2 }}>Kalkulator Air</div>
        <div style={{ fontSize: 9, color: 'rgba(211,254,171,0.45)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          WAC P2 · WAC 1 · WAC 2 · WAC 5 · WAC 6
        </div>
        {state.building.name && (
          <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {state.building.name}
          </div>
        )}
      </div>

      <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }}>
        {STEPS.map(s => {
          const active = step === s.id;
          const done = step > s.id;
          const Ic = s.icon;
          return (
            <div
              key={s.id}
              onClick={() => { setStep(s.id); if (!isDesktop) onClose(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px',
                borderRadius: 8, marginBottom: 2, cursor: 'pointer',
                background: active ? C.mint : done ? 'rgba(211,254,171,0.1)' : 'transparent',
                transition: '0.15s',
              }}
            >
              <Ic size={14} style={{ color: active ? C.teal : done ? C.mint : 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: active ? 700 : done ? 500 : 400, color: active ? C.teal : done ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)' }}>
                {s.label}
              </span>
              {done && <CheckCircle2 size={11} style={{ color: C.mint, marginLeft: 'auto' }} />}
            </div>
          );
        })}
      </nav>

      {/* Live score */}
      <div style={{ margin: '8px 12px', padding: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nilai Sementara</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center' }}>
          {[
            { label: 'WAC 2', val: R.wac2.pts, max: '/3' },
            { label: 'WAC 1', val: R.wac1.pts, max: '/8' },
            { label: 'WAC P2', val: R.wac1.p2Pass ? '✓' : '✗', max: '' },
          ].map(({ label, val, max }) => (
            <div key={label}>
              <div style={{ fontSize: 20, fontWeight: 800, color: label === 'WAC P2' ? (R.wac1.p2Pass ? C.mint : C.amber) : C.mint }}>
                {val}
              </div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)' }}>{label}{max}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Import / Export */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 6 }}>
        {[
          { label: 'Impor', Icon: Upload, fn: onImport },
          { label: 'Ekspor', Icon: Download, fn: onExport },
        ].map(({ label, Icon: Ic, fn }) => (
          <button key={label} onClick={fn} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            padding: '7px 0', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)',
            background: 'transparent', color: 'rgba(255,255,255,0.65)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <Ic size={11} /> {label}
          </button>
        ))}
      </div>
      <div style={{ padding: '6px 16px 12px', fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
        Pilot: KANTOR · PABRIK · Phase 1
      </div>
    </div>
  );

  // Desktop: always visible fixed sidebar
  if (isDesktop) {
    return (
      <div style={{ width: 230, flexShrink: 0, height: '100vh', position: 'sticky', top: 0 }}>
        {inner}
      </div>
    );
  }

  // Mobile/Tablet: overlay drawer
  if (!open) return null;
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 998 }}
      />
      {/* Drawer */}
      <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 230, zIndex: 999 }}>
        {inner}
      </div>
    </>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [notif, setNotif] = useState<{ type: 'ok' | 'err' | 'warn'; msgs: string[] } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  const R = useMemo(() => calcAll(state), [state]);

  const showNotif = (type: 'ok' | 'err' | 'warn', msgs: string[]) => {
    setNotif({ type, msgs });
    setTimeout(() => setNotif(null), 6000);
  };

  const handleImport = useCallback(async () => {
    try {
      const raw = await pickJSONFile();
      const result = parseAndValidate(raw);
      if (result.ok) {
        setState(result.state);
        setStep(1);
        showNotif('ok', ['Data berhasil diimpor.']);
      } else {
        showNotif('err', result.errors);
      }
    } catch (e: unknown) {
      showNotif('err', [e instanceof Error ? e.message : 'Gagal membaca file.']);
    }
  }, []);

  const handleExport = useCallback(() => {
    downloadJSON(state);
    showNotif('ok', ['Data berhasil diekspor sebagai file JSON.']);
  }, [state]);

  const stepContent = [
    <Step1 key={1} state={state} set={setState} />,
    <Step2 key={2} state={state} set={setState} />,
    <Step3 key={3} state={state} set={setState} />,
    <Step4 key={4} state={state} set={setState} />,
    <Step5 key={5} state={state} set={setState} />,
    <Step6 key={6} state={state} />,
  ];

  const contentPad = isMobile ? 14 : 22;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", fontSize: 14, color: C.s800, background: C.slate }}>

      {notif && <Notif type={notif.type} msgs={notif.msgs} onClose={() => setNotif(null)} />}

      <Sidebar
        step={step} setStep={setStep} R={R} state={state}
        onImport={handleImport} onExport={handleExport}
        open={sidebarOpen} onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>

        {/* Top bar */}
        <div style={{
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(6px)',
          borderBottom: `1px solid ${C.s200}`, padding: `10px ${contentPad}px`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!isDesktop && (
              <button
                onClick={() => setSidebarOpen(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: C.teal, display: 'flex' }}
              >
                <Menu size={20} />
              </button>
            )}
            <div>
              <span style={{ fontSize: 11, color: C.s500 }}>Langkah {step}/6</span>
              <span style={{ color: C.s300, margin: '0 6px' }}>·</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.teal }}>
                {isMobile ? STEPS[step - 1]?.short : STEPS[step - 1]?.label}
              </span>
            </div>
          </div>

          {/* Mobile: step dots */}
          {isMobile && (
            <div style={{ display: 'flex', gap: 5 }}>
              {STEPS.map(s => (
                <div key={s.id} onClick={() => setStep(s.id)} style={{
                  width: 8, height: 8, borderRadius: '50%', cursor: 'pointer',
                  background: step === s.id ? C.teal : step > s.id ? C.mint : C.s200,
                  transition: '0.15s',
                }} />
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              disabled={step === 1}
              onClick={() => setStep(s => Math.max(1, s - 1))}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: isMobile ? '6px 10px' : '6px 14px', borderRadius: 8,
                border: `1px solid ${C.s200}`, background: C.white,
                cursor: step === 1 ? 'not-allowed' : 'pointer',
                opacity: step === 1 ? 0.4 : 1, fontSize: 12, color: C.s700, fontFamily: 'inherit',
              }}
            >
              <ChevronLeft size={13} />
              {!isMobile && 'Kembali'}
            </button>
            {step < 6 && (
              <button
                onClick={() => setStep(s => Math.min(6, s + 1))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: isMobile ? '6px 10px' : '6px 16px', borderRadius: 8,
                  border: 'none', background: C.teal, cursor: 'pointer',
                  fontSize: 12, color: C.mint, fontWeight: 700, fontFamily: 'inherit',
                }}
              >
                {!isMobile && 'Lanjut'}
                <ChevronRight size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Tablet: step tab bar under top bar */}
        {isTablet && (
          <div style={{
            background: C.white, borderBottom: `1px solid ${C.s200}`,
            display: 'flex', overflowX: 'auto', padding: '0 14px',
          }}>
            {STEPS.map(s => {
              const Ic = s.icon;
              const active = step === s.id;
              const done = step > s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setStep(s.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px',
                    background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 12, fontWeight: active ? 700 : 400,
                    color: active ? C.teal : done ? C.green : C.s400,
                    borderBottom: `2px solid ${active ? C.teal : 'transparent'}`,
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}
                >
                  <Ic size={13} />
                  {s.short}
                  {done && <CheckCircle2 size={11} style={{ color: C.green }} />}
                </button>
              );
            })}
          </div>
        )}

        {/* Step content */}
        <div style={{ padding: contentPad, flex: 1, overflowY: 'auto' }}>
          {stepContent[step - 1]}
        </div>
      </div>
    </div>
  );
}
