import type { AppState, FixtureProduct, FixtureGroup } from '../types';

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
  wcRecyclePct: 0,
  showerRecyclePct: 0,
  landscape: {
    area: 0,
    pctFromNonPrimary: 0,
    zones: [{ label: 'Area 1', basRate: 5, dsgRate: 0, areaShare: 1 }],
  },
  coolingTower: { enabled: false, load: 0, pctFromNonPrimary: 0 },
  rainwater: {
    hasTank: false,
    tankCapacity: 0,
    avgRainfall: 50,
    runoffCoef: 0.78,
    roofArea: 0,
    useForFlush: false,
    useForIrrigation: false,
    useForCT: false,
  },
  waterRecycle: {
    hasSystem: false,
    capacity: 0,
    sourcesTap: false,
    sourcesWudhu: false,
    sourcesShower: false,
    sourcesRainwater: false,
    sourcesAHU: 0,
    sourcesOthers: 0,
    useForFlush: false,
    useForIrrigation: false,
    useForCT: false,
  },
  factory: {
    shift1: 0,
    shift2: 0,
    shift3: 0,
    malePct: 0.9,
    equipment: [],
  },
};
