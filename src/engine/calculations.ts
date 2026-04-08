/**
 * GREENSHIP NB 1.2 Water Calculator — Calculation Engine
 *
 * All functions are PURE — no side effects, no DOM access, no imports of UI.
 * Fully testable in isolation.
 *
 * Source formulas: Water Calculator v2.2 (Office) & v2.0 (Factory)
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
} from '../types';
import { FIXTURE_BASELINES, FLUSH_FIXTURES } from '../constants/baselines';
import { TYPOLOGY_CONFIG } from '../constants/typologies';

// ─── Utility ──────────────────────────────────────────────────────────────────

/** Weighted average flow rate of products by quantity. Returns 0 if no products. */
export function weightedAvgRate(products: FixtureProduct[]): number {
  const totalQty = products.reduce((s, p) => s + (p.qty || 0), 0);
  if (totalQty === 0) return 0;
  return products.reduce((s, p) => s + (p.qty || 0) * (p.rate || 0), 0) / totalQty;
}

/** Sum of quantities across products */
export function totalQty(products: FixtureProduct[]): number {
  return products.reduce((s, p) => s + (p.qty || 0), 0);
}

// ─── WAC 2 Scoring ────────────────────────────────────────────────────────────

/**
 * Compute WAC 2 score from all fixture products.
 * A fixture is "hemat" if its design rate ≤ baseline.
 */
export function calcWAC2(fixtures: FixtureGroup): WAC2Result {
  let hemat = 0;
  let total = 0;

  (Object.keys(fixtures) as (keyof FixtureGroup)[]).forEach((type) => {
    const bl = FIXTURE_BASELINES[type]?.baseline ?? 0;
    fixtures[type].forEach((p) => {
      if (p.qty > 0 && p.rate > 0) {
        total += p.qty;
        if (p.rate <= bl) hemat += p.qty;
      }
    });
  });

  const pct = total > 0 ? hemat / total : 0;
  // NB 1.3 scoring: max 3 points
  const pts = pct >= 0.75 ? 3 : pct >= 0.5 ? 2 : pct >= 0.25 ? 1 : 0;
  return { total, hemat, pct, pts };
}

// ─── Flush Calculations ───────────────────────────────────────────────────────

/**
 * Compute WC + Urinal daily water consumption (L/day) for Office typology.
 */
function calcFlushOffice(state: AppState) {
  const tc = TYPOLOGY_CONFIG[state.building.typology];
  const occ = state.building.occupant1 || 0;
  const { fixtures, hasUrinal } = state;

  // Flushes per day
  const wcFlushesPerDay = hasUrinal
    ? occ * (tc.malePct * tc.wcMale + tc.femalePct * tc.wcFemale)
    : occ * tc.wcNoUrinal;

  const urinalFlushesPerDay = hasUrinal ? occ * tc.malePct * tc.urinalUses : 0;

  // Valve / Tank share from product quantities
  const valveQty = totalQty(fixtures.WC_FLUSH_VALVE);
  const tankQty = totalQty(fixtures.WC_FLUSH_TANK);
  const wcQty = valveQty + tankQty;
  const vSh = wcQty > 0 ? valveQty / wcQty : 0.5;
  const tSh = 1 - vSh;

  // Baseline rates
  const vBl = FIXTURE_BASELINES.WC_FLUSH_VALVE.baseline;
  const tBl = FIXTURE_BASELINES.WC_FLUSH_TANK.baseline;
  const uBl = FIXTURE_BASELINES.URINAL.baseline;

  // Design rates (weighted avg; fallback to baseline if no products entered)
  const vDsg = weightedAvgRate(fixtures.WC_FLUSH_VALVE) || vBl;
  const tDsg = weightedAvgRate(fixtures.WC_FLUSH_TANK) || tBl;
  const uDsg = weightedAvgRate(fixtures.URINAL) || uBl;

  const wcBL = wcFlushesPerDay * (vSh * vBl + tSh * tBl);
  const wcDsg = wcFlushesPerDay * (vSh * vDsg + tSh * tDsg);
  const urinalBL = urinalFlushesPerDay * uBl;
  const urinalDsg = urinalFlushesPerDay * uDsg;

  const flushBL = wcBL + urinalBL;
  const flushDsg = wcDsg + urinalDsg;
  const flushPrimary = flushDsg * (1 - state.wcRecyclePct);

  return { wcBL, wcDsg, urinalBL, urinalDsg, flushBL, flushDsg, flushPrimary };
}

