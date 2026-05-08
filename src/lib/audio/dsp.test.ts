import { describe, expect, it } from 'vitest';
import { masterAudio } from './dsp';
import { presetOptions } from './options';
import { makeSinePayload } from './testUtils';

describe('masterAudio', () => {
  it('renders a mastered payload near the target loudness without exceeding the ceiling', () => {
    const options = presetOptions.streaming;
    const result = masterAudio(makeSinePayload({ gain: 0.08, seconds: 3 }), options);

    expect(result.mastered.channels).toHaveLength(2);
    expect(result.after.integratedLufs).toBeGreaterThan(options.targetLufs - 2.5);
    expect(result.after.integratedLufs).toBeLessThan(options.targetLufs + 2.5);
    expect(result.after.peakDb).toBeLessThanOrEqual(options.ceilingDb + 0.25);
  });
});
