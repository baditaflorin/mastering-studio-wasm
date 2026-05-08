import { applyBiquadInPlace, applyGainInPlace, designBiquad } from './biquad';
import { analyzeAudio } from './loudness';
import { clamp, dbToGain, gainToDb } from './math';
import type {
  AudioPayload,
  MasteringChain,
  MasteringOptions,
  MasteringResult
} from './types';

export function masterAudio(
  input: AudioPayload,
  options: MasteringOptions,
  onProgress: (stage: string, message: string, value: number) => void = () => undefined
): MasteringResult {
  onProgress('analysis', 'Analyzing loudness and tone', 0.08);
  const before = analyzeAudio(input);
  const channels = input.channels.map((channel) => new Float32Array(channel));
  const warnings: string[] = [];

  if (before.durationSeconds > 600) {
    warnings.push('Long tracks may need extra memory in browser-based mastering.');
  }

  onProgress('tone', 'Applying adaptive tone shaping', 0.22);
  const chain = buildMasteringChain(before, options);
  applyTone(channels, input.sampleRate, chain);

  onProgress('dynamics', 'Balancing dynamics', 0.42);
  applyStereoWidth(channels, options.stereoWidth);
  applyCompression(channels, input.sampleRate, chain, options);
  applySaturation(channels, options);

  onProgress('loudness', 'Normalizing to target loudness', 0.66);
  const preLimitPayload = {
    name: input.name,
    sampleRate: input.sampleRate,
    channels
  };
  const loudnessNow = analyzeAudio(preLimitPayload).integratedLufs;
  const loudnessGainDb = Number.isFinite(loudnessNow)
    ? clamp(options.targetLufs - loudnessNow, -18, 18)
    : 0;
  chain.loudnessGainDb = loudnessGainDb;

  for (const channel of channels) {
    applyGainInPlace(channel, loudnessGainDb);
  }

  onProgress('limiter', 'Catching peaks', 0.84);
  applyLimiter(channels, options.ceilingDb);

  const mastered = {
    name: input.name,
    sampleRate: input.sampleRate,
    channels
  };
  const after = analyzeAudio(mastered);

  if (after.peakDb > options.ceilingDb + 0.2) {
    warnings.push(
      'Peak ceiling was approached; consider lowering intensity for this source.'
    );
  }

  onProgress('complete', 'Master ready', 1);

  return {
    mastered,
    before,
    after,
    chain,
    warnings
  };
}

function buildMasteringChain(
  before: ReturnType<typeof analyzeAudio>,
  options: MasteringOptions
): MasteringChain {
  const brightnessTarget = options.preset === 'warm' ? 0.065 : 0.085;
  const lowTarget = options.preset === 'podcast' ? 0.09 : 0.12;
  const highShelfDb = clamp((brightnessTarget - before.brightness) * 18, -2.5, 3.5);
  const lowShelfDb = clamp(
    (lowTarget - before.lowEnd) * 10 + options.warmth * 2.2,
    -2,
    3.5
  );
  const compressorThresholdDb = clamp(
    before.rmsDb + 5 - options.intensity * 7,
    -34,
    -10
  );
  const compressorRatio = clamp(1.25 + options.intensity * 2.5, 1.2, 4);
  const makeupGainDb = clamp(options.intensity * 2.5, 0, 4);

  return {
    highPassHz: options.preset === 'podcast' ? 70 : 28,
    lowShelfDb,
    highShelfDb,
    compressorThresholdDb,
    compressorRatio,
    makeupGainDb,
    loudnessGainDb: 0,
    limiterCeilingDb: options.ceilingDb
  };
}

function applyTone(
  channels: Float32Array[],
  sampleRate: number,
  chain: MasteringChain
): void {
  const highPass = designBiquad('highpass', sampleRate, chain.highPassHz, 0.707);
  const lowShelf = designBiquad('lowshelf', sampleRate, 120, 0.707, chain.lowShelfDb);
  const highShelf = designBiquad(
    'highshelf',
    sampleRate,
    6800,
    0.707,
    chain.highShelfDb
  );

  for (const channel of channels) {
    applyBiquadInPlace(channel, highPass);
    applyBiquadInPlace(channel, lowShelf);
    applyBiquadInPlace(channel, highShelf);
  }
}

