import { describe, expect, it } from 'vitest';

import { createDefaultState } from './defaults';
import { exportToJSON, parseAndValidate } from './importExport';

function filledState() {
  const state = createDefaultState();
  state.building.name = 'Gedung Uji';
  state.building.occupant1 = 120;
  state.building.nla = 2400;
  state.coolingTower = { enabled: true, load: 50, coc: 6 };
  state.fixtures.WC_FLUSH_VALVE = [{ name: 'Valve', qty: 8, rate: 4.5 }];
  return state;
}

describe('JSON import/export', () => {
  it('round-trips state including the cooling tower COC', () => {
    const result = parseAndValidate(exportToJSON(filledState()));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.building.name).toBe('Gedung Uji');
      expect(result.state.building.occupant1).toBe(120);
      expect(result.state.coolingTower.coc).toBe(6);
      expect(result.state.fixtures.WC_FLUSH_VALVE[0].qty).toBe(8);
    }
  });

  it('rejects malformed JSON', () => {
    const result = parseAndValidate('{ not json');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/JSON/i);
  });

  it('rejects a file from another schema version', () => {
    const result = parseAndValidate(exportToJSON(filledState()).replace('"version": "2.0"', '"version": "1.0"'));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(' ')).toMatch(/Versi/);
  });

  it('rejects landscape zones that do not total 100%', () => {
    const state = filledState();
    state.landscape.area = 500;
    state.landscape.zones = [{ label: 'Area 1', basRate: 5, dsgRate: 4, areaShare: 0.5 }];

    const result = parseAndValidate(exportToJSON(state));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(' ')).toMatch(/100/);
  });

  it('rejects a project without a building name', () => {
    const state = filledState();
    state.building.name = '';
    const result = parseAndValidate(exportToJSON(state));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(' ')).toMatch(/Nama bangunan/);
  });
});
