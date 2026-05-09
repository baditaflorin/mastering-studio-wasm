import { presetOptions } from './options';
import { clamp } from './math';
import { isLikelyLongForm } from './preflight';
import type {
  AnalysisAnomaly,
  AudioMetrics,
  InferenceConfidence,
  MasteringOptions,
  MasteringPreset,
  PreflightReport,
  SourceClassification,
  SourceProfile,
  SourceState
} from './types';

export function inferSourceProfile(
  metrics: AudioMetrics,
  preflight: PreflightReport,
  learnedDefaults?: Partial<Record<SourceClassification, MasteringOptions>>
): SourceProfile {
  const reasons: string[] = [];
  const anomalies = [...preflight.warnings];
  const state = decideState(metrics, preflight, anomalies, reasons);
  const speechScore = scoreSpeech(metrics);
  const musicScore = scoreMusic(metrics);
  const classification = decideClassification(
    speechScore,
    musicScore,
    metrics,
    preflight,
    state,
    reasons
  );
  const recommendedPreset = recommendPreset(classification, state, metrics, reasons);
  const classificationConfidence = buildConfidence(
    inferConfidenceFloor(Math.max(speechScore, musicScore), metrics, state),
    reasons.slice(0, 4)
  );
  const recommendedOptions = buildRecommendedOptions(
    recommendedPreset,
    state,
    metrics,
    learnedDefaults?.[classification]
  );
  const presetConfidence = buildConfidence(
    clamp(
      classificationConfidence.score - (anomalies.length > 0 ? 0.08 : 0),
      0.35,
      0.98
    ),
    reasons.slice(0, 4)
  );
  const shouldBlockMastering =
    Boolean(preflight.blockingError) ||
    anomalies.some((anomaly) => anomaly.severity === 'blocker') ||
    state === 'silence' ||
    state === 'multichannel' ||
    classification === 'invalid';

  return {
    classification,
    state,
    classificationConfidence,
    presetConfidence,
    recommendedPreset,
    recommendedOptions,
    reasons,
    anomalies,
    shouldAllowMastering: !shouldBlockMastering,
    shouldAutoMaster:
      !shouldBlockMastering &&
      !isLikelyLongForm(metrics.durationSeconds) &&
      preflight.estimatedDecodeMemoryBytes < 220 * 1024 * 1024,
    shouldBlockMastering,
    learningApplied: Boolean(learnedDefaults?.[classification])
  };
}

function scoreSpeech(metrics: AudioMetrics): number {
  const monoBias =
    metrics.channelCount === 1
      ? 0.34
      : metrics.stereoCorrelation !== null && metrics.stereoCorrelation > 0.97
        ? 0.09
        : 0;
  const lowEndPenalty = metrics.lowEnd < 0.78 ? 0.12 : -0.02;
  const brightnessWindow = metrics.brightness < 0.08 ? 0.16 : 0.03;
  const sampleRateHint = metrics.sampleRate <= 24000 ? 0.16 : 0.04;
  const crestWindow = metrics.crestFactorDb < 14 ? 0.08 : 0.02;

  return clamp(
    monoBias + lowEndPenalty + brightnessWindow + sampleRateHint + crestWindow,
    0.05,
    0.98
  );
}

function scoreMusic(metrics: AudioMetrics): number {
  const stereoBias = metrics.channelCount >= 2 ? 0.22 : 0.04;
  const wideBias =
    metrics.stereoCorrelation !== null && metrics.stereoCorrelation < 0.94
      ? 0.12
      : 0.05;
  const lowEndBias = metrics.lowEnd >= 0.18 ? 0.08 : 0.03;
  const brightnessBias = metrics.sampleRate >= 32000 ? 0.12 : 0.04;
  const dynamicBias = metrics.crestFactorDb >= 10 ? 0.1 : 0.04;

  return clamp(
    stereoBias + wideBias + lowEndBias + brightnessBias + dynamicBias,
    0.05,
    0.98
  );
}

