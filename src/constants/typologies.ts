import type { TypologyId } from '../types';

// ─── Behavioral constants per typology ───────────────────────────────────────
// Source: GREENSHIP Water Calculator v2.2 (Office), v2.0 (Factory)
// All future typologies pre-populated from NB 2.0 source data

export interface TypologyConfig {
  label: string;
  active: boolean;
  phase: 1 | 2 | 3;
  note?: string;

  // Occupancy
  opHours: number;
  opHoursStandard: number; // normalization denominator (always 8)
  occupant1Label: string;
  occupant2Label?: string;

  // WC constants
  wcMale: number;       // flushes/day, per male occupant
  wcFemale: number;     // flushes/day, per female occupant
  wcNoUrinal: number;   // flushes/day when no urinal
  urinalUses: number;   // flushes/day, per male occupant
  urinalAutoTimer: number; // flushes/day (auto flushing)

  // Occupancy ratios (Occ1)
  femalePct: number;    // 0–1
  malePct: number;      // 0–1

  // Tap constants
  hwDuration: number;   // handwashing minutes per use
  tapUsage: number;     // uses per day
  wudhuDuration: number;// minutes per use
  wudhuTimes: number;   // times per day
  mosalemMale: number;  // fraction of male occupants who are moslem
  mosalemFemale: number;

  // Shower
  showerDuration: number; // minutes per person
  showerPct: number;      // fraction of occupants who shower

  // Landscape
  irrigationFreq: number; // times per day

  // WAC 1 result unit
  resultUnit: string;
  normFn: (total: number, occupant1: number, nla: number, opHours: number) => number;

  // Factory-specific flags
  isFactory?: boolean;
}

