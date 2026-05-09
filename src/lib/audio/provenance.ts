import { hashString } from './fingerprint';
import type {
  MasteringExecutionContext,
  MasteringOptions,
  MasteringProvenance,
  SourceProfile
} from './types';

const SCHEMA_VERSION = 'phase2.v1';

export function buildBaseProvenance(
  options: MasteringOptions,
  profile: SourceProfile,
  context: MasteringExecutionContext,
  warnings: string[]
): Omit<MasteringProvenance, 'exportedFormat'> {
  return {
    sourceId: context.sourceId,
    appVersion: context.appVersion,
    commit: context.commit,
    schemaVersion: SCHEMA_VERSION,
    inputFingerprint: context.inputFingerprint,
    optionsFingerprint: hashString(JSON.stringify(options)),
    profile: {
      classification: profile.classification,
      state: profile.state,
      recommendedPreset: profile.recommendedPreset
    },
    confidence: {
      classification: Number(profile.classificationConfidence.score.toFixed(4)),
      preset: Number(profile.presetConfidence.score.toFixed(4))
    },
    parameters: options,
    warnings
  };
}

export function serializeProvenanceComment(
  provenance: MasteringProvenance | Omit<MasteringProvenance, 'exportedFormat'>
): string {
  return JSON.stringify(provenance);
}