function applyCompression(
  channels: Float32Array[],
  sampleRate: number,
  chain: MasteringChain,
  options: MasteringOptions
): void {
  const attackMs = options.preset === 'podcast' ? 4 : 14;
  const releaseMs = options.preset === 'loud' ? 95 : 160;
  const attack = Math.exp(-1 / ((attackMs / 1000) * sampleRate));
  const release = Math.exp(-1 / ((releaseMs / 1000) * sampleRate));
  const threshold = chain.compressorThresholdDb;
  const knee = 6;

  for (const channel of channels) {
    let envelope = 0;

    for (let index = 0; index < channel.length; index += 1) {
      const sample = channel[index] ?? 0;
      const rectified = Math.abs(sample);
      const coefficient = rectified > envelope ? attack : release;
      envelope = coefficient * envelope + (1 - coefficient) * rectified;

      const envelopeDb = gainToDb(envelope);
      const overDb = envelopeDb - threshold;
      let gainReductionDb = 0;

      if (overDb > -knee / 2) {
        if (overDb < knee / 2) {
          const kneePosition = overDb + knee / 2;
          gainReductionDb =
            ((1 / chain.compressorRatio - 1) * kneePosition * kneePosition) /
            (2 * knee);
        } else {
          gainReductionDb = overDb * (1 / chain.compressorRatio - 1);
        }
      }

      channel[index] = sample * dbToGain(gainReductionDb + chain.makeupGainDb);
    }
  }
}

function applySaturation(channels: Float32Array[], options: MasteringOptions): void {
  const drive = 1 + options.intensity * 0.16 + options.warmth * 0.12;
  const normalizer = Math.tanh(drive);

  for (const channel of channels) {
    for (let index = 0; index < channel.length; index += 1) {
      const sample = channel[index] ?? 0;
      channel[index] = Math.tanh(sample * drive) / normalizer;
    }
  }
}

function applyStereoWidth(channels: Float32Array[], width: number): void {
  if (channels.length < 2) {
    return;
  }

  const left = channels[0];
  const right = channels[1];
  const safeWidth = clamp(width, 0.65, 1.45);
  const length = Math.min(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const l = left[index] ?? 0;
    const r = right[index] ?? 0;
    const mid = (l + r) * 0.5;
    const side = (l - r) * 0.5 * safeWidth;
    left[index] = mid + side;
    right[index] = mid - side;
  }
}

function applyLimiter(channels: Float32Array[], ceilingDb: number): void {
  const ceiling = dbToGain(ceilingDb);
  const softThreshold = ceiling * 0.92;

  for (const channel of channels) {
    for (let index = 0; index < channel.length; index += 1) {
      const sample = channel[index] ?? 0;
      const sign = Math.sign(sample);
      const magnitude = Math.abs(sample);

      if (magnitude <= softThreshold) {
        continue;
      }

      const shaped =
        softThreshold +
        (ceiling - softThreshold) *
          (1 -
            Math.exp(
              -(magnitude - softThreshold) / Math.max(1e-6, ceiling - softThreshold)
            ));
      channel[index] = sign * Math.min(ceiling, shaped);
    }
  }

  const peak = findPeak(channels);

  if (peak > ceiling) {
    const trim = ceiling / peak;

    for (const channel of channels) {
      for (let index = 0; index < channel.length; index += 1) {
        channel[index] *= trim;
      }
    }
  }
}

function findPeak(channels: readonly Float32Array[]): number {
  let peak = 0;

  for (const channel of channels) {
    for (let index = 0; index < channel.length; index += 1) {
      peak = Math.max(peak, Math.abs(channel[index] ?? 0));
    }
  }

  return peak;
}
