export const EPSILON = 1e-12;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function dbToGain(db: number): number {
  return 10 ** (db / 20);
}

export function gainToDb(gain: number): number {
  return 20 * Math.log10(Math.max(EPSILON, gain));
}

export function powerToLufs(power: number): number {
  return -0.691 + 10 * Math.log10(Math.max(EPSILON, power));
}

export function lufsToPower(lufs: number): number {
  return 10 ** ((lufs + 0.691) / 10);
}

export function mean(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
