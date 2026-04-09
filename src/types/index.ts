// ─── Typology IDs ────────────────────────────────────────────────────────────
export type TypologyId =
  | 'KANTOR'
  | 'PABRIK'
  | 'MALL'
  | 'APARTEMEN'
  | 'AIRPORT'
  | 'MASJID'
  | 'STADIUM';

// ─── Fixture type IDs ─────────────────────────────────────────────────────────
export type FixtureTypeId =
  | 'WC_FLUSH_VALVE'
  | 'WC_FLUSH_TANK'
  | 'URINAL'
  | 'KERAN_TEMBOK'
  | 'KERAN_WASTAFEL'
  | 'KERAN_WUDHU'
  | 'SHOWER';

// ─── Fixture product entry ────────────────────────────────────────────────────
export interface FixtureProduct {
  name: string;
  qty: number;
  rate: number; // L/flush or L/menit
}

export type FixtureGroup = Record<FixtureTypeId, FixtureProduct[]>;

// ─── Building data ────────────────────────────────────────────────────────────
export interface BuildingData {
  name: string;
  typology: TypologyId;
  nla: number;       // m²
  occupant1: number; // primary occupant (employees for office)
  occupant2: number; // secondary (future typologies)
  opHours: number;   // operational hours per day
}

// ─── Landscape zone ───────────────────────────────────────────────────────────
export interface LandscapeZone {
  label: string;
  basRate: number;   // L/m² per irrigation
  dsgRate: number;   // L/m² per irrigation
  areaShare: number; // 0–1, all zones must sum to 1
}

export interface LandscapeData {
  area: number;   // m² total irrigated area
  zones: LandscapeZone[];
}

// ─── Cooling Tower ────────────────────────────────────────────────────────────
export interface CoolingTowerData {
  enabled: boolean;
  load: number; // TR (Ton Refrigeration)
}

// ─── Rainwater Harvesting ─────────────────────────────────────────────────────
export interface RainwaterData {
  hasTank: boolean;
  rainyDayPct: number;  // 0–1  fraction of days with rain
  tankCapacity: number; // Liters
  avgRainfall: number;  // mm (average per event)
  runoffCoef: number;   // 0–1
  roofArea: number;     // m²
}

// ─── Neraca Air (Water Balance) — NB 2.0 approach ────────────────────────────
// Two manual matrices: wet-day scenario and dry-day scenario.
// "Tersedia" (available) is auto-computed from design values.
// "Diolah" (processed) and fulfillment columns are user-entered.

export interface WBSourceRow {
  id: string;
  // For rows whose "available" is user-supplied (CT condensate, others):
  availableManual: number; // L/day — used when id is 'ct_condensate' or 'others'
  volumeDiolah: number;    // L/day — user input (≤ available)
}

export interface WBUseRow {
  id: string;
  dariAlt: number;     // L/day from alternative water — user input
  dariRecycle: number; // L/day from recycled water   — user input
}

export interface WBScenario {
  sources: WBSourceRow[];
  uses: WBUseRow[];
}

export interface WaterBalanceData {
  wet: WBScenario; // Hari Basah
  dry: WBScenario; // Hari Kering
}

// Source / use IDs used in both scenarios
export const WB_SOURCE_IDS = [
  'flush',        // (R) Flushing WC — available = flushDsg
  'urinal',       // (R) Peturasan/Urinal — available = urinalDsg
  'tap',          // (R) Keran Tembok/Wastafel — available = tembokDsg + wastafelDsg
  'wudhu',        // (A) Keran Wudhu — available = wudhuDsg
  'shower',       // (R) Shower Mandi — available = showerDsg
  'ct_condensate',// (A) Air Kondensasi CT — available = user input
  'rainwater',    // (A) Air Hujan — wet = availWet, dry = 0
  'others',       // Lainnya — available = user input
] as const;
export type WBSourceId = typeof WB_SOURCE_IDS[number];

export const WB_USE_IDS = [
  'flush',      // Flushing WC (Flush Valve + Tank) — kebutuhan = flushDsg
  'urinal',     // Peturasan/Urinal — kebutuhan = urinalDsg
  'tap',        // Keran Tembok/Wastafel — kebutuhan = tembokDsg + wastafelDsg
  'wudhu',      // Keran Wudhu — kebutuhan = wudhuDsg
  'shower',     // Shower Mandi — kebutuhan = showerDsg
  'ct_makeup',  // Make-up Water CT — kebutuhan = ctDsg
  'irrigation', // Irigasi Lansekap — kebutuhan = lsDsg
] as const;
export type WBUseId = typeof WB_USE_IDS[number];

// ─── Full application state ───────────────────────────────────────────────────
export interface AppState {
  building: BuildingData;
  fixtures: FixtureGroup;
  hasUrinal: boolean;
  landscape: LandscapeData;
  coolingTower: CoolingTowerData;
  rainwater: RainwaterData;
  waterBalance: WaterBalanceData;
}

// ─── Calculation intermediates (returned by engine, consumed by UI) ───────────
export interface DailyConsumption {
  // Flush
  wcBL: number;       wcDsg: number;
  urinalBL: number;   urinalDsg: number;
  flushBL: number;    flushDsg: number;

  // Tap
  tembokBL: number;   tembokDsg: number;
  wastafelBL: number; wastafelDsg: number;
  wudhuBL: number;    wudhuDsg: number;
  showerBL: number;   showerDsg: number;
  tapBL: number;      tapDsg: number;

  // Landscape
  lsBL: number;       lsDsg: number;

  // Cooling Tower
  ctBL: number;       ctDsg: number;

  // Totals (before water balance)
  totalBL: number;
  totalDsg: number;

  // After neraca air reduction (weighted wet+dry)
  totalReduction: number;
  totalFromPrimary: number;
}

export interface WAC2Result {
  total: number;
  hemat: number;
  pct: number;
  pts: number; // 0–3 per NB 1.3
}

export interface WAC1Result {
  baselineNorm: number; // L/unit/day normalised per typology
  designNorm: number;
  ratio: number;        // design / baseline
  savingsPct: number;   // 1 − ratio
  p2Pass: boolean;
  pts: number;          // 0–8
}

export interface RainwaterResult {
  idealVolume: number;
  capRatio: number;
  availWet: number; // L/day available on wet days
}

export interface CalcResults {
  daily: DailyConsumption;
  wac2: WAC2Result;
  wac1: WAC1Result;
  rainwater: RainwaterResult;
  unit: string;
}

// ─── Export / Import schema ───────────────────────────────────────────────────
export interface ExportSchema {
  version: '2.0';
  exportedAt: string;
  state: AppState;
}
