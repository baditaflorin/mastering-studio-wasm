import { dbToGain, gainToDb } from './math';

const oversamplingFactor = 4;

const polyphaseFilters: readonly (readonly number[])[] = buildPolyphaseFilters();

export function computeChannelTruePeak(channel: Float32Array): number {
  if (channel.length === 0) return 0;
  let peak = 0;
  const taps = polyphaseFilters[0].length;
  const halfTaps = Math.floor(taps / 2);

  for (let index = 0; index < channel.length; index += 1) {
    for (let phase = 0; phase < oversamplingFactor; phase += 1) {
      const coefficients = polyphaseFilters[phase];
      let accumulator = 0;
      for (let tap = 0; tap < taps; tap += 1) {
        const sampleIndex = index + tap - halfTaps;
        const sample =
          sampleIndex >= 0 && sampleIndex < channel.length
            ? (channel[sampleIndex] ?? 0)
            : 0;
        accumulator += sample * (coefficients[tap] ?? 0);
      }
      const magnitude = Math.abs(accumulator);
      if (magnitude > peak) peak = magnitude;
    }
  }

  return peak;
}

export function computeTruePeak(channels: readonly Float32Array[]): number {
  let maxPeak = 0;
  for (const channel of channels) {
    const channelPeak = computeChannelTruePeak(channel);
    if (channelPeak > maxPeak) maxPeak = channelPeak;
  }
  return maxPeak;
}

export function computeTruePeakDb(channels: readonly Float32Array[]): number {
  const peak = computeTruePeak(channels);
  return peak <= 0 ? Number.NEGATIVE_INFINITY : gainToDb(peak);
}

export function enforceTruePeakCeiling(
  channels: Float32Array[],
  ceilingDb: number,
  headroomDb = 0.05
): { trimDb: number; truePeakDb: number } {
  if (channels.length === 0 || (channels[0]?.length ?? 0) === 0) {
    return { trimDb: 0, truePeakDb: Number.NEGATIVE_INFINITY };
  }
  const truePeak = computeTruePeak(channels);
  const truePeakDb = truePeak <= 0 ? Number.NEGATIVE_INFINITY : gainToDb(truePeak);
  const targetDb = ceilingDb - headroomDb;
  if (truePeakDb <= targetDb || !Number.isFinite(truePeakDb)) {
    return { trimDb: 0, truePeakDb };
  }
  const trimDb = targetDb - truePeakDb;
  const trimGain = dbToGain(trimDb);
  for (const channel of channels) {
    for (let index = 0; index < channel.length; index += 1) {
      channel[index] = (channel[index] ?? 0) * trimGain;
    }
  }
  return { trimDb, truePeakDb };
}

function buildPolyphaseFilters(): number[][] {
  const filterLength = 49;
  const cutoff = 0.5 / oversamplingFactor;
  const center = (filterLength - 1) / 2;
  const prototype: number[] = new Array(filterLength).fill(0);
  for (let index = 0; index < filterLength; index += 1) {
    const offset = index - center;
    const sinc =
      offset === 0
        ? 2 * cutoff
        : Math.sin(2 * Math.PI * cutoff * offset) / (Math.PI * offset);
    const window =
      0.42 -
      0.5 * Math.cos((2 * Math.PI * index) / (filterLength - 1)) +
      0.08 * Math.cos((4 * Math.PI * index) / (filterLength - 1));
    prototype[index] = sinc * window;
  }

  const phases: number[][] = [];
  for (let phase = 0; phase < oversamplingFactor; phase += 1) {
    const phaseFilter: number[] = [];
    for (let tap = 0; tap < filterLength; tap += oversamplingFactor) {
      phaseFilter.push((prototype[tap + phase] ?? 0) * oversamplingFactor);
    }
    phases.push(phaseFilter);
  }
  return phases;
}
