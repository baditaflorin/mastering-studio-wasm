export type MasteringPreset = 'streaming' | 'loud' | 'podcast' | 'warm';

export interface AudioPayload {
  name: string;
  sampleRate: number;
  channels: Float32Array[];
}

export interface AudioMetrics {
  durationSeconds: number;
  sampleRate: number;
  channelCount: number;
  integratedLufs: number;
  peakDb: number;
  rmsDb: number;
  crestFactorDb: number;
  stereoCorrelation: number | null;
  brightness: number;
  lowEnd: number;
  dcOffset: number;
}

export interface MasteringOptions {
  preset: MasteringPreset;
  targetLufs: number;
  ceilingDb: number;
  intensity: number;
  warmth: number;
  stereoWidth: number;
}

export interface MasteringChain {
  highPassHz: number;
  lowShelfDb: number;
  highShelfDb: number;
  compressorThresholdDb: number;
  compressorRatio: number;
  makeupGainDb: number;
  loudnessGainDb: number;
  limiterCeilingDb: number;
}

export interface MasteringProgress {
  stage: 'analysis' | 'tone' | 'dynamics' | 'loudness' | 'limiter' | 'complete';
  message: string;
  value: number;
}

export interface MasteringResult {
  mastered: AudioPayload;
  before: AudioMetrics;
  after: AudioMetrics;
  chain: MasteringChain;
  warnings: string[];
}

export interface StoredSessionSummary {
  fileName: string;
  updatedAt: string;
  preset: MasteringPreset;
  targetLufs: number;
  before: AudioMetrics;
  after: AudioMetrics;
}