/**
 * Compute WC + Urinal for Factory (multi-shift).
 * Each shift calculated independently using shift-specific occupant counts.
 */
function calcFlushFactory(state: AppState) {
  const tc = TYPOLOGY_CONFIG.PABRIK;
  const { fixtures, hasUrinal, factory } = state;
  const shifts = [factory.shift1 || 0, factory.shift2 || 0, factory.shift3 || 0];
  const malePct = factory.malePct ?? tc.malePct;
  const femalePct = 1 - malePct;

  let totalWcFlushes = 0;
  let totalUrinalFlushes = 0;

  shifts.forEach((shiftOcc) => {
    const wcF = hasUrinal
      ? shiftOcc * (malePct * tc.wcMale + femalePct * tc.wcFemale)
      : shiftOcc * tc.wcNoUrinal;
    const urF = hasUrinal ? shiftOcc * malePct * tc.urinalUses : 0;
    totalWcFlushes += wcF;
    totalUrinalFlushes += urF;
  });

  const valveQty = totalQty(fixtures.WC_FLUSH_VALVE);
  const tankQty = totalQty(fixtures.WC_FLUSH_TANK);
  const wcQty = valveQty + tankQty;
  const vSh = wcQty > 0 ? valveQty / wcQty : 0.5;
  const tSh = 1 - vSh;

  const vBl = FIXTURE_BASELINES.WC_FLUSH_VALVE.baseline;
  const tBl = FIXTURE_BASELINES.WC_FLUSH_TANK.baseline;
  const uBl = FIXTURE_BASELINES.URINAL.baseline;

  const vDsg = weightedAvgRate(fixtures.WC_FLUSH_VALVE) || vBl;
  const tDsg = weightedAvgRate(fixtures.WC_FLUSH_TANK) || tBl;
  const uDsg = weightedAvgRate(fixtures.URINAL) || uBl;

  const wcBL = totalWcFlushes * (vSh * vBl + tSh * tBl);
  const wcDsg = totalWcFlushes * (vSh * vDsg + tSh * tDsg);
  const urinalBL = totalUrinalFlushes * uBl;
  const urinalDsg = totalUrinalFlushes * uDsg;

  const flushBL = wcBL + urinalBL;
  const flushDsg = wcDsg + urinalDsg;
  const flushPrimary = flushDsg * (1 - state.wcRecyclePct);

  return { wcBL, wcDsg, urinalBL, urinalDsg, flushBL, flushDsg, flushPrimary };
}

// ─── Tap / Shower Calculations ────────────────────────────────────────────────

/**
 * Compute tap + shower daily water consumption (L/day).
 * Works for all typologies; uses occupant1 for Office, total factory occupants for Factory.
 */
