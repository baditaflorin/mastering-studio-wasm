import type {
  AudioPayload,
  MasteringOptions,
  MasteringProgress,
  MasteringResult
} from '../lib/audio/types';

export interface MasteringWorkerApi {
  masterTrack(
    input: AudioPayload,
    options: MasteringOptions,
    onProgress?: (progress: MasteringProgress) => void
  ): Promise<MasteringResult>;
}
