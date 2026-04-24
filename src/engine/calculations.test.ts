import { describe, expect, it } from 'vitest';

import type { AppState } from '../types';
import { createDefaultState } from '../utils/defaults';
import { calcAll, computeSourceAvailable, computeUseRequired } from './calculations';

function cloneDefaultState(): AppState {
  return createDefaultState();
}

describe('water balance flush mapping', () => {
  it('uses wcDsg for the flush row and excludes urinal demand', () => {
    const state = cloneDefaultState();

    state.building.nla = 1000;
    state.building.occupant1 = 100;
    state.hasUrinal = true;

    state.fixtures.WC_FLUSH_VALVE = [{ name: 'Valve', qty: 1, rate: 4 }];
    state.fixtures.WC_FLUSH_TANK = [{ name: 'Tank', qty: 1, rate: 5 }];
    state.fixtures.URINAL = [{ name: 'Urinal', qty: 1, rate: 2 }];

    const daily = calcAll(state).daily;
    const flushSourceAvailable = computeSourceAvailable('flush', daily, 0, false, 0);
    const flushUseRequired = computeUseRequired('flush', daily);

    expect(daily.flushDsg).toBeGreaterThan(daily.wcDsg);
    expect(flushSourceAvailable).toBeCloseTo(daily.wcDsg, 6);
    expect(flushSourceAvailable).not.toBeCloseTo(daily.flushDsg, 6);
    expect(flushUseRequired).toBeCloseTo(daily.wcDsg, 6);
  });

  it('does not create baseline demand for fixture types with no installed quantity', () => {
    const state = cloneDefaultState();

    state.building.nla = 1000;
    state.building.occupant1 = 100;
    state.hasUrinal = true;

    state.fixtures.KERAN_TEMBOK = [{ name: 'Keran tembok', qty: 1, rate: 6 }];

    const daily = calcAll(state).daily;

    expect(daily.tembokDsg).toBeGreaterThan(0);
    expect(daily.wastafelDsg).toBe(0);
    expect(daily.wudhuDsg).toBe(0);
    expect(daily.showerDsg).toBe(0);
    expect(daily.wcDsg).toBe(0);
    expect(daily.urinalDsg).toBe(0);
    expect(computeSourceAvailable('tap', daily, 0, false, 0)).toBeCloseTo(daily.tembokDsg, 6);
    expect(computeUseRequired('wudhu', daily)).toBe(0);
    expect(computeUseRequired('shower', daily)).toBe(0);
  });
});