function calcTap(state: AppState) {
  const tc = TYPOLOGY_CONFIG[state.building.typology];
  const { fixtures } = state;

  let occ: number;
  let malePct = tc.malePct;
  let femalePct = tc.femalePct;

  if (tc.isFactory) {
    const f = state.factory;
    occ = (f.shift1 || 0) + (f.shift2 || 0) + (f.shift3 || 0);
    malePct = f.malePct ?? tc.malePct;
    femalePct = 1 - malePct;
  } else {
    occ = state.building.occupant1 || 0;
  }

  // Minutes of tap use per day
  const tapMinutes = occ * tc.hwDuration * tc.tapUsage;

  // Wudhu minutes per day
  const wudhuMinutes =
    occ *
    (femalePct * tc.mosalemFemale * tc.wudhuTimes * tc.wudhuDuration +
      malePct * tc.mosalemMale * tc.wudhuTimes * tc.wudhuDuration);

  // Shower minutes per day
  const showerMinutes = occ * tc.showerPct * tc.showerDuration;

  // Keran Tembok / Wastafel share
  const tembokQty = totalQty(fixtures.KERAN_TEMBOK);
  const wastafelQty = totalQty(fixtures.KERAN_WASTAFEL);
  const tapQty = tembokQty + wastafelQty;
  const tSh = tapQty > 0 ? tembokQty / tapQty : 0.5;
  const wSh = 1 - tSh;

  const tBl = FIXTURE_BASELINES.KERAN_TEMBOK.baseline;
  const wBl = FIXTURE_BASELINES.KERAN_WASTAFEL.baseline;
  const kdBl = FIXTURE_BASELINES.KERAN_WUDHU.baseline;
  const shBl = FIXTURE_BASELINES.SHOWER.baseline;

  const tDsg = weightedAvgRate(fixtures.KERAN_TEMBOK) || tBl;
  const wDsg = weightedAvgRate(fixtures.KERAN_WASTAFEL) || wBl;
  const kdDsg = weightedAvgRate(fixtures.KERAN_WUDHU) || kdBl;
  const shDsg = weightedAvgRate(fixtures.SHOWER) || shBl;

  const tembokBL = tapMinutes * tSh * tBl;
  const tembokDsg = tapMinutes * tSh * tDsg;
  const wastafelBL = tapMinutes * wSh * wBl;
  const wastafelDsg = tapMinutes * wSh * wDsg;
  const wudhuBL = wudhuMinutes * kdBl;
  const wudhuDsg = wudhuMinutes * kdDsg;
  const showerBL = showerMinutes * shBl;
  const showerDsg = showerMinutes * shDsg;

  const tapBL = tembokBL + wastafelBL + wudhuBL + showerBL;
  const tapDsg = tembokDsg + wastafelDsg + wudhuDsg + showerDsg;
  const tapPrimary = tapDsg * (1 - state.showerRecyclePct);

  return {
    tembokBL, tembokDsg,
    wastafelBL, wastafelDsg,
    wudhuBL, wudhuDsg,
    showerBL, showerDsg,
    tapBL, tapDsg, tapPrimary,
  };
}

// ─── Landscaping ──────────────────────────────────────────────────────────────

function calcLandscape(state: AppState) {
  const { landscape } = state;
  const tc = TYPOLOGY_CONFIG[state.building.typology];
  const freq = tc.irrigationFreq; // times per day

  if (!landscape.area || landscape.zones.length === 0) {
    return { lsBL: 0, lsDsg: 0, lsPrimary: 0 };
  }

  const lsBL = landscape.zones.reduce(
    (s, z) => s + (z.basRate || 5) * (z.areaShare || 0) * landscape.area * freq,
    0
  );
  const lsDsg = landscape.zones.reduce(
    (s, z) => s + (z.dsgRate || 0) * (z.areaShare || 0) * landscape.area * freq,
    0
  );
  const lsPrimary = lsDsg * (1 - landscape.pctFromNonPrimary);

  return { lsBL, lsDsg, lsPrimary };
}

// ─── Cooling Tower ────────────────────────────────────────────────────────────

function calcCoolingTower(state: AppState) {
  const { coolingTower: ct, building } = state;
  if (!ct.enabled || !ct.load) return { ctBL: 0, ctDsg: 0, ctPrimary: 0 };

  // Formula: (load_TR × 3) × 0.01 × 3.78541 × 60 × opHours
  const ctTotal = ct.load * 3 * 0.01 * 3.78541 * 60 * building.opHours;
  const ctPrimary = ctTotal * (1 - ct.pctFromNonPrimary);

  return { ctBL: ctTotal, ctDsg: ctTotal, ctPrimary };
}

// ─── Factory Equipment Water ──────────────────────────────────────────────────

