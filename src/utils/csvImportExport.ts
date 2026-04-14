/**
 * CSV Import / Export for the GREENSHIP WAC Calculator
 *
 * Format: 7-column flat table — TYPE, SUBTYPE, ID, VALUE1, VALUE2, VALUE3, VALUE4
 * Lines starting with # are comments and are skipped during import.
 * Empty VALUE cells are treated as 0 (numbers) or '' (text).
 *
 * Section types:
 *   BUILDING   — scalar building fields
 *   SETTING    — boolean settings (hasUrinal)
 *   FIXTURE    — fixture products (up to 4 per fixture type)
 *   LANDSCAPE  — landscape zone rows
 *   CT         — cooling tower
 *   RAINWATER  — rainwater harvesting
 *   WB_SOURCE  — water balance source rows (wet + dry)
 *   WB_USE     — water balance use rows (wet + dry)
 */

import type { AppState } from '../types';
import { WB_SOURCE_IDS, WB_USE_IDS } from '../types';
import { TYPOLOGY_CONFIG } from '../constants/typologies';
import { FIXTURE_BASELINES } from '../constants/baselines';
import { DEFAULT_STATE, mkWBScenario } from './defaults';
import { sanitizeText, sanitizeNumber, sanitizeRatio, sanitizeBool, sanitizeEnum } from './sanitize';

// ─── Types ────────────────────────────────────────────────────────────────────

type CsvRow = string[];
type ParsedRows = Map<string, CsvRow[]>; // key = `${TYPE}|${SUBTYPE}|${ID}`

export type CsvValidationResult =
  | { ok: true; state: AppState }
  | { ok: false; errors: string[] };

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPOLOGY_IDS = Object.keys(TYPOLOGY_CONFIG);
const FIXTURE_IDS = Object.keys(FIXTURE_BASELINES) as (keyof typeof FIXTURE_BASELINES)[];

// Source IDs that need manual "available" input
const MANUAL_AVAIL_SOURCES = ['ct_condensate', 'others'] as const;

// ─── CSV escaping ─────────────────────────────────────────────────────────────

