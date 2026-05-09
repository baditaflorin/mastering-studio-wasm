export type MasteringPreset = 'streaming' | 'loud' | 'podcast' | 'warm';

export type SourceClassification = 'music' | 'speech' | 'mixed' | 'unknown' | 'invalid';

export type SourceState =
  | 'raw'
  | 'hot-master'
  | 'dynamic'
  | 'wide'
  | 'silence'
  | 'multichannel'
  | 'long-form'
  | 'anomalous'
  | 'invalid';

export type ConfidenceLabel = 'high' | 'medium' | 'low';

export type ActivityStage =
  | 'import'
  | 'preflight'
  | 'analysis'
  | 'auto-master'
  | 'manual-master'
  | 'cancel'
  | 'export'
  | 'warning'
  | 'error';

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
  midrange: number;
  dcOffset: number;
  zeroCrossingRate: number;
  silenceRatio: number;
  clippedSampleRatio: number;
  peakDensity: number;
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
  stage:
    | 'preflight'
    | 'analysis'
    | 'tone'
    | 'dynamics'
    | 'loudness'
    | 'limiter'
    | 'complete'
    | 'cancelled';
  message: string;
  value: number;
}

export interface InferenceConfidence {
  score: number;
  label: ConfidenceLabel;
  reasons: string[];
}

export interface AnalysisAnomaly {
  id:
    | 'clipping'
    | 'silence'
    | 'multichannel'
    | 'dc-offset'
    | 'low-end-rumble'
    | 'wide-stereo'
    | 'long-form'
    | 'invalid-audio'
    | 'decode-risk';
  title: string;
  severity: 'info' | 'warning' | 'blocker';
  what: string;
  why: string;
  nextStep: string;
}

export interface PreflightReport {
  fileName: string;
  extension: string;
  detectedFormat: 'wav' | 'mp3' | 'm4a' | 'flac' | 'aac' | 'unknown';
  sizeBytes: number;
  estimatedDecodeMemoryBytes: number;
  canAttemptDecode: boolean;
  blockingError: AnalysisAnomaly | null;
  warnings: AnalysisAnomaly[];
  sourceId: string;
}

export interface SourceProfile {
  classification: SourceClassification;
  state: SourceState;
  classificationConfidence: InferenceConfidence;
  presetConfidence: InferenceConfidence;
  recommendedPreset: MasteringPreset;
  recommendedOptions: MasteringOptions;
  reasons: string[];
  anomalies: AnalysisAnomaly[];
  shouldAllowMastering: boolean;
  shouldAutoMaster: boolean;
  shouldBlockMastering: boolean;
  learningApplied: boolean;
}

export interface MasteringProvenance {
  sourceId: string;
  appVersion: string;
  commit: string;
  schemaVersion: string;
  inputFingerprint: string;
  optionsFingerprint: string;
  exportedFormat: 'wav' | 'mp3';
  profile: Pick<SourceProfile, 'classification' | 'state' | 'recommendedPreset'>;
  confidence: {
    classification: number;
    preset: number;
  };
  parameters: MasteringOptions;
  warnings: string[];
}

export interface MasteringExecutionContext {
  sourceId: string;
  inputFingerprint: string;
  sourceProfile: SourceProfile;
  appVersion: string;
  commit: string;
}

export interface MasteringResult {
  mastered: AudioPayload;
  before: AudioMetrics;
  after: AudioMetrics;
  chain: MasteringChain;
  warnings: string[];
  profile: SourceProfile;
  provenance: Omit<MasteringProvenance, 'exportedFormat'>;
}

export interface StoredSessionSummary {
  fileName: string;
  sourceId: string;
  updatedAt: string;
  preset: MasteringPreset;
  targetLufs: number;
  before: AudioMetrics;
  after: AudioMetrics;
  classification: SourceClassification;
}

export interface ActivityLogEntry {
  id: string;
  stage: ActivityStage;
  title: string;
  detail: string;
  at: string;
}

export interface FixtureExpectation {
  expectedClassification: SourceClassification;
  expectedState: SourceState;
  recommendedPreset: MasteringPreset;
  minConfidence: number;
  shouldAllowMastering: boolean;
  mustIncludeAnomalies?: AnalysisAnomaly['id'][];
}
