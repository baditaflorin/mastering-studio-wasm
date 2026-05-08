import { applyBiquad, designBiquad } from './biquad';
import { EPSILON, gainToDb, mean, powerToLufs } from './math';
import type { AudioMetrics, AudioPayload } from './types';

interface LoudnessBlock {
  power: number;
  lufs: number;
}

export function analyzeAudio(payload: AudioPayload): AudioMetrics {
  const sampleRate = payload.sampleRate;
  const channelCount = payload.channels.length;
  const sampleCount = payload.channels[0]?.length ?? 0;
  const durationSeconds = sampleCount / sampleRate;
  const peak = computePeak(payload.channels);
  const rms = computeRms(payload.channels);
  const integratedLufs = computeIntegratedLufs(payload.channels, sampleRate);
  const stereoCorrelation =
    channelCount >= 2
      ? computeStereoCorrelation(payload.channels[0], payload.channels[1])
      : null;
  const dcOffset = computeDcOffset(payload.channels);
  const tone = computeToneBalance(payload.channels, sampleRate);
  const rmsDb = gainToDb(rms);
  const peakDb = gainToDb(peak);

  return {
    durationSeconds,
    sampleRate,
    channelCount,
    integratedLufs,
    peakDb,
    rmsDb,
    crestFactorDb: peakDb - rmsDb,
    stereoCorrelation,
    brightness: tone.brightness,
    lowEnd: tone.lowEnd,
    dcOffset
  };
}

export function computeIntegratedLufs(
  channels: Float32Array[],
  sampleRate: number
): number {
  if (channels.length === 0 || (channels[0]?.length ?? 0) === 0) {
    return Number.NEGATIVE_INFINITY;
  }

  const weighted = channels.map((channel) => {
    const highPassed = applyBiquad(
      channel,
      designBiquad('highpass', sampleRate, 38, 0.5)
    );
    return applyBiquad(
      highPassed,
      designBiquad('highshelf', sampleRate, 1681.974, 0.707, 4)
    );
  });

  const blocks = createLoudnessBlocks(weighted, sampleRate);
  const absoluteGated = blocks.filter((block) => block.lufs > -70);

  if (absoluteGated.length === 0) {
    return Number.NEGATIVE_INFINITY;
  }

  const ungatedPower = mean(absoluteGated.map((block) => block.power));
  const relativeThreshold = powerToLufs(ungatedPower) - 10;
  const relativeGated = absoluteGated.filter((block) => block.lufs > relativeThreshold);

  if (relativeGated.length === 0) {
    return powerToLufs(ungatedPower);
  }

  return powerToLufs(mean(relativeGated.map((block) => block.power)));
}

function createLoudnessBlocks(
  channels: Float32Array[],
  sampleRate: number
): LoudnessBlock[] {
  const blockSize = Math.max(1, Math.round(sampleRate * 0.4));
  const stepSize = Math.max(1, Math.round(sampleRate * 0.1));
  const sampleCount = channels[0]?.length ?? 0;
  const blocks: LoudnessBlock[] = [];

  for (let start = 0; start + blockSize <= sampleCount; start += stepSize) {
    let power = 0;

    for (const channel of channels) {
      let channelPower = 0;

      for (let index = start; index < start + blockSize; index += 1) {
        const sample = channel[index] ?? 0;
        channelPower += sample * sample;
      }

      power += channelPower / blockSize;
    }

    blocks.push({
      power,
      lufs: powerToLufs(power)
    });
  }

  if (blocks.length === 0) {
    const fallbackPower = computeRms(channels) ** 2 * channels.length;
    blocks.push({
      power: fallbackPower,
      lufs: powerToLufs(fallbackPower)
    });
  }

  return blocks;
}

function computePeak(channels: readonly Float32Array[]): number {
  let peak = 0;

  for (const channel of channels) {
    for (let index = 0; index < channel.length; index += 1) {
      peak = Math.max(peak, Math.abs(channel[index] ?? 0));
    }
  }

  return Math.max(EPSILON, peak);
}

function computeRms(channels: readonly Float32Array[]): number {
  let sumSquares = 0;
  let sampleTotal = 0;

  for (const channel of channels) {
    sampleTotal += channel.length;

    for (let index = 0; index < channel.length; index += 1) {
      const sample = channel[index] ?? 0;
      sumSquares += sample * sample;
    }
  }

  return Math.sqrt(sumSquares / Math.max(1, sampleTotal));
}

function computeStereoCorrelation(left: Float32Array, right: Float32Array): number {
  const length = Math.min(left.length, right.length);
  let sumLR = 0;
  let sumL2 = 0;
  let sumR2 = 0;

  for (let index = 0; index < length; index += 1) {
    const l = left[index] ?? 0;
    const r = right[index] ?? 0;
    sumLR += l * r;
    sumL2 += l * l;
    sumR2 += r * r;
  }

  return sumLR / Math.sqrt(Math.max(EPSILON, sumL2 * sumR2));
}

function computeDcOffset(channels: readonly Float32Array[]): number {
  const offsets = channels.map((channel) => {
    let sum = 0;

    for (let index = 0; index < channel.length; index += 1) {
      sum += channel[index] ?? 0;
    }

    return sum / Math.max(1, channel.length);
  });

  return mean(offsets);
}

function computeToneBalance(
  channels: readonly Float32Array[],
  sampleRate: number
): { brightness: number; lowEnd: number } {
  const highPass = designBiquad('highpass', sampleRate, 4200, 0.707);
  const lowPass = designBiquad('lowpass', sampleRate, 180, 0.707);
  let fullPower = 0;
  let highPower = 0;
  let lowPower = 0;

  for (const channel of channels) {
    const high = applyBiquad(channel, highPass);
    const low = applyBiquad(channel, lowPass);

    for (let index = 0; index < channel.length; index += 1) {
      const sample = channel[index] ?? 0;
      fullPower += sample * sample;

      const highSample = high[index] ?? 0;
      highPower += highSample * highSample;

      const lowSample = low[index] ?? 0;
      lowPower += lowSample * lowSample;
    }
  }

  return {
    brightness: highPower / Math.max(EPSILON, fullPower),
    lowEnd: lowPower / Math.max(EPSILON, fullPower)
  };
}
