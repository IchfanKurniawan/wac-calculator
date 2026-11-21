/**
 * What-if analysis: turns the scored result into concrete "change this to gain that".
 * Pure functions, no side effects.
 */

import type { AppState, FixtureGroup, FixtureTypeId } from '../types';
import { FIXTURE_BASELINES } from '../constants/baselines';
import { MIN_RAINWATER_CAP_RATIO, nextWac1Threshold, wac1PointsForRatio } from '../constants/scoring';
import { calcAll, calcRainwater, calcWAC2 } from './calculations';

export interface Wac2Opportunity {
  type: FixtureTypeId;
  label: string;
  unit: string;
  /** Units currently installed above the baseline rate. */
  unitsAbove: number;
  /** Weighted average rate of those units. */
  avgRate: number;
  baseline: number;
  /** WAC 2 points gained if those units were brought to the baseline. */
  ptsGain: number;
  /** WAC 2 percentage after that change. */
  pctAfter: number;
}

export interface Wac1Gap {
  currentRatio: number;
  currentPts: number;
  /** Next better ratio threshold, null when already at the top score. */
  targetRatio: number | null;
  targetPts: number | null;
  /** Litres per day that must leave the primary supply to reach the next score. */
  reductionLpd: number;
  reductionPct: number;
}

export interface WhatIfResult {
  wac2: Wac2Opportunity[];
  wac1: Wac1Gap;
  /** Tank volume required to satisfy WAC P2 (L). */
  tankTargetL: number;
  /** Additional tank volume still missing for WAC P2 (L). */
  tankMissingL: number;
}

function opportunitiesFor(state: AppState): Wac2Opportunity[] {
  const current = calcWAC2(state.fixtures);
  const list: Wac2Opportunity[] = [];

  (Object.keys(state.fixtures) as FixtureTypeId[]).forEach(type => {
    const { baseline, unit, labelId } = FIXTURE_BASELINES[type];
    const offenders = state.fixtures[type].filter(p => p.qty > 0 && p.rate > baseline);
    if (offenders.length === 0) return;

    const unitsAbove = offenders.reduce((sum, p) => sum + p.qty, 0);
    const avgRate = offenders.reduce((sum, p) => sum + p.qty * p.rate, 0) / unitsAbove;

    const simulated: FixtureGroup = {
      ...state.fixtures,
      [type]: state.fixtures[type].map(p => (p.qty > 0 && p.rate > baseline ? { ...p, rate: baseline } : p)),
    };
    const after = calcWAC2(simulated);

    list.push({
      type,
      label: labelId,
      unit,
      unitsAbove,
      avgRate,
      baseline,
      ptsGain: after.pts - current.pts,
      pctAfter: after.pct,
    });
  });

  // Biggest point gain first, then the largest amount of water involved.
  return list.sort((a, b) => b.ptsGain - a.ptsGain || b.unitsAbove - a.unitsAbove);
}

export function buildWhatIf(state: AppState): WhatIfResult {
  const results = calcAll(state);
  const { daily, wac1 } = results;

  const targetRatio = nextWac1Threshold(wac1.ratio);
  const targetPts = targetRatio === null ? null : wac1PointsForRatio(targetRatio);
  const reductionLpd = targetRatio === null
    ? 0
    : Math.max(0, daily.totalFromPrimary - targetRatio * daily.totalBL);

  const rw = calcRainwater(state);
  const tankTargetL = rw.idealVolume * MIN_RAINWATER_CAP_RATIO;
  const tankMissingL = Math.max(0, tankTargetL - state.rainwater.tankCapacity);

  return {
    wac2: opportunitiesFor(state),
    wac1: {
      currentRatio: wac1.ratio,
      currentPts: wac1.pts,
      targetRatio,
      targetPts,
      reductionLpd,
      reductionPct: daily.totalFromPrimary > 0 ? reductionLpd / daily.totalFromPrimary : 0,
    },
    tankTargetL,
    tankMissingL,
  };
}
