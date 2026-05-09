import type {
  AudioPayload,
  MasteringExecutionContext,
  MasteringOptions,
  MasteringProgress,
  MasteringResult
} from '../lib/audio/types';

export interface MasteringWorkerApi {
  masterTrack(
    input: AudioPayload,
    options: MasteringOptions,
    context: MasteringExecutionContext,
    onProgress?: (progress: MasteringProgress) => void
  ): Promise<MasteringResult>;
}
