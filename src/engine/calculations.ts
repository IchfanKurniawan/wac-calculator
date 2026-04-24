/**
 * GREENSHIP NB 1.2 Water Calculator — Calculation Engine
 *
 * Pure functions only — no side effects, no DOM, fully unit-testable.
 * Source: Water Calculator v2.2 (Office / Kantor), NB 1.2
 *
 * WAC 2 scoring follows NB 1.3: ≥25%→1pt, ≥50%→2pt, ≥75%→3pt (max 3)
 */

import type {
  AppState,
  CalcResults,
  DailyConsumption,
  FixtureGroup,
  FixtureProduct,
  WAC1Result,
  WAC2Result,
  RainwaterResult,
  WaterBalanceData,
  WBSourceId,
  WBUseId,
} from '../types';
import { FIXTURE_BASELINES } from '../constants/baselines';
import { TYPOLOGY_CONFIG } from '../constants/typologies';
import { LANDSCAPE_BASELINE_RATE } from '../constants/landscape';

// ─── Utility ──────────────────────────────────────────────────────────────────

/** Weighted average flow rate by product quantity. Returns 0 if no products with qty. */
export function weightedAvgRate(products: FixtureProduct[]): number {
  const totalQty = products.reduce((s, p) => s + (p.qty || 0), 0);
  if (totalQty === 0) return 0;
  return products.reduce((s, p) => s + (p.qty || 0) * (p.rate || 0), 0) / totalQty;
}

/** Total quantity across products */
export function totalQty(products: FixtureProduct[]): number {
  return products.reduce((s, p) => s + (p.qty || 0), 0);
}

function installedRateOrZero(products: FixtureProduct[], baseline: number): number {
  return totalQty(products) > 0 ? weightedAvgRate(products) || baseline : 0;
}

// ─── WAC 2 — Fixture Efficiency Scoring (NB 1.3) ─────────────────────────────

/**
 * NB 1.3 criteria: ≥25%→1pt · ≥50%→2pt · ≥75%→3pt (max 3 points)
 * A fixture unit is "hemat" if its design rate ≤ baseline.
 */
export function calcWAC2(fixtures: FixtureGroup): WAC2Result {
  let hemat = 0;
  let total = 0;
  (Object.keys(fixtures) as (keyof FixtureGroup)[]).forEach(type => {
    const bl = FIXTURE_BASELINES[type]?.baseline ?? 0;
    fixtures[type].forEach(p => {
      if (p.qty > 0 && p.rate > 0) {
        total += p.qty;
        if (p.rate <= bl) hemat += p.qty;
      }
    });
  });
  const pct = total > 0 ? hemat / total : 0;
  const pts = pct >= 0.75 ? 3 : pct >= 0.5 ? 2 : pct >= 0.25 ? 1 : 0;
  return { total, hemat, pct, pts };
}

// ─── Flush (WC + Urinal) ─────────────────────────────────────────────────────

function calcFlush(state: AppState) {
  const tc = TYPOLOGY_CONFIG[state.building.typology];
  const occ = state.building.occupant1 || 0;
  const { fixtures, hasUrinal } = state;

  // Daily flush counts — formula from WAC v2.2 sheet L12/L19
  const wcFlushesPerDay = hasUrinal
    ? occ * (tc.malePct * tc.wcMale + tc.femalePct * tc.wcFemale)
    : occ * tc.wcNoUrinal;
  const urinalFlushesPerDay = hasUrinal ? occ * tc.malePct * tc.urinalUses : 0;

  // Valve / Tank split by product quantities
  const valveQty = totalQty(fixtures.WC_FLUSH_VALVE);
  const tankQty  = totalQty(fixtures.WC_FLUSH_TANK);
  const urinalQty = totalQty(fixtures.URINAL);
  const wcQty    = valveQty + tankQty;
  const vSh = wcQty > 0 ? valveQty / wcQty : 0;
  const tSh = wcQty > 0 ? 1 - vSh : 0;

  const vBl = FIXTURE_BASELINES.WC_FLUSH_VALVE.baseline;
  const tBl = FIXTURE_BASELINES.WC_FLUSH_TANK.baseline;
  const uBl = FIXTURE_BASELINES.URINAL.baseline;

  const vDsg = installedRateOrZero(fixtures.WC_FLUSH_VALVE, vBl);
  const tDsg = installedRateOrZero(fixtures.WC_FLUSH_TANK, tBl);
  const uDsg = hasUrinal && urinalQty > 0 ? weightedAvgRate(fixtures.URINAL) || uBl : 0;

  const wcBL  = wcFlushesPerDay * (vSh * vBl  + tSh * tBl);
  const wcDsg = wcFlushesPerDay * (vSh * vDsg + tSh * tDsg);
  const urinalBL  = hasUrinal && urinalQty > 0 ? urinalFlushesPerDay * uBl : 0;
  const urinalDsg = urinalFlushesPerDay * uDsg;

  return {
    wcBL, wcDsg,
    urinalBL, urinalDsg,
    flushBL:  wcBL  + urinalBL,
    flushDsg: wcDsg + urinalDsg,
  };
}

