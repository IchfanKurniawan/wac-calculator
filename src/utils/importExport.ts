/**
 * Import / Export — JSON serialisation + schema validation.
 * Client-side only. No network calls.
 */

import type { AppState, TypologyId, FixtureTypeId } from '../types';
import { WB_SOURCE_IDS, WB_USE_IDS } from '../types';
import { sanitizeText, sanitizeNumber, sanitizeRatio, sanitizeBool, sanitizeEnum } from './sanitize';
import { mkWBScenario } from './defaults';

export const EXPORT_VERSION = '2.0' as const;

const TYPOLOGY_IDS: TypologyId[] = ['KANTOR','PABRIK','MALL','APARTEMEN','AIRPORT','MASJID','STADIUM'];
const FIXTURE_IDS: FixtureTypeId[] = ['WC_FLUSH_VALVE','WC_FLUSH_TANK','URINAL','KERAN_TEMBOK','KERAN_WASTAFEL','KERAN_WUDHU','SHOWER'];

// ─── Export ───────────────────────────────────────────────────────────────────

export interface ExportPayload {
  version: typeof EXPORT_VERSION;
  exportedAt: string;
  state: AppState;
}

export function exportToJSON(state: AppState): string {
  const payload: ExportPayload = { version: EXPORT_VERSION, exportedAt: new Date().toISOString(), state };
  return JSON.stringify(payload, null, 2);
}

