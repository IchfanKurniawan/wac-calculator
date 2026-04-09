import type { AppState, FixtureProduct, FixtureGroup, WBScenario } from '../types';
import { WB_SOURCE_IDS, WB_USE_IDS } from '../types';

export const mkProd = (): FixtureProduct => ({ name: '', qty: 0, rate: 0 });

export const mkFixtureGroup = (): FixtureGroup => ({
  WC_FLUSH_VALVE:  [mkProd()],
  WC_FLUSH_TANK:   [mkProd()],
  URINAL:          [mkProd()],
  KERAN_TEMBOK:    [mkProd()],
  KERAN_WASTAFEL:  [mkProd()],
  KERAN_WUDHU:     [mkProd()],
  SHOWER:          [mkProd()],
});

export const mkWBScenario = (): WBScenario => ({
  sources: WB_SOURCE_IDS.map(id => ({ id, availableManual: 0, volumeDiolah: 0 })),
  uses:    WB_USE_IDS.map(id   => ({ id, dariAlt: 0, dariRecycle: 0 })),
});

export const DEFAULT_STATE: AppState = {
  building: {
    name: '',
    typology: 'KANTOR',
    nla: 0,
    occupant1: 0,
    occupant2: 0,
    opHours: 8,
  },
  fixtures: mkFixtureGroup(),
  hasUrinal: true,
  landscape: {
    area: 0,
    zones: [{ label: 'Area 1', basRate: 5, dsgRate: 0, areaShare: 1 }],
  },
  coolingTower: { enabled: false, load: 0 },
  rainwater: {
    hasTank: false,
    rainyDayPct: 0.55,
    tankCapacity: 0,
    avgRainfall: 50,
    runoffCoef: 0.78,
    roofArea: 0,
  },
  waterBalance: {
    wet: mkWBScenario(),
    dry: mkWBScenario(),
  },
};