export const TYPOLOGY_CONFIG: Record<TypologyId, TypologyConfig> = {
  KANTOR: {
    label: 'Kantor (Office)',
    active: true,
    phase: 1,
    opHours: 8,
    opHoursStandard: 8,
    occupant1Label: 'Jumlah Pegawai',
    wcMale: 0.3,
    wcFemale: 2.3,
    wcNoUrinal: 2.3,
    urinalUses: 2.0,
    urinalAutoTimer: 48,
    femalePct: 0.5,
    malePct: 0.5,
    hwDuration: 0.15,
    tapUsage: 2.5,
    wudhuDuration: 0.5,
    wudhuTimes: 2,
    mosalemMale: 0.5,
    mosalemFemale: 0.5,
    showerDuration: 5,
    showerPct: 0.05,
    irrigationFreq: 2,
    resultUnit: 'L/pegawai/hari',
    normFn: (total, occ1, _nla, hrs) => (total / occ1) * (hrs / 8),
  },

  PABRIK: {
    label: 'Pabrik (Factory)',
    active: true,
    phase: 1,
    note: 'Memerlukan data shift 1, 2, dan 3',
    opHours: 24,
    opHoursStandard: 8,
    occupant1Label: 'Jumlah Pegawai (total semua shift)',
    wcMale: 0.42,
    wcFemale: 1.38,
    wcNoUrinal: 2.3,
    urinalUses: 3.0,
    urinalAutoTimer: 67.2,
    femalePct: 0.1,   // default — user can override
    malePct: 0.9,     // default — user can override
    hwDuration: 0.15,
    tapUsage: 7.5,
    wudhuDuration: 0.5,
    wudhuTimes: 5,
    mosalemMale: 0.5,
    mosalemFemale: 0.5,
    showerDuration: 5,
    showerPct: 0.05,
    irrigationFreq: 2,
    resultUnit: 'L/m²/hari',
    normFn: (total, _occ1, nla, hrs) => (total / nla) * (hrs / 8),
    isFactory: true,
  },

  // ── Phase 2 typologies (constants stored, UI not yet active) ──────────────

  MALL: {
    label: 'Mall / Pertokoan / Retail',
    active: false,
    phase: 2,
    opHours: 12,
    opHoursStandard: 8,
    occupant1Label: 'Jumlah Pegawai',
    occupant2Label: 'Jumlah Pengunjung',
    wcMale: 0.3,
    wcFemale: 3.3,
    wcNoUrinal: 3.3,
    urinalUses: 3.0,
    urinalAutoTimer: 48,
    femalePct: 0.5,
    malePct: 0.5,
    hwDuration: 0.15,
    tapUsage: 2.5,
    wudhuDuration: 0.5,
    wudhuTimes: 2,
    mosalemMale: 0.5,
    mosalemFemale: 0.5,
    showerDuration: 5,
    showerPct: 0.05,
    irrigationFreq: 2,
    resultUnit: 'L/m²/hari',
    normFn: (total, _occ1, nla, hrs) => (total / nla) * (hrs / 12),
  },

  APARTEMEN: {
    label: 'Apartemen / Hotel / Rusun',
    active: false,
    phase: 2,
    opHours: 24,
    opHoursStandard: 8,
    occupant1Label: 'Jumlah Penghuni',
    occupant2Label: 'Jumlah Unit Apartemen',
    wcMale: 2.0,
    wcFemale: 7.0,
    wcNoUrinal: 7.0,
    urinalUses: 5.0,
    urinalAutoTimer: 48,
    femalePct: 0.5,
    malePct: 0.5,
    hwDuration: 0.25,
    tapUsage: 7.0,
    wudhuDuration: 0.5,
    wudhuTimes: 2,
    mosalemMale: 0.5,
    mosalemFemale: 0.5,
    showerDuration: 2.7,
    showerPct: 1.0,
    irrigationFreq: 2,
    resultUnit: 'L/penghuni/hari',
    normFn: (total, occ1, _nla, hrs) => (total / occ1) * (hrs / 24),
  },

  AIRPORT: {
    label: 'Airport',
    active: false,
    phase: 2,
    opHours: 24,
    opHoursStandard: 8,
    occupant1Label: 'Jumlah Pegawai',
    occupant2Label: 'Jumlah Pengunjung',
    wcMale: 2.5,
    wcFemale: 3.5,
    wcNoUrinal: 3.5,
    urinalUses: 2.0,
    urinalAutoTimer: 48,
    femalePct: 0.5,
    malePct: 0.5,
    hwDuration: 0.4,
    tapUsage: 2.5,
    wudhuDuration: 0.5,
    wudhuTimes: 2,
    mosalemMale: 0.5,
    mosalemFemale: 0.5,
    showerDuration: 5,
    showerPct: 0.05,
    irrigationFreq: 2,
    resultUnit: 'L/orang/hari',
    normFn: (total, occ1, _nla, _hrs) => total / occ1,
  },

  MASJID: {
    label: 'Masjid (Pilot Project)',
    active: false,
    phase: 3,
    note: 'Masih dalam tahap pengembangan',
    opHours: 10,
    opHoursStandard: 8,
    occupant1Label: 'Jumlah Pegawai',
    occupant2Label: 'Jumlah Pengunjung',
    wcMale: 0.3,
    wcFemale: 1.5,
    wcNoUrinal: 1.3,
    urinalUses: 1.0,
    urinalAutoTimer: 48,
    femalePct: 0.3,
    malePct: 0.7,
    hwDuration: 0.12,
    tapUsage: 1.25,
    wudhuDuration: 0.5,
    wudhuTimes: 3,
    mosalemMale: 1.0,
    mosalemFemale: 1.0,
    showerDuration: 5,
    showerPct: 0.05,
    irrigationFreq: 2,
    resultUnit: 'L/orang/hari',
    normFn: (total, occ1, _nla, _hrs) => total / occ1,
  },

  STADIUM: {
    label: 'Stadium',
    active: false,
    phase: 3,
    opHours: 8,
    opHoursStandard: 8,
    occupant1Label: 'Jumlah Pegawai',
    occupant2Label: 'Jumlah Penonton',
    wcMale: 0.3,
    wcFemale: 2.3,
    wcNoUrinal: 2.3,
    urinalUses: 2.0,
    urinalAutoTimer: 48,
    femalePct: 0.5,
    malePct: 0.5,
    hwDuration: 0.15,
    tapUsage: 2.5,
    wudhuDuration: 0.5,
    wudhuTimes: 2,
    mosalemMale: 0.5,
    mosalemFemale: 0.5,
    showerDuration: 5,
    showerPct: 0.05,
    irrigationFreq: 2,
    resultUnit: 'L/m²/hari',
    normFn: (total, _occ1, nla, _hrs) => total / nla,
  },
};
