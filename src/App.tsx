import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Building2, Droplets, Leaf, CloudRain, Scale,
  BarChart3, ChevronRight, ChevronLeft, Award,
  Download, Upload, AlertCircle, CheckCircle2, X,
  Plus, Trash2, Menu, Link2, Zap,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import type { AppState, FixtureTypeId, WBSourceId, WBUseId } from './types';
import { WB_SOURCE_IDS, WB_USE_IDS } from './types';
import { TYPOLOGY_CONFIG } from './constants/typologies';
import { FIXTURE_AVAILABILITY } from './constants/baselines';
import {
  calcAll, calcWAC2, lsShareSum,
  calcRainwater, computeSourceAvailable, computeUseRequired,
} from './engine/calculations';
import { downloadJSON, pickJSONFile, parseAndValidate } from './utils/importExport';
import { downloadCSV, downloadTemplate, pickCSVFile, parseCSV } from './utils/csvImportExport';
import { DEFAULT_STATE, mkWBScenario } from './utils/defaults';
import {
  C, fmt, fmtPct, useBreakpoint,
  Label, Inp, Sel, Card, SecTitle, Pill, Tog, Check, PctInp,
} from './components/shared/atoms';
import { FixtureSection } from './components/shared/FixtureSection';

// ─── Steps ───────────────────────────────────────────────────────────────────
const STEPS = [
  { id:1, label:'Data Bangunan',     short:'Bangunan', icon:Building2 },
  { id:2, label:'Fitur Air (WAC 2)', short:'WF',       icon:Droplets  },
  { id:3, label:'Lansekap & CT',     short:'Lansekap', icon:Leaf      },
  { id:4, label:'Air Hujan (WAC 6)', short:'Hujan',    icon:CloudRain },
  { id:5, label:'Neraca Air',        short:'Neraca',   icon:Scale     },
  { id:6, label:'Hasil WAC',         short:'Hasil',    icon:BarChart3 },
];

