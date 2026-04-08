/**
 * Import / Export utility
 * Handles JSON serialization, schema validation, and sanitization of project data.
 * No network calls — fully client-side.
 */

import type { AppState, TypologyId, FixtureTypeId } from '../types';
import {
  sanitizeText,
  sanitizeNumber,
  sanitizeRatio,
  sanitizeBool,
  sanitizeEnum,
} from './sanitize';

export const EXPORT_VERSION = '2.0' as const;

const TYPOLOGY_IDS: TypologyId[] = [
  'KANTOR', 'PABRIK', 'MALL', 'APARTEMEN', 'AIRPORT', 'MASJID', 'STADIUM',
];

const FIXTURE_IDS: FixtureTypeId[] = [
  'WC_FLUSH_VALVE', 'WC_FLUSH_TANK', 'URINAL',
  'KERAN_TEMBOK', 'KERAN_WASTAFEL', 'KERAN_WUDHU', 'SHOWER',
];

// ─── Export ───────────────────────────────────────────────────────────────────

export interface ExportPayload {
  version: typeof EXPORT_VERSION;
  exportedAt: string;
  state: AppState;
}

export function exportToJSON(state: AppState): string {
  const payload: ExportPayload = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    state,
  };
  return JSON.stringify(payload, null, 2);
}

