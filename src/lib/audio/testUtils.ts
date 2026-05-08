import type { AudioPayload } from './types';

export function makeSinePayload({
  frequency = 440,
  seconds = 2,
  sampleRate = 48_000,
  gain = 0.2,
  channels = 2
}: {
  frequency?: number;
  seconds?: number;
  sampleRate?: number;
  gain?: number;
  channels?: number;
} = {}): AudioPayload {
  const sampleCount = Math.round(sampleRate * seconds);
  const channelData: Float32Array[] = [];

  for (let channelIndex = 0; channelIndex < channels; channelIndex += 1) {
    const data = new Float32Array(sampleCount);
    const phase = channelIndex === 0 ? 0 : Math.PI / 9;

    for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
      data[sampleIndex] =
        gain * Math.sin((2 * Math.PI * frequency * sampleIndex) / sampleRate + phase);
    }

    channelData.push(data);
  }

  return {
    name: 'sine.wav',
    sampleRate,
    channels: channelData
  };
}
