import { describe, expect, it } from 'vitest';
import { inferSourceProfile } from './classify';
import { masterAudio } from './dsp';
import { hashString } from './fingerprint';
import { analyzeAudio } from './loudness';
import { presetOptions } from './options';
import type { PreflightReport } from './types';
import { makeSinePayload } from './testUtils';

describe('masterAudio', () => {
  it('renders a mastered payload near the target loudness without exceeding the ceiling', () => {
    const options = presetOptions.streaming;
    const payload = makeSinePayload({ gain: 0.08, seconds: 3 });
    const preflight: PreflightReport = {
      fileName: payload.name,
      extension: 'wav',
      detectedFormat: 'wav',
      sizeBytes: 0,
      estimatedDecodeMemoryBytes: 0,
      canAttemptDecode: true,
      blockingError: null,
      warnings: [],
      sourceId: 'test-source'
    };
    const profile = inferSourceProfile(analyzeAudio(payload), preflight);
    const result = masterAudio(payload, options, {
      sourceId: 'test-source',
      inputFingerprint: hashString('test'),
      sourceProfile: profile,
      appVersion: '0.2.0-test',
      commit: 'test-commit'
    });

    expect(result.mastered.channels).toHaveLength(2);
    expect(result.after.integratedLufs).toBeGreaterThan(options.targetLufs - 2.5);
    expect(result.after.integratedLufs).toBeLessThan(options.targetLufs + 2.5);
    expect(result.after.peakDb).toBeLessThanOrEqual(options.ceilingDb + 0.25);
  });
});