// ─── Tap & Shower ─────────────────────────────────────────────────────────────

function calcTap(state: AppState) {
  const tc  = TYPOLOGY_CONFIG[state.building.typology];
  const occ = state.building.occupant1 || 0;
  const { fixtures } = state;

  // Minutes of use per day — formula from WAC v2.2 L40/L47/L58/L64
  const tapMinutes   = occ * tc.hwDuration * tc.tapUsage;
  const wudhuMinutes = occ * (
    tc.femalePct * tc.mosalemFemale * tc.wudhuTimes * tc.wudhuDuration +
    tc.malePct   * tc.mosalemMale   * tc.wudhuTimes * tc.wudhuDuration
  );
  const showerMinutes = occ * tc.showerPct * tc.showerDuration;

  // Tembok / Wastafel split
  const tQ   = totalQty(fixtures.KERAN_TEMBOK);
  const wQ   = totalQty(fixtures.KERAN_WASTAFEL);
  const kdQ  = totalQty(fixtures.KERAN_WUDHU);
  const shQ  = totalQty(fixtures.SHOWER);
  const tapQ = tQ + wQ;
  const tSh  = tapQ > 0 ? tQ / tapQ : 0;
  const wSh  = tapQ > 0 ? 1 - tSh : 0;

  const tBl  = FIXTURE_BASELINES.KERAN_TEMBOK.baseline;
  const wBl  = FIXTURE_BASELINES.KERAN_WASTAFEL.baseline;
  const kdBl = FIXTURE_BASELINES.KERAN_WUDHU.baseline;
  const shBl = FIXTURE_BASELINES.SHOWER.baseline;

  const tDsg  = installedRateOrZero(fixtures.KERAN_TEMBOK, tBl);
  const wDsg  = installedRateOrZero(fixtures.KERAN_WASTAFEL, wBl);
  const kdDsg = installedRateOrZero(fixtures.KERAN_WUDHU, kdBl);
  const shDsg = installedRateOrZero(fixtures.SHOWER, shBl);

  const tembokBL    = tapMinutes * tSh * tBl;
  const tembokDsg   = tapMinutes * tSh * tDsg;
  const wastafelBL  = tapMinutes * wSh * wBl;
  const wastafelDsg = tapMinutes * wSh * wDsg;
  const wudhuBL     = kdQ > 0 ? wudhuMinutes * kdBl : 0;
  const wudhuDsg    = wudhuMinutes * kdDsg;
  const showerBL    = shQ > 0 ? showerMinutes * shBl : 0;
  const showerDsg   = showerMinutes * shDsg;

  return {
    tembokBL, tembokDsg,
    wastafelBL, wastafelDsg,
    wudhuBL, wudhuDsg,
    showerBL, showerDsg,
    tapBL:  tembokBL  + wastafelBL  + wudhuBL  + showerBL,
    tapDsg: tembokDsg + wastafelDsg + wudhuDsg + showerDsg,
  };
}

// ─── Landscaping ──────────────────────────────────────────────────────────────

function calcLandscape(state: AppState) {
  const tc = TYPOLOGY_CONFIG[state.building.typology];
  const { landscape: ls } = state;
  if (!ls.area || ls.zones.length === 0) return { lsBL: 0, lsDsg: 0 };

  const freq = tc.irrigationFreq;
  const lsBL  = ls.zones.reduce((s, z) => s + LANDSCAPE_BASELINE_RATE * (z.areaShare || 0) * ls.area * freq, 0);
  const lsDsg = ls.zones.reduce((s, z) => s + (z.dsgRate  || 0) * (z.areaShare || 0) * ls.area * freq, 0);
  return { lsBL, lsDsg };
}

// ─── Cooling Tower ────────────────────────────────────────────────────────────

function calcCT(state: AppState) {
  const ct = state.coolingTower;
  if (!ct.enabled || !ct.load) return { ctBL: 0, ctDsg: 0 };
  // Formula: (TR × 3) × 0.01 × 3.78541 × 60 × opHours
  const val = ct.load * 3 * 0.01 * 3.78541 * 60 * state.building.opHours;
  return { ctBL: val, ctDsg: val };
}

// ─── Rainwater Harvesting ─────────────────────────────────────────────────────

export function calcRainwater(state: AppState): RainwaterResult {
  const rw = state.rainwater;
  if (!rw.hasTank || !rw.tankCapacity) {
    return { idealVolume: 0, capRatio: 0, availWet: 0 };
  }
  const idealVolume = rw.roofArea * rw.avgRainfall * rw.runoffCoef;
  const capRatio    = idealVolume > 0 ? Math.min(1, rw.tankCapacity / idealVolume) : 0;
  const availWet    = Math.min(rw.tankCapacity, idealVolume);
  return { idealVolume, capRatio, availWet };
}

// ─── Neraca Air Reduction ─────────────────────────────────────────────────────

/**
 * Compute total reduction from non-primary sources.
 * Weighted by rainyDayPct across wet and dry scenarios.
 */
