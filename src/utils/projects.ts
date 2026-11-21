/**
 * Multi-project storage. Client-side only (localStorage).
 *
 * One record per project, plus the id of the project currently open.
 * The old single-draft key is migrated into the list on first load.
 */

import type { AppState, FixtureGroup, LandscapeZone } from '../types';
import { createDefaultState } from './defaults';

const PROJECTS_KEY = 'greenship-wac-projects-v1';
const ACTIVE_KEY = 'greenship-wac-active-project-v1';
const LEGACY_STATE_KEY = 'greenship-wac-calculator-state-v1';

export interface ProjectRecord {
  id: string;
  name: string;
  updatedAt: number;
  state: AppState;
}

export function newProjectId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function asRecord(v: unknown): Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

/** Merge a stored/imported state over the current defaults so old drafts keep working. */
export function mergeStoredState(raw: unknown): AppState {
  const base = createDefaultState();
  const stored = asRecord(raw);
  const stateLike = asRecord(stored.state ?? stored);
  const building = asRecord(stateLike.building);
  const fixtures = asRecord(stateLike.fixtures);
  const landscape = asRecord(stateLike.landscape);
  const coolingTower = asRecord(stateLike.coolingTower);
  const rainwater = asRecord(stateLike.rainwater);
  const waterBalance = asRecord(stateLike.waterBalance);

  const mergeScenario = (key: 'wet' | 'dry') => {
    const incoming = asRecord(waterBalance[key]);
    const sources = Array.isArray(incoming.sources) ? incoming.sources.map(asRecord) : [];
    const uses = Array.isArray(incoming.uses) ? incoming.uses.map(asRecord) : [];
    return {
      sources: base.waterBalance[key].sources.map(row => ({ ...row, ...(sources.find(r => r.id === row.id) ?? {}) })),
      uses: base.waterBalance[key].uses.map(row => ({ ...row, ...(uses.find(r => r.id === row.id) ?? {}) })),
    };
  };

  return {
    ...base,
    building: { ...base.building, ...building },
    fixtures: { ...base.fixtures, ...fixtures } as FixtureGroup,
    hasUrinal: typeof stateLike.hasUrinal === 'boolean' ? stateLike.hasUrinal : base.hasUrinal,
    landscape: {
      ...base.landscape,
      ...landscape,
      zones: Array.isArray(landscape.zones) ? (landscape.zones as LandscapeZone[]) : base.landscape.zones,
    },
    coolingTower: { ...base.coolingTower, ...coolingTower },
    rainwater: { ...base.rainwater, ...rainwater },
    waterBalance: {
      wet: mergeScenario('wet'),
      dry: mergeScenario('dry'),
    },
  };
}

function readRaw(key: string): unknown {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function toRecord(raw: unknown, index: number): ProjectRecord | null {
  const obj = asRecord(raw);
  if (typeof obj.id !== 'string') return null;
  const state = mergeStoredState(obj.state);
  return {
    id: obj.id,
    name: typeof obj.name === 'string' && obj.name.trim() ? obj.name.slice(0, 80) : `Proyek ${index + 1}`,
    updatedAt: typeof obj.updatedAt === 'number' ? obj.updatedAt : Date.now(),
    state,
  };
}

export function loadProjects(): ProjectRecord[] {
  const raw = readRaw(PROJECTS_KEY);
  if (!Array.isArray(raw)) return [];
  return raw.map(toRecord).filter((p): p is ProjectRecord => p !== null);
}

export function saveProjects(projects: ProjectRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch {
    /* ignore private-mode / quota errors */
  }
}

export function saveActiveProjectId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    /* ignore */
  }
}

export function loadActiveProjectId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export interface BootResult {
  projects: ProjectRecord[];
  activeId: string;
  state: AppState;
}

/** Load the project list, migrating the legacy single draft when the list is empty. */
export function bootProjects(): BootResult {
  let projects = loadProjects();

  if (projects.length === 0) {
    const legacy = readRaw(LEGACY_STATE_KEY);
    const state = legacy ? mergeStoredState(legacy) : createDefaultState();
    projects = [{
      id: newProjectId(),
      name: state.building.name?.trim() || 'Proyek 1',
      updatedAt: Date.now(),
      state,
    }];
    saveProjects(projects);
    if (legacy && typeof window !== 'undefined') {
      try { window.localStorage.removeItem(LEGACY_STATE_KEY); } catch { /* ignore */ }
    }
  }

  const storedActive = loadActiveProjectId();
  const active = projects.find(p => p.id === storedActive) ?? projects[0];

  return { projects, activeId: active.id, state: active.state };
}
