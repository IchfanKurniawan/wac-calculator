export const LANDSCAPE_BASELINE_RATE = 5;
export const LANDSCAPE_MAX_ZONES = 5;
export const LANDSCAPE_SHARE_DECIMALS = 3;
export const LANDSCAPE_SHARE_REQUIRED_PCT = 100;

export function landscapeShareSum(zones: { areaShare: number }[]): number {
  return zones.reduce((sum, zone) => sum + (zone.areaShare || 0), 0);
}

export function landscapeSharePct(zones: { areaShare: number }[]): number {
  return Number((landscapeShareSum(zones) * 100).toFixed(LANDSCAPE_SHARE_DECIMALS));
}

export function isLandscapeShareExact(zones: { areaShare: number }[]): boolean {
  return landscapeSharePct(zones) === LANDSCAPE_SHARE_REQUIRED_PCT;
}