function calcEquipment(state: AppState) {
  if (!TYPOLOGY_CONFIG[state.building.typology].isFactory) {
    return { equipBL: 0, equipDsg: 0 };
  }
  const total = state.factory.equipment.reduce(
    (s, e) => s + (e.qty || 0) * (e.outputPerUnit || 0),
    0
  );
  return { equipBL: total, equipDsg: total };
}

// ─── Rainwater Harvesting ─────────────────────────────────────────────────────

function calcRainwater(
  state: AppState,
  flushDsg: number,
  lsDsg: number,
  ctDsg: number
): { result: RainwaterResult; rwFlushRed: number; rwIrrigRed: number; rwCTRed: number } {
  const rw = state.rainwater;

  if (!rw.hasTank || !rw.tankCapacity) {
    return {
      result: { idealVolume: 0, capRatio: 0, availWet: 0 },
      rwFlushRed: 0, rwIrrigRed: 0, rwCTRed: 0,
    };
  }

  const idealVolume = rw.roofArea * rw.avgRainfall * rw.runoffCoef;
  const capRatio = idealVolume > 0 ? Math.min(1, rw.tankCapacity / idealVolume) : 0;
  const availWet = Math.min(rw.tankCapacity, idealVolume);

  let remaining = availWet;
  const rwFlushRed = rw.useForFlush ? Math.min(remaining, flushDsg) : 0;
  remaining -= rwFlushRed;
  const rwIrrigRed = rw.useForIrrigation ? Math.min(remaining, lsDsg) : 0;
  remaining -= rwIrrigRed;
  const rwCTRed = rw.useForCT ? Math.min(remaining, ctDsg) : 0;

  return {
    result: { idealVolume, capRatio, availWet },
    rwFlushRed, rwIrrigRed, rwCTRed,
  };
}

// ─── Water Recycle ────────────────────────────────────────────────────────────

function calcRecycle(
  state: AppState,
  tapDsg: number,
  wudhuDsg: number,
  showerDsg: number,
  flushDsg: number,
  lsDsg: number,
  ctDsg: number
) {
  const rc = state.waterRecycle;
  if (!rc.hasSystem) {
    return { recycleFlushRed: 0, recycleIrrigRed: 0, recycleCTRed: 0 };
  }

  const sourceTotal =
    (rc.sourcesTap ? tapDsg : 0) +
    (rc.sourcesWudhu ? wudhuDsg : 0) +
    (rc.sourcesShower ? showerDsg : 0) +
    (rc.sourcesAHU || 0) +
    (rc.sourcesOthers || 0);

  const available = Math.min(rc.capacity || Infinity, sourceTotal);

  // Allocate pro-rata to selected uses
  const needFlush = rc.useForFlush ? flushDsg : 0;
  const needIrrig = rc.useForIrrigation ? lsDsg : 0;
  const needCT = rc.useForCT ? ctDsg : 0;
  const totalNeed = needFlush + needIrrig + needCT;

  if (totalNeed === 0) return { recycleFlushRed: 0, recycleIrrigRed: 0, recycleCTRed: 0 };

  const ratio = Math.min(1, available / totalNeed);
  return {
    recycleFlushRed: needFlush * ratio,
    recycleIrrigRed: needIrrig * ratio,
    recycleCTRed: needCT * ratio,
  };
}

// ─── WAC 1 Scoring ────────────────────────────────────────────────────────────

/**
 * Compute WAC 1 score and WAC P2 pass/fail.
 * Baseline is dynamic (calculated from standard flow rates), NOT a fixed constant.
 */