export function downloadJSON(state: AppState, filename?: string): void {
  const json = exportToJSON(state);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename ?? `WAC_${state.building.name || 'Proyek'}_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Validation ───────────────────────────────────────────────────────────────

export type ValidationResult =
  | { ok: true; state: AppState }
  | { ok: false; errors: string[] };

export function parseAndValidate(raw: string): ValidationResult {
  const errors: string[] = [];

  let parsed: unknown;
  try { parsed = JSON.parse(raw); }
  catch { return { ok: false, errors: ['File bukan format JSON yang valid.'] }; }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
    return { ok: false, errors: ['Struktur file tidak dikenali.'] };

  const obj = parsed as Record<string, unknown>;

  if (obj.version !== EXPORT_VERSION)
    errors.push(`Versi file "${String(obj.version ?? '?')}" tidak cocok dengan versi aplikasi (${EXPORT_VERSION}).`);

  if (typeof obj.state !== 'object' || obj.state === null)
    return { ok: false, errors: ['Field "state" tidak ditemukan.'] };

  const s = obj.state as Record<string, unknown>;

  const building      = validateBuilding(s.building, errors);
  const fixtures      = validateFixtures(s.fixtures, errors);
  const hasUrinal     = sanitizeBool((s as Record<string,unknown>).hasUrinal ?? true);
  const landscape     = validateLandscape(s.landscape, errors);
  const coolingTower  = validateCT(s.coolingTower);
  const rainwater     = validateRainwater(s.rainwater);
  const waterBalance  = validateWaterBalance(s.waterBalance);

  // Required-field gate
  if (!building.name)      errors.push('Nama bangunan wajib diisi.');
  if (!building.typology)  errors.push('Tipologi bangunan wajib diisi.');
  if (building.occupant1 <= 0 && building.nla <= 0)
    errors.push('Jumlah pegawai atau NLA wajib diisi.');

  if (errors.length > 0) return { ok: false, errors };

  const state: AppState = { building, fixtures, hasUrinal, landscape, coolingTower, rainwater, waterBalance };
  return { ok: true, state };
}

// ─── Sub-validators ───────────────────────────────────────────────────────────

function validateBuilding(raw: unknown, errors: string[]) {
  const b = obj(raw);
  const typology = sanitizeEnum(b.typology, TYPOLOGY_IDS, 'KANTOR');
  if (!b.typology) errors.push('Field "building.typology" tidak ditemukan.');
  return {
    name:      sanitizeText(b.name ?? ''),
    typology,
    nla:       sanitizeNumber(b.nla, 0, 1e8),
    occupant1: sanitizeNumber(b.occupant1, 0, 1e6),
    occupant2: sanitizeNumber(b.occupant2, 0, 1e6),
    opHours:   sanitizeNumber(b.opHours, 1, 24),
  };
}

function validateFixtures(raw: unknown, errors: string[]) {
  const src = obj(raw);
  const result = {} as AppState['fixtures'];
  FIXTURE_IDS.forEach(id => {
    const arr = Array.isArray(src[id]) ? (src[id] as unknown[]) : [];
    result[id] = arr.map(item => {
      const p = obj(item);
      return { name: sanitizeText(p.name ?? ''), qty: sanitizeNumber(p.qty, 0, 1e5), rate: sanitizeNumber(p.rate, 0, 1000) };
    });
    if (result[id].length === 0) result[id] = [{ name: '', qty: 0, rate: 0 }];
  });
  if (!raw) errors.push('Field "fixtures" tidak ditemukan.');
  return result;
}

function validateLandscape(raw: unknown, errors: string[]) {
  const ls = obj(raw);
  const zones = Array.isArray(ls.zones) ? (ls.zones as unknown[]).map(z => {
    const zz = obj(z);
    return {
      label: sanitizeText(zz.label ?? 'Area'),
      basRate: sanitizeNumber(zz.basRate, 0, 1000),
      dsgRate: sanitizeNumber(zz.dsgRate, 0, 1000),
      areaShare: sanitizeRatio(zz.areaShare),
    };
  }) : [{ label: 'Area 1', basRate: 5, dsgRate: 0, areaShare: 1 }];
  return { area: sanitizeNumber(ls.area, 0, 1e8), zones };
}

function validateCT(raw: unknown) {
  const ct = obj(raw);
  return { enabled: sanitizeBool(ct.enabled), load: sanitizeNumber(ct.load, 0, 1e5) };
}

function validateRainwater(raw: unknown) {
  const rw = obj(raw);
  return {
    hasTank:      sanitizeBool(rw.hasTank),
    rainyDayPct:  sanitizeRatio(rw.rainyDayPct ?? 0.55),
    tankCapacity: sanitizeNumber(rw.tankCapacity, 0, 1e10),
    avgRainfall:  sanitizeNumber(rw.avgRainfall, 0, 1e4),
    runoffCoef:   sanitizeRatio(rw.runoffCoef ?? 0.78),
    roofArea:     sanitizeNumber(rw.roofArea, 0, 1e8),
  };
}

function validateWaterBalance(raw: unknown): AppState['waterBalance'] {
  if (typeof raw !== 'object' || raw === null) return { wet: mkWBScenario(), dry: mkWBScenario() };
  const wb = raw as Record<string, unknown>;

  const validateScenario = (sc: unknown): AppState['waterBalance']['wet'] => {
    if (typeof sc !== 'object' || sc === null) return mkWBScenario();
    const s = sc as Record<string, unknown>;
    const sources = Array.isArray(s.sources) ? s.sources.map((r: unknown) => {
      const rr = obj(r);
      return {
        id: sanitizeText(rr.id ?? ''),
        availableManual: sanitizeNumber(rr.availableManual, 0, 1e10),
        volumeDiolah:    sanitizeNumber(rr.volumeDiolah, 0, 1e10),
      };
    }) : mkWBScenario().sources;
    const uses = Array.isArray(s.uses) ? s.uses.map((r: unknown) => {
      const rr = obj(r);
      return {
        id:          sanitizeText(rr.id ?? ''),
        dariAlt:     sanitizeNumber(rr.dariAlt, 0, 1e10),
        dariRecycle: sanitizeNumber(rr.dariRecycle, 0, 1e10),
      };
    }) : mkWBScenario().uses;
    return { sources, uses };
  };

  return { wet: validateScenario(wb.wet), dry: validateScenario(wb.dry) };
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function obj(v: unknown): Record<string, unknown> {
  return (typeof v === 'object' && v !== null && !Array.isArray(v))
    ? v as Record<string, unknown>
    : {};
}

// ─── File picker ──────────────────────────────────────────────────────────────
export function pickJSONFile(): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type   = 'file';
    input.accept = '.json,application/json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error('Tidak ada file dipilih'));
      if (file.size > 5 * 1024 * 1024) return reject(new Error('File terlalu besar (maks 5 MB)'));
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsText(file);
    };
    input.click();
  });
}