// ─── Notification ─────────────────────────────────────────────────────────────
function Notif({ type, msgs, onClose }:{ type:'ok'|'err'|'warn'; msgs:string[]; onClose:()=>void }) {
  const map = {
    ok:   { bg:'#F0FDF4', border:'#86EFAC', text:'#15803D', Icon:CheckCircle2 },
    err:  { bg:'#FEF2F2', border:'#FCA5A5', text:C.red,     Icon:AlertCircle  },
    warn: { bg:'#FFF7ED', border:'#FCD34D', text:'#D97706', Icon:AlertCircle  },
  }[type];
  return (
    <div style={{ position:'fixed', top:16, right:16, zIndex:9999, maxWidth:420,
      background:map.bg, border:`1px solid ${map.border}`, borderRadius:10,
      padding:'12px 16px', boxShadow:'0 4px 20px rgba(0,0,0,0.12)' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
        <map.Icon size={16} style={{ color:map.text, flexShrink:0, marginTop:2 }}/>
        <div style={{ flex:1 }}>
          {msgs.map((m,i)=><div key={i} style={{ fontSize:13, color:map.text, marginBottom:i<msgs.length-1?4:0 }}>{m}</div>)}
        </div>
        <button onClick={onClose} style={{ color:C.s400, background:'none', border:'none', cursor:'pointer', padding:0 }}><X size={14}/></button>
      </div>
    </div>
  );
}

// ─── Step 1 — Data Bangunan ───────────────────────────────────────────────────
function Step1({ state, set }:{ state:AppState; set:(s:AppState)=>void }) {
  const tc = TYPOLOGY_CONFIG[state.building.typology];
  const { isMobile } = useBreakpoint();
  const upd = (k:keyof AppState['building'], v:string|number) =>
    set({ ...state, building:{ ...state.building, [k]:v } });

  // NLA validation — minimum 250 sqm
  const nlaError = state.building.nla > 0 && state.building.nla < 250
    ? 'NLA minimal 250 m² (sesuai batasan kalkulator)'
    : null;

  return (
    <div style={{ maxWidth:640, margin:'0 auto', display:'grid', gap:16 }}>
      <Card>
        <SecTitle icon={Building2}>Data Dasar Bangunan</SecTitle>
        <div style={{ display:'grid', gap:14 }}>
          <div>
            <Label>Nama Bangunan / Proyek</Label>
            <Inp type="text" value={state.building.name} onChange={v=>upd('name',v)} placeholder="Contoh: Gedung Kantor A"/>
          </div>
          <div>
            <Label>Tipologi Bangunan</Label>
            <Sel value={state.building.typology}
              onChange={v=>set({ ...DEFAULT_STATE, building:{ ...DEFAULT_STATE.building, typology:v as AppState['building']['typology'], name:state.building.name } })}
              options={Object.entries(TYPOLOGY_CONFIG).map(([k,v])=>({
                value:k, disabled:!v.active,
                label:v.label+(v.note?` — ${v.note}`:'')+(!v.active?' (segera hadir)':''),
              }))}/>
            {tc.note && <div style={{ fontSize:11, color:C.amber, marginTop:4 }}>⚠ {tc.note}</div>}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:14 }}>
            <div>
              <Label unit="m²">Net Lettable Area (NLA)</Label>
              <Inp value={state.building.nla||''} onChange={v=>upd('nla',v)} step={0.001} min={250}/>
              {nlaError && (
                <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:C.red, marginTop:4 }}>
                  <AlertCircle size={11}/> {nlaError}
                </div>
              )}
            </div>
            <div>
              <Label unit="orang">{tc.occupant1Label}</Label>
              <Inp value={state.building.occupant1||''} onChange={v=>upd('occupant1',v)} step={1}/>
            </div>
          </div>
          <div>
            <Label unit="jam/hari">Jam Operasional</Label>
            <Inp value={state.building.opHours||''} onChange={v=>upd('opHours',v)} step={0.001} min={1} max={24}/>
          </div>
        </div>
      </Card>
      {state.building.occupant1 > 0 && (
        <Card style={{ background:'#F0FDF4', borderColor:'#86EFAC' }}>
          <SecTitle>Parameter Konstanta — {tc.label}</SecTitle>
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(3,1fr)', gap:10 }}>
            <Pill val={`${tc.wcMale} / ${tc.wcFemale}`} label="WC pakai/hari ♂/♀"/>
            <Pill val={tc.tapUsage} label="Tap pakai/hari"/>
            <Pill val={tc.resultUnit} label="Satuan WAC 1"/>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Step 2 — Fitur Air ───────────────────────────────────────────────────────
function Step2({ state, set }:{ state:AppState; set:(s:AppState)=>void }) {
  const available = FIXTURE_AVAILABILITY[state.building.typology] ?? FIXTURE_AVAILABILITY.KANTOR;
  const wac2 = useMemo(()=>calcWAC2(state.fixtures),[state.fixtures]);
  const { isMobile, isTablet } = useBreakpoint();
  const stacked = isMobile || isTablet;
  const updFixture = (type:FixtureTypeId, prods:AppState['fixtures'][FixtureTypeId]) =>
    set({ ...state, fixtures:{ ...state.fixtures, [type]:prods } });

  const Panel = (
    <Card style={stacked?{}:{ position:'sticky', top:72 }}>
      <SecTitle icon={Award}>Nilai WAC 2 (Live)</SecTitle>
      <div style={{ textAlign:'center', padding:'12px 0' }}>
        <div style={{ fontSize:52, fontWeight:800, color:C.teal, lineHeight:1 }}>{wac2.pts}</div>
        <div style={{ fontSize:13, color:C.s500 }}>dari 3 poin (NB 1.3)</div>
      </div>
      <div style={{ background:C.s100, borderRadius:6, height:8, overflow:'hidden', margin:'8px 0 16px' }}>
        <div style={{ height:'100%', background:C.teal, borderRadius:6, width:`${(wac2.pts/3)*100}%`, transition:'0.4s' }}/>
      </div>
      {[['Total WF',wac2.total,C.s800],['WF Hemat (≤ baseline)',wac2.hemat,C.green],['% WF Hemat',fmtPct(wac2.pct),C.teal]].map(([l,v,c])=>(
        <div key={String(l)} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:`1px solid ${C.s100}` }}>
          <span style={{ fontSize:12, color:C.s500 }}>{l}</span>
          <span style={{ fontSize:12, fontWeight:700, color:c as string }}>{v}</span>
        </div>
      ))}
      <div style={{ marginTop:12, padding:10, background:C.s100, borderRadius:8 }}>
        <div style={{ fontSize:10, color:C.s500, lineHeight:1.8 }}>
          ≥ 25% → 1 poin<br/>≥ 50% → 2 poin<br/>≥ 75% → 3 poin<br/>
          <span style={{ color:C.s300 }}>Standar: GREENSHIP NB 1.3</span>
        </div>
      </div>
    </Card>
  );

  return (
    <div style={{ display:'grid', gridTemplateColumns:stacked?'1fr':'1fr 260px', gap:18, alignItems:'start' }}>
      <div>
        {stacked && <div style={{ marginBottom:16 }}>{Panel}</div>}
        <Card style={{ marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
            <SecTitle icon={Droplets}>WF Flush</SecTitle>
            <Tog on={state.hasUrinal} onChange={v=>set({...state,hasUrinal:v})} label="Ada Urinal"/>
          </div>
          {(['WC_FLUSH_VALVE','WC_FLUSH_TANK',...(state.hasUrinal?['URINAL']:[])] as FixtureTypeId[])
            .filter(t=>available.includes(t))
            .map(t=><FixtureSection key={t} type={t} products={state.fixtures[t]} onChange={p=>updFixture(t,p)}/>)}
        </Card>
        <Card>
          <SecTitle icon={Droplets}>WF Tap &amp; Shower</SecTitle>
          {(['KERAN_TEMBOK','KERAN_WASTAFEL','KERAN_WUDHU','SHOWER'] as FixtureTypeId[])
            .filter(t=>available.includes(t))
            .map(t=><FixtureSection key={t} type={t} products={state.fixtures[t]} onChange={p=>updFixture(t,p)}/>)}
        </Card>
      </div>
      {!stacked && Panel}
    </div>
  );
}

// ─── Step 3 — Lansekap & CT ───────────────────────────────────────────────────
function Step3({ state, set }:{ state:AppState; set:(s:AppState)=>void }) {
  const ls = state.landscape;
  const ct = state.coolingTower;
  const shareSum = lsShareSum(ls.zones);
  const shareOk = Math.abs(shareSum-1) < 0.001;
  const { isMobile } = useBreakpoint();
  const updZone = (i:number, field:string, val:string|number) => {
    const zones = ls.zones.map((z,j)=>j===i?{...z,[field]:val}:z);
    set({ ...state, landscape:{...ls, zones} });
  };

  return (
    <div style={{ maxWidth:700, margin:'0 auto', display:'grid', gap:16 }}>
      <Card>
        <SecTitle icon={Leaf}>Lansekap / Irigasi</SecTitle>
        <div style={{ marginBottom:14 }}>
          <Label unit="m²">Luas lansekap dengan irigasi</Label>
          <Inp value={ls.area||''} onChange={v=>set({...state,landscape:{...ls,area:v as number}})} step={0.001}/>
        </div>
        {/* Column headers */}
        {isMobile ? (
          ls.zones.map((z,i)=>(
            <div key={i} style={{ border:`1px solid ${C.s200}`, borderRadius:8, padding:12, marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <Inp type="text" value={z.label} onChange={v=>updZone(i,'label',v)} placeholder={`Area ${i+1}`} style={{ flex:1, marginRight:8 }}/>
                {i>0 && <button onClick={()=>set({...state,landscape:{...ls,zones:ls.zones.filter((_,j)=>j!==i)}})}
                  style={{ color:C.s300, background:'none', border:'none', cursor:'pointer' }}><Trash2 size={13}/></button>}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                {/* Baseline locked at 5 L/m² */}
                <div>
                  <Label>Baseline (L/m²)</Label>
                  <div style={{ padding:'7px 10px', background:C.s100, borderRadius:8, fontSize:13, color:C.s500, fontWeight:600 }}>
                    5 <span style={{ fontSize:10, color:C.s300 }}>(tetap)</span>
                  </div>
                </div>
                <div><Label>Desain (L/m²)</Label><Inp value={z.dsgRate||''} onChange={v=>updZone(i,'dsgRate',v)} step={0.001}/></div>
                <div><Label>% Area</Label><Inp value={parseFloat(((z.areaShare||0)*100).toFixed(3))||''} onChange={v=>updZone(i,'areaShare',Math.min(1,(v as number)/100))} step={0.001}/></div>
              </div>
            </div>
          ))
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 110px 110px 90px 32px', gap:5, marginBottom:5 }}>
              {['Zona','Baseline (L/m²)','Desain (L/m²)','% Area',''].map(h=>(
                <div key={h} style={{ fontSize:10, color:C.s300 }}>{h}</div>
              ))}
            </div>
            {ls.zones.map((z,i)=>(
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 110px 110px 90px 32px', gap:5, marginBottom:6, alignItems:'center' }}>
                <Inp type="text" value={z.label} onChange={v=>updZone(i,'label',v)} placeholder={`Area ${i+1}`}/>
                {/* Baseline locked at 5 L/m² — read only */}
                <div style={{ padding:'7px 10px', background:C.s100, borderRadius:8, fontSize:13, color:C.s500, fontWeight:600, textAlign:'center' }}>
                  5 <span style={{ fontSize:9, color:C.s300 }}>(tetap)</span>
                </div>
                <Inp value={z.dsgRate||''} onChange={v=>updZone(i,'dsgRate',v)} step={0.001}/>
                <Inp value={parseFloat(((z.areaShare||0)*100).toFixed(3))||''} onChange={v=>updZone(i,'areaShare',Math.min(1,(v as number)/100))} step={0.001}/>
                {i>0
                  ? <button onClick={()=>set({...state,landscape:{...ls,zones:ls.zones.filter((_,j)=>j!==i)}})}
                      style={{ color:C.s300, background:'none', border:'none', cursor:'pointer' }}><Trash2 size={13}/></button>
                  : <div/>}
              </div>
            ))}
          </>
        )}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8, flexWrap:'wrap', gap:8 }}>
          {ls.zones.length<5 && (
            <button onClick={()=>set({...state,landscape:{...ls,zones:[...ls.zones,{label:`Area ${ls.zones.length+1}`,basRate:5,dsgRate:0,areaShare:0}]}})}
              style={{ fontSize:12, color:C.teal, background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
              <Plus size={11}/> Tambah Zona
            </button>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
            <span style={{ color:C.s500 }}>Total area share:</span>
            <span style={{ fontWeight:700, color:shareOk?C.green:C.red }}>{(shareSum*100).toFixed(3)}%</span>
            {!shareOk && <span style={{ color:C.red }}>— harus tepat 100%</span>}
          </div>
        </div>
        <div style={{ marginTop:10, fontSize:11, color:C.s400, padding:'8px 10px', background:C.s100, borderRadius:6 }}>
          ℹ Baseline lansekap dikunci pada <strong>5 L/m²</strong> (standar SNI — tidak dapat diubah)
        </div>
      </Card>

      <Card>
        <SecTitle>Cooling Tower</SecTitle>
        <div style={{ marginBottom:14 }}>
          <Tog on={ct.enabled} onChange={v=>set({...state,coolingTower:{...ct,enabled:v}})} label="Menggunakan Cooling Tower (make-up water)"/>
        </div>
        {ct.enabled && (
          <div>
            <Label unit="TR">Beban Pendinginan</Label>
            <Inp value={ct.load||''} onChange={v=>set({...state,coolingTower:{...ct,load:v as number}})} step={0.001}/>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Step 4 — Air Hujan ───────────────────────────────────────────────────────
function Step4({ state, set }:{ state:AppState; set:(s:AppState)=>void }) {
  const rw = state.rainwater;
  const upd = (k:keyof typeof rw, v:boolean|number) => set({ ...state, rainwater:{...rw,[k]:v} });
  const rRes = useMemo(()=>calcRainwater(state),[state]);
  const { isMobile } = useBreakpoint();

  return (
    <div style={{ maxWidth:640, margin:'0 auto', display:'grid', gap:16 }}>
      <Card>
        <SecTitle icon={CloudRain}>Pemanenan Air Hujan (WAC 6)</SecTitle>
        <div style={{ marginBottom:14 }}>
          <Tog on={rw.hasTank} onChange={v=>upd('hasTank',v)} label="Terdapat tanki penyimpanan air hujan"/>
        </div>
        {/* Changed label per requirement */}
        <div style={{ marginBottom:14 }}>
          <PctInp value={rw.rainyDayPct} onChange={v=>upd('rainyDayPct',v)}
            label="Persentase Hari Hujan minimal 10 Tahun"/>
          <div style={{ fontSize:11, color:C.s400, marginTop:4 }}>
            Hari Kering: {((1-rw.rainyDayPct)*100).toFixed(3)}%
          </div>
        </div>
        {rw.hasTank && (
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:14 }}>
            <div><Label unit="Liter">Kapasitas tanki direncanakan</Label>
              <Inp value={rw.tankCapacity||''} onChange={v=>upd('tankCapacity',v as number)} step={0.001}/></div>
            <div><Label unit="mm">Rata-rata Curah Hujan</Label>
              <Inp value={rw.avgRainfall||''} onChange={v=>upd('avgRainfall',v as number)} step={0.001}/></div>
            <div><Label>Koefisien Limpasan (C)</Label>
              <Inp value={rw.runoffCoef||''} onChange={v=>upd('runoffCoef',v as number)} step={0.001} min={0} max={1}/></div>
            <div><Label unit="m²">Luas Atap Penampungan</Label>
              <Inp value={rw.roofArea||''} onChange={v=>upd('roofArea',v as number)} step={0.001}/></div>
          </div>
        )}
      </Card>
      {rw.hasTank && rw.tankCapacity > 0 && (
        <Card style={{ background:C.blueBg, borderColor:'#BFDBFE' }}>
          <SecTitle>Hasil Kalkulasi Air Hujan</SecTitle>
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(3,1fr)', gap:10, marginBottom:14 }}>
            <Pill val={fmt(rRes.idealVolume,0)} label="Volume Ideal Tanki" unit="Liter" accent={C.blue}/>
            <Pill val={fmtPct(rRes.capRatio)} label="Rasio Penampungan" accent={C.blue}/>
            <Pill val={fmt(rRes.availWet,0)} label="Tersedia (hari hujan)" unit="L/hari" accent={C.blue}/>
          </div>
          <div style={{ background:'#DBEAFE', borderRadius:6, height:10, overflow:'hidden' }}>
            <div style={{ background:C.blue, height:'100%', borderRadius:6, width:`${Math.min(100,rRes.capRatio*100)}%`, transition:'0.4s' }}/>
          </div>
          <div style={{ fontSize:11, color:C.blue, marginTop:6 }}>
            Volume ideal = Luas Atap × Rata-rata Curah Hujan × Koefisien Limpasan
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── SOURCE / USE metadata ────────────────────────────────────────────────────
const SOURCE_META: Record<WBSourceId,{ label:string; tag:'R'|'A'|'-'; manualAvail:boolean }> = {
  flush:         { label:'Flushing WC (Flush Valve + Tank)',  tag:'R', manualAvail:false },
  urinal:        { label:'Peturasan / Urinal',                tag:'R', manualAvail:false },
  tap:           { label:'Keran Tembok / Wastafel',           tag:'R', manualAvail:false },
  wudhu:         { label:'Keran Wudhu',                       tag:'A', manualAvail:false },
  shower:        { label:'Shower Mandi',                      tag:'R', manualAvail:false },
  ct_condensate: { label:'Air Kondensasi Cooling Tower',      tag:'A', manualAvail:true  },
  rainwater:     { label:'Air Hujan',                         tag:'A', manualAvail:false },
  others:        { label:'Lainnya',                           tag:'-', manualAvail:true  },
};
const USE_META: Record<WBUseId,{ label:string }> = {
  flush:      { label:'Flushing WC (Flush Valve + Tank)' },
  urinal:     { label:'Peturasan / Urinal'               },
  tap:        { label:'Keran Tembok / Wastafel'          },
  wudhu:      { label:'Keran Wudhu'                      },
  shower:     { label:'Shower Mandi'                     },
  ct_makeup:  { label:'Make-up Water Cooling Tower'      },
  irrigation: { label:'Irigasi Lansekap'                 },
};
const TAG_STYLE: Record<'R'|'A'|'-',{ bg:string; color:string }> = {
  R:{ bg:'#EFF6FF', color:'#2563EB' },
  A:{ bg:'#F0FDF4', color:'#15803D' },
  '-':{ bg:C.s100, color:C.s500    },
};

// ─── Small auto-fill toggle pill ──────────────────────────────────────────────
function AutoPill({ on, onToggle, title }:{ on:boolean; onToggle:()=>void; title:string }) {
  return (
    <button onClick={onToggle} title={title} style={{
      display:'inline-flex', alignItems:'center', gap:3,
      padding:'2px 7px', borderRadius:20, border:`1px solid ${on?C.teal:C.s200}`,
      background:on?'rgba(27,78,77,0.08)':'transparent',
      color:on?C.teal:C.s300, fontSize:9, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
      transition:'0.15s', whiteSpace:'nowrap',
    }}>
      <Zap size={9}/> Auto
    </button>
  );
}

// ─── Step 5 — Neraca Air ──────────────────────────────────────────────────────
function Step5({ state, set }:{ state:AppState; set:(s:AppState)=>void }) {
  const [tab, setTab]               = useState<'wet'|'dry'>('wet');
  const [syncScenarios, setSync]    = useState(false);
  // Auto-fill sets — local UI prefs, not persisted
  const [autoFillSrc, setAutoFillSrc] = useState<Set<WBSourceId>>(new Set());
  const [autoFillAlt, setAutoFillAlt] = useState<Set<WBUseId>>(new Set());
  const [autoFillRec, setAutoFillRec] = useState<Set<WBUseId>>(new Set());

  const R   = useMemo(()=>calcAll(state),[state]);
  const d   = R.daily;
  const rw  = R.rainwater;
  const { isMobile } = useBreakpoint();

  // ── When auto-fill sources change or upstream daily values change, sync values ──
  useEffect(()=>{
    if(autoFillSrc.size===0) return;
    let changed = false;
    const applyAuto = (scenario:'wet'|'dry') => {
      const isDry = scenario==='dry';
      const sc = state.waterBalance[scenario];
      const newSources = sc.sources.map(sr => {
        if(!autoFillSrc.has(sr.id as WBSourceId)) return sr;
        const computed = computeSourceAvailable(sr.id as WBSourceId, d, rw.availWet, isDry, sr.availableManual);
        if(Math.abs(computed - sr.volumeDiolah) > 0.0001){ changed=true; return {...sr, volumeDiolah:computed}; }
        return sr;
      });
      return { ...sc, sources:newSources };
    };
    const newWet = applyAuto('wet');
    const newDry = applyAuto('dry');
    if(changed) set({ ...state, waterBalance:{ wet:newWet, dry:newDry } });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[d.flushDsg, d.urinalDsg, d.tapDsg, d.wudhuDsg, d.showerDsg, d.ctDsg, d.lsDsg, rw.availWet, autoFillSrc]);

  // ── When auto-fill uses change, sync values ──
  useEffect(()=>{
    if(autoFillAlt.size===0 && autoFillRec.size===0) return;
    let changed = false;
    const applyUseAuto = (scenario:'wet'|'dry') => {
      const sc = state.waterBalance[scenario];
      const newUses = sc.uses.map(ur=>{
        const req = computeUseRequired(ur.id as WBUseId, d);
        let a = ur.dariAlt, rec = ur.dariRecycle;
        if(autoFillAlt.has(ur.id as WBUseId) && Math.abs(a-req)>0.0001){ a=req; rec=0; changed=true; }
        if(autoFillRec.has(ur.id as WBUseId) && Math.abs(rec-req)>0.0001){ rec=req; a=0; changed=true; }
        return (a!==ur.dariAlt||rec!==ur.dariRecycle) ? {...ur,dariAlt:a,dariRecycle:rec} : ur;
      });
      return { ...sc, uses:newUses };
    };
    if(changed){
      set({ ...state, waterBalance:{ wet:applyUseAuto('wet'), dry:applyUseAuto('dry') } });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[d.flushDsg,d.urinalDsg,d.tapDsg,d.wudhuDsg,d.showerDsg,d.ctDsg,d.lsDsg,autoFillAlt,autoFillRec]);

  const scenario  = state.waterBalance[tab];
  const isDry     = tab==='dry';

  // Update helpers — apply changes to both scenarios if synced
  const updSource = (id:string, field:'volumeDiolah'|'availableManual', val:number) => {
    const patchSc = (sc:typeof scenario) => ({ ...sc, sources:sc.sources.map(r=>r.id===id?{...r,[field]:val}:r) });
    const wb = syncScenarios
      ? { wet:patchSc(state.waterBalance.wet), dry:patchSc(state.waterBalance.dry) }
      : { ...state.waterBalance, [tab]:patchSc(scenario) };
    set({ ...state, waterBalance:wb });
  };
  const updUse = (id:string, field:'dariAlt'|'dariRecycle', val:number) => {
    const patchSc = (sc:typeof scenario) => ({ ...sc, uses:sc.uses.map(r=>r.id===id?{...r,[field]:val}:r) });
    const wb = syncScenarios
      ? { wet:patchSc(state.waterBalance.wet), dry:patchSc(state.waterBalance.dry) }
      : { ...state.waterBalance, [tab]:patchSc(scenario) };
    set({ ...state, waterBalance:wb });
  };

  // Toggle auto source
  const toggleAutoSrc = (id:WBSourceId) => {
    const next = new Set(autoFillSrc);
    if(next.has(id)){
      next.delete(id);
    } else {
      next.add(id);
      // Immediately write computed value
      const computed = computeSourceAvailable(id, d, rw.availWet, isDry,
        scenario.sources.find(r=>r.id===id)?.availableManual??0);
      updSource(id,'volumeDiolah',computed);
    }
    setAutoFillSrc(next);
  };

  // Toggle auto use (alt or rec) — mutually exclusive per row
  const toggleAutoAlt = (id:WBUseId) => {
    const nextAlt = new Set(autoFillAlt);
    const nextRec = new Set(autoFillRec);
    if(nextAlt.has(id)){
      nextAlt.delete(id);
    } else {
      nextAlt.add(id);
      nextRec.delete(id); // mutually exclusive
      const req = computeUseRequired(id, d);
      updUse(id,'dariAlt',req);
      updUse(id,'dariRecycle',0);
    }
    setAutoFillAlt(nextAlt); setAutoFillRec(nextRec);
  };
  const toggleAutoRec = (id:WBUseId) => {
    const nextRec = new Set(autoFillRec);
    const nextAlt = new Set(autoFillAlt);
    if(nextRec.has(id)){
      nextRec.delete(id);
    } else {
      nextRec.add(id);
      nextAlt.delete(id); // mutually exclusive
      const req = computeUseRequired(id, d);
      updUse(id,'dariRecycle',req);
      updUse(id,'dariAlt',0);
    }
    setAutoFillRec(nextRec); setAutoFillAlt(nextAlt);
  };

  const availFor  = (id:WBSourceId) => {
    const src = scenario.sources.find(r=>r.id===id);
    return computeSourceAvailable(id, d, rw.availWet, isDry, src?.availableManual??0);
  };
  const diolahFor = (id:WBSourceId) => scenario.sources.find(r=>r.id===id)?.volumeDiolah??0;
  const reqFor    = (id:WBUseId)    => computeUseRequired(id, d);

  const totalDiolah     = scenario.sources.reduce((s,r)=>s+(r.volumeDiolah||0),0);
  const totalPemenuhan  = scenario.uses.reduce((s,r)=>s+(r.dariAlt||0)+(r.dariRecycle||0),0);
  const isBalanced      = totalDiolah >= totalPemenuhan;
  const overRows        = scenario.uses.filter(r=>{
    const req = computeUseRequired(r.id as WBUseId, d);
    return req>0 && (r.dariAlt+r.dariRecycle)>req;
  });

  const resetScenario = () =>
    set({ ...state, waterBalance:{ ...state.waterBalance, [tab]:mkWBScenario() } });

  const tabBtn = (t:'wet'|'dry') => ({
    padding:'8px 18px', borderRadius:8, fontSize:12, fontWeight:700,
    cursor:'pointer' as const, fontFamily:'inherit',
    background:tab===t?C.teal:C.white, color:tab===t?C.mint:C.s500,
    border:tab===t?'none':`1px solid ${C.s200}`,
  });

  const ReadOnly = ({ val }:{ val:number }) => (
    <div style={{ padding:'7px 10px', background:C.s100, borderRadius:8, fontSize:13, color:C.s500, fontVariantNumeric:'tabular-nums' }}>
      {fmt(val,3)}
    </div>
  );

  return (
    <div style={{ maxWidth:940, margin:'0 auto', display:'grid', gap:16 }}>

      {/* ── Controls bar ─────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
        <button style={tabBtn('wet')} onClick={()=>setTab('wet')}>☁ Hari Basah</button>
        <button style={tabBtn('dry')} onClick={()=>setTab('dry')}>☀ Hari Kering</button>

        {/* Sync toggle */}
        <div onClick={()=>setSync(!syncScenarios)} style={{
          display:'flex', alignItems:'center', gap:6, padding:'7px 12px', borderRadius:8, cursor:'pointer',
          background:syncScenarios?'rgba(27,78,77,0.08)':'transparent',
          border:`1px solid ${syncScenarios?C.teal:C.s200}`,
        }}>
          <Link2 size={13} style={{ color:syncScenarios?C.teal:C.s400 }}/>
          <span style={{ fontSize:11, fontWeight:syncScenarios?700:400, color:syncScenarios?C.teal:C.s500 }}>
            Samakan Basah &amp; Kering
          </span>
        </div>

        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:16, fontSize:11, color:C.s500 }}>
          <span><span style={{ padding:'1px 7px', borderRadius:10, background:'#EFF6FF', color:'#2563EB', fontWeight:700 }}>R</span> Recycle</span>
          <span><span style={{ padding:'1px 7px', borderRadius:10, background:'#F0FDF4', color:'#15803D', fontWeight:700 }}>A</span> Alternatif</span>
          <button onClick={resetScenario} style={{ color:C.s400, background:'none', border:`1px solid ${C.s200}`, borderRadius:6, padding:'4px 10px', cursor:'pointer', fontFamily:'inherit', fontSize:11 }}>
            Reset {tab==='wet'?'Basah':'Kering'}
          </button>
        </div>
      </div>

      {/* ── SIDE A — SOURCES ─────────────────────────────────────── */}
      <Card>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, flexWrap:'wrap', gap:6 }}>
          <SecTitle>A. Sumber Air Recycle &amp; Alternatif</SecTitle>
          <div style={{ fontSize:10, color:C.s400 }}>
            <Zap size={10} style={{ verticalAlign:'middle' }}/> Auto = Volume Diolah diisi otomatis dari Volume Tersedia
          </div>
        </div>
        {isMobile ? (
          WB_SOURCE_IDS.map(id=>{
            const meta = SOURCE_META[id];
            const avail = availFor(id);
            const diolah = diolahFor(id);
            const over = diolah>avail && avail>0;
            const isAuto = autoFillSrc.has(id);
            return (
              <div key={id} style={{ border:`1px solid ${C.s200}`, borderRadius:8, padding:12, marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                  <span style={{ fontSize:10, padding:'1px 7px', borderRadius:10, fontWeight:700, background:TAG_STYLE[meta.tag].bg, color:TAG_STYLE[meta.tag].color }}>{meta.tag}</span>
                  <span style={{ fontSize:13, fontWeight:500, color:C.s700, flex:1 }}>{meta.label}</span>
                  <AutoPill on={isAuto} onToggle={()=>toggleAutoSrc(id)} title="Auto-isi Volume Diolah = Volume Tersedia"/>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div>
                    <Label>Volume Tersedia (L/hari)</Label>
                    {meta.manualAvail
                      ? <Inp value={scenario.sources.find(r=>r.id===id)?.availableManual||''} onChange={v=>updSource(id,'availableManual',v as number)} step={0.001}/>
                      : <ReadOnly val={avail}/>}
                  </div>
                  <div>
                    <Label>Volume Diolah (L/hari)</Label>
                    {isAuto
                      ? <ReadOnly val={avail}/>
                      : <Inp value={diolah||''} onChange={v=>updSource(id,'volumeDiolah',v as number)} step={0.001}
                          style={{ borderColor:over?C.red:undefined }}/>}
                    {over && <div style={{ fontSize:10, color:C.red, marginTop:2 }}>Melebihi tersedia</div>}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'24px 1fr 160px 160px 54px', gap:6, marginBottom:5 }}>
              {['Tag','Sumber Air','Tersedia (L/hari)','Diolah (L/hari)','Auto'].map(h=>(
                <div key={h} style={{ fontSize:10, color:C.s300 }}>{h}</div>
              ))}
            </div>
            {WB_SOURCE_IDS.map(id=>{
              const meta = SOURCE_META[id];
              const avail = availFor(id);
              const diolah = diolahFor(id);
              const over = diolah>avail && avail>0;
              const isAuto = autoFillSrc.has(id);
              return (
                <div key={id} style={{ display:'grid', gridTemplateColumns:'24px 1fr 160px 160px 54px', gap:6, marginBottom:6, alignItems:'center' }}>
                  <span style={{ fontSize:10, padding:'2px 7px', borderRadius:10, fontWeight:700, textAlign:'center', background:TAG_STYLE[meta.tag].bg, color:TAG_STYLE[meta.tag].color }}>{meta.tag}</span>
                  <span style={{ fontSize:13, color:C.s700 }}>{meta.label}</span>
                  {meta.manualAvail
                    ? <Inp value={scenario.sources.find(r=>r.id===id)?.availableManual||''} onChange={v=>updSource(id,'availableManual',v as number)} step={0.001}/>
                    : <ReadOnly val={avail}/>}
                  {isAuto
                    ? <ReadOnly val={avail}/>
                    : <div>
                        <Inp value={diolah||''} onChange={v=>updSource(id,'volumeDiolah',v as number)} step={0.001}
                          style={{ borderColor:over?C.red:undefined }}/>
                        {over && <div style={{ fontSize:9, color:C.red, marginTop:2 }}>Melebihi tersedia</div>}
                      </div>}
                  <AutoPill on={isAuto} onToggle={()=>toggleAutoSrc(id)} title="Auto-isi Volume Diolah = Volume Tersedia"/>
                </div>
              );
            })}
          </>
        )}
        <div style={{ borderTop:`1px solid ${C.s200}`, paddingTop:10, marginTop:6, display:'flex', justifyContent:'flex-end', gap:24, fontSize:12 }}>
          <span style={{ color:C.s500 }}>Total Volume Diolah:</span>
          <span style={{ fontWeight:700, color:C.teal, fontVariantNumeric:'tabular-nums' }}>{fmt(totalDiolah,3)} L/hari</span>
        </div>
      </Card>

      {/* ── SIDE B — USES ────────────────────────────────────────── */}
      <Card>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, flexWrap:'wrap', gap:6 }}>
          <SecTitle>B. Penggunaan Air Recycle &amp; Alternatif</SecTitle>
          <div style={{ fontSize:10, color:C.s400 }}>
            <Zap size={10} style={{ verticalAlign:'middle' }}/> Alt / Rec = diisi otomatis dari Kebutuhan
          </div>
        </div>
        {isMobile ? (
          WB_USE_IDS.map(id=>{
            const useRow = scenario.uses.find(r=>r.id===id)!;
            const req = reqFor(id as WBUseId);
            const fulfilled = (useRow.dariAlt||0)+(useRow.dariRecycle||0);
            const fpct = req>0?fulfilled/req:0;
            const over = fpct>1;
            const isAutoA = autoFillAlt.has(id as WBUseId);
            const isAutoR = autoFillRec.has(id as WBUseId);
            return (
              <div key={id} style={{ border:`1px solid ${C.s200}`, borderRadius:8, padding:12, marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <span style={{ fontSize:13, fontWeight:500, color:C.s700 }}>{USE_META[id as WBUseId].label}</span>
                  <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, fontWeight:700,
                    background:over?'#FEF2F2':fpct>0?'#F0FDF4':C.s100, color:over?C.red:fpct>0?C.green:C.s300 }}>
                    {(fpct*100).toFixed(1)}%
                  </span>
                </div>
                <div style={{ fontSize:11, color:C.s400, marginBottom:8 }}>Kebutuhan: {fmt(req,3)} L/hari</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                      <Label>Dari Alt. (L/hari)</Label>
                      <AutoPill on={isAutoA} onToggle={()=>toggleAutoAlt(id as WBUseId)} title="Auto: Alt = Kebutuhan"/>
                    </div>
                    {isAutoA ? <ReadOnly val={req}/> : <Inp value={useRow.dariAlt||''} onChange={v=>updUse(id,'dariAlt',v as number)} step={0.001}/>}
                  </div>
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                      <Label>Dari Recycle (L/hari)</Label>
                      <AutoPill on={isAutoR} onToggle={()=>toggleAutoRec(id as WBUseId)} title="Auto: Rec = Kebutuhan"/>
                    </div>
                    {isAutoR ? <ReadOnly val={req}/> : <Inp value={useRow.dariRecycle||''} onChange={v=>updUse(id,'dariRecycle',v as number)} step={0.001}/>}
                  </div>
                </div>
                {over && <div style={{ fontSize:11, color:C.red, marginTop:6 }}>⚠ Pemenuhan melebihi kebutuhan</div>}
              </div>
            );
          })
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 120px 54px 120px 54px 80px', gap:6, marginBottom:5 }}>
              {['Penggunaan','Kebutuhan (L/hari)','Auto Alt','Dari Alt. (L/hari)','Auto Rec','Dari Rec (L/hari)'].map(h=>(
                <div key={h} style={{ fontSize:10, color:C.s300 }}>{h}</div>
              ))}
            </div>
            {/* Extra header row for % */}
            {WB_USE_IDS.map(id=>{
              const useRow = scenario.uses.find(r=>r.id===id)!;
              const req = reqFor(id as WBUseId);
              const fulfilled = (useRow.dariAlt||0)+(useRow.dariRecycle||0);
              const fpct = req>0?fulfilled/req:0;
              const over = fpct>1;
              const isAutoA = autoFillAlt.has(id as WBUseId);
              const isAutoR = autoFillRec.has(id as WBUseId);
              return (
                <div key={id} style={{ display:'grid', gridTemplateColumns:'1fr 120px 54px 120px 54px 80px', gap:6, marginBottom:6, alignItems:'start' }}>
                  <span style={{ fontSize:13, color:C.s700, paddingTop:8 }}>{USE_META[id as WBUseId].label}</span>
                  <ReadOnly val={req}/>
                  <div style={{ paddingTop:4 }}><AutoPill on={isAutoA} onToggle={()=>toggleAutoAlt(id as WBUseId)} title="Auto: Dari Alt = Kebutuhan"/></div>
                  {isAutoA ? <ReadOnly val={req}/> : <Inp value={useRow.dariAlt||''} onChange={v=>updUse(id,'dariAlt',v as number)} step={0.001}/>}
                  <div style={{ paddingTop:4 }}><AutoPill on={isAutoR} onToggle={()=>toggleAutoRec(id as WBUseId)} title="Auto: Dari Rec = Kebutuhan"/></div>
                  {isAutoR ? <ReadOnly val={req}/> : <Inp value={useRow.dariRecycle||''} onChange={v=>updUse(id,'dariRecycle',v as number)} step={0.001}/>}
                </div>
              );
            })}
            {/* % Terpenuhi column as separate row below */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 120px 54px 120px 54px 80px', gap:6, marginTop:4, borderTop:`1px dashed ${C.s200}`, paddingTop:6 }}>
              <span style={{ fontSize:11, color:C.s400 }}>% Terpenuhi</span>
              {WB_USE_IDS.map(id=>{
                const useRow = scenario.uses.find(r=>r.id===id)!;
                const req = reqFor(id as WBUseId);
                const fulfilled = (useRow.dariAlt||0)+(useRow.dariRecycle||0);
                const fpct = req>0?fulfilled/req:0;
                const over = fpct>1;
                return (
                  <React.Fragment key={id}></React.Fragment>
                );
              })}
            </div>
            {/* Pct row - simpler layout */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:4 }}>
              {WB_USE_IDS.map(id=>{
                const useRow = scenario.uses.find(r=>r.id===id)!;
                const req = reqFor(id as WBUseId);
                const fulfilled = (useRow.dariAlt||0)+(useRow.dariRecycle||0);
                const fpct = req>0?fulfilled/req:0;
                const over = fpct>1;
                return (
                  <div key={id} style={{ display:'flex', alignItems:'center', gap:4, fontSize:11 }}>
                    <span style={{ color:C.s400 }}>{USE_META[id as WBUseId].label.split(' ')[0]}:</span>
                    <span style={{ padding:'2px 8px', borderRadius:20, fontWeight:700,
                      background:over?'#FEF2F2':fpct>0?'#F0FDF4':C.s100, color:over?C.red:fpct>0?C.green:C.s300 }}>
                      {(fpct*100).toFixed(1)}%{over?' ⚠':''}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
        <div style={{ borderTop:`1px solid ${C.s200}`, paddingTop:10, marginTop:6, display:'flex', justifyContent:'flex-end', gap:24, fontSize:12 }}>
          <span style={{ color:C.s500 }}>Total Pemenuhan:</span>
          <span style={{ fontWeight:700, color:C.teal, fontVariantNumeric:'tabular-nums' }}>{fmt(totalPemenuhan,3)} L/hari</span>
        </div>
      </Card>

      {/* ── Balance status ────────────────────────────────────────── */}
      <div style={{
        display:'flex', alignItems:'flex-start', gap:10, padding:'12px 16px', borderRadius:10,
        background:overRows.length>0?'#FEF2F2':isBalanced?'#F0FDF4':'#FFF7ED',
        border:`1px solid ${overRows.length>0?'#FCA5A5':isBalanced?'#86EFAC':'#FCD34D'}`,
      }}>
        {overRows.length>0||!isBalanced
          ? <AlertCircle size={16} style={{ color:overRows.length>0?C.red:'#D97706', flexShrink:0, marginTop:1 }}/>
          : <CheckCircle2 size={16} style={{ color:C.green, flexShrink:0, marginTop:1 }}/>}
        <div>
          {overRows.length>0 && (
            <div style={{ fontSize:13, fontWeight:600, color:C.red, marginBottom:4 }}>
              ERROR — Pemenuhan melebihi 100% pada: {overRows.map(r=>USE_META[r.id as WBUseId]?.label).join(', ')}
            </div>
          )}
          {!isBalanced && overRows.length===0 && (
            <div style={{ fontSize:13, fontWeight:600, color:'#D97706', marginBottom:4 }}>
              NERACA TIDAK SEIMBANG — Diolah ({fmt(totalDiolah,3)}) &lt; Pemenuhan ({fmt(totalPemenuhan,3)}) L/hari
            </div>
          )}
          {isBalanced && overRows.length===0 && totalDiolah>0 && (
            <div style={{ fontSize:13, fontWeight:600, color:C.green, marginBottom:4 }}>
              NERACA AIR SEIMBANG — Surplus: {fmt(totalDiolah-totalPemenuhan,3)} L/hari
            </div>
          )}
          <div style={{ fontSize:12, color:C.s500 }}>
            Sumber Diolah: <strong>{fmt(totalDiolah,3)} L/hari</strong> &nbsp;·&nbsp;
            Total Pemenuhan: <strong>{fmt(totalPemenuhan,3)} L/hari</strong>
          </div>
          {totalDiolah===0 && (
            <div style={{ fontSize:11, color:C.s400, marginTop:4 }}>
              Isi kolom "Volume Diolah" dan "Pemenuhan" (atau gunakan tombol Auto) untuk menyeimbangkan neraca air.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 6 — Hasil WAC ───────────────────────────────────────────────────────
function Step6({ state }:{ state:AppState }) {
  const R   = useMemo(()=>calcAll(state),[state]);
  const d   = R.daily;
  const tc  = TYPOLOGY_CONFIG[state.building.typology];
  const { isMobile, isTablet } = useBreakpoint();

  const hasData = R.wac1.baselineNorm > 0;
  const chartData = [
    { name:'WC + Urinal',  baseline:Math.round(d.flushBL), design:Math.round(d.flushDsg) },
    { name:'Tap + Shower', baseline:Math.round(d.tapBL),   design:Math.round(d.tapDsg)   },
    { name:'Lansekap',     baseline:Math.round(d.lsBL),    design:Math.round(d.lsDsg)    },
    { name:'Cooling Tower',baseline:Math.round(d.ctBL),    design:Math.round(d.ctDsg)    },
  ];
  const statCols = isMobile?'1fr 1fr':isTablet?'repeat(3,1fr)':'repeat(4,1fr)';

  return (
    <div style={{ maxWidth:860, margin:'0 auto' }}>
      {/* Hero */}
      <div style={{ background:C.teal, borderRadius:12, padding:isMobile?16:24, marginBottom:18 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(211,254,171,0.6)', marginBottom:8 }}>
          {state.building.name||'Proyek'} · {tc.label}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)', gap:isMobile?12:24 }}>
          {[
            ['Baseline (Dihitung)', fmt(R.wac1.baselineNorm,3), tc.resultUnit],
            ['Konsumsi Desain (Primer)', fmt(R.wac1.designNorm,3), tc.resultUnit],
            ['Penghematan', fmtPct(R.wac1.savingsPct), 'dari baseline'],
          ].map(([label,val,unit])=>(
            <div key={label}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)', marginBottom:6 }}>{label}</div>
              <div style={{ fontSize:isMobile?20:26, fontWeight:800, color:C.mint, fontVariantNumeric:'tabular-nums' }}>{val}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{unit}</div>
            </div>
          ))}
        </div>
        {/* WAC P2: always pass if data filled */}
        <div style={{ marginTop:16, display:'flex', alignItems:'flex-start', gap:8, padding:'10px 14px', background:'rgba(0,0,0,0.2)', borderRadius:8 }}>
          {hasData
            ? <><CheckCircle2 size={15} style={{ color:C.mint, flexShrink:0 }}/><span style={{ fontSize:13, fontWeight:600, color:C.mint }}>WAC P2 LULUS — Data baseline &amp; desain telah dihitung</span></>
            : <><AlertCircle  size={15} style={{ color:C.amber, flexShrink:0 }}/><span style={{ fontSize:13, fontWeight:600, color:C.amber }}>WAC P2 — Lengkapi data bangunan dan fitur air untuk mendapatkan hasil</span></>}
        </div>
      </div>

      {/* WAC score cards */}
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:16, marginBottom:18 }}>
        {[
          { label:'WAC 1 — Pengurangan Konsumsi Air', pts:R.wac1.pts, max:8,
            sub:`${fmtPct(R.wac1.savingsPct)} penghematan · Rasio desain/baseline: ${fmtPct(R.wac1.ratio)}` },
          { label:'WAC 2 — Efisiensi Fitur Air (NB 1.3)', pts:R.wac2.pts, max:3,
            sub:`${fmtPct(R.wac2.pct)} WF hemat (${R.wac2.hemat} dari ${R.wac2.total} unit)` },
        ].map(({ label, pts, max, sub })=>(
          <Card key={label}>
            <div style={{ fontSize:11, fontWeight:700, color:C.s500, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>{label}</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
              <div style={{ fontSize:44, fontWeight:800, color:C.teal, lineHeight:1 }}>{pts}</div>
              <div style={{ fontSize:15, color:C.s300 }}>/ {max} poin</div>
            </div>
            <div style={{ margin:'10px 0', background:C.s100, borderRadius:6, height:8, overflow:'hidden' }}>
              <div style={{ height:'100%', background:C.mint, borderRadius:6, width:`${(pts/max)*100}%`, transition:'0.5s' }}/>
            </div>
            <div style={{ fontSize:12, color:C.s500 }}>{sub}</div>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card style={{ marginBottom:16 }}>
        <SecTitle icon={BarChart3}>Konsumsi Air: Baseline vs. Desain (L/hari)</SecTitle>
        <div style={{ display:'flex', gap:16, fontSize:11, marginBottom:10, flexWrap:'wrap' }}>
          {[['#CBD5E1','Baseline'],[C.teal,'Desain']].map(([bg,lbl])=>(
            <span key={lbl} style={{ display:'flex', alignItems:'center', gap:5, color:C.s500 }}>
              <span style={{ width:10, height:10, borderRadius:2, background:bg, display:'inline-block' }}/>{lbl}
            </span>
          ))}
        </div>
        <div style={{ height:isMobile?200:240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top:4, right:8, left:isMobile?0:10, bottom:4 }}>
              <XAxis dataKey="name" tick={{ fontSize:isMobile?9:11, fill:C.s500 }}/>
              <YAxis tick={{ fontSize:10, fill:C.s500 }} tickFormatter={v=>v.toLocaleString('id-ID')} width={isMobile?40:55}/>
              <Tooltip formatter={(v:number)=>[v.toLocaleString('id-ID')+' L/hari']}/>
              <Bar dataKey="baseline" fill="#CBD5E1" radius={[4,4,0,0]}/>
              <Bar dataKey="design"   fill={C.teal}  radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:statCols, gap:12 }}>
        {[
          ['Total Baseline',           fmt(d.totalBL,0),                          'L/hari'],
          ['Total Desain',             fmt(d.totalDsg,0),                          'L/hari'],
          ['Reduksi Neraca Air',       fmt(d.totalReduction,0),                    'L/hari'],
          ['Dari Sumber Primer',       fmt(d.totalFromPrimary,0),                  'L/hari'],
          ['Rasio Penampungan Hujan',  fmtPct(R.rainwater.capRatio),              ''],
          ['WAC P2',                   hasData?'LULUS':'Isi data dulu',            ''],
          ['Baseline '+tc.resultUnit,  fmt(R.wac1.baselineNorm,3),                 tc.resultUnit],
          ['Desain '+tc.resultUnit,    fmt(R.wac1.designNorm,3),                   tc.resultUnit],
        ].map(([label,val,unit])=>(
          <div key={label} style={{ background:C.s100, borderRadius:8, padding:'10px 12px' }}>
            <div style={{ fontSize:10, color:C.s400, marginBottom:4 }}>{label}</div>
            <div style={{ fontSize:16, fontWeight:700, color:C.teal, fontVariantNumeric:'tabular-nums' }}>{val}</div>
            {unit && <div style={{ fontSize:10, color:C.s300 }}>{unit}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ step, setStep, R, state,
  onImportJSON, onImportCSV, onExportJSON, onExportCSV, onDownloadTemplate,
  open, onClose }:
  { step:number; setStep:(n:number)=>void; R:ReturnType<typeof calcAll>;
    state:AppState; onImportJSON:()=>void; onImportCSV:()=>void;
    onExportJSON:()=>void; onExportCSV:()=>void; onDownloadTemplate:()=>void;
    open:boolean; onClose:()=>void }) {
  const { isDesktop } = useBreakpoint();

  const inner = (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:C.teal }}>
      <div style={{ padding:'22px 18px 16px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize:9, color:C.mint, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:4 }}>GREENSHIP NB v1.2</div>
        <div style={{ fontSize:17, fontWeight:800, color:C.white, lineHeight:1.2 }}>Kalkulator Air</div>
        <div style={{ fontSize:9, color:'rgba(211,254,171,0.45)', marginTop:3, textTransform:'uppercase', letterSpacing:'0.05em' }}>WAC P2 · WAC 1 · WAC 2 · WAC 5 · WAC 6</div>
        {state.building.name && (
          <div style={{ marginTop:10, fontSize:11, color:'rgba(255,255,255,0.4)', fontStyle:'italic', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {state.building.name}
          </div>
        )}
      </div>
      <nav style={{ flex:1, padding:'8px 10px', overflowY:'auto' }}>
        {STEPS.map(s=>{
          const active=step===s.id, done=step>s.id, Ic=s.icon;
          return (
            <div key={s.id} onClick={()=>{ setStep(s.id); if(!isDesktop) onClose(); }}
              style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 10px', borderRadius:8, marginBottom:2, cursor:'pointer',
                background:active?C.mint:done?'rgba(211,254,171,0.1)':'transparent', transition:'0.15s' }}>
              <Ic size={14} style={{ color:active?C.teal:done?C.mint:'rgba(255,255,255,0.3)', flexShrink:0 }}/>
              <span style={{ fontSize:12, fontWeight:active?700:done?500:400, color:active?C.teal:done?'rgba(255,255,255,0.7)':'rgba(255,255,255,0.35)' }}>{s.label}</span>
              {done && <CheckCircle2 size={11} style={{ color:C.mint, marginLeft:'auto' }}/>}
            </div>
          );
        })}
      </nav>
      {/* Live score */}
      <div style={{ margin:'8px 12px', padding:12, background:'rgba(0,0,0,0.2)', borderRadius:8 }}>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>Nilai Sementara</div>
        <div style={{ display:'flex', justifyContent:'space-between', textAlign:'center' }}>
          {[{l:'WAC 2',v:R.wac2.pts,mx:'/3'},{l:'WAC 1',v:R.wac1.pts,mx:'/8'},{l:'WAC P2',v:R.wac1.p2Pass?'✓':'—',mx:''}].map(({l,v,mx})=>(
            <div key={l}>
              <div style={{ fontSize:20, fontWeight:800, color:l==='WAC P2'?C.mint:C.mint }}>{v}</div>
              <div style={{ fontSize:8, color:'rgba(255,255,255,0.35)' }}>{l}{mx}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Import / Export */}
      <div style={{ padding:'10px 12px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Import</div>
        <div style={{ display:'flex', gap:5, marginBottom:8 }}>
          {[{l:'JSON',fn:onImportJSON},{l:'CSV',fn:onImportCSV}].map(({l,fn})=>(
            <button key={l} onClick={fn} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:4,
              padding:'6px 0', borderRadius:6, border:'1px solid rgba(255,255,255,0.2)',
              background:'transparent', color:'rgba(255,255,255,0.65)', fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
              <Upload size={10}/> {l}
            </button>
          ))}
        </div>
        <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Export</div>
        <div style={{ display:'flex', gap:5, marginBottom:8 }}>
          {[{l:'JSON',fn:onExportJSON},{l:'CSV',fn:onExportCSV}].map(({l,fn})=>(
            <button key={l} onClick={fn} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:4,
              padding:'6px 0', borderRadius:6, border:'1px solid rgba(255,255,255,0.2)',
              background:'transparent', color:'rgba(255,255,255,0.65)', fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
              <Download size={10}/> {l}
            </button>
          ))}
        </div>
        <button onClick={onDownloadTemplate} style={{
          width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:5,
          padding:'7px 0', borderRadius:6, border:'1px solid rgba(211,254,171,0.4)',
          background:'rgba(211,254,171,0.08)', color:'rgba(211,254,171,0.7)',
          fontSize:10, cursor:'pointer', fontFamily:'inherit', fontWeight:700,
        }}>
          <Download size={10}/> Unduh Template CSV
        </button>
      </div>
      <div style={{ padding:'6px 16px 10px', fontSize:9, color:'rgba(255,255,255,0.2)' }}>
        Pilot: KANTOR · Phase 1
      </div>
    </div>
  );

  if (isDesktop) return <div style={{ width:230, flexShrink:0, height:'100vh', position:'sticky', top:0 }}>{inner}</div>;
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:998 }}/>
      <div style={{ position:'fixed', top:0, left:0, bottom:0, width:230, zIndex:999 }}>{inner}</div>
    </>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep]           = useState(1);
  const [state, setState]         = useState<AppState>(DEFAULT_STATE);
  const [notif, setNotif]         = useState<{ type:'ok'|'err'|'warn'; msgs:string[] }|null>(null);
  const [sidebarOpen, setSlide]   = useState(false);
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  const R   = useMemo(()=>calcAll(state),[state]);

  const showNotif = (type:'ok'|'err'|'warn', msgs:string[]) => {
    setNotif({ type, msgs });
    setTimeout(()=>setNotif(null), 6000);
  };

  const handleImportJSON = useCallback(async()=>{
    try {
      const raw = await pickJSONFile();
      const res = parseAndValidate(raw);
      if(res.ok){ setState(res.state); setStep(1); showNotif('ok',['Data JSON berhasil diimpor.']); }
      else showNotif('err', res.errors);
    } catch(e:unknown){ showNotif('err',[e instanceof Error?e.message:'Gagal membaca file JSON.']); }
  },[]);

  const handleImportCSV = useCallback(async()=>{
    try {
      const raw = await pickCSVFile();
      const res = parseCSV(raw);
      if(res.ok){ setState(res.state); setStep(1); showNotif('ok',['Data CSV berhasil diimpor.']); }
      else showNotif('err', res.errors);
    } catch(e:unknown){ showNotif('err',[e instanceof Error?e.message:'Gagal membaca file CSV.']); }
  },[]);

  const handleExportJSON = useCallback(()=>{ downloadJSON(state); showNotif('ok',['Diekspor sebagai JSON.']); },[state]);
  const handleExportCSV  = useCallback(()=>{ downloadCSV(state);  showNotif('ok',['Diekspor sebagai CSV.']); },[state]);
  const handleTemplate   = useCallback(()=>{
    downloadTemplate();
    showNotif('ok',['Template CSV diunduh. Buka di Excel/Sheets, isi kolom VALUE, lalu Import CSV.']);
  },[]);

  const stepContent = [
    <Step1 key={1} state={state} set={setState}/>,
    <Step2 key={2} state={state} set={setState}/>,
    <Step3 key={3} state={state} set={setState}/>,
    <Step4 key={4} state={state} set={setState}/>,
    <Step5 key={5} state={state} set={setState}/>,
    <Step6 key={6} state={state}/>,
  ];
  const pad = isMobile?14:22;

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:"'Inter',sans-serif", fontSize:14, color:C.s800, background:C.slate }}>
      {notif && <Notif type={notif.type} msgs={notif.msgs} onClose={()=>setNotif(null)}/>}

      <Sidebar step={step} setStep={setStep} R={R} state={state}
        onImportJSON={handleImportJSON} onImportCSV={handleImportCSV}
        onExportJSON={handleExportJSON} onExportCSV={handleExportCSV}
        onDownloadTemplate={handleTemplate}
        open={sidebarOpen} onClose={()=>setSlide(false)}/>

      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflowX:'hidden' }}>
        {/* Top bar */}
        <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(6px)',
          borderBottom:`1px solid ${C.s200}`, padding:`10px ${pad}px`,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          position:'sticky', top:0, zIndex:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {!isDesktop && (
              <button onClick={()=>setSlide(true)} style={{ background:'none', border:'none', cursor:'pointer', padding:4, color:C.teal, display:'flex' }}>
                <Menu size={20}/>
              </button>
            )}
            <div>
              <span style={{ fontSize:11, color:C.s500 }}>Langkah {step}/6</span>
              <span style={{ color:C.s300, margin:'0 6px' }}>·</span>
              <span style={{ fontSize:13, fontWeight:700, color:C.teal }}>{isMobile?STEPS[step-1]?.short:STEPS[step-1]?.label}</span>
            </div>
          </div>
          {isMobile && (
            <div style={{ display:'flex', gap:5 }}>
              {STEPS.map(s=>(
                <div key={s.id} onClick={()=>setStep(s.id)} style={{ width:8, height:8, borderRadius:'50%', cursor:'pointer',
                  background:step===s.id?C.teal:step>s.id?C.mint:C.s200, transition:'0.15s' }}/>
              ))}
            </div>
          )}
          <div style={{ display:'flex', gap:8 }}>
            <button disabled={step===1} onClick={()=>setStep(s=>Math.max(1,s-1))} style={{
              display:'flex', alignItems:'center', gap:4, padding:isMobile?'6px 10px':'6px 14px', borderRadius:8,
              border:`1px solid ${C.s200}`, background:C.white, cursor:step===1?'not-allowed':'pointer',
              opacity:step===1?0.4:1, fontSize:12, color:C.s700, fontFamily:'inherit' }}>
              <ChevronLeft size={13}/>{!isMobile&&'Kembali'}
            </button>
            {step<6 && (
              <button onClick={()=>setStep(s=>Math.min(6,s+1))} style={{
                display:'flex', alignItems:'center', gap:4, padding:isMobile?'6px 10px':'6px 16px', borderRadius:8,
                border:'none', background:C.teal, cursor:'pointer', fontSize:12, color:C.mint, fontWeight:700, fontFamily:'inherit' }}>
                {!isMobile&&'Lanjut'}<ChevronRight size={13}/>
              </button>
            )}
          </div>
        </div>

        {/* Tablet tab bar */}
        {isTablet && (
          <div style={{ background:C.white, borderBottom:`1px solid ${C.s200}`, display:'flex', overflowX:'auto', padding:'0 14px' }}>
            {STEPS.map(s=>{
              const Ic=s.icon, active=step===s.id, done=step>s.id;
              return (
                <button key={s.id} onClick={()=>setStep(s.id)} style={{
                  display:'flex', alignItems:'center', gap:6, padding:'10px 14px',
                  background:'none', border:'none', cursor:'pointer', fontFamily:'inherit',
                  fontSize:12, fontWeight:active?700:400,
                  color:active?C.teal:done?C.green:C.s400,
                  borderBottom:`2px solid ${active?C.teal:'transparent'}`, whiteSpace:'nowrap', flexShrink:0 }}>
                  <Ic size={13}/>{s.short}{done&&<CheckCircle2 size={11} style={{ color:C.green }}/>}
                </button>
              );
            })}
          </div>
        )}

        <div style={{ padding:pad, flex:1, overflowY:'auto' }}>
          {stepContent[step-1]}
        </div>
      </div>
    </div>
  );
}