export function calcWAC1(
  baselineTotal: number,
  designFromPrimary: number,
  occupant1: number,
  nla: number,
  opHours: number,
  typologyId: string
): WAC1Result {
  const tc = TYPOLOGY_CONFIG[typologyId as keyof typeof TYPOLOGY_CONFIG];
  if (!tc) return { baselineNorm: 0, designNorm: 0, ratio: 1, savingsPct: 0, p2Pass: false, pts: 0 };

  const baselineNorm = tc.normFn(baselineTotal, occupant1, nla, opHours);
  const designNorm = tc.normFn(designFromPrimary, occupant1, nla, opHours);

  const ratio = baselineNorm > 0 ? designNorm / baselineNorm : 1;
  const savingsPct = 1 - ratio;
  const p2Pass = ratio <= 0.80;

  let pts = 0;
  if (p2Pass) {
    pts =
      ratio <= 0.45 ? 8 :
      ratio <= 0.50 ? 7 :
      ratio <= 0.55 ? 6 :
      ratio <= 0.60 ? 5 :
      ratio <= 0.65 ? 4 :
      ratio <= 0.70 ? 3 :
      ratio <= 0.75 ? 2 : 1;
  }

  return { baselineNorm, designNorm, ratio, savingsPct, p2Pass, pts };
}

// ─── Master Calculator ────────────────────────────────────────────────────────

/**
 * Run all calculations and return full CalcResults.
 * This is the single entry point for the UI.
 */
export function calcAll(state: AppState): CalcResults {
  const tc = TYPOLOGY_CONFIG[state.building.typology];
  const { building } = state;

  // Flush
  const flush = tc.isFactory ? calcFlushFactory(state) : calcFlushOffice(state);

  // Tap
  const tap = calcTap(state);

  // Landscape
  const ls = calcLandscape(state);

  // Cooling Tower
  const ct = calcCoolingTower(state);

  // Equipment (factory only)
  const equip = calcEquipment(state);

  // Rainwater reductions
  const { result: rwResult, rwFlushRed, rwIrrigRed, rwCTRed } = calcRainwater(
    state,
    flush.flushDsg,
    ls.lsDsg,
    ct.ctDsg
  );

  // Recycle reductions
  const { recycleFlushRed, recycleIrrigRed, recycleCTRed } = calcRecycle(
    state,
    tap.tembokDsg + tap.wastafelDsg,
    tap.wudhuDsg,
    tap.showerDsg,
    flush.flushDsg,
    ls.lsDsg,
    ct.ctDsg
  );

  // Total primary consumption (after reductions)
  const flushPrimary = Math.max(0, flush.flushPrimary - rwFlushRed - recycleFlushRed);
  const lsPrimary = Math.max(0, ls.lsPrimary - rwIrrigRed - recycleIrrigRed);
  const ctPrimary = Math.max(0, ct.ctPrimary - rwCTRed - recycleCTRed);

  const totalBL = flush.flushBL + tap.tapBL + ls.lsBL + ct.ctBL + equip.equipBL;
  const totalDsg = flush.flushDsg + tap.tapDsg + ls.lsDsg + ct.ctDsg + equip.equipDsg;
  const totalFromPrimary = flushPrimary + tap.tapPrimary + lsPrimary + ctPrimary + equip.equipDsg;

  const daily: DailyConsumption = {
    ...flush,
    ...tap,
    ...ls,
    ctBL: ct.ctBL, ctDsg: ct.ctDsg, ctPrimary,
    ...equip,
    rwFlushRed, rwIrrigRed, rwCTRed,
    recycleFlushRed, recycleIrrigRed, recycleCTRed,
    totalBL, totalDsg, totalFromPrimary,
  };

  // WAC scoring
  const wac2 = calcWAC2(state.fixtures);
  const wac1 = calcWAC1(
    totalBL,
    totalFromPrimary,
    building.occupant1,
    building.nla,
    building.opHours,
    building.typology
  );

  return {
    daily,
    wac2,
    wac1,
    rainwater: rwResult,
    unit: tc.resultUnit,
  };
}

// ─── Flush key subtotals (for step summaries) ─────────────────────────────────
export function getFlushBreakdown(state: AppState) {
  return TYPOLOGY_CONFIG[state.building.typology].isFactory
    ? calcFlushFactory(state)
    : calcFlushOffice(state);
}

// ─── Landscape share validation ───────────────────────────────────────────────
export function lsShareSum(zones: { areaShare: number }[]): number {
  return zones.reduce((s, z) => s + (z.areaShare || 0), 0);
}

// ─── Re-export fixture types used by UI ───────────────────────────────────────
export { FLUSH_FIXTURES };