export function downloadJSON(state: AppState, filename?: string): void {
  const json = exportToJSON(state);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? `WAC_${state.building.name || 'Project'}_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Validation ───────────────────────────────────────────────────────────────

export type ValidationResult =
  | { ok: true; state: AppState }
  | { ok: false; errors: string[] };

/**
 * Parse and validate imported JSON.
 * Returns sanitized AppState or a list of human-readable errors.
 * Never throws — all errors are caught and returned.
 */
export function parseAndValidate(raw: string): ValidationResult {
  const errors: string[] = [];

  // 1. Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, errors: ['File bukan format JSON yang valid.'] };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, errors: ['Struktur file tidak dikenali.'] };
  }

  const obj = parsed as Record<string, unknown>;

  // 2. Version check
  if (obj.version !== EXPORT_VERSION) {
    errors.push(
      `Versi file (${String(obj.version ?? '?')}) tidak sesuai dengan versi aplikasi (${EXPORT_VERSION}).`
    );
  }

  // 3. State must exist
  if (typeof obj.state !== 'object' || obj.state === null) {
    return { ok: false, errors: ['Field "state" tidak ditemukan di dalam file.'] };
  }

  const s = obj.state as Record<string, unknown>;

  // 4. Building
  const building = validateBuilding(s.building, errors);

  // 5. Fixtures
  const fixtures = validateFixtures(s.fixtures, errors);

  // 6. Top-level booleans/numbers
  const hasUrinal = sanitizeBool((s as Record<string, unknown>).hasUrinal ?? true);
  const wcRecyclePct = sanitizeRatio((s as Record<string, unknown>).wcRecyclePct ?? 0);
  const showerRecyclePct = sanitizeRatio((s as Record<string, unknown>).showerRecyclePct ?? 0);

  // 7. Sub-objects
  const landscape = validateLandscape(s.landscape, errors);
  const coolingTower = validateCoolingTower(s.coolingTower, errors);
  const rainwater = validateRainwater(s.rainwater, errors);
  const waterRecycle = validateWaterRecycle(s.waterRecycle, errors);
  const factory = validateFactory(s.factory, errors);

  // 8. Completeness gate — required fields must be present
  const required: [unknown, string][] = [
    [building.name, 'Nama bangunan'],
    [building.typology, 'Tipologi bangunan'],
    [building.occupant1 > 0 || building.nla > 0, 'Jumlah pegawai atau NLA'],
  ];
  required.forEach(([val, label]) => {
    if (!val) errors.push(`${label} wajib diisi.`);
  });

  if (errors.length > 0) return { ok: false, errors };

  const state: AppState = {
    building,
    fixtures,
    hasUrinal,
    wcRecyclePct,
    showerRecyclePct,
    landscape,
    coolingTower,
    rainwater,
    waterRecycle,
    factory,
  };

  return { ok: true, state };
}

// ─── Sub-validators ───────────────────────────────────────────────────────────

function validateBuilding(raw: unknown, errors: string[]) {
  const b = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const typology = sanitizeEnum(b.typology, TYPOLOGY_IDS, 'KANTOR');
  if (!b.typology) errors.push('Field "building.typology" tidak ditemukan.');

  return {
    name: sanitizeText(b.name ?? ''),
    typology,
    nla: sanitizeNumber(b.nla, 0, 10_000_000),
    occupant1: sanitizeNumber(b.occupant1, 0, 1_000_000),
    occupant2: sanitizeNumber(b.occupant2, 0, 1_000_000),
    opHours: sanitizeNumber(b.opHours, 1, 24),
  };
}

function validateFixtures(raw: unknown, errors: string[]) {
  const src = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const result = {} as AppState['fixtures'];

  FIXTURE_IDS.forEach((id) => {
    const arr = Array.isArray(src[id]) ? (src[id] as unknown[]) : [];
    result[id] = arr.map((item) => {
      const p = (typeof item === 'object' && item !== null ? item : {}) as Record<string, unknown>;
      return {
        name: sanitizeText(p.name ?? ''),
        qty: sanitizeNumber(p.qty, 0, 100_000),
        rate: sanitizeNumber(p.rate, 0, 1000),
      };
    });
    if (result[id].length === 0) result[id] = [{ name: '', qty: 0, rate: 0 }];
  });

  if (!raw) errors.push('Field "fixtures" tidak ditemukan.');
  return result;
}

function validateLandscape(raw: unknown, errors: string[]) {
  const ls = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const zones = Array.isArray(ls.zones)
    ? (ls.zones as unknown[]).map((z) => {
        const zz = (typeof z === 'object' && z !== null ? z : {}) as Record<string, unknown>;
        return {
          label: sanitizeText(zz.label ?? 'Area'),
          basRate: sanitizeNumber(zz.basRate, 0, 1000),
          dsgRate: sanitizeNumber(zz.dsgRate, 0, 1000),
          areaShare: sanitizeRatio(zz.areaShare),
        };
      })
    : [{ label: 'Area 1', basRate: 5, dsgRate: 0, areaShare: 1 }];

  return {
    area: sanitizeNumber(ls.area, 0, 100_000_000),
    pctFromNonPrimary: sanitizeRatio(ls.pctFromNonPrimary),
    zones,
  };
}

function validateCoolingTower(raw: unknown, _errors: string[]) {
  const ct = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    enabled: sanitizeBool(ct.enabled),
    load: sanitizeNumber(ct.load, 0, 100_000),
    pctFromNonPrimary: sanitizeRatio(ct.pctFromNonPrimary),
  };
}

function validateRainwater(raw: unknown, _errors: string[]) {
  const rw = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    hasTank: sanitizeBool(rw.hasTank),
    tankCapacity: sanitizeNumber(rw.tankCapacity, 0, 1_000_000_000),
    avgRainfall: sanitizeNumber(rw.avgRainfall, 0, 10_000),
    runoffCoef: sanitizeRatio(rw.runoffCoef ?? 0.78),
    roofArea: sanitizeNumber(rw.roofArea, 0, 10_000_000),
    useForFlush: sanitizeBool(rw.useForFlush),
    useForIrrigation: sanitizeBool(rw.useForIrrigation),
    useForCT: sanitizeBool(rw.useForCT),
  };
}

function validateWaterRecycle(raw: unknown, _errors: string[]) {
  const rc = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    hasSystem: sanitizeBool(rc.hasSystem),
    capacity: sanitizeNumber(rc.capacity, 0, 1_000_000_000),
    sourcesTap: sanitizeBool(rc.sourcesTap),
    sourcesWudhu: sanitizeBool(rc.sourcesWudhu),
    sourcesShower: sanitizeBool(rc.sourcesShower),
    sourcesRainwater: sanitizeBool(rc.sourcesRainwater),
    sourcesAHU: sanitizeNumber(rc.sourcesAHU, 0, 1_000_000_000),
    sourcesOthers: sanitizeNumber(rc.sourcesOthers, 0, 1_000_000_000),
    useForFlush: sanitizeBool(rc.useForFlush),
    useForIrrigation: sanitizeBool(rc.useForIrrigation),
    useForCT: sanitizeBool(rc.useForCT),
  };
}

function validateFactory(raw: unknown, _errors: string[]) {
  const f = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const equipment = Array.isArray(f.equipment)
    ? (f.equipment as unknown[]).map((e) => {
        const ee = (typeof e === 'object' && e !== null ? e : {}) as Record<string, unknown>;
        return {
          name: sanitizeText(ee.name ?? ''),
          qty: sanitizeNumber(ee.qty, 0, 100_000),
          outputPerUnit: sanitizeNumber(ee.outputPerUnit, 0, 1_000_000),
        };
      })
    : [];

  return {
    shift1: sanitizeNumber(f.shift1, 0, 1_000_000),
    shift2: sanitizeNumber(f.shift2, 0, 1_000_000),
    shift3: sanitizeNumber(f.shift3, 0, 1_000_000),
    malePct: sanitizeRatio(f.malePct ?? 0.9),
    equipment,
  };
}

// ─── File picker helper ───────────────────────────────────────────────────────

export function pickJSONFile(): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error('No file selected'));
      if (file.size > 5 * 1024 * 1024) {
        return reject(new Error('File terlalu besar (maks 5 MB)'));
      }
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsText(file);
    };
    input.click();
  });
}
