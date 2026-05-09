import { proxy, transfer, wrap } from 'comlink';
import type {
  AudioPayload,
  MasteringExecutionContext,
  MasteringOptions,
  MasteringProgress,
  MasteringResult
} from '../../lib/audio/types';
import type { MasteringWorkerApi } from '../../workers/protocol';

export interface MasteringJob {
  promise: Promise<MasteringResult>;
  cancel: () => void;
}

export function createMasteringJob(
  payload: AudioPayload,
  options: MasteringOptions,
  context: MasteringExecutionContext,
  onProgress: (progress: MasteringProgress) => void
): MasteringJob {
  const worker = new Worker(
    new URL('../../workers/mastering.worker.ts', import.meta.url),
    {
      type: 'module'
    }
  );
  const api = wrap<MasteringWorkerApi>(worker);
  const transferables = payload.channels.map((channel) => channel.buffer);

  const promise = api
    .masterTrack(
      transfer(payload, transferables) as AudioPayload,
      options,
      context,
      proxy(onProgress)
    )
    .finally(() => {
      worker.terminate();
    });

  return {
    promise,
    cancel() {
      worker.terminate();
    }
  };
}
