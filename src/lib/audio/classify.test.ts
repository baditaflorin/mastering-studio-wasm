import { describe, expect, it } from 'vitest';
import { analyzeAudio } from './loudness';
import { inspectAudioFile } from './preflight';
import { inferSourceProfile } from './classify';
import {
  loadFixtureBytes,
  loadFixtureExpectation,
  parsePcmWav
} from './fixtureTestUtils';

const wavFixtures = [
  '01-clean-stereo-song',
  '02-mono-voice-memo',
  '03-long-form-podcast',
  '04-clipped-master',
  '05-dynamic-classical',
  '06-wide-edm',
  '07-near-silence',
  '08-dc-offset-rumble',
  '09-surround-5_1'
] as const;

describe('real-data classification fixtures', () => {
  for (const fixtureId of wavFixtures) {
    it(
      `classifies ${fixtureId}`,
      async () => {
        const fileName = `${fixtureId}.wav`;
        const expectation = loadFixtureExpectation(fixtureId);
        const payload = parsePcmWav(fileName);
        const blobBytes = new Uint8Array(loadFixtureBytes(fileName)).slice()
          .buffer as ArrayBuffer;
        const preflight = await inspectAudioFile(
          new File([blobBytes], fileName, { type: 'audio/wav' })
        );
        const metrics = analyzeAudio(payload);
        const profile = inferSourceProfile(metrics, preflight);

        expect(profile.classification).toBe(expectation.expectedClassification);
        expect(profile.state).toBe(expectation.expectedState);
        expect(profile.recommendedPreset).toBe(expectation.recommendedPreset);
        expect(profile.classificationConfidence.score).toBeGreaterThanOrEqual(
          expectation.minConfidence
        );
        expect(profile.shouldAllowMastering).toBe(expectation.shouldAllowMastering);

        for (const anomalyId of expectation.mustIncludeAnomalies ?? []) {
          expect(profile.anomalies.some((anomaly) => anomaly.id === anomalyId)).toBe(
            true
          );
        }
      },
      fixtureId === '03-long-form-podcast' ? 15_000 : 5_000
    );
  }

  it('rejects the fake mp3 fixture during preflight', async () => {
    const expectation = loadFixtureExpectation('10-fake-mp3');
    const fileName = '10-fake-mp3.mp3';
    const blobBytes = new Uint8Array(loadFixtureBytes(fileName)).slice()
      .buffer as ArrayBuffer;
    const preflight = await inspectAudioFile(
      new File([blobBytes], fileName, { type: 'audio/mpeg' })
    );

    expect(preflight.canAttemptDecode).toBe(false);
    expect(preflight.blockingError?.id).toBe('invalid-audio');
    expect(expectation.shouldAllowMastering).toBe(false);
  });
});
