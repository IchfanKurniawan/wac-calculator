/**
 * Data completeness checks. Unlike import validation (which rejects a file),
 * these describe what is still missing while the user is filling the wizard.
 */

import type { AppState, FixtureTypeId } from '../types';
import { FIXTURE_BASELINES } from '../constants/baselines';
import { isLandscapeShareExact, landscapeSharePct } from '../constants/landscape';
import { MIN_RAINWATER_CAP_RATIO } from '../constants/scoring';
import { calcRainwater, totalQty } from './calculations';

export type IssueLevel = 'error' | 'warning';

export interface ValidationIssue {
  level: IssueLevel;
  step: number;
  message: string;
}

const pctId = (v: number) =>
  `${(v * 100).toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`;

export function collectIssues(state: AppState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { building, fixtures, landscape, coolingTower, rainwater } = state;

  if (!building.name.trim()) {
    issues.push({ level: 'error', step: 1, message: 'Nama bangunan belum diisi.' });
  }
  if ((building.occupant1 || 0) <= 0 && (building.nla || 0) <= 0) {
    issues.push({
      level: 'error',
      step: 1,
      message: 'Jumlah penghuni utama atau NLA belum diisi — normalisasi WAC 1 belum bisa dihitung.',
    });
  }

  const fixtureTypes = Object.keys(fixtures) as FixtureTypeId[];
  const installed = fixtureTypes.flatMap(t => fixtures[t].filter(p => p.qty > 0));

  if (installed.length === 0) {
    issues.push({ level: 'error', step: 2, message: 'Belum ada peralatan air dengan jumlah unit lebih dari 0.' });
  } else {
    const missingRate = fixtureTypes
      .filter(t => fixtures[t].some(p => p.qty > 0 && !(p.rate > 0)))
      .map(t => FIXTURE_BASELINES[t].labelId);
    if (missingRate.length > 0) {
      issues.push({
        level: 'warning',
        step: 2,
        message: `Laju desain belum diisi untuk: ${missingRate.join(', ')}. Engine memakai nilai baseline sementara, sehingga penghematannya tidak terlihat.`,
      });
    }
  }

  const urinalQty = totalQty(fixtures.URINAL);
  if (state.hasUrinal && urinalQty === 0) {
    issues.push({
      level: 'warning',
      step: 2,
      message: 'Urinal ditandai tersedia tetapi jumlah unitnya 0 — pemakaian flushing dihitung seolah urinal terpasang. Isi jumlah urinal atau matikan toggle.',
    });
  }
  if (!state.hasUrinal && urinalQty > 0) {
    issues.push({
      level: 'warning',
      step: 2,
      message: 'Jumlah unit urinal terisi tetapi toggle urinal nonaktif — kebutuhan urinal diabaikan.',
    });
  }

  if ((landscape.area || 0) > 0 && !isLandscapeShareExact(landscape.zones)) {
    issues.push({
      level: 'error',
      step: 3,
      message: `Total persentase area lansekap ${landscapeSharePct(landscape.zones).toLocaleString('id-ID')}% — harus tepat 100%.`,
    });
  }

  if (coolingTower.enabled && (coolingTower.load || 0) <= 0) {
    issues.push({ level: 'warning', step: 3, message: 'Cooling tower aktif tetapi beban pendingin masih 0 TR.' });
  }

  const rw = calcRainwater(state);
  if (!rainwater.hasTank) {
    issues.push({
      level: 'warning',
      step: 4,
      message: `Belum ada tangki air hujan — WAC P2 mensyaratkan rasio penampungan minimal ${pctId(MIN_RAINWATER_CAP_RATIO)}.`,
    });
  } else if (rw.capRatio + 1e-9 < MIN_RAINWATER_CAP_RATIO) {
    issues.push({
      level: 'warning',
      step: 4,
      message: `Rasio penampungan air hujan ${pctId(rw.capRatio)} masih di bawah minimum ${pctId(MIN_RAINWATER_CAP_RATIO)}.`,
    });
  }

  return issues;
}

/** True when nothing blocks a meaningful result. Warnings alone do not block. */
export function isComplete(issues: ValidationIssue[]): boolean {
  return !issues.some(i => i.level === 'error');
}
