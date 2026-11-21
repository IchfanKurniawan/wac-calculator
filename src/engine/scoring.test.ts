import { describe, expect, it } from 'vitest';

import type { AppState, FixtureProduct } from '../types';
import { createDefaultState } from '../utils/defaults';
import { mergeStoredState } from '../utils/projects';
import { calcAll, calcRainwater, calcWAC1, calcWAC2 } from './calculations';
import { buildWhatIf } from './whatIf';
import { collectIssues } from './validation';

const product = (qty: number, rate: number): FixtureProduct => ({ name: 'p', qty, rate });

function stateWith(patch: (s: AppState) => void): AppState {
  const state = createDefaultState();
  patch(state);
  return state;
}

describe('WAC 2 thresholds (NB 1.3)', () => {
  const pointsFor = (hematUnits: number) => {
    const state = createDefaultState();
    state.fixtures.WC_FLUSH_VALVE = [product(hematUnits, 4), product(100 - hematUnits, 9)];
    return calcWAC2(state.fixtures).pts;
  };

  it('awards 0/1/2/3 points at the 25/50/75% boundaries', () => {
    expect(pointsFor(24)).toBe(0);
    expect(pointsFor(25)).toBe(1);
    expect(pointsFor(49)).toBe(1);
    expect(pointsFor(50)).toBe(2);
    expect(pointsFor(74)).toBe(2);
    expect(pointsFor(75)).toBe(3);
  });
});

describe('WAC 1 ladder', () => {
  const run = (design: number) => calcWAC1(10000, design, 100, 1000, 8, 'KANTOR');

  it('maps the design/baseline ratio to points at each step', () => {
    expect(run(4500).pts).toBe(8);
    expect(run(4501).pts).toBe(7);
    expect(run(5000).pts).toBe(7);
    expect(run(8000).pts).toBe(1);
    expect(run(8001).pts).toBe(0);
  });

  it('separates the P2 prerequisite from the data-completeness flag', () => {
    expect(run(4500).p2DataComplete).toBe(true);
    expect(run(4500).p2Pass).toBe(false);

    expect(calcWAC1(10000, 4500, 100, 1000, 8, 'KANTOR', 0.05, true).p2Pass).toBe(false);
    expect(calcWAC1(10000, 4500, 100, 1000, 8, 'KANTOR', 0.1, true).p2Pass).toBe(true);
    expect(calcWAC1(10000, 4500, 100, 1000, 8, 'KANTOR', 0.5, false).p2Pass).toBe(false);

    const noData = calcWAC1(0, 0, 100, 1000, 8, 'KANTOR', 0.5, true);
    expect(noData.p2DataComplete).toBe(false);
    expect(noData.p2Pass).toBe(false);
    expect(noData.pts).toBe(0);
  });
});

describe('cooling tower cycles of concentration', () => {
  it('has no saving at the baseline COC and a saving above it', () => {
    const state = stateWith(s => {
      s.building.opHours = 8;
      s.coolingTower = { enabled: true, load: 100, coc: 3 };
    });

    const baseline = calcAll(state).daily;
    expect(baseline.ctDsg).toBeCloseTo(baseline.ctBL, 6);

    state.coolingTower.coc = 6;
    const improved = calcAll(state).daily;
    expect(improved.ctDsg).toBeGreaterThan(0);
    expect(improved.ctDsg).toBeLessThan(improved.ctBL);
    // (1 + 1/5) / (1 + 1/2) = 0.8 of the baseline make-up at 6 cycles.
    expect(improved.ctDsg).toBeCloseTo(improved.ctBL * 0.8, 6);

    state.coolingTower.coc = 2;
    expect(calcAll(state).daily.ctDsg).toBeGreaterThan(baseline.ctBL);
  });
});

describe('urinal consistency', () => {
  it('ignores the toggle when no urinal units are installed', () => {
    const withToggle = stateWith(s => {
      s.building.occupant1 = 100;
      s.hasUrinal = true;
      s.fixtures.WC_FLUSH_VALVE = [product(10, 6)];
    });
    const withoutUrinals = stateWith(s => {
      s.building.occupant1 = 100;
      s.hasUrinal = false;
      s.fixtures.WC_FLUSH_VALVE = [product(10, 6)];
    });

    expect(calcAll(withToggle).daily.wcDsg).toBeCloseTo(calcAll(withoutUrinals).daily.wcDsg, 6);
  });

  it('applies the urinal split once units exist', () => {
    const noUrinal = stateWith(s => {
      s.building.occupant1 = 100;
      s.hasUrinal = true;
      s.fixtures.WC_FLUSH_VALVE = [product(10, 6)];
    });
    const withUrinal = stateWith(s => {
      s.building.occupant1 = 100;
      s.hasUrinal = true;
      s.fixtures.WC_FLUSH_VALVE = [product(10, 6)];
      s.fixtures.URINAL = [product(5, 2)];
    });

    expect(calcAll(withUrinal).daily.wcDsg).toBeLessThan(calcAll(noUrinal).daily.wcDsg);
    expect(calcAll(withUrinal).daily.urinalDsg).toBeGreaterThan(0);
  });
});

describe('rainwater and what-if analysis', () => {
  const rainwaterState = () => stateWith(s => {
    s.rainwater = {
      hasTank: true,
      rainyDayPct: 0.55,
      tankCapacity: 1000,
      avgRainfall: 50,
      runoffCoef: 0.78,
      roofArea: 1500,
    };
  });

  it('computes the ideal volume and capacity ratio', () => {
    const rw = calcRainwater(rainwaterState());
    expect(rw.idealVolume).toBeCloseTo(58500, 6);
    expect(rw.capRatio).toBeCloseTo(1000 / 58500, 8);
  });

  it('reports the next reachable WAC 1 threshold and the tank still missing', () => {
    const state = rainwaterState();
    state.building.name = 'Gedung';
    state.building.occupant1 = 100;
    state.fixtures.WC_FLUSH_VALVE = [product(100, 6), product(100, 9)];

    const whatIf = buildWhatIf(state);

    expect(whatIf.wac2[0]?.type).toBe('WC_FLUSH_VALVE');
    expect(whatIf.wac2[0]?.ptsGain).toBe(1);
    expect(whatIf.wac1.targetRatio).toBe(0.8);
    expect(whatIf.wac1.reductionLpd).toBeGreaterThan(0);
    expect(whatIf.tankTargetL).toBeCloseTo(5850, 6);
    expect(whatIf.tankMissingL).toBeCloseTo(4850, 6);
  });
});

describe('completeness issues', () => {
  it('flags missing building data and missing fixtures', () => {
    const issues = collectIssues(createDefaultState());
    expect(issues.some(i => i.level === 'error' && i.step === 1)).toBe(true);
    expect(issues.some(i => i.level === 'error' && i.step === 2)).toBe(true);
  });

  it('has no blocking error for a minimally filled project', () => {
    const state = stateWith(s => {
      s.building.name = 'Gedung';
      s.building.occupant1 = 100;
      s.fixtures.WC_FLUSH_VALVE = [product(10, 4)];
    });
    expect(collectIssues(state).filter(i => i.level === 'error')).toHaveLength(0);
  });
});

describe('stored-state migration', () => {
  it('adds the cooling tower COC default to old drafts', () => {
    const merged = mergeStoredState({
      building: { name: 'Lama', occupant1: 50, nla: 500 },
      coolingTower: { enabled: true, load: 10 },
    });
    expect(merged.coolingTower.coc).toBe(3);
    expect(merged.building.name).toBe('Lama');
    expect(merged.building.occupant1).toBe(50);
  });
});
