import { describe, expect, it } from 'vitest';
import { analyzeAudio, computeIntegratedLufs } from './loudness';
import { makeSinePayload } from './testUtils';

describe('loudness analysis', () => {
  it('computes finite integrated LUFS for a stereo sine payload', () => {
    const payload = makeSinePayload({ gain: 0.2 });
    const lufs = computeIntegratedLufs(payload.channels, payload.sampleRate);

    expect(Number.isFinite(lufs)).toBe(true);
    expect(lufs).toBeGreaterThan(-35);
    expect(lufs).toBeLessThan(-5);
  });

  it('reports peak, rms, and stereo correlation', () => {
    const metrics = analyzeAudio(makeSinePayload({ gain: 0.1 }));

    expect(metrics.channelCount).toBe(2);
    expect(metrics.peakDb).toBeLessThanOrEqual(-19);
    expect(metrics.rmsDb).toBeLessThan(metrics.peakDb);
    expect(metrics.stereoCorrelation).not.toBeNull();
  });
});
