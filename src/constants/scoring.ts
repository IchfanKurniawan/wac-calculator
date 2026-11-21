// ─── Scoring rules shared by engine, validation and what-if analysis ───

/** WAC P2 rainwater prerequisite: minimum share of the ideal annual volume that the tank must hold. */
export const MIN_RAINWATER_CAP_RATIO = 0.1;

/** Cooling tower baseline cycles of concentration. */
export const CT_BASELINE_COC = 3;
export const CT_MIN_COC = 2;
export const CT_MAX_COC = 10;

/** WAC 1 ladder (NB 1.2): ratio ≤ threshold → points. Ordered best first. */
export const WAC1_LADDER: ReadonlyArray<{ maxRatio: number; pts: number }> = [
  { maxRatio: 0.45, pts: 8 },
  { maxRatio: 0.5, pts: 7 },
  { maxRatio: 0.55, pts: 6 },
  { maxRatio: 0.6, pts: 5 },
  { maxRatio: 0.65, pts: 4 },
  { maxRatio: 0.7, pts: 3 },
  { maxRatio: 0.75, pts: 2 },
  { maxRatio: 0.8, pts: 1 },
];

/** Points for a design/baseline ratio. */
export function wac1PointsForRatio(ratio: number): number {
  for (const step of WAC1_LADDER) {
    if (ratio <= step.maxRatio) return step.pts;
  }
  return 0;
}

/** The next better threshold below `ratio`, or null when the top score is already reached. */
export function nextWac1Threshold(ratio: number): number | null {
  // Ascending scan: the last threshold still below `ratio` is the next reachable one.
  const thresholds = WAC1_LADDER.map(s => s.maxRatio).sort((a, b) => a - b);
  let best: number | null = null;
  for (const t of thresholds) {
    if (t < ratio - 1e-9) best = t;
  }
  return best;
}