function calcNeracaReduction(wb: WaterBalanceData, rainyDayPct: number): number {
  const sumUses = (scenario: WaterBalanceData['wet']) =>
    scenario.uses.reduce((s, u) => s + (u.dariAlt || 0) + (u.dariRecycle || 0), 0);

  const wetRed = sumUses(wb.wet);
  const dryRed = sumUses(wb.dry);
  return rainyDayPct * wetRed + (1 - rainyDayPct) * dryRed;
}

// ─── WAC 1 Scoring ────────────────────────────────────────────────────────────

export function calcWAC1(
  baselineTotal: number,
  designFromPrimary: number,
  occupant1: number,
  nla: number,
  opHours: number,
  typologyId: string,
): WAC1Result {
  const tc = TYPOLOGY_CONFIG[typologyId as keyof typeof TYPOLOGY_CONFIG];
  if (!tc) return { baselineNorm: 0, designNorm: 0, ratio: 1, savingsPct: 0, p2Pass: false, pts: 0 };

  const baselineNorm = tc.normFn(baselineTotal, occupant1, nla, opHours);
  const designNorm   = tc.normFn(designFromPrimary, occupant1, nla, opHours);
  const ratio        = baselineNorm > 0 ? designNorm / baselineNorm : 1;
  const savingsPct   = 1 - ratio;
  // WAC P2: passes as long as user has filled data (baseline computed)
  // Scoring from ratio is for WAC 1 points only
  const p2Pass       = baselineNorm > 0;

  const pts = !p2Pass ? 0
    : ratio <= 0.45 ? 8
    : ratio <= 0.50 ? 7
    : ratio <= 0.55 ? 6
    : ratio <= 0.60 ? 5
    : ratio <= 0.65 ? 4
    : ratio <= 0.70 ? 3
    : ratio <= 0.75 ? 2
    : ratio <= 0.80 ? 1
    : 0;

  return { baselineNorm, designNorm, ratio, savingsPct, p2Pass, pts };
}

// ─── Master Calculator ────────────────────────────────────────────────────────

export function calcAll(state: AppState): CalcResults {
  const tc = TYPOLOGY_CONFIG[state.building.typology];
  const { building } = state;

  const flush = calcFlush(state);
  const tap   = calcTap(state);
  const ls    = calcLandscape(state);
  const ct    = calcCT(state);
  const rw    = calcRainwater(state);

  const totalBL  = flush.flushBL  + tap.tapBL  + ls.lsBL  + ct.ctBL;
  const totalDsg = flush.flushDsg + tap.tapDsg + ls.lsDsg + ct.ctDsg;

  const rainyDayPct  = state.rainwater.rainyDayPct;
  const totalReduction = calcNeracaReduction(state.waterBalance, rainyDayPct);
  const totalFromPrimary = Math.max(0, totalDsg - totalReduction);

  const daily: DailyConsumption = {
    ...flush,
    ...tap,
    ...ls,
    ctBL: ct.ctBL, ctDsg: ct.ctDsg,
    totalBL, totalDsg,
    totalReduction, totalFromPrimary,
  };

  const wac2 = calcWAC2(state.fixtures);
  const wac1 = calcWAC1(totalBL, totalFromPrimary, building.occupant1, building.nla, building.opHours, building.typology);

  return { daily, wac2, wac1, rainwater: rw, unit: tc.resultUnit };
}

// ─── Neraca Air helpers for the UI ───────────────────────────────────────────

/** Auto-computed "volume tersedia" for each source row, given daily design values */
export function computeSourceAvailable(
  sourceId: WBSourceId,
  daily: DailyConsumption,
  rwAvailWet: number,
  isDryDay: boolean,
  manualValue: number,
): number {
  switch (sourceId) {
    case 'flush':        return daily.wcDsg;    // WC only (valve+tank), NOT including urinal
    case 'urinal':       return daily.urinalDsg;
    case 'tap':          return daily.tembokDsg + daily.wastafelDsg;
    case 'wudhu':        return daily.wudhuDsg;
    case 'shower':       return daily.showerDsg;
    case 'ct_condensate':return manualValue;
    case 'rainwater':    return isDryDay ? 0 : rwAvailWet;
    case 'others':       return manualValue;
    default:             return 0;
  }
}

/** Auto-computed "kebutuhan" for each use row */
export function computeUseRequired(
  useId: WBUseId,
  daily: DailyConsumption,
): number {
  switch (useId) {
    case 'flush':      return daily.wcDsg;   // WC only (valve+tank), NOT including urinal
    case 'urinal':     return daily.urinalDsg;
    case 'tap':        return daily.tembokDsg + daily.wastafelDsg;
    case 'wudhu':      return daily.wudhuDsg;
    case 'shower':     return daily.showerDsg;
    case 'ct_makeup':  return daily.ctDsg;
    case 'irrigation': return daily.lsDsg;
    default:           return 0;
  }
}

export function lsShareSum(zones: { areaShare: number }[]): number {
  return zones.reduce((s, z) => s + (z.areaShare || 0), 0);
}
