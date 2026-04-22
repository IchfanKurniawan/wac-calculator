import { describe, expect, it } from 'vitest';

import type { AppState } from '../types';
import { DEFAULT_STATE } from '../utils/defaults';
import { calcAll, computeSourceAvailable, computeUseRequired } from './calculations';

function cloneDefaultState(): AppState {
  return JSON.parse(JSON.stringify(DEFAULT_STATE)) as AppState;
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
});
