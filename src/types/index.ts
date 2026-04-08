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
  nla: number;          // m²
  occupant1: number;    // primary (employees / residents)
  occupant2: number;    // secondary (visitors / units)
  opHours: number;      // operational hours per day
}

// ─── Landscape zone ───────────────────────────────────────────────────────────
export interface LandscapeZone {
  label: string;
  basRate: number;    // L/m²
  dsgRate: number;    // L/m²
  areaShare: number;  // 0–1, must sum to 1
}

export interface LandscapeData {
  area: number;              // m² total irrigated area
  pctFromNonPrimary: number; // 0–1
  zones: LandscapeZone[];
}

// ─── Cooling Tower ────────────────────────────────────────────────────────────
export interface CoolingTowerData {
  enabled: boolean;
  load: number;              // TR (Ton Refrigeration)
  pctFromNonPrimary: number; // 0–1
}

// ─── Rainwater Harvesting ─────────────────────────────────────────────────────
export interface RainwaterData {
  hasTank: boolean;
  tankCapacity: number;    // Liters
  avgRainfall: number;     // mm (average)
  runoffCoef: number;      // 0–1
  roofArea: number;        // m²
  useForFlush: boolean;
  useForIrrigation: boolean;
  useForCT: boolean;
}

// ─── Water Recycle ────────────────────────────────────────────────────────────
export interface WaterRecycleData {
  hasSystem: boolean;
  capacity: number;          // L/day max capacity
  sourcesTap: boolean;       // uses tap water as source
  sourcesWudhu: boolean;
  sourcesShower: boolean;
  sourcesRainwater: boolean;
  sourcesAHU: number;        // L/day from AHU condensate
  sourcesOthers: number;     // L/day from other sources
  useForFlush: boolean;
  useForIrrigation: boolean;
  useForCT: boolean;
}

// ─── Factory-specific data ────────────────────────────────────────────────────
export interface FactoryEquipment {
  name: string;
  qty: number;
  outputPerUnit: number; // L/day per unit
}

export interface FactoryData {
  shift1: number;
  shift2: number;
  shift3: number;
  malePct: number;     // 0–1
  equipment: FactoryEquipment[];
}

// ─── Full application state ───────────────────────────────────────────────────
export interface AppState {
  building: BuildingData;
  fixtures: FixtureGroup;
  hasUrinal: boolean;
  wcRecyclePct: number;    // 0–1: fraction of WC flush from recycle
  showerRecyclePct: number;
  landscape: LandscapeData;
  coolingTower: CoolingTowerData;
  rainwater: RainwaterData;
  waterRecycle: WaterRecycleData;
  factory: FactoryData;
}

// ─── Calculation results ──────────────────────────────────────────────────────
export interface DailyConsumption {
  // Flush (L/day)
  wcBL: number;        wcDsg: number;
  urinalBL: number;    urinalDsg: number;
  flushBL: number;     flushDsg: number;
  flushPrimary: number;

  // Tap (L/day)
  tembokBL: number;    tembokDsg: number;
  wastafelBL: number;  wastafelDsg: number;
  wudhuBL: number;     wudhuDsg: number;
  showerBL: number;    showerDsg: number;
  tapBL: number;       tapDsg: number;
  tapPrimary: number;

  // Landscape (L/day)
  lsBL: number;        lsDsg: number;
  lsPrimary: number;

  // Cooling Tower (L/day)
  ctBL: number;        ctDsg: number;
  ctPrimary: number;

  // Equipment (Factory only, L/day)
  equipBL: number;     equipDsg: number;

  // Rainwater reductions (L/day)
  rwFlushRed: number;
  rwIrrigRed: number;
  rwCTRed: number;

  // Recycle reductions (L/day)
  recycleFlushRed: number;
  recycleIrrigRed: number;
  recycleCTRed: number;

  // Totals
  totalBL: number;
  totalDsg: number;
  totalFromPrimary: number;
}

export interface WAC2Result {
  total: number;
  hemat: number;
  pct: number;
  pts: number; // 0–4
}

export interface WAC1Result {
  baselineNorm: number;  // L/unit/day, typology-specific
  designNorm: number;
  ratio: number;         // design / baseline
  savingsPct: number;    // 1 - ratio
  p2Pass: boolean;
  pts: number;           // 0–8
}

export interface RainwaterResult {
  idealVolume: number;
  capRatio: number;
  availWet: number;
}

export interface CalcResults {
  daily: DailyConsumption;
  wac2: WAC2Result;
  wac1: WAC1Result;
  rainwater: RainwaterResult;
  unit: string;
}

// ─── Export schema ────────────────────────────────────────────────────────────
export interface ExportSchema {
  version: '2.0';
  exportedAt: string;
  state: AppState;
}
