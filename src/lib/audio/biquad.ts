import { dbToGain } from './math';

export type BiquadType = 'highpass' | 'lowpass' | 'lowshelf' | 'highshelf' | 'peaking';

export interface BiquadCoefficients {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

export function designBiquad(
  type: BiquadType,
  sampleRate: number,
  frequency: number,
  q = Math.SQRT1_2,
  gainDb = 0
): BiquadCoefficients {
  const safeFrequency = Math.min(sampleRate * 0.45, Math.max(10, frequency));
  const w0 = (2 * Math.PI * safeFrequency) / sampleRate;
  const cos = Math.cos(w0);
  const sin = Math.sin(w0);
  const alpha = sin / (2 * Math.max(0.001, q));
  const amplitude = 10 ** (gainDb / 40);

  let b0 = 1;
  let b1 = 0;
  let b2 = 0;
  let a0 = 1;
  let a1 = 0;
  let a2 = 0;

  switch (type) {
    case 'highpass':
      b0 = (1 + cos) / 2;
      b1 = -(1 + cos);
      b2 = (1 + cos) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cos;
      a2 = 1 - alpha;
      break;
    case 'lowpass':
      b0 = (1 - cos) / 2;
      b1 = 1 - cos;
      b2 = (1 - cos) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cos;
      a2 = 1 - alpha;
      break;
    case 'peaking': {
      b0 = 1 + alpha * amplitude;
      b1 = -2 * cos;
      b2 = 1 - alpha * amplitude;
      a0 = 1 + alpha / amplitude;
      a1 = -2 * cos;
      a2 = 1 - alpha / amplitude;
      break;
    }
    case 'lowshelf': {
      const sqrtA = Math.sqrt(amplitude);
      const shelfAlpha = (sin / 2) * Math.sqrt(2);
      b0 = amplitude * (amplitude + 1 - (amplitude - 1) * cos + 2 * sqrtA * shelfAlpha);
      b1 = 2 * amplitude * (amplitude - 1 - (amplitude + 1) * cos);
      b2 = amplitude * (amplitude + 1 - (amplitude - 1) * cos - 2 * sqrtA * shelfAlpha);
      a0 = amplitude + 1 + (amplitude - 1) * cos + 2 * sqrtA * shelfAlpha;
      a1 = -2 * (amplitude - 1 + (amplitude + 1) * cos);
      a2 = amplitude + 1 + (amplitude - 1) * cos - 2 * sqrtA * shelfAlpha;
      break;
    }
    case 'highshelf': {
      const sqrtA = Math.sqrt(amplitude);
      const shelfAlpha = (sin / 2) * Math.sqrt(2);
      b0 = amplitude * (amplitude + 1 + (amplitude - 1) * cos + 2 * sqrtA * shelfAlpha);
      b1 = -2 * amplitude * (amplitude - 1 + (amplitude + 1) * cos);
      b2 = amplitude * (amplitude + 1 + (amplitude - 1) * cos - 2 * sqrtA * shelfAlpha);
      a0 = amplitude + 1 - (amplitude - 1) * cos + 2 * sqrtA * shelfAlpha;
      a1 = 2 * (amplitude - 1 - (amplitude + 1) * cos);
      a2 = amplitude + 1 - (amplitude - 1) * cos - 2 * sqrtA * shelfAlpha;
      break;
    }
  }

  return {
    b0: b0 / a0,
    b1: b1 / a0,
    b2: b2 / a0,
    a1: a1 / a0,
    a2: a2 / a0
  };
}

export function applyBiquad(
  input: Float32Array,
  coefficients: BiquadCoefficients
): Float32Array {
  const output = new Float32Array(input.length);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;

  for (let index = 0; index < input.length; index += 1) {
    const x0 = input[index] ?? 0;
    const y0 =
      coefficients.b0 * x0 +
      coefficients.b1 * x1 +
      coefficients.b2 * x2 -
      coefficients.a1 * y1 -
      coefficients.a2 * y2;

    output[index] = y0;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }

  return output;
}

export function applyBiquadInPlace(
  data: Float32Array,
  coefficients: BiquadCoefficients
): Float32Array {
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;

  for (let index = 0; index < data.length; index += 1) {
    const x0 = data[index] ?? 0;
    const y0 =
      coefficients.b0 * x0 +
      coefficients.b1 * x1 +
      coefficients.b2 * x2 -
      coefficients.a1 * y1 -
      coefficients.a2 * y2;

    data[index] = y0;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }

  return data;
}

export function applyGainInPlace(data: Float32Array, gainDb: number): Float32Array {
  const gain = dbToGain(gainDb);

  for (let index = 0; index < data.length; index += 1) {
    data[index] *= gain;
  }

  return data;
}