function decideClassification(
  speechScore: number,
  musicScore: number,
  metrics: AudioMetrics,
  preflight: PreflightReport,
  state: SourceState,
  reasons: string[]
): SourceClassification {
  if (preflight.blockingError) {
    reasons.push('The file header failed audio validation before decode.');
    return 'invalid';
  }

  if (state === 'silence') {
    reasons.push(
      'A silent source is not trustworthy enough to classify as speech or music.'
    );
    return 'unknown';
  }

  if (state === 'multichannel') {
    reasons.push(
      'A six-channel program is treated as music until a downmix policy is chosen.'
    );
    return 'music';
  }

  if (
    metrics.channelCount === 1 &&
    metrics.sampleRate <= 24000 &&
    metrics.stereoCorrelation === null
  ) {
    reasons.push('Mono, lower-rate material strongly suggests spoken-word content.');
    return 'speech';
  }

  if (
    metrics.channelCount >= 2 &&
    metrics.sampleRate >= 32000 &&
    speechScore <= musicScore + 0.12
  ) {
    reasons.push(
      'Stereo, higher-rate material is treated as music unless speech traits dominate.'
    );
    return 'music';
  }

  if (
    Math.abs(speechScore - musicScore) < 0.08 &&
    Math.max(speechScore, musicScore) > 0.58
  ) {
    reasons.push('The source shows both speech-like and music-like traits.');
    return 'mixed';
  }

  if (Math.abs(speechScore - musicScore) < 0.12) {
    reasons.push(
      'The source is ambiguous, so the app falls back to channel layout and sample rate.'
    );
    return metrics.channelCount === 1 ? 'speech' : 'music';
  }

  if (speechScore > musicScore) {
    reasons.push('The source is mostly mono, low-sample-rate, or speech-shaped.');
    return 'speech';
  }

  reasons.push('The source shows stereo, low-end, and music-like energy patterns.');
  return 'music';
}

function decideState(
  metrics: AudioMetrics,
  preflight: PreflightReport,
  anomalies: AnalysisAnomaly[],
  reasons: string[]
): SourceState {
  if (
    metrics.silenceRatio > 0.985 ||
    metrics.integratedLufs === Number.NEGATIVE_INFINITY
  ) {
    anomalies.push({
      id: 'silence',
      title: 'The source is effectively silent.',
      severity: 'blocker',
      what: 'The file contains almost no usable program material.',
      why: 'The measured silence ratio is too high for a meaningful mastering pass.',
      nextStep: 'Choose the correct export or confirm that the source is not muted.'
    });
    reasons.push('The analyzer saw almost no meaningful signal.');
    return 'silence';
  }

  if (metrics.channelCount > 2) {
    anomalies.push({
      id: 'multichannel',
      title: 'This source has more than two channels.',
      severity: 'blocker',
      what: 'The current mastering chain is intentionally stereo-focused.',
      why: 'Stereo width and playback preview would be misleading on a surround source.',
      nextStep: 'Downmix to stereo first or export a stereo stem for mastering.'
    });
    reasons.push('The source is multichannel and needs an explicit downmix policy.');
    return 'multichannel';
  }

  if (
    metrics.clippedSampleRatio > 0.001 ||
    metrics.integratedLufs > -7.5 ||
    metrics.crestFactorDb < 2.2 ||
    metrics.peakDensity > 0.18
  ) {
    anomalies.push({
      id: 'clipping',
      title: 'This source is already very hot.',
      severity: 'warning',
      what: 'Peaks are already near or past a safe mastering ceiling.',
      why: 'The clipped-sample ratio or measured peak level suggests the source may already be mastered.',
      nextStep:
        'Use a gentler chain or go back to a less-limited source if you have one.'
    });
    reasons.push(
      'Peak behavior suggests the source may already be mastered or clipped.'
    );
    return 'hot-master';
  }

  if (isLikelyLongForm(metrics.durationSeconds)) {
    anomalies.push({
      id: 'long-form',
      title: 'This is a long-form source.',
      severity: 'info',
      what: 'The file duration is above the long-form threshold.',
      why: 'Long jobs are more memory- and CPU-intensive in the browser.',
      nextStep: 'The app will keep processing honest and let you cancel if needed.'
    });
    reasons.push('Duration crosses the long-form threshold.');
    return 'long-form';
  }

  if (Math.abs(metrics.dcOffset) > 0.02) {
    anomalies.push({
      id: 'dc-offset',
      title: 'A DC offset is present in the source.',
      severity: 'warning',
      what: 'The waveform is biased above or below true zero.',
      why: 'That can reduce headroom and skew peak behavior.',
      nextStep:
        'The mastering chain will correct part of this, but a clean re-export is even better.'
    });
    reasons.push('The waveform has a meaningful DC bias.');
  }

  if (metrics.stereoCorrelation !== null && metrics.stereoCorrelation < 0.75) {
    anomalies.push({
      id: 'wide-stereo',
      title: 'The stereo image is extremely wide.',
      severity: 'warning',
      what: 'Stereo correlation is very low.',
      why: 'That can fold down poorly and can make extra widening unsafe.',
      nextStep: 'The app will recommend a more conservative width setting.'
    });
    reasons.push('Stereo correlation is low enough that extra widening is risky.');
    return 'wide';
  }

  if (
    metrics.channelCount >= 2 &&
    metrics.crestFactorDb > 7.5 &&
    metrics.integratedLufs < -12.5 &&
    anomalies.length === 0
  ) {
    reasons.push('Dynamic headroom suggests the source should be treated gently.');
    return 'dynamic';
  }

  if (metrics.lowEnd > 0.8) {
    anomalies.push({
      id: 'low-end-rumble',
      title: 'The source carries heavy low-end energy.',
      severity: 'warning',
      what: 'Sub-bass or rumble energy is unusually strong for a clean master.',
      why: 'That often happens with handling noise, HVAC rumble, or overly heavy low end.',
      nextStep:
        'Expect the chain to high-pass more aggressively or trim the source first.'
    });
    reasons.push('Low-end energy is unusually dominant.');
  }

  if (anomalies.length > 0) {
    return 'anomalous';
  }

  return 'raw';
}

