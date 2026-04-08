import type { FixtureTypeId } from '../types';

// ─── NB 1.2 Fixture Baseline Values ──────────────────────────────────────────
// Source: GREENSHIP Water Calculator v2.2 (2024)
// Note: NB 1.2 differs from NB 2.0 — WC 6L/flush, Wastafel/Wudhu 8L/menit

export interface FixtureBaseline {
  baseline: number;
  unit: string;
  label: string;
  labelId: string; // Indonesian label
}

export const FIXTURE_BASELINES: Record<FixtureTypeId, FixtureBaseline> = {
  WC_FLUSH_VALVE: {
    baseline: 6,
    unit: 'L/flush',
    label: 'WC Flush Valve',
    labelId: 'WC Flush Valve',
  },
  WC_FLUSH_TANK: {
    baseline: 6,
    unit: 'L/flush',
    label: 'WC Flush Tank',
    labelId: 'WC Flush Tank',
  },
  URINAL: {
    baseline: 4,
    unit: 'L/flush',
    label: 'Peturasan / Urinal',
    labelId: 'Peturasan / Urinal',
  },
  KERAN_TEMBOK: {
    baseline: 8,
    unit: 'L/menit',
    label: 'Keran Tembok',
    labelId: 'Keran Tembok',
  },
  KERAN_WASTAFEL: {
    baseline: 8,
    unit: 'L/menit',
    label: 'Keran Wastafel',
    labelId: 'Keran Wastafel',
  },
  KERAN_WUDHU: {
    baseline: 8,
    unit: 'L/menit',
    label: 'Keran Wudhu',
    labelId: 'Keran Wudhu',
  },
  SHOWER: {
    baseline: 9,
    unit: 'L/menit',
    label: 'Shower Mandi',
    labelId: 'Shower Mandi',
  },
};

// ─── Fixture categories ───────────────────────────────────────────────────────
export const FLUSH_FIXTURES: FixtureTypeId[] = [
  'WC_FLUSH_VALVE',
  'WC_FLUSH_TANK',
  'URINAL',
];

export const TAP_FIXTURES: FixtureTypeId[] = [
  'KERAN_TEMBOK',
  'KERAN_WASTAFEL',
  'KERAN_WUDHU',
  'SHOWER',
];

// Fixtures not applicable for certain typologies
export const FIXTURE_AVAILABILITY: Record<string, FixtureTypeId[]> = {
  KANTOR:    ['WC_FLUSH_VALVE','WC_FLUSH_TANK','URINAL','KERAN_TEMBOK','KERAN_WASTAFEL','KERAN_WUDHU','SHOWER'],
  PABRIK:    ['WC_FLUSH_VALVE','WC_FLUSH_TANK','URINAL','KERAN_TEMBOK','KERAN_WASTAFEL','KERAN_WUDHU','SHOWER'],
  MALL:      ['WC_FLUSH_VALVE','WC_FLUSH_TANK','URINAL','KERAN_TEMBOK','KERAN_WASTAFEL','KERAN_WUDHU','SHOWER'],
  APARTEMEN: ['WC_FLUSH_VALVE','WC_FLUSH_TANK','URINAL','KERAN_TEMBOK','KERAN_WASTAFEL','SHOWER'],
  AIRPORT:   ['WC_FLUSH_VALVE','WC_FLUSH_TANK','URINAL','KERAN_TEMBOK','KERAN_WASTAFEL','KERAN_WUDHU','SHOWER'],
  MASJID:    ['WC_FLUSH_VALVE','WC_FLUSH_TANK','URINAL','KERAN_TEMBOK','KERAN_WASTAFEL','KERAN_WUDHU','SHOWER'],
  STADIUM:   ['WC_FLUSH_VALVE','WC_FLUSH_TANK','URINAL','KERAN_TEMBOK','KERAN_WASTAFEL','KERAN_WUDHU','SHOWER'],
};