function esc(v: string | number | boolean): string {
  const s = String(v);
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function row(...cells: (string | number | boolean)[]): string {
  return cells.map(esc).join(',');
}

// ─── Template & Export ────────────────────────────────────────────────────────

/**
 * Generate a filled CSV from the current AppState.
 * All user-editable values are written out, ready to re-import.
 */
export function exportToCSV(state: AppState): string {
  const lines: string[] = [];

  const hdr = (title: string) => {
    lines.push('');
    lines.push(`# ${'═'.repeat(60)}`);
    lines.push(`# ${title}`);
    lines.push(`# ${'═'.repeat(60)}`);
  };

  // Column header
  lines.push('# GREENSHIP NB 1.2 — Kalkulator Air WAC — Data Proyek');
  lines.push('# Format: TYPE,SUBTYPE,ID,VALUE1,VALUE2,VALUE3,VALUE4');
  lines.push('# Jangan ubah kolom TYPE/SUBTYPE/ID. Isi kolom VALUE saja.');
  lines.push(row('TYPE','SUBTYPE','ID','VALUE1','VALUE2','VALUE3','VALUE4'));

  // ── BUILDING ──────────────────────────────────────────────────────
  hdr('DATA BANGUNAN');
  lines.push('# VALUE1: nilai field');
  lines.push(row('BUILDING','name','',      state.building.name, '','',''));
  lines.push(row('BUILDING','typology','',  state.building.typology,'','',''));
  lines.push(row('BUILDING','nla','',       state.building.nla,'','',''));
  lines.push(row('BUILDING','occupant1','', state.building.occupant1,'','',''));
  lines.push(row('BUILDING','opHours','',   state.building.opHours,'','',''));

  // ── SETTINGS ──────────────────────────────────────────────────────
  hdr('PENGATURAN');
  lines.push('# hasUrinal: YES atau NO');
  lines.push(row('SETTING','hasUrinal','', state.hasUrinal ? 'YES' : 'NO','','',''));

  // ── FIXTURES ──────────────────────────────────────────────────────
  hdr('FITUR AIR (Water Fixtures)');
  lines.push('# VALUE1=nama produk  VALUE2=jumlah unit  VALUE3=laju desain (L/flush atau L/menit)');
  lines.push('# Biarkan VALUE2 dan VALUE3 = 0 jika produk tidak digunakan');
  FIXTURE_IDS.forEach(type => {
    const bl = FIXTURE_BASELINES[type];
    lines.push(`# --- ${bl.label} (Baseline: ≤ ${bl.baseline} ${bl.unit}) ---`);
    const prods = state.fixtures[type];
    for (let i = 0; i < 4; i++) {
      const p = prods[i] ?? { name: '', qty: 0, rate: 0 };
      lines.push(row('FIXTURE', type, String(i + 1), p.name, p.qty, p.rate, ''));
    }
  });

  // ── LANDSCAPE ─────────────────────────────────────────────────────
  hdr('LANSEKAP / IRIGASI');
  lines.push('# LANDSCAPE,area — luas total lansekap (m²)');
  lines.push(row('LANDSCAPE','area','', state.landscape.area,'','',''));
  lines.push('# LANDSCAPE,zone — VALUE1=label VALUE2=basRate(L/m²) VALUE3=dsgRate(L/m²) VALUE4=areaShare(0-100%)');
  const zones = state.landscape.zones;
  for (let i = 0; i < 5; i++) {
    const z = zones[i] ?? { label: '', basRate: 5, dsgRate: 0, areaShare: 0 };
    const share = i < zones.length ? parseFloat((z.areaShare * 100).toFixed(3)) : 0;
    lines.push(row('LANDSCAPE','zone', String(i + 1), z.label, z.basRate, z.dsgRate, share));
  }

  // ── COOLING TOWER ─────────────────────────────────────────────────
  hdr('COOLING TOWER');
  lines.push('# enabled: YES atau NO');
  lines.push(row('CT','enabled','', state.coolingTower.enabled ? 'YES' : 'NO','','',''));
  lines.push('# load: beban pendinginan dalam TR (Ton Refrigeration)');
  lines.push(row('CT','load','', state.coolingTower.load,'','',''));

  // ── RAINWATER ─────────────────────────────────────────────────────
  hdr('AIR HUJAN (Rainwater Harvesting)');
  lines.push('# hasTank: YES atau NO');
  lines.push(row('RAINWATER','hasTank','',      state.rainwater.hasTank ? 'YES' : 'NO','','',''));
  lines.push('# rainyDayPct: persentase hari hujan (0–100)');
  lines.push(row('RAINWATER','rainyDayPct','',  parseFloat((state.rainwater.rainyDayPct * 100).toFixed(3)),'','',''));
  lines.push(row('RAINWATER','tankCapacity','', state.rainwater.tankCapacity,'','',''));
  lines.push(row('RAINWATER','avgRainfall','',  state.rainwater.avgRainfall,'','',''));
  lines.push(row('RAINWATER','runoffCoef','',   state.rainwater.runoffCoef,'','',''));
  lines.push(row('RAINWATER','roofArea','',     state.rainwater.roofArea,'','',''));

  // ── NERACA AIR ────────────────────────────────────────────────────
  hdr('NERACA AIR — SUMBER (Water Balance Sources)');
  lines.push('# WB_SOURCE,wet/dry,[sourceId] — VALUE1=volumeDiolah(L/hari) VALUE2=availableManual(L/hari, hanya ct_condensate & others)');

  (['wet','dry'] as const).forEach(scenario => {
    lines.push(`# --- Skenario: ${scenario === 'wet' ? 'HARI BASAH' : 'HARI KERING'} ---`);
    const sc = state.waterBalance[scenario];
    WB_SOURCE_IDS.forEach(id => {
      const srcRow = sc.sources.find(r => r.id === id) ?? { id, availableManual: 0, volumeDiolah: 0 };
      const needsManual = MANUAL_AVAIL_SOURCES.includes(id as typeof MANUAL_AVAIL_SOURCES[number]);
      lines.push(row('WB_SOURCE', scenario, id,
        srcRow.volumeDiolah,
        needsManual ? srcRow.availableManual : '',
        '', ''));
    });
  });

  hdr('NERACA AIR — PENGGUNAAN (Water Balance Uses)');
  lines.push('# WB_USE,wet/dry,[useId] — VALUE1=dariAlt(L/hari) VALUE2=dariRecycle(L/hari)');

  (['wet','dry'] as const).forEach(scenario => {
    lines.push(`# --- Skenario: ${scenario === 'wet' ? 'HARI BASAH' : 'HARI KERING'} ---`);
    const sc = state.waterBalance[scenario];
    WB_USE_IDS.forEach(id => {
      const useRow = sc.uses.find(r => r.id === id) ?? { id, dariAlt: 0, dariRecycle: 0 };
      lines.push(row('WB_USE', scenario, id, useRow.dariAlt, useRow.dariRecycle,'',''));
    });
  });

  return lines.join('\n');
}

/**
 * Generate an empty template CSV with all fields at default/zero values
 * and helpful comments explaining each field.
 */
export function generateTemplate(): string {
  return exportToCSV(DEFAULT_STATE);
}

// ─── Download helpers ─────────────────────────────────────────────────────────

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCSV(state: AppState): void {
  const name = state.building.name || 'Proyek';
  triggerDownload(exportToCSV(state), `WAC_${name}_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
}

export function downloadTemplate(): void {
  triggerDownload(generateTemplate(), 'WAC_Template_Import.csv', 'text/csv;charset=utf-8;');
}

// ─── CSV Parsing ──────────────────────────────────────────────────────────────

/** Parse raw CSV text into an array of string-array rows, skipping comment lines */
function parseRawCSV(raw: string): string[][] {
  const rows: string[][] = [];
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    rows.push(splitCSVRow(trimmed));
  }
  return rows;
}

/** RFC 4180-compliant CSV row splitter */
function splitCSVRow(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      cells.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells.map(c => c.trim());
}

/** Numeric coercion — returns 0 on empty/non-numeric */
function num(v: string | undefined): number {
  if (!v || v === '') return 0;
  const n = parseFloat(v);
  return isFinite(n) ? n : 0;
}

/** Boolean coercion — YES/TRUE/1 → true */
function bool(v: string | undefined): boolean {
  return /^(yes|true|1)$/i.test(v?.trim() ?? '');
}

// ─── Import / Validate ────────────────────────────────────────────────────────

export function parseCSV(raw: string): CsvValidationResult {
  const errors: string[] = [];

  let allRows: string[][];
  try {
    allRows = parseRawCSV(raw);
  } catch {
    return { ok: false, errors: ['Gagal mem-parse file CSV.'] };
  }

  // Skip the header row (TYPE,SUBTYPE,ID,...)
  const dataRows = allRows.filter(r => r[0]?.toUpperCase() !== 'TYPE');

  // Group by TYPE
  const byType = new Map<string, string[][]>();
  dataRows.forEach(r => {
    const type = (r[0] ?? '').toUpperCase();
    if (!byType.has(type)) byType.set(type, []);
    byType.get(type)!.push(r);
  });

  const get = (type: string) => byType.get(type) ?? [];

  // Helper: find a row by SUBTYPE
  const findRow = (rows: string[][], subtype: string): string[] | undefined =>
    rows.find(r => r[1]?.toLowerCase() === subtype.toLowerCase());

  // ── BUILDING ──────────────────────────────────────────────────────
  const bRows = get('BUILDING');
  const getName  = () => sanitizeText(findRow(bRows,'name')?.[3] ?? '');
  const getTypo  = () => sanitizeEnum(findRow(bRows,'typology')?.[3]?.toUpperCase(), TYPOLOGY_IDS as string[], 'KANTOR') as AppState['building']['typology'];
  const getNLA   = () => sanitizeNumber(num(findRow(bRows,'nla')?.[3]), 0, 1e8);
  const getOcc   = () => sanitizeNumber(num(findRow(bRows,'occupant1')?.[3]), 0, 1e6);
  const getHours = () => sanitizeNumber(num(findRow(bRows,'opHours')?.[3]) || 8, 1, 24);

  const name  = getName();
  const typology = getTypo();
  const occ   = getOcc();
  const nla   = getNLA();

  if (!name)     errors.push('Nama bangunan (BUILDING,name) wajib diisi.');
  if (!typology) errors.push('Tipologi (BUILDING,typology) wajib diisi.');
  if (occ <= 0 && nla <= 0) errors.push('Jumlah pegawai (BUILDING,occupant1) atau NLA wajib > 0.');

  // ── SETTING ───────────────────────────────────────────────────────
  const sRows    = get('SETTING');
  const hasUrinal = bool(findRow(sRows,'hasUrinal')?.[3] ?? 'YES');

  // ── FIXTURES ──────────────────────────────────────────────────────
  const fRows = get('FIXTURE');
  const fixtures = { ...DEFAULT_STATE.fixtures };
  FIXTURE_IDS.forEach(type => {
    const typeRows = fRows.filter(r => r[1]?.toUpperCase() === type);
    const products = typeRows.map(r => ({
      name: sanitizeText(r[3] ?? ''),
      qty:  sanitizeNumber(num(r[4]), 0, 1e5),
      rate: sanitizeNumber(num(r[5]), 0, 1000),
    })).filter(p => p.qty > 0 || p.rate > 0 || p.name !== '');
    fixtures[type] = products.length > 0 ? products : [{ name: '', qty: 0, rate: 0 }];
  });

  // ── LANDSCAPE ─────────────────────────────────────────────────────
  const lRows = get('LANDSCAPE');
  const lsArea = sanitizeNumber(num(findRow(lRows,'area')?.[3]), 0, 1e8);
  const zoneRows = lRows.filter(r => r[1]?.toLowerCase() === 'zone');
  const zones = zoneRows
    .filter(r => num(r[6]) > 0 || r[3]) // has area share or label
    .map(r => ({
      label:     sanitizeText(r[3] ?? `Area ${r[2]}`),
      basRate:   sanitizeNumber(num(r[4]) || 5, 0, 1000),
      dsgRate:   sanitizeNumber(num(r[5]), 0, 1000),
      areaShare: sanitizeRatio(num(r[6]) / 100),
    }));
  const landscape = {
    area: lsArea,
    zones: zones.length > 0 ? zones : DEFAULT_STATE.landscape.zones,
  };

  // Landscape share validation (warning, not error)
  if (zones.length > 0) {
    const shareSum = zones.reduce((s, z) => s + z.areaShare, 0);
    if (Math.abs(shareSum - 1) > 0.01) {
      errors.push(`Total area share lansekap = ${(shareSum * 100).toFixed(1)}% (harus 100%). Periksa kolom VALUE4 baris LANDSCAPE,zone.`);
    }
  }

  // ── COOLING TOWER ─────────────────────────────────────────────────
  const cRows = get('CT');
  const coolingTower = {
    enabled: bool(findRow(cRows,'enabled')?.[3]),
    load:    sanitizeNumber(num(findRow(cRows,'load')?.[3]), 0, 1e5),
  };

  // ── RAINWATER ─────────────────────────────────────────────────────
  const rRows = get('RAINWATER');
  const rainwater = {
    hasTank:      bool(findRow(rRows,'hasTank')?.[3]),
    rainyDayPct:  sanitizeRatio(num(findRow(rRows,'rainyDayPct')?.[3]) / 100),
    tankCapacity: sanitizeNumber(num(findRow(rRows,'tankCapacity')?.[3]), 0, 1e10),
    avgRainfall:  sanitizeNumber(num(findRow(rRows,'avgRainfall')?.[3]), 0, 1e4),
    runoffCoef:   sanitizeRatio(num(findRow(rRows,'runoffCoef')?.[3]) || 0.78),
    roofArea:     sanitizeNumber(num(findRow(rRows,'roofArea')?.[3]), 0, 1e8),
  };

  // ── NERACA AIR ────────────────────────────────────────────────────
  const srcRows = get('WB_SOURCE');
  const useRows = get('WB_USE');

  const parseScenario = (scenario: 'wet' | 'dry') => {
    const sc = mkWBScenario();

    sc.sources = WB_SOURCE_IDS.map(id => {
      const r = srcRows.find(row => row[1]?.toLowerCase() === scenario && row[2]?.toLowerCase() === id);
      const needsManual = MANUAL_AVAIL_SOURCES.includes(id as typeof MANUAL_AVAIL_SOURCES[number]);
      return {
        id,
        volumeDiolah:    sanitizeNumber(num(r?.[3]), 0, 1e10),
        availableManual: needsManual ? sanitizeNumber(num(r?.[4]), 0, 1e10) : 0,
      };
    });

    sc.uses = WB_USE_IDS.map(id => {
      const r = useRows.find(row => row[1]?.toLowerCase() === scenario && row[2]?.toLowerCase() === id);
      return {
        id,
        dariAlt:     sanitizeNumber(num(r?.[3]), 0, 1e10),
        dariRecycle: sanitizeNumber(num(r?.[4]), 0, 1e10),
      };
    });

    return sc;
  };

  const waterBalance = {
    wet: parseScenario('wet'),
    dry: parseScenario('dry'),
  };

  if (errors.length > 0) return { ok: false, errors };

  const state: AppState = {
    building: { name, typology, nla, occupant1: occ, occupant2: 0, opHours: getHours() },
    fixtures,
    hasUrinal,
    landscape,
    coolingTower,
    rainwater,
    waterBalance,
  };

  return { ok: true, state };
}

/** File picker for CSV files */
export function pickCSVFile(): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type   = 'file';
    input.accept = '.csv,text/csv';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error('Tidak ada file dipilih'));
      if (file.size > 5 * 1024 * 1024) return reject(new Error('File terlalu besar (maks 5 MB)'));
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsText(file, 'utf-8');
    };
    input.click();
  });
}