function recommendPreset(
  classification: SourceClassification,
  state: SourceState,
  metrics: AudioMetrics,
  reasons: string[]
): MasteringPreset {
  if (classification === 'speech') {
    reasons.push('Speech-like content maps best to the podcast profile.');
    return 'podcast';
  }

  if (state === 'hot-master' || state === 'dynamic') {
    reasons.push('A gentler warm profile is safer for hot or dynamic material.');
    return 'warm';
  }

  if (state === 'wide' && metrics.integratedLufs > -12.5) {
    reasons.push(
      'A loud profile suits already-dense material, but width will be restrained.'
    );
    return 'loud';
  }

  reasons.push('Streaming is the default profile for unflagged music sources.');
  return 'streaming';
}

function buildRecommendedOptions(
  recommendedPreset: MasteringPreset,
  state: SourceState,
  metrics: AudioMetrics,
  learnedDefault?: MasteringOptions
): MasteringOptions {
  if (learnedDefault) {
    return { ...learnedDefault };
  }

  const base = { ...presetOptions[recommendedPreset] };

  if (state === 'hot-master') {
    base.intensity = 0.26;
    base.targetLufs = Math.min(base.targetLufs, -12);
    base.stereoWidth = Math.min(base.stereoWidth, 1.02);
  }

  if (state === 'dynamic') {
    base.intensity = 0.22;
    base.targetLufs = Math.min(base.targetLufs, -15);
    base.warmth = Math.max(base.warmth, 0.55);
  }

  if (state === 'wide') {
    base.stereoWidth = Math.min(base.stereoWidth, 1);
  }

  if (metrics.lowEnd > 0.22) {
    base.warmth = Math.max(0, base.warmth - 0.18);
  }

  if (metrics.brightness < 0.055) {
    base.warmth = Math.min(1, base.warmth + 0.12);
  }

  if (metrics.integratedLufs > -11.5) {
    base.targetLufs = Math.min(base.targetLufs, -13);
    base.intensity = Math.min(base.intensity, 0.38);
  }

  return base;
}

function buildConfidence(score: number, reasons: string[]): InferenceConfidence {
  const safeScore = clamp(score, 0, 1);

  return {
    score: safeScore,
    label: safeScore >= 0.78 ? 'high' : safeScore >= 0.56 ? 'medium' : 'low',
    reasons
  };
}

function inferConfidenceFloor(
  score: number,
  metrics: AudioMetrics,
  state: SourceState
): number {
  if (state === 'silence') {
    return 0.74;
  }

  if (state === 'multichannel') {
    return 0.78;
  }

  if (metrics.channelCount === 1 && metrics.sampleRate <= 24000) {
    return Math.max(score, 0.72);
  }

  if (metrics.channelCount === 1) {
    return Math.max(score, 0.64);
  }

  if (metrics.channelCount >= 2 && metrics.sampleRate >= 32000) {
    return Math.max(score, 0.68);
  }

  return score;
}
