import { describe, expect, it } from 'vitest';
import { inferSourceProfile } from './classify';
import { masterAudio } from './dsp';
import {
  loadFixtureBytes,
  parsePcmWav,
  makeExecutionContext
} from './fixtureTestUtils';
import { hashBytes } from './fingerprint';
import { analyzeAudio } from './loudness';
import { inspectAudioFile } from './preflight';
import type { AudioPayload } from './types';
import { encodeWav } from './wav';

describe('deterministic mastering output', () => {
  it('produces byte-identical wav output for the same source and settings', async () => {
    const fileName = '01-clean-stereo-song.wav';
    const bytes = loadFixtureBytes(fileName);
    const payload = takeSeconds(parsePcmWav(fileName), 4);
    const preflight = await inspectAudioFile(
      new File([new Uint8Array(bytes).slice().buffer as ArrayBuffer], fileName, {
        type: 'audio/wav'
      })
    );
    const metrics = analyzeAudio(payload);
    const profile = inferSourceProfile(metrics, preflight);
    const context = makeExecutionContext(preflight.sourceId, hashBytes(bytes), profile);

    const first = masterAudio(payload, profile.recommendedOptions, context);
    const second = masterAudio(payload, profile.recommendedOptions, context);

    const firstBytes = new Uint8Array(await readBlobBytes(encodeWav(first.mastered)));
    const secondBytes = new Uint8Array(await readBlobBytes(encodeWav(second.mastered)));

    expect(Array.from(firstBytes)).toEqual(Array.from(secondBytes));
  }, 15_000);
});

function takeSeconds(payload: AudioPayload, seconds: number): AudioPayload {
  const frameCount = Math.min(
    payload.channels[0]?.length ?? 0,
    Math.floor(payload.sampleRate * seconds)
  );

  return {
    ...payload,
    channels: payload.channels.map((channel) => channel.slice(0, frameCount))
  };
}

function readBlobBytes(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') {
    return blob.arrayBuffer();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result as ArrayBuffer));
    reader.addEventListener('error', () => reject(reader.error));
    reader.readAsArrayBuffer(blob);
  });
}
