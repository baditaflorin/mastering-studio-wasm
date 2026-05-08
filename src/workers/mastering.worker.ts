import { expose, transfer } from 'comlink';
import { masterAudio } from '../lib/audio/dsp';
import type { MasteringWorkerApi } from './protocol';

const api: MasteringWorkerApi = {
  async masterTrack(input, options, onProgress) {
    const result = masterAudio(input, options, (stage, message, value) => {
      onProgress?.({
        stage: stage as never,
        message,
        value
      });
    });

    return transfer(
      result,
      result.mastered.channels.map((channel) => channel.buffer)
    );
  }
};

expose(api);
