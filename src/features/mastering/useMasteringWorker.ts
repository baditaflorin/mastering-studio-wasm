import { proxy, transfer, wrap } from 'comlink';
import type {
  AudioPayload,
  MasteringOptions,
  MasteringProgress,
  MasteringResult
} from '../../lib/audio/types';
import type { MasteringWorkerApi } from '../../workers/protocol';

export async function runMasteringWorker(
  payload: AudioPayload,
  options: MasteringOptions,
  onProgress: (progress: MasteringProgress) => void
): Promise<MasteringResult> {
  const worker = new Worker(
    new URL('../../workers/mastering.worker.ts', import.meta.url),
    {
      type: 'module'
    }
  );
  const api = wrap<MasteringWorkerApi>(worker);
  const transferables = payload.channels.map((channel) => channel.buffer);

  try {
    return await api.masterTrack(
      transfer(payload, transferables) as AudioPayload,
      options,
      proxy(onProgress)
    );
  } finally {
    worker.terminate();
  }
}
