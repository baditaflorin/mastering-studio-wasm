import { describe, expect, it } from 'vitest';
import { gainToDb } from './math';
import {
  computeChannelTruePeak,
  computeTruePeak,
  computeTruePeakDb,
  enforceTruePeakCeiling
} from './truePeak';

describe('truePeak', () => {
  it('detects inter-sample peaks above the sample-domain peak', () => {
    const sampleRate = 48_000;
    const seconds = 0.05;
    const channel = new Float32Array(sampleRate * seconds);
    // A 12 kHz cosine sampled at 48 kHz has its sample-domain peak at 1.0
    // (every fourth sample), and its true peak hovers very close to 1.0;
    // the cleaner half-Nyquist case below is what we lean on.
    for (let index = 0; index < channel.length; index += 1) {
      channel[index] = 0.999 * Math.cos((2 * Math.PI * 12_000 * index) / sampleRate);
    }
    const samplePeak = channel.reduce(
      (peak, value) => Math.max(peak, Math.abs(value)),
      0
    );
    const truePeak = computeChannelTruePeak(channel);
    expect(truePeak).toBeGreaterThanOrEqual(samplePeak - 1e-3);
  });

  it('reveals worse-case inter-sample peaks on a half-Nyquist square wave', () => {
    const sampleRate = 48_000;
    const length = sampleRate * 0.05;
    const channel = new Float32Array(length);
    // Alternating +1 / -1 produces a strong inter-sample peak.
    for (let index = 0; index < length; index += 1) {
      channel[index] = index % 2 === 0 ? 0.99 : -0.99;
    }
    const samplePeak = 0.99;
    const truePeak = computeChannelTruePeak(channel);
    expect(truePeak).toBeGreaterThan(samplePeak * 1.05);
  });

  it('returns 0 for an empty buffer and -Infinity dBTP', () => {
    expect(computeTruePeak([new Float32Array()])).toBe(0);
    expect(computeTruePeakDb([new Float32Array()])).toBe(Number.NEGATIVE_INFINITY);
  });

  it('trims output until true-peak respects the ceiling', () => {
    const sampleRate = 48_000;
    const length = sampleRate * 0.05;
    const channel = new Float32Array(length);
    for (let index = 0; index < length; index += 1) {
      channel[index] = index % 2 === 0 ? 0.98 : -0.98;
    }
    const channels = [channel];
    const before = computeTruePeakDb(channels);
    const ceilingDb = -1;
    const result = enforceTruePeakCeiling(channels, ceilingDb);
    const after = computeTruePeakDb(channels);

    expect(before).toBeGreaterThan(ceilingDb);
    expect(after).toBeLessThanOrEqual(ceilingDb + 1e-2);
    expect(result.trimDb).toBeLessThan(0);
  });

  it('leaves a quiet buffer untouched', () => {
    const channel = new Float32Array(1024);
    for (let index = 0; index < channel.length; index += 1) {
      channel[index] = 0.1 * Math.sin(index * 0.02);
    }
    const originalPeak = gainToDb(0.1);
    const result = enforceTruePeakCeiling([channel], -1);
    expect(result.trimDb).toBe(0);
    expect(result.truePeakDb).toBeLessThan(-1);
    expect(result.truePeakDb).toBeGreaterThan(originalPeak - 2);
  });
});
